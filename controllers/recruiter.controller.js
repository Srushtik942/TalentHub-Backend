const Job = require('../models/Job.model');

// create new job
const postJob = async(req,res)=>{
    try{

        const {title, companyName, salaryMin,salaryMax, experience, location, jobDescription, requiredSkills,workMode} = req.body;

        if(!title || !companyName || !salaryMin || !salaryMax || !experience || !location || !jobDescription || !requiredSkills || !workMode){
            return res.status(400).json({message: "All fields are required"});
        }

       const newJob = await Job.create({
            title,
            companyName,
            salaryMin,
            salaryMax,
            experience,
            location,
            jobDescription,
            requiredSkills,
            workMode
        });

        await newJob.save();

        res.status(201).json({message: "Job posted successfully", job: newJob});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// Edit job

// const

module.exports = {postJob};