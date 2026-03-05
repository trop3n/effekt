export class Header {
  constructor(
    container: HTMLElement,
    onLoadMedia: () => void,
    onOpenPresets: () => void,
    onSavePreset: () => void,
  ) {
    const left = document.createElement('div');
    left.className = 'app-header__left';

    const logo = document.createElement('span');
    logo.className = 'app-header__logo';
    logo.textContent = 'EFFEKT';
    left.appendChild(logo);

    const right = document.createElement('div');
    right.className = 'app-header__right';

    const presetsBtn = document.createElement('button');
    presetsBtn.className = 'button button_variant_neutral';
    presetsBtn.textContent = 'PRESETS';
    presetsBtn.addEventListener('click', onOpenPresets);
    right.appendChild(presetsBtn);

    const savePresetBtn = document.createElement('button');
    savePresetBtn.className = 'button button_variant_subtle';
    savePresetBtn.textContent = 'SAVE PRESET';
    savePresetBtn.addEventListener('click', onSavePreset);
    right.appendChild(savePresetBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'button button_variant_primary';
    loadBtn.textContent = 'LOAD MEDIA';
    loadBtn.addEventListener('click', onLoadMedia);
    right.appendChild(loadBtn);

    container.appendChild(left);
    container.appendChild(right);
  }
}
