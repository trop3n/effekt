import type { ExportFormat } from '../export/ExportPNG.ts';

export class Toolbar {
  private format: ExportFormat = 'png';
  private formatBtn: HTMLButtonElement;
  private dropdown: HTMLElement | null = null;
  private resolutionDisplay: HTMLSpanElement;

  constructor(
    container: HTMLElement,
    onExport: (format: ExportFormat, quality: number) => void,
    getResolution?: () => { width: number; height: number },
  ) {
    const exportGroup = document.createElement('div');
    exportGroup.className = 'toolbar__export-group';

    // Resolution display
    this.resolutionDisplay = document.createElement('span');
    this.resolutionDisplay.className = 'export-resolution-display';
    if (getResolution) {
      const dims = getResolution();
      if (dims.width > 0) {
        this.resolutionDisplay.textContent = `${dims.width} × ${dims.height}`;
      }
    }

    // Format selector button
    this.formatBtn = document.createElement('button');
    this.formatBtn.className = 'button button_variant_subtle export-format-btn';
    this.formatBtn.textContent = this.format.toUpperCase();
    this.formatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(container);
    });

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'button button_variant_primary';
    exportBtn.textContent = 'EXPORT';
    exportBtn.addEventListener('click', () => {
      onExport(this.format, this.format === 'jpeg' ? 0.92 : 1);
    });

    exportGroup.appendChild(this.resolutionDisplay);
    exportGroup.appendChild(this.formatBtn);
    exportGroup.appendChild(exportBtn);
    container.appendChild(exportGroup);

    // Close dropdown on outside click
    document.addEventListener('click', () => this.closeDropdown());
  }

  private toggleDropdown(container: HTMLElement) {
    if (this.dropdown) {
      this.closeDropdown();
      return;
    }

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'export-dropdown';
    this.dropdown.addEventListener('click', (e) => e.stopPropagation());

    const formats: ExportFormat[] = ['png', 'jpeg'];
    for (const fmt of formats) {
      const item = document.createElement('div');
      item.className = 'export-dropdown__item';
      if (fmt === this.format) item.classList.add('active');
      item.textContent = fmt.toUpperCase();
      item.addEventListener('click', () => {
        this.format = fmt;
        this.formatBtn.textContent = fmt.toUpperCase();
        this.closeDropdown();
      });
      this.dropdown.appendChild(item);
    }

    container.appendChild(this.dropdown);
  }

  private closeDropdown() {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
  }

  updateResolution(width: number, height: number) {
    if (width > 0 && height > 0) {
      this.resolutionDisplay.textContent = `${width} × ${height}`;
    } else {
      this.resolutionDisplay.textContent = '';
    }
  }
}
