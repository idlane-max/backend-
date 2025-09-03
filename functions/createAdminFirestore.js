import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcrypt";

const db = getFirestore();

async function createAdmin() {
  const email = "admin@example.com";
  const password = "admin123"; // mot de passe clair
  const role = "admin";

  try {
    // Vérifier si l'admin existe déjà dans Firebase Auth
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log("Admin déjà présent dans Auth :", user.uid);
    } catch {
      user = await admin.auth().createUser({ email, password });
      console.log("Admin créé dans Auth :", user.uid);
    }

    // Hasher le mot de passe pour Firestore
    const passwordHash = await bcrypt.hash(password, 10);

    // Ajouter dans Firestore
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email,
      role,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    console.log("✅ Admin créé dans Firestore avec hash !");
  } catch (err) {
    console.error(err);
  }
}

createAdmin();