const admin = require("firebase-admin");

// Importer la clé du compte de service
const serviceAccount = require("./serviceAccountKey.json");

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
