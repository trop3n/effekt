import type { GraphSnapshot } from '../history/History.ts';
import { getPresets, savePreset, deletePreset } from '../presets/PresetStorage.ts';

type Mode = 'save' | 'load';

export class PresetModal {
  private container: HTMLElement;
  private getSnapshot: () => GraphSnapshot;
  private onLoad: (snapshot: GraphSnapshot) => void;

  private backdrop!: HTMLElement;
  private panel!: HTMLElement;
  private mode: Mode = 'load';

  constructor(
    container: HTMLElement,
    getSnapshot: () => GraphSnapshot,
    onLoad: (snapshot: GraphSnapshot) => void,
  ) {
    this.container = container;
    this.getSnapshot = getSnapshot;
    this.onLoad = onLoad;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'preset-modal__backdrop';
    this.backdrop.addEventListener('click', () => this.close());

    this.panel = document.createElement('div');
    this.panel.className = 'preset-modal__panel';

    this.container.appendChild(this.backdrop);
    this.container.appendChild(this.panel);
    this.container.style.display = 'none';

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container.style.display !== 'none') {
        this.close();
      }
    });
  }

  openSave() {
    this.mode = 'save';
    this.render();
    this.container.style.display = '';
  }

  openLoad() {
    this.mode = 'load';
    this.render();
    this.container.style.display = '';
  }

  private close() {
    this.container.style.display = 'none';
  }

  private render() {
    this.panel.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'preset-modal__title';
    title.textContent = this.mode === 'save' ? 'SAVE PRESET' : 'PRESETS';
    this.panel.appendChild(title);

    if (this.mode === 'save') {
      this.renderSaveMode();
    } else {
      this.renderLoadMode();
    }
  }

  private renderSaveMode() {
    const input = document.createElement('input');
    input.className = 'preset-modal__input';
    input.type = 'text';
    input.placeholder = 'Preset name...';
    input.autofocus = true;
    this.panel.appendChild(input);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'button button_variant_primary preset-modal__save-btn';
    saveBtn.textContent = 'SAVE';
    saveBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) return;
      savePreset(name, this.getSnapshot());
      this.close();
    });
    this.panel.appendChild(saveBtn);

    // Enter key to save
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });

    // Focus after render
    requestAnimationFrame(() => input.focus());
  }

  private renderLoadMode() {
    const presets = getPresets();

    if (presets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'preset-modal__empty';
      empty.textContent = 'No saved presets yet.';
      this.panel.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'preset-modal__list';

    for (const preset of presets) {
      const item = document.createElement('div');
      item.className = 'preset-modal__item';

      const info = document.createElement('div');
      info.className = 'preset-modal__item-info';

      const name = document.createElement('span');
      name.className = 'preset-modal__item-name';
      name.textContent = preset.name;

      const date = document.createElement('span');
      date.className = 'preset-modal__item-date';
      date.textContent = new Date(preset.createdAt).toLocaleDateString();

      info.appendChild(name);
      info.appendChild(date);
      info.addEventListener('click', () => {
        this.onLoad(preset.snapshot);
        this.close();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'preset-modal__delete';
      deleteBtn.textContent = '\u00d7';
      deleteBtn.title = 'Delete preset';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePreset(preset.id);
        this.render();
      });

      item.appendChild(info);
      item.appendChild(deleteBtn);
      list.appendChild(item);
    }

    this.panel.appendChild(list);
  }
}
