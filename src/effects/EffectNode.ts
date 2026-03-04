import type { EffectDefinition, EffectNodeState, PassDescriptor } from '../types.ts';

let nextId = 1;

export class EffectNode {
  readonly id: string;
  readonly definition: EffectDefinition;
  isOn: boolean;
  values: Record<string, number | boolean>;

  constructor(definition: EffectDefinition) {
    this.id = `node-${nextId++}`;
    this.definition = definition;
    this.isOn = true;
    // Initialize with defaults
    this.values = {};
    for (const param of definition.params) {
      this.values[param.name] = param.default;
    }
  }

  getPasses(): PassDescriptor[] {
    return this.definition.getPasses(this.values);
  }

  resetToDefaults() {
    for (const param of this.definition.params) {
      this.values[param.name] = param.default;
    }
  }

  toState(): EffectNodeState {
    return {
      id: this.id,
      definitionId: this.definition.id,
      isOn: this.isOn,
      values: { ...this.values },
    };
  }

  static fromState(state: EffectNodeState, definition: EffectDefinition): EffectNode {
    const node = new EffectNode(definition);
    // Override generated id with the saved one
    (node as { id: string }).id = state.id;
    node.isOn = state.isOn;
    node.values = { ...state.values };
    return node;
  }
}
