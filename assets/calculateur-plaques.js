/* Calculateur de plaques gravees — AM Marquage
   Tarifs dans partials/plaques.json, template dans partials/calculateur-plaques.html.
   Remise progressive : 1-9 plein tarif, 10-30 a -10 %, 31+ a -20 % sur les
   unites au-dela du seuil (pas sur le total, sinon 31 plaques couteraient
   moins cher que 30). */

(function () {
  'use strict';

  function init(box) {
    var cfg;
    try { cfg = JSON.parse(box.dataset.plaques || '{}'); } catch (e) { return; }
    if (!cfg.epaisseurs) return;

    var q = function (role) { return box.querySelector('[data-role="' + role + '"]'); };
    var wRange = q('w-range'), wNum = q('w-num');
    var hRange = q('h-range'), hNum = q('h-num');
    var finition = q('finition'), qte = q('qte');
    var priceEl = q('price'), detailEl = q('detail'), mentionEl = q('mention'), cta = q('cta');

    var epaisseur = Object.keys(cfg.epaisseurs)[0];
    var PAS = cfg.pas_cm2 || 6.5;

    Array.prototype.forEach.call(box.querySelectorAll('[data-role="epaisseur"]'), function (r) {
      r.addEventListener('change', function () { epaisseur = r.value; update(); });
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-role="option"]'), function (c) {
      c.addEventListener('change', update);
    });
    if (finition) finition.addEventListener('change', update);
    if (qte) qte.addEventListener('input', update);

    function link(rangeEl, numEl) {
      rangeEl.addEventListener('input', function () { numEl.value = rangeEl.value; update(); });
      numEl.addEventListener('input', function () {
        var v = parseFloat(numEl.value);
        if (!isNaN(v)) rangeEl.value = v;
        update();
      });
    }
    link(wRange, wNum);
    link(hRange, hNum);

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function fr(v, dec) {
      var s = Number(v).toFixed(dec === undefined ? 1 : dec);
      if (dec === undefined) s = s.replace(/\.0$/, '');
      return s.replace('.', ',');
    }

    function update() {
      var ep = cfg.epaisseurs[epaisseur];
      var W = clamp(parseFloat(wNum.value) || 5, 5, 250);
      var H = clamp(parseFloat(hNum.value) || 5, 5, 250);
      var area = (W / 10) * (H / 10);

      var paliers = Math.max(1, Math.ceil(area / PAS));
      var suppFinition = 0;
      if (finition && cfg.finitions) {
        var f = cfg.finitions[finition.selectedIndex];
        if (f && f.supplement_palier) suppFinition = f.supplement_palier * paliers;
      }
      var unit = ep.base + ep.increment * (paliers - 1) + suppFinition;

      var n = clamp(parseInt(qte.value, 10) || 1, 1, cfg.quantite_max || 250);

      // remise progressive par tranche
      var seuils = (cfg.remises || []).slice().sort(function (a, b) { return a.a_partir_de - b.a_partir_de; });
      var total = 0, restant = n, couvert = 0, remiseAppliquee = 0;
      seuils.forEach(function (s) {
        var debut = s.a_partir_de;
        if (n < debut) return;
        var fin = Infinity;
        // borne haute = prochain seuil - 1
        var suivants = seuils.filter(function (x) { return x.a_partir_de > debut; });
        if (suivants.length) fin = Math.min.apply(null, suivants.map(function (x) { return x.a_partir_de; })) - 1;
        var unites = Math.min(n, fin) - debut + 1;
        if (unites > 0) { total += unit * (1 - s.taux) * unites; couvert += unites; remiseAppliquee = Math.max(remiseAppliquee, s.taux); }
      });
      var pleinTarif = n - couvert;
      if (pleinTarif > 0) total += unit * pleinTarif;

      priceEl.innerHTML = Math.round(total) + ' €<small>port inclus</small>';

      var txt = 'Surface : ' + fr(area, 1) + ' cm² · ' + paliers + ' palier' + (paliers > 1 ? 's' : '') +
                ' · épaisseur ' + ep.label;
      if (finition && finition.selectedIndex > 0) txt += ' · ' + finition.options[finition.selectedIndex].text;
      var opts = [];
      Array.prototype.forEach.call(box.querySelectorAll('[data-role="option"]'), function (c) {
        if (c.checked) opts.push(c.dataset.label);
      });
      if (opts.length) txt += ' · ' + opts.join(', ');
      if (n > 1) txt += ' · ' + n + ' plaques (' + Math.round(unit) + ' €/u)';
      detailEl.textContent = txt;

      if (mentionEl) {
        // le rappel des remises figure deja sous le champ Quantite :
        // ici on n'affiche que la remise reellement appliquee
        mentionEl.textContent = remiseAppliquee
          ? 'Remise de ' + Math.round(remiseAppliquee * 100) + ' % appliquée.'
          : '';
        mentionEl.hidden = !remiseAppliquee;
      }

      // Pas d'origine : les plaques ne sont fabriquees qu'en France.
      // L'epaisseur est portee par le parametre 'ep' : on ne la repete pas
      // dans le nom du produit, sinon le devis affiche « 2 mm 2 mm ».
      var params = '?produit=' + encodeURIComponent('Plaque laiton gravée') +
        '&l=' + W + '&h=' + H + '&qte=' + n + '&prix=' + Math.round(total) +
        '&ep=' + encodeURIComponent(ep.label) +
        (finition && finition.selectedIndex > 0 ? '&fin=' + encodeURIComponent(finition.options[finition.selectedIndex].text) : '') +
        (opts.length ? '&opt=' + encodeURIComponent(opts.join(', ')) : '');
      cta.href = '/pages/contact.html' + params;
    }

    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.calc-plaques'), init);
  });
})();
