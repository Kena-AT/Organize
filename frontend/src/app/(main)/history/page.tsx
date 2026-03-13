"use client";

import { useEffect, useState } from "react";
import { ipcService } from "@/services/ipcService";
import { RunRecord, PreviewOperation } from "@/types";
import { 
  History as HistoryIcon, 
  Calendar, 
  Files, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  ChevronRight,
  FolderOpen,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export default function HistoryPage() {
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runOperations, setRunOperations] = useState<PreviewOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setIsLoading(true);
    try {
      const data = await ipcService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectRun(runId: string) {
    setSelectedRun(runId);
    try {
      const ops = await ipcService.getRunOperations(runId);
      setRunOperations(ops);
    } catch (err) {
      console.error("Failed to load run details:", err);
    }
  }

  const filteredHistory = history.filter(run => 
    run.source_folder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    run.destination_folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-white font-outfit">Activity Logs</h2>
          <p className="text-sm text-zinc-500 font-medium">✨ Track and review your file organization history</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 rounded-2xl border border-white/5 bg-[#141421] pl-11 pr-5 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
        {/* Runs List */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4">
          <div className="rounded-3xl border border-white/5 bg-[#0B0B13] overflow-hidden flex flex-col flex-1 shadow-2xl shadow-black/50">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Runs</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded-full uppercase">{filteredHistory.length} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-zinc-700 gap-4">
                  <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Retrieving history...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-20 px-8 text-zinc-700 bg-white/[0.01] rounded-2xl border border-white/5 m-4 border-dashed">
                  <Files className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">No activity recorded yet</p>
                </div>
              ) : (
                filteredHistory.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => handleSelectRun(run.id)}
                    className={cn(
                      "w-full rounded-2xl p-4 transition-all duration-300 group text-left border relative overflow-hidden",
                      selectedRun === run.id 
                        ? "bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                    )}
                  >
                    {selectedRun === run.id && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500" />
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-3 w-3 text-indigo-400/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {new Date(run.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-all duration-300",
                        selectedRun === run.id ? "text-indigo-400 translate-x-1" : "text-zinc-700 opacity-0 group-hover:opacity-100"
                      )} />
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3 text-zinc-600" />
                        <span className="text-xs font-medium text-zinc-300 truncate max-w-[200px]" title={run.source_folder}>
                          {run.source_folder.split(/[\\/]/).pop()}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-700" />
                        <span className="text-xs font-bold text-white truncate max-w-[200px]" title={run.destination_folder}>
                          {run.destination_folder.split(/[\\/]/).pop()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/5">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase">Files</span>
                        <span className="text-xs font-bold text-white">{run.total_files}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 rounded-xl bg-indigo-500/5">
                        <span className="text-[8px] font-bold text-indigo-400 uppercase">OK</span>
                        <span className="text-xs font-bold text-indigo-400">{run.success_count}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 rounded-xl bg-red-500/5">
                        <span className="text-[8px] font-bold text-red-400 uppercase">Errors</span>
                        <span className="text-xs font-bold text-red-400">{run.error_count}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details View */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
          <div className="rounded-3xl border border-white/5 bg-[#0B0B13] overflow-hidden flex flex-col flex-1 shadow-2xl shadow-black/50">
            {selectedRun ? (
              <>
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <Files className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-tight">Run Details</h3>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{selectedRun.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0B0B13] z-10">
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Operation</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">File Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Rule</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {runOperations.map((op, idx) => (
                        <tr key={idx} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg",
                              op.suggested_action === 'move' ? "bg-blue-500/10 text-blue-400" :
                              op.suggested_action === 'copy' ? "bg-indigo-500/10 text-indigo-400" :
                              op.suggested_action === 'delete' ? "bg-red-500/10 text-red-400" :
                              "bg-zinc-500/10 text-zinc-400"
                            )}>
                              {op.suggested_action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate max-w-[200px]" title={op.original_name}>
                                {op.original_name}
                              </span>
                              <span className="text-[9px] font-medium text-zinc-600 truncate max-w-[200px]" title={op.suggested_target}>
                                {op.suggested_target.split(/[\\/]/).pop()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-zinc-500">{op.rule_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {op.status === 'success' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : op.status === 'error' ? (
                                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              ) : (
                                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                              )}
                              <span className={cn(
                                "text-[10px] font-bold uppercase",
                                op.status === 'success' ? "text-emerald-500" :
                                op.status === 'error' ? "text-red-500" :
                                "text-zinc-600"
                              )}>
                                {op.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-zinc-700 bg-white/[0.01]">
                <div className="relative mb-6">
                  <FolderOpen className="h-16 w-16 opacity-5" />
                  <HistoryIcon className="h-8 w-8 absolute -bottom-2 -right-2 text-zinc-800" />
                </div>
                <h3 className="text-lg font-bold text-zinc-700">Select a run</h3>
                <p className="text-sm max-w-[200px] text-center mt-2">Click on an activity record on the left to view detailed file operations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
