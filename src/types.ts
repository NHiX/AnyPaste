export type Language = "en" | "fr" | "es" | "de";

export type ClipKind = "text" | "url" | "code";

export interface ClipItem {
  id: string;
  content: string;
  kind: ClipKind;
  source_app?: string | null;
  created_at: string;
  pinned: boolean;
  pinboard?: string | null;
}

export interface Pinboard {
  id: string;
  name: string;
  color: string;
}

export interface Settings {
  language: Language;
  max_history: number;
  hotkey: string;
  launch_at_login: boolean;
}

export interface AppSnapshot {
  clips: ClipItem[];
  pinboards: Pinboard[];
  paused: boolean;
  settings: Settings;
}
