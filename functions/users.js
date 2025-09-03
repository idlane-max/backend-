import { onRequest } from "firebase-functions/v2/https";
import admin from "./firebase.js";
import { getFirestore } from "firebase-admin/firestore";
import { requireAuth, requireAdmin, requirePermission } from "./authMiddleware.js";
import bcrypt from "bcryptjs";


const db = getFirestore();

export const createUser = onRequest(async (req, res) => {
  // ton code
});


export const listUsers = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "GET") return res.status(405).send("Méthode non autorisée");

    const decoded = await requireAuth(req, res);
    if (!decoded) return;

    await requireAdmin(db, decoded);
    requirePermission(decoded.role, "users:read");

    const { role } = req.query;
    let q = db.collection("users");
    if (role) q = q.where("role", "==", role);

    const snap = await q.limit(50).get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data(), passwordHash: undefined }));
    res.json({ users });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});


export const getUser = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "GET") return res.status(405).send("Méthode non autorisée");

    const decoded = await requireAuth(req, res);
    if (!decoded) return;

    await requireAdmin(db, decoded);
    requirePermission(decoded.role, "users:read");

    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: "Paramètre uid manquant" });

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Utilisateur introuvable" });

    const data = doc.data();
    delete data.passwordHash;
    res.json({ user: { id: doc.id, ...data } });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});


export const updateUser = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "PATCH") return res.status(405).send("Méthode non autorisée");

    const decoded = await requireAuth(req, res);
    if (!decoded) return;

    await requireAdmin(db, decoded);
    requirePermission(decoded.role, "users:update");

    const { uid, email, password, role } = req.body || {};
    if (!uid) return res.status(400).json({ error: "uid manquant" });

    // 1) Màj Firebase Auth
    const updateAuth = {};
    if (email) updateAuth.email = email;
    if (password) updateAuth.password = password;
    if (Object.keys(updateAuth).length) {
      await admin.auth().updateUser(uid, updateAuth);
    }

    // 2) Màj Firestore
    const toSet = {};
    if (email) toSet.email = email;
    if (role) {
      const validRoles = ["admin", "personnel", "parent", "etudiant"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "Rôle invalide" });
      toSet.role = role;
    }
    if (password) {
      toSet.passwordHash = await bcrypt.hash(password, 10);
    }
    toSet.updatedAt = new Date().toISOString();

    await db.collection("users").doc(uid).set(toSet, { merge: true });

    const doc = await db.collection("users").doc(uid).get();
    const data = doc.data();
    delete data.passwordHash;
    res.json({ message: "Utilisateur mis à jour", user: { id: doc.id, ...data } });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});


export const deleteUser = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "DELETE") return res.status(405).send("Méthode non autorisée");

    const decoded = await requireAuth(req, res);
    if (!decoded) return;

    await requireAdmin(db, decoded);
    requirePermission(decoded.role, "users:delete");

    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: "Paramètre uid manquant" });

    if (uid === decoded.uid) {
      return res.status(400).json({ error: "Un admin ne peut pas se supprimer lui-même." });
    }

    await admin.auth().deleteUser(uid);
    await db.collection("users").doc(uid).delete();

    res.json({ message: "Utilisateur supprimé", uid });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});
