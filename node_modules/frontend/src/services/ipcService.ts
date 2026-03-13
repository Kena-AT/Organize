import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import { Rule } from "@/types";

export const ipcService = {
  ping: async (): Promise<string> => {
    try {
      return await invoke<string>("ping");
    } catch (error) {
      console.error("IPC Error (ping):", error);
      throw error;
    }
  },

  getOnboardingStatus: async (): Promise<boolean> => {
    try {
      const db = await Database.load("sqlite:organize.db");
      const result = await db.select<{ value: string }[]>(
        "SELECT value FROM settings WHERE key = 'onboarding_completed'"
      );
      return result.length > 0 && result[0].value === "true";
    } catch (error) {
      console.error("Error getting onboarding status:", error);
      return false;
    }
  },

  completeOnboarding: async (): Promise<void> => {
    try {
      const db = await Database.load("sqlite:organize.db");
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarding_completed', 'true')"
      );
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  },

  getRules: async (): Promise<Rule[]> => {
    try {
      const db = await Database.load("sqlite:organize.db");
      return await db.select<Rule[]>("SELECT * FROM rules ORDER BY priority ASC");
    } catch (error) {
      console.error("Error fetching rules:", error);
      return [];
    }
  },

  saveRule: async (rule: Rule): Promise<void> => {
    try {
      const db = await Database.load("sqlite:organize.db");
      await db.execute(
        `INSERT OR REPLACE INTO rules (id, name, condition_type, condition_value, action_type, action_target, status, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [rule.id, rule.name, rule.condition_type, rule.condition_value, rule.action_type, rule.action_target, rule.status, rule.priority]
      );
    } catch (error) {
      console.error("Error saving rule:", error);
      throw error;
    }
  },

  deleteRule: async (id: string): Promise<void> => {
    try {
      const db = await Database.load("sqlite:organize.db");
      await db.execute("DELETE FROM rules WHERE id = $1", [id]);
    } catch (error) {
      console.error("Error deleting rule:", error);
      throw error;
    }
  },
};
