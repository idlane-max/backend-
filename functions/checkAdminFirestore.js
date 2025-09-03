// checkAdminFirestore.js
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// Remplace par l'UID de l'admin
const adminUID = "9MH48xhNgAN3a9TexdjhGf3qt8M2";

async function checkAdmin() {
  try {
    const adminDoc = await db.collection("users").doc(adminUID).get();
    if (!adminDoc.exists) {
      console.log("❌ L'admin n'existe pas dans Firestore !");
      return;
    }

    const data = adminDoc.data();
    console.log("✅ Admin trouvé dans Firestore :");
    console.log(data);
  } catch (error) {
    console.error("Erreur lors de la vérification :", error);
  }
}

checkAdmin();
