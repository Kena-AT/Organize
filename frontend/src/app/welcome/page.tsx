"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ipcService } from "@/services/ipcService";

const WelcomeLayout = ({ children, step, totalSteps, onNext, onBack, onSkip }: {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B13] font-sans text-white">
      <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col items-center justify-between p-12 overflow-hidden rounded-3xl bg-[#12121E]/50 shadow-2xl border border-white/5 backdrop-blur-xl">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="font-bold text-xs">Câ</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Organize</span>
          </div>
          {onSkip && (
            <button onClick={onSkip} className="text-sm font-medium text-zinc-500 hover:text-white transition-colors">
              Skip
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col items-center justify-center w-full max-w-2xl py-8">
          {children}
        </div>

        {/* Footer / Navigation */}
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-500">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-950/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex-1 h-12 rounded-xl bg-zinc-900 border border-white/5 font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                Previous
              </button>
            )}
            <button 
              onClick={onNext}
              className="flex-[2] h-12 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              {step === totalSteps ? "Get Started" : "Next Step"}
            </button>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="mt-8 text-[10px] font-medium text-zinc-600">
          Securely organizing 2M+ desktops worldwide.
        </div>
      </div>
    </div>
  );
};

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      await ipcService.completeOnboarding();
      router.push("/");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = async () => {
    await ipcService.completeOnboarding();
    router.push("/");
  };

  return (
    <WelcomeLayout 
      step={step} 
      totalSteps={3} 
      onNext={handleNext} 
      onBack={step > 1 ? handleBack : undefined}
      onSkip={step < 3 ? handleSkip : undefined}
    >
      {step === 1 && (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-8 h-48 w-48 animate-pulse-subtle">
             <div className="absolute inset-0 rounded-3xl bg-indigo-600/20 blur-3xl" />
             <div className="relative h-full w-full rounded-3xl border border-white/10 bg-[#1A1A2E] flex items-center justify-center">
                <div className="h-16 w-16 text-indigo-500">
                   {/* Icon mockup */}
                   <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                   </svg>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-4 h-6 w-6 rounded-full bg-indigo-500 border-4 border-[#1A1A2E] flex items-center justify-center">
                   <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                   </svg>
                </div>
             </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Welcome to Organize</h1>
          <p className="text-lg text-zinc-400">
            The smartest way to keep your desktop clutter-free and your files accessible.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <h2 className="mb-2 text-3xl font-bold">Automate Your Workflow</h2>
          <p className="mb-10 text-zinc-400">
            Create custom rules to automatically move, rename, or delete files based on your preferences.
          </p>
          
          <div className="w-full max-w-lg rounded-2xl border border-white/5 bg-[#161625] p-6 text-left">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              Rule Builder
            </div>
            
            <div className="space-y-4">
               <div className="rounded-xl bg-[#1D1D2F] p-4 border-l-2 border-indigo-500">
                  <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Condition</div>
                  <div className="text-sm font-medium">If file type is <span className="text-zinc-50">.pdf</span></div>
               </div>
               
               <div className="flex justify-center -my-2 relative z-10">
                  <div className="h-4 w-px bg-zinc-700" />
               </div>

               <div className="rounded-xl bg-[#1D1D2F] p-4 border-l-2 border-green-500 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-zinc-500 mb-1">Action</div>
                    <div className="text-sm font-medium">Move to <span className="text-zinc-50">&apos;Invoices&apos;</span> folder</div>
                  </div>
                  <div className="h-5 w-5 rounded-full border border-green-500/50 flex items-center justify-center">
                     <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                     </svg>
                  </div>
               </div>
            </div>

            <div className="mt-8 rounded-xl border border-dashed border-white/5 p-4 flex flex-col items-center gap-2">
               <div className="flex gap-4 items-center">
                  <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center"><span className="text-xs">📄</span></div>
                  <div className="text-zinc-500">→</div>
                  <div className="h-8 w-8 rounded bg-indigo-900/40 flex items-center justify-center outline outline-1 outline-indigo-500/30 text-indigo-400">📁</div>
               </div>
               <div className="text-[10px] text-zinc-500">Files are processed instantly as they arrive</div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-500 mb-2">Step 3 of 3</div>
              <h2 className="text-4xl font-bold mb-4">Stay in Control</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Review every action in your history log and undo any task with a single click.
              </p>
              
              <div className="space-y-4">
                 <div className="text-xs font-bold uppercase tracking-wider text-zinc-600">Recent Activity</div>
                 <div className="rounded-xl bg-[#161625] p-3 flex items-center justify-between border border-white/5 opacity-50 scale-95 origin-left">
                    <div className="flex gap-3 items-center">
                       <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">📝</div>
                       <div>
                          <div className="text-xs font-bold">Project &apos;Alpha&apos; Updated</div>
                          <div className="text-[9px] text-zinc-500 uppercase">2 minutes ago</div>
                       </div>
                    </div>
                    <button className="text-[10px] px-3 py-1 bg-indigo-600 rounded-md font-bold uppercase">Undo</button>
                 </div>
                 <div className="rounded-xl bg-[#161625] p-3 flex items-center justify-between border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                    <div className="flex gap-3 items-center">
                       <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">✓</div>
                       <div>
                          <div className="text-xs font-bold tracking-tight">Task &apos;Q4 Planning&apos; Completed</div>
                          <div className="text-[9px] text-zinc-500 uppercase">15 minutes ago</div>
                       </div>
                    </div>
                    <button className="text-[10px] px-3 py-1 border border-zinc-700 rounded-md font-bold uppercase text-zinc-500">Undo</button>
                 </div>
              </div>
            </div>

            <div className="relative">
               <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 w-full bg-indigo-600/10 blur-[80px] rounded-full" />
               <div className="relative h-64 w-full rounded-2xl border border-white/5 bg-gradient-to-br from-[#1C1C2F] to-[#12121E] shadow-2xl p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1.5">
                         <div className="h-2 w-2 rounded-full bg-red-500/60" />
                         <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                         <div className="h-2 w-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="text-[8px] font-medium text-zinc-600">history_log.app</div>
                  </div>
                  <div className="space-y-2">
                     <div className="h-4 w-3/4 bg-white/5 rounded-md" />
                     <div className="h-10 w-full bg-white/5 rounded-md" />
                     <div className="h-10 w-full bg-white/5 rounded-md" />
                     <div className="h-10 w-full bg-white/5 rounded-md" />
                  </div>
                  
                  <div className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-600/10 animate-bounce-slow">
                     <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                     </svg>
                  </div>
               </div>
               
               <div className="absolute -bottom-2 right-12 flex gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                  <div className="h-1.5 w-3 rounded-full bg-indigo-600" />
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
               </div>
            </div>
          </div>
        </div>
      )}
    </WelcomeLayout>
  );
}
