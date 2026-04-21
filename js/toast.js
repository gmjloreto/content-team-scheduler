const container = document.createElement('div');
container.id = 'toast-container';
document.body.appendChild(container);

export const toast = {
  show(message, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;

    container.appendChild(el);

    const hide = () => {
      el.classList.add('hiding');
      el.addEventListener('animationend', () => {
        el.remove();
      }, { once: true });
    };

    setTimeout(hide, duration);

    el.onclick = hide;
  },
  
  success(message) {
    this.show(message, 'success');
  },
  
  error(message) {
    this.show(message, 'error');
  },
  
  info(message) {
    this.show(message, 'info');
  }
};
