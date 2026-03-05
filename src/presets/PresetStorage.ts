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

export function exportPresetToFile(preset: StoredPreset): void {
  const json = JSON.stringify(preset, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${preset.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.effekt.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPresetFromFile(): Promise<StoredPreset | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as StoredPreset;
          if (!data.name || !data.snapshot?.nodes) { resolve(null); return; }
          // Save with a fresh ID to avoid collisions
          const preset = savePreset(data.name, data.snapshot);
          resolve(preset);
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
}
