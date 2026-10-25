import React, { useState, useEffect } from 'react';
import { MedicineItem, SaleRecord } from './types';
import { DesktopSimulator } from './components/DesktopSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { PresentationGuide } from './components/PresentationGuide';
import { H2ConsoleModal } from './components/H2ConsoleModal';
import { 
  Monitor, 
  Code2, 
  GraduationCap, 
  Database, 
  Download, 
  Archive, 
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import JSZip from 'jszip';
import { JAVA_PROJECT_FILES } from './data/javaSourceFiles';

const DEFAULT_MEDICINES: MedicineItem[] = [
  {
    id: 1,
    name: 'Amoxicillin 500mg',
    batchId: 'BAT-AMX-2024',
    stockQuantity: 85,
    price: 14.50,
    expiryDate: '2027-08-15',
  },
  {
    id: 2,
    name: 'Paracetamol 650mg',
    batchId: 'BAT-PCM-1102',
    stockQuantity: 6, // LOW STOCK (<= 10)
    price: 4.25,
    expiryDate: '2027-11-20',
  },
  {
    id: 3,
    name: 'Azithromycin 250mg',
    batchId: 'BAT-AZM-9031',
    stockQuantity: 40,
    price: 22.00,
    expiryDate: '2026-11-10', // NEAR EXPIRY (< 30 days)
  },
  {
    id: 4,
    name: 'Cough Expectorant Syrup',
    batchId: 'BAT-SYR-4421',
    stockQuantity: 4, // BOTH LOW STOCK and NEAR EXPIRY
    price: 8.75,
    expiryDate: '2026-11-05',
  },
  {
    id: 5,
    name: 'Cetirizine 10mg',
    batchId: 'BAT-CTZ-7714',
    stockQuantity: 120,
    price: 6.00,
    expiryDate: '2028-03-30',
  },
  {
    id: 6,
    name: 'Insulin Glargine 100IU',
    batchId: 'BAT-INS-5509',
    stockQuantity: 8, // LOW STOCK (<= 10)
    price: 48.90,
    expiryDate: '2027-04-12',
  },
  {
    id: 7,
    name: 'Omeprazole 20mg DR',
    batchId: 'BAT-OMP-3320',
    stockQuantity: 65,
    price: 11.20,
    expiryDate: '2027-09-01',
  },
];

const DEFAULT_SALES: SaleRecord[] = [
  {
    id: 1,
    medicineName: 'Amoxicillin 500mg',
    quantitySelected: 2,
    unitCost: 14.50,
    totalBill: 29.00,
    transactionTimestamp: '2026-10-25 09:14:22',
  },
  {
    id: 2,
    medicineName: 'Paracetamol 650mg',
    quantitySelected: 3,
    unitCost: 4.25,
    totalBill: 12.75,
    transactionTimestamp: '2026-10-25 10:32:05',
  },
];

export default function App() {
  const [activeMainView, setActiveMainView] = useState<'simulator' | 'code' | 'presentation'>('simulator');
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_medicines_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_MEDICINES;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacy_sales_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_SALES;
  });

  const [isH2ModalOpen, setIsH2ModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pharmacy_medicines_v1', JSON.stringify(medicines));
    } catch (e) {}
  }, [medicines]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmacy_sales_v1', JSON.stringify(sales));
    } catch (e) {}
  }, [sales]);

  // Add Medicine handler
  const handleAddMedicine = (newMed: Omit<MedicineItem, 'id'>) => {
    const nextId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;
    const item: MedicineItem = {
      id: nextId,
      ...newMed,
    };
    setMedicines(prev => [...prev, item]);
  };

  // Checkout handler (decrements stock & appends sale)
  const handleCheckout = (medicineName: string, quantity: number, unitCost: number, totalBill: number) => {
    // 1. Decrement medicine stock
    setMedicines(prev =>
      prev.map(m => {
        if (m.name === medicineName) {
          return {
            ...m,
            stockQuantity: Math.max(0, m.stockQuantity - quantity),
          };
        }
        return m;
      })
    );

    // 2. Append transaction record
    const nextSaleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newSale: SaleRecord = {
      id: nextSaleId,
      medicineName,
      quantitySelected: quantity,
      unitCost,
      totalBill,
      transactionTimestamp: formattedTimestamp,
    };

    setSales(prev => [...prev, newSale]);
  };

  // Reset to default sample state
  const handleResetData = () => {
    if (confirm('Reset embedded H2 database to initial realistic warehouse demo state?')) {
      setMedicines(DEFAULT_MEDICINES);
      setSales(DEFAULT_SALES);
      localStorage.removeItem('pharmacy_medicines_v1');
      localStorage.removeItem('pharmacy_sales_v1');
    }
  };

  // Fast ZIP download from header
  const handleQuickDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      JAVA_PROJECT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smart-pharmacy-system-maven.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Global Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-base shadow">
            ☕
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Smart Pharmacy Management System
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                Maven + Swing + H2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Desktop GUI Framework (Java Swing) • Embedded H2 SQL Engine
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveMainView('simulator')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
              activeMainView === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Simulator</span>
          </button>

          <button
            onClick={() => setActiveMainView('code')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
              activeMainView === 'code'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Java Source Code</span>
          </button>

          <button
            onClick={() => setActiveMainView('presentation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
              activeMainView === 'presentation'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Viva &amp; Architecture Guide</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsH2ModalOpen(true)}
            className="flex items-center space-x-1 text-xs bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-700/60 px-2.5 py-1.5 rounded-lg transition"
            title="Inspect Embedded H2 Database"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">H2 Console</span>
          </button>

          <button
            onClick={handleQuickDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? 'Zipping...' : 'Download Project (.ZIP)'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col">
        {activeMainView === 'simulator' && (
          <div className="flex-1 flex flex-col">
            <DesktopSimulator
              medicines={medicines}
              sales={sales}
              onAddMedicine={handleAddMedicine}
              onCheckout={handleCheckout}
              onResetData={handleResetData}
              onOpenH2Console={() => setIsH2ModalOpen(true)}
            />
          </div>
        )}

        {activeMainView === 'code' && (
          <div className="flex-1 flex flex-col">
            <CodeExplorer />
          </div>
        )}

        {activeMainView === 'presentation' && (
          <div className="flex-1">
            <PresentationGuide />
          </div>
        )}
      </main>

      {/* Embedded H2 Console Modal */}
      <H2ConsoleModal
        isOpen={isH2ModalOpen}
        onClose={() => setIsH2ModalOpen(false)}
        medicines={medicines}
        sales={sales}
      />
    </div>
  );
}
