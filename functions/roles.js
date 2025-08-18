// functions/roles.js
export const ROLES = ["admin", "personnel", "parent", "etudiant"];

export function assertRole(role) {
  if (!ROLES.includes(role)) {
    const allowed = ROLES.join(", ");
    throw new Error(`Rôle invalide. Autorisés: ${allowed}`);
  }
}