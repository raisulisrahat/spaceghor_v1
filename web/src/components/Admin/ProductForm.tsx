import React, { useState, useEffect } from 'react';

import api, { getMediaUrl, BASE_URL } from '../../utils/api';

import { X, Upload, Save, ArrowLeft, Image as ImageIcon, Trash2, Plus, CheckCircle, GripVertical, Video, Globe, Layout, ChevronDown, RefreshCw } from 'lucide-react';

import MediaManager from './MediaManager';

import { motion, Reorder } from 'framer-motion';

import ReactQuill from 'react-quill-new';

import 'react-quill-new/dist/quill.snow.css';

import { useAuth } from '../../context/AuthContext';



const quillModules = {

    toolbar: [

        [{ 'header': [1, 2, 3, false] }],

        ['bold', 'italic', 'underline', 'strike', 'blockquote'],

        [{ 'list': 'ordered' }, { 'list': 'bullet' }],

        ['link', 'image'],

        ['clean']

    ],

    clipboard: {

        matchVisual: false,

    }

};



const shortQuillModules = {

    toolbar: [

        ['bold', 'italic', 'underline', 'strike'],

        [{ 'list': 'ordered' }, { 'list': 'bullet' }],

        ['clean']

    ],

    clipboard: {

        matchVisual: false,

    }

};



const LAYOUT_OPTIONS = [

    { id: 'classic', name: 'Classic', description: 'Clean & conversion focused', color: 'bg-slate-900' },

    { id: 'modern', name: 'Modern', description: 'Large typography & bold colors', color: 'bg-indigo-600' },

    { id: 'combo', name: 'Combo', description: 'Optimized for bundled offers', color: 'bg-rose-600' },

    { id: 'bangla', name: 'Bangla', description: 'Localized for native trust', color: 'bg-green-600' },

    { id: 'ezymart', name: 'EzyMart', description: 'Marketplace style layout', color: 'bg-orange-600' },

    { id: 'ezymart_v2', name: 'EzyMart V2', description: 'Marketplace style layout V2', color: 'bg-orange-500' },

    { id: 'dark', name: 'Dark', description: 'High contrast & premium', color: 'bg-black' },

    { id: 'professional', name: 'Pro', description: 'Structured & informative', color: 'bg-blue-700' },

    { id: 'garden', name: 'Garden', description: 'Eco-friendly & organic feel', color: 'bg-emerald-700' },

    { id: 'premium', name: 'Premium', description: 'Luxurious & elegant', color: 'bg-amber-600' },

];



const ProductForm = ({ product, onSave, onCancel }) => {

    const { token } = useAuth();

    const bulkImageInputRef = React.useRef(null);

    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'upload' | 'library'>('upload');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState<'thumbnail' | 'gallery_image' | 'gallery_video' | null>(null);
    const [galleryImagesFromLibrary, setGalleryImagesFromLibrary] = useState<{ url: string; color: any }[]>([]);
    const [galleryVideosFromLibrary, setGalleryVideosFromLibrary] = useState<string[]>([]);

    const handleGallerySelect = (url: string) => {
        if (galleryTarget === 'thumbnail') {
            setThumbnail(url);
            setThumbnailPreview(url);
            setMediaModalOpen(false);
            setGalleryTarget(null);
        } else if (galleryTarget === 'gallery_image') {
            setGalleryImagesFromLibrary(prev => [...prev, { url, color: null }]);
            // Don't close modal — allow further single selections
        } else if (galleryTarget === 'gallery_video') {
            setGalleryVideosFromLibrary(prev => [...prev, url]);
        }
    };

    const handleGallerySelectMultiple = (urls: string[]) => {
        if (galleryTarget === 'thumbnail' && urls.length > 0) {
            setThumbnail(urls[0]);
            setThumbnailPreview(urls[0]);
        } else if (galleryTarget === 'gallery_image') {
            setGalleryImagesFromLibrary(prev => [...prev, ...urls.map(url => ({ url, color: null }))]);
        } else if (galleryTarget === 'gallery_video') {
            setGalleryVideosFromLibrary(prev => [...prev, ...urls]);
        }
        setMediaModalOpen(false);
        setGalleryTarget(null);
    };

    const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        const file = files[0];

        const formDataObj = new FormData();
        formDataObj.append('file', file);

        try {
            const res = await api.post('media-manager/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
            handleGallerySelect(fullUrl);
        } catch (error) {
            console.error("Local upload error:", error);
            alert("Failed to upload local image.");
        } finally {
            setUploadingImage(false);
        }
    };

    // Color Modal State

    const [showColorModal, setShowColorModal] = useState(false);

    const [newColor, setNewColor] = useState({ name: '', hex_code: '#000000' });

    const [colorPickerImage, setColorPickerImage] = useState(null); // The image explicitly selected for color picking



    // Size Modal State

    const [showSizeModal, setShowSizeModal] = useState(false);

    const [newSize, setNewSize] = useState({ name: '', code: '' });



    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);
    const categoryRef = React.useRef<HTMLDivElement>(null);
    const sizeRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
            if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
                setShowSizeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [formData, setFormData] = useState({

        name: '',

        slug: '',

        regular_price: '',

        sale_price: '',

        stock: 0,

        weight: '',

        description: '',

        short_description: '',

        is_active: true,

        categories: [],

        brand: '',

        colors: [], // M2M IDs

        sizes: [], // M2M IDs

        specifications: {}, // Dynamic Key-Value pairs

        show_specifications: true,

    });



    // File States

    const [thumbnail, setThumbnail] = useState(null); // Main Image

    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    const [galleryImages, setGalleryImages] = useState([]); // List of new files

    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const [existingGalleryImages, setExistingGalleryImages] = useState([]); // List of {id, image} from backend

    const [galleryVideos, setGalleryVideos] = useState([]); // List of new video files

    const [galleryVideoPreviews, setGalleryVideoPreviews] = useState([]);

    const [existingGalleryVideos, setExistingGalleryVideos] = useState([]); // List of {id, video} from backend



    // Options

    const [categories, setCategories] = useState([]);

    const [brands, setBrands] = useState([]);

    const [availableColors, setAvailableColors] = useState([]);

    const [availableSizes, setAvailableSizes] = useState([]);

    const [allBrands, setAllBrands] = useState([]);

    const [allColors, setAllColors] = useState([]);

    const [allSizes, setAllSizes] = useState([]);



    // Flash Sale State

    const [flashSales, setFlashSales] = useState([]);

    const [flashSaleItem, setFlashSaleItem] = useState(null);

    const [isFlashSale, setIsFlashSale] = useState(false);

    const [selectedFlashSale, setSelectedFlashSale] = useState('');

    

    // Funnel Sections State

    const [funnelSections, setFunnelSections] = useState([]);

    const [linkedFunnel, setLinkedFunnel] = useState(null);

    const [specsList, setSpecsList] = useState([]);
    const [showBulkInput, setShowBulkInput] = useState(false);
    const [bulkSpecsText, setBulkSpecsText] = useState('');

    const handleBulkSpecsAdd = () => {
        if (!bulkSpecsText.trim()) return;
        const lines = bulkSpecsText.split('\n');
        const newSpecs: any[] = [];
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmed.slice(0, colonIndex).trim();
                const value = trimmed.slice(colonIndex + 1).trim();
                if (key) {
                    newSpecs.push({
                        id: `spec-${Date.now()}-${Math.random()}`,
                        key,
                        value
                    });
                }
            } else {
                newSpecs.push({
                    id: `spec-${Date.now()}-${Math.random()}`,
                    key: trimmed,
                    value: ''
                });
            }
        });

        if (newSpecs.length > 0) {
            setSpecsList(prev => [...prev, ...newSpecs]);
            setBulkSpecsText('');
            setShowBulkInput(false);
        }
    };



    const [loading, setLoading] = useState(false);



    useEffect(() => {
        // Reset all states to prevent leakage between products
        setLinkedFunnel(null);
        setFlashSaleItem(null);
        setIsFlashSale(false);
        setSelectedFlashSale('');
        setFunnelSections([]);
        setThumbnailPreview(null);
        setExistingGalleryImages([]);
        setExistingGalleryVideos([]);
        setSpecsList([]);

        if (product) {
            const initialSpecs = Object.entries(product.specifications || {}).map(([k, v], idx) => ({
                id: `spec-${idx}-${Date.now()}`,
                key: k,
                value: v as string
            }));
            setSpecsList(initialSpecs);

            setFormData({

                name: product.name,

                slug: product.slug,

                regular_price: product.regular_price,

                sale_price: product.sale_price || '',

                stock: product.stock,

                weight: product.weight || '',

                description: product.description,

                short_description: product.short_description || '',

                is_active: product.is_active,

                categories: product.categories?.map(c => typeof c === 'object' ? c.id : c) || [],

                brand: (product.brand && typeof product.brand === 'object') ? product.brand.id : (product.brand || ''),

                colors: product.colors?.map(c => typeof c === 'object' ? c.id : c) || [],

                sizes: product.sizes?.map(s => typeof s === 'object' ? s.id : s) || [],

                specifications: product.specifications || {},

                show_specifications: product.show_specifications !== false,

            });

            setThumbnailPreview(getMediaUrl(product.image));

            setExistingGalleryImages(product.images?.map(img => ({

                ...img,

                image: getMediaUrl(img.image)

            })) || []);

            setExistingGalleryVideos(product.videos?.map(vid => ({

                ...vid,

                video: getMediaUrl(vid.video)

            })) || []);

            setFunnelSections(product.funnel_sections?.map(s => ({

                ...s,

                preview: getMediaUrl(s.image),

                videoPreview: getMediaUrl(s.video),

                contentType: s.video || s.video_url ? 'video' : 'image'

            })) || []);

            

            // Fetch associated funnel for layout management

            api.get(`funnels/?product=${product.id}`)

                .then(res => {

                    const funnels = res.data.results || res.data;

                    if (funnels.length > 0) {

                        setLinkedFunnel(funnels[0]);

                    }

                })

                .catch(err => console.error("Failed to fetch linked funnel", err));

            // Existing gallery images handling would require more complex logic (deleting existing ones),

            // For now we just show them in a read-only list effectively or just handle NEW uploads.

        }



        const fetchData = async () => {

            // Mocking Colors/Sizes if endpoints don't exist yet, or try fetching.

            try {

                const [cats, brnds, clrs, szs] = await Promise.all([

                    api.get('categories/'),

                    api.get('brands/'),

                    api.get('colors/').catch(() => ({ data: [] })),

                    api.get('sizes/').catch(() => ({ data: [] }))

                ]);

                const catsData = cats.data.results || cats.data;

                const brndsData = brnds.data.results || brnds.data;

                const szsData = szs.data.results || szs.data || [];



                setCategories(catsData);

                setAllBrands(brndsData);

                setAllSizes(szsData);

                

                // Initial lists

                setBrands(brndsData);

                setAvailableSizes(szsData);

                

                // Filter out duplicate color names (case-insensitive)

                const fetchedColors = clrs.data.results || clrs.data || [];

                const uniqueColorsMap = new Map();

                fetchedColors.forEach(c => {

                    const normalizedName = c.name?.trim().toLowerCase();

                    if (normalizedName && !uniqueColorsMap.has(normalizedName)) {

                        uniqueColorsMap.set(normalizedName, c);

                    }

                });

                const uniqueColors = Array.from(uniqueColorsMap.values());

                setAllColors(uniqueColors);

                setAvailableColors(uniqueColors);

            } catch (e) {

                console.error("Failed to load options", e);

            }

        };

        fetchData();



        // Fetch Flash Sales

        api.get('flash-sales/')

            .then(res => {

                const sales = res.data.results || res.data;

                const activeSales = sales.filter(s => s.is_active);

                setFlashSales(activeSales);

            })

            .catch(e => console.error("Failed to load flash sales", e));



        if (product) {

            api.get(`flash-sale-items/?product=${product.id}`)

                .then(res => {

                    const items = res.data.results || res.data;

                    if (items.length > 0) {

                        const item = items[0];

                        setFlashSaleItem(item);

                        setIsFlashSale(true);

                        setSelectedFlashSale(item.flash_sale);

                    }

                })

                .catch(e => console.error("Failed to check flash sale", e));

        }

    }, [product]);



    // Filter attributes based on categories

    useEffect(() => {

        if (formData.categories.length === 0) {

            setBrands(allBrands);

            setAvailableColors(allColors);

            setAvailableSizes(allSizes);

            return;

        }



        const selectedCats = categories.filter(c => formData.categories.includes(c.id));

        

        const brandIds = new Set();

        const colorIds = new Set();

        const sizeIds = new Set();



        selectedCats.forEach(cat => {

            (cat.brands || []).forEach(id => brandIds.add(typeof id === 'object' ? id.id : id));

            (cat.colors || []).forEach(id => colorIds.add(typeof id === 'object' ? id.id : id));

            (cat.sizes || []).forEach(id => sizeIds.add(typeof id === 'object' ? id.id : id));

        });



        const currentBrandId = parseInt(formData.brand);

        const currentColors = formData.colors.map(id => parseInt(id));

        const currentSizes = formData.sizes.map(id => parseInt(id));



        setBrands(allBrands.filter(b => brandIds.has(b.id) || b.id === currentBrandId));

        setAvailableColors(allColors.filter(c => colorIds.has(c.id) || currentColors.includes(c.id)));

        setAvailableSizes(allSizes.filter(s => sizeIds.has(s.id) || currentSizes.includes(s.id)));

    }, [formData.categories, allBrands, allColors, allSizes, categories]);



    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData(prev => ({

            ...prev,

            [name]: type === 'checkbox' ? checked : value

        }));

    };



    const handleSpecChange = (id, newKey, newValue) => {

        setSpecsList(prev => prev.map(spec => {

            if (spec.id === id) {

                return { ...spec, key: newKey, value: newValue };

            }

            return spec;

        }));

    };



    const removeSpec = (id) => {

        setSpecsList(prev => prev.filter(spec => spec.id !== id));

    };



    const addSpec = () => {

        setSpecsList(prev => [

            ...prev,

            { id: `spec-${Date.now()}-${Math.random()}`, key: `New Spec ${prev.length + 1}`, value: '' }

        ]);

    };





    const handleDescriptionChange = (content) => {

        setFormData(prev => ({ ...prev, description: content }));

    };



    const handleShortDescriptionChange = (content) => {

        setFormData(prev => ({ ...prev, short_description: content }));

    };



    const handleMultiSelect = (e, field) => {

        const options = e.target.options;

        const selectedValues = [];

        for (let i = 0; i < options.length; i++) {

            if (options[i].selected) {

                selectedValues.push(parseInt(options[i].value));

            }

        }

        setFormData(prev => ({ ...prev, [field]: selectedValues }));

    };



    const handleThumbnailChange = (e) => {

        const file = e.target.files[0];

        if (file) {

            setThumbnail(file);

            setThumbnailPreview(URL.createObjectURL(file as Blob));

        }

    };



    const handleGalleryChange = (e) => {

        const files = Array.from(e.target.files);

        if (files.length > 0) {

            const newFilesWithColor = files.map(f => ({ file: f, color: null }));

            setGalleryImages(prev => [...prev, ...newFilesWithColor]);

            const newPreviews = files.map((file: any) => ({

                url: URL.createObjectURL(file as Blob),

                file: file,

                color: null

            }));

            setGalleryPreviews(prev => [...prev, ...newPreviews]);

        }

    };



    const removeGalleryImage = (index) => {

        setGalleryImages(prev => prev.filter((_, i) => i !== index));

        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));

    };



    const handleVideoChange = (e) => {

        const files = Array.from(e.target.files);

        if (files.length > 0) {

            setGalleryVideos(prev => [...prev, ...files]);

            const newPreviews = files.map((file: any) => ({

                url: URL.createObjectURL(file as Blob),

                file: file

            }));

            setGalleryVideoPreviews(prev => [...prev, ...newPreviews]);

        }

    };



    const removeGalleryVideo = (index) => {

        setGalleryVideos(prev => prev.filter((_, i) => i !== index));

        setGalleryVideoPreviews(prev => prev.filter((_, i) => i !== index));

    };



    const handleRemoveExistingVideo = async (videoId, index) => {

        if (!confirm("Are you sure you want to delete this video?")) return;

        try {

            await api.delete(`product-videos/${videoId}/`);

            setExistingGalleryVideos(prev => prev.filter((_, i) => i !== index));

        } catch (error) {

            console.error("Failed to delete video", error);

            alert("Failed to delete video");

        }

    };



    const updateNewGalleryImageColor = (index, colorId) => {

        setGalleryImages(prev => prev.map((item, i) => i === index ? { ...item, color: colorId } : item));

        setGalleryPreviews(prev => prev.map((item, i) => i === index ? { ...item, color: colorId } : item));

        

        if (colorId) {

            setFormData(prev => {

                const idNum = parseInt(colorId);

                if (!prev.colors.includes(idNum)) {

                    return { ...prev, colors: [...prev.colors, idNum] };

                }

                return prev;

            });

        }

    };



    const handleRemoveExistingGalleryImage = async (imageId, index) => {

        if (!confirm("Are you sure you want to delete this image?")) return;

        try {

            await api.delete(`product-images/${imageId}/`);

            setExistingGalleryImages(prev => prev.filter((_, i) => i !== index));

        } catch (error) {

            console.error("Failed to delete image", error);

            alert("Failed to delete image");

        }

    };



    const handleExistingGalleryImageColorChange = async (imageId, index, newColor) => {

        try {

            await api.patch(`product-images/${imageId}/`, { color: newColor || null });

            setExistingGalleryImages(prev => prev.map((img, i) => i === index ? { ...img, color: newColor || null } : img));

            

            if (newColor) {

                setFormData(prev => {

                    const idNum = parseInt(newColor);

                    if (!prev.colors.includes(idNum)) {

                        return { ...prev, colors: [...prev.colors, idNum] };

                    }

                    return prev;

                });

            }

        } catch (error) {

            console.error("Failed to update image color", error);

            alert("Failed to update image color");

        }

    };



    const associateColorWithImage = (colorId, imageSrc) => {

        if (!imageSrc) return;

        

        // Check if it's an existing gallery image

        const existingIdx = existingGalleryImages.findIndex(img => (img.image || img) === imageSrc);

        if (existingIdx !== -1) {

            handleExistingGalleryImageColorChange(existingGalleryImages[existingIdx].id, existingIdx, colorId);

        } else {

            // Check if it's a new gallery preview

            const newIdx = galleryPreviews.findIndex(img => img.url === imageSrc);

            if (newIdx !== -1) {

                updateNewGalleryImageColor(newIdx, colorId);

            }

        }

    };



    const handleCreateColor = async () => {

        try {

            const response = await api.post('colors/', newColor);

            const createdColor = response.data;

            setAvailableColors(prev => [...prev, createdColor]);

            setFormData(prev => ({ ...prev, colors: [...prev.colors, createdColor.id] }));

            

            // Auto-associate with the image used for picking

            associateColorWithImage(createdColor.id, colorPickerImage);



            setShowColorModal(false);

            setNewColor({ name: '', hex_code: '#000000' });

        } catch (error) {

            console.error("Failed to create color", error);

            alert("Failed to create color");

        }

    };



    const handleCreateSize = async () => {

        if (!newSize.name.trim()) return;

        try {

            const response = await api.post('sizes/', newSize);

            const createdSize = response.data;

            setAvailableSizes(prev => [...prev, createdSize]);

            setFormData(prev => ({ ...prev, sizes: [...prev.sizes, createdSize.id] }));

            setShowSizeModal(false);

            setNewSize({ name: '', code: '' });

        } catch (error) {

            console.error("Failed to create size", error);

            alert("Failed to create size");

        }

    };



    // Funnel Section Handlers

    const addFunnelSection = () => {

        setFunnelSections(prev => [

            ...prev,

            { id: `new-${Date.now()}`, title: '', text: '', image: null, preview: null, video: null, videoPreview: null, video_url: '', order: prev.length, contentType: 'image' }

        ]);

    };



    const updateFunnelSection = (index, field, value) => {

        setFunnelSections(prev => {

            const newSections = [...prev];

            newSections[index] = { ...newSections[index], [field]: value };

            return newSections;

        });

    };



    const handleFunnelSectionImageChange = (index, e) => {

        const files = Array.from(e.target.files);

        if (files.length === 0) return;



        // Update current section with the first image

        updateFunnelSection(index, 'image', files[0]);

        updateFunnelSection(index, 'preview', URL.createObjectURL(files[0] as Blob));



        // Create new sections for the rest

        if (files.length > 1) {

            const extraSections = files.slice(1).map((file, i) => ({

                id: `new-${Date.now()}-${i}`,

                title: '',

                text: '',

                image: file,

                preview: URL.createObjectURL(file as Blob),

                video: null,

                videoPreview: null,

                video_url: '',

                order: funnelSections.length + i,

                contentType: 'image'

            }));



            setFunnelSections(prev => {

                const updated = [...prev];

                updated.splice(index + 1, 0, ...extraSections);

                return updated;

            });

        }

    };



    const handleFunnelSectionVideoChange = (index, e) => {

        const file = e.target.files[0];

        if (file) {

            updateFunnelSection(index, 'video', file);

            updateFunnelSection(index, 'videoPreview', URL.createObjectURL(file as Blob));

        }

    };



    const handleBulkImageUpload = (e) => {

        const files = Array.from(e.target.files);

        if (files.length === 0) return;



        const newSections = files.map((file, i) => ({

            id: `new-${Date.now()}-${i}`,

            title: '',

            text: '',

            image: file,

            preview: URL.createObjectURL(file as Blob),

            video: null,

            videoPreview: null,

            video_url: '',

            order: funnelSections.length + i,

            contentType: 'image'

        }));



        setFunnelSections(prev => [...prev, ...newSections]);

        e.target.value = null; // Reset for next use

    };



    const removeFunnelSection = (index) => {

        setFunnelSections(prev => prev.filter((_, i) => i !== index));

    };







    // Re-writing handleSubmit to support chaining

    const handleSaveWithFlashSale = async (e) => {

        e.preventDefault();

        setLoading(true);



        const data = new FormData();

        const excludeFields = []; // is_active is now in Product model



        const specsObj = {};

        specsList.forEach(item => {

            if (item.key && item.key.trim()) {

                specsObj[item.key.trim()] = item.value || '';

            }

        });



        Object.keys(formData).forEach(key => {

            if (excludeFields.includes(key)) return;



            if (Array.isArray(formData[key])) {

                formData[key].forEach(item => {

                    if (item !== undefined && item !== null) {

                        data.append(key, item);

                    }

                });

            } else {

                let value = formData[key];



                // Clean up content: remove non-breaking spaces

                if ((key === 'description' || key === 'short_description') && typeof value === 'string') {

                    value = value.replace(/&nbsp;/g, ' ');

                }



                if (key === 'brand') {

                    // Send empty string to clear the brand, DRF accepts '' as null for FKs.

                    // If undefined or null string (from previous bugs), convert to empty string.

                    if (!value || value === 'undefined' || value === 'null') {

                        data.append(key, '');

                    } else {

                        data.append(key, value);

                    }

                    return;

                }

                if (key === 'weight' && value === '') value = 0;

                if (key === 'weight' && value === '') value = 0;

                if (key === 'stock' && value === '') value = 0;

                if (key === 'stock' && value === '') value = 0;

                if (key === 'sale_price' && value === '') return; // Skip empty sale_price instead of sending '' which breaks DRF DecimalField

                

                if (key === 'specifications') {

                    data.append(key, JSON.stringify(specsObj));

                } else {

                    data.append(key, value);

                }

            }

        });



        if (thumbnail) {
            if (thumbnail instanceof File) {
                data.append('image', thumbnail);
            } else if (typeof thumbnail === 'string' && thumbnail) {
                data.append('image', thumbnail);
            }
        }

        galleryImages.forEach(item => {

            data.append('uploaded_images', item.file);

            // Append color logic later if needed via separate API call or a complex JSON payload.

            // Currently the backend accepts a list of uploaded_images but not their corresponding colors in the same field.

            // We will upload them, get the resulting objects, and assign colors as a follow-up step.

        });

        galleryVideos.forEach(file => {

            data.append('uploaded_videos', file);

        });



        // Handle Funnel Sections

        const sectionsToSubmit = funnelSections.map((s, i) => ({

            id: typeof s.id === 'string' && s.id.startsWith('new-') ? null : s.id,

            title: s.title,

            text: s.text,

            video_url: s.video_url,

            order: i

        }));

        data.append('funnel_sections', JSON.stringify(sectionsToSubmit));

        

        funnelSections.forEach((s, i) => {

            if (s.image instanceof File) {

                data.append(`funnel_section_image_${i}`, s.image);

            }

            if (s.video instanceof File) {

                data.append(`funnel_section_video_${i}`, s.video);

            }

        });



        try {

            const config = {

                headers: {

                    'Authorization': `Token ${token}`,

                    'Content-Type': 'multipart/form-data'

                }

            };



            let savedProduct = product;

            if (product) {

                await api.patch(`products/${product.slug}/`, data, config);

                if (linkedFunnel) {

                    await api.patch(`funnels/${linkedFunnel.slug}/`, { 

                        layout_type: linkedFunnel.layout_type,

                        title: linkedFunnel.title,

                        top_header_line_1: linkedFunnel.top_header_line_1,

                        top_header_line_2: linkedFunnel.top_header_line_2,

                        top_header_line_3: linkedFunnel.top_header_line_3,

                        top_header_line_4: linkedFunnel.top_header_line_4,

                        features_list: linkedFunnel.features_list

                    });

                }

            } else {

                const res = await api.post('products/', data, config);

                savedProduct = res.data;

            }



            // Flash Sale Logic

            if (savedProduct && savedProduct.id) {

                if (isFlashSale && selectedFlashSale) {

                    const fsData = {

                        flash_sale: selectedFlashSale,

                        product_id: savedProduct.id,

                        discount_percentage: null,

                        order: 0

                    };



                    if (flashSaleItem) {

                        await api.patch(`flash-sale-items/${flashSaleItem.id}/`, fsData);

                    } else {

                        await api.post('flash-sale-items/', fsData);

                    }

                } else if (!isFlashSale && flashSaleItem) {

                    await api.delete(`flash-sale-items/${flashSaleItem.id}/`);

                }



                // If we uploaded new gallery images with associated colors, we need to map them backward.

                // Since our current backend logic in Serializer just iterates and creates ProductImages, 

                // we'll update the colors for these newly uploaded images.

                if (galleryImages.some(img => img.color)) {

                    // Refetch product to get the newly created ProductImage IDs

                    const updatedProductRes = await api.get(`products/${savedProduct.slug}/`);

                    const finalProduct = updatedProductRes.data;

                    const finalImages = finalProduct.images || [];



                    // Basic heuristic: match the number of new files to the latest added images. 

                    // This is rough; a robust solution requires changing the bulk upload endpoint.

                    // For now, we'll iterate through `galleryImages` and find matching images by filename.

                    for (const g_img of galleryImages) {

                        if (g_img.color) {

                            const matchedImg = finalImages.find(fi => fi.image.includes(g_img.file.name));

                            if (matchedImg) {

                                await api.patch(`product-images/${matchedImg.id}/`, { color: g_img.color });

                            }

                        }

                    }

                }

            }



            // Save gallery images from library
            for (const img of galleryImagesFromLibrary) {
                await api.post('product-images/', {
                    product: savedProduct.id,
                    image: img.url,
                    color: img.color || null
                }, config);
            }

            // Save gallery videos from library
            for (const vidUrl of galleryVideosFromLibrary) {
                await api.post('product-videos/', {
                    product: savedProduct.id,
                    video: vidUrl
                }, config);
            }

            onSave();

        } catch (error: any) {

            console.error("Save failed:", error.response?.data || error);

            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;

            alert("Failed to save product. " + errorMsg);

        } finally {

            setLoading(false);

        }

    };



    // Helper to organize categories into hierarchy

    const renderCategoryOptions = (categories) => {

        const categoryMap = {};

        const roots = [];



        // Build map and roots

        categories.forEach(cat => {

            categoryMap[cat.id] = { ...cat, children: [] };

        });



        categories.forEach(cat => {

            if (cat.parent) {

                if (categoryMap[cat.parent]) {

                    categoryMap[cat.parent].children.push(categoryMap[cat.id]);

                }

            } else {

                roots.push(categoryMap[cat.id]);

            }

        });



        // Flatten for display

        const flatList = [];

        const traverse = (nodes, depth = 0) => {

            nodes.forEach(node => {

                flatList.push({

                    id: node.id,

                    name: node.name,

                    depth: depth

                });

                if (node.children && node.children.length > 0) {

                    traverse(node.children, depth + 1);

                }

            });

        };



        traverse(roots);



        return flatList.map(cat => (

            <option key={cat.id} value={cat.id}>

                {'\u00A0'.repeat(cat.depth * 4)}{cat.depth > 0 ? '↳ ' : ''}{cat.name}

            </option>

        ));

    };



    return (

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 md:p-8 max-w-5xl mx-auto overflow-hidden">

            <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-6">

                <div className="flex items-center gap-4">

                    <button onClick={onCancel} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>

                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{product ? 'Edit Product' : 'Add New Product'}</h2>

                </div>

            </div>



            <form onSubmit={handleSaveWithFlashSale} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Main Info */}

                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Info */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-6">Basic Information</h3>

                        <div className="space-y-5">

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Product Name</label>

                                <input

                                    type="text"

                                    name="name"

                                    required

                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    value={formData.name}

                                    onChange={handleChange}

                                />

                            </div>

                            

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Full Description</label>

                                <div className="h-80 mb-6 rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-colors">

                                    <ReactQuill

                                        theme="snow"

                                        value={formData.description}

                                        onChange={handleDescriptionChange}

                                        modules={quillModules}

                                        className="h-full border-none"

                                    />

                                </div>

                            </div>

                        </div>

                    </div>



                    {/* Inventory & Pricing */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-6">Inventory & Pricing</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Regular Price (৳)</label>

                                <input

                                    type="number"

                                    name="regular_price"

                                    required

                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    value={formData.regular_price}

                                    onChange={handleChange}

                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Sell Price (৳)</label>

                                <input

                                    type="number"

                                    name="sale_price"

                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    value={formData.sale_price}

                                    onChange={handleChange}

                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Stock Quantity</label>

                                <input

                                    type="number"

                                    name="stock"

                                    required

                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    value={formData.stock}

                                    onChange={handleChange}

                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-zinc-700 mb-2">Weight (kg)</label>

                                <input

                                    type="number"

                                    name="weight"

                                    step="0.01"

                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    value={formData.weight}

                                    onChange={handleChange}

                                />

                            </div>

                        </div>

                    </div>



                    {/* Flash Sale */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <div className="flex justify-between items-center mb-6">

                            <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Flash Sale</h3>

                            <label className="flex items-center space-x-2 cursor-pointer">

                                <input

                                    type="checkbox"

                                    checked={isFlashSale}

                                    onChange={(e) => setIsFlashSale(e.target.checked)}

                                    className="h-4 w-4 text-zinc-900 rounded border-zinc-300 focus:ring-brand"

                                />

                                <span className="text-sm font-medium text-zinc-700">Add to Sale</span>

                            </label>

                        </div>



                        {isFlashSale && (

                            <div className="grid grid-cols-1 gap-5">

                                <div>

                                    <label className="block text-sm font-medium text-zinc-700 mb-2">Select Sale</label>

                                    <select

                                        value={selectedFlashSale}

                                        onChange={(e) => setSelectedFlashSale(e.target.value)}

                                        required={isFlashSale}

                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                    >

                                        <option value="">Choose Sale...</option>

                                        {flashSales.map(sale => (

                                            <option key={sale.id} value={sale.id}>{sale.title}</option>

                                        ))}

                                    </select>

                                    <p className="text-xs text-zinc-500 mt-2 font-medium">

                                        The global discount percentage configured in the Flash Sale Manager will automatically apply to this product.

                                    </p>

                                </div>

                            </div>

                        )}

                    </div>





                    {/* Technical Specifications */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <div className="flex justify-between items-center mb-6">

                            <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Technical Specifications</h3>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBulkInput(!showBulkInput)}
                                    className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center gap-1 bg-zinc-100 px-2.5 py-1.5 rounded-xl hover:bg-zinc-200 transition-colors"
                                >
                                    {showBulkInput ? 'Hide Bulk Add' : 'Bulk Add'}
                                </button>

                                <button

                                    type="button"

                                    onClick={addSpec}

                                    className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center gap-1 bg-zinc-100 px-2.5 py-1.5 rounded-xl hover:bg-zinc-200 transition-colors"

                                >

                                    <Plus size={14} /> Add Specification

                                </button>
                            </div>

                        </div>

                        {showBulkInput && (
                            <div className="mb-6 p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                                        Bulk Specifications Input
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={bulkSpecsText}
                                        onChange={(e) => setBulkSpecsText(e.target.value)}
                                        placeholder="Brand: Binbond&#10;Size: 22m&#10;Warrenty: 1 Year"
                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none font-mono resize-y"
                                    />
                                    <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                                        Enter specifications in <strong>Key: Value</strong> format, one per line. Missing values will be left empty.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBulkSpecsText('');
                                            setShowBulkInput(false);
                                        }}
                                        className="text-xs font-semibold px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBulkSpecsAdd}
                                        className="text-xs font-bold px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
                                    >
                                        Apply Specifications
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">

                            <Reorder.Group axis="y" values={specsList} onReorder={setSpecsList} className="space-y-4">

                                {specsList.map((spec, index) => (

                                    <Reorder.Item key={spec.id} value={spec} className="flex flex-col sm:flex-row gap-3 items-center bg-white rounded-xl">

                                        <div className="cursor-grab active:cursor-grabbing p-2 text-zinc-400 hover:text-zinc-900 shrink-0">

                                            <GripVertical size={16} />

                                        </div>

                                        <div className="flex-1 w-full">

                                            <input

                                                type="text"

                                                placeholder="Label (e.g. Material)"

                                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none"

                                                value={spec.key}

                                                onChange={(e) => handleSpecChange(spec.id, e.target.value, spec.value)}

                                            />

                                        </div>

                                        <div className="flex-[2] w-full">

                                            <input

                                                type="text"

                                                placeholder="Value (e.g. 100% Cotton)"

                                                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none"

                                                value={spec.value}

                                                onChange={(e) => handleSpecChange(spec.id, spec.key, e.target.value)}

                                            />

                                        </div>

                                        <button

                                            type="button"

                                            onClick={() => removeSpec(spec.id)}

                                            className="p-2 text-zinc-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors shrink-0"

                                        >

                                            <Trash2 size={18} />

                                        </button>

                                    </Reorder.Item>

                                ))}

                            </Reorder.Group>



                            {specsList.length === 0 && (

                                <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">

                                    No custom specifications added yet.

                                </p>

                            )}

                        </div>

                    </div>



                    {/* Customer Review Screenshots / Funnel Visual Builder */}

                    <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">

                        <div className="bg-zinc-900 p-6 flex justify-between items-center">

                            <div className="flex items-center gap-3 text-white">

                                <div className="p-2 bg-brand rounded-lg">

                                    <Layout size={20} />

                                </div>

                                <div>

                                    <h3 className="text-lg font-bold tracking-tight">Customer Review Screenshots (Funnel Carousel Builder)</h3>

                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Upload Messenger/WhatsApp chat screenshots & review carousels</p>

                                </div>

                            </div>

                            <div className="flex gap-2">

                                <input

                                    type="file"

                                    ref={bulkImageInputRef}

                                    className="hidden"

                                    multiple

                                    accept="image/*"

                                    onChange={handleBulkImageUpload}

                                />

                                <button

                                    type="button"

                                    onClick={() => bulkImageInputRef.current.click()}

                                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white hover:bg-[#3a5bd9] rounded-xl text-xs font-black uppercase tracking-tighter transition-all shadow-sm active:scale-95"

                                >

                                    <ImageIcon size={16} /> Bulk Review Screenshots

                                </button>

                                <button

                                    type="button"

                                    onClick={addFunnelSection}

                                    className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl text-xs font-black uppercase tracking-tighter transition-all shadow-sm active:scale-95"

                                >

                                    <Plus size={16} /> Add Review Screenshot

                                </button>

                            </div>

                        </div>



                        {/* Custom Funnel Headings & Checklist */}

                        {linkedFunnel && (

                            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">

                                <div className="space-y-6">

                                    <div className="flex items-center gap-2">

                                        <div className="p-1.5 bg-brand/10 text-brand rounded-lg">

                                            <Globe size={14} className="text-brand" />

                                        </div>

                                        <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Custom Funnel Copy & Checklist</h4>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                                        <div className="space-y-2">

                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 1 (Promo Banner)</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none transition-all font-semibold"

                                                value={linkedFunnel.top_header_line_1 || ''}

                                                onChange={e => setLinkedFunnel({ ...linkedFunnel, top_header_line_1: e.target.value })}

                                                placeholder="e.g. ⏳ সীমিত সময়ের অফার ⏳"

                                            />

                                        </div>

                                        <div className="space-y-2">

                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 2 (Highlight Bar)</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none transition-all font-semibold"

                                                value={linkedFunnel.top_header_line_2 || ''}

                                                onChange={e => setLinkedFunnel({ ...linkedFunnel, top_header_line_2: e.target.value })}

                                                placeholder="e.g. আমাদের থেকে কেন কিনবেন ?"

                                            />

                                        </div>

                                        <div className="space-y-2">

                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 3 (Why Buy Title)</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none transition-all font-semibold"

                                                value={linkedFunnel.top_header_line_3 || ''}

                                                onChange={e => setLinkedFunnel({ ...linkedFunnel, top_header_line_3: e.target.value })}

                                                placeholder="e.g. কেন আমাদের পণ্যটি নিবেন?"

                                            />

                                        </div>

                                        <div className="space-y-2">

                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 4 (Brand Tagline)</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none transition-all font-semibold"

                                                value={linkedFunnel.top_header_line_4 || ''}

                                                onChange={e => setLinkedFunnel({ ...linkedFunnel, top_header_line_4: e.target.value })}

                                                placeholder="e.g. SIGN OF MODESTY — ELEGANT COLLECTION"

                                            />

                                        </div>

                                    </div>

                                    <div className="space-y-2">

                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Why Buy Checklist / Features (One per line)</label>

                                        <textarea

                                            rows={6}

                                            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none transition-all font-medium custom-scrollbar"

                                            value={linkedFunnel.features_list || ''}

                                            onChange={e => setLinkedFunnel({ ...linkedFunnel, features_list: e.target.value })}

                                            placeholder="১ বছরের অফিসিয়াল মেশিন ওয়ারেন্টি&#10;ওয়াটার রেসিস্টেন্ট&#10;১০০% জেনুইন লেদার বেল্ট"

                                        />

                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Each line entered here will dynamically output as a neat bullet point with an orange/green checkmark on your funnel page, replacing the template's default static list.</p>

                                    </div>

                                </div>

                            </div>

                        )}



                        <div className="p-6">

                            <label className="block text-sm font-bold text-zinc-700 mb-4 flex items-center gap-2">

                                <Plus size={16} className="text-zinc-400" />

                                Sales Features (Short Description)

                            </label>

                            <div className="h-64 rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-colors bg-zinc-50 mb-8">

                                <ReactQuill

                                    theme="snow"

                                    value={formData.short_description}

                                    onChange={handleShortDescriptionChange}

                                    modules={shortQuillModules}

                                    className="h-full border-none"

                                />

                            </div>



                            <div className="space-y-6">

                                <Reorder.Group axis="y" values={funnelSections} onReorder={setFunnelSections} className="space-y-4">

                                    {funnelSections.map((section, index) => (

                                        <Reorder.Item key={section.id || `temp-${index}`} value={section}>

                                            <div className="group bg-white rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-400 hover:shadow-md transition-all overflow-hidden">

                                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-100">

                                                    {/* Drag Handle & Media */}

                                                    <div className="w-full md:w-48 bg-zinc-50 flex-shrink-0 relative">

                                                        <div className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing p-1 bg-white/80 backdrop-blur rounded shadow-sm text-zinc-400 hover:text-zinc-900">

                                                            <GripVertical size={16} />

                                                        </div>

                                                        <div className="aspect-square relative group/media overflow-hidden">

                                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/5 group-hover/media:bg-zinc-900/10 transition-colors">

                                                                {section.preview ? (

                                                                    <img src={getMediaUrl(section.preview)} className="w-full h-full object-cover" alt="" />

                                                                ) : (

                                                                    <ImageIcon size={32} className="text-zinc-300" />

                                                                )}

                                                            </div>

                                                            <div className="absolute inset-0 opacity-0 group-hover/media:opacity-100 transition-opacity flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-[2px] gap-2">

                                                                <input

                                                                    type="file"

                                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"

                                                                    accept="image/*"

                                                                    multiple

                                                                    onChange={(e) => handleFunnelSectionImageChange(index, e)}

                                                                />

                                                                <Upload size={20} className="text-white" />

                                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</span>

                                                            </div>

                                                        </div>

                                                    </div>



                                                    {/* Simplified Info & Delete Action */}

                                                    <div className="flex-1 p-6 flex items-center justify-between">

                                                        <div>

                                                            <h5 className="text-sm font-black text-zinc-900">Review Image Slide #{index + 1}</h5>

                                                            <p className="text-xs text-zinc-400 mt-1 font-semibold">Upload customer review screenshots or chats. You can drag and drop to reorder.</p>

                                                        </div>

                                                        <button

                                                            type="button"

                                                            onClick={() => removeFunnelSection(index)}

                                                            className="p-3 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"

                                                        >

                                                            <Trash2 size={20} />

                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </Reorder.Item>

                                    ))}

                                </Reorder.Group>



                                {funnelSections.length === 0 && (

                                    <div className="text-center py-16 bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">

                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-zinc-300">

                                            <Layout size={32} />

                                        </div>

                                        <h4 className="text-zinc-900 font-black text-lg">No Reviews Added</h4>

                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2">Add review screenshots, chat conversations, and quotes to showcase customer trust as an auto-scrolling carousel.</p>

                                        <button

                                            type="button"

                                            onClick={addFunnelSection}

                                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-[#3a5bd9] text-white rounded-2xl text-sm font-bold transition-all shadow-lg"

                                        >

                                            <Plus size={18} /> Add Review Screenshot

                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                </div>



                {/* Right Column: Settings */}

                <div className="space-y-6">

                    {/* Status */}

                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 space-y-4">

                        <label className="flex items-center space-x-3 cursor-pointer">

                            <input

                                type="checkbox"

                                name="is_active"

                                checked={formData.is_active}

                                onChange={handleChange}

                                className="h-5 w-5 text-zinc-900 rounded border-zinc-300 focus:ring-brand transition-colors"

                            />

                            <span className="font-medium text-zinc-900">Active (Visible)</span>

                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">

                            <input

                                type="checkbox"

                                name="show_specifications"

                                checked={formData.show_specifications}

                                onChange={handleChange}

                                className="h-5 w-5 text-zinc-900 rounded border-zinc-300 focus:ring-brand transition-colors"

                            />

                            <span className="font-medium text-zinc-900">Show Specifications Tab</span>

                        </label>

                    </div>



                    {/* Main Image */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <div className="flex justify-between items-center mb-2">

                            <label className="block text-sm font-medium text-zinc-700">Main Image (Thumbnail)</label>

                            <button

                                type="button"

                                onClick={() => {

                                    setGalleryTarget('thumbnail');

                                    setMediaModalOpen(true);

                                }}

                                className="text-[10px] font-bold uppercase tracking-wider text-brand hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1 font-semibold"

                            >

                                <ImageIcon size={12} /> Gallery

                            </button>

                        </div>

                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer relative bg-zinc-50/50">

                            <input type="file" onChange={handleThumbnailChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />

                            {thumbnailPreview ? (

                                <img src={getMediaUrl(thumbnailPreview)} alt="Preview" className="h-48 w-full object-contain mx-auto rounded-lg" />

                            ) : (

                                <div className="py-8 text-zinc-400">

                                    <ImageIcon className="mx-auto mb-3 text-zinc-300" size={32} />

                                    <span className="text-sm font-medium">Click to upload Main Image</span>

                                </div>

                            )}

                        </div>

                    </div>



                    {/* Gallery Images */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <div className="flex justify-between items-center mb-2">

                            <label className="block text-sm font-medium text-zinc-700">Gallery Images</label>

                            <button

                                type="button"

                                onClick={() => {

                                    setGalleryTarget('gallery_image');

                                    setMediaModalOpen(true);

                                }}

                                className="text-[10px] font-bold uppercase tracking-wider text-brand hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1 font-semibold"

                            >

                                <ImageIcon size={12} /> Gallery

                            </button>

                        </div>

                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer relative bg-zinc-50/50 mb-4">

                            <input type="file" onChange={handleGalleryChange} multiple className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />

                            <div className="py-4 text-zinc-400">

                                <Upload className="mx-auto mb-3 text-zinc-300" size={28} />

                                <span className="text-sm font-medium">Add Gallery Images</span>

                            </div>

                        </div>

                        {(galleryPreviews.length > 0 || existingGalleryImages.length > 0) && (

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

                                {existingGalleryImages.map((img, i) => (

                                    <div key={`existing-${img.id || i}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2 flex flex-col gap-2">

                                        <div className="relative h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white">

                                            <img src={getMediaUrl(img.image || img)} alt="" className="h-full w-full object-contain" />

                                            {img.id && (

                                                <button

                                                    type="button"

                                                    onClick={() => handleRemoveExistingGalleryImage(img.id, i)}

                                                    className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"

                                                    title="Delete Image"

                                                >

                                                    <X size={14} />

                                                </button>

                                            )}

                                        </div>

                                        <select

                                            value={img.color || ''}

                                            onChange={(e) => handleExistingGalleryImageColorChange(img.id, i, e.target.value)}

                                            className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white"

                                        >

                                            <option value="">No Color</option>

                                            {availableColors.map(c => (

                                                <option key={c.id} value={c.id}>{c.name}</option>

                                            ))}

                                        </select>

                                    </div>

                                ))}

                                {galleryImagesFromLibrary.map((img, idx) => (
                                    <div key={`lib-img-${idx}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2 flex flex-col gap-2">
                                        <div className="relative h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                            <img src={img.url} alt="" className="h-full w-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGalleryImagesFromLibrary(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-brand text-white text-[9px] text-center p-0.5 opacity-90 uppercase tracking-widest font-black z-10">
                                                Gallery
                                            </div>
                                        </div>
                                        <select
                                            value={img.color || ''}
                                            onChange={(e) => {
                                                const newColor = e.target.value;
                                                setGalleryImagesFromLibrary(prev => prev.map((item, i) => i === idx ? { ...item, color: newColor || null } : item));
                                            }}
                                            className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white font-semibold"
                                        >
                                            <option value="">No Color</option>
                                            {availableColors.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {galleryPreviews.map((img, idx) => (

                                    <div key={`new-${idx}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2 flex flex-col gap-2">

                                        <div className="relative h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white">

                                            <img src={getMediaUrl(img.url)} alt="" className="h-full w-full object-contain" />

                                            <button

                                                type="button"

                                                onClick={() => removeGalleryImage(idx)}

                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"

                                            >

                                                <X size={14} />

                                            </button>

                                            <div className="absolute inset-x-0 bottom-0 bg-blue-500 text-white text-[10px] text-center p-0.5 opacity-90">

                                                New

                                            </div>

                                        </div>

                                        <select

                                            value={img.color || ''}

                                            onChange={(e) => updateNewGalleryImageColor(idx, e.target.value)}

                                            className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white"

                                        >

                                            <option value="">No Color</option>

                                            {availableColors.map(c => (

                                                <option key={c.id} value={c.id}>{c.name}</option>

                                            ))}

                                        </select>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>



                    {/* Video Gallery */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">

                        <div className="flex justify-between items-center mb-2">

                            <label className="block text-sm font-medium text-zinc-700">Video Gallery</label>

                            <button

                                type="button"

                                onClick={() => {

                                    setGalleryTarget('gallery_video');

                                    setMediaModalOpen(true);

                                }}

                                className="text-[10px] font-bold uppercase tracking-wider text-brand hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1 font-semibold"

                            >

                                <Video size={12} /> Gallery

                            </button>

                        </div>

                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer relative bg-zinc-50/50 mb-4">

                            <input type="file" onChange={handleVideoChange} multiple className="absolute inset-0 opacity-0 cursor-pointer" accept="video/*" />

                            <div className="py-4 text-zinc-400">

                                <Upload className="mx-auto mb-3 text-zinc-300" size={28} />

                                <span className="text-sm font-medium">Add Product Videos</span>

                            </div>

                        </div>

                        {(galleryVideoPreviews.length > 0 || existingGalleryVideos.length > 0) && (

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                {existingGalleryVideos.map((vid, i) => (

                                    <div key={`existing-vid-${vid.id || i}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2">

                                        <div className="relative h-32 rounded-lg overflow-hidden flex-shrink-0 bg-black">

                                            <video src={getMediaUrl(vid.video || vid)} className="h-full w-full object-contain" controls />

                                            <button

                                                type="button"

                                                onClick={() => handleRemoveExistingVideo(vid.id, i)}

                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"

                                                title="Delete Video"

                                            >

                                                <X size={14} />

                                            </button>

                                        </div>

                                    </div>

                                ))}

                                {galleryVideosFromLibrary.map((vidUrl, idx) => (
                                    <div key={`lib-vid-${idx}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2">
                                        <div className="relative h-32 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                                            <video src={vidUrl} className="h-full w-full object-contain" controls />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGalleryVideosFromLibrary(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-brand text-white text-[9px] text-center p-0.5 opacity-90 uppercase tracking-widest font-black z-10">
                                                Gallery
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {galleryVideoPreviews.map((vid, idx) => (

                                    <div key={`new-vid-${idx}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2">

                                        <div className="relative h-32 rounded-lg overflow-hidden flex-shrink-0 bg-black">

                                            <video src={getMediaUrl(vid.url)} className="h-full w-full object-contain" controls />

                                            <button

                                                type="button"

                                                onClick={() => removeGalleryVideo(idx)}

                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"

                                            >

                                                <X size={14} />

                                            </button>

                                            <div className="absolute inset-x-0 bottom-0 bg-blue-500 text-white text-[10px] text-center p-0.5 opacity-90">

                                                New

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                        <p className="text-[10px] text-zinc-400 mt-2">Recommended: mp4, webm under 10MB</p>

                    </div>



                    {/* Organization */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5">

                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Organization</h3>

                        <div ref={categoryRef} className="relative">

                            <label className="block text-sm font-medium text-zinc-700 mb-2">Category</label>

                            <button
                                type="button"
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand/5 outline-none transition-all flex justify-between items-center text-left"
                            >
                                <span className="truncate text-zinc-700 font-semibold">
                                    {formData.categories.length > 0
                                        ? categories.filter((c: any) => formData.categories.includes(c.id)).map((c: any) => c.name).join(', ')
                                        : 'Select Categories'}
                                </span>
                                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showCategoryDropdown && (
                                <div className="absolute left-0 right-0 z-30 mt-2 p-3 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto space-y-2">
                                    {(() => {
                                        const categoryMap: any = {};
                                        const roots: any[] = [];

                                        categories.forEach((cat: any) => {
                                            categoryMap[cat.id] = { ...cat, children: [] };
                                        });

                                        categories.forEach((cat: any) => {
                                            if (cat.parent) {
                                                if (categoryMap[cat.parent]) {
                                                    categoryMap[cat.parent].children.push(categoryMap[cat.id]);
                                                }
                                            } else {
                                                roots.push(categoryMap[cat.id]);
                                            }
                                        });

                                        const flatList: any[] = [];
                                        const traverse = (nodes: any[], depth = 0) => {
                                            nodes.forEach(node => {
                                                flatList.push({
                                                    id: node.id,
                                                    name: node.name,
                                                    depth: depth
                                                });
                                                if (node.children && node.children.length > 0) {
                                                    traverse(node.children, depth + 1);
                                                }
                                            });
                                        };
                                        traverse(roots);

                                        return flatList.map(cat => {
                                            const isChecked = formData.categories.includes(cat.id);
                                            return (
                                                <label 
                                                    key={cat.id} 
                                                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                                                    style={{ paddingLeft: `${cat.depth * 16 + 8}px` }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            const newCats: any = isChecked
                                                                ? formData.categories.filter((id: any) => id !== cat.id)
                                                                : [...formData.categories, cat.id];
                                                            setFormData(prev => ({ ...prev, categories: newCats }));
                                                        }}
                                                        className="h-4 w-4 rounded border-zinc-300 text-brand focus:ring-brand/30"
                                                    />
                                                    <span className={`${cat.depth === 0 ? 'font-bold text-zinc-900' : 'text-zinc-600 font-medium'}`}>
                                                        {cat.name}
                                                    </span>
                                                </label>
                                            );
                                        });
                                    })()}
                                </div>
                            )}

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-zinc-700 mb-2">Brand</label>

                            <select

                                name="brand"

                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none"

                                value={formData.brand}

                                onChange={handleChange}

                            >

                                <option value="">Select Brand</option>

                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}

                            </select>

                        </div>

                    </div>



                    {/* Variants */}

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5">

                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Variants</h3>

                        <div>

                            <div className="flex justify-between items-center mb-2">

                                <label className="block text-sm font-medium text-zinc-700">Colors</label>

                                <button

                                    type="button"

                                    onClick={() => {

                                        setShowColorModal(true);

                                        // Default to main image, or first existing gallery, or first new gallery

                                        let defaultImg = thumbnailPreview;

                                        if (!defaultImg && existingGalleryImages.length > 0) defaultImg = existingGalleryImages[0].image || existingGalleryImages[0];

                                        if (!defaultImg && galleryPreviews.length > 0) defaultImg = galleryPreviews[0].url;



                                        setColorPickerImage(defaultImg);

                                    }}

                                    className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded hover:bg-zinc-200 transition-colors"

                                >

                                    <Plus size={14} /> Add Color

                                </button>

                            </div>



                            <div className="flex flex-wrap gap-2 min-h-[4.5rem] p-4 border border-zinc-200 rounded-xl bg-zinc-50/50">

                                {availableColors.filter(c => formData.colors.includes(c.id)).map(c => {

                                    return (

                                        <button

                                            key={c.id}

                                            type="button"

                                            onClick={() => {

                                                const newColors = formData.colors.filter(id => id !== c.id);

                                                setFormData(prev => ({ ...prev, colors: newColors }));

                                            }}

                                            className="h-8 w-8 rounded-full border-2 border-blue-600 ring-2 ring-blue-100 transition relative group"

                                            style={{ backgroundColor: c.hex_code || c.name }}

                                            title={`Remove ${c.name}`}

                                        >

                                            <span className="sr-only">{c.name}</span>

                                            <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md opacity-100 group-hover:opacity-0 transition-opacity">

                                                <CheckCircle size={14} />

                                            </span>

                                            <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">

                                                <X size={14} />

                                            </span>

                                        </button>

                                    );

                                })}

                                {formData.colors.length === 0 && <span className="text-sm text-gray-500 w-full flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-zinc-300"></div> No colors selected. Add one to start tracking color variants.</span>}

                            </div>

                        </div>



                        {/* Color Modal */}

                        {showColorModal && (

                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-zinc-200">

                                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Select or Add Color</h3>



                                    <div className="mb-6 space-y-3">

                                        <label className="block text-sm font-medium text-zinc-700">Select Existing Color</label>

                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-zinc-200 rounded-xl bg-zinc-50">

                                            {availableColors.filter(c => !formData.colors.includes(c.id)).map(c => (

                                                <button

                                                    key={c.id}

                                                    type="button"

                                                    onClick={() => {

                                                        if (!formData.colors.includes(c.id)) {

                                                            setFormData(prev => ({ ...prev, colors: [...prev.colors, c.id] }));

                                                        }

                                                        // Auto-associate with the image used for picking

                                                        associateColorWithImage(c.id, colorPickerImage);

                                                        setShowColorModal(false);

                                                    }}

                                                    className="h-8 w-8 rounded-full border-2 border-zinc-200 hover:border-zinc-400 hover:scale-110 transition relative group"

                                                    style={{ backgroundColor: c.hex_code || c.name }}

                                                    title={`Add ${c.name}`}

                                                >

                                                    <span className="sr-only">{c.name}</span>

                                                </button>

                                            ))}

                                            {availableColors.filter(c => !formData.colors.includes(c.id)).length === 0 && (

                                                <span className="text-xs text-zinc-400">All available colors are selected.</span>

                                            )}

                                        </div>

                                    </div>



                                    <div className="flex items-center gap-4 mb-6">

                                        <div className="flex-1 h-px bg-zinc-200"></div>

                                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">OR CREATE NEW</span>

                                        <div className="flex-1 h-px bg-zinc-200"></div>

                                    </div>



                                    <div className="space-y-5">

                                        {(thumbnailPreview || galleryPreviews.length > 0 || existingGalleryImages.length > 0) && (

                                            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center">

                                                <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Pick from Image</p>



                                                {/* Image Selector */}

                                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 justify-center px-2">

                                                    {thumbnailPreview && (

                                                        <img

                                                            src={thumbnailPreview}

                                                            onClick={() => setColorPickerImage(thumbnailPreview)}

                                                            className={`h-12 w-12 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${colorPickerImage === thumbnailPreview ? 'border-blue-500' : 'border-transparent'}`}

                                                            title="Main Image"

                                                            alt="main"

                                                        />

                                                    )}

                                                    {/* Existing Gallery Images */}

                                                    {existingGalleryImages.map((img, i) => {

                                                        const imgSrc = img.image || img;

                                                        return (

                                                            <img

                                                                key={`existing-${img.id || i}`}

                                                                src={imgSrc}

                                                                onClick={() => setColorPickerImage(imgSrc)}

                                                                className={`h-12 w-12 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${colorPickerImage === imgSrc ? 'border-blue-500' : 'border-transparent'}`}

                                                                title={`Gallery Image`}

                                                                alt="gallery"

                                                            />

                                                        );

                                                    })}

                                                    {/* New Gallery Previews */}

                                                    {galleryImagesFromLibrary.map((img, idx) => (
                                    <div key={`lib-img-${idx}`} className="relative group bg-zinc-50 border border-zinc-200 rounded-xl p-2 flex flex-col gap-2">
                                        <div className="relative h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                                            <img src={img.url} alt="" className="h-full w-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGalleryImagesFromLibrary(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="absolute top-1 right-1 bg-brand/90 hover:bg-brand text-white rounded-full p-1 opacity-100 transition-all shadow-sm z-10"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-0 bg-brand text-white text-[9px] text-center p-0.5 opacity-90 uppercase tracking-widest font-black z-10">
                                                Gallery
                                            </div>
                                        </div>
                                        <select
                                            value={img.color || ''}
                                            onChange={(e) => {
                                                const newColor = e.target.value;
                                                setGalleryImagesFromLibrary(prev => prev.map((item, i) => i === idx ? { ...item, color: newColor || null } : item));
                                            }}
                                            className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white font-semibold"
                                        >
                                            <option value="">No Color</option>
                                            {availableColors.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                                {galleryPreviews.map((img, idx) => (

                                                        <img

                                                            key={`new-${idx}`}

                                                            src={img.url}

                                                            onClick={() => setColorPickerImage(img.url)}

                                                            className={`h-12 w-12 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${colorPickerImage === img.url ? 'border-blue-500' : 'border-transparent'}`}

                                                            title={`New Gallery Image ${idx + 1}`}

                                                            alt="new-gallery"

                                                        />

                                                    ))}

                                                </div>



                                                <div className="flex justify-center gap-4 items-center">

                                                    <img

                                                        id="preview-img-for-color"

                                                        src={colorPickerImage || thumbnailPreview || (existingGalleryImages[0]?.image || existingGalleryImages[0]) || (galleryPreviews[0]?.url)}

                                                        className="h-24 w-auto object-contain bg-white border"

                                                        crossOrigin="anonymous"

                                                        alt="preview"

                                                    />

                                                    <button

                                                        type="button"

                                                        onClick={(e) => {

                                                            const img = document.getElementById('preview-img-for-color') as any;

                                                            if (!img) return;

                                                            const canvas = document.createElement('canvas');

                                                            canvas.width = img.naturalWidth;

                                                            canvas.height = img.naturalHeight;

                                                            const ctx = canvas.getContext('2d');

                                                            if (!ctx) return;

                                                            ctx.drawImage(img, 0, 0);

                                                            // Center pixel

                                                            const p = ctx.getImageData(img.naturalWidth / 2, img.naturalHeight / 2, 1, 1).data;

                                                            const hex = "#" + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

                                                            setNewColor(prev => ({ ...prev, hex_code: hex, name: '' }));

                                                        }}

                                                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"

                                                    >

                                                        ✨ Auto Detect

                                                    </button>

                                                </div>

                                            </div>

                                        )}



                                        <div>

                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Color Name</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                                value={newColor.name}

                                                onChange={e => setNewColor(prev => ({ ...prev, name: e.target.value }))}

                                                placeholder="e.g. Midnight Blue"

                                            />

                                        </div>

                                        <div>

                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Color Code (Hex)</label>

                                            <div className="flex gap-2">

                                                <input

                                                    type="color"

                                                    className="h-11 w-11 p-1 rounded-xl cursor-pointer border border-zinc-200 bg-zinc-50"

                                                    value={newColor.hex_code}

                                                    onChange={e => setNewColor(prev => ({ ...prev, hex_code: e.target.value }))}

                                                />

                                                <input

                                                    type="text"

                                                    className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none uppercase placeholder:text-zinc-400"

                                                    value={newColor.hex_code}

                                                    onChange={e => setNewColor(prev => ({ ...prev, hex_code: e.target.value }))}

                                                    placeholder="#000000"

                                                />

                                            </div>

                                        </div>

                                    </div>



                                    <div className="flex gap-3 mt-8">

                                        <button

                                            type="button"

                                            onClick={() => setShowColorModal(false)}

                                            className="flex-1 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-xl transition-colors"

                                        >

                                            Cancel

                                        </button>

                                        <button

                                            type="button"

                                            onClick={handleCreateColor}

                                            className="flex-1 py-2.5 bg-brand text-white rounded-xl hover:bg-black font-semibold shadow-sm transition-colors"

                                        >

                                            Save Color

                                        </button>

                                    </div>

                                </div>

                            </div>

                        )}

                        <div ref={sizeRef} className="relative">

                            <div className="flex justify-between items-center mb-2 mt-6 border-t border-zinc-100 pt-6">

                                <label className="block text-sm font-medium text-zinc-700">Sizes</label>

                                <button

                                    type="button"

                                    onClick={() => setShowSizeModal(true)}

                                    className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded hover:bg-zinc-200 transition-colors"

                                >

                                    <Plus size={14} /> Add Size

                                </button>

                            </div>

                            <button
                                type="button"
                                onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand/5 outline-none transition-all flex justify-between items-center text-left"
                            >
                                <span className="truncate text-zinc-700 font-semibold">
                                    {formData.sizes.length > 0
                                        ? availableSizes.filter((s: any) => formData.sizes.includes(s.id)).map((s: any) => s.name).join(', ')
                                        : 'Select Sizes'}
                                </span>
                                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showSizeDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showSizeDropdown && (
                                <div className="absolute left-0 right-0 z-30 mt-2 p-3 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto space-y-1">
                                    {availableSizes.map((s: any) => {
                                        const isChecked = formData.sizes.includes(s.id);
                                        return (
                                            <label 
                                                key={s.id} 
                                                className="flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-100 rounded-lg cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        const newSizes: any = isChecked
                                                            ? formData.sizes.filter((id: any) => id !== s.id)
                                                            : [...formData.sizes, s.id];
                                                        setFormData(prev => ({ ...prev, sizes: newSizes }));
                                                    }}
                                                    className="h-4 w-4 rounded border-zinc-300 text-brand focus:ring-brand/30"
                                                />
                                                <span className="font-semibold text-zinc-700">{s.name}</span>
                                            </label>
                                        );
                                    })}
                                    {availableSizes.length === 0 && (
                                        <p className="text-xs text-zinc-400 p-2">No sizes available.</p>
                                    )}
                                </div>
                            )}

                        </div>



                        {/* Size Modal */}

                        {showSizeModal && (

                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-zinc-200">

                                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Create New Size</h3>

                                    

                                    <div className="space-y-5">

                                        <div>

                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Size Name / Value</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                                value={newSize.name}

                                                onChange={e => setNewSize({ ...newSize, name: e.target.value })}

                                                placeholder="e.g. Extra Large, 42"

                                                autoFocus

                                            />

                                        </div>

                                        <div>

                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Size Code (Optional)</label>

                                            <input

                                                type="text"

                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-colors outline-none placeholder:text-zinc-400"

                                                value={newSize.code}

                                                onChange={e => setNewSize({ ...newSize, code: e.target.value })}

                                                placeholder="e.g. XL, 42"

                                            />

                                        </div>

                                    </div>



                                    <div className="flex gap-3 mt-8">

                                        <button

                                            type="button"

                                            onClick={() => setShowSizeModal(false)}

                                            className="flex-1 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-xl transition-colors"

                                        >

                                            Cancel

                                        </button>

                                        <button

                                            type="button"

                                            onClick={handleCreateSize}

                                            className="flex-1 py-2.5 bg-brand text-white rounded-xl hover:bg-black font-semibold shadow-sm transition-colors"

                                        >

                                            Save Size

                                        </button>

                                    </div>

                                </div>

                            </div>

                        )}

                    </div>



                    <button

                        type="submit"

                        disabled={loading}

                        className="w-full bg-brand hover:bg-[#3a5bd9] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"

                    >

                        {loading ? 'Saving...' : (

                            <>

                                <Save size={18} /> Save Product

                            </>

                        )}

                    </button>

                </div>

            </form>

            {/* Media Selector Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col font-sans text-left">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <div>
                                <h3 className="text-base font-black text-zinc-950 tracking-tight">
                                    Choose <span className="text-brand">
                                        {galleryTarget === 'thumbnail' ? 'Main Image' : galleryTarget === 'gallery_image' ? 'Gallery Image' : 'Gallery Video'}
                                    </span>
                                </h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Select or upload your product asset</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setMediaModalOpen(false);
                                    setGalleryTarget(null);
                                }}
                                className="p-1.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-zinc-100 bg-zinc-50/30 px-6 py-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('upload')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeModalTab === 'upload' 
                                    ? 'bg-brand text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900 bg-transparent'}`}
                            >
                                <Upload size={12} />
                                <span>Upload From Computer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('library')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeModalTab === 'library' 
                                    ? 'bg-brand text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900 bg-transparent'}`}
                            >
                                <ImageIcon size={12} />
                                <span>Choose From Media Library</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-grow overflow-y-auto p-6 min-h-[400px]">
                            {activeModalTab === 'upload' ? (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-brand rounded-2xl p-12 transition-all min-h-[300px] text-center bg-zinc-50/20 group">
                                    <div className="p-4 bg-zinc-100 rounded-full group-hover:bg-brand/10 transition-colors duration-300 mb-4 text-zinc-400 group-hover:text-brand">
                                        {uploadingImage ? <RefreshCw size={36} className="animate-spin" /> : <Upload size={36} />}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-900">
                                        {uploadingImage ? 'Uploading Asset...' : 'Upload File'}
                                    </h4>
                                    <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                                        Click the button below to browse your computer files and upload your asset directly.
                                    </p>
                                    
                                    <input 
                                        type="file" 
                                        id="product-local-image-input" 
                                        className="hidden" 
                                        accept={galleryTarget === 'gallery_video' ? 'video/*' : 'image/*'}
                                        onChange={handleLocalImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('product-local-image-input')?.click()}
                                        disabled={uploadingImage}
                                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md cursor-pointer"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <MediaManager 
                                        selectMode={true}
                                        onSelect={(url) => handleGallerySelect(url)}
                                        onSelectMultiple={(urls) => handleGallerySelectMultiple(urls)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>

    );

};



export default ProductForm;

