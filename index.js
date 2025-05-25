// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const productosRoutes = require('./routes/productos');
const divisasRoutes = require('./routes/divisas');
const usuariosRoutes = require('./routes/usuarios');
const carritoRoutes = require('./routes/carrito'); 
const suscripcionRouter = require('./routes/suscripcion');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir imágenes estáticas
app.use('/images', express.static(path.join(__dirname, 'images')));

// Rutas API
app.use('/api/productos', productosRoutes);

app.use('/api/divisas', divisasRoutes);

app.use('/api/usuarios', usuariosRoutes);

app.use('/api/carrito', carritoRoutes);

const webpayRoutes = require('./routes/webpay');
app.use('/api/webpay', webpayRoutes);

app.use('/api/suscripcion', suscripcionRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});



