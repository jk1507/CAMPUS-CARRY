import jwt from 'jsonwebtoken';
export const authenticate = (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'No token' });
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ success: false, error: 'Invalid token' }); }
};
