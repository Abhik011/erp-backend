const jwt = require("jsonwebtoken");

/**
 * Looks for JWT in cookie `token` or `Authorization: Bearer ...`
 * Adds `req.user = { id, email }` or returns 401.
 */
module.exports = function verifyToken(req, res, next) {
  const bearer = req.headers.authorization?.split(" ")[1];
  const token = req.cookies.token || bearer;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
