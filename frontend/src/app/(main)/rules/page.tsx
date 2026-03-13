"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Download, Upload, Zap } from "lucide-react";
import { RuleBuilder } from "@/components/rules/rule-builder";
import { RulesList } from "@/components/rules/rules-list";
import { ipcService } from "@/services/ipcService";
import { Rule } from "@/types";

import { Tooltip } from "@/components/ui/tooltip";

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    setLoading(true);
    let fetchedRules = await ipcService.getRules();
    
    // Seed default rules if none exist
    if (fetchedRules.length === 0) {
      const defaultRules: Rule[] = [
        {
          id: crypto.randomUUID(),
          name: "Organize PDFs",
          condition_type: "extension",
          condition_value: ".pdf",
          action_type: "move",
          action_target: "/Documents/PDFs",
          status: "active",
          priority: 0,
        },
        {
          id: crypto.randomUUID(),
          name: "Cleanup Temporary Files",
          condition_type: "name_contains",
          condition_value: "temp, tmp",
          action_type: "delete",
          action_target: "N/A",
          status: "inactive",
          priority: 1,
        },
        {
          id: crypto.randomUUID(),
          name: "Archive Photos",
          condition_type: "extension",
          condition_value: ".jpg, .png",
          action_type: "copy",
          action_target: "/Pictures/Archive",
          status: "active",
          priority: 2,
        }
      ];

      for (const rule of defaultRules) {
        await ipcService.saveRule(rule);
      }
      fetchedRules = await ipcService.getRules();
    }
    
    setRules(fetchedRules);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSaveRule = async (ruleData: Rule) => {
    await ipcService.saveRule(ruleData);
    await loadRules();
    setShowBuilder(false);
    setEditingRule(null);
  };

  const handleDeleteRule = async (id: string) => {
    await ipcService.deleteRule(id);
    await loadRules();
  };

  const handleToggleStatus = async (rule: Rule) => {
    const updatedRule: Rule = {
      ...rule,
      status: rule.status === "active" ? "inactive" : "active",
    };
    await ipcService.saveRule(updatedRule);
    await loadRules();
  };

  const handleMoveRule = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rules.length) return;

    const updatedRules = [...rules];
    const [movedRule] = updatedRules.splice(index, 1);
    updatedRules.splice(newIndex, 0, movedRule);

    // Update priorities in DB
    for (let i = 0; i < updatedRules.length; i++) {
      updatedRules[i].priority = i;
      await ipcService.saveRule(updatedRules[i]);
    }
    await loadRules();
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "organize_rules.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedRules = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedRules)) {
          for (const rule of importedRules) {
            await ipcService.saveRule(rule);
          }
          await loadRules();
        }
      } catch (err) {
        console.error("Failed to import rules:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Rule Management
            <Tooltip content="Live Engine processing active">
              <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase font-bold tracking-widest cursor-help">
                Live Engine
              </div>
            </Tooltip>
          </h1>
          <p className="mt-1 text-zinc-500">Create and prioritize automation rules for your organization system.</p>
        </div>

        <div className="flex gap-3">
          <Tooltip content="Download rules as JSON">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-white/10 transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </Tooltip>
          <Tooltip content="Upload rules from JSON">
            <label className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-400 hover:bg-white/10 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500/50 outline-none">
              <Upload className="h-4 w-4" />
              Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </Tooltip>
          <Tooltip content="Add a new automation rule">
            <button 
              onClick={() => setShowBuilder(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </button>
          </Tooltip>
        </div>
      </div>

      {(showBuilder || editingRule) && (
        <RuleBuilder 
          onSave={handleSaveRule} 
          onCancel={() => { setShowBuilder(false); setEditingRule(null); }} 
          initialRule={editingRule || undefined}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-500" />
            Active Automation Sequence
          </h2>
          <div className="text-[10px] text-zinc-600 font-bold uppercase">
            Total Rules: {rules.length}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-white/5 bg-[#141421]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-4" />
            <p className="text-indigo-500/50 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Engine...</p>
          </div>
        ) : (
          <RulesList 
            rules={rules} 
            onDelete={handleDeleteRule}
            onToggleStatus={handleToggleStatus}
            onEdit={(rule) => setEditingRule(rule)}
            onMove={handleMoveRule}
          />
        )}
      </div>

      {!showBuilder && !editingRule && rules.length > 0 && (
         <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
               <Zap className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-bold text-white">Continuous Processing</p>
               <p className="text-xs text-zinc-500">Rules are executed in the order shown above. Use arrows to prioritize.</p>
             </div>
           </div>
           <Tooltip content="Execute current ruleset immediately">
             <button className="px-6 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all">
               Run Sequence Now
             </button>
           </Tooltip>
         </div>
      )}

      <div className="mt-16 p-8 rounded-3xl border border-white/5 bg-[#0B0B13]/50">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">How to Create Rules</h3>
        <p className="text-sm text-zinc-400 leading-relaxed space-y-4">
          Automation rules follow a simple <span className="text-indigo-400 font-bold">IF → THEN</span> logic. 
          To create a new rule, click the <span className="text-white font-bold text-xs px-2 py-1 rounded bg-indigo-600 mx-1">New Rule</span> button above. 
          First, define the <span className="text-white font-semibold">IF</span> condition by selecting a file property (like Extension or Name) and entering a value. 
          Then, choose the <span className="text-white font-semibold">THEN</span> action (like Move or Copy) and specify a target folder. 
          Rules are processed in sequence from top to bottom—use the <span className="text-indigo-400 font-bold">Priority arrows</span> to ensure critical rules run first. 
          Inactive rules are skipped by the engine, allowing you to temporarily disable automation sections without deleting them.
        </p>
      </div>
    </div>
  );
}
