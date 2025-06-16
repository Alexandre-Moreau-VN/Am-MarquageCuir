document.addEventListener('DOMContentLoaded', () => {
  fetch('/partials/menu.html')
    .then(response => {
      if (!response.ok) throw new Error('Menu not found');
      return response.text();
    })
    .then(html => {
      document.getElementById('menu').innerHTML = html;

      // Initialiser le comportement du menu après l'injection
      initMenuBehavior();
    })
    .catch(error => {
      console.error('Erreur lors du chargement du menu:', error);
    });
});

function initMenuBehavior() {
  document.querySelectorAll('#menu details').forEach((detail) => {
    const summary = detail.querySelector('summary');
    const content = detail.querySelector('ul');

    // Initial setup for animation styles
    content.style.opacity = '0';
    content.style.maxHeight = '0';
    content.style.pointerEvents = 'none';
    content.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';

    summary.addEventListener('click', (e) => {
      e.preventDefault();

      const isOpen = detail.classList.contains('open');

      // Close all other open details with animation
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


// menu vanishing logic
const menuBg = document.querySelector('.menu-bg');

// window.addEventListener('scroll', () => {
//   if (!menuBg) return;

//   const halfPage = document.body.scrollHeight / 2;

//   if (window.scrollY > halfPage) {
//     menuBg.classList.add('hide');
//     menuBg.classList.remove('show');
//   } else {
//     menuBg.classList.remove('hide');
//     menuBg.classList.add('show');
//   }
// });