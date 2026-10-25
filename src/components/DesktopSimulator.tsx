import React, { useState, useEffect } from 'react';
import { MedicineItem, SaleRecord } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  DollarSign, 
  Search, 
  PlusCircle, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle, 
  Copy, 
  Printer, 
  Database,
  Sparkles,
  Info
} from 'lucide-react';

interface DesktopSimulatorProps {
  medicines: MedicineItem[];
  sales: SaleRecord[];
  onAddMedicine: (med: Omit<MedicineItem, 'id'>) => void;
  onCheckout: (medicineName: string, quantity: number, unitCost: number, totalBill: number) => void;
  onResetData: () => void;
  onOpenH2Console: () => void;
}

export const DesktopSimulator: React.FC<DesktopSimulatorProps> = ({
  medicines,
  sales,
  onAddMedicine,
  onCheckout,
  onResetData,
  onOpenH2Console,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'add' | 'billing'>('dashboard');

  // Search filter for inventory
  const [inventorySearch, setInventorySearch] = useState('');

  // Add form fields
  const [name, setName] = useState('');
  const [batchId, setBatchId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Billing form state
  const [selectedMedicineName, setSelectedMedicineName] = useState<string>(() => medicines[0]?.name || '');
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [receiptTranscript, setReceiptTranscript] = useState<string>(() => 
`=========================================
       SMART PHARMACY TERMINAL          
       UNIVERSITY CLINICAL POS          
=========================================
  Select a medicine and quantity to begin
  billing. Transaction receipts will be  
  transcribed here automatically.        
=========================================`
  );
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Sync selected medicine if medicines change
  useEffect(() => {
    if (!selectedMedicineName && medicines.length > 0) {
      setSelectedMedicineName(medicines[0].name);
    }
  }, [medicines, selectedMedicineName]);

  const selectedMedObj = medicines.find(m => m.name === selectedMedicineName) || medicines[0];

  // Helper calculations
  const lowStockItems = medicines.filter(m => m.stockQuantity <= 10);
  
  const getDaysUntilExpiry = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nearExpiryItems = medicines.filter(m => {
    const days = getDaysUntilExpiry(m.expiryDate);
    return days < 30;
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalBill, 0);

  // Filtered inventory list
  const filteredMedicines = medicines.filter(m => {
    if (!inventorySearch.trim()) return true;
    const query = inventorySearch.toLowerCase();
    return m.name.toLowerCase().includes(query) || m.batchId.toLowerCase().includes(query);
  });

  // Handle Add Medicine Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!name.trim() || !batchId.trim() || !stockQuantity.trim() || !price.trim() || !expiryDate.trim()) {
      setFormFeedback({ type: 'error', message: '❌ Please fill out all required fields.' });
      return;
    }

    const qty = parseInt(stockQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      setFormFeedback({ type: 'error', message: '❌ Stock quantity must be a non-negative integer.' });
      return;
    }

    const prc = parseFloat(price);
    if (isNaN(prc) || prc < 0) {
      setFormFeedback({ type: 'error', message: '❌ Price must be a valid positive number.' });
      return;
    }

    if (medicines.some(m => m.name.toLowerCase() === name.trim().toLowerCase())) {
      setFormFeedback({ type: 'error', message: `❌ A medicine named "${name.trim()}" already exists in the database.` });
      return;
    }

    onAddMedicine({
      name: name.trim(),
      batchId: batchId.trim().toUpperCase(),
      stockQuantity: qty,
      price: prc,
      expiryDate: expiryDate.trim(),
    });

    setFormFeedback({ type: 'success', message: `✔ Successfully added "${name.trim()}" to H2 Database!` });
    setName('');
    setBatchId('');
    setStockQuantity('');
    setPrice('');
  };

  const fillQuickPreset = (presetName: string, batch: string, qty: number, p: number, expDays: number) => {
    const exp = new Date();
    exp.setDate(exp.getDate() + expDays);
    setName(presetName);
    setBatchId(batch);
    setStockQuantity(String(qty));
    setPrice(String(p));
    setExpiryDate(exp.toISOString().split('T')[0]);
    setFormFeedback(null);
  };

  // Handle Checkout Submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedObj) return;

    if (purchaseQuantity <= 0) {
      alert('Purchase quantity must be at least 1.');
      return;
    }

    if (purchaseQuantity > selectedMedObj.stockQuantity) {
      alert(`Insufficient stock! Only ${selectedMedObj.stockQuantity} units available.`);
      return;
    }

    const total = purchaseQuantity * selectedMedObj.price;
    onCheckout(selectedMedObj.name, purchaseQuantity, selectedMedObj.price, total);

    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const receiptNo = Math.floor(100000 + Math.random() * 900000);

    const receipt = 
`=========================================
        SMART PHARMACY OUTLET            
     University Healthcare System        
=========================================
 Receipt #: REC-${receiptNo}
 Date/Time: ${formattedDate}
 Cashier  : POS-DESKTOP-TERMINAL
-----------------------------------------
 Item: ${selectedMedObj.name}
 Batch: ${selectedMedObj.batchId} | Expiry: ${selectedMedObj.expiryDate}
 Quantity: ${purchaseQuantity} x $${selectedMedObj.price.toFixed(2)}
-----------------------------------------
 SUB-TOTAL : $${total.toFixed(2)}
 TAX (0%)  : $0.00
 TOTAL DUE : $${total.toFixed(2)}
=========================================
 PAYMENT   : APPROVED (CASH/CARD)
 STATUS    : H2 DB STOCK UPDATED
=========================================
   Thank you for your visit! Stay well.  
=========================================`;

    setReceiptTranscript(receipt);
    setPurchaseQuantity(1);
  };

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptTranscript);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      
      {/* 1. Authentic Desktop Frame Title Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          {/* Java Coffee Cup Logo */}
          <div className="w-5 h-5 bg-amber-600 rounded flex items-center justify-center text-xs font-bold text-white shadow">
            ☕
          </div>
          <span className="text-xs font-semibold text-slate-200">
            Smart Pharmacy Management System - Desktop Terminal (Java Swing &amp; H2 Database)
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
            Live EDT Simulation
          </span>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={onOpenH2Console}
            className="flex items-center space-x-1 text-xs bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50 mr-2 transition-colors"
            title="Inspect Embedded H2 Database"
          >
            <Database className="w-3 h-3" />
            <span>H2 Console</span>
          </button>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 cursor-pointer" title="Minimize" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-400 cursor-pointer" title="Maximize" />
          <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-400 cursor-pointer" title="Close" />
        </div>
      </div>

      {/* 2. Menu Bar (Java Swing JMenuBar replica) */}
      <div className="bg-slate-850 bg-slate-800/90 border-b border-slate-700/70 px-3 py-1 flex items-center text-xs text-slate-300 space-x-4">
        <div className="cursor-pointer hover:text-white">File</div>
        <div className="cursor-pointer hover:text-white" onClick={() => setActiveTab('inventory')}>Inventory</div>
        <div className="cursor-pointer hover:text-white" onClick={() => setActiveTab('billing')}>Point of Sale</div>
        <div className="cursor-pointer hover:text-white" onClick={onOpenH2Console}>H2 Database</div>
        <div className="cursor-pointer hover:text-white" onClick={onResetData} title="Reset sample stock data">Reset Sample DB</div>
      </div>

      {/* 3. Header Banner (Matches PharmacyGUI.java headerPanel) */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Smart Pharmacy Management System</span>
            <span className="text-xs font-normal bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
              Java 11+ • Swing Nimbus • H2 2.2.x
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise Warehouse Inventory &amp; Point-of-Sale Terminal • Java Swing &amp; Embedded H2 Edition
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onResetData} 
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Navigation (Java Swing JTabbedPane replica) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 pt-2 flex space-x-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'dashboard'
              ? 'bg-slate-800 text-blue-400 border-slate-700 border-b-2 border-b-blue-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
          }`}
        >
          <span>📊</span>
          <span>Tab A - Dashboard</span>
          {(lowStockItems.length > 0 || nearExpiryItems.length > 0) && (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-full border border-rose-500/30">
              {lowStockItems.length + nearExpiryItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'inventory'
              ? 'bg-slate-800 text-blue-400 border-slate-700 border-b-2 border-b-blue-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
          }`}
        >
          <span>📦</span>
          <span>Tab B - Inventory View</span>
          <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
            {medicines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'add'
              ? 'bg-slate-800 text-blue-400 border-slate-700 border-b-2 border-b-blue-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
          }`}
        >
          <span>➕</span>
          <span>Tab C - Add Medicine</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-t border-x ${
            activeTab === 'billing'
              ? 'bg-slate-800 text-blue-400 border-slate-700 border-b-2 border-b-blue-500 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-850'
          }`}
        >
          <span>🛒</span>
          <span>Tab D - Billing Terminal</span>
        </button>
      </div>

      {/* 5. Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">

        {/* TAB A: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total SKUs */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between border-l-4 border-l-blue-500 shadow">
                <div>
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Total Medicines</div>
                  <div className="text-2xl font-bold text-white mt-1">{medicines.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Warehouse catalog items</div>
                </div>
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Low Stock (<= 10) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between border-l-4 border-l-rose-500 shadow">
                <div>
                  <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Low Stock (≤ 10)</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{lowStockItems.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Immediate re-order required</div>
                </div>
                <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Near Expiry (< 30 days) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between border-l-4 border-l-amber-500 shadow">
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Near Expiry (&lt; 30d)</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{nearExpiryItems.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Disposal / Clearance review</div>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Total Revenue Recorded */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between border-l-4 border-l-emerald-500 shadow">
                <div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Sales Bill</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">${totalRevenue.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{sales.length} transactions processed</div>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Dual Alerts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Alert Panel Left: Low Stock */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow">
                <div className="bg-rose-950/40 border-b border-rose-900/50 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-200">
                      ⚠️ Low-Stock Scanning Filter [Quantity ≤ 10]
                    </span>
                  </div>
                  <span className="text-[11px] bg-rose-900/80 text-rose-300 px-2 py-0.5 rounded">
                    {lowStockItems.length} items
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Medicine Name</th>
                        <th className="px-3 py-2">Batch ID</th>
                        <th className="px-3 py-2 text-center">Qty Left</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                            ✔ All medicine stocks are healthy and above 10 units.
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-850/50">
                            <td className="px-3 py-2.5 font-medium text-white">{item.name}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">{item.batchId}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {item.stockQuantity} units
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">${item.price.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => {
                                  setSelectedMedicineName(item.name);
                                  setActiveTab('billing');
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded border border-slate-700 transition"
                              >
                                POS
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alert Panel Right: Near Expiry */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow">
                <div className="bg-amber-950/40 border-b border-amber-900/50 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200">
                      ⏳ Near-Expiry Math Evaluations [Expires in &lt; 30 Days]
                    </span>
                  </div>
                  <span className="text-[11px] bg-amber-900/80 text-amber-300 px-2 py-0.5 rounded">
                    {nearExpiryItems.length} items
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Medicine Name</th>
                        <th className="px-3 py-2">Batch ID</th>
                        <th className="px-3 py-2 text-center">Expiry Date</th>
                        <th className="px-3 py-2 text-right">Days Left</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {nearExpiryItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                            ✔ No near-expiry items found (&gt; 30 days shelf life).
                          </td>
                        </tr>
                      ) : (
                        nearExpiryItems.map(item => {
                          const days = getDaysUntilExpiry(item.expiryDate);
                          const isExpired = days <= 0;
                          return (
                            <tr key={item.id} className="hover:bg-slate-850/50">
                              <td className="px-3 py-2.5 font-medium text-white">{item.name}</td>
                              <td className="px-3 py-2.5 font-mono text-slate-400">{item.batchId}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{item.expiryDate}</td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold">
                                {isExpired ? (
                                  <span className="text-rose-400">Expired ({Math.abs(days)}d ago)</span>
                                ) : (
                                  <span className="text-amber-400">{days} days</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isExpired 
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}>
                                  {isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Actions & H2 Storage Notice */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>
                  <strong>H2 Database Engine Status:</strong> Active embedded in-process storage at <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded font-mono">./data/pharmacy_db</code>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('add')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded transition flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Open Billing POS</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB B: INVENTORY VIEW (JTable) */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter and Controls Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inventory by name or batch ID..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                {inventorySearch && (
                  <button 
                    onClick={() => setInventorySearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Showing <strong>{filteredMedicines.length}</strong> of <strong>{medicines.length}</strong> entries</span>
                <button
                  onClick={() => setActiveTab('add')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-medium transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>

            {/* JTable Representation */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-center">ID</th>
                      <th className="px-4 py-3">Medicine Name</th>
                      <th className="px-4 py-3">Batch ID</th>
                      <th className="px-4 py-3 text-center">Stock Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-center">Expiry Date</th>
                      <th className="px-4 py-3 text-center">Stock Alert</th>
                      <th className="px-4 py-3 text-center">Expiry Alert</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredMedicines.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          No matching medicines found in warehouse.
                        </td>
                      </tr>
                    ) : (
                      filteredMedicines.map(m => {
                        const isLow = m.stockQuantity <= 10;
                        const daysLeft = getDaysUntilExpiry(m.expiryDate);
                        const isExpired = daysLeft <= 0;
                        const isNearExpiry = daysLeft < 30;

                        return (
                          <tr key={m.id} className="hover:bg-slate-800/60 transition">
                            <td className="px-4 py-3 text-center font-mono text-slate-500">{m.id}</td>
                            <td className="px-4 py-3 font-semibold text-white">{m.name}</td>
                            <td className="px-4 py-3 font-mono text-slate-400">{m.batchId}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold">
                              <span className={isLow ? 'text-rose-400' : 'text-slate-200'}>
                                {m.stockQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                              ${m.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-300">
                              {m.expiryDate}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isLow ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                  ⚠️ LOW (≤10)
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ✔ Normal
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isExpired ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-600/50">
                                  ⛔ EXPIRED
                                </span>
                              ) : isNearExpiry ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  ⏳ {daysLeft}d left
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/60 text-slate-300">
                                  ✔ Valid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedMedicineName(m.name);
                                  setActiveTab('billing');
                                }}
                                className="text-[11px] bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-2.5 py-1 rounded transition border border-blue-500/30"
                              >
                                Sell
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB C: ADD MEDICINE PANEL */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="border-b border-slate-800 pb-4 mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-400" />
                  <span>Register New Pharmaceutical Product</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Validated fields will be committed directly to the embedded H2 storage table <code className="text-blue-300 font-mono">medicines</code>.
                </p>
              </div>

              {/* Sample Preset Buttons for Fast Demo */}
              <div className="mb-5 p-3 bg-slate-850 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>One-Click University Presentation Quick Fills:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('Ibuprofen 400mg', 'BAT-IBU-8820', 50, 9.50, 400)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded border border-slate-600 transition"
                  >
                    + Regular Stock (Ibuprofen)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('Hydrocortisone Cream 1%', 'BAT-CRT-1002', 7, 12.30, 280)}
                    className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 px-2.5 py-1 rounded border border-rose-800/60 transition"
                  >
                    + Low Stock Test (Qty = 7)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickPreset('Eye Drops Saline 10ml', 'BAT-EYE-4011', 30, 7.80, 14)}
                    className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 px-2.5 py-1 rounded border border-amber-800/60 transition"
                  >
                    + Near Expiry Test (14 Days)
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {/* Field 1: Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Medicine Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doxycycline 100mg"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Field 2 & 3: Batch ID & Stock Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Batch Number / ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BAT-DOX-2025"
                      value={batchId}
                      onChange={e => setBatchId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Initial Stock Quantity <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 50"
                      value={stockQuantity}
                      onChange={e => setStockQuantity(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Field 4 & 5: Price & Expiry Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Unit Price ($ USD) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 15.75"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expiry Date (YYYY-MM-DD) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Feedback message */}
                {formFeedback && (
                  <div className={`p-3 rounded text-xs font-medium ${
                    formFeedback.type === 'success' 
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80' 
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
                  }`}>
                    {formFeedback.message}
                  </div>
                )}

                {/* Submit button row */}
                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setName('');
                      setBatchId('');
                      setStockQuantity('');
                      setPrice('');
                      setFormFeedback(null);
                    }}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded text-xs transition shadow-lg flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Save to H2 Inventory</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB D: BILLING / SALES TERMINAL */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Interactive Checkout Form (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span>Point-of-Sale Checkout Terminal</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select target medicine, set quantities, and process atomic transaction.
                  </p>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Select Medicine Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Select Target Medicine:
                    </label>
                    <select
                      value={selectedMedicineName}
                      onChange={e => setSelectedMedicineName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {medicines.map(m => (
                        <option key={m.id} value={m.name}>
                          {m.name} [Stock: {m.stockQuantity}] - ${m.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock & Unit Cost details box */}
                  {selectedMedObj && (
                    <div className="p-3 bg-slate-800/80 rounded border border-slate-700/60 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batch Number:</span>
                        <span className="font-mono text-slate-200">{selectedMedObj.batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Available Stock:</span>
                        <span className={`font-mono font-bold ${
                          selectedMedObj.stockQuantity <= 10 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {selectedMedObj.stockQuantity} units
                          {selectedMedObj.stockQuantity <= 10 && ' (Low Stock Alert!)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Unit Price:</span>
                        <span className="font-mono text-white font-semibold">
                          ${selectedMedObj.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expiration Date:</span>
                        <span className="font-mono text-slate-300">{selectedMedObj.expiryDate}</span>
                      </div>
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Purchase Quantity:
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPurchaseQuantity(q => Math.max(1, q - 1))}
                        className="bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 rounded border border-slate-700 flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedMedObj?.stockQuantity || 1}
                        value={purchaseQuantity}
                        onChange={e => setPurchaseQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-24 bg-slate-800 border border-slate-700 rounded text-center py-1.5 text-xs text-white font-bold font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPurchaseQuantity(q => (selectedMedObj ? Math.min(selectedMedObj.stockQuantity, q + 1) : q + 1))}
                        className="bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 rounded border border-slate-700 flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-400">units</span>
                    </div>
                  </div>

                  {/* Total Bill Computation */}
                  <div className="bg-emerald-950/40 border border-emerald-900/60 p-3.5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Total Calculated Amount</div>
                      <div className="text-2xl font-black text-white font-mono">
                        ${((selectedMedObj?.price || 0) * purchaseQuantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-emerald-300/80">
                      <div>Tax: $0.00 (exempt)</div>
                      <div>Status: Ready for billing</div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="submit"
                    disabled={!selectedMedObj || selectedMedObj.stockQuantity < purchaseQuantity || selectedMedObj.stockQuantity <= 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Checkout &amp; Print Receipt</span>
                  </button>
                </form>
              </div>

              {/* Transaction Note */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>
                  Updates <code className="text-slate-300 font-mono">medicines.stock_quantity</code> and writes record to <code className="text-slate-300 font-mono">sales</code> table inside an atomic ACID transaction.
                </span>
              </div>
            </div>

            {/* Right: Thermal Receipt Transcript (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    JTextArea Thermal Receipt Transcript
                  </span>
                </div>
                <button
                  onClick={handleCopyReceipt}
                  className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Receipt'}</span>
                </button>
              </div>

              {/* Monospace Thermal Receipt Box */}
              <div className="flex-1 bg-amber-50/5 text-amber-100/90 border border-amber-900/40 rounded-lg p-4 font-mono text-xs whitespace-pre leading-relaxed overflow-x-auto shadow-inner">
                {receiptTranscript}
              </div>

              {/* Recent Sales Log table */}
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recent Sales Log ({sales.length} transactions in H2 DB):
                </div>
                <div className="max-h-32 overflow-y-auto border border-slate-800 rounded">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-800 text-slate-400 sticky top-0">
                      <tr>
                        <th className="px-2 py-1">Time</th>
                        <th className="px-2 py-1">Medicine</th>
                        <th className="px-2 py-1 text-center">Qty</th>
                        <th className="px-2 py-1 text-right">Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono">
                      {sales.slice(-5).reverse().map(s => (
                        <tr key={s.id}>
                          <td className="px-2 py-1 text-slate-400">{s.transactionTimestamp.substring(11, 19)}</td>
                          <td className="px-2 py-1 text-white font-sans">{s.medicineName}</td>
                          <td className="px-2 py-1 text-center">{s.quantitySelected}</td>
                          <td className="px-2 py-1 text-right text-emerald-400 font-semibold">${s.totalBill.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* 6. Authentic Desktop Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-medium">Database:</span>
          <span>Embedded H2 Connected (<code className="text-slate-300 font-mono">jdbc:h2:./data/pharmacy_db</code>)</span>
          <span className="text-slate-600">|</span>
          <span>Java Swing Engine: <strong className="text-slate-300">Active</strong></span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span>Current Items: <strong className="text-white">{medicines.length}</strong></span>
          <span className="text-slate-600">|</span>
          <button 
            onClick={onResetData}
            className="text-slate-400 hover:text-blue-400 transition"
          >
            ↻ Reload H2 Tables
          </button>
        </div>
      </div>

    </div>
  );
};
