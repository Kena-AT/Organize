"use client";

import { Rule } from "@/types";
import { 
  GripVertical, 
  Settings2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RulesListProps {
  rules: Rule[];
  onDelete: (id: string) => void;
  onToggleStatus: (rule: Rule) => void;
  onEdit: (rule: Rule) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

import { Tooltip } from "@/components/ui/tooltip";

export function RulesList({ rules, onDelete, onToggleStatus, onEdit, onMove }: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/1">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-zinc-600">
          <Settings2 className="h-8 w-8" />
        </div>
        <p className="text-zinc-500 font-medium">No rules created yet.</p>
        <p className="text-zinc-600 text-sm">Click &quot;New Rule&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-[#141421] overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/2">
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Priority</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rule Name</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Condition</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Action</th>
            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rules.sort((a, b) => a.priority - b.priority).map((rule, index) => (
            <tr key={rule.id} className="group hover:bg-white/2 transition-colors">
              <td className="px-6 py-4">
                <div className="flex flex-col items-center gap-1">
                  <Tooltip content="Increase Priority">
                    <button 
                      disabled={index === 0}
                      onClick={() => onMove(index, 'up')}
                      className="p-1 rounded hover:bg-white/5 text-zinc-600 disabled:opacity-20 hover:text-indigo-400 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content={`Sequence Position: ${index + 1}`}>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-3 w-3 text-zinc-700" />
                      <span className="text-xs font-mono text-indigo-500 font-bold">{index + 1}</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="Decrease Priority">
                    <button 
                      disabled={index === rules.length - 1}
                      onClick={() => onMove(index, 'down')}
                      className="p-1 rounded hover:bg-white/5 text-zinc-600 disabled:opacity-20 hover:text-indigo-400 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-white">{rule.name}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase">{rule.condition_type}</span>
                  <span className="text-sm text-zinc-400 font-mono italic">{rule.condition_value}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">{rule.action_type}</span>
                  <span className="text-sm text-zinc-400 truncate max-w-[150px]">{rule.action_target}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Tooltip content={rule.status === 'active' ? "Deactivate Rule" : "Activate Rule"}>
                  <button 
                    onClick={() => onToggleStatus(rule)}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      rule.status === 'active' ? "text-indigo-500" : "text-zinc-600"
                    )}
                  >
                    {rule.status === 'active' ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{rule.status}</span>
                  </button>
                </Tooltip>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip content="Edit Rule Properties">
                    <button 
                      onClick={() => onEdit(rule)}
                      className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Permanently Delete Rule">
                    <button 
                      onClick={() => onDelete(rule.id)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
