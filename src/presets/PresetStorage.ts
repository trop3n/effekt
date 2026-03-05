import type { GraphSnapshot } from '../history/History.ts';

export interface StoredPreset {
  id: string;
  name: string;
  snapshot: GraphSnapshot;
  createdAt: number;
}

const STORAGE_KEY = 'effekt:presets';

function readPresets(): StoredPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredPreset[];
  } catch {
    return [];
  }
}

function writePresets(presets: StoredPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function getPresets(): StoredPreset[] {
  return readPresets();
}

export function savePreset(name: string, snapshot: GraphSnapshot): StoredPreset {
  const preset: StoredPreset = {
    id: `preset-${Date.now()}`,
    name,
    snapshot,
    createdAt: Date.now(),
  };
  const presets = readPresets();
  presets.push(preset);
  writePresets(presets);
  return preset;
}

export function deletePreset(id: string): void {
  const presets = readPresets().filter(p => p.id !== id);
  writePresets(presets);
}

export function renamePreset(id: string, name: string): void {
  const presets = readPresets();
  const preset = presets.find(p => p.id === id);
  if (preset) {
    preset.name = name;
    writePresets(presets);
  }
}
