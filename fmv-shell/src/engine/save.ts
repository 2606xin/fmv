import type { GameState, SaveSlot, Settings } from "../types";

const SLOTS_KEY = "fmv-shell:slots";
const AUTO_KEY = "fmv-shell:autosave";
const SETTINGS_KEY = "fmv-shell:settings";
export const SLOT_COUNT = 3;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSlots(): (SaveSlot | null)[] {
  const raw = readJson<(SaveSlot | null)[]>(SLOTS_KEY, []);
  const slots: (SaveSlot | null)[] = [null, null, null];
  for (let i = 0; i < SLOT_COUNT; i++) {
    slots[i] = raw[i] ?? null;
  }
  return slots;
}

export function writeSlot(slot: number, state: GameState, preview: string): void {
  if (slot < 0 || slot >= SLOT_COUNT) return;
  const slots = loadSlots();
  slots[slot] = {
    slot,
    label: `存档 ${slot + 1}`,
    state,
    preview,
  };
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function clearSlot(slot: number): void {
  const slots = loadSlots();
  slots[slot] = null;
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function autosave(state: GameState, preview: string): void {
  const payload: SaveSlot = {
    slot: -1,
    label: "自动存档",
    state,
    preview,
  };
  localStorage.setItem(AUTO_KEY, JSON.stringify(payload));
}

export function loadAutosave(): SaveSlot | null {
  return readJson<SaveSlot | null>(AUTO_KEY, null);
}

export function hasContinue(): boolean {
  const a = loadAutosave();
  return Boolean(a?.state?.nodeId);
}

export const defaultSettings: Settings = {
  volume: 0.7,
  captionSize: "m",
};

export function loadSettings(): Settings {
  const s = readJson<Partial<Settings>>(SETTINGS_KEY, {});
  return {
    volume: typeof s.volume === "number" ? Math.min(1, Math.max(0, s.volume)) : 0.7,
    captionSize: s.captionSize === "s" || s.captionSize === "l" ? s.captionSize : "m",
  };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function formatTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}
