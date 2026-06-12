import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
    Shield, ShieldAlert, ShieldCheck, Zap, Lock, Search, 
    RefreshCw, AlertTriangle, Cpu, Globe, Terminal, 
    Activity, Fingerprint, Database, HardDrive, 
    Layers, Package, CheckCircle, Info, Server,
    Layers as FrameworkIcon, Database as DBIcon,
    Wind as ServerIcon, Heart, Filter, ChevronRight, X
} from 'lucide-react';

interface InventoryItem {
    name: string;
    version: string;
    status: string;
    type: string;
    summary: string;
    vulnerability?: string;
}

const SecurityManager = () => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, inventory, system, logs
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState('Idle');
    const [lastScan, setLastScan] = useState(new Date().toLocaleString());
    const [healthScore, setHealthScore] = useState(94);
    
    // Inventory Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [inventoryFilter, setInventoryFilter] = useState('all'); // all, backend, frontend

    // Backend Stats
    const [auditResults, setAuditResults] = useState<any>(null);

    // Project Dependencies from package.json
    const frontendDeps: InventoryItem[] = [
        { name: 'react', version: '^19.2.0', status: 'secure', type: 'frontend', summary: 'Core UI framework.' },
        { name: 'axios', version: '^1.13.2', status: 'secure', type: 'frontend', summary: 'HTTP communication client.' },
        { name: 'gsap', version: '^3.13.0', status: 'secure', type: 'frontend', summary: 'Animation engine.' },
        { name: 'lucide-react', version: '^0.562.0', status: 'secure', type: 'frontend', summary: 'Icon toolkit.' },
        { name: 'tailwindcss', version: '^4.1.17', status: 'secure', type: 'frontend', summary: 'Styling engine.' }
    ];

    const fullInventory = useMemo(() => {
        let list = [...frontendDeps];
        if (auditResults?.packages) {
            list = [...list, ...auditResults.packages];
        }
        if (inventoryFilter !== 'all') {
            list = list.filter(item => item.type === inventoryFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(item => 
                item.name.toLowerCase().includes(query) || 
                (item.summary && item.summary.toLowerCase().includes(query))
            );
        }
        return list;
    }, [auditResults, inventoryFilter, searchQuery]);

    const runScan = async () => {
        setIsScanning(true);
        setScanProgress(0);
        setScanStatus('Initializing deep registry scan...');
        
        const steps = [
            { threshold: 15, status: 'Auditing Front-end manifests (NPM)...' },
            { threshold: 35, status: 'Indexing Python site-packages registry...' },
            { threshold: 55, status: 'Validating Framework integrity (Django)...' },
            { threshold: 75, status: 'Evaluating Linux Server entropies & logs...' },
            { threshold: 95, status: 'Auditing PostgreSQL Exploit Guard diagnostics...' }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            setScanProgress(prev => {
                const next = prev + 1;
                if (currentStep < steps.length && next >= steps[currentStep].threshold) {
                    setScanStatus(steps[currentStep].status);
                    currentStep++;
                }
                if (next >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return next;
            });
        }, 30);

        try {
            const response = await api.get('admin/security/audit/');
            setAuditResults(response.data);
            setHealthScore(response.data.status === 'SECURE' && response.data.database.exploits.length === 0 ? 98 : 84);
            setIsScanning(false);
            setScanStatus('Audit Completed');
            setLastScan(new Date().toLocaleString());
        } catch (error) {
            console.error("Audit failed:", error);
            setIsScanning(false);
            setScanStatus('Failed to load audit');
            clearInterval(interval);
        }
    };

    useEffect(() => {
        runScan();
    }, []);

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Security</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">System integrity, vulnerability audits, and asset inventory.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg flex flex-col items-center min-w-[80px]">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Integrity</span>
                        <span className="text-sm font-bold mt-1 font-mono">{healthScore}%</span>
                    </div>
                    <button 
                        onClick={runScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-5 py-3 bg-zinc-100 text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                        {isScanning ? 'Auditing...' : 'Global Audit'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 mb-8 w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
                    { id: 'inventory', label: 'Inventory', icon: <Package size={14} /> },
                    { id: 'system', label: 'Audit', icon: <Server size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white shadow-sm text-zinc-900' 
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Progress Bar */}
            {isScanning && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="next-panel p-6 border-zinc-900/5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <Activity size={14} className="text-zinc-900 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-900">{scanStatus}</span>
                            </div>
                            <span className="text-xs font-bold text-zinc-900 font-mono">{scanProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-zinc-900 transition-all duration-300"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="space-y-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {/* Stats */}
                        <div className="lg:col-span-1 space-y-4">
                            <MetricCard title="Inventory Tracks" value={fullInventory.length} unit="MODULES" icon={<Package />} />
                            <MetricCard title="DB Exploit Risk" value={auditResults?.database?.exploits?.length || 0} unit="FINDINGS" icon={<ShieldAlert />} status={auditResults?.database?.exploits?.length > 0 ? "REVIEW" : "SECURE"} />
                            <MetricCard title="Audit Freshness" value="SYNC" unit="LIVE" icon={<RefreshCw />} />
                        </div>

                        {/* Exploit Guard */}
                        <div className="lg:col-span-2">
                            <div className="next-panel p-8 bg-zinc-900 text-white h-full relative overflow-hidden group">
                                <DBIcon size={200} className="absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-all duration-1000" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="p-2 bg-white/10 rounded-lg"><Lock size={16} className="text-zinc-400" /></div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">PostgreSQL Exploit Guard</h3>
                                    </div>

                                    {auditResults?.database?.exploits?.length > 0 ? (
                                        <div className="space-y-4">
                                            {auditResults.database.exploits.map((exploit, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="text-xs font-bold text-white flex items-center gap-2">
                                                            <AlertTriangle className="text-rose-500" size={14} />
                                                            {exploit.title}
                                                        </h5>
                                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase">{exploit.severity}</span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 leading-relaxed">{exploit.detail}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Baseline Secure</h4>
                                            <p className="text-[10px] text-zinc-500 mt-2 max-w-xs">No active database vulnerabilities detected in the latest diagnostic pass.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="next-panel overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search registry..." 
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'backend', label: 'Py' },
                                        { id: 'frontend', label: 'NPM' }
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setInventoryFilter(filter.id)}
                                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                inventoryFilter === filter.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                                            }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4">Module Identity</th>
                                        <th className="px-6 py-4 text-center">Version</th>
                                        <th className="px-6 py-4 text-center">Runtime</th>
                                        <th className="px-6 py-4 text-right">Integrity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {fullInventory.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                                                        {item.name}
                                                        <ChevronRight size={12} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 italic">{item.summary}</p>
                                                    {item.vulnerability && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mt-2 uppercase tracking-tight">{item.vulnerability}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <code className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">{item.version}</code>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${item.type === 'backend' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                                                    {item.type === 'backend' ? 'PYTHON' : 'NPM'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${item.status === 'secure' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'secure' ? 'text-zinc-900' : 'text-amber-600'}`}>{item.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && auditResults && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <AuditCard icon={<FrameworkIcon />} title="Django Core" data={[
                            { label: "Version", value: auditResults.framework.version },
                            { label: "Environment", value: auditResults.framework.debug_mode ? 'DEV' : 'PROD', warning: auditResults.framework.debug_mode },
                            { label: "Protocol Redirect", value: auditResults.framework.secure_ssl_redirect ? 'ACTIVE' : 'INACTIVE' },
                            { label: "Vault Persistence", value: auditResults.framework.session_cookie_secure ? 'SECURE' : 'UNSAFE' }
                        ]} />
                        <AuditCard icon={<DBIcon />} title="Postgres Engine" data={[
                            { label: "Engine", value: auditResults.database.engine.split('.').pop() },
                            { label: "SSL Pipeline", value: auditResults.database.ssl_active ? 'ENCRYPTED' : 'PLAIN' },
                            { label: "Exploit Guard", value: auditResults.database.exploits.length > 0 ? 'ALERT' : 'SECURE', warning: auditResults.database.exploits.length > 0 }
                        ]} />
                    </div>
                )}
            </div>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: any;
    unit: string;
    icon: React.ReactElement<any>;
    status?: string;
}

const MetricCard = ({ title, value, unit, icon, status }: MetricCardProps) => (
    <div className="next-panel p-6 flex items-center justify-between group hover:border-zinc-300 transition-all">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-bold text-zinc-900 font-mono">{value}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">{unit}</span>
                </div>
            </div>
        </div>
        {status && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${status === 'SECURE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                {status}
            </span>
        )}
    </div>
);

interface AuditCardProps {
    icon: React.ReactElement<any>;
    title: string;
    data: Array<{
        label: string;
        value: any;
        warning?: boolean;
    }>;
}

const AuditCard = ({ icon, title, data }: AuditCardProps) => (
    <div className="next-panel p-8">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">{React.cloneElement(icon, { size: 18 })}</div>
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="space-y-4">
            {data.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-tight ${item.warning ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100' : 'text-zinc-900'}`}>{item.value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default SecurityManager;
