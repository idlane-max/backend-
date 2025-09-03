import { onRequest } from "firebase-functions/v2/https";
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
export { listUsers, getUser, updateUser, deleteUser } from "./users.js";





// -- Helpers communs --
const PERMISSIONS = {
  admin: ["users:read", "users:create", "users:update", "users:delete"], // full access
  personnel: ["me:read"],
  parent: ["me:read"],
  etudiant: ["me:read"],
};

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

function requireAuth(req) {
  const token = getBearerToken(req);
  if (!token) throw Object.assign(new Error("Token manquant"), { status: 401 });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // { uid, role, iat, exp }
  } catch {
    throw Object.assign(new Error("Token invalide"), { status: 401 });
  }
}

async function requireAdmin(db, decoded) {
  const snap = await db.collection("users").doc(decoded.uid).get();
  if (!snap.exists || snap.data().role !== "admin") {
    throw Object.assign(new Error("Accès refusé"), { status: 403 });
  }
}

function requirePermission(role, need) {
  const ok = PERMISSIONS[role]?.includes(need);
  if (!ok) throw Object.assign(new Error("Accès refusé"), { status: 403 });
}


const db = getFirestore();

// Clé secrète depuis variable d'environnement
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_a_changer";

// --------------------- LOGIN JWT ---------------------
export const login = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Méthode non autorisée");

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("Email et mot de passe requis");

  try {
    // Récupérer l'utilisateur Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // Récupérer les infos dans Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (!userDoc.exists) return res.status(404).send("Utilisateur non trouvé");

    const userData = userDoc.data();

    // Vérifier le mot de passe hashé
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!passwordMatch) return res.status(401).send("Mot de passe incorrect");

    // Générer JWT
   const token = jwt.sign( { uid: userRecord.uid, role: userData.role }, process.env.JWT_SECRET, { expiresIn: "1h" } );


    res.json({ token, uid: userRecord.uid, role: userData.role });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// --------------------- CRÉATION UTILISATEUR PAR ADMIN ---------------------
export const createUser = onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });

    const decodedToken = jwt.verify(token, JWT_SECRET);

    // Vérifier si l'utilisateur est admin
    const adminDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Récupérer les infos du body
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: "Champs manquants" });

    const validRoles = ["admin", "personnel", "parent", "etudiant"];
    if (!validRoles.includes(role)) return res.status(400).json({ error: "Rôle invalide" });

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur Firebase Auth
    const newUser = await admin.auth().createUser({ email, password });

    // Stocker dans Firestore
    await db.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      email,
      role,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: "Utilisateur créé", uid: newUser.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
