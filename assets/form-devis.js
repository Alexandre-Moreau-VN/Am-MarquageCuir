/* Formulaire de devis — pré-remplissage depuis le calculateur.
   Le calculateur envoie : ?produit=…&l=…&h=…&qte=…&prix=…&ep=…
   Ce script remplit les champs cachés, affiche un récapitulatif
   et bloque l'envoi si les fichiers dépassent la limite Netlify (8 Mo). */

(function () {
  'use strict';

  var MAX_OCTETS = 8 * 1024 * 1024;

  function init() {
    var params = new URLSearchParams(window.location.search);
    var produit = params.get('produit');
    var l = params.get('l');
    var h = params.get('h');
    var qte = params.get('qte') || '1';
    var prix = params.get('prix');
    var ep = params.get('ep');

    var recap = document.getElementById('recap');
    var recapDetail = document.getElementById('recap-detail');
    var msg = document.getElementById('f-message');
    var dimensions = l && h ? l + ' × ' + h + ' mm' : '';

    if (produit) {
      document.getElementById('f-produit').value = produit + (ep ? ' (' + ep + ')' : '');
      document.getElementById('f-dimensions').value = dimensions;
      var n = parseInt(qte, 10) || 1;
      document.getElementById('f-quantite').value = n + (n > 1 ? ' pièces' : ' pièce');
      document.getElementById('f-prix').value = prix ? prix + ' €' : '';

      if (recap && recapDetail) {
        recap.hidden = false;
        recapDetail.textContent =
          produit + (ep ? ' ' + ep : '') +
          (dimensions ? ' · ' + dimensions : '') +
          (parseInt(qte, 10) > 1 ? ' · ' + qte + ' pièces' : '') +
          (prix ? ' · ' + prix + ' € TTC (indicatif, port inclus)' : '');
      }

      if (msg && !msg.value) {
        msg.value = 'Bonjour,\n\nJe souhaite un devis pour : ' + produit +
          (ep ? ' ' + ep : '') +
          (dimensions ? ', dimensions ' + dimensions : '') +
          (parseInt(qte, 10) > 1 ? ', quantité ' + qte : '') +
          (prix ? '.\nPrix indicatif affiché : ' + prix + ' €.' : '.') +
          '\n\nMerci d\'avance,';
      }
    }

    // Contrôle du poids total des fichiers (limite Netlify Forms : 8 Mo)
    var files = ['file1', 'file2', 'file3'].map(function (id) { return document.getElementById(id); });
    var note = document.getElementById('file-note');
    var submit = document.getElementById('submit-btn');

    function checkSize() {
      var total = 0;
      var n = 0;
      files.forEach(function (input) {
        if (input && input.files && input.files[0]) {
          total += input.files[0].size;
          n++;
        }
      });
      var mo = (total / (1024 * 1024));

      if (total > MAX_OCTETS) {
        if (note) {
          note.innerHTML = '<strong style="color:#c0392b">Fichiers trop volumineux : ' +
            mo.toFixed(1).replace('.', ',') + ' Mo</strong> — la limite est de 8 Mo au total. ' +
            'Envoyez-nous plutôt un lien WeTransfer ou SwissTransfer dans le message.';
        }
        if (submit) { submit.disabled = true; submit.style.opacity = '0.5'; }
      } else {
        if (note) {
          note.innerHTML = 'Formats : PNG, JPG, PDF, AI, PSD, SVG, CDR — <strong>8 Mo maximum au total</strong>.' +
            (n ? ' (' + mo.toFixed(1).replace('.', ',') + ' Mo)' : '') +
            ' Au-delà, envoyez-nous un lien WeTransfer dans le message.';
        }
        if (submit) { submit.disabled = false; submit.style.opacity = '1'; }
      }
    }

    files.forEach(function (input) {
      if (input) input.addEventListener('change', checkSize);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
