import React, { useState } from 'react';
import { JAVA_PROJECT_FILES, JavaFile } from '../data/javaSourceFiles';
import JSZip from 'jszip';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Archive, 
  ExternalLink,
  Terminal,
  Code
} from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<JavaFile>(JAVA_PROJECT_FILES[1]); // Default to Main.java or pom.xml
  const [copiedMap, setCopiedMap] = useState<{ [key: string]: boolean }>({});
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Copy single file
  const handleCopyCode = (file: JavaFile) => {
    navigator.clipboard.writeText(file.content);
    setCopiedMap({ ...copiedMap, [file.path]: true });
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [file.path]: false }));
    }, 2000);
  };

  // Download single file
  const handleDownloadSingleFile = (file: JavaFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download complete project as ZIP archive
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add each file preserving folder structure
      JAVA_PROJECT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Generate zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smart-pharmacy-system-maven.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate zip:', err);
      alert('Could not generate ZIP file.');
    } finally {
      setIsZipping(false);
    }
  };

  const lineCount = selectedFile.content.split('\n').length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner with Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📁</span>
            <h2 className="text-base font-bold text-white">
              Maven Project Source Code Repository
            </h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
              Java 11+ • Standard Maven Structure
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete, 100% implemented Java Swing &amp; H2 files. Download as a ready-to-run ZIP or copy individual classes.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? 'Packaging ZIP...' : downloadSuccess ? '✔ Downloaded ZIP!' : 'Download Complete Maven Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main IDE Layout: Left File Tree + Right Code Editor */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[500px]">
        
        {/* Left: Project Explorer Directory Tree (4 cols) */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-lg overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Project Explorer</span>
            <span className="text-[10px] text-slate-500">7 files</span>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {/* Root item */}
            <div className="flex items-center space-x-1.5 text-slate-300 font-bold py-1">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>smart-pharmacy-system/</span>
            </div>

            {/* pom.xml */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path === 'pom.xml')!)}
              className={`w-full flex items-center space-x-2 pl-6 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path === 'pom.xml'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">pom.xml</span>
              <span className="text-[10px] text-slate-500 ml-auto font-sans">Maven</span>
            </button>

            {/* src/main/java folder */}
            <div className="pl-6 pt-1 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-amber-500/70" />
              <span>src/main/java/</span>
            </div>

            {/* com.pharmacy */}
            <div className="pl-10 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-amber-500/70" />
              <span>com/pharmacy/</span>
            </div>

            {/* Main.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('Main.java'))!)}
              className={`w-full flex items-center space-x-2 pl-14 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('Main.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">Main.java</span>
            </button>

            {/* com/pharmacy/db */}
            <div className="pl-14 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-cyan-500/70" />
              <span>db/</span>
            </div>
            {/* DatabaseManager.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('DatabaseManager.java'))!)}
              className={`w-full flex items-center space-x-2 pl-18 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('DatabaseManager.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">DatabaseManager.java</span>
            </button>

            {/* com/pharmacy/model */}
            <div className="pl-14 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>model/</span>
            </div>
            {/* Medicine.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('Medicine.java'))!)}
              className={`w-full flex items-center space-x-2 pl-18 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('Medicine.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">Medicine.java</span>
            </button>
            {/* Sale.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('Sale.java'))!)}
              className={`w-full flex items-center space-x-2 pl-18 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('Sale.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">Sale.java</span>
            </button>

            {/* com/pharmacy/service */}
            <div className="pl-14 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-purple-500/70" />
              <span>service/</span>
            </div>
            {/* InventoryService.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('InventoryService.java'))!)}
              className={`w-full flex items-center space-x-2 pl-18 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('InventoryService.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">InventoryService.java</span>
            </button>

            {/* com/pharmacy/ui */}
            <div className="pl-14 text-slate-400 flex items-center space-x-1 py-0.5">
              <Folder className="w-3.5 h-3.5 text-rose-500/70" />
              <span>ui/</span>
            </div>
            {/* PharmacyGUI.java */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path.includes('PharmacyGUI.java'))!)}
              className={`w-full flex items-center space-x-2 pl-18 pr-2 py-1.5 rounded text-left transition ${
                selectedFile.path.includes('PharmacyGUI.java')
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-amber-500 text-xs">☕</span>
              <span className="truncate">PharmacyGUI.java</span>
            </button>

            {/* README.md */}
            <button
              onClick={() => setSelectedFile(JAVA_PROJECT_FILES.find(f => f.path === 'README.md')!)}
              className={`w-full flex items-center space-x-2 pl-6 pr-2 py-1.5 rounded text-left transition mt-2 ${
                selectedFile.path === 'README.md'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">README.md</span>
            </button>
          </div>

          {/* Quick Terminal Guide Box */}
          <div className="mt-auto pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Terminal Run:</span>
            </div>
            <pre className="bg-slate-950 p-2 rounded text-[10px] text-emerald-300 font-mono overflow-x-auto">
mvn clean compile{"\n"}
mvn exec:java
            </pre>
          </div>
        </div>

        {/* Right: Code Editor & Content Preview (8 cols) */}
        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col shadow-lg overflow-hidden">
          
          {/* File Tab Header */}
          <div className="bg-slate-850 bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold text-white">
                {selectedFile.path}
              </span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-sans">
                {lineCount} lines
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyCode(selectedFile)}
                className="flex items-center space-x-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition shadow-sm"
              >
                {copiedMap[selectedFile.path] ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy File</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownloadSingleFile(selectedFile)}
                className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition"
                title="Download this file individually"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Description sub-bar */}
          <div className="bg-slate-950/40 px-4 py-2 border-b border-slate-800/70 text-[11px] text-slate-400 flex items-center space-x-2">
            <Code className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{selectedFile.description}</span>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 bg-slate-950 p-4 font-mono text-xs overflow-auto select-text leading-relaxed">
            <div className="flex">
              {/* Line Numbers */}
              <div className="select-none pr-4 text-right text-slate-600 border-r border-slate-800 text-[11px] leading-relaxed">
                {selectedFile.content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code content */}
              <pre className="pl-4 text-slate-200 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed flex-1">
                {selectedFile.content}
              </pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
