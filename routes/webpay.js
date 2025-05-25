const express = require('express');
const router = express.Router();
const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes } = require('transbank-sdk');
const db = require('../db'); // tu conexión con mysql tradicional

// Crear instancia Webpay
const webpay = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    'https://webpay3gint.transbank.cl'
  )
);

// Iniciar transacción
router.post('/iniciar', (req, res) => {
  const { usuario_id, monto } = req.body;
  const buyOrder = `orden-${Date.now()}`;
  const sessionId = `sesion-${usuario_id}-${Date.now()}`;
  const returnUrl = 'http://localhost:3000/api/webpay/respuesta';

  webpay.create(buyOrder, sessionId, monto, returnUrl)
    .then(response => {
      // Guardar orden
      db.query(
        'INSERT INTO ordenes (usuario_id, total_clp, metodo_pago, estado) VALUES (?, ?, ?, ?)',
        [usuario_id, monto, 'webpay', 'pendiente'],
        (err, result) => {
          if (err) {
            console.error('Error insertando orden:', err);
            return res.status(500).json({ error: 'Error al guardar orden' });
          }

          const ordenId = result.insertId;

          // Guardar pago con token
          db.query(
            'INSERT INTO pagos (orden_id, metodo_pago, estado_pago, token_transaccion) VALUES (?, ?, ?, ?)',
            [ordenId, 'webpay', 'pendiente', response.token],
            (err2) => {
              if (err2) {
                console.error('Error insertando pago:', err2);
                return res.status(500).json({ error: 'Error al guardar pago' });
              }

              res.json({ url: response.url, token: response.token });
            }
          );
        }
      );
    })
    .catch(err => {
      console.error('Error creando transacción:', err);
      res.status(500).json({ error: 'Error al iniciar transacción' });
    });
});

// Confirmar transacción (callback)
router.post('/respuesta', (req, res) => {
  const { token_ws } = req.body;

  webpay.commit(token_ws)
    .then(result => {
      // Obtener orden_id del pago según token_ws
      db.query('SELECT orden_id FROM pagos WHERE token_transaccion = ?', [token_ws], (err, results) => {
        if (err) {
          console.error('Error consultando pago:', err);
          return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Pago no encontrado' });
        }

        const ordenId = results[0].orden_id;

        // Actualizar estado según resultado de transacción
        if (result.status === 'AUTHORIZED') {
          db.query('UPDATE ordenes SET estado = ? WHERE id = ?', ['pagado', ordenId], (err) => {
            if (err) console.error('Error actualizando orden:', err);
          });

          db.query(
            'UPDATE pagos SET estado_pago = ?, respuesta = ? WHERE token_transaccion = ?',
            ['exitoso', JSON.stringify(result), token_ws],
            (err) => {
              if (err) console.error('Error actualizando pago:', err);
            }
          );
        } else {
          db.query('UPDATE ordenes SET estado = ? WHERE id = ?', ['cancelado', ordenId], (err) => {
            if (err) console.error('Error actualizando orden:', err);
          });

          db.query(
            'UPDATE pagos SET estado_pago = ?, respuesta = ? WHERE token_transaccion = ?',
            ['fallido', JSON.stringify(result), token_ws],
            (err) => {
              if (err) console.error('Error actualizando pago:', err);
            }
          );
        }

        res.redirect(`http://localhost:5173/webpay-respuesta?estado=${result.status}&orden=${ordenId}`);
      });
    })
    .catch(err => {
      console.error('Error al confirmar pago:', err);
      res.status(500).json({ error: 'Error al confirmar transacción' });
    });
});

module.exports = router;
