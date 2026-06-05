const admin = require('../firebase-admin');

/**
 * Verifies the Firebase ID Token from the Authorization header.
 * Attaches decoded user info to `req.user`.
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, name, picture, ... }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = verifyToken;
