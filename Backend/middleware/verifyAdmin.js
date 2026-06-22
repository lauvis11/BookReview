export function verifyAdmin(req, res, next){
    if(req.session?.user?.role === 'admin') return next()
    res.status(403).json({message: 'Access not authorized'})
}