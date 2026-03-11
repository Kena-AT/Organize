"use client";

import { useState } from "react";
import Image from "next/image";
import { ipcService } from "@/services/ipcService";

export default function Home() {
  const [pingResponse, setPingResponse] = useState<string>("");

  const handlePing = async () => {
    try {
      const response = await ipcService.ping();
      setPingResponse(response);
    } catch (error) {
      setPingResponse("Error connecting to backend");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <Image
            className="dark:invert mb-4"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={37}
            priority
          />
          
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Organize Desktop
          </h1>
          
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Automate your file management with rule-based organization.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handlePing}
              className="flex h-12 items-center justify-center rounded-full bg-black px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Test Backend (Ping)
            </button>
            
            {pingResponse && (
              <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                Backend says: <span className="font-bold text-green-600 dark:text-green-400">{pingResponse}</span>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
