export interface Rule {
  id: string;
  name: string;
  condition_type: string;
  condition_value: string;
  action_type: string;
  action_target: string;
  status: 'active' | 'inactive';
  priority: number;
}

export interface AppSettings {
  onboarding_completed: boolean;
  theme: 'light' | 'dark' | 'system';
}
