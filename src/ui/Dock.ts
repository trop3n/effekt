import type { EffectDefinition } from '../types.ts';

export class Dock {
  constructor(
    container: HTMLElement,
    definitions: EffectDefinition[],
    onAdd: (def: EffectDefinition) => void,
  ) {
    for (const def of definitions) {
      const item = document.createElement('div');
      item.className = 'dock__item';
      item.textContent = def.name;
      item.addEventListener('click', () => onAdd(def));
      container.appendChild(item);
    }
  }
}
