"use client";

import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  FolderOpen, 
  ShieldAlert, 
  Save, 
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2
} from "lucide-react";
import { ipcService } from "@/services/ipcService";
import { cn } from "@/lib/utils";

interface AppSettings {
  default_source_folder: string;
  default_destination_folder: string;
  conflict_strategy: "skip" | "rename" | "replace";
  theme: "dark" | "light";
}

const DEFAULT_SETTINGS: AppSettings = {
  default_source_folder: "",
  default_destination_folder: "",
  conflict_strategy: "rename",
  theme: "dark",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [protectedFolders, setProtectedFolders] = useState<string[]>([]);
  const [newProtectedFolder, setNewProtectedFolder] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const allSettings = await ipcService.getAllSettings();
      
      const loadedSettings: AppSettings = { ...DEFAULT_SETTINGS };
      
      if (allSettings.default_source_folder) loadedSettings.default_source_folder = allSettings.default_source_folder;
      if (allSettings.default_destination_folder) loadedSettings.default_destination_folder = allSettings.default_destination_folder;
      if (allSettings.conflict_strategy) {
        loadedSettings.conflict_strategy = allSettings.conflict_strategy as "skip" | "rename" | "replace";
      }
      if (allSettings.theme) loadedSettings.theme = allSettings.theme as "dark" | "light";
      
      setSettings(loadedSettings);

      if (allSettings.protected_folders) {
        try {
          setProtectedFolders(JSON.parse(allSettings.protected_folders));
        } catch (e) {
          console.error("Failed to parse protected folders", e);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await ipcService.setSetting("default_source_folder", settings.default_source_folder);
      await ipcService.setSetting("default_destination_folder", settings.default_destination_folder);
      await ipcService.setSetting("conflict_strategy", settings.conflict_strategy);
      await ipcService.setSetting("theme", settings.theme);
      await ipcService.setSetting("protected_folders", JSON.stringify(protectedFolders));
      
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
      setSaveMessage("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBrowse(key: "default_source_folder" | "default_destination_folder") {
    const selected = await ipcService.selectFolder();
    if (selected) {
      setSettings(prev => ({ ...prev, [key]: selected }));
    }
  }

  async function handleAddProtectedFolder() {
    let folderToAdd = newProtectedFolder.trim();
    if (!folderToAdd) {
       const selected = await ipcService.selectFolder();
       if (selected) folderToAdd = selected;
    }

    if (folderToAdd && !protectedFolders.includes(folderToAdd)) {
      setProtectedFolders(prev => [...prev, folderToAdd]);
      setNewProtectedFolder("");
    }
  }

  function handleRemoveProtectedFolder(folder: string) {
    setProtectedFolders(prev => prev.filter(f => f !== folder));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-white font-outfit">Settings</h2>
          <p className="text-sm text-zinc-500 font-medium">✨ Configure Organize to match your workflow</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Defaults & Conflict */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Default Folders</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Source Directory</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. C:\Users\Name\Downloads"
                    value={settings.default_source_folder}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_source_folder: e.target.value }))}
                    className="flex-1 rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                  <button 
                    onClick={() => handleBrowse('default_source_folder')}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                  >
                    <FolderOpen className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 px-1">This folder will be pre-filled in the Dashboard scanner.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Base Destination Directory</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Leave blank to use Source as Destination"
                    value={settings.default_destination_folder}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_destination_folder: e.target.value }))}
                    className="flex-1 rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                  />
                  <button 
                    onClick={() => handleBrowse('default_destination_folder')}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                  >
                    <FolderOpen className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-600 px-1">Organized files will be placed inside this folder relative to their rules.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Execution Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Conflict Resolution Strategy</label>
                <p className="text-xs text-zinc-400 px-1 mb-2">What should happen if a file with the same name already exists in the destination?</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['skip', 'rename', 'replace'] as const).map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setSettings(prev => ({ ...prev, conflict_strategy: strategy }))}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all group",
                        settings.conflict_strategy === strategy 
                          ? "bg-blue-600/10 border-blue-500/50 text-white ring-1 ring-blue-500/20" 
                          : "bg-black/20 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      )}
                    >
                      <span className="text-sm font-bold uppercase tracking-widest">{strategy}</span>
                      <span className="text-[10px] text-center text-inherit opacity-70">
                        {strategy === 'skip' && "Ignore the file"}
                        {strategy === 'rename' && "Add a number suffix"}
                        {strategy === 'replace' && "Overwrite target file"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Protected & Info */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6 flex flex-col">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Protected Folders</h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Files strictly within these directories will <strong className="text-orange-400">NEVER</strong> be moved or deleted, even if a rule matches them.
            </p>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add folder path manually..."
                value={newProtectedFolder}
                onChange={(e) => setNewProtectedFolder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProtectedFolder()}
                className="flex-1 rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-sm text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
              />
              <button 
                onClick={() => handleAddProtectedFolder()}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold text-xs"
              >
                Add / Browse
              </button>
            </div>

            <div className="flex-1 min-h-[150px] bg-black/20 rounded-2xl border border-white/5 p-2 space-y-2 overflow-y-auto custom-scrollbar">
              {protectedFolders.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-medium border border-dashed border-white/5 rounded-xl m-2 bg-white/1">
                  No protected folders configured
                </div>
              ) : (
                protectedFolders.map((folder, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                    <span className="text-xs text-zinc-300 font-mono truncate mr-4" title={folder}>{folder}</span>
                    <button 
                      onClick={() => handleRemoveProtectedFolder(folder)}
                      className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {saveMessage && (
               <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in slide-in-from-bottom-2">
                 <CheckCircle2 className="h-4 w-4" />
                 {saveMessage}
               </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/5 bg-linear-to-br from-[#141421] to-[#0B0B13] p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                <Info className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">About Organize</h3>
            </div>
            <div className="space-y-2 text-xs text-zinc-500 mt-4">
              <p className="flex justify-between border-b border-white/5 pb-2 pt-2">
                <span className="font-bold text-zinc-400">Version</span>
                <span>0.1.0-alpha</span>
              </p>
              <p className="flex justify-between border-b border-white/5 pb-2 pt-2">
                <span className="font-bold text-zinc-400">Engine</span>
                <span>Tauri v2 + Rust</span>
              </p>
              <p className="flex justify-between pt-2">
                <span className="font-bold text-zinc-400">UI</span>
                <span>Next.js 15 + Tailwind</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
