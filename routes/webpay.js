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
router.get('/respuesta', (req, res) => {
  const { token_ws } = req.query;

  if (!token_ws) {
    return res.status(400).send('Token no proporcionado');
  }

  webpay.commit(token_ws)
    .then(result => {
      const estado = result.status || 'FAILED';

      // Obtener orden_id desde el token
      db.query('SELECT orden_id FROM pagos WHERE token_transaccion = ?', [token_ws], (err, results) => {
        if (err || results.length === 0) {
          return res.redirect(`http://localhost:5173/webpay-respuesta?estado=FAILED&orden=0`);
        }

        const ordenId = results[0].orden_id;

        // Actualizar estado en BD
        const estadoPago = estado === 'AUTHORIZED' ? 'exitoso' : 'fallido';
        const estadoOrden = estado === 'AUTHORIZED' ? 'pagado' : 'cancelado';

        db.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estadoOrden, ordenId]);
        db.query('UPDATE pagos SET estado_pago = ?, respuesta = ? WHERE token_transaccion = ?', [estadoPago, JSON.stringify(result), token_ws]);

        // Redirigir al frontend con resultado
        res.redirect(`http://localhost:5173/webpay-respuesta?estado=${estado}&orden=${ordenId}`);
      });
    })
    .catch(err => {
      console.error('Error al confirmar token GET:', err);
      res.redirect(`http://localhost:5173/webpay-respuesta?estado=FAILED&orden=0`);
    });
});

router.get('/respuesta', (req, res) => {
  const { token_ws } = req.query;

  if (!token_ws) {
    return res.status(400).send('Token no proporcionado (GET)');
  }

  // Procesar commit igual que en POST
  webpay.commit(token_ws)
    .then(result => {
      const estado = result.status || 'FAILED';

      db.query('SELECT orden_id FROM pagos WHERE token_transaccion = ?', [token_ws], (err, results) => {
        if (err || results.length === 0) {
          return res.redirect(`http://localhost:5173/webpay-respuesta?estado=FAILED&orden=0`);
        }

        const ordenId = results[0].orden_id;

        const estadoPago = estado === 'AUTHORIZED' ? 'exitoso' : 'fallido';
        const estadoOrden = estado === 'AUTHORIZED' ? 'pagado' : 'cancelado';

        db.query('UPDATE ordenes SET estado = ? WHERE id = ?', [estadoOrden, ordenId]);
        db.query('UPDATE pagos SET estado_pago = ?, respuesta = ? WHERE token_transaccion = ?', [estadoPago, JSON.stringify(result), token_ws]);

        res.redirect(`http://localhost:5173/webpay-respuesta?estado=${estado}&orden=${ordenId}`);
      });
    })
    .catch(err => {
      console.error('Error al confirmar GET:', err);
      res.redirect('http://localhost:5173/webpay-respuesta?estado=FAILED&orden=0');
    });
});

module.exports = router;
