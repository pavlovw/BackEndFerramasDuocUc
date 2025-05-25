const express = require('express');
const router = express.Router();
const db = require('../db');

// Agregar producto al carrito
router.post('/', (req, res) => {
  const { usuario_id, producto_id } = req.body;

  // Verifica si ya existe en el carrito
  const checkQuery = 'SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?';
  db.query(checkQuery, [usuario_id, producto_id], (err, results) => {
    if (err) {
      console.error('Error al verificar carrito:', err);
      return res.status(500).json({ error: 'Error al consultar el carrito' });
    }

    if (results.length > 0) {
      // Ya existe, actualiza cantidad
      const updateQuery = 'UPDATE carrito SET cantidad = cantidad + 1 WHERE usuario_id = ? AND producto_id = ?';
      db.query(updateQuery, [usuario_id, producto_id], (err2) => {
        if (err2) {
          console.error('Error al actualizar carrito:', err2);
          return res.status(500).json({ error: 'Error al actualizar el carrito' });
        }
        res.json({ mensaje: 'Producto actualizado en el carrito' });
      });
    } else {
      // No existe, insertar nuevo
      const insertQuery = 'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, 1)';
      db.query(insertQuery, [usuario_id, producto_id], (err3) => {
        if (err3) {
          console.error('Error al insertar en el carrito:', err3);
          return res.status(500).json({ error: 'Error al agregar al carrito' });
        }
        res.json({ mensaje: 'Producto agregado al carrito' });
      });
    }
  });
});

// Obtener cantidad total de productos en el carrito
router.get('/count/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  const query = 'SELECT SUM(cantidad) AS total FROM carrito WHERE usuario_id = ?';
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al contar productos:', err);
      return res.status(500).json({ error: 'Error al contar productos del carrito' });
    }

    res.json({ total: results[0].total || 0 });
  });
});

// Obtener productos del carrito para un usuario
router.get('/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  const query = `
    SELECT 
      c.id AS carrito_id,
      c.cantidad,
      p.id AS producto_id,
      p.nombre,
      p.precio_clp,
      p.imagen
    FROM carrito c
    JOIN productos p ON c.producto_id = p.id
    WHERE c.usuario_id = ?
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al obtener productos del carrito:', err);
      return res.status(500).json({ error: 'Error al obtener productos del carrito' });
    }

    res.json(results);
  });
});

// Eliminar uno o todos de un producto en el carrito
router.delete('/:carritoId', (req, res) => {
  const { carritoId } = req.params;

  // Primero, obtenemos la cantidad actual
  const getQuery = 'SELECT cantidad FROM carrito WHERE id = ?';

  db.query(getQuery, [carritoId], (err, results) => {
    if (err) {
      console.error('Error al obtener producto del carrito:', err);
      return res.status(500).json({ error: 'Error al obtener el producto del carrito' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }

    const cantidadActual = results[0].cantidad;

    if (cantidadActual > 1) {
      // Si hay más de 1, se actualiza restando 1
      const updateQuery = 'UPDATE carrito SET cantidad = cantidad - 1 WHERE id = ?';

      db.query(updateQuery, [carritoId], (err, result) => {
        if (err) {
          console.error('Error al actualizar cantidad del carrito:', err);
          return res.status(500).json({ error: 'Error al actualizar la cantidad' });
        }

        res.json({ message: 'Cantidad reducida en 1' });
      });

    } else {
      // Si solo hay 1, se elimina el producto del carrito
      const deleteQuery = 'DELETE FROM carrito WHERE id = ?';

      db.query(deleteQuery, [carritoId], (err, result) => {
        if (err) {
          console.error('Error al eliminar producto del carrito:', err);
          return res.status(500).json({ error: 'Error al eliminar el producto' });
        }

        res.json({ message: 'Producto eliminado del carrito' });
      });
    }
  });
});



module.exports = router;
