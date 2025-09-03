const admin = require("./firebase");

async function createAdmin() {
  try {
    const user = await admin.auth().createUser({
      email: "admin@ynov.com", // ⚠️ change cet email
      password: "admin123@",      // ⚠️ change ce mot de passe
      displayName: "Super Admin",
    });

    // Ajouter un rôle personnalisé "admin" dans les claims
    await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });

    console.log("✅ Compte admin créé avec succès !");
    console.log(`📧 Email : ${user.email}`);
    console.log(`🔑 Mot de passe : admin123`);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin :", error);
  }
}

createAdmin();
