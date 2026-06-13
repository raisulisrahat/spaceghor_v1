import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../../services/api';
import { 
    Image as ImageIcon, Video as VideoIcon, File as FileIcon, Trash2, 
    Copy, ExternalLink, Plus, Search, Grid, List, Upload, X, Check, 
    RefreshCw, AlertCircle, Filter, HardDrive, Calendar, ArrowUpRight,
    Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Connection {
    type: string;
    id: number;
    name: string;
}

interface MediaFile {
    name: string;
    path: string;
    url: string;
    size: number;
    modified: number;
    type: 'image' | 'video' | 'other';
    connections?: Connection[];
}

interface MediaManagerProps {
    onSelect?: (url: string) => void;
    selectMode?: boolean;
}

const MediaManager = ({ onSelect, selectMode = false }: MediaManagerProps = {}) => {
    const { token } = useAuth();
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeType, setActiveType] = useState<'all' | 'image' | 'video' | 'other'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const response = await api.get('media-manager/');
            const data = response.data;
            setMedia(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching media files:", error);
            setMedia([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadError('');

        const file = files[0];
        // 10MB file limit
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size exceeds the 10MB limit.');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('media-manager/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchMedia();
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.response?.data?.error || 'Failed to upload media file.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to permanently delete this media file? This cannot be undone.")) {
            try {
                await api.delete('media-manager/', { data: { path } });
                setMedia(prev => prev.filter(item => item.path !== path));
                if (previewFile?.path === path) setPreviewFile(null);
            } catch (error) {
                console.error("Delete error:", error);
                alert("Failed to delete the media file.");
            }
        }
    };

    const copyToClipboard = (url: string, path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        navigator.clipboard.writeText(fullUrl)
            .then(() => {
                setCopiedPath(path);
                setTimeout(() => setCopiedPath(null), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'Unknown';
        // Python mtime is in seconds, JS Date expects ms
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter media
    const filteredMedia = media.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.path.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeType === 'all' ? true : item.type === activeType;
        return matchesSearch && matchesType;
    });

    const toggleSelect = (path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedPaths(prev => 
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPaths.length === filteredMedia.length) {
            setSelectedPaths([]);
        } else {
            setSelectedPaths(filteredMedia.map(file => file.path));
        }
    };

    const handleBulkDownload = async () => {
        const selectedFiles = media.filter(item => selectedPaths.includes(item.path));
        for (const file of selectedFiles) {
            const fullUrl = file.url.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
            try {
                const response = await fetch(fullUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error("Failed to download file:", file.name, error);
                window.open(fullUrl, '_blank');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to permanently delete these ${selectedPaths.length} selected files? This cannot be undone.`)) {
            try {
                await api.delete('media-manager/', { data: { paths: selectedPaths } });
                setMedia(prev => prev.filter(item => !selectedPaths.includes(item.path)));
                setSelectedPaths([]);
            } catch (error) {
                console.error("Bulk delete error:", error);
                alert("Failed to delete all selected files.");
            }
        }
    };

    const totalStorageBytes = media.reduce((acc, curr) => acc + (curr.size || 0), 0);

    return (
        <div className="animate-in fade-in duration-500 font-sans space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Media <span className="text-brand">Manager</span></h2>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Upload, search, preview, and organize all site assets in one premium media center.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Storage Info Card */}
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl">
                        <HardDrive size={16} className="text-zinc-400 animate-pulse" />
                        <div className="text-left">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 leading-none">Total Size</p>
                            <p className="text-xs font-bold text-zinc-800 mt-1 leading-none">{formatSize(totalStorageBytes)}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white hover:bg-black rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-zinc-950/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {uploading ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={14} />
                                <span>Upload File</span>
                            </>
                        )}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleUpload} 
                        className="hidden" 
                        accept="image/*,video/*"
                    />
                </div>
            </div>

            {/* Error Message */}
            {uploadError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                    <button onClick={() => setUploadError('')} className="ml-auto text-rose-400 hover:text-rose-600"><X size={14} /></button>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                {/* Search */}
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search media files..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['all', 'image', 'video', 'other'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex-shrink-0 cursor-pointer ${activeType === type 
                                ? 'bg-white text-brand shadow-sm font-extrabold border border-zinc-200' 
                                : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Grid/List Toggle */}
                <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-1">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-brand shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <Grid size={14} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-brand shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* Bulk Actions Panel */}
            {selectedPaths.length > 0 && (
                <div className="flex items-center justify-between bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-lg border border-zinc-800 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={selectedPaths.length === filteredMedia.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded text-brand border-zinc-750 bg-zinc-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">{selectedPaths.length} items selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleBulkDownload}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Download</span>
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                        >
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </button>
                        <button 
                            onClick={() => setSelectedPaths([])}
                            className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Media Content Grid/List */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                    <RefreshCw size={24} className="text-brand animate-spin mb-4" />
                    <p className="text-sm font-semibold text-zinc-500">Scanning Media Directory...</p>
                </div>
            ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-zinc-200 border-dashed text-center">
                    <div className="p-4 bg-zinc-50 rounded-full mb-4">
                        <ImageIcon size={32} className="text-zinc-300" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900">No Media Files Found</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1">Upload a file above or clear your current query to see matches.</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredMedia.map((file, idx) => {
                        const isCopied = copiedPath === file.path;
                        const fullUrl = file.url.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
                        return (
                            <div 
                                key={idx}
                                onClick={() => {
                                    if (selectMode && onSelect) {
                                        onSelect(fullUrl);
                                    } else {
                                        setPreviewFile(file);
                                    }
                                }}
                                className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col ${selectedPaths.includes(file.path) ? 'border-brand ring-2 ring-brand/10' : 'border-zinc-200 hover:border-brand'}`}
                            >
                                {/* Checkbox Overlay */}
                                <div 
                                    className={`absolute top-2.5 left-2.5 z-20 transition-opacity duration-200 ${selectedPaths.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <input 
                                        type="checkbox"
                                        checked={selectedPaths.includes(file.path)}
                                        onChange={() => toggleSelect(file.path)}
                                        className="w-4 h-4 rounded text-brand border-zinc-300 focus:ring-0 focus:ring-offset-0 cursor-pointer shadow-md bg-white"
                                    />
                                </div>

                                {/* Media Container */}
                                <div className="aspect-square w-full bg-zinc-50 relative flex items-center justify-center overflow-hidden border-b border-zinc-100">
                                    {file.type === 'image' ? (
                                        <img 
                                            src={fullUrl} 
                                            alt={file.name} 
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            loading="lazy"
                                        />
                                    ) : file.type === 'video' ? (
                                        <div className="h-full w-full relative flex items-center justify-center">
                                            <video 
                                                src={fullUrl} 
                                                className="h-full w-full object-cover" 
                                                muted 
                                                playsInline 
                                            />
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                <VideoIcon size={20} className="text-white drop-shadow-md" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-full bg-zinc-100 text-zinc-400">
                                            <FileIcon size={24} />
                                        </div>
                                    )}

                                    {/* Action Hover Overlay */}
                                    <div className="absolute inset-0 bg-zinc-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                                        <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                            {!selectMode && (
                                                <>
                                                    <button 
                                                        onClick={(e) => copyToClipboard(file.url, file.path, e)}
                                                        title="Copy URL"
                                                        className={`p-1.5 rounded-lg border transition-all active:scale-90 cursor-pointer ${isCopied 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-brand hover:border-brand hover:text-white'}`}
                                                    >
                                                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(file.path, e)}
                                                        title="Delete file"
                                                        className="p-1.5 bg-zinc-900/80 border border-zinc-800 hover:bg-rose-600 hover:border-rose-600 rounded-lg text-rose-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {selectMode ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4">
                                                <div className="p-2.5 rounded-full bg-brand text-white shadow-lg animate-in zoom-in-75 duration-200">
                                                    <Check size={16} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow">Select Asset</span>
                                            </div>
                                        ) : (
                                            <div className="text-left">
                                                <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] font-black uppercase tracking-wider text-zinc-300">
                                                    {file.type}
                                                </span>
                                                <p className="text-[10px] font-bold text-white truncate mt-1">{file.name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Text Details */}
                                <div className="p-3 bg-white flex-grow flex flex-col justify-between">
                                    <p className="text-[10px] font-bold text-zinc-800 truncate" title={file.name}>{file.name}</p>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-50">
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">{formatSize(file.size)}</span>
                                        {file.connections && file.connections.length > 0 ? (
                                            <span 
                                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-wide cursor-help"
                                                title={file.connections.map(c => `${c.type}: ${c.name}`).join('\n')}
                                            >
                                                Linked ({file.connections.length})
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400 text-[8px] font-black uppercase tracking-wide">
                                                Unused
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50/50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-3.5 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={filteredMedia.length > 0 && selectedPaths.length === filteredMedia.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded text-brand border-zinc-300 bg-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-3.5">Asset</th>
                                <th className="px-6 py-3.5">Directory</th>
                                <th className="px-6 py-3.5 text-center">Type</th>
                                <th className="px-6 py-3.5 text-center">File Size</th>
                                <th className="px-6 py-3.5 text-center">Usage</th>
                                <th className="px-6 py-3.5 text-center">Modified</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-xs">
                            {filteredMedia.map((file, idx) => {
                                const isCopied = copiedPath === file.path;
                                const fullUrl = file.url.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
                                return (
                                    <tr 
                                        key={idx}
                                        onClick={() => {
                                            if (selectMode && onSelect) {
                                                onSelect(fullUrl);
                                            } else {
                                                setPreviewFile(file);
                                            }
                                        }}
                                        className={`hover:bg-zinc-50/50 transition-colors cursor-pointer group ${selectedPaths.includes(file.path) ? 'bg-brand/5 hover:bg-brand/10' : ''}`}
                                    >
                                        <td className="px-6 py-3 w-12 text-center" onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedPaths.includes(file.path)}
                                                onChange={() => toggleSelect(file.path)}
                                                className="w-4 h-4 rounded text-brand border-zinc-300 bg-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {file.type === 'image' ? (
                                                    <img src={fullUrl} alt={file.name} className="h-full w-full object-cover" />
                                                ) : file.type === 'video' ? (
                                                    <div className="relative h-full w-full flex items-center justify-center">
                                                        <video src={fullUrl} className="h-full w-full object-cover" muted />
                                                        <VideoIcon size={12} className="absolute text-white drop-shadow" />
                                                    </div>
                                                ) : (
                                                    <FileIcon size={16} className="text-zinc-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
                                                <p className="font-bold text-zinc-950 truncate" title={file.name}>{file.name}</p>
                                                <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5" title={file.path}>{file.path}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                                                {file.path.split('/')[0]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center capitalize font-bold text-zinc-600">
                                            {file.type}
                                        </td>
                                        <td className="px-6 py-3 text-center font-mono font-bold text-zinc-900">
                                            {formatSize(file.size)}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {file.connections && file.connections.length > 0 ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-wider">
                                                        Linked ({file.connections.length})
                                                    </span>
                                                    <span 
                                                        className="text-[8px] text-zinc-400 font-semibold max-w-[120px] truncate block"
                                                        title={file.connections.map(c => `${c.type}: ${c.name}`).join('\n')}
                                                    >
                                                        {file.connections.map(c => c.name).join(', ')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400 text-[8px] font-black uppercase tracking-wider">
                                                    Unused
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center text-zinc-400 font-semibold">
                                            {formatDate(file.modified)}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {selectMode ? (
                                                <button
                                                    onClick={() => onSelect?.(fullUrl)}
                                                    className="px-3.5 py-1.5 bg-brand text-white hover:bg-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors active:scale-95 duration-150"
                                                >
                                                    Select
                                                </button>
                                            ) : (
                                                <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={(e) => copyToClipboard(file.url, file.path, e)}
                                                        className={`p-1.5 rounded-lg border transition-all active:scale-90 cursor-pointer ${isCopied 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-brand hover:border-brand hover:text-white'}`}
                                                        title="Copy URL"
                                                    >
                                                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(file.path, e)}
                                                        className="p-1.5 bg-zinc-50 border border-zinc-200 text-rose-500 hover:bg-rose-600 hover:border-rose-600 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                                                        title="Delete file"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Premium Preview Lightbox Modal */}
            {previewFile && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setPreviewFile(null)}
                >
                    <div 
                        className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Media Viewport */}
                        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-6 aspect-video md:aspect-auto md:h-[450px]">
                            {previewFile.type === 'image' ? (
                                <img 
                                    src={previewFile.url.startsWith('http') ? previewFile.url : `${BASE_URL}${previewFile.url}`} 
                                    alt={previewFile.name} 
                                    className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                                />
                            ) : previewFile.type === 'video' ? (
                                <video 
                                    src={previewFile.url.startsWith('http') ? previewFile.url : `${BASE_URL}${previewFile.url}`} 
                                    className="max-h-full max-w-full rounded-lg" 
                                    controls 
                                    autoPlay 
                                />
                            ) : (
                                <div className="text-zinc-500 flex flex-col items-center">
                                    <FileIcon size={64} className="mb-4" />
                                    <span className="text-sm font-bold text-zinc-300">File Preview Not Available</span>
                                </div>
                            )}
                        </div>

                        {/* File details sidebar */}
                        <div className="w-full md:w-72 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-100 bg-zinc-50/50">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="px-2 py-0.5 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-wider rounded">
                                            {previewFile.type}
                                        </span>
                                        <h3 className="text-sm font-black text-zinc-950 tracking-tight mt-2 break-all">{previewFile.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setPreviewFile(null)} 
                                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4 text-xs font-semibold text-zinc-700">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Directory Path</p>
                                        <p className="mt-1 font-mono text-zinc-900 bg-white border border-zinc-200 p-2 rounded-lg break-all text-[10px]">{previewFile.path}</p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">File Size</p>
                                        <p className="mt-1 text-zinc-900 font-mono">{formatSize(previewFile.size)}</p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Last Modified</p>
                                        <p className="mt-1 text-zinc-900">{formatDate(previewFile.modified)}</p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Usage Connections</p>
                                        {previewFile.connections && previewFile.connections.length > 0 ? (
                                            <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto pr-1">
                                                {previewFile.connections.map((c, i) => (
                                                    <div key={i} className="bg-white border border-zinc-200 p-2 rounded-lg text-[10px] leading-tight">
                                                        <span className="font-extrabold text-brand text-[8px] uppercase tracking-wider block">{c.type}</span>
                                                        <span className="font-semibold text-zinc-800">{c.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-zinc-400 font-medium italic">Not connected to any page, product, banner, or category.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-6">
                                <button
                                    onClick={(e) => copyToClipboard(previewFile.url, previewFile.path, e)}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all active:scale-[0.98] cursor-pointer ${copiedPath === previewFile.path 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'bg-brand border-brand text-white hover:bg-black hover:border-black'}`}
                                >
                                    {copiedPath === previewFile.path ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copiedPath === previewFile.path ? 'Copied!' : 'Copy Asset URL'}</span>
                                </button>

                                <a
                                    href={previewFile.url.startsWith('http') ? previewFile.url : `${BASE_URL}${previewFile.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-all active:scale-[0.98] text-center"
                                >
                                    <ArrowUpRight size={14} />
                                    <span>Open In New Tab</span>
                                </a>

                                <button
                                    onClick={(e) => handleDelete(previewFile.path, e)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:border-rose-600 hover:text-white text-rose-600 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete Asset</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaManager;
