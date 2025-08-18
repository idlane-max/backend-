const admin = require("../firebase");

async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("Token manquant");

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (decodedToken.role !== "admin") {
      return res.status(403).send("Accès refusé : admin uniquement");
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).send("Token invalide");
  }
}

module.exports = verifyAdmin;
