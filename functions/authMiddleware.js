import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_a_changer";

export async function requireAuth(req, res) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return null;
    }

    const token = header.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ajouter les infos du user dans la requête
    req.user = decoded;
    return decoded; // retourne les infos décodées
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

export async function requireAdmin(db, decoded) {
  if (!decoded) throw new Error("Utilisateur non authentifié");

  const userDoc = await db.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists) throw new Error("Utilisateur introuvable");

  const role = userDoc.data().role;
  if (role !== "admin") throw new Error("Accès refusé, non admin");
}

export function requirePermission(userRole, permission) {
  const permissions = {
    admin: ["users:read", "users:update", "users:delete"],
    personnel: ["users:read"],
    parent: [],
    etudiant: []
  };

  if (!permissions[userRole]?.includes(permission)) {
    throw new Error("Permission refusée");
  }
}
