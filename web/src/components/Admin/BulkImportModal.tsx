import React, { useState } from 'react';
import api from '../../utils/api';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BulkImportModal = ({ isOpen, onClose, onSuccess, apiEndpoint, type }) => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('text'); // 'text' or 'csv'
    const [textInput, setTextInput] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;

        setLoading(true);
        setMessage(null);
        setError(null);

        const names = textInput.split('\n').filter(name => name.trim() !== '');

        try {
            const response = await api.post(`${apiEndpoint}bulk_create/`, { names });
            setMessage(response.data.message);
            if (response.data.errors && response.data.errors.length > 0) {
                setError(`Some items failed: ${response.data.errors.join(', ')}`);
            } else {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setTextInput('');
                    setMessage(null);
                }, 1500);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to bulk create.");
        } finally {
            setLoading(false);
        }
    };

    const handleCsvSubmit = async () => {
        if (!file) return;

        setLoading(true);
        setMessage(null);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`${apiEndpoint}import_csv/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(response.data.message);
            setTimeout(() => {
                onSuccess();
                onClose();
                setFile(null);
                setMessage(null);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to upload CSV.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Bulk Import {type}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === 'text' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Text Input
                        </button>
                        <button
                            onClick={() => setActiveTab('csv')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${activeTab === 'csv' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            CSV Upload
                        </button>
                    </div>

                    {message && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle size={16} /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-brand/5 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {activeTab === 'text' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Names (One per line)
                            </label>
                            <textarea
                                className="w-full h-40 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none resize-none text-sm"
                                placeholder={`Nike\nAdidas\nPuma`}
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-2">Enter each {type.toLowerCase()} name on a new line.</p>

                            <button
                                onClick={handleTextSubmit}
                                disabled={loading || !textInput.trim()}
                                className="w-full mt-4 bg-brand text-white hover:bg-[#3a5bd9] py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : <FileText size={18} />}
                                {loading ? 'Processing...' : 'Create Bulk'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="bg-gray-100 p-3 rounded-full">
                                        <Upload size={24} className="text-gray-500" />
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {file ? file.name : "Click to upload CSV"}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        CSV must have a column named "Name"
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCsvSubmit}
                                disabled={loading || !file}
                                className="w-full mt-6 bg-brand text-white hover:bg-[#3a5bd9] py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                                {loading ? 'Uploading...' : 'Import CSV'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
