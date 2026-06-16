import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Edit, Trash2, Search, Eye, CheckCircle, XCircle, Download, X, Calendar, Filter, AlertCircle, AlertTriangle, Package, Truck, Bike, PhoneCall, RefreshCw, ShoppingBag, Globe, ChevronLeft, ChevronRight, Copy, MapPin, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatAddressForAdmin = (address) => {
    if (!address) return '';
    return address.split(',').map(part => part.split('|').pop().trim()).join(', ');
};

const OrderManager = () => {
    const { token, user } = useAuth();
    const isModerator = user?.profile?.role === 'moderator';
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const initialView = queryParams.get('view') || 'real';
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderType, setOrderType] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeDateFilter, setActiveDateFilter] = useState('Max');
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [activeView, setActiveView] = useState(initialView); 
    const [incompleteOrders, setIncompleteOrders] = useState([]);
    const [loadingIncomplete, setLoadingIncomplete] = useState(false);
    const [conversionStats, setConversionStats] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Status Modal
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    // View Modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);
    const [isConverting, setIsConverting] = useState(null);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editForm, setEditForm] = useState({ customer_name: '', address: '', total_amount: '', shipping_cost: '', items: [] } as any);
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    const [activeProductHistory, setActiveProductHistory] = useState(null);
    const [trackingStatus, setTrackingStatus] = useState(null);
    const [isFetchingTracking, setIsFetchingTracking] = useState(false);
    const [copiedNumber, setCopiedNumber] = useState(false);

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsEditingDetails(false);
        setShowViewModal(true);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get(`orders/`);
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncompleteOrders = async () => {
        setLoadingIncomplete(true);
        try {
            const response = await api.get(`incomplete-orders/`);
            setIncompleteOrders(response.data);
        } catch (error) {
            console.error("Error fetching incomplete orders:", error);
        } finally {
            setLoadingIncomplete(false);
        }
    };

    const fetchConversionStats = async () => {
        try {
            const response = await api.get('admin/stats/');
            setConversionStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
            fetchIncompleteOrders();
            fetchConversionStats();
        }
    }, [token]);

    useEffect(() => {
        const view = new URLSearchParams(location.search).get('view');
        if (view && (view === 'real' || view === 'incomplete')) {
            setActiveView(view);
        }
    }, [location.search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, orderType, activeDateFilter, dateRange, activeView]);

    const handleDelete = async (id) => {
        if (isModerator) {
            alert("Moderators do not have permission to delete orders.");
            return;
        }
        try {
            const endpoint = activeView === 'real' ? `orders/${id}/` : `incomplete-orders/${id}/`;
            await api.delete(endpoint);
            if (activeView === 'real') {
                setOrders(prev => prev.filter(o => o.id !== id));
            } else {
                setIncompleteOrders(prev => prev.filter(o => o.id !== id));
            }
        } catch (error) {
            alert("Failed to delete order");
        }
    };

    const handleBulkDelete = async () => {
        if (isModerator) {
            alert("Moderators do not have permission to delete orders.");
            return;
        }
        if (selectedOrders.length === 0) return;

        try {
            if (activeView === 'real') {
                await api.post('orders/bulk_delete/', { ids: selectedOrders });
                setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
            } else {
                // Assuming incomplete-orders also has a bulk delete or we delete one by one
                // For now let's assume it doesn't and we do it one by one if it's drafts
                // or I should add it to the backend too.
                // But usually drafts don't have bulk delete yet.
                // Let's just do real orders for now or promise to add drafts later.
                for (const id of selectedOrders) {
                    await api.delete(`incomplete-orders/${id}/`);
                }
                setIncompleteOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)));
            }
            setSelectedOrders([]);
        } catch (error) {
            alert("Failed to delete selected items");
        }
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setShowStatusModal(true);
    };

    const handleUpdateStatus = async () => {
        try {
            await api.patch(`orders/${selectedOrder.id}/`,
                { status: newStatus }
            );

            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
            setShowStatusModal(false);
        } catch (error: any) {
            console.error("Status update failed:", error.response?.data || error);
            alert("Failed to update status");
        }
    };

    const fetchTrackingStatus = async (orderId) => {
        setIsFetchingTracking(true);
        try {
            const response = await api.get(`courier/${orderId}/check_status/`);
            setTrackingStatus(response.data);
            if (response.data.delivery_status && response.data.delivery_status.toLowerCase() === 'unknown') {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
                try {
                    const orderRes = await api.get(`orders/${orderId}/`);
                    setSelectedOrder(orderRes.data);
                } catch (err) {
                    setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch tracking status:", error);
            setTrackingStatus({ error: "Tracking data unavailable" });
        } finally {
            setIsFetchingTracking(false);
        }
    };

    useEffect(() => {
        if (showViewModal && selectedOrder?.courier_tracking_code && activeView === 'real') {
            fetchTrackingStatus(selectedOrder.id);
        } else {
            setTrackingStatus(null);
        }
    }, [showViewModal, selectedOrder?.id, activeView]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setIsSubmittingNote(true);
        try {
            const response = await api.post(`orders/${selectedOrder.id}/add_note/`,
                { note: noteText }
            );

            const updatedOrder = {
                ...selectedOrder,
                notes: [response.data, ...(selectedOrder.notes || [])]
            };
            setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
            setNoteText('');
        } catch (error) {
            alert("Failed to add note");
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const handleEditDetailsClick = () => {
        const shippingCost = selectedOrder.shipping_cost || 0;
        setEditForm({
            customer_name: selectedOrder.customer_name || '',
            address: selectedOrder.address || '',
            total_amount: selectedOrder.total_amount || 0,
            shipping_cost: shippingCost,
            items: selectedOrder.items?.map(item => ({
                id: item.id,
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                color: item.color,
                size: item.size,
                name: item.product_details?.name || item.product_name || 'Unknown',
                image: item.product_details?.thumbnail || item.product_image || null,
                color_name: item.color_details?.name || item.color_name || 'N/A',
                size_name: item.size_details?.name || item.size_name || 'N/A'
            })) || []
        });
        setIsEditingDetails(true);
    };

    const handleItemChange = (itemId, field, value) => {
        const newItems = editForm.items.map(item => {
            if (item.id === itemId) return { ...item, [field]: value };
            return item;
        });
        const subValue = newItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const shipping = Number(editForm.shipping_cost) || 0;
        setEditForm({ ...editForm, items: newItems, total_amount: Math.max(0, subValue + shipping) });
    };

    const handleShippingChange = (value) => {
        const shipping = Number(value) || 0;
        const subValue = editForm.items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0;
        setEditForm({ ...editForm, shipping_cost: value, total_amount: subValue + shipping });
    };

    const handleSaveDetails = async () => {
        setIsSavingDetails(true);
        try {
            const itemsToSave = editForm.items?.filter(item => Number(item.quantity) > 0) || [];
            const response = await api.patch(`orders/${selectedOrder.id}/`,
                {
                    customer_name: editForm.customer_name, address: editForm.address,
                    total_amount: editForm.total_amount, shipping_cost: editForm.shipping_cost,
                    items: itemsToSave
                }
            );
            const updatedOrder = { ...selectedOrder, ...response.data };
            setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
            setIsEditingDetails(false);
        } catch (error) {
            alert("Failed to update order details");
        } finally {
            setIsSavingDetails(false);
        }
    };

    const handleSendToSteadfast = async (order = null) => {
        if (isModerator) return;
        const targetOrder = order || selectedOrder;
        if (!targetOrder) return;
        setIsDispatching(true);
        try {
            const response = await api.post(`orders/${targetOrder.id}/send_to_steadfast/`, {});
            console.log(response.data.message);
            const updatedOrder = { 
                ...targetOrder, 
                courier_name: 'steadfast',
                courier_tracking_code: response.data.tracking_code, 
                courier_consignment_id: response.data.consignment_id, 
                status: 'processing' 
            };
            if (selectedOrder && selectedOrder.id === targetOrder.id) setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === targetOrder.id ? updatedOrder : o));
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to dispatch to Steadfast");
        } finally {
            setIsDispatching(false);
        }
    };

    const handleSendToCarrybee = async (order = null) => {
        if (isModerator) return;
        const targetOrder = order || selectedOrder;
        if (!targetOrder) return;
        setIsDispatching(true);
        try {
            const response = await api.post(`orders/${targetOrder.id}/send_to_carrybee/`, {});
            console.log(response.data.message);
            const updatedOrder = { 
                ...targetOrder, 
                courier_name: 'carrybee',
                courier_tracking_code: response.data.tracking_code, 
                courier_consignment_id: response.data.consignment_id, 
                status: 'processing' 
            };
            if (selectedOrder && selectedOrder.id === targetOrder.id) setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === targetOrder.id ? updatedOrder : o));
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to dispatch to Carrybee");
        } finally {
            setIsDispatching(false);
        }
    };

    const handleSendToPathao = async (order = null) => {
        const targetOrder = order || selectedOrder;
        if (!targetOrder) return;
        setIsDispatching(true);
        try {
            const response = await api.post(`orders/${targetOrder.id}/send_to_pathao/`, {});
            console.log(response.data.message);
            const updatedOrder = { ...targetOrder, courier_tracking_code: response.data.tracking_code, status: 'processing' };
            if (selectedOrder && selectedOrder.id === targetOrder.id) setSelectedOrder(updatedOrder);
            setOrders(prev => prev.map(o => o.id === targetOrder.id ? updatedOrder : o));
        } catch (error: any) {
            console.error("Bulk action failed:", error.response?.data || error);
            alert("Failed to perform bulk action");
        } finally {
            setIsDispatching(false);
        }
    };

    const handleConfirmOrder = async (orderId) => {
        try {
            await api.patch(`orders/${orderId}/`, { status: 'processing' });
            await api.post(`orders/${orderId}/add_note/`, { note: "Order confirmed by staff." });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'processing' } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: 'processing' }));
            }
        } catch (error) {
            alert("Failed to confirm order");
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            await api.patch(`orders/${orderId}/`, { status: 'cancelled' });
            await api.post(`orders/${orderId}/add_note/`, { note: "Order cancelled by staff." });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
            }
        } catch (error) {
            alert("Failed to cancel order");
        }
    };

    const handleCallAndConfirm = async (phoneNumber, order = null) => {
        const targetOrder = order || selectedOrder;
        window.location.href = `tel:${phoneNumber}`;
        if (targetOrder.status === 'pending') {
            try {
                await api.patch(`orders/${targetOrder.id}/`, { status: 'processing' });
                await api.post(`orders/${targetOrder.id}/add_note/`, { note: "Called customer and confirmed the order." });
                fetchOrders();
            } catch (error) { console.error("Auto-confirm failed", error); }
        }
    };

    const handleCallOnly = (phoneNumber) => { window.location.href = `tel:${phoneNumber}`; };
    const handleCopyNumber = (phoneNumber) => {
        navigator.clipboard.writeText(phoneNumber).then(() => {
            setCopiedNumber(true);
            setTimeout(() => setCopiedNumber(false), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error("Could not copy number: ", err);
        });
    };

    const handleCopyOrderSummary = (order) => {
        let summaryText = `Order ID: #${order.id.toString().padStart(6, '0')}\n`;
        summaryText += `Customer: ${order.customer_name || 'Guest'}\n`;
        summaryText += `Phone: ${order.phone_number}\n`;
        
        if (order.courier_tracking_code) {
            summaryText += `Tracking Code: ${order.courier_tracking_code}\n`;
        }
        if (order.courier_consignment_id) {
            summaryText += `Consignment ID: ${order.courier_consignment_id}\n`;
        }
        
        summaryText += `\nItems:\n`;
        const items = order.items || order.cart_items || [];
        items.forEach(item => {
            const productName = item.product_details?.name || item.name || 'Unknown';
            const color = item.color_details?.name || item.color || 'N/A';
            const size = item.size_details?.name || item.size || 'N/A';
            summaryText += `- ${productName} (${color} / ${size}) x${item.quantity} = ৳${(item.price * item.quantity).toLocaleString()}\n`;
        });
        
        summaryText += `\nSubtotal: ৳${(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toLocaleString()}\n`;
        summaryText += `Shipping: ৳${(Number(order.shipping_cost) || 0).toLocaleString()}\n`;
        summaryText += `Total Amount: ৳${Number(order.total_amount).toLocaleString()}`;
        
        navigator.clipboard.writeText(summaryText).catch(err => {
            console.error("Could not copy text: ", err);
        });
    };

    const handleConvertToOrder = async (draftId) => {
        setIsConverting(draftId);
        try {
            const response = await api.post(`incomplete-orders/${draftId}/convert_to_order/`, {});
            
            console.log(response.data.message);
            await fetchOrders();
            await fetchIncompleteOrders();
            await fetchConversionStats();
            setActiveView('real');
            setSelectedOrders([]);
            setShowViewModal(false);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to convert draft to order.");
        } finally {
            setIsConverting(null);
        }
    };

    const handleCleanDuplicates = async () => {
        setLoadingIncomplete(true);
        try {
            const response = await api.post('incomplete-orders/clean_duplicates/', {});
            console.log(response.data.message || "Successfully cleaned up duplicate drafts!");
            await fetchIncompleteOrders();
        } catch (error: any) {
            console.error("Clean duplicates failed:", error);
            alert(error.response?.data?.error || "Failed to clean duplicate drafts.");
        } finally {
            setLoadingIncomplete(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (order.status === 'draft') return false;
        const matchesProduct = Array.isArray(order.items) && order.items.some(item => {
            const productName = item.product_details?.name || item.product_name || item.name || '';
            return productName.toLowerCase().includes(search.toLowerCase());
        });
        const matchesSearch =
            order.id.toString().includes(search) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase())) ||
            (order.phone_number && order.phone_number.includes(search)) ||
            matchesProduct;
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        let matchesDate = true;
        const orderDate = new Date(order.created_at);
        const today = new Date();
        if (activeDateFilter === '24h') {
            const oneDayAgo = new Date(today);
            oneDayAgo.setHours(today.getHours() - 24);
            matchesDate = orderDate >= oneDayAgo;
        } else if (activeDateFilter === '7d') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            matchesDate = orderDate >= sevenDaysAgo;
        } else if (activeDateFilter === '30d') {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            matchesDate = orderDate >= thirtyDaysAgo;
        } else if (activeDateFilter === 'Max') {
            matchesDate = true;
        } else if (activeDateFilter === 'Custom') {
            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && orderDate >= startDate;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && orderDate <= endDate;
            }
        }
        const matchesOrderType =
            orderType === 'all' ? true :
                orderType === 'standard' ? order.funnel === null :
                    orderType === 'funnel' ? order.funnel !== null : true;
        return matchesSearch && matchesStatus && matchesDate && matchesOrderType;
    });

    const filteredIncomplete = incompleteOrders.filter(order => {
        const items = order.items || order.cart_items;
        const matchesProduct = Array.isArray(items) && items.some(item => {
            const productName = item.product_details?.name || item.product_name || item.name || '';
            return productName.toLowerCase().includes(search.toLowerCase());
        });
        const matchesSearch =
            order.id.toString().includes(search) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase())) ||
            (order.phone_number && order.phone_number.includes(search)) ||
            matchesProduct;
        return matchesSearch;
    });

    // Pagination Logic
    const totalItems = activeView === 'real' ? filteredOrders.length : filteredIncomplete.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedOrders = (activeView === 'real' ? filteredOrders : filteredIncomplete).slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            if (currentPage <= 3) {
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }
            if (start > 2) {
                pages.push('...');
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        return pages;
    };

    const handleSelectAll = (e) => {
        const currentData = activeView === 'real' ? filteredOrders : filteredIncomplete;
        if (e.target.checked) setSelectedOrders(currentData.map(o => o.id));
        else setSelectedOrders([]);
    };

    const handleSelectOne = (id) => {
        if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
        else setSelectedOrders([...selectedOrders, id]);
    };

    const handleBulkExport = () => {
        if (selectedOrders.length === 0) return;
        const currentData = activeView === 'real' ? filteredOrders : filteredIncomplete;
        const ordersToExport = currentData.filter(o => selectedOrders.includes(o.id));
        let csvContent = "\uFEFF";
        if (activeView === 'real') {
            csvContent += "Order ID,Date,Time,Customer Name,Phone Number,Email,Address,Total Amount,Status,Payment Method\n";
            ordersToExport.forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                const time = new Date(order.created_at).toLocaleTimeString();
                const address = `"${formatAddressForAdmin(order.address).replace(/"/g, '""')}"`;
                csvContent += [`#${order.id}`, date, time, order.customer_name || 'Guest', order.phone_number, order.customer_email || 'N/A', address, order.total_amount, order.status, order.payment_method || 'COD'].join(",") + "\n";
            });
        } else {
            csvContent += "Entry ID,Date,Customer Name,Phone Number,Location,IP Address,Status,Total Amount\n";
            ordersToExport.forEach(order => {
                csvContent += [`#${order.id}`, new Date(order.created_at).toLocaleDateString(), order.customer_name || 'Guest', order.phone_number, order.location || 'Unknown', order.ip_address, order.is_converted ? 'Converted' : 'Abandoned', order.total_amount].join(",") + "\n";
            });
        }
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeView}_export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage transactions, fulfillment, and customer recovery.</p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                    <button
                        onClick={() => { setActiveView('real'); setSelectedOrders([]); }}
                        className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${activeView === 'real' 
                            ? 'bg-brand text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                        Real Orders
                    </button>
                    <button
                        onClick={() => { setActiveView('incomplete'); setSelectedOrders([]); }}
                        className={`px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${activeView === 'incomplete' 
                            ? 'bg-brand text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                        Drafts <span className="ml-0.5 md:ml-1 opacity-50">({incompleteOrders.length})</span>
                    </button>
                </div>
            </div>

            {/* Main Stats Panel */}
            {conversionStats && activeView === 'real' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    <div className="lg:col-span-3 next-panel p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Conversion Performance</h4>
                                <p className="text-sm font-bold text-zinc-900 mt-1">Daily Order vs Abandonment Ratio</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-zinc-900 font-mono">{conversionStats.conversion_rate}%</span>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Avg Rate</p>
                            </div>
                        </div>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={conversionStats.graph_data}>
                                    <XAxis dataKey="name" hide />
                                    <Tooltip 
                                        cursor={{fill: '#f4f4f5'}} 
                                        contentStyle={{borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px'}} 
                                    />
                                    <Bar dataKey="abandoned" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={14} />
                                    <Bar dataKey="orders" stackId="a" fill="#5173FB" radius={[2, 2, 0, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-brand rounded-xl p-6 text-white flex flex-col justify-between shadow-lg shadow-zinc-900/10">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Pending Recovery</p>
                            <h4 className="text-3xl font-bold tracking-tight mt-2 font-mono">{incompleteOrders.length}</h4>
                            <p className="text-xs font-medium opacity-80 mt-2 leading-relaxed">Abandoned carts detected. Start follow-up protocol.</p>
                        </div>
                        <button 
                            onClick={() => setActiveView('incomplete')}
                            className="w-full bg-white text-zinc-900 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 transition-all mt-4 active:scale-95"
                        >
                            View Drafts
                        </button>
                    </div>
                </div>
            )}

            {/* Filter & Table Container */}
            <div className="next-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search hash, customer, phone, product..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {activeView === 'real' && (
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-1 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar">
                                    {['24h', '7d', '30d', 'Max'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => {
                                                setActiveDateFilter(range);
                                                setShowCustomDate(false);
                                            }}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                                                activeDateFilter === range ? 'bg-brand text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setShowCustomDate(!showCustomDate)}
                                        className={`p-1.5 transition-colors ml-1 ${showCustomDate ? 'text-zinc-900 bg-white rounded-md shadow-sm' : 'text-zinc-400 hover:text-zinc-900'}`}
                                    >
                                        <Calendar size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select 
                                        className="bg-white border border-zinc-200 rounded-lg px-2 md:px-3 py-2 text-[10px] md:text-xs font-semibold text-zinc-600 outline-none flex-1 sm:w-auto"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <select 
                                        className="bg-white border border-zinc-200 rounded-lg px-2 md:px-3 py-2 text-[10px] md:text-xs font-semibold text-zinc-600 outline-none flex-1 sm:w-auto"
                                        value={orderType}
                                        onChange={(e) => setOrderType(e.target.value)}
                                    >
                                        <option value="all">Types</option>
                                        <option value="standard">Standard</option>
                                        <option value="funnel">Funnels</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {showCustomDate && (
                        <div className="flex flex-wrap items-center gap-2 p-4 bg-zinc-50 border-t border-zinc-100 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Start</span>
                                <input 
                                    type="date" 
                                    className="text-xs font-semibold text-zinc-900 bg-transparent border-none focus:ring-0 outline-none w-28"
                                    value={dateRange.start}
                                    onChange={(e) => {
                                        setDateRange({...dateRange, start: e.target.value});
                                        setActiveDateFilter('Custom');
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">End</span>
                                <input 
                                    type="date" 
                                    className="text-xs font-semibold text-zinc-900 bg-transparent border-none focus:ring-0 outline-none w-28"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange({...dateRange, end: e.target.value});
                                        setActiveDateFilter('Custom');
                                    }}
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    setDateRange({ start: '', end: '' });
                                    setActiveDateFilter('MAX');
                                    setShowCustomDate(false);
                                }}
                                className="text-[10px] font-bold text-zinc-400 uppercase hover:text-zinc-900 transition-colors px-2"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {!isModerator && selectedOrders.length > 0 && (
                            <button 
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2 animate-in zoom-in duration-200"
                            >
                                <Trash2 size={14} /> Delete ({selectedOrders.length})
                            </button>
                        )}
                        {activeView === 'incomplete' && (
                            <button 
                                onClick={handleCleanDuplicates}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                title="Clean Duplicate Drafts (keeps the latest one for each phone number)"
                            >
                                <AlertTriangle size={14} /> Clean Duplicates
                            </button>
                        )}
                        <button onClick={handleBulkExport} disabled={selectedOrders.length === 0} className="px-4 py-2 bg-brand text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-30 transition-all">
                            <Download size={14} className="inline mr-2" /> Export
                        </button>
                        <button onClick={activeView === 'real' ? fetchOrders : fetchIncompleteOrders} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                            <RefreshCw size={14} className={(loading || loadingIncomplete) ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-300 text-zinc-900"
                                        checked={activeView === 'real' ? (selectedOrders.length === filteredOrders.length && filteredOrders.length > 0) : (selectedOrders.length === filteredIncomplete.length && filteredIncomplete.length > 0)}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">{activeView === 'real' ? 'Status' : 'Location / IP'}</th>
                                <th className="px-6 py-4 text-center">Amount</th>
                                {activeView === 'real' && <th className="px-6 py-4">Courier ID</th>}
                                <th className="px-6 py-4 text-center">Notes</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedOrders.map(order => (
                                <tr key={order.id} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-zinc-300 text-zinc-900"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleSelectOne(order.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleViewOrder(order)} className="text-xs font-bold text-zinc-900 font-mono hover:underline">
                                            #{order.id.toString().padStart(6, '0')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-zinc-900">{order.customer_name || 'Guest'}</p>
                                                {order.is_duplicate && (
                                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-black uppercase tracking-tighter">
                                                        <AlertTriangle size={8} /> DUPLICATE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium text-zinc-400 font-mono">{order.phone_number}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {activeView === 'real' ? (
                                            <div className="flex flex-col gap-1 items-start">
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                                    <div className={`w-1 h-1 rounded-full ${
                                                        order.status === 'delivered' ? 'bg-emerald-500' : 
                                                        order.status === 'partial_delivered' ? 'bg-amber-500' : 
                                                        order.status === 'cancelled' ? 'bg-rose-500' : 
                                                        'bg-zinc-500'
                                                    }`} />
                                                    {order.status}
                                                </div>
                                                {(() => {
                                                    const confirmNote = order.notes?.find(n => 
                                                        n.note && n.note.toLowerCase().includes('confirmed')
                                                    );
                                                    if (confirmNote) {
                                                        return (
                                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter" title={`Confirmed by ${confirmNote.user}`}>
                                                                By: {confirmNote.username}
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="space-y-0.5 max-w-[180px]">
                                                <p className="text-[10px] font-bold text-zinc-600 truncate">{order.location || 'Unknown Coordinates'}</p>
                                                <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">{order.ip_address}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-zinc-900 font-mono text-xs">
                                        ৳{Number(order.total_amount).toLocaleString()}
                                    </td>
                                    {activeView === 'real' && (
                                        <td className="px-6 py-4">
                                            {order.courier_tracking_code ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-zinc-900 font-mono">{order.courier_tracking_code}</p>
                                                    <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">{order.courier_consignment_id}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Unsynced</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs font-bold ${order.notes?.length > 0 ? 'text-brand' : 'text-zinc-300'}`}>
                                            {order.notes?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 transition-all">
                                            <button onClick={() => handleViewOrder(order)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                <Eye size={14} />
                                            </button>
                                            {activeView === 'real' ? (
                                                <>
                                                    {!order.courier_consignment_id && !isModerator && (
                                                        <>
                                                            <button onClick={() => handleSendToSteadfast(order)} disabled={isDispatching} className="p-2 text-zinc-400 bg-green-600/30 hover:text-brand hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all" title="Sync with Steadfast">
                                                                <Truck size={14} />
                                                            </button>
                                                            <button onClick={() => handleSendToCarrybee(order)} disabled={isDispatching} className="p-2 text-zinc-400 bg-yellow-400/30 hover:text-purple-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all" title="Sync with Carrybee">
                                                                <Truck size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleConvertToOrder(order.id)} 
                                                    disabled={isConverting === order.id}
                                                    className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                >
                                                    {isConverting === order.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                </button>
                                            )}
                                            {!isModerator && (
                                                <button onClick={() => handleDelete(order.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Total {activeView === 'real' ? 'Orders' : 'Drafts'}: {totalItems}</span>
                    
                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 disabled:opacity-30 transition-all text-zinc-600"
                                title="Previous Page"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            
                            <div className="flex items-center gap-1.5">
                                {getPageNumbers().map((page, idx) => (
                                    page === '...' ? (
                                        <span key={idx} className="px-2 text-xs text-zinc-400">...</span>
                                    ) : (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(Number(page))}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                currentPage === page 
                                                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/10' 
                                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 disabled:opacity-30 transition-all text-zinc-600"
                                title="Next Page"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Order Modal */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowViewModal(false)}></div>
                    <div className="w-full md:max-w-2xl bg-white h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-zinc-200">
                        {/* Header */}
                        <div className="p-4 sm:p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center">
                            <div className="flex items-start gap-4">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight">Order Details</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs md:sm text-zinc-500 font-medium font-mono">#{selectedOrder.id.toString().padStart(6, '0')}</p>
                                        {selectedOrder.is_duplicate && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                <AlertTriangle size={10} /> Duplicate Detected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Order Placed</p>
                                    <p className="text-[11px] font-bold text-zinc-800 mt-0.5 font-mono">
                                        {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                    </p>
                                </div>
                                <button onClick={() => setShowViewModal(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 md:space-y-10 custom-scrollbar">
                            {/* Status Section */}
                            <div className="flex flex-col sm:flex-row justify-between gap-6 bg-zinc-50 p-4 sm:p-6 rounded-2xl border border-zinc-100">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current Status</p>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(selectedOrder.status)}`}>{selectedOrder.status}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedOrder.status === 'draft' ? (
                                        <button 
                                            onClick={() => handleConvertToOrder(selectedOrder.id)} 
                                            disabled={isConverting === selectedOrder.id}
                                            className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg bg-brand text-white hover:bg-zinc-800 shadow-zinc-900/10 disabled:opacity-50"
                                        >
                                            {isConverting === selectedOrder.id ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={14} />
                                            )}
                                            Convert to Real Order
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleConfirmOrder(selectedOrder.id)} 
                                                disabled={selectedOrder.status !== 'pending'}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${selectedOrder.status === 'pending' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'}`}
                                            >
                                                <CheckCircle size={14} /> {selectedOrder.status === 'pending' ? 'Confirm Order' : 'Confirmed'}
                                            </button>
                                            <button 
                                                onClick={() => handleCancelOrder(selectedOrder.id)} 
                                                disabled={selectedOrder.status === 'cancelled' || selectedOrder.status === 'delivered'}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/10' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'}`}
                                            >
                                                <XCircle size={14} /> Cancel
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => handleCallOnly(selectedOrder.phone_number)} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-600 hover:bg-zinc-50 transition-all" title="Call Customer"><PhoneCall size={14} /></button>
                                    <button 
                                        onClick={() => handleCopyNumber(selectedOrder.phone_number)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                    >
                                        <Copy size={12} /> {copiedNumber ? 'Copied!' : 'Copy Number'}
                                    </button>
                                </div>
                            </div>

                            {/* Customer Data */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fulfillment Information</h4>
                                {isEditingDetails ? (
                                    <div className="space-y-3">
                                        <input className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-brand/5 transition-all outline-none" value={editForm.customer_name} onChange={e => setEditForm({...editForm, customer_name: e.target.value})} placeholder="Customer Name" />
                                        <textarea className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-brand/5 transition-all outline-none min-h-[100px]" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Shipping Address" />
                                    </div>
                                ) : (
                                    <div className="p-4 sm:p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-lg font-bold text-zinc-900 leading-none">{selectedOrder.customer_name || 'Guest User'}</p>
                                                <p className="text-xs font-bold text-zinc-400 mt-2 font-mono">{selectedOrder.phone_number}</p>
                                            </div>
                                            <button onClick={handleEditDetailsClick} className="p-2 hover:bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-200"><Edit size={16} /></button>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-500 leading-relaxed">{formatAddressForAdmin(selectedOrder.address) || 'No address provided.'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Timeline Notes */}
                            <div className="space-y-4 pb-10">
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Logs</h4>
                                <div className="space-y-2">
                                    {selectedOrder.notes?.map((note) => (
                                        <div key={note.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[9px] font-bold text-zinc-900 uppercase tracking-widest">{note.username || 'System'}</span>
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(note.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">{note.note}</p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2">
                                        <input 
                                            value={noteText} 
                                            onChange={e => setNoteText(e.target.value)} 
                                            placeholder="Add operational note..." 
                                            className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-brand/5 outline-none" 
                                        />
                                        <button onClick={handleAddNote} disabled={!noteText.trim() || isSubmittingNote} className="px-5 py-2.5 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30">Add</button>
                                    </div>
                                </div>
                            </div>
                            {/* Logistics Sync */}
                            {selectedOrder.status !== 'draft' && (
                                <div className="space-y-3">
                                    {!selectedOrder.courier_consignment_id ? (
                                        !isModerator && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleSendToSteadfast()} 
                                                    disabled={isDispatching || !selectedOrder.items} 
                                                    className="py-3 bg-green-700/70 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-30"
                                                    title="Sync with Steadfast"
                                                >
                                                    <Truck size={14} /> Steadfast Sync
                                                </button>
                                                <button 
                                                    onClick={() => handleSendToCarrybee()} 
                                                    disabled={isDispatching || !selectedOrder.items} 
                                                    className="py-3 bg-yellow-400/80 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-30"
                                                    title="Sync with Carrybee"
                                                >
                                                    <Truck size={14} /> Carrybee Sync
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="py-3 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                <Truck size={14} /> {selectedOrder.courier_name === 'carrybee' ? 'Carrybee' : 'Steadfast'}
                                            </div>
                                            {selectedOrder.courier_tracking_code ? (
                                                <a 
                                                    href={selectedOrder.courier_name === 'carrybee' ? `https://merchant.carrybee.com/order-track/${selectedOrder.courier_consignment_id}` : `https://steadfast.com.bd/tl/${selectedOrder.courier_tracking_code}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                                                >
                                                    <Truck size={14} /> Track Order
                                                </a>
                                            ) : (
                                                <div className="py-3 bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                                                    <Truck size={14} /> No Tracking
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedOrder.courier_consignment_id && (
                                <div className="space-y-3">
                                    <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Consignment ID</p>
                                            <p className="text-xs font-bold text-zinc-900 font-mono mt-1">{selectedOrder.courier_consignment_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tracking Code</p>
                                            <p className="text-xs font-bold text-zinc-900 font-mono mt-1">{selectedOrder.courier_tracking_code}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Live Status Overlay */}
                                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                {isFetchingTracking ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Courier Status (Live)</p>
                                                <p className="text-[11px] font-bold text-emerald-900 uppercase mt-0.5 tracking-tight">
                                                    {isFetchingTracking ? 'Syncing...' : (trackingStatus?.delivery_status || trackingStatus?.error || 'Awaiting status update')}
                                                </p>
                                            </div>
                                        </div>
                                        {trackingStatus && !isFetchingTracking && (
                                            <button onClick={() => fetchTrackingStatus(selectedOrder.id)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all">
                                                <RefreshCw size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Product List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Summary</h4>
                                    <button 
                                        onClick={() => handleCopyOrderSummary(selectedOrder)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                    >
                                        <Copy size={12} /> Copy Summary
                                    </button>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-x-auto w-full max-w-full">
                                    <table className="w-full text-left table-fixed">
                                        <colgroup>
                                            <col className="w-[50%] sm:w-[60%]" />
                                            <col className="w-[20%] sm:w-[20%]" />
                                            <col className="w-[30%] sm:w-[20%]" />
                                        </colgroup>
                                        <thead className="bg-zinc-100/50 border-b border-zinc-100 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <tr>
                                                <th className="px-2 sm:px-5 py-3">Product</th>
                                                <th className="px-2 sm:px-5 py-3 text-center">Qty</th>
                                                <th className="px-2 sm:px-5 py-3 text-right">Sum</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                            {isEditingDetails ? (
                                                editForm.items?.map((item, idx) => (
                                                    <tr key={item.id || idx} className="text-xs font-semibold text-zinc-900">
                                                        <td className="px-2 sm:px-5 py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-100 p-0.5 overflow-hidden flex-shrink-0">
                                                                    {item.image ? (
                                                                        <img 
                                                                            src={item.image.startsWith('http') 
                                                                                ? item.image 
                                                                                : `${BASE_URL}${item.image}`} 
                                                                            alt="" 
                                                                            className="w-full h-full object-contain" 
                                                                        />
                                                                    ) : <Package size={16} className="text-zinc-200 mx-auto mt-2" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate max-w-[120px] sm:max-w-[180px]">{item.name}</p>
                                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter mt-0.5">
                                                                        {item.color_name} / {item.size_name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 sm:px-5 py-4 text-center">
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                className="w-12 sm:w-16 px-1.5 sm:px-2 py-1 bg-white border border-zinc-300 rounded text-center font-bold text-zinc-900 focus:ring-2 focus:ring-brand/5 outline-none" 
                                                                value={item.quantity} 
                                                                onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} 
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-5 py-4 text-right font-mono">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <span className="text-zinc-400">৳</span>
                                                                <input 
                                                                    type="number" 
                                                                    min="0" 
                                                                    className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-zinc-300 rounded text-right font-bold text-zinc-900 focus:ring-2 focus:ring-brand/5 outline-none" 
                                                                    value={item.price} 
                                                                    onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))} 
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                (selectedOrder.items || selectedOrder.cart_items)?.map((item, idx) => (
                                                    <tr key={item.id || idx} className="text-xs font-semibold text-zinc-900">
                                                        <td className="px-2 sm:px-5 py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-100 p-0.5 overflow-hidden flex-shrink-0">
                                                                    {item.product_details?.thumbnail || item.image ? (
                                                                        <img 
                                                                            src={(item.product_details?.thumbnail || item.image).startsWith('http') 
                                                                                ? (item.product_details?.thumbnail || item.image) 
                                                                                : `${BASE_URL}${item.product_details?.thumbnail || item.image}`} 
                                                                            alt="" 
                                                                            className="w-full h-full object-contain" 
                                                                        />
                                                                    ) : <Package size={16} className="text-zinc-200 mx-auto mt-2" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate max-w-[120px] sm:max-w-[180px]">{item.product_details?.name || item.name || 'Unknown'}</p>
                                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter mt-0.5">
                                                                        {item.color_details?.name || item.color || 'N/A'} / {item.size_details?.name || item.size || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 sm:px-5 py-4 text-center">{item.quantity}</td>
                                                        <td className="px-2 sm:px-5 py-4 text-right font-mono">৳{(item.price * item.quantity).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        <tfoot className="bg-zinc-100/30 border-t border-zinc-100 font-bold text-zinc-900 text-[11px] font-mono">
                                            <tr>
                                                <td colSpan={2} className="px-2 sm:px-5 py-3 text-zinc-400 uppercase tracking-widest text-[9px]">Subtotal</td>
                                                <td className="px-2 sm:px-5 py-3 text-right">
                                                    ৳{isEditingDetails 
                                                        ? (editForm.items?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0).toLocaleString()
                                                        : ((selectedOrder.items || selectedOrder.cart_items)?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2} className="px-2 sm:px-5 py-3 text-zinc-400 uppercase tracking-widest text-[9px]">Shipping</td>
                                                <td className="px-2 sm:px-5 py-3 text-right">
                                                    {isEditingDetails ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <span className="text-zinc-400">৳</span>
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                className="w-16 sm:w-20 px-1.5 sm:px-2 py-1 bg-white border border-zinc-300 rounded text-right font-bold text-zinc-900 focus:ring-2 focus:ring-brand/5 outline-none" 
                                                                value={editForm.shipping_cost} 
                                                                onChange={(e) => handleShippingChange(Number(e.target.value))} 
                                                            />
                                                        </div>
                                                    ) : (
                                                        `৳${(Number(selectedOrder.shipping_cost) || 0).toLocaleString()}`
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="bg-brand text-white font-black">
                                                <td colSpan={2} className="px-2 sm:px-5 py-4 uppercase tracking-widest text-[10px]">Total Amount</td>
                                                <td className="px-2 sm:px-5 py-4 text-right text-base">
                                                    {isEditingDetails ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <span className="text-white opacity-85">৳</span>
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                className="w-20 sm:w-24 px-1.5 sm:px-2 py-1 bg-brand text-white border border-white/30 rounded text-right font-black focus:ring-2 focus:ring-white/20 outline-none font-mono" 
                                                                value={editForm.total_amount} 
                                                                onChange={(e) => setEditForm({ ...editForm, total_amount: Number(e.target.value) })} 
                                                            />
                                                        </div>
                                                    ) : (
                                                        `৳${Number(selectedOrder.total_amount).toLocaleString()}`
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                                                        {/* Customer Activities & Session Details */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Metadata & Activities</h4>
                                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                                    {/* Confirmed by staff info
                                    {(() => {
                                        const confirmNote = selectedOrder.notes?.find(n => 
                                            n.note && n.note.toLowerCase().includes('confirmed')
                                        );
                                        if (confirmNote) {
                                            return (
                                                <div className="flex items-center gap-3 pb-3 border-b border-zinc-200/50">
                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Confirmed By</p>
                                                        <p className="text-xs font-bold text-zinc-900 mt-0.5">Staff User: <span className="font-mono">{confirmNote.username || 'System'}</span></p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()} */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-zinc-100 text-zinc-500 rounded-lg mt-0.5">
                                                <Globe size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">IP Address</p>
                                                <p className="text-xs font-bold text-zinc-900 mt-0.5 font-mono truncate">{selectedOrder.ip_address || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-zinc-100 text-zinc-500 rounded-lg mt-0.5">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">IP Location</p>
                                                <p className="text-xs font-bold text-zinc-900 mt-0.5 truncate">{selectedOrder.location || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 pt-3 border-t border-zinc-200/50">
                                        <div className="p-2 bg-zinc-100 text-zinc-500 rounded-lg mt-0.5">
                                            <Compass size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">User Device Agent</p>
                                            <p className="text-xs font-medium text-zinc-600 mt-0.5 break-words leading-relaxed">{selectedOrder.user_agent || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex gap-3">
                            {isEditingDetails ? (
                                <button onClick={handleSaveDetails} disabled={isSavingDetails} className="flex-1 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all">Save Changes</button>
                            ) : selectedOrder.status === 'draft' ? (
                                <button 
                                    onClick={() => handleConvertToOrder(selectedOrder.id)} 
                                    disabled={isConverting === selectedOrder.id}
                                    className="flex-1 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-black"
                                >
                                    {isConverting === selectedOrder.id ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={14} />
                                    )}
                                    Convert to Real Order
                                </button>
                            ) : (
                                <button onClick={() => { setShowViewModal(false); openStatusModal(selectedOrder); }} className="flex-1 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all">Update Status</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 shadow-2xl p-8 border border-zinc-200 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-zinc-900 mb-6">Transition Status</h3>
                        <div className="space-y-2 mb-8">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                <button 
                                    key={status} 
                                    onClick={() => setNewStatus(status)} 
                                    className={`w-full py-3 px-5 rounded-xl flex items-center justify-between border-2 transition-all ${newStatus === status ? 'border-brand bg-zinc-50 text-zinc-900' : 'border-transparent bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{status}</span>
                                    {newStatus === status && <CheckCircle size={16} className="text-zinc-900" />}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowStatusModal(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Cancel</button>
                            <button onClick={handleUpdateStatus} className="flex-1 py-3 bg-brand text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all">Apply Status</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'pending': return 'bg-zinc-50 text-zinc-500 border-zinc-200';
        case 'processing': return 'bg-brand/10 text-brand border-zinc-200';
        case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'partial_delivered': return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'cancelled': return 'bg-rose-500 text-rose-100 border-rose-900';
        case 'unknown': return 'bg-zinc-50 text-zinc-400 border-zinc-100';
        default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
    }
};

export default OrderManager;
