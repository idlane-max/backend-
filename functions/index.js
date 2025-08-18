import { onRequest } from "firebase-functions/v2/https";
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// Création d'utilisateur par un admin uniquement
export const createUser = onRequest(async (req, res) => {
  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // Récupérer le token Firebase envoyé par le client (Bearer token)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    // Vérifier le token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Vérifier si l'utilisateur est admin
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Récupérer les infos du body
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    // Création dans Firebase Auth
    const newUser = await admin.auth().createUser({
      email,
      password
    });

    // Stocker dans Firestore
    await db.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: "Utilisateur créé", uid: newUser.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
