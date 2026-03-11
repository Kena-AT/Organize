import { invoke } from "@tauri-apps/api/core";

export const ipcService = {
  ping: async (): Promise<string> => {
    try {
      return await invoke<string>("ping");
    } catch (error) {
      console.error("IPC Error (ping):", error);
      throw error;
    }
  },
};
