const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');

// Usa tu API Key real aquí
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Pon esto en .env

router.post('/', async (req, res) => {
  const { email } = req.body;

  const msg = {
    to: email,
    from: 'pablodvvargassoto@gmail.com', // Debe estar verificado en SendGrid
    templateId: 'd-40917dd1d81b4314aaca7db25a527b55',   //   El ID de tu plantilla de SendGrid
    dynamic_template_data: {
    name : 'Ferramas'
    }
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ mensaje: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
});

module.exports = router;
