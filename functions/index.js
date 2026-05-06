const functions = require("firebase-functions");
const MAILGUN = process.env.MAILGUN;
const DOMAIN = process.env.DOMAIN;
const cors = require('cors')({origin: true});
const mailgun = require("mailgun-js");

const mg = mailgun({apiKey: MAILGUN, domain: DOMAIN});

exports.contactUs = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    const { name, email, subject, message } = req.body;
    const data = {
      from: `SidesWays Contact <mailgun@${DOMAIN}>`,
      to: 'support@sides-ways.com',
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    };
    mg.messages().send(data, (error) => {
      if (error) {
        console.error('Mailgun error:', error);
        return res.status(500).send(error.message || 'Failed to send email');
      }
      return res.status(200).send('Email sent successfully');
    });
  });
});
