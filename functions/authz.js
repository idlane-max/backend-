// functions/authz.js
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function requireAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) throw new Error("401|Token manquant");
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded; // { uid, email, ... , role? via custom claims }
  } catch (e) {
    throw new Error("401|Token invalide");
  }
}

export async function getUserRole(uid) {
  const doc = await db.collection("user").doc(uid).get();
  return doc.exists ? doc.data().role : null;
}

export async function requireAdmin(decoded) {
  // Priorité aux custom claims si présents
  if (decoded?.role === "admin") return;
  const role = await getUserRole(decoded.uid);
  if (role !== "admin") throw new Error("403|Accès réservé aux administrateurs");
}

export async function requireSelfOrAdmin(decoded, targetUid) {
  if (decoded.uid === targetUid) return; // OK si soi-même
  await requireAdmin(decoded); // sinon admin
}

export function sendError(res, err) {
  const msg = `${err?.message || "Erreur"}`;
  const [code, text] = msg.includes("|") ? msg.split("|") : ["500", msg];
  return res.status(Number(code)).json({ error: text });
}