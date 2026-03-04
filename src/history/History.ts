import type { EffectNodeState } from '../types.ts';

export interface GraphSnapshot {
  nodes: EffectNodeState[];
  selectedId: string | null;
}

const MAX_HISTORY = 50;

export class History {
  private stack: GraphSnapshot[] = [];
  private index = -1;

  push(snapshot: GraphSnapshot) {
    // Truncate any redo entries
    this.stack.length = this.index + 1;
    this.stack.push(snapshot);
    // Enforce max size
    if (this.stack.length > MAX_HISTORY) {
      this.stack.shift();
    }
    this.index = this.stack.length - 1;
  }

  undo(): GraphSnapshot | null {
    if (!this.canUndo()) return null;
    this.index--;
    return this.stack[this.index]!;
  }

  redo(): GraphSnapshot | null {
    if (!this.canRedo()) return null;
    this.index++;
    return this.stack[this.index]!;
  }

  canUndo(): boolean {
    return this.index > 0;
  }

  canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }
}
