import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    Search, Filter, MoreVertical, Shield, User, UserCheck, UserX,
    Trash2, Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Activity, Key,
    Mail, Phone, ExternalLink, ShieldAlert, BadgeCheck, MapPin, ShieldCheck
} from 'lucide-react';

const UserManager = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); 
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const [error, setError] = useState(null);

    // Password Change State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordUserId, setPasswordUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordChanging, setPasswordChanging] = useState(false);

    // 2FA Verification State
    const [verificationCode, setVerificationCode] = useState('');
    const [verifyError, setVerifyError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyUser2FA = async (userId) => {
        if (verificationCode.length < 6) return;
        setIsVerifying(true);
        setVerifyError('');
        try {
            await api.post(`users/${userId}/verify_2fa/`, { otp_code: verificationCode });
            
            setSelectedUser(prev => prev && prev.id === userId ? {
                ...prev,
                profile: {
                    ...(prev.profile || {}),
                    is_2fa_setup: true
                }
            } : prev);
            
            setUsers(users.map(u => u.id === userId ? {
                ...u,
                profile: {
                    ...(u.profile || {}),
                    is_2fa_setup: true
                }
            } : u));
            
            setVerificationCode('');
            alert("2FA successfully verified and activated!");
        } catch (error: any) {
            console.error("2FA verification failed:", error);
            setVerifyError(error.response?.data?.error || "Invalid code. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to completely remove this user? This action cannot be undone.")) return;

        try {
            await api.delete(`users/${userId}/`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error: any) {
            console.error("Error deleting user:", error);
            alert(error.response?.data?.error || "Failed to delete user");
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        setPasswordChanging(true);
        try {
            await api.post(`users/${passwordUserId}/change_password/`,
                { new_password: newPassword }
            );
            alert("Password changed successfully!");
            setShowPasswordModal(false);
            setPasswordUserId(null);
            setNewPassword('');
        } catch (error: any) {
            console.error("Error changing password:", error);
            alert(error.response?.data?.error || "Failed to change password");
        } finally {
            setPasswordChanging(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('users/');

            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                setError("Received invalid data format from server");
            }
        } catch (error: any) {
            console.error("Error fetching users:", error);
            setError(error.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'block'} this user?`)) return;

        try {
            await api.patch(`users/${userId}/`,
                { is_active: newStatus }
            );
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
        } catch (error) {
            console.error("Error updating user status:", error);
            alert("Failed to update status");
        }
    };

    const handleToggleUser2FA = async (userId, newStatus) => {
        try {
            const response = await api.post(`users/${userId}/toggle_2fa/`, { enable_2fa: newStatus });
            const { qr_code, secret, is_2fa_setup } = response.data;
            
            setSelectedUser(prev => prev && prev.id === userId ? {
                ...prev,
                profile: {
                    ...(prev.profile || {}),
                    enable_2fa: newStatus,
                    is_2fa_setup: is_2fa_setup,
                    qr_code: qr_code,
                    secret: secret
                }
            } : prev);
            
            setUsers(users.map(u => u.id === userId ? {
                ...u,
                profile: {
                    ...(u.profile || {}),
                    enable_2fa: newStatus,
                    is_2fa_setup: is_2fa_setup,
                    qr_code: qr_code,
                    secret: secret
                }
            } : u));
            
        } catch (error: any) {
            console.error("Error toggling user 2FA:", error);
            alert(error.response?.data?.error || "Failed to update 2FA setting");
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            roleFilter === 'all' ? true :
                roleFilter === 'admin' ? user.role === 'admin' :
                    roleFilter === 'moderator' ? user.role === 'moderator' :
                        roleFilter === 'staff' ? user.is_staff :
                            !user.is_staff;

        const matchesStatus =
            statusFilter === 'all' ? true :
                statusFilter === 'active' ? user.is_active :
                    !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        moderators: users.filter(u => u.role === 'moderator').length,
        customers: users.filter(u => u.role === 'customer').length,
        blocked: users.filter(u => !u.is_active).length
    };

    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState({ orders: [], wishlist: [], reviews: [], activity: [] });
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('orders');

    const fetchUserDetails = async (userId) => {
        setDetailsLoading(true);
        try {
            const [ordersRes, wishlistRes, activityRes] = await Promise.all([
                api.get(`orders/?user=${userId}`).catch(() => ({ data: [] })),
                api.get(`wishlist/?user=${userId}`).catch(() => ({ data: [] })),
                api.get(`users/${userId}/activity/`).catch(() => ({ data: [] }))
            ]);
            setUserDetails({
                orders: ordersRes.data || [],
                wishlist: wishlistRes.data || [],
                reviews: [],
                activity: activityRes.data || []
            });
        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        fetchUserDetails(user.id);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-96 flex-col gap-4">
            <p className="text-sm font-medium text-zinc-500">Error loading users: {error}</p>
            <button
                onClick={() => { setError(null); fetchUsers(); }}
                className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors"
            >
                Retry System Sync
            </button>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Users</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage permissions, security, and account status.</p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                    {['all', 'admin', 'moderator', 'customer'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === role 
                                ? 'bg-brand text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Users', value: stats.total, icon: User },
                    { label: 'Admins', value: stats.admins, icon: ShieldAlert },
                    { label: 'Moderators', value: stats.moderators, icon: Shield },
                    { label: 'Restricted', value: stats.blocked, icon: UserX }
                ].map((stat, i) => (
                    <div key={i} className="next-panel p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-zinc-900 leading-none font-mono">{stat.value}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls & Table Container */}
            <div className="next-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select 
                            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none focus:ring-2 focus:ring-brand/5"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="blocked">Blocked Only</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User Identity</th>
                                <th className="px-6 py-4">Security Level</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold ring-4 ring-zinc-50">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900 leading-none">{user.first_name} {user.last_name}</p>
                                                <p className="text-[11px] font-medium text-zinc-400 mt-1 font-mono">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {user.is_superuser ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                                    <ShieldAlert size={10} /> SUPERUSER
                                                </span>
                                            ) : user.role === 'admin' ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                                    <ShieldAlert size={10} /> ADMIN
                                                </span>
                                            ) : user.role === 'moderator' ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                    <Shield size={10} /> MODERATOR
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-400">CUSTOMER</span>
                                            )}

                                            {(user.is_staff || user.is_superuser || ['admin', 'moderator'].includes(user.role)) && (
                                                <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                                                    user.profile?.enable_2fa !== false 
                                                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                                                        : 'text-zinc-500 bg-zinc-50 border-zinc-200'
                                                }`}>
                                                    2FA: {user.profile?.enable_2fa !== false ? 'ON' : 'OFF'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-zinc-600">{user.email || '—'}</p>
                                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{user.profile?.phone_number || 'No Phone'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                            <div className={`w-1 h-1 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {user.is_active ? 'Active' : 'Blocked'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                            <button onClick={() => handleViewDetails(user)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                <Activity size={14} />
                                            </button>
                                            {currentUser.is_superuser && (
                                                <button onClick={() => { setPasswordUserId(user.id); setShowPasswordModal(true); setNewPassword(''); }} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Key size={14} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleStatusChange(user.id, !user.is_active)}
                                                disabled={user.is_superuser || user.id === currentUser.id}
                                                className={`p-2 rounded-lg transition-all ${user.is_active ? 'text-zinc-400 hover:text-rose-600' : 'text-emerald-500 hover:bg-emerald-50'} hover:bg-white border border-transparent hover:border-zinc-200 disabled:opacity-30`}
                                            >
                                                {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={user.is_superuser || user.id === currentUser.id}
                                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all disabled:opacity-30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Side Analytics Panel */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedUser(null)}></div>
                    <div className="w-full max-w-xl bg-white h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-zinc-200">
                        {/* Header */}
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">User Details</h3>
                                <p className="text-sm text-zinc-500 mt-1 font-medium">Analytics and activity history.</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-lg transition-all">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {/* Profile Header */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-brand flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-zinc-900/10">
                                    {selectedUser.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold tracking-tight text-zinc-900">{selectedUser.first_name} {selectedUser.last_name}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-bold text-zinc-400 font-mono tracking-tighter">@{selectedUser.username}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedUser.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : selectedUser.role === 'moderator' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'}`}>
                                             {selectedUser.role}
                                         </span>
                                    </div>
                                </div>
                            </div>

                            {/* Essential Data */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                        <MapPin size={10} /> Address
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900 truncate" title={selectedUser.profile?.address || '—'}>
                                        {selectedUser.profile?.address || '—'}
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                        <Phone size={10} /> Phone Number
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-900">{selectedUser.profile?.phone_number || '—'}</p>
                                </div>
                            </div>

                            {(selectedUser.is_staff || selectedUser.is_superuser || ['admin', 'moderator'].includes(selectedUser.role)) && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                                        <div className="text-left">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                <ShieldCheck size={10} /> Two-Factor Authentication (2FA)
                                            </div>
                                            <p className="text-xs text-zinc-500">Require OTP code for this administrator login</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleUser2FA(selectedUser.id, selectedUser.profile?.enable_2fa !== false ? false : true)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                                selectedUser.profile?.enable_2fa !== false ? 'bg-brand' : 'bg-zinc-200'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                    selectedUser.profile?.enable_2fa !== false ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Setup flow if enabled but not verified yet */}
                                    {selectedUser.profile?.enable_2fa !== false && !selectedUser.profile?.is_2fa_setup && (
                                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-left space-y-4">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Setup Google Authenticator 2FA</p>
                                            
                                            <div className="flex flex-col items-center gap-4">
                                                {selectedUser.profile?.qr_code ? (
                                                    <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm shrink-0">
                                                        <img src={selectedUser.profile.qr_code} alt="QR Code" className="w-36 h-36" />
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-zinc-400 italic">No QR Code available. Toggle 2FA to generate.</div>
                                                )}
                                                
                                                <div className="space-y-3 w-full">
                                                    <p className="text-xs text-zinc-600 leading-relaxed text-center">
                                                        Scan the QR code or enter the key below:<br />
                                                        <code className="inline-block mt-1 px-2 py-0.5 bg-zinc-200 text-zinc-800 text-[10px] font-bold rounded font-mono select-all">
                                                            {selectedUser.profile?.secret || '—'}
                                                        </code>
                                                    </p>
                                                    
                                                    <div className="space-y-2 max-w-xs mx-auto">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={verificationCode}
                                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                                placeholder="e.g. 123456"
                                                                className="flex-grow px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-center tracking-widest font-mono focus:border-brand focus:outline-none"
                                                                maxLength={6}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerifyUser2FA(selectedUser.id)}
                                                                disabled={isVerifying || verificationCode.length < 6}
                                                                className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-[#3a5bd9] transition-all disabled:opacity-50"
                                                            >
                                                                {isVerifying ? '...' : 'Verify'}
                                                            </button>
                                                        </div>
                                                        {verifyError && (
                                                            <p className="text-[10px] text-red-600 font-medium text-center">{verifyError}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Analytics Navigation */}
                            <div className="space-y-6">
                                <div className="flex gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                                    {[
                                        { id: 'orders', label: 'Orders', count: userDetails?.orders?.length || 0 },
                                        { id: 'activity', label: 'Activity', count: userDetails?.activity?.length || 0 }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === tab.id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
                                            onClick={() => setActiveDetailTab(tab.id)}
                                        >
                                            {tab.label} <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[9px] text-zinc-400">{tab.count}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    {detailsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 animate-pulse text-zinc-300">
                                            <Activity size={32} className="mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Intelligence...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {activeDetailTab === 'orders' && (
                                                userDetails.orders.length > 0 ? (
                                                    userDetails.orders.map(order => (
                                                        <div key={order.id} className="p-5 bg-white border border-zinc-100 rounded-xl hover:border-zinc-300 transition-all group flex justify-between items-center">
                                                            <div>
                                                                <div className="font-bold text-zinc-900 text-sm">Order #{order.id}</div>
                                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-zinc-900">৳{Number(order.total_amount).toLocaleString()}</div>
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-1 block">{order.status}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : <div className="text-center py-10 text-xs font-medium text-zinc-400">No orders found.</div>
                                            )}
                                            {activeDetailTab === 'activity' && (
                                                userDetails.activity.length > 0 ? (
                                                    userDetails.activity.slice(0, 8).map((log, idx) => (
                                                        <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{log.action || 'System Interaction'}</span>
                                                                <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                                                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] font-medium text-zinc-500 line-clamp-1" title={`${log.device_info || 'Unknown Device'} • ${log.ip_address} • ${log.location || 'Unknown Location'}`}>
                                                                {log.device_info || 'Unknown Device'} • {log.ip_address} • {log.location || 'Unknown Location'}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : <div className="text-center py-10 text-xs font-medium text-zinc-400">No activity logs.</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex gap-4">
                            <button onClick={() => { setPasswordUserId(selectedUser.id); setShowPasswordModal(true); setNewPassword(''); }} className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm">
                                <Key size={14} /> Reset Password
                            </button>
                            <button onClick={() => handleStatusChange(selectedUser.id, !selectedUser.is_active)} className={`flex-1 py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all shadow-lg ${selectedUser.is_active ? 'bg-zinc-900 shadow-zinc-900/10' : 'bg-emerald-600 shadow-emerald-600/10'}`}>
                                {selectedUser.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                {selectedUser.is_active ? 'Restrict Access' : 'Restore Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 shadow-2xl p-8 border border-zinc-200 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                <Key size={24} className="text-zinc-900" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900">Reset Credentials</h3>
                            <p className="text-xs text-zinc-500 mt-1 font-medium">Enter a new secure password for this user.</p>
                        </div>

                        <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/5 transition-all font-semibold"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={passwordChanging}
                                    className="flex-1 py-3 bg-brand text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10 hover:bg-black active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {passwordChanging ? 'Syncing...' : 'Update Keys'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
