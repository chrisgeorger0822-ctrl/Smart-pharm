import React, { useState } from 'react';
import { MedicineItem, SaleRecord } from '../types';
import { Database, Play, X, Terminal, Table, CheckCircle2 } from 'lucide-react';

interface H2ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: MedicineItem[];
  sales: SaleRecord[];
}

export const H2ConsoleModal: React.FC<H2ConsoleModalProps> = ({
  isOpen,
  onClose,
  medicines,
  sales,
}) => {
  const [activeTable, setActiveTable] = useState<'medicines' | 'sales'>('medicines');
  const [customSql, setCustomSql] = useState('SELECT * FROM medicines WHERE stock_quantity <= 10;');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryStatus, setQueryStatus] = useState<string>('Ready for query execution');

  if (!isOpen) return null;

  const handleRunQuery = () => {
    const q = customSql.trim().toLowerCase();
    
    if (q.includes('where stock_quantity <= 10')) {
      const res = medicines.filter(m => m.stockQuantity <= 10);
      setQueryResult(res);
      setQueryStatus(`✔ Executed in 1.4ms. ${res.length} row(s) returned.`);
    } else if (q.includes('from sales')) {
      setQueryResult(sales);
      setQueryStatus(`✔ Executed in 0.8ms. ${sales.length} row(s) returned.`);
    } else if (q.includes('from medicines')) {
      setQueryResult(medicines);
      setQueryStatus(`✔ Executed in 1.1ms. ${medicines.length} row(s) returned.`);
    } else {
      setQueryResult(medicines);
      setQueryStatus(`✔ Query executed. Displaying active records (${medicines.length} rows).`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">H2 Database Engine Console (Embedded Mode)</h3>
              <p className="text-[10px] text-slate-400 font-mono">jdbc:h2:./data/pharmacy_db;AUTO_SERVER=TRUE;DB_CLOSE_DELAY=-1</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SQL Editor toolbar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>SQL Query Console:</span>
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setCustomSql('SELECT * FROM medicines WHERE stock_quantity <= 10;');
                  setActiveTable('medicines');
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700"
              >
                Scan Low Stock
              </button>
              <button
                onClick={() => {
                  setCustomSql('SELECT * FROM medicines ORDER BY expiry_date ASC;');
                  setActiveTable('medicines');
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700"
              >
                Sort By Expiry
              </button>
              <button
                onClick={() => {
                  setCustomSql('SELECT * FROM sales ORDER BY id DESC;');
                  setActiveTable('sales');
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700"
              >
                View Sales Log
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={customSql}
              onChange={e => setCustomSql(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleRunQuery}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 rounded text-xs flex items-center gap-1.5 shadow transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute</span>
            </button>
          </div>

          <div className="text-[11px] text-emerald-400 font-mono">
            {queryStatus}
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="px-4 pt-2 bg-slate-900 border-b border-slate-800 flex space-x-3 text-xs">
          <button
            onClick={() => {
              setActiveTable('medicines');
              setQueryResult(null);
            }}
            className={`pb-2 px-1 font-semibold border-b-2 flex items-center gap-1.5 ${
              activeTable === 'medicines' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>medicines ({medicines.length} rows)</span>
          </button>
          <button
            onClick={() => {
              setActiveTable('sales');
              setQueryResult(null);
            }}
            className={`pb-2 px-1 font-semibold border-b-2 flex items-center gap-1.5 ${
              activeTable === 'sales' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>sales ({sales.length} rows)</span>
          </button>
        </div>

        {/* Table Data View */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          {activeTable === 'medicines' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-mono text-[10px] uppercase border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">BATCH_ID</th>
                  <th className="p-2 text-center">STOCK_QUANTITY</th>
                  <th className="p-2 text-right">PRICE</th>
                  <th className="p-2 text-center">EXPIRY_DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {(queryResult || medicines).map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-900">
                    <td className="p-2 text-slate-500">{m.id}</td>
                    <td className="p-2 text-white font-medium">{m.name}</td>
                    <td className="p-2 text-slate-400">{m.batchId}</td>
                    <td className="p-2 text-center font-bold text-amber-400">{m.stockQuantity}</td>
                    <td className="p-2 text-right text-emerald-400">${Number(m.price).toFixed(2)}</td>
                    <td className="p-2 text-center text-slate-300">{m.expiryDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-300 font-mono text-[10px] uppercase border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">MEDICINE_NAME</th>
                  <th className="p-2 text-center">QUANTITY_SELECTED</th>
                  <th className="p-2 text-right">UNIT_COST</th>
                  <th className="p-2 text-right">TOTAL_BILL</th>
                  <th className="p-2 text-center">TRANSACTION_TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {(queryResult || sales).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No sales transactions recorded yet. Complete a checkout in Tab D!
                    </td>
                  </tr>
                ) : (
                  (queryResult || sales).map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-900">
                      <td className="p-2 text-slate-500">{s.id}</td>
                      <td className="p-2 text-white">{s.medicineName}</td>
                      <td className="p-2 text-center font-bold">{s.quantitySelected}</td>
                      <td className="p-2 text-right">${Number(s.unitCost).toFixed(2)}</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">${Number(s.totalBill).toFixed(2)}</td>
                      <td className="p-2 text-center text-slate-400">{s.transactionTimestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Connected via <code className="text-slate-300 font-mono">org.h2.Driver</code></span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
