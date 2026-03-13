"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ipcService } from "@/services/ipcService";

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isCompleted = await ipcService.getOnboardingStatus();
        if (isCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/welcome");
        }
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
        setError("Please ensure the desktop application is running properly.");
      }
    };

    checkOnboarding();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B13] p-8 text-center text-white">
        <div className="max-w-md space-y-4">
          <div className="text-4xl mb-6">⚠️</div>
          <h1 className="text-xl font-bold">Connection Error</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold transition-all hover:bg-indigo-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B13]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-indigo-500 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Systems...</p>
      </div>
    </div>
  );
}
