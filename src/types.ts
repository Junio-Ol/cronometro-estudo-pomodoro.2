export interface Task {
  id: number;
  text: string;
  done: boolean;
  starred?: boolean; // Pinned as primary current objective
}

export interface FocusLog {
  date: string;
  dur: number; // in seconds
  time: string;
  rating?: number; // focus score 1 to 5 stars
  mode?: 'pomodoro' | 'free' | 'break'; // focus style category
}

export interface AppConfig {
  focus: number; // in minutes
  goal: number;  // in hours
  focusMode: 'free' | 'pomodoro';
  theme?: 'violet' | 'emerald' | 'ocean' | 'amber'; // visual theme presets
  activeZen?: boolean; // distraction-free mode
  breathingActive?: boolean; // visual guide active
  streak?: number; // daily consecutive concentration habit streak
}

export interface Quote {
  text: string;
  author: string;
}
