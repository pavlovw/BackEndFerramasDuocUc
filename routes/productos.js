// routes/productos.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/productos
router.get('/', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      console.error('Error al consultar productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(results); // Devuelve como JSON
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.query('SELECT * FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener producto:', err);
      return res.status(500).json({ error: 'Error al obtener el producto' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(results[0]);
  });
});



module.exports = router;
