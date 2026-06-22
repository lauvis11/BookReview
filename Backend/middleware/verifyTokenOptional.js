import jwt from "jsonwebtoken"

export function verifyTokenOptional(req, res, next) {
    const token = req.cookies['access-token']
    req.session = { user: null }
    
    if (!token) {
        return next()
    }
    
    try {
        const data = jwt.verify(token, process.env.SECRET_KEY)
        req.session.user = data
    } catch {
        // Token invalid or expired, continue without user
    }
    
    next()
}
