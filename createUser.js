// createUser.js
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function createUserByAdmin(email, password, role) {
  try {
    // 1. Création dans Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    // 2. Ajout des infos dans Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });

    console.log(`Utilisateur ${role} créé avec succès :`, userRecord.uid);
    return userRecord;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    throw error;
  }
}
