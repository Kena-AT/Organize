export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Activity Logs</h2>
          <p className="text-sm text-zinc-500 font-medium">Keep track of every file operation performed by Organize.</p>
        </div>
        <button className="rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-bold text-zinc-300 hover:bg-white/10 transition-all">
          Undo Last Run
        </button>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#141421] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Activity</h3>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total this week: 1,248 files</div>
        </div>
        <div className="p-8 text-center space-y-3">
          <div className="text-4xl">📂</div>
          <p className="text-sm text-zinc-500">Your organization history will appear here.</p>
        </div>
      </div>
    </div>
  );
}
