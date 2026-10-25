import React, { useState } from 'react';
import { 
  GraduationCap, 
  Layers, 
  Database, 
  Terminal, 
  HelpCircle, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  FileSpreadsheet,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const PresentationGuide: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: "1. Why did you choose an embedded H2 database instead of MySQL or PostgreSQL for this application?",
      a: "H2 is a zero-configuration, lightweight SQL database written entirely in Java. In embedded mode ('jdbc:h2:./data/pharmacy_db'), it runs in-process with the JVM, meaning the university examiner or pharmacy client does not need to install or run a separate external database daemon like MySQL or PostgreSQL. It automatically creates local disk files, supports standard ANSI SQL, ACID transactions, and auto-server mode for external tool inspection."
    },
    {
      q: "2. How does the system prevent SQL injection vulnerabilities?",
      a: "All database queries with dynamic input (in DatabaseManager and InventoryService) strictly utilize java.sql.PreparedStatement with parameterized placeholders (?). We never concatenate raw user text into SQL strings, ensuring malicious inputs are escaped and treated purely as literal data by the SQL parser."
    },
    {
      q: "3. How does the checkout process prevent stock discrepancies or negative inventory?",
      a: "The checkout logic in InventoryService.processCheckout() runs inside an atomic JDBC transaction with conn.setAutoCommit(false). First, it queries the current stock using a row-level lock ('FOR UPDATE') and validates that stock_quantity >= requested_quantity. If valid, it decrements the inventory and logs the transaction into the sales table before calling conn.commit(). If any error or constraint violation occurs, conn.rollback() restores the initial state, preventing partial data corruption."
    },
    {
      q: "4. What is the Swing Event Dispatch Thread (EDT) and how is it used in Main.java?",
      a: "Java Swing is a single-threaded GUI framework. All component creation, updates, and event listeners must run on the dedicated Event Dispatch Thread (EDT). In Main.java, we invoke SwingUtilities.invokeLater(() -> new PharmacyGUI().setVisible(true)) to ensure the GUI is constructed and displayed safely on the EDT, preventing deadlocks and race conditions."
    },
    {
      q: "5. How are the low-stock and near-expiry alert thresholds evaluated?",
      a: "In InventoryService.java, low-stock scanning filters any medicine whose stock_quantity <= 10. Near-expiry evaluation uses the modern java.time.LocalDate API: ChronoUnit.DAYS.between(LocalDate.now(), medicine.getExpiryDate()). If the resulting duration is less than 30 days, an alert is raised on the Dashboard and Inventory view."
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-xl p-6 shadow-xl text-white">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-lg text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">University Project Presentation &amp; Viva Defense Guide</h1>
            <p className="text-xs text-indigo-200 mt-0.5">
              Comprehensive architectural documentation, technical justifications, and anticipated examination questions.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Architecture Layers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>Layered Architecture (3-Tier MVC Pattern)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Layer 1: Presentation */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">1. View / GUI Layer</div>
            <div className="font-semibold text-white mb-2 font-mono">com.pharmacy.ui</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>PharmacyGUI.java</strong>: Swing JFrame with JTabbedPane (Dashboard, Inventory Table, Add Medicine Form, POS Terminal &amp; JTextArea Receipt).
            </p>
          </div>

          {/* Layer 2: Service Layer */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">2. Service Layer</div>
            <div className="font-semibold text-white mb-2 font-mono">com.pharmacy.service</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>InventoryService.java</strong>: Business rules, low-stock filter (≤ 10), near-expiry temporal math (&lt; 30d), and transactional checkout.
            </p>
          </div>

          {/* Layer 3: Model Layer */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">3. Model Layer</div>
            <div className="font-semibold text-white mb-2 font-mono">com.pharmacy.model</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Medicine.java</strong> &amp; <strong>Sale.java</strong>: Encapsulated POJO entities with type safety, constructors, getters, setters, and LocalDate.
            </p>
          </div>

          {/* Layer 4: Database / Persistence */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
            <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">4. Database Layer</div>
            <div className="font-semibold text-white mb-2 font-mono">com.pharmacy.db</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>DatabaseManager.java</strong>: Embedded H2 JDBC connection, auto DDL table creation, initial seed records, and connection lifecycle management.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Database Schema & Relational Design */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-indigo-400" />
          <span>Embedded H2 Database Schemas (DDL)</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: medicines */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-emerald-400">TABLE medicines</span>
              <span className="text-[10px] text-slate-400">Inventory Catalog</span>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  batch_id VARCHAR(50) NOT NULL,
  stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  expiry_date DATE NOT NULL
);`}
            </pre>
          </div>

          {/* Table 2: sales */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-blue-400">TABLE sales</span>
              <span className="text-[10px] text-slate-400">Transaction History</span>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_name VARCHAR(120) NOT NULL,
  quantity_selected INT NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_bill DECIMAL(10, 2) NOT NULL,
  transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
            </pre>
          </div>
        </div>
      </div>

      {/* Section 3: Maven Build & Terminal Execution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span>Execution Commands for Live University Demo</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1 font-semibold">1. Clean &amp; Compile Project:</div>
            <code className="text-emerald-400 font-mono text-xs select-all">mvn clean compile</code>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1 font-semibold">2. Run Directly via Exec Maven Plugin:</div>
            <code className="text-emerald-400 font-mono text-xs select-all">mvn exec:java</code>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1 font-semibold">3. Package into Standalone Executable Fat JAR:</div>
            <code className="text-emerald-400 font-mono text-xs select-all">mvn clean package &amp;&amp; java -jar target/smart-pharmacy-system-1.0.0.jar</code>
          </div>
        </div>
      </div>

      {/* Section 4: Anticipated Viva / Examination Q&A */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Professor / Examiner Viva Defense Questions &amp; Answers</span>
        </h2>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => (
            <div 
              key={idx}
              className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-4 py-3 text-left font-semibold text-xs text-white hover:text-blue-300 flex items-center justify-between transition"
              >
                <span>{item.q}</span>
                {openFaq === idx ? (
                  <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>

              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/80 leading-relaxed bg-slate-900/40">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
