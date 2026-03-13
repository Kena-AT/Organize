"use client";

import { Bell, Search, Activity } from "lucide-react";

export function Header() {
  return (
    <header className="fixed right-0 top-0 z-30 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-white/5 bg-[#0B0B13]/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="relative group w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-500" />
          <input 
            type="text" 
            placeholder="Search rules, history, or files..." 
            className="h-10 w-full rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-indigo-500/50 focus:bg-white/[0.07]"
          />
        </div>
        
        <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
          <Activity className="h-3.5 w-3.5 text-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">Engine Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="text-right">
            <p className="text-xs font-bold text-white">System Status</p>
            <p className="text-[10px] text-zinc-500">All systems operational</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
        </div>
      </div>
    </header>
  );
}
