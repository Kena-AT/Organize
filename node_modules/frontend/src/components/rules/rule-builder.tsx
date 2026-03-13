"use client";

import { useState } from "react";
import { FolderOpen, ArrowRight, Save, X } from "lucide-react";
import { Rule } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";
import { ipcService } from "@/services/ipcService";

interface RuleBuilderProps {
  onSave: (rule: Rule) => void;
  onCancel: () => void;
  initialRule?: Rule;
}

export function RuleBuilder({ onSave, onCancel, initialRule }: RuleBuilderProps) {
  const [name, setName] = useState(initialRule?.name || "");
  const [conditionType, setConditionType] = useState(initialRule?.condition_type || "extension");
  const [conditionValue, setConditionValue] = useState(initialRule?.condition_value || "");
  const [actionType, setActionType] = useState(initialRule?.action_type || "move");
  const [actionTarget, setActionTarget] = useState(initialRule?.action_target || "");

  const handleBrowseTarget = async () => {
    const selected = await ipcService.selectFolder();
    if (selected) {
      setActionTarget(selected);
    }
  };

  const handleSave = () => {
    if (!name || !conditionValue || !actionTarget) return;
    onSave({
      id: initialRule?.id || crypto.randomUUID(),
      name,
      condition_type: conditionType,
      condition_value: conditionValue,
      action_type: actionType,
      action_target: actionTarget,
      status: initialRule?.status || "active",
      priority: initialRule?.priority || 0,
    });
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-[#141421] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-500">✨</div>
          <h3 className="text-xl font-bold text-white">Visual Rule Builder</h3>
        </div>
        <Tooltip content="Close editor without saving">
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </Tooltip>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Rule Name</label>
          <input 
            type="text" 
            placeholder="e.g., Organize Screenshots" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
          {/* Condition */}
          <div className="space-y-4 p-6 rounded-2xl bg-white/2 border border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">IF</span>
               <span className="text-xs font-bold text-zinc-400">FILE PROPERTY</span>
             </div>
             
             <div className="space-y-3">
               <select 
                 value={conditionType}
                 onChange={(e) => setConditionType(e.target.value)}
                 className="w-full rounded-xl border border-white/5 bg-[#0B0B13] px-4 py-3 text-sm text-white outline-none"
               >
                 <option value="extension">Extension equals</option>
                 <option value="name_contains">Name contains</option>
                 <option value="size_gt">Size greater than (MB)</option>
               </select>

               <input 
                 type="text" 
                 placeholder={conditionType === "extension" ? ".pdf, .jpg, .zip" : "Enter value..."}
                 value={conditionValue}
                 onChange={(e) => setConditionValue(e.target.value)}
                 className="w-full rounded-xl border border-white/5 bg-[#0B0B13] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
               />
             </div>
          </div>

          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <ArrowRight className="h-5 w-5 text-indigo-500" />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-4 p-6 rounded-2xl bg-white/2 border border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">THEN</span>
               <span className="text-xs font-bold text-zinc-400">ACTION</span>
             </div>

             <div className="space-y-3">
               <select 
                 value={actionType}
                 onChange={(e) => setActionType(e.target.value)}
                 className="w-full rounded-xl border border-white/5 bg-[#0B0B13] px-4 py-3 text-sm text-white outline-none"
               >
                 <option value="move">Move to folder</option>
                 <option value="copy">Copy to folder</option>
                 <option value="delete">Auto Delete</option>
               </select>

               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="Select target folder..."
                   value={actionTarget}
                   onChange={(e) => setActionTarget(e.target.value)}
                   className="flex-1 rounded-xl border border-white/5 bg-[#0B0B13] px-4 py-3 text-sm text-white outline-none"
                 />
                 <Tooltip content="Browse for target folder">
                   <button 
                     onClick={handleBrowseTarget}
                     className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors"
                   >
                     <FolderOpen className="h-5 w-5" />
                   </button>
                 </Tooltip>
               </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Tooltip content="Discard all changes">
            <button 
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-white/5 bg-white/5 text-sm font-bold text-zinc-400 hover:bg-white/10 transition-all"
            >
              Discard
            </button>
          </Tooltip>
          <Tooltip content="Process and store this rule">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all"
            >
              <Save className="h-4 w-4" />
              Save Rule
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
