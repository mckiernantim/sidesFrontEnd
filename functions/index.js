const functions = require("firebase-functions");
const MAILGUN = process.env.MAILGUN
const DOMAIN = process.env.DOMAIN
const cors = require('cors')({origin: true});
const mailgun = require("mailgun-js");

const mg = mailgun({apiKey: MAILGUN, domain: DOMAIN});

exports.contactUs = functions.https.onRequest((req,res) => {
return cors(req, res, () => {
const data = {
  from: req.body.email,
  to: 'mckiernantim@gmail.com',
  subject: req.body.subject,
  message: req.body.message
};
mg.messages().send(data, (error, body) => {
body ? res.status(200).send('Email Sent Successfullly !') : res.status(500).send(error);
      });
    });
  });
