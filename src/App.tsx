import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Settings, 
  X, 
  Save, 
  Loader2, 
  Download,
  AlertCircle,
  CheckCircle2,
  Database,
  CheckSquare,
  Briefcase,
  LayoutGrid,
  LayoutList,
  Users,
  Truck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Home,
  Building,
  Building2,
  Factory,
  HardHat,
  Construction,
  MapPin,
  Flag,
  Star,
  Zap,
  Target,
  Activity,
  Layers,
  Box,
  Globe,
  Compass,
  Calendar,
  User,
  Tag,
  Info,
  Clock,
  MessageSquare,
  Copy,
  Check,
  BarChart3,
  Sparkles,
  Send,
  RefreshCw,
  ClipboardList,
  PieChart as PieChartIcon,
  Bot,
  MapPin as MapPinIcon,
  Camera,
  FileText,
  Wifi,
  WifiOff,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { ConcreteData, SheetType, SHEET_CONFIG, COLUMN_HEADERS } from './types';
import { GoogleSheetService } from './services/GoogleSheetService';
import { offlineService } from './services/OfflineService';

const ICON_MAP: Record<string, any> = {
  Database,
  CheckSquare,
  Briefcase,
  Users,
  Truck,
  LayoutGrid,
  Home,
  Building,
  Building2,
  Factory,
  HardHat,
  Construction,
  MapPin,
  Flag,
  Star,
  Zap,
  Target,
  Activity,
  Layers,
  Box,
  Globe,
  Compass
};

const PROJECT_ICONS = [
  'Briefcase', 'Home', 'Building', 'Building2', 'Factory', 'HardHat', 
  'Construction', 'MapPin', 'Flag', 'Star', 'Zap', 'Target', 
  'Activity', 'Layers', 'Box', 'Globe', 'Compass'
];

const formatDate = (date: any) => {
  if (!date) return '-';
  let d: Date;
  
  if (date instanceof Date) {
    d = date;
  } else {
    const dateStr = String(date);
    if (dateStr.includes('T')) {
      d = new Date(dateStr);
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d_part] = dateStr.split('-').map(Number);
      d = new Date(y, m - 1, d_part);
    } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr; // Already formatted
    } else {
      d = new Date(dateStr);
    }
  }

  if (isNaN(d.getTime())) return String(date);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getProjectTasks = (allTasks: any[], projectName: string) => {
  return allTasks.filter(t => t["PROJET"] === projectName).slice(0, 3);
};

const formatTime = (time: any) => {
  if (!time) return '-';
  
  if (time instanceof Date) {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const timeStr = String(time);
  
  // If it's an ISO string or has date part
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }
  
  // If it's already a time string like "HH:mm:ss" or "HH:mm"
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parts[0].trim().padStart(2, '0');
      const m = parts[1].trim().padStart(2, '0');
      // Basic validation to ensure they are numbers
      if (!isNaN(Number(h)) && !isNaN(Number(m))) {
        return `${h}:${m}`;
      }
    }
  }
  
  return timeStr;
};

const STATUS_COLORS: Record<string, string> = {
  'En attente': 'bg-slate-100 text-slate-600 border-slate-200',
  'En cours': 'bg-blue-100 text-blue-600 border-blue-200',
  'Terminée': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'Fait': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'Annulée': 'bg-rose-100 text-rose-600 border-rose-200',
  'Bloquée': 'bg-amber-100 text-amber-600 border-amber-200',
  'قيد الانتظار': 'bg-slate-100 text-slate-600 border-slate-200',
  'قيد التنفيذ': 'bg-blue-100 text-blue-600 border-blue-200',
  'مكتملة': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'تمت': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'ملغاة': 'bg-rose-100 text-rose-600 border-rose-200',
  'متوقفة': 'bg-amber-100 text-amber-600 border-amber-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-blue-100 text-blue-600',
  'High': 'bg-orange-100 text-orange-600',
  'Urgent': 'bg-rose-100 text-rose-600',
  'منخفضة': 'bg-slate-100 text-slate-600',
  'متوسطة': 'bg-blue-100 text-blue-600',
  'عالية': 'bg-orange-100 text-orange-600',
  'عاجلة': 'bg-rose-100 text-rose-600',
};

const Dashboard = ({ data, loadData, loading, onViewTask, darkMode }: { data: { pv: any[], taches: any[], projets: any[] }, loadData: () => void, loading: boolean, onViewTask: (task: any) => void, darkMode: boolean }) => {
  const stats = useMemo(() => {
    const pv = data?.pv || [];
    const taches = data?.taches || [];
    const projets = data?.projets || [];
    
    const totalPV = pv.length;
    const totalTaches = taches.length;
    const totalProjets = projets.length;

    const urgentTaches = taches.filter((t: any) => 
      (t['PRIORITE'] === 'Urgent' || t['PRIORITE'] === 'عاجلة') && 
      (t['STATUT TACHE'] !== 'Terminée' && t['STATUT TACHE'] !== 'مكتملة' && t['STATUT TACHE'] !== 'Fait' && t['STATUT TACHE'] !== 'تمت')
    );
    
    return { totalPV, totalTaches, totalProjets, urgentTaches };
  }, [data]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">لوحة التحكم</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Concrete Management System Overview</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadData()}
          disabled={loading}
          className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Urgent Tasks - High Impact Card */}
      {stats.urgentTaches.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 dark:bg-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200/50 dark:shadow-indigo-900/40 relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <h3 className="font-black text-xl">مهام عاجلة جداً</h3>
              </div>
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                {stats.urgentTaches.length} مهام
              </span>
            </div>
            <div className="space-y-3">
              {stats.urgentTaches.slice(0, 3).map((task: any, i: number) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: -4 }}
                  onClick={() => onViewTask(task)}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all group/item"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black truncate group-hover/item:text-indigo-300 transition-colors">{task['NOM TACHE']}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{task['PROJET']}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                      <span className="text-[10px] text-rose-400 font-bold">{formatDate(task['DATE'])}</span>
                    </div>
                  </div>
                  <ChevronLeft size={18} className="text-slate-500 group-hover/item:text-white transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'المحاضر', value: stats.totalPV, icon: ClipboardList, color: 'indigo', delay: 0.1 },
          { label: 'المهام', value: stats.totalTaches, icon: CheckCircle2, color: 'blue', delay: 0.2 },
          { label: 'المشاريع', value: stats.totalProjets, icon: Briefcase, color: 'amber', delay: 0.3 },
          { label: 'عاجل', value: stats.urgentTaches.length, icon: AlertCircle, color: 'rose', delay: 0.4 },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-indigo-900/10 transition-all group relative overflow-hidden"
          >
            <div className={`w-14 h-14 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div className="relative z-10">
              <span className="text-5xl font-black text-slate-900 dark:text-slate-100 block mb-2 tracking-tighter">{stat.value}</span>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [activeSheet, setActiveSheet] = useState<SheetType>('DASHBOARD');
  const [data, setData] = useState<ConcreteData[]>([]);
  const [allPVs, setAllPVs] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<{ pv: any[], taches: any[], projets: any[] }>({ pv: [], taches: [], projets: [] });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResponsable, setFilterResponsable] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isSettingsConfirmOpen, setIsSettingsConfirmOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [systemLogo, setSystemLogo] = useState<string>(localStorage.getItem('systemLogo') || '');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<{ projets: any[], responsables: string[], livreurs: string[], clients: string[] }>({ projets: [], responsables: [], livreurs: [], clients: [] });
  const [scriptUrl, setScriptUrl] = useState<string>(localStorage.getItem('scriptUrl') || '');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const service = useMemo(() => new GoogleSheetService(scriptUrl), [scriptUrl]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (scriptUrl) {
      loadData();
      loadOptions();
    } else {
      setIsSettingsOpen(true);
    }
  }, [scriptUrl, activeSheet]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const syncOfflineData = async () => {
    const pending = await offlineService.getPendingRequests();
    if (pending.length === 0) return;
    
    setIsSyncing(true);
    showStatus('success', `جاري مزامنة ${pending.length} سجلات...`);
    
    try {
      const result = await service.syncQueue();
      if (result.success > 0) {
        await loadData();
        showStatus('success', `تمت مزامنة ${result.success} سجلات بنجاح`);
      }
      if (result.failed > 0) {
        showStatus('error', `فشل مزامنة ${result.failed} سجلات`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      showStatus('error', 'حدث خطأ أثناء المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      showStatus('error', 'الموقع الجغرافي غير مدعوم في هذا المتصفح');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, "GPS": `${latitude}, ${longitude}` }));
        setGpsLoading(false);
        showStatus('success', 'تم التقاط الموقع بنجاح');
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsLoading(false);
        showStatus('error', 'فشل التقاط الموقع');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageUrl = await service.uploadImage(base64, `${activeSheet}_${Date.now()}_${file.name}`);
      setFormData(prev => ({ ...prev, "IMAGE": imageUrl }));
      showStatus('success', 'تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      showStatus('error', 'خطأ في رفع الصورة: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setUploadingImage(false);
    }
  };

  const generatePDF = (item: any) => {
    const doc = new jsPDF();
    const isRTL = true;
    
    // Simple PDF Header
    doc.setFontSize(22);
    doc.text("Concrete Management System", 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Report: ${SHEET_CONFIG[activeSheet as SheetType]?.label || activeSheet}`, 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);

    const tableData = Object.entries(COLUMN_HEADERS[activeSheet as SheetType] || {}).map(([key, label]) => [
      label,
      key.toLowerCase().includes('heure') ? formatTime(item[key]) : key.toLowerCase().includes('date') ? formatDate(item[key]) : String(item[key] || '-')
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Value']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10, cellPadding: 5 },
    });

    doc.save(`${activeSheet}_${item.ID}.pdf`);
    showStatus('success', 'تم تحميل التقرير بنجاح');
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showStatus('success', 'تم تفعيل التنبيهات');
      }
    }
  };

  const sendLocalNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://picsum.photos/seed/concrete/192/192' });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSheet === 'DASHBOARD') {
        const [pv, taches, projets] = await Promise.all([
          service.fetchData('PV'),
          service.fetchData('TACHES'),
          service.fetchData('PROJETS')
        ]);
        setDashboardData({ pv, taches, projets });
        setAllPVs(pv);
        setAllTasks(taches);
      } else {
        const result = await service.fetchData(activeSheet);
        setData(result);
        if (activeSheet === 'TACHES') {
          const pv = await service.fetchData('PV');
          setAllPVs(pv);
        }
        if (activeSheet === 'PROJETS') {
          const taches = await service.fetchData('TACHES');
          setAllTasks(taches);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'فشل تحميل البيانات';
      showStatus('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const result = await service.fetchOptions();
      const clients = Array.from(new Set(result.projets.map((p: any) => p.client || p.CLIENT).filter(Boolean))) as string[];
      setOptions({ ...result, clients });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'فشل تحميل القوائم';
      console.error(msg);
    }
  };

  const handleClientChange = (clientName: string) => {
    const clientProjects = options.projets.filter(p => (p.client || p.CLIENT) === clientName);
    
    setFormData(prev => {
      const newData = { ...prev, "CLIENT": clientName };
      
      if (clientProjects.length === 1) {
        const p = clientProjects[0];
        newData["PROJET"] = p.name || p.PROJET;
        if (p.entreprise || p["ENTREPRISE DES TRAVAUX"]) newData["ENTREPRISE DES TRAVAUX"] = p.entreprise || p["ENTREPRISE DES TRAVAUX"];
        if (p.chef || p["CHEF CHANTIER"]) newData["CHEF CHANTIER"] = p.chef || p["CHEF CHANTIER"];
      } else {
        newData["PROJET"] = "";
        newData["ENTREPRISE DES TRAVAUX"] = "";
        newData["CHEF CHANTIER"] = "";
      }
      
      return newData;
    });
  };

  const handleProjectChange = (projectName: string) => {
    const selectedProject = options.projets.find(p => (p.name || p.PROJET) === projectName);
    
    setFormData(prev => {
      const newData = { ...prev, "PROJET": projectName };
      
      if (selectedProject) {
        if (activeSheet === 'PV') {
          if (selectedProject.client || selectedProject.CLIENT) newData["CLIENT"] = selectedProject.client || selectedProject.CLIENT;
          if (selectedProject.entreprise || selectedProject["ENTREPRISE DES TRAVAUX"]) newData["ENTREPRISE DES TRAVAUX"] = selectedProject.entreprise || selectedProject["ENTREPRISE DES TRAVAUX"];
        } else if (activeSheet === 'TACHES') {
          if (selectedProject.entreprise || selectedProject["ENTREPRISE DES TRAVAUX"]) newData["ENTREPRISE DES TRAVAUX"] = selectedProject.entreprise || selectedProject["ENTREPRISE DES TRAVAUX"];
          if (selectedProject.chef || selectedProject["CHEF CHANTIER"]) newData["CHEF CHANTIER"] = selectedProject.chef || selectedProject["CHEF CHANTIER"];
        }
      }
      
      return newData;
    });
  };

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setIsUpdateConfirmOpen(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setIsUpdateConfirmOpen(false);
    try {
      if (!isOnline) {
        const tempId = editingId || `OFF-${Date.now()}`;
        const newItem = { 
          ...formData, 
          ID: tempId,
          "CREATED_AT": formData["CREATED_AT"] || new Date().toISOString()
        } as ConcreteData;
        
        await offlineService.addRequest({
          action: editingId ? 'update' : 'create',
          sheetName: activeSheet,
          data: formData,
          recordId: editingId || undefined
        });

        // Optimistic update
        if (editingId) {
          setData(prev => prev.map(item => item.ID === editingId ? newItem : item));
        } else {
          setData(prev => [newItem, ...prev]);
        }

        showStatus('success', 'تم حفظ السجل محلياً (سيتم المزامنة عند توفر الإنترنت)');
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({});
        return;
      }

      setLoading(true);
      let success = false;
      if (editingId) {
        success = await service.updateData(activeSheet, editingId, formData);
      } else {
        // Add a hidden timestamp for sorting if not present
        const dataWithTimestamp = { 
          ...formData, 
          "CREATED_AT": formData["CREATED_AT"] || new Date().toISOString() 
        };
        success = await service.addData(activeSheet, dataWithTimestamp);
      }

      if (success) {
        showStatus('success', editingId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح');
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({});
        await loadData();

        // Send notification for urgent tasks
        if (activeSheet === 'TACHES' && (formData['PRIORITE'] === 'Urgent' || formData['PRIORITE'] === 'عاجلة')) {
          sendLocalNotification('مهمة عاجلة جديدة', `تمت إضافة مهمة: ${formData['NOM TACHE']}`);
        }
      } else {
        showStatus('error', 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      showStatus('error', 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleteModalOpen(false);
    
    if (!isOnline) {
      await offlineService.addRequest({
        action: 'delete',
        sheetName: activeSheet,
        recordId: itemToDelete
      });
      // Optimistic update
      setData(prev => prev.filter(item => item.ID !== itemToDelete));
      showStatus('success', 'تم الحذف محلياً (سيتم المزامنة عند توفر الإنترنت)');
      setItemToDelete(null);
      return;
    }

    setLoading(true);
    try {
      const success = await service.deleteData(activeSheet, itemToDelete);
      if (success) {
        showStatus('success', 'تم الحذف بنجاح');
        await loadData();
      } else {
        showStatus('error', 'فشل الحذف');
      }
    } catch (error) {
      showStatus('error', 'خطأ في الاتصال');
    } finally {
      setLoading(false);
      setItemToDelete(null);
    }
  };

  const openEdit = (item: ConcreteData) => {
    setFormData({ ...item });
    setEditingId(item.ID);
    setIsFormOpen(true);
  };

  const openAdd = () => {
    const empty: Record<string, any> = {};
    if (activeSheet === 'DASHBOARD') return;
    const headers = COLUMN_HEADERS[activeSheet as Exclude<SheetType, 'DASHBOARD'>];
    if (headers) {
      Object.keys(headers).forEach(key => {
        if (key === 'DATE' || key.toLowerCase().includes('debut')) {
          empty[key] = new Date().toISOString().split('T')[0];
        } else {
          empty[key] = '';
        }
      });
    }
    setFormData(empty);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const fixImageUrl = (url: string) => {
    if (!url) return '';
    let fixedUrl = url.trim();
    
    // Remove accidental leading characters before http (like the / seen in user screenshot)
    const httpIndex = fixedUrl.indexOf('http');
    if (httpIndex !== -1) {
      fixedUrl = fixedUrl.substring(httpIndex);
    }

    // Handle Google Drive URLs
    if (fixedUrl.includes('drive.google.com')) {
      const idMatch = fixedUrl.match(/id=([^&]+)/) || fixedUrl.match(/\/d\/([^/]+)/);
      if (idMatch && idMatch[1]) {
        // Use googleusercontent for better embedding reliability
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    
    // Ensure https
    if (fixedUrl.startsWith('http://')) {
      fixedUrl = fixedUrl.replace('http://', 'https://');
    }
    
    return fixedUrl;
  };

  const filteredData = data.filter(item => {
    const matchesSearch = Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesResponsable = activeSheet === 'TACHES' 
      ? (filterResponsable === 'all' || item['RESPONSABLE'] === filterResponsable)
      : true;

    const matchesProject = (activeSheet === 'PV' || activeSheet === 'TACHES')
      ? (filterProject === 'all' || item['PROJET'] === filterProject)
      : true;

    const matchesClient = (activeSheet === 'PV')
      ? (filterClient === 'all' || item['CLIENT'] === filterClient)
      : true;

    return matchesSearch && matchesResponsable && matchesProject && matchesClient;
  }).sort((a, b) => {
    // Sort by CREATED_AT descending if available
    if (a["CREATED_AT"] && b["CREATED_AT"]) {
      return new Date(b["CREATED_AT"]).getTime() - new Date(a["CREATED_AT"]).getTime();
    }

    // Fallback to ID descending
    const idA = String(a.ID || '');
    const idB = String(b.ID || '');
    
    const numA = parseInt(idA.replace(/\D/g, ''));
    const numB = parseInt(idB.replace(/\D/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numB - numA;
    }
    
    return idB.localeCompare(idA);
  });

  const handleSaveSettings = (url: string) => {
    setPendingUrl(url.trim());
    setIsSettingsConfirmOpen(true);
  };

  const confirmSaveSettings = () => {
    setScriptUrl(pendingUrl);
    localStorage.setItem('scriptUrl', pendingUrl);
    localStorage.setItem('systemLogo', systemLogo);
    setIsSettingsConfirmOpen(false);
    setIsSettingsOpen(false);
  };

  const setupTriggers = async () => {
    if (!scriptUrl) return;
    setLoading(true);
    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "setupTriggers" }),
      });
      showStatus('success', 'تم تفعيل التنبيهات التلقائية بنجاح');
    } catch (error) {
      showStatus('error', 'فشل تفعيل التنبيهات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300`} dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-4 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 transform hover:rotate-3 transition-transform overflow-hidden">
              {systemLogo ? (
                <img 
                  src={fixImageUrl(systemLogo)} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>';
                  }}
                />
              ) : (
                <LayoutGrid size={24} />
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight">نظام الإدارة</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Concrete System v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isOnline && isSyncing && (
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <RefreshCw size={12} className="animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-wider">Sync</span>
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30">
                <WifiOff size={12} />
                <span className="text-[8px] font-black uppercase tracking-wider">Offline</span>
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
              title={darkMode ? 'الوضع المضيء' : 'الوضع الليلي'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Tabs - More Professional Navigation */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-[1.25rem] overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-slate-700/50">
            {(Object.keys(SHEET_CONFIG) as SheetType[]).map((key) => {
              const config = SHEET_CONFIG[key];
              const isActive = activeSheet === key;
              const Icon = ICON_MAP[config.icon] || LayoutGrid;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveSheet(key);
                    setFilterResponsable('all');
                    setFilterProject('all');
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap relative ${
                    isActive 
                      ? `bg-white dark:bg-slate-700 text-${config.color}-600 dark:text-${config.color}-400 shadow-sm scale-[1.02]` 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'animate-pulse' : ''} />
                  {config.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-${config.color}-500`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`p-4 pb-24 ${viewMode === 'grid' ? 'max-w-6xl' : 'max-w-2xl'} mx-auto transition-all duration-500`}>
        {activeSheet === 'DASHBOARD' ? (
          <Dashboard 
            data={dashboardData} 
            loadData={loadData} 
            loading={loading} 
            onViewTask={(task) => {
              setViewItem(task);
              setIsViewModalOpen(true);
            }}
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text"
                    placeholder={`بحث في ${SHEET_CONFIG[activeSheet].label}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] py-4 pr-12 pl-6 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:text-slate-100 text-sm font-medium"
                  />
                </div>
                <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-1 shadow-sm">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="عرض القائمة"
                  >
                    <LayoutList size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    title="عرض الشبكة"
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeSheet === 'TACHES' && (
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <Users className="text-slate-400 dark:text-slate-500" size={18} />
                    <select
                      value={filterResponsable}
                      onChange={(e) => setFilterResponsable(e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200 p-0"
                    >
                      <option value="all">كل المسؤولين</option>
                      {options.responsables.map((res, i) => (
                        <option key={`${res}-${i}`} value={res}>{res}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeSheet === 'PV' && (
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <User className="text-slate-400 dark:text-slate-500" size={18} />
                    <select
                      value={filterClient}
                      onChange={(e) => {
                        setFilterClient(e.target.value);
                        setFilterProject('all'); // Reset project when client changes
                      }}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200 p-0"
                    >
                      <option value="all">كل الزبناء</option>
                      {options.clients.map((client, i) => (
                        <option key={`${client}-${i}`} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(activeSheet === 'PV' || activeSheet === 'TACHES') && (
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    {(() => {
                      const selectedProj = options.projets.find(p => p.name === filterProject);
                      const FilterIcon = (selectedProj?.icon && ICON_MAP[selectedProj.icon]) ? ICON_MAP[selectedProj.icon] : Briefcase;
                      return <FilterIcon className={selectedProj?.icon ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} size={18} />;
                    })()}
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200 p-0"
                    >
                      <option value="all">كل المشاريع</option>
                      {options.projets
                        .filter(p => filterClient === 'all' || p.client === filterClient || p.CLIENT === filterClient)
                        .map((proj, i) => (
                          <option key={`${proj.name}-${i}`} value={proj.name}>{proj.name}</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Status Toast */}
        <AnimatePresence>
          {status.type && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 ${
                status.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List/Grid Container */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {loading && data.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>جاري تحميل البيانات...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className={`text-center py-20 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
              <p>لا توجد سجلات حالياً في ورقة {SHEET_CONFIG[activeSheet].label}</p>
            </div>
          ) : (
            filteredData.map((item, index) => {
              const isExpanded = expandedId === item.ID;
              const sheetColor = SHEET_CONFIG[activeSheet].color;
              const isHighPriority = activeSheet === 'TACHES' && (item["PRIORITE"] === 'High' || item["PRIORITE"] === 'Urgent' || item["PRIORITE"] === 'عالية' || item["PRIORITE"] === 'عاجلة');
              const isUrgent = activeSheet === 'TACHES' && (item["PRIORITE"] === 'Urgent' || item["PRIORITE"] === 'عاجلة');
              const isCompleted = activeSheet === 'TACHES' && (item["STATUT TACHE"] === 'Terminée' || item["STATUT TACHE"] === 'مكتملة' || item["STATUT TACHE"] === 'Fait' || item["STATUT TACHE"] === 'تمت');
              const priorityColor = isUrgent ? 'rose' : 'orange';
              
              if (viewMode === 'grid') {
                return (
                  <motion.div
                    layout
                    key={item.ID || `grid-${index}`}
                    className={`group relative bg-white dark:bg-slate-900 border ${
                      isCompleted ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-slate-200 dark:border-slate-800'
                    } rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-indigo-900/10 hover:-translate-y-1 flex flex-col`}
                  >
                    {/* Image Header */}
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {item["IMAGE"] ? (
                        <img 
                          src={fixImageUrl(item["IMAGE"])} 
                          alt="Card" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement!;
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-2 bg-slate-50 dark:bg-slate-800/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                <span class="text-[10px] font-black uppercase tracking-widest">فشل التحميل</span>
                                <a href="${item["IMAGE"]}" target="_blank" class="text-[9px] text-blue-500 underline mt-1">فتح الرابط الأصلي</a>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-${sheetColor}-200 dark:text-${sheetColor}-900/40`}>
                          {activeSheet === 'PROJETS' && item["ICON"] && ICON_MAP[item["ICON"]] ? (
                            React.createElement(ICON_MAP[item["ICON"]], { size: 64, strokeWidth: 1 })
                          ) : (
                            <Database size={64} strokeWidth={1} />
                          )}
                        </div>
                      )}
                      
                      {/* Badge Overlay */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md ${isCompleted ? 'bg-emerald-500/90 text-white' : `bg-${sheetColor}-600/90 text-white`} shadow-lg`}>
                          {activeSheet}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-3 py-1 rounded-full shadow-lg animate-pulse">
                            عاجل
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mb-1">
                          #{String(item.ID || '').split('-')[1] || '---'}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {activeSheet === 'PV' && item["PV N"] ? `PV N° ${item["PV N"]}` : (item["PROJET"] || item["NOM TACHE"] || item["NOM RESPONSABLE"] || item["LIVREUR BETON"] || 'بدون عنوان')}
                        </h3>
                      </div>

                      <div className="space-y-3 mb-6 flex-1">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : `bg-${sheetColor}-500`}`} />
                          {activeSheet === 'PV' 
                            ? `${item["PROJET"] || ''} ${item["DATE"] ? `| ${formatDate(item["DATE"])}` : ''}`
                            : (item["CLIENT"] || item["RESPONSABLE"] || item["COMMENTAIRES"] || '')}
                        </p>
                        {activeSheet === 'TACHES' && item["PRIORITE"] && (
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${PRIORITY_COLORS[item["PRIORITE"]] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              {item["PRIORITE"]}
                            </span>
                            {item["STATUT TACHE"] && (
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${STATUS_COLORS[item["STATUT TACHE"]] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                {item["STATUT TACHE"]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {activeSheet === 'PROJETS' && (
                        <div className="mt-auto mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">أحدث المهمات</span>
                            <span className="text-[9px] font-bold text-indigo-500">آخر 3</span>
                          </div>
                          <div className="space-y-1.5">
                             {getProjectTasks(allTasks, item['PROJET']).length > 0 ? (
                               getProjectTasks(allTasks, item['PROJET']).map((task, idx) => (
                                 <div key={idx} className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${['Terminée', 'مكتملة', 'تمت'].includes(task['STATUT TACHE']) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                   <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">
                                     {task['NOM TACHE']}
                                   </p>
                                 </div>
                               ))
                             ) : (
                               <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 italic">لا توجد مهام مسجلة</p>
                             )}
                          </div>
                        </div>
                      )}

                      {/* Grid Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => openEdit(item)}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => { setItemToDelete(item.ID); setIsDeleteModalOpen(true); }}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <button 
                          onClick={() => toggleExpand(item.ID)}
                          className={`flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl transition-all ${
                            isExpanded 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isExpanded ? 'إغلاق' : 'التفاصيل'}
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content in Grid */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800"
                        >
                          <div className="p-6 space-y-4">
                            {activeSheet === 'PROJETS' && (
                              <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4 overflow-hidden">
                                {item['IMAGE'] && (
                                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    <img src={fixImageUrl(item['IMAGE'])} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">ملخص المشروع</span>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">عدد المهام المرتبطة: {allTasks.filter(t => t["PROJET"] === item["PROJET"]).length}</p>
                                </div>
                              </div>
                            )}
                            {activeSheet !== 'DASHBOARD' && COLUMN_HEADERS[activeSheet] && Object.entries(COLUMN_HEADERS[activeSheet]).slice(4).map(([key, label]) => (
                              <div key={key} className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{label}</span>
                                <div className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                                  {key === 'IMAGE' ? (
                                    item[key] ? 'مرفق' : '-'
                                  ) : key === 'GPS' ? (
                                    item[key] ? 'موقع محدد' : '-'
                                  ) : key.toLowerCase().includes('heure') ? formatTime(item[key]) : key.toLowerCase().includes('date') ? formatDate(item[key]) : String(item[key] || '-')}
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => generatePDF(item)}
                              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mt-2"
                            >
                              <FileText size={16} />
                              تحميل PDF
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  layout
                  key={item.ID || `item-${index}`}
                  className={`group relative border ${
                    isExpanded 
                      ? 'border-indigo-200 dark:border-indigo-800 ring-4 ring-indigo-500/5 dark:ring-indigo-500/10' 
                      : isCompleted 
                        ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/10' 
                        : isHighPriority 
                          ? `border-${priorityColor}-200 dark:border-${priorityColor}-800 shadow-lg shadow-${priorityColor}-100/50 dark:shadow-${priorityColor}-900/20 bg-${priorityColor}-50/20 dark:bg-${priorityColor}-900/10` 
                          : activeSheet === 'PV'
                            ? 'border-sky-100 dark:border-sky-900/50 bg-white dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  } rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5`}
                >
                  {/* Left Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCompleted ? 'bg-emerald-500' : isHighPriority ? `bg-${priorityColor}-500` : `bg-${sheetColor}-500`} opacity-80 ${isUrgent ? 'animate-pulse' : ''}`} />

                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleExpand(item.ID)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-5 items-start flex-1 min-w-0">
                        {/* Icon/Avatar Section */}
                        <div className={`w-14 h-14 rounded-2xl ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : `bg-${sheetColor}-50 dark:bg-${sheetColor}-900/30 text-${sheetColor}-600 dark:text-${sheetColor}-400`} flex items-center justify-center shrink-0 border ${isCompleted ? 'border-emerald-200 dark:border-emerald-800' : `border-${sheetColor}-100/50 dark:border-${sheetColor}-800/50`} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                          {isCompleted ? (
                            <CheckCircle2 size={28} />
                          ) : activeSheet === 'PROJETS' && item["ICON"] && ICON_MAP[item["ICON"]] ? (
                            React.createElement(ICON_MAP[item["ICON"]], { size: 28 })
                          ) : (activeSheet === 'PV' || activeSheet === 'TACHES') && item["PROJET"] ? (
                            (() => {
                              const proj = options.projets.find(p => p.name === item["PROJET"]);
                              const Icon = (proj?.icon && ICON_MAP[proj.icon]) ? ICON_MAP[proj.icon] : Briefcase;
                              return <Icon size={28} />;
                            })()
                          ) : (
                            <div className="font-black text-xl">{String(activeSheet).charAt(0)}</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : `bg-${sheetColor}-100/50 dark:bg-${sheetColor}-900/30 text-${sheetColor}-700 dark:text-${sheetColor}-400`} border border-transparent`}>
                              {activeSheet}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              #{String(item.ID || '').split('-')[1] || '---'}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-1 rounded-lg animate-pulse">
                                عاجل
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {activeSheet === 'PV' && item["PV N"] ? `PV N° ${item["PV N"]}` : (item["PROJET"] || item["NOM TACHE"] || item["NOM RESPONSABLE"] || item["LIVREUR BETON"] || 'بدون عنوان')}
                            </h3>
                            {item["IMAGE"] && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <img 
                                  src={fixImageUrl(item["IMAGE"])} 
                                  alt="Thumb" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {activeSheet === 'TACHES' && item["PRIORITE"] && (
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${PRIORITY_COLORS[item["PRIORITE"]] || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                {item["PRIORITE"]}
                              </span>
                            )}
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                              {activeSheet === 'PV' 
                                ? `${item["PROJET"] || ''} ${item["DATE"] ? `| ${formatDate(item["DATE"])}` : ''}`
                                : (item["CLIENT"] || item["RESPONSABLE"] || item["COMMENTAIRES"] || '')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="flex flex-col items-end gap-4">
                        <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl transition-all"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.ID); }}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-xl transition-all"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400' : ''}`}>
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                      {activeSheet === 'TACHES' ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <User size={10} className="text-blue-400 dark:text-blue-500" />
                              المسؤول
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{String(item["RESPONSABLE"] || '-')}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Calendar size={10} className="text-purple-400 dark:text-purple-500" />
                              التاريخ
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{formatDate(item["DATE"])}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Tag size={10} className="text-amber-400 dark:text-amber-500" />
                              النوع
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{String(item["TYPE TACHE"] || '-')}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={10} className="text-emerald-400 dark:text-emerald-500" />
                              الحالة
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{String(item["STATUT TACHE"] || '-')}</span>
                          </div>
                        </>
                      ) : (
                        activeSheet !== 'DASHBOARD' && COLUMN_HEADERS[activeSheet] && Object.entries(COLUMN_HEADERS[activeSheet]).slice(0, 4).map(([key, label]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                              {key.toLowerCase().includes('heure') ? formatTime(item[key]) : key.toLowerCase().includes('date') ? formatDate(item[key]) : String(item[key] || '-')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100"
                      >
                        <div className="p-6">
                          {activeSheet === 'TACHES' ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full shadow-sm ${
                                    item["STATUT TACHE"] === 'Terminée' || item["STATUT TACHE"] === 'مكتملة' ? 'bg-emerald-500 shadow-emerald-200' : 
                                    item["STATUT TACHE"] === 'En cours' || item["STATUT TACHE"] === 'قيد التنفيذ' ? 'bg-blue-500 shadow-blue-200' : 'bg-slate-400 shadow-slate-200'
                                  }`} />
                                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">تفاصيل المهمة الكاملة</span>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const text = `المهمة: ${item["NOM TACHE"]}\nالمشروع: ${item["PROJET"]}\nالمسؤول: ${item["RESPONSABLE"]}\nالحالة: ${item["STATUT TACHE"]}\nالأولوية: ${item["PRIORITE"]}\nالملاحظات: ${item["COMMENTAIRES"] || 'لا توجد'}`;
                                    navigator.clipboard.writeText(text);
                                    setStatus({ type: 'success', message: 'تم نسخ تفاصيل المهمة' });
                                    setTimeout(() => setStatus({ type: null, message: '' }), 2000);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                  <Copy size={14} />
                                  نسخ البيانات
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                      <Tag size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">نوع المهمة</span>
                                  </div>
                                  <span className="text-slate-800 font-extrabold text-sm block">{String(item["TYPE TACHE"] || '-')}</span>
                                </div>
                                
                                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                                      <Activity size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">نوع الصب</span>
                                  </div>
                                  <span className="text-slate-800 font-extrabold text-sm block">{String(item["TYPE COULAGE"] || '-')}</span>
                                </div>

                                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                      <Building size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">شركة الأشغال</span>
                                  </div>
                                  <span className="text-slate-800 font-extrabold text-sm block">{String(item["ENTREPRISE DES TRAVAUX"] || '-')}</span>
                                </div>
                              </div>
                              
                              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                                    <MessageSquare size={20} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">الملاحظات والتعليقات</span>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                  <p className="text-slate-600 text-sm leading-relaxed font-medium italic">
                                    {String(item["COMMENTAIRES"] || 'لا توجد ملاحظات إضافية لهذه المهمة حالياً.')}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">تحديث سريع للحالة</span>
                                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">تحديث فوري</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {['En attente', 'En cours', 'Terminée'].map(s => (
                                    <button
                                      key={s}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const updatedItem = { ...item, "STATUT TACHE": s, "DERNIERE MISE A JOUR": new Date().toISOString() };
                                          await service.updateData(activeSheet, item.ID, updatedItem);
                                          await loadData();
                                          setStatus({ type: 'success', message: `تم تحديث الحالة إلى: ${s}` });
                                          setTimeout(() => setStatus({ type: null, message: '' }), 2000);
                                        } catch (err) {
                                          setStatus({ type: 'error', message: 'فشل تحديث الحالة' });
                                        }
                                      }}
                                      className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${
                                        item["STATUT TACHE"] === s 
                                          ? `${STATUS_COLORS[s]} border-current shadow-md scale-105` 
                                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'
                                      }`}
                                    >
                                      {s === 'En attente' ? 'قيد الانتظار' : s === 'En cours' ? 'قيد التنفيذ' : 'مكتملة'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Related PVs Section */}
                              {allPVs.filter(pv => pv["PROJET"] === item["PROJET"]).length > 0 && (
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                      <Database size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">محاضر التجارب المرتبطة بهذا المشروع</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {allPVs.filter(pv => pv["PROJET"] === item["PROJET"]).map((pv, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-bold text-slate-700">{pv["PV N"]}</span>
                                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{pv["PARTIE D'OUVRAGE"]}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[10px] font-bold text-slate-500 block">{formatDate(pv["DATE"])}</span>
                                          <span className="text-[10px] font-black text-emerald-600">{pv["CLASSE BETON"]}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Clock size={12} className="text-slate-300" />
                                    <span>آخر تحديث: {item["DERNIERE MISE A JOUR"] ? `${formatDate(item["DERNIERE MISE A JOUR"])} ${formatTime(item["DERNIERE MISE A JOUR"])}` : '-'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => generatePDF(item)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    title="تحميل PDF"
                                  >
                                    <FileText size={18} />
                                  </button>
                                  <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">System ID</span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{item.ID}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeSheet === 'PROJETS' && (
                                <div className="md:col-span-2 space-y-4 mb-2">
                                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/40 dark:to-indigo-900/10 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                      {/* Project Image Preview */}
                                      {item['IMAGE'] && (
                                        <div className="shrink-0 flex flex-col items-center sm:items-start">
                                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">صورة المشروع</span>
                                          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl group/img relative">
                                            <img 
                                              src={fixImageUrl(item['IMAGE'])} 
                                              alt={item['PROJET']}
                                              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                              referrerPolicy="no-referrer"
                                            />
                                            <button 
                                              onClick={() => window.open(item['IMAGE'], '_blank')}
                                              className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                              <Compass size={20} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Associated Tasks */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">أحدث المهمات</span>
                                          <span className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                                            {getProjectTasks(allTasks, item['PROJET']).length} نشاطات
                                          </span>
                                        </div>
                                        <div className="space-y-2">
                                          {getProjectTasks(allTasks, item['PROJET']).length > 0 ? (
                                            getProjectTasks(allTasks, item['PROJET']).map((task, idx) => (
                                              <motion.div 
                                                key={idx}
                                                whileHover={{ x: -4 }}
                                                className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white dark:border-white/5 shadow-sm transition-all"
                                              >
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                  ['Terminée', 'مكتملة', 'تمت'].includes(task['STATUT TACHE']) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                                  ['Urgent', 'عاجلة'].includes(task['PRIORITE']) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                }`} />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{task['NOM TACHE']}</p>
                                                  <div className="flex items-center gap-2 mt-0.5">
                                                    <Clock size={10} className="text-slate-400" />
                                                    <span className="text-[10px] text-slate-400 font-bold">{formatDate(task['DATE'])}</span>
                                                  </div>
                                                </div>
                                                <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600" />
                                              </motion.div>
                                            ))
                                          ) : (
                                            <div className="p-6 text-center border-2 border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
                                              <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">لا توجد مهام مسجلة حالياً</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {activeSheet !== 'DASHBOARD' && COLUMN_HEADERS[activeSheet] && Object.entries(COLUMN_HEADERS[activeSheet]).slice(4).map(([key, label]) => (
                                <div key={key} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">{label}</span>
                                  <div className="text-slate-700 dark:text-slate-300 font-bold text-sm leading-relaxed">
                                    {key === 'IMAGE' ? (
                                      item[key] ? (
                                        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-w-full sm:max-w-md bg-slate-50 dark:bg-slate-800">
                                          <img 
                                            src={fixImageUrl(item[key])} 
                                            alt="Reference" 
                                            className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                            onClick={() => window.open(item[key], '_blank')}
                                            referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement!;
                                    parent.innerHTML = `
                                      <div class="p-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                        <span class="text-xs">فشل تحميل الصورة</span>
                                        <a href="${item[key]}" target="_blank" class="text-[10px] text-blue-500 underline mt-1">فتح الرابط</a>
                                      </div>
                                    `;
                                  }}
                                          />
                                        </div>
                                      ) : '-'
                                    ) : key === 'GPS' ? (
                                      item[key] ? (
                                        <a 
                                          href={`https://www.google.com/maps/search/?api=1&query=${item[key]}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          <MapPin size={14} />
                                          {item[key]}
                                        </a>
                                      ) : '-'
                                    ) : key.toLowerCase().includes('heure') ? formatTime(item[key]) : key.toLowerCase().includes('date') ? formatDate(item[key]) : String(item[key] || '-')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* View Task Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl h-[80vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-[2rem] flex flex-col overflow-hidden border border-transparent dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">تفاصيل المهمة العاجلة</h2>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl">
                  <h3 className="text-lg font-black text-rose-700 dark:text-rose-400 mb-1">{viewItem["NOM TACHE"]}</h3>
                  <p className="text-sm font-bold text-rose-600/80 dark:text-rose-500/80">{viewItem["PROJET"]}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(COLUMN_HEADERS['TACHES']).map(([key, label]) => {
                    if (key === 'ID') return null;
                    return (
                      <div key={key} className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 ${key === 'IMAGE' || key === 'COMMENTAIRES' ? 'col-span-2' : ''}`}>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {key === 'IMAGE' ? (
                            viewItem[key] ? (
                              <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-w-full">
                                <img 
                                  src={fixImageUrl(viewItem[key])} 
                                  alt="Task" 
                                  className="w-full h-auto object-cover cursor-pointer"
                                  onClick={() => window.open(viewItem[key], '_blank')}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement!;
                                    parent.innerHTML = `
                                      <div class="p-8 text-slate-400 flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                        <span class="text-xs">فشل تحميل الصورة</span>
                                        <a href="${viewItem[key]}" target="_blank" class="text-[10px] text-blue-500 underline mt-1">فتح الرابط</a>
                                      </div>
                                    `;
                                  }}
                                />
                              </div>
                            ) : '-'
                          ) : key.toLowerCase().includes('heure') ? formatTime(viewItem[key]) : key.toLowerCase().includes('date') ? formatDate(viewItem[key]) : String(viewItem[key] || '-')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setActiveSheet('TACHES');
                    setSearchQuery(viewItem.ID);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                >
                  الذهاب للمهمة
                </button>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 bg-white text-slate-600 border border-slate-200 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {activeSheet !== 'DASHBOARD' && (
        <button 
          onClick={openAdd}
          className={`fixed bottom-6 left-6 w-14 h-14 bg-${SHEET_CONFIG[activeSheet].color}-600 text-white rounded-full shadow-2xl shadow-${SHEET_CONFIG[activeSheet].color}-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40`}
        >
          <Plus size={28} />
        </button>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-[2rem] flex flex-col overflow-hidden border border-transparent dark:border-slate-800"
            >
              <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 ${activeSheet === 'PV' ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {editingId ? 'تعديل سجل' : 'إضافة سجل جديد'} - {SHEET_CONFIG[activeSheet].label}
                </h2>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeSheet !== 'DASHBOARD' && COLUMN_HEADERS[activeSheet] && Object.entries(COLUMN_HEADERS[activeSheet]).map(([key, label]) => {
                    if (key === 'id' || key === 'ID') return null;
                    const isDate = key.toLowerCase().includes('date');
                    const isTime = key.toLowerCase().includes('heure');
                    
                    if (key === 'IMAGE' || key === 'GPS') {
                      return null; // Handled at the bottom
                    }
                    
                    if (key === 'ICON' && activeSheet === 'PROJETS') {
                      return (
                        <div key={key} className="space-y-1.5 col-span-1 sm:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            {PROJECT_ICONS.map(iconName => {
                              const IconComp = ICON_MAP[iconName];
                              const isSelected = formData[key] === iconName;
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, [key]: iconName }))}
                                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 scale-110' 
                                      : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <IconComp size={20} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    if ((key === 'client' || key === 'CLIENT') && (activeSheet === 'PV' || activeSheet === 'TACHES')) {
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <select 
                            value={formData[key] || ''}
                            onChange={(e) => handleClientChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            required
                          >
                            <option value="">اختر العميل...</option>
                            {options.clients.map((c, i) => (
                              <option key={`${c}-${i}`} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if ((key === 'ENTREPRISE DES TRAVAUX' || key === 'entreprise') && (activeSheet === 'PV' || activeSheet === 'TACHES')) {
                      const clientProjects = formData['CLIENT'] 
                        ? options.projets.filter(p => (p.client || p.CLIENT) === formData['CLIENT'])
                        : options.projets;
                      
                      const filteredByProject = formData['PROJET']
                        ? clientProjects.filter(p => (p.name || p.PROJET) === formData['PROJET'])
                        : clientProjects;

                      const enterprises = Array.from(new Set(filteredByProject.map(p => p.entreprise || p["ENTREPRISE DES TRAVAUX"]).filter(Boolean))) as string[];
                      
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <select 
                            value={formData[key] || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">اختر الشركة...</option>
                            {enterprises.map((ent, i) => (
                              <option key={`${ent}-${i}`} value={ent}>{ent}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (key === 'PROJET' && activeSheet === 'PROJETS') {
                      const SelectedIcon = formData['ICON'] ? ICON_MAP[formData['ICON']] : null;
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <div className="relative">
                            {SelectedIcon && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600">
                                <SelectedIcon size={20} />
                              </div>
                            )}
                            <input 
                              type="text"
                              value={formData[key] || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                              className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 ${SelectedIcon ? 'pr-10' : 'px-4'} pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                              required
                            />
                          </div>
                        </div>
                      );
                    }

                    if (key === 'STATUT TACHE' && activeSheet === 'TACHES') {
                      const statuses = ['En attente', 'En cours', 'Terminée', 'Fait', 'Annulée', 'Bloquée'];
                      return (
                        <div key={key} className="space-y-1.5 col-span-1 sm:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <div className="flex flex-wrap gap-2">
                            {statuses.map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, [key]: s }))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  formData[key] === s 
                                    ? `${STATUS_COLORS[s]} border-current shadow-sm scale-105` 
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (key === 'PRIORITE' && activeSheet === 'TACHES') {
                      const priorities = ['Low', 'Medium', 'High', 'Urgent'];
                      return (
                        <div key={key} className="space-y-1.5 col-span-1 sm:col-span-2">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <div className="flex flex-wrap gap-2">
                            {priorities.map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, [key]: p }))}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  formData[key] === p 
                                    ? `${PRIORITY_COLORS[p]} shadow-sm scale-105 ring-2 ring-current ring-offset-2` 
                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Dynamic Selects
                    if ((key === 'projet' || key === 'PROJET') && activeSheet !== 'PROJETS') {
                      const clientProjects = formData['CLIENT'] 
                        ? options.projets.filter(p => (p.client || p.CLIENT) === formData['CLIENT'])
                        : options.projets;
                      
                      const selectedProject = options.projets.find(p => (p.name || p.PROJET) === formData[key]);
                      const ProjectIcon = selectedProject?.icon ? ICON_MAP[selectedProject.icon] : null;
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <div className="relative">
                            {ProjectIcon && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                                <ProjectIcon size={20} />
                              </div>
                            )}
                            <select 
                              value={formData[key] || ''}
                              onChange={(e) => handleProjectChange(e.target.value)}
                              className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 ${ProjectIcon ? 'pr-10' : 'px-4'} pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                              required
                            >
                              <option value="">اختر المشروع...</option>
                              {clientProjects.map((p, i) => (
                                <option key={`${p.name || p.PROJET}-${i}`} value={p.name || p.PROJET}>{p.name || p.PROJET}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    }

                    if (key === 'responsable' || key === 'RESPONSABLE') {
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <select 
                            value={formData[key] || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">اختر المسؤول...</option>
                            {options.responsables.map((r, i) => (
                              <option key={`${r}-${i}`} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if ((key === 'livreurBeton' || key === 'LIVREUR BETON') && activeSheet !== 'LIVREURS') {
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">{label}</label>
                          <select 
                            value={formData[key] || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="">اختر المورد...</option>
                            {options.livreurs.map((l, i) => (
                              <option key={`${l}-${i}`} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</label>
                        <input 
                          type={isDate ? 'date' : isTime ? 'time' : 'text'}
                          value={formData[key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200"
                          required={['pvN', 'PV N', 'projet', 'PROJET', 'titre', 'NOM TACHE', 'nomProjet', 'PROJET'].includes(key)}
                        />
                      </div>
                    );
                  })}

                  {/* GPS & Image Upload */}
                  {(activeSheet === 'PV' || activeSheet === 'TACHES' || activeSheet === 'PROJETS') && (
                    <>
                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-600">الموقع الجغرافي (GPS)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={formData["GPS"] || ''}
                            readOnly
                            onClick={() => {
                              if (formData["GPS"]) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${formData["GPS"]}`, '_blank');
                              }
                            }}
                            className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-500 italic ${formData["GPS"] ? 'cursor-pointer hover:text-blue-600 hover:border-blue-300' : ''}`}
                            placeholder="اضغط للالتقاط..."
                          />
                          <button
                            type="button"
                            onClick={captureGPS}
                            disabled={gpsLoading}
                            className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {gpsLoading ? <Loader2 size={20} className="animate-spin" /> : <MapPinIcon size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-1 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-600">إرفاق صورة</label>
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group relative overflow-hidden min-h-[120px]">
                            {uploadingImage ? (
                              <Loader2 size={24} className="animate-spin text-blue-600" />
                            ) : formData["IMAGE"] ? (
                              <>
                                <img 
                                  src={fixImageUrl(formData["IMAGE"])} 
                                  alt="Preview" 
                                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <button 
                                  type="button" 
                                  onClick={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    setFormData(prev => ({ ...prev, ["IMAGE"]: "" })); 
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-lg z-20 hover:scale-110 transition-transform"
                                  title="حذف الصورة"
                                >
                                  <X size={14} />
                                </button>
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                  <div className="bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-sm text-green-600">
                                    <CheckCircle2 size={20} />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-lg">تغيير الصورة</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Camera size={24} className="text-slate-400 group-hover:text-blue-600 mb-2" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اضغط للرفع</span>
                              </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment"
                              className="hidden" 
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className={`w-full bg-${SHEET_CONFIG[activeSheet].color}-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-${SHEET_CONFIG[activeSheet].color}-200 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  <span>{editingId ? 'حفظ التغييرات' : 'إضافة السجل'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">تأكيد الحذف</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا السجل؟ لا يمكن التراجع عن هذه العملية.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all"
                >
                  تأكيد الحذف
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Confirmation Modal */}
      <AnimatePresence>
        {isUpdateConfirmOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">تأكيد التعديل</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حفظ التغييرات على هذا السجل؟
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeSave}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  تأكيد الحفظ
                </button>
                <button 
                  onClick={() => setIsUpdateConfirmOpen(false)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">إعدادات الربط</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">شعار النظام (رابط الصورة)</label>
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                      {systemLogo ? (
                        <img 
                          src={fixImageUrl(systemLogo)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Camera size={20} className="text-slate-400" />
                      )}
                    </div>
                    <input 
                      type="url"
                      placeholder="أدخل رابط شعار النظام..."
                      value={systemLogo}
                      onChange={(e) => setSystemLogo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                  {systemLogo && !systemLogo.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)/i) && !systemLogo.includes('drive.google.com') && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                        تنبيه: الرابط المدخل قد لا يكون رابطاً مباشراً لصورة. تأكد من أن الرابط ينتهي بـ (.png أو .jpg) أو أنه رابط من Google Drive. روابط الصفحات (مثل فيسبوك) لن تظهر كشعار.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">يمكنك وضع رابط مباشر لشعار شركتك ليظهر في أعلى التطبيق.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">رابط Apps Script (Web App URL)</label>
                  <input 
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                  <p className="text-xs text-slate-400">أدخل الرابط الذي حصلت عليه بعد نشر السكريبت كـ Web App.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-600">التنبيهات</h3>
                  <button 
                    onClick={requestNotificationPermission}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-100 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell size={18} />
                    تفعيل إشعارات المتصفح
                  </button>
                  <button 
                    onClick={setupTriggers}
                    className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 py-3 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    تفعيل التنبيه اليومي للمهام المتأخرة
                  </button>
                  <p className="text-xs text-slate-400">سيقوم النظام بفحص المهام يومياً وإرسال إشعارات للمسؤولين عن المهام المتأخرة.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Download size={18} />
                    خطوات الإعداد:
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                    <li>افتح ملف جوجل شيت الخاص بك.</li>
                    <li>من القائمة اختر <b>Extensions</b> ثم <b>App Script</b>.</li>
                    <li>انسخ الكود (Code.gs) الذي سأعطيك إياه.</li>
                    <li>احفظ المشروع ثم اضغط على <b>Deploy</b> {'>'} <b>New Deployment</b>.</li>
                    <li>اختر النوع <b>Web App</b>.</li>
                    <li>اجعل الوصول <b>Anyone</b>.</li>
                    <li>انسخ الرابط الناتج وضعه هنا.</li>
                  </ol>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => handleSaveSettings(scriptUrl)}
                  className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-colors"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Save Confirmation Modal */}
      <AnimatePresence>
        {isSettingsConfirmOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">تأكيد حفظ الإعدادات</h2>
              <p className="text-slate-500 mb-4 leading-relaxed">
                هل أنت متأكد من رغبتك في حفظ رابط Google Sheet الجديد؟
              </p>
              
              {pendingUrl && (!pendingUrl.includes('/macros/s/') || !pendingUrl.endsWith('/exec')) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-right">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <b>تنبيه:</b> يبدو أن الرابط غير صحيح. رابط Web App يجب أن يحتوي على "/macros/s/" وينتهي بـ "/exec".
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmSaveSettings}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all"
                >
                  تأكيد الحفظ
                </button>
                <button 
                  onClick={() => setIsSettingsConfirmOpen(false)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
