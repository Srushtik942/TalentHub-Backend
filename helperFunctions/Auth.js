const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/NaukriAspirant.model");
const expres = require("express");
const router = expres.Router();

// Register for user/student
router.post('/register',async(req,res)=>{
    try{
        const {fullName,email,password,role,experience,location,skills,resume,companyName,website,about} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            role,
            experience,
            location,
            skills,
            resume,
            companyName,
            website,
            about
        });
        await user.save();

         const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({message:"User created successfully", token, user: { id: user._id, fullName: user.fullName, email: user.email, experience: user.experience, role: user.role, location: user.location, skills: user.skills, resume: user.resume , companyName: user.companyName, website: user.website, about: user.about } });

    }catch(err){
        res.status(500).json({message:"Internal server error",err:err.message});
    }
})

router.post('/login',async(req,res)=>{
    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"});
        }

        const user = await User.findOne({email});


        if(!user){
            return res.status(400).json({message:"User does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
         return res.status(401).json({message:"Invalid email or password"});
        }

        const token = jwt.sign(
            {id:user._id, email:user.email, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        )
    res.status(200).json({message:"Login successful",token, user:{id:user._id, fullName:user.fullName, email:user.email, role: user.role}});

    }catch(err){
        res.status(500).json({message:"Internal server error",err:err.message});
    }
})

module.exports = router;