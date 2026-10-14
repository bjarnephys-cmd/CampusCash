const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Servér statiske filer fra dist-mappen
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Alle anmodninger (undtagen /api) sender index.html til React
app.use('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CampusCash server running on port ${PORT}`);
});