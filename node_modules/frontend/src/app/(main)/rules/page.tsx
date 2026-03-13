export default function RulesPage() {
  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Rules Management</h2>
          <p className="text-sm text-zinc-500 font-medium">Configure how your files are automatically sorted and organized.</p>
        </div>
        <button className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all">
          + New Rule
        </button>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#141421] p-10 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">✨</div>
        <div>
          <h3 className="text-lg font-bold text-white">No rules created yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs mx-auto">Start by creating your first rule to automate your file organization.</p>
        </div>
        <button className="text-indigo-500 text-sm font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Create your first rule</button>
      </div>
    </div>
  );
}
