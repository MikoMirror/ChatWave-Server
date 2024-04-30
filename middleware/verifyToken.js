import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(403).json({ message: "A token is required for authentication." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();  // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(401).json({ message: "Invalid Token." });
    }
};