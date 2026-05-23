export interface Task {
  id: number;
  text: string;
  done: boolean;
}

export interface FocusLog {
  date: string;
  dur: number; // in seconds
  time: string;
}

export interface AppConfig {
  focus: number; // in minutes
  goal: number;  // in hours
  focusMode: 'free' | 'pomodoro';
}

export interface Quote {
  text: string;
  author: string;
}
