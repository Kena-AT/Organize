export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back!</h2>
        <p className="text-sm text-zinc-500 font-medium">✨ Organized 150 files yesterday</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-3xl border border-white/5 bg-[#141421] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-lg">⚙️</div>
            <h3 className="text-lg font-bold text-white">Configure Organization Task</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Source Folder</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value="/Users/alex/Downloads"
                  className="flex-1 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-300 outline-none"
                />
                <button className="rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">Browse</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Target Folder</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  readOnly 
                  value="/Users/alex/Documents/Sorted"
                  className="flex-1 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-300 outline-none"
                />
                <button className="rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">Browse</button>
              </div>
            </div>

            <button className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Start Organizing Now
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-[#141421] p-6">
            <h3 className="text-sm font-bold mb-4 text-indigo-500 uppercase tracking-tight">System Status</h3>
            <p className="text-sm text-zinc-400 leading-relaxed italic mb-4">
              &quot;Engine is idle and ready for new tasks. Last run was 2 hours ago.&quot;
            </p>
            <div className="h-1.5 w-full rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          </div>

          <div className="rounded-3xl border border-white/5 bg-[#141421] p-6">
            <h3 className="text-sm font-bold mb-4 text-white uppercase tracking-tight">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">📄</div>
                  <div>
                    <p className="text-xs font-bold text-white">45 Photos moved</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">10m ago</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">View All History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
