/* Calculateur de prix — AM Marquage
   Généré par build.py depuis partials/calculateur.html.
   Les tarifs viennent de partials/tarifs.json (source unique). */

(function () {
  'use strict';

  function initCalc(box) {
    var base = parseFloat(box.dataset.base) || 49;
    var step = parseFloat(box.dataset.step) || 6.5;
    var inc = parseFloat(box.dataset.inc) || 10;
    var manchePrice = parseFloat(box.dataset.manche) || 0;
    var libelle = box.dataset.libelle || 'outil';

    var q = function (role) { return box.querySelector('[data-role="' + role + '"]'); };

    var wRange = q('w-range'), wNum = q('w-num');
    var hRange = q('h-range'), hNum = q('h-num');
    var qte = q('qte'), manche = q('manche'), epaisseur = q('epaisseur');
    var priceEl = q('price'), detailEl = q('detail'), cta = q('cta');

    if (!wRange || !hRange) return;

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
    if (epaisseur) epaisseur.addEventListener('change', function () {
      base = parseFloat(epaisseur.value) || base;
      update();
    });

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function update() {
      var W = clamp(parseFloat(wNum.value) || 5, 5, 120);
      var H = clamp(parseFloat(hNum.value) || 5, 5, 120);
      var area = (W / 10) * (H / 10);

      var tier = Math.max(1, Math.ceil(area / step));
      var unit = base + inc * (tier - 1);
      if (manche && manche.checked) unit += manchePrice;

      var n = qte ? clamp(parseInt(qte.value, 10) || 1, 1, 50) : 1;
      var total = unit * n;

      var from = (tier - 1) * step;
      var to = tier * step;
      var palier = (tier === 1)
        ? 'jusqu\u2019à ' + step.toString().replace('.', ',') + ' cm²'
        : from.toFixed(1).replace('.', ',') + ' à ' + to.toFixed(1).replace('.', ',') + ' cm²';

      priceEl.innerHTML = total + ' €<small>TTC, port inclus</small>';

      var txt = 'Surface : ' + area.toFixed(1).replace('.', ',') + ' cm² · ' + palier;
      if (manche && manche.checked) txt += ' · manche inclus';
      if (n > 1) txt += ' · ' + n + ' pièces (' + unit + ' €/u)';
      detailEl.textContent = txt;

      var params = '?produit=' + encodeURIComponent(libelle) +
        '&l=' + W + '&h=' + H + '&qte=' + n + '&prix=' + total +
        (epaisseur ? '&ep=' + encodeURIComponent(epaisseur.options[epaisseur.selectedIndex].text) : '');
      cta.href = '/pages/contact.html' + params;
    }

    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.calc-box'), initCalc);
  });
})();
