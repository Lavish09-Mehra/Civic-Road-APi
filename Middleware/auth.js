import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'civic-raid-secret-key';

// =============================================
// Auth Middleware
// Verifies JWT token from Authorization header
// Attaches decoded user info to req.user
// =============================================
export function auth(req, res, next) {
    // Get token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Access denied. No token provided.'
        });
    }

    // Extract the token part after "Bearer "
    const token = authHeader.split(' ')[1];

    try {
        // Verify token and decode payload
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request object for downstream routes
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}
