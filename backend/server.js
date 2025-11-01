const express = require('express');
const app = express();
const PORT = 3000;

// Route principale
app.get('/', (req, res) => {
  res.send('Bienvenue sur mon serveur Express 🚀');
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur Express en marche sur http://localhost:${PORT}`);
});