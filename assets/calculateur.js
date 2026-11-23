/* Calculateur de prix — AM Marquage
   Généré par build.py depuis partials/calculateur.html + partials/tarifs.json.
   Gère les deux origines de fabrication (Vietnam par défaut, France en option). */

(function () {
  'use strict';

  function initCalc(box) {
    var libelle = box.dataset.libelle || 'outil';
    var manchePrice = parseFloat(box.dataset.manche) || 0;

    var grilles = {};
    try { grilles = JSON.parse(box.dataset.grilles || '{}'); } catch (e) { grilles = {}; }

    var checkedRadio = box.querySelector('[data-role="origine"]:checked');
    var origine = checkedRadio ? checkedRadio.value
                               : (box.dataset.origineDefaut || 'vietnam');

    var q = function (role) { return box.querySelector('[data-role="' + role + '"]'); };
    var wRange = q('w-range'), wNum = q('w-num');
    var hRange = q('h-range'), hNum = q('h-num');
    var qte = q('qte'), manche = q('manche'), epaisseur = q('epaisseur');
    var priceEl = q('price'), detailEl = q('detail'), mentionEl = q('mention'), cta = q('cta');

    if (!wRange || !hRange) return;

    // grille courante
    function g() {
      return grilles[origine] || grilles[Object.keys(grilles)[0]] || { base: 49, pas: 6.5, inc: 10 };
    }

    // synchronisation curseur <-> champ numérique
    function linkPair(rangeEl, numEl) {
      rangeEl.addEventListener('input', function () { numEl.value = rangeEl.value; update(); });
      numEl.addEventListener('input', function () {
        var v = parseFloat(numEl.value);
        if (!isNaN(v)) rangeEl.value = v;
        update();
      });
    }
    linkPair(wRange, wNum);
    linkPair(hRange, hNum);

    if (qte) qte.addEventListener('input', update);
    if (manche) manche.addEventListener('change', update);
    if (epaisseur) epaisseur.addEventListener('change', update);

    // changement d'origine
    Array.prototype.forEach.call(box.querySelectorAll('[data-role="origine"]'), function (radio) {
      radio.addEventListener('change', function () {
        origine = radio.value;
        update();
      });
    });

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function update() {
      // libelles selon la langue declaree sur le bloc
    var L = box.dataset.lang === 'en' ? {
      upTo: 'up to ', between: ' to ', surface: 'Area: ',
      madeIn: ' · made in ', handle: ' · handle included',
      pieces: ' pcs (', ttcp: '', request: 'Request a quote'
    } : {
      upTo: 'jusqu\u2019à ', between: ' à ', surface: 'Surface : ',
      madeIn: ' · fabriqué en ', handle: ' · manche inclus',
      pieces: ' pièces (', ttcp: 'TTC, port inclus', request: 'Demander mon devis'
    };

    var cfg = g();
      var W = clamp(parseFloat(wNum.value) || 5, 5, 120);
      var H = clamp(parseFloat(hNum.value) || 5, 5, 120);
      var area = (W / 10) * (H / 10);

      var base = cfg.base;
      if (epaisseur) base = parseFloat(epaisseur.value) || base;

      var tier = Math.max(1, Math.ceil(area / cfg.pas));
      var unit = base + cfg.inc * (tier - 1);
      if (manche && manche.checked) unit += (cfg.manche || manchePrice);

      var n = qte ? clamp(parseInt(qte.value, 10) || 1, 1, 50) : 1;
      var total = unit * n;

      var from = (tier - 1) * cfg.pas;
      var to = tier * cfg.pas;
      var palier = (tier === 1)
        ? L.upTo + fmt(cfg.pas) + ' cm²'
        : fmt(from) + L.between + fmt(to) + ' cm²';

      priceEl.innerHTML = total + ' €<small>' + (cfg.note ? '' : L.ttcp) + '</small>';

      var txt = L.surface + fmt(area, 1) + ' cm² · ' + palier +
                L.madeIn + cfg.label;
      if (manche && manche.checked) txt += L.handle;
      if (n > 1) txt += ' · ' + n + L.pieces + unit + ' €/u)';
      detailEl.textContent = txt;

      if (mentionEl) {
        mentionEl.textContent = cfg.note || '';
        mentionEl.hidden = false;
      }

      var params = '?produit=' + encodeURIComponent(libelle) +
        '&origine=' + encodeURIComponent(cfg.label) +
        '&l=' + W + '&h=' + H + '&qte=' + n + '&prix=' + total + '&mention=' + encodeURIComponent(cfg.note || '') +
        (epaisseur ? '&ep=' + encodeURIComponent(epaisseur.options[epaisseur.selectedIndex].text) : '');
      cta.href = (box.dataset.lang === 'en' ? '/pages/contact-en.html' : '/pages/contact.html') + params;
    }

    function fmt(v, dec) {
      var s = Number(v).toFixed(dec === undefined ? 1 : dec);
      s = s.replace(/\.0$/, '').replace(/0$/, '');
      return s.replace('.', ',');
    }

    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.calc-box'), initCalc);
  });
})();
