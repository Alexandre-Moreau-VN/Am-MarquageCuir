const MENU_KEY = 'cachedMenu';

function loadMenuFromCacheOrFetch() {
  const container = document.getElementById('menu');
  const cached = localStorage.getItem(MENU_KEY);

  if (cached) {
    container.innerHTML = cached;
    initMenuBehavior();
  }

  fetch('/partials/menu-en.html')
    .then(response => {
      if (!response.ok) throw new Error('Menu not found');
      return response.text();
    })
    .then(html => {
      localStorage.setItem(MENU_KEY, html);

      if (!cached) {
        container.innerHTML = html;
        initMenuBehavior();
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement du menu :', error);
    });
}

function initMenuBehavior() {
  document.querySelectorAll('#menu details').forEach((detail) => {
    const summary = detail.querySelector('summary');
    const content = detail.querySelector('ul');

    // Style initial
    content.style.opacity = '0';
    content.style.maxHeight = '0';
    content.style.pointerEvents = 'none';
    content.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      const isOpen = detail.classList.contains('open');

      // Fermer tous les autres
      document.querySelectorAll('#menu details.open').forEach((otherDetail) => {
        if (otherDetail !== detail) {
          const otherContent = otherDetail.querySelector('ul');
          otherContent.style.opacity = '0';
          otherContent.style.maxHeight = '0';
          otherContent.style.pointerEvents = 'none';

          setTimeout(() => {
            otherDetail.classList.remove('open');
            otherDetail.removeAttribute('open');
          }, 300);
        }
      });

      if (!isOpen) {
        detail.setAttribute('open', '');
        detail.classList.add('open');

        requestAnimationFrame(() => {
          content.style.opacity = '1';
          content.style.maxHeight = '500px';
          content.style.pointerEvents = 'auto';
        });
      } else {
        content.style.opacity = '0';
        content.style.maxHeight = '0';
        content.style.pointerEvents = 'none';

        setTimeout(() => {
          detail.classList.remove('open');
          detail.removeAttribute('open');
        }, 300);
      }
    });
  });
}

// Lancement immédiat si le script est chargé avec "defer"
loadMenuFromCacheOrFetch();