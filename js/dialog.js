export const dialog = {
  confirm(message) {
    return new Promise((resolve) => {
      if (!document.body) {
        console.error("Dialog: document.body not found.");
        resolve(false);
        return;
      }

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
        if (backdrop.classList.contains('hiding')) return;
        backdrop.classList.add('hiding');
        
        // Timer de segurança caso a animação falhe
        const fallback = setTimeout(() => {
          backdrop.remove();
          resolve(result);
        }, 400);

        backdrop.addEventListener('animationend', (e) => {
          if (e.animationName === 'fadeOut' || e.animationName === 'm3-dialog-exit') {
            clearTimeout(fallback);
            backdrop.remove();
            resolve(result);
          }
        }, { once: true });
      };

      backdrop.querySelector('.dialog-cancel').onclick = (e) => {
        e.stopPropagation();
        close(false);
      };
      
      backdrop.querySelector('.dialog-confirm').onclick = (e) => {
        e.stopPropagation();
        close(true);
      };
      
      backdrop.onclick = (e) => {
        if (e.target === backdrop) close(false);
      };
    });
  }
};
