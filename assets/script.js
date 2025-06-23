document.addEventListener('DOMContentLoaded', function() {
  // Gestion des fichiers
  
  
  
  
  function checkTotalFileSize() {
      const maxSize = 20 * 1024 * 1024; // 20MB
      const files = [
          document.getElementById('file1').files[0],
          document.getElementById('file2').files[0],
          document.getElementById('file3').files[0]
      ];

      let totalSize = 0;

      files.forEach(file => {
          if (file) {
              totalSize += file.size;
          }
      });

      if (totalSize > maxSize) {
          alert('La taille totale des fichiers ne doit pas dépasser 20MB.');
          document.getElementById('file1').value = '';
          document.getElementById('file2').value = '';
          document.getElementById('file3').value = '';
      }
  }

  // Ajout de l'écoute sur chaque champ
  const file1 = document.getElementById('file1');
  const file2 = document.getElementById('file2');
  const file3 = document.getElementById('file3');
  if(file1) file1.addEventListener('change', checkTotalFileSize);
  if(file2) file2.addEventListener('change', checkTotalFileSize);
  if(file3) file3.addEventListener('change', checkTotalFileSize);

  // Gestion des liens vers <details>
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href').substring(1);
      var details = document.getElementById(targetId);
      if (details && details.tagName.toLowerCase() === 'details') {
        details.open = true;
        details.scrollIntoView({ behavior: 'smooth', block: 'start' }); // optionnel
        e.preventDefault(); // évite le saut brutal
      }
    });
  });
});