// middleware/checkAdmin.js
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function checkAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });

    // Vérifier le token Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
}
