// functions/firebase.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

if (!admin.apps.length) {
  // ⚠️ En prod sur Cloud Functions, privilégier config par variables d'env
  // et laisser admin.initializeApp() sans credentials, Firebase injecte les droits.
  try {
    const serviceAccount = JSON.parse(readFileSync(new URL('../serviceAccountKey.json', import.meta.url)));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    // Fallback: sur l'infra Firebase, les cred sont implicites
    admin.initializeApp();
  }
}

export default admin;