export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
          <p className="text-sm text-zinc-500 font-medium">Personalize your experience and system integration.</p>
        </div>
        <button className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all">
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6">
          <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-tight">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Theme Mode</p>
              <p className="text-xs text-zinc-500">Choose how Organize looks on your screen.</p>
            </div>
            <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
              {['Light', 'Dark', 'System'].map((t) => (
                <button 
                  key={t}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${t === 'Dark' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-[#141421] p-8 space-y-6">
          <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-tight">System</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Startup Behavior</p>
              <p className="text-xs text-zinc-500">Launch Organize when the system starts.</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-indigo-600 p-1 flex items-center justify-end">
              <div className="h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
