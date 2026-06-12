import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../utils/api';
import { Save, X, Bell, Zap, Info, RefreshCw, Image as ImageIcon, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MediaManager from './MediaManager';

const NoticeForm = ({ notice, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        text: '',
        title: '',
        description: '',
        button_text: 'View Offer',
        button_link: '',
        display_type: 'ticker',
        is_active: true,
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'upload' | 'library'>('upload');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleGallerySelect = (url: string) => {
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
        setMediaModalOpen(false);
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

    useEffect(() => {
        if (notice) {
            setFormData({
                text: notice.text || '',
                title: notice.title || '',
                description: notice.description || '',
                button_text: notice.button_text || 'View Offer',
                button_link: notice.button_link || '',
                display_type: notice.display_type || 'ticker',
                is_active: notice.is_active !== undefined ? notice.is_active : true,
                image: null
            });
            if (notice.image) {
                setImagePreview(notice.image.startsWith('http') ? notice.image : `${BASE_URL}${notice.image}`);
            }
        }
    }, [notice]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            if (files && files[0]) {
                setFormData(prev => ({ ...prev, [name]: files[0] }));
                setImagePreview(URL.createObjectURL(files[0]));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            for (const key in formData) {
                if (key === 'image') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    } else if (typeof formData[key] === 'string' && formData[key]) {
                        data.append(key, formData[key]);
                    }
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    // Convert boolean to string "true"/"false" if needed, 
                    // though FormData.append already does this for most values.
                    data.append(key, String(formData[key]));
                }
            }

            if (notice) {
                await api.patch(`notice/${notice.id}/`, data);
            } else {
                await api.post('notice/', data);
            }
            onSave();
        } catch (err: any) {
            console.error('Error saving notice:', err.response?.data || err);
            const backendError = err.response?.data;
            if (backendError && typeof backendError === 'object') {
                const errorMsg = Object.entries(backendError)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                setError(errorMsg);
            } else {
                setError('Failed to save notice. Please check your connection.');
            }
            alert('Failed to save notice: ' + (JSON.stringify(err.response?.data) || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto">
            <div className="next-panel overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                            <Bell size={16} className="text-zinc-400" />
                            {notice ? 'Update Broadcast Protocol' : 'Initialize New Broadcast'}
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Announcement & Pop-up Configuration</p>
                    </div>
                    <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Left Column: Core Settings */}
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Display Mode</label>
                                <select 
                                    name="display_type"
                                    value={formData.display_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none"
                                >
                                    <option value="ticker">Marquee Ticker Only</option>
                                    <option value="popup">Pop-up Ad Only</option>
                                    <option value="both">Both Ticker & Pop-up</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Ticker Text / Summary</label>
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none resize-none"
                                    placeholder="Enter the ticker message..."
                                />
                            </div>

                            {(formData.display_type === 'popup' || formData.display_type === 'both') && (
                                <div className="space-y-6 pt-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Pop-up Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none"
                                            placeholder="Special Offer Title"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Pop-up Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none resize-none"
                                            placeholder="Detailed description for the pop-up..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Assets & Actions */}
                        <div className="space-y-8">
                            {(formData.display_type === 'popup' || formData.display_type === 'both') && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Pop-up Image</label>
                                            <button
                                                type="button"
                                                onClick={() => setMediaModalOpen(true)}
                                                className="text-[9px] font-bold uppercase tracking-wider text-[#5173FB] hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                                <ImageIcon size={11} /> Gallery
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <div className="aspect-video w-full bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group-hover:border-[#5173FB]/30 transition-all">
                                                {imagePreview ? (
                                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-zinc-400">
                                                        <Zap size={24} className="mb-2" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload Visual Asset</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    name="image"
                                                    onChange={handleChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Button Text</label>
                                            <input
                                                type="text"
                                                name="button_text"
                                                value={formData.button_text}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Action Link</label>
                                            <input
                                                type="text"
                                                name="button_link"
                                                value={formData.button_link}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/5 transition-all outline-none"
                                                placeholder="/products/slug"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Active Status</p>
                                        <p className="text-[9px] font-medium text-zinc-400 mt-0.5">Toggle visibility on the live site.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand shadow-inner" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-100 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-10 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand active:scale-95 transition-all shadow-xl shadow-zinc-900/10"
                        >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {loading ? 'Transmitting...' : 'Save Broadcast'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Media Selector Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <div>
                                <h3 className="text-base font-black text-zinc-950 tracking-tight">Choose <span className="text-[#5173FB]">Notice Image</span></h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Select or upload your announcement visual</p>
                            </div>
                            <button 
                                onClick={() => setMediaModalOpen(false)}
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
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-[#5173FB] rounded-2xl p-12 transition-all min-h-[300px] text-center bg-zinc-50/20 group">
                                    <div className="p-4 bg-zinc-100 rounded-full group-hover:bg-brand/10 transition-colors duration-300 mb-4 text-zinc-400 group-hover:text-[#5173FB]">
                                        {uploadingImage ? <RefreshCw size={36} className="animate-spin" /> : <Upload size={36} />}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-900">
                                        {uploadingImage ? 'Uploading Asset...' : 'Upload Image File'}
                                    </h4>
                                    <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                                        Click the button below to browse your computer files and upload your image directly.
                                    </p>
                                    
                                    <input 
                                        type="file" 
                                        id="notice-local-image-input" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleLocalImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('notice-local-image-input')?.click()}
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

export default NoticeForm;
