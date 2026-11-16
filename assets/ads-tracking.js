/* Suivi des conversions Google Ads — AM Marquage
 *
 * Trois conversions sont prévues :
 *   - "form"   : envoi du formulaire de devis (déclenché sur thanks.html)
 *   - "tel"    : clic sur un lien téléphone
 *   - "mailto" : clic sur un lien e-mail
 *
 * ⚠️ LES LABELS DOIVENT ÊTRE REMPLIS PAR ALEXANDRE.
 * Google Ads → Objectifs → Conversions → créer une conversion "Site web"
 * → la balise fournie ressemble à :
 *     gtag('event', 'conversion', {'send_to': 'AW-17551171481/AbC-dEfGhIj'});
 * La partie après le "/" est le label à coller ci-dessous.
 * Tant qu'un label est vide, la conversion correspondante n'est pas envoyée.
 */

(function () {
  'use strict';

  var ADS_ID = 'AW-17551171481';

  var LABELS = {
    form: '',    // ex. 'AbC-dEfGhIj'
    tel: '',     // ex. 'KlM-nOpQrSt'
    mailto: ''   // ex. 'UvW-xYzAbCd'
  };

  // --- chargement de gtag si absent (pages sans le snippet Ads) -------------
  function loadGtag() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ADS_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS_ID;
    document.head.appendChild(s);
  }

  // --- envoi d'une conversion ----------------------------------------------
  function fire(name) {
    var label = LABELS[name];
    if (!label) return false;           // pas encore configuré
    if (typeof window.gtag !== 'function') return false;
    window.gtag('event', 'conversion', { send_to: ADS_ID + '/' + label });
    return true;
  }

  // --- clics sur téléphone et e-mail ---------------------------------------
  function trackClicks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) fire('tel');
      else if (href.indexOf('mailto:') === 0) fire('mailto');
    }, true);
  }

  function init() {
    loadGtag();
    trackClicks();
    // page de remerciement = conversion "formulaire envoyé"
    if (/thanks\.html/i.test(window.location.pathname)) {
      fire('form');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // utilisable manuellement si besoin
  window.amTrackConversion = fire;
})();
