const express = require('express');
const router = express.Router();
const axios = require('axios');

// Obtener tasa CLP -> USD desde el Banco Central (ejemplo usando mindicador.cl)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://mindicador.cl/api/dolar');
    const tasa = response.data.serie[0].valor;
    res.json({ tasa });
  } catch (error) {
    console.error('Error consultando dólar:', error.message);
    res.status(500).json({ error: 'No se pudo obtener la tasa de cambio' });
  }
});

module.exports = router;
