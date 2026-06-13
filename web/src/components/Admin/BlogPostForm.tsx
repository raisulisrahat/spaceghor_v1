import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Save, X, Image as ImageIcon, Upload, AlignLeft, AlignCenter, AlignRight, Trash2, RefreshCw } from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import MediaManager from './MediaManager';

// Register custom image blot to support styling (width, height, alignment) in Quill
const ImageBlot = Quill.import('formats/image') as any;
class CustomImageBlot extends ImageBlot {
    static blotName = 'image';
    static tagName = 'img';

    static create(value: any) {
        const node = super.create(value);
        if (typeof value === 'object') {
            if (value.src) node.setAttribute('src', value.src);
            if (value.width) {
                node.setAttribute('width', value.width);
                node.style.width = value.width;
            }
            if (value.style) node.setAttribute('style', value.style);
        }
        return node;
    }

    static value(domNode: any) {
        const value = super.value(domNode);
        return {
            src: typeof value === 'string' ? value : domNode.getAttribute('src'),
            width: domNode.getAttribute('width') || domNode.style.width || null,
            style: domNode.getAttribute('style') || null
        };
    }

    format(name: string, value: any) {
        if (name === 'width') {
            if (value) {
                this.domNode.setAttribute('width', value);
                this.domNode.style.width = value;
            } else {
                this.domNode.removeAttribute('width');
                this.domNode.style.width = '';
            }
        } else if (name === 'style') {
            if (value) {
                this.domNode.setAttribute('style', value);
            } else {
                this.domNode.removeAttribute('style');
            }
        } else {
            super.format(name, value);
        }
    }
}
Quill.register(CustomImageBlot, true);

import { useAuth } from '../../context/AuthContext';

const BlogPostForm = ({ post, onSave, onCancel }) => {
    const { token } = useAuth();
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: '',
        content: '',
        is_published: true
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const quillRef = useRef(null);
    const [selectedImgEl, setSelectedImgEl] = useState(null);
    const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });
    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'upload' | 'library'>('upload');
    const [galleryTarget, setGalleryTarget] = useState<'featured' | 'editor' | null>(null);

    const handleGallerySelect = (url: string) => {
        if (galleryTarget === 'featured') {
            setSelectedImage(url);
            setImagePreview(url);
        } else {
            if (quillRef.current) {
                const editor = (quillRef.current as any).getEditor();
                const range = editor.getSelection(true);
                editor.insertEmbed(range.index, 'image', {
                    src: url,
                    width: '100%',
                    style: 'display: block; margin-left: auto; margin-right: auto;'
                });
                editor.setSelection(range.index + 1);
                setFormData(prev => ({ ...prev, content: editor.root.innerHTML }));
            }
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
            console.error("Local upload in editor error:", error);
            alert("Failed to upload local image.");
        } finally {
            setUploadingImage(false);
        }
    };

    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}],
                ['link', 'image', 'clean'],
            ],
            handlers: {
                image: () => {
                    setGalleryTarget('editor');
                    setMediaModalOpen(true);
                }
            }
        },
        clipboard: {
            matchVisual: false,
        }
    }), []);

    useEffect(() => {
        const handleDocumentClick = (e) => {
            const target = e.target;
            const qlEditor = target.closest('.ql-editor');
            
            if (target.tagName === 'IMG' && qlEditor) {
                e.preventDefault();
                e.stopPropagation();
                setSelectedImgEl(target);
                
                // Calculate position for the floating toolbar relative to the ql-editor container
                const rect = target.getBoundingClientRect();
                const containerEl = document.querySelector('.editor-container-root');
                if (containerEl) {
                    const parentRect = containerEl.getBoundingClientRect();
                    setImgToolbarPos({
                        top: rect.top - parentRect.top - 50,
                        left: rect.left - parentRect.left + (rect.width / 2) - 160
                    });
                }
            } else {
                if (target.closest('.img-resize-toolbar')) {
                    return;
                }
                setSelectedImgEl(null);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    useEffect(() => {
        if (selectedImgEl) {
            selectedImgEl.style.outline = '3px solid #5173FB';
            selectedImgEl.style.outlineOffset = '2px';
            selectedImgEl.style.cursor = 'pointer';
            
            return () => {
                selectedImgEl.style.outline = '';
                selectedImgEl.style.outlineOffset = '';
            };
        }
    }, [selectedImgEl]);

    const resizeImage = (width) => {
        if (!selectedImgEl) return;
        selectedImgEl.style.width = width;
        selectedImgEl.style.height = 'auto';
        selectedImgEl.setAttribute('width', width);
        
        // Trigger ReactQuill onChange
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const blot = Quill.find(selectedImgEl) as any;
            if (blot) {
                blot.format('width', width);
                blot.format('style', selectedImgEl.getAttribute('style'));
            }
            handleChange({ target: { name: 'content', value: editor.root.innerHTML } });
        }
    };

    const alignImage = (align) => {
        if (!selectedImgEl) return;
        if (align === 'left') {
            selectedImgEl.style.display = 'block';
            selectedImgEl.style.marginLeft = '0';
            selectedImgEl.style.marginRight = 'auto';
        } else if (align === 'center') {
            selectedImgEl.style.display = 'block';
            selectedImgEl.style.marginLeft = 'auto';
            selectedImgEl.style.marginRight = 'auto';
        } else if (align === 'right') {
            selectedImgEl.style.display = 'block';
            selectedImgEl.style.marginLeft = 'auto';
            selectedImgEl.style.marginRight = '0';
        }
        
        // Trigger ReactQuill onChange
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const blot = Quill.find(selectedImgEl) as any;
            if (blot) {
                blot.format('style', selectedImgEl.getAttribute('style'));
            }
            handleChange({ target: { name: 'content', value: editor.root.innerHTML } });
        }
    };

    const deleteImage = () => {
        if (!selectedImgEl) return;
        selectedImgEl.remove();
        setSelectedImgEl(null);
        
        // Trigger ReactQuill onChange
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            handleChange({ target: { name: 'content', value: editor.root.innerHTML } });
        }
    };

    const handleWidthPercentChange = (e) => {
        const val = e.target.value;
        resizeImage(`${val}%`);
    };

    const getCurrentImageWidthPercent = () => {
        if (!selectedImgEl) return 100;
        const w = selectedImgEl.style.width || selectedImgEl.getAttribute('width') || '100';
        const parsed = parseInt(w);
        return isNaN(parsed) ? 100 : parsed;
    };

    useEffect(() => {
        // Fetch categories for the dropdown
        const fetchCategories = async () => {
            try {
                const response = await api.get('blog-categories/');
                setCategories(response.data.results || response.data);
            } catch (err) {
                console.error("Failed to fetch blog categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title || '',
                slug: post.slug || '',
                category: post.category || '',
                content: post.content || '',
                is_published: post.is_published !== undefined ? post.is_published : true
            });
            if (post.image) {
                setImagePreview(post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`);
            }
        }
    }, [post]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));

        // Auto-generate slug from title if it's empty or we're creating a new post
        if (name === 'title' && (!post || !formData.slug)) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Image size must be less than 2MB");
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                let value = formData[key];
                // Clean up content: remove non-breaking spaces that can cause display issues
                if (key === 'content' && typeof value === 'string') {
                    value = value.replace(/&nbsp;/g, ' ');
                }
                submitData.append(key, value);
            }
        });

        if (selectedImage) {
            submitData.append('image', selectedImage);
        }

        try {
            if (post) {
                await api.patch(`blog-posts/${post.slug}/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('blog-posts/', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSave();
        } catch (error: any) {
            console.error('Error saving post:', error.response?.data || error);
            alert('Failed to save post.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {post ? 'Edit' : 'Create'} <span className="text-brand">Blog Post</span>
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Post Configuration</p>
                </div>
                <button onClick={onCancel} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-90">
                    <X size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
                {error && (
                    <div className="mb-5 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[11px] font-medium flex items-center gap-2">
                        <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></div>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                Post Title <span className="text-brand font-black">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                placeholder="Enter post title..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                Post Content <span className="text-brand font-black">*</span>
                            </label>
                            <div className="prose-sm relative editor-container-root">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => handleChange({ target: { name: 'content', value: content } })}
                                    modules={modules}
                                    className="bg-white rounded-xl transition-all border-none overflow-hidden [&_.ql-toolbar]:border-zinc-200 [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-zinc-200 [&_.ql-container]:rounded-b-xl [&_.ql-editor]:text-base [&_.ql-editor]:leading-relaxed [&_.ql-editor]:min-h-[450px] shadow-sm"
                                    placeholder="Write your blog post content here..."
                                />

                                {selectedImgEl && (
                                    <div 
                                        className="img-resize-toolbar bg-zinc-950/90 text-white backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 border border-zinc-800 shadow-xl z-50 absolute transition-all duration-150"
                                        style={{ 
                                            top: `${imgToolbarPos.top}px`, 
                                            left: `${imgToolbarPos.left}px` 
                                        }}
                                    >
                                        {/* Resize Shortcuts */}
                                        <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
                                            {['25%', '50%', '75%', '100%'].map(pct => (
                                                <button
                                                    key={pct}
                                                    type="button"
                                                    onClick={() => resizeImage(pct)}
                                                    className="px-2 py-1 text-[9px] font-black tracking-wider uppercase bg-zinc-900 border border-zinc-800 hover:bg-brand hover:border-brand rounded-md transition-all active:scale-95 text-white cursor-pointer"
                                                >
                                                    {pct}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Alignment */}
                                        <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
                                            <button
                                                type="button"
                                                onClick={() => alignImage('left')}
                                                title="Align Left"
                                                className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-brand hover:border-brand rounded-md transition-all active:scale-95 text-zinc-300 hover:text-white cursor-pointer"
                                            >
                                                <AlignLeft size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => alignImage('center')}
                                                title="Align Center"
                                                className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-brand hover:border-brand rounded-md transition-all active:scale-95 text-zinc-300 hover:text-white cursor-pointer"
                                            >
                                                <AlignCenter size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => alignImage('right')}
                                                title="Align Right"
                                                className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-brand hover:border-brand rounded-md transition-all active:scale-95 text-zinc-300 hover:text-white cursor-pointer"
                                            >
                                                <AlignRight size={12} />
                                            </button>
                                        </div>

                                        {/* Width Slider */}
                                        <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Width</span>
                                            <input 
                                                type="range" 
                                                min="10" 
                                                max="100" 
                                                value={getCurrentImageWidthPercent()} 
                                                onChange={handleWidthPercentChange}
                                                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
                                            />
                                            <span className="text-[9px] font-black font-mono w-6 text-zinc-300">{getCurrentImageWidthPercent()}%</span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={deleteImage}
                                            title="Delete Image"
                                            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-rose-600 hover:border-rose-600 rounded-md transition-all active:scale-95 text-rose-400 hover:text-white cursor-pointer"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Settings Column */}
                    <div className="space-y-4">
                        {/* Status Panel */}
                        <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest leading-none">Post Status</span>
                                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${formData.is_published ? 'bg-emerald-500 text-white' : 'bg-zinc-300 text-zinc-600'}`}>
                                    {formData.is_published ? 'Live' : 'Draft'}
                                </div>
                            </div>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[9px] font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">Toggle Publish Status</span>
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_published"
                                        checked={formData.is_published}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand shadow-inner"></div>
                                </div>
                            </label>
                        </div>

                        {/* Details Panel */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                                >
                                    <option value="">Select category...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Post Slug
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-900 uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none shadow-inner"
                                    placeholder="auto-generated"
                                />
                            </div>
                        </div>

                        {/* Image Panel */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                    Featured Image
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGalleryTarget('featured');
                                        setMediaModalOpen(true);
                                    }}
                                    className="text-[9px] font-bold uppercase tracking-wider text-brand hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <ImageIcon size={11} /> Gallery
                                </button>
                            </div>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-brand transition-all flex items-center justify-center p-1"
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-md" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 opacity-100 transition-all backdrop-blur-[2px]">
                                            <div className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                                                <Upload size={12} /> Replace Image
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-400 group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                            <ImageIcon size={18} />
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-brand transition-colors">Upload Image</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            <p className="mt-2 text-[8px] font-bold text-zinc-400 uppercase tracking-tight text-right">Max file size: 2MB | PNG/JPG</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-950/10"
                    >
                        <Save size={14} />
                        {loading ? 'Saving...' : 'Save Post'}
                    </button>
                </div>
            </form>

            {/* Unified Media Selector Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <div>
                                <h3 className="text-base font-black text-zinc-950 tracking-tight">Insert <span className="text-brand">Image</span></h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Select or upload your blog asset</p>
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
                                        {uploadingImage ? 'Uploading Asset...' : 'Upload Image File'}
                                    </h4>
                                    <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                                        Click the button below to browse your computer files and upload your image directly.
                                    </p>
                                    
                                    <input 
                                        type="file" 
                                        id="local-image-input" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleLocalImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('local-image-input')?.click()}
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

export default BlogPostForm;
