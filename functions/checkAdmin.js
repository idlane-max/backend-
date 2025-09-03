import admin from "./firebase.js";

async function checkAdmin(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log("Admin trouvé :", userRecord.uid);
  } catch (error) {
    console.error("Admin non trouvé :", error.message);
  }
}

checkAdmin("admin@example.com");
