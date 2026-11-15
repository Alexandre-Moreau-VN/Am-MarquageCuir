// Le menu EN est désormais présent en dur dans le HTML (généré par build.py).
// Ce fichier ne gère plus que le comportement d'ouverture/fermeture.

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
initMenuBehavior();

// Charger l'assistant FAQ interactif
(function() {
  const botScript = document.createElement('script');
  botScript.src = '/assets/faq-bot.js';
  botScript.defer = true;
  document.head.appendChild(botScript);
})();