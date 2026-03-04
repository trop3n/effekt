export class Toggle {
  readonly element: HTMLElement;
  private switchEl: HTMLElement;

  constructor(
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'param-toggle';

    const labelEl = document.createElement('span');
    labelEl.className = 'param-control__header';
    labelEl.textContent = label;

    this.switchEl = document.createElement('div');
    this.switchEl.className = 'param-toggle__switch';
    if (value) this.switchEl.classList.add('active');

    this.switchEl.addEventListener('click', () => {
      const isActive = this.switchEl.classList.toggle('active');
      onChange(isActive);
    });

    this.element.appendChild(labelEl);
    this.element.appendChild(this.switchEl);
  }

  setValue(value: boolean) {
    this.switchEl.classList.toggle('active', value);
  }
}
