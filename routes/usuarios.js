const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const db = require('../db');

router.post('/register', async (req, res) => {
  const { nombre, usuario, correo, password, repetirPassword, telefono } = req.body;

  if (password !== repetirPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  try {
    // Primero, verifica si ya existe el usuario o correo en la BD
    const checkUserQuery = 'SELECT * FROM usuarios WHERE usuario = ? OR correo = ? LIMIT 1';
    db.query(checkUserQuery, [usuario, correo], async (err, results) => {
      if (err) {
        console.error('Error al consultar usuario:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Usuario o correo ya existe' });
      }

      // Hashea la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserta el nuevo usuario
      const insertQuery = 'INSERT INTO usuarios (nombre, usuario, correo, contrasena, telefono) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [nombre, usuario, correo, hashedPassword, telefono], (err2, results2) => {
        if (err2) {
          console.error('Error al insertar usuario:', err2);
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
      });
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    // Buscar al usuario por su nombre de usuario
    const query = 'SELECT * FROM usuarios WHERE usuario = ? LIMIT 1';
    db.query(query, [usuario], async (err, results) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: 'Usuario no encontrado' });
      }

      const usuarioDB = results[0];

      // Comparar contraseñas
      const match = await bcrypt.compare(password, usuarioDB.contrasena);
      if (!match) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      // Opcional: puedes generar token aquí si usas JWT

      res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        usuario: {
          id: usuarioDB.id,
          nombre: usuarioDB.nombre,
          correo: usuarioDB.correo,
          usuario: usuarioDB.usuario
        }
      });
    });
  } catch (error) {
    console.error('Error inesperado en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


module.exports = router;
