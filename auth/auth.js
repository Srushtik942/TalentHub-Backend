const jsonwebtoken = require("jsonwebtoken");

function requireAuth(req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"Unauthorized"});
    }

    const token = authHeader.split(" ")[1];
    try{
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).json({message:"Unauthorized"});
    }
}

module.exports = {requireAuth};