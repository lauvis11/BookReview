import jwt  from "jsonwebtoken"

export function verifyToken (req, res, next){
    const token = req.cookies['access-token'] 
    req.session = {user: null}
    try{
        const data = jwt.verify(token, process.env.SECRET_KEY)
        req.session.user = data 
        next()
    }catch{
        return res.status(401).send('Access no authorized')
    }
    
}
