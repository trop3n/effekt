import type { EffectDefinition } from '../types.ts';
import { EffectNode } from './EffectNode.ts';

export class EffectGraph {
  nodes: EffectNode[] = [];
  private onChange: () => void;

  constructor(onChange: () => void) {
    this.onChange = onChange;
  }

  add(definition: EffectDefinition): EffectNode {
    const node = new EffectNode(definition);
    this.nodes.push(node);
    this.onChange();
    return node;
  }

  remove(nodeId: string) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.onChange();
  }

  toggle(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.isOn = !node.isOn;
      this.onChange();
    }
  }

  reorder(fromIndex: number, toIndex: number) {
    const [node] = this.nodes.splice(fromIndex, 1);
    if (node) {
      this.nodes.splice(toIndex, 0, node);
      this.onChange();
    }
  }

  getActiveNodes(): EffectNode[] {
    return this.nodes.filter(n => n.isOn);
  }
}
