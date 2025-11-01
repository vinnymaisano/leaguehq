import jwt from 'jsonwebtoken'


export async function verify_token(req, res, next) {
    const JWT_SECRET = process.env.JWT_SECRET 
    const token = req.cookies?.token

    if (!token) {
        res.status(401).json({message: "Access denied - not logged in."})
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
        return
    } catch (err) {
        req.user = null
        res.status(401).json({message: "User is not logged in."})
        return
    }
}