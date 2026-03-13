"use client";

import { useState, useEffect } from "react";
import { 
  FolderSearch, 
  Play, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  FolderOpen,
  Rocket,
  CheckCircle
} from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { ipcService } from "@/services/ipcService";
import { Rule, PreviewOperation } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProgressInfo {
  current: number;
  total: number;
  filename: string;
  status: string;
}

export default function DashboardPage() {
  const [sourceFolder, setSourceFolder] = useState("");
  const [destinationFolder, setDestinationFolder] = useState("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [preview, setPreview] = useState<PreviewOperation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<"skip" | "rename" | "replace">("rename");

  useEffect(() => {
    loadRules();
    
    const setupListeners = async () => {
      const unlisten = await listen<ProgressInfo>("run-progress", (event) => {
        setProgress(event.payload);
      });
      return unlisten;
    };

    const unlistenPromise = setupListeners();

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  async function loadRules() {
    const data = await ipcService.getRules();
    setRules(data);
  }

  async function handleGeneratePreview() {
    if (!sourceFolder) {
      setError("Please select or enter a source folder path first.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsScanning(true);
    try {
      // If destination is empty, use source as base
      const dest = destinationFolder || sourceFolder;
      const results = await ipcService.getPreview(sourceFolder, dest, rules);
      setPreview(results);
    } catch (err) {
      setError("Failed to scan folder. Make sure the path is correct and accessible.");
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleRunOrganization() {
    if (preview.length === 0) return;
    
    setIsExecuting(true);
    setError(null);
    setProgress({ current: 0, total: preview.length, filename: "Preparing...", status: "pending" });
    
    try {
      // Map conflict strategy to all operations
      const opsToRun = preview.map(op => ({
        ...op,
        conflict_strategy: conflictStrategy
      }));
      
      const results = await ipcService.runOrganization(
        opsToRun, 
        sourceFolder, 
        destinationFolder || sourceFolder
      );
      setPreview(results);
      
      const successCount = results.filter((r: PreviewOperation) => r.status === 'success').length;
      const errorCount = results.filter((r: PreviewOperation) => r.status === 'error').length;
      
      setSuccess(`Successfully processed ${successCount} files. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`);
    } catch (err) {
      setError("Failed to execute operations. Check file permissions.");
      console.error(err);
    } finally {
      setIsExecuting(false);
      setProgress(null);
    }
  }

  async function handleBrowseSource() {
    const selected = await ipcService.selectFolder();
    if (selected) {
      setSourceFolder(selected);
    }
  }

  const stats = {
    total: preview.length,
    toMove: preview.filter(p => p.suggested_action === 'move').length,
    toCopy: preview.filter(p => p.suggested_action === 'copy').length,
    toDelete: preview.filter(p => p.suggested_action === 'delete').length,
    skipped: preview.filter(p => p.suggested_action === 'skip').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Rule Preview Engine</h2>
        <p className="text-sm text-zinc-500 font-medium">✨ Analyze your files safely before organizing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FolderSearch size={120} />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Scan Setup</h3>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Source Directory</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. C:\Users\Name\Downloads"
                    value={sourceFolder}
                    onChange={(e) => setSourceFolder(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                  <Tooltip content="Browse for folder">
                    <button 
                      onClick={handleBrowseSource}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                    >
                      <FolderOpen className="h-5 w-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Destination Base</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Use source folder (Default)"
                      value={destinationFolder}
                      onChange={(e) => setDestinationFolder(e.target.value)}
                      className="flex-1 rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                    />
                    <Tooltip content="Browse for destination">
                      <button 
                        onClick={async () => {
                          const selected = await ipcService.selectFolder();
                          if (selected) setDestinationFolder(selected);
                        }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                      >
                        <FolderOpen className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDestinationFolder(sourceFolder)}
                      className="flex-1 rounded-xl bg-white/5 border border-white/5 py-2 text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight"
                    >
                      Current Folder
                    </button>
                    <button 
                      onClick={() => setDestinationFolder("")}
                      className="px-4 rounded-xl bg-white/5 border border-white/5 py-2 text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/10 transition-all uppercase tracking-tight"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Conflict Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['skip', 'rename', 'replace'] as const).map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setConflictStrategy(strategy)}
                      className={cn(
                        "py-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all",
                        conflictStrategy === strategy 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs animate-in slide-in-from-top-2">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleGeneratePreview}
                  disabled={isScanning || isExecuting || !sourceFolder}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-zinc-300 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Generate Preview
                    </>
                  )}
                </button>

                {preview.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {isExecuting && progress && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-end px-1">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Organizing In Progress</p>
                            <p className="text-[10px] text-zinc-500 max-w-[180px] truncate">{progress.filename}</p>
                          </div>
                          <span className="text-[10px] font-bold text-white mb-0.5">
                            {Math.round((progress.current / progress.total) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleRunOrganization}
                      disabled={isExecuting || isScanning || stats.toMove + stats.toCopy + stats.toDelete === 0}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale animate-in zoom-in duration-300"
                    >
                      {isExecuting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing {progress?.current}/{progress?.total}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4" />
                          Run Organization
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#141421] p-6 space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Found</p>
                <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Organize</p>
                <p className="text-xl font-bold text-white mt-1">{stats.toMove + stats.toCopy + stats.toDelete}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#141421] overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Preview Operations
                <span className="text-xs font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full ml-2">
                  {isScanning ? "Scanning..." : `${preview.length} files found`}
                </span>
              </h3>
            </div>

            <div className="flex-1 overflow-auto max-h-[600px]">
              {preview.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-[#141421] z-10 border-b border-white/5">
                    <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="px-6 py-4">File / Rule</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {preview.map((op, idx) => (
                      <tr key={idx} className="group hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px]" title={op.original_path}>
                              {op.original_name}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-500/70">{op.rule_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border",
                            op.suggested_action === 'move' && "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                            op.suggested_action === 'copy' && "bg-green-500/10 text-green-400 border-green-500/20",
                            op.suggested_action === 'delete' && "bg-red-500/10 text-red-400 border-red-500/20",
                            op.suggested_action === 'skip' && "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
                          )}>
                            {op.suggested_action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                              {op.suggested_target ? (
                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                                  <ArrowRight className="h-3 w-3 text-indigo-500/50" />
                                  <span className="truncate max-w-[150px]" title={op.suggested_target}>
                                    {op.suggested_target.split(/[\\/]/).pop()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] italic text-zinc-700 font-medium tracking-tight">No change</span>
                              )}
                              
                              {op.status === 'success' && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-tight">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Executed
                                </div>
                              )}
                              
                              {op.status.startsWith('error') && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                                  <AlertCircle className="h-3 w-3" />
                                  Failed
                                </div>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-white/2 flex items-center justify-center text-zinc-700">
                    {isScanning || isExecuting ? <Clock className="h-8 w-8 animate-pulse text-indigo-500" /> : <FolderSearch className="h-8 w-8" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-400">
                      {isScanning ? "Crunching meta data..." : (isExecuting ? "Executing rules..." : "No preview generated")}
                    </h4>
                    <p className="text-sm text-zinc-600 max-w-[240px] mt-2">
                      {isScanning ? "Scanning system files and matching against your active rules." : (isExecuting ? "Applying your organization rules to the file system." : "Select a folder and click 'Generate Preview' to see how your rules will behave.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {preview.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {stats.toMove + stats.toCopy + stats.toDelete} Operations Suggested
                  </div>
                </div>
                <button className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
