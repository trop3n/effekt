export class MediaInput {
  private onLoad: (image: HTMLImageElement) => void;

  constructor(onLoad: (image: HTMLImageElement) => void) {
    this.onLoad = onLoad;
  }

  /** Create a hidden file input and trigger it */
  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.loadFile(file);
    };
    input.click();
  }

  /** Load from a File (e.g., from drop event) */
  loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => this.onLoad(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  /** Set up drag-and-drop on an element */
  setupDropZone(element: HTMLElement) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      element.classList.add('dragover');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('dragover');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('dragover');
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadFile(file);
      }
    });
  }
}
