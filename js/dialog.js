export const dialog = {
  confirm(message) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'dialog-backdrop';

      backdrop.innerHTML = `
        <div class="dialog-content">
          <p>${message}</p>
          <div class="dialog-actions">
            <button class="dialog-cancel">Cancelar</button>
            <button class="dialog-confirm">Confirmar</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const close = (result) => {
        backdrop.classList.add('hiding');
        backdrop.addEventListener('animationend', (e) => {
          if (e.animationName === 'fadeOut') {
            backdrop.remove();
            resolve(result);
          }
        });
      };

      backdrop.querySelector('.dialog-cancel').onclick = () => close(false);
      backdrop.querySelector('.dialog-confirm').onclick = () => close(true);
      
      backdrop.onclick = (e) => {
        if (e.target === backdrop) close(false);
      };
    });
  }
};
