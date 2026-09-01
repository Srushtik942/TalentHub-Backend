const Job = require('../models/Job.model');

// create new job
const postJob = async(req,res)=>{
    try{

        const {title, companyName, salaryMin,salaryMax, experience, location, jobDescription, requiredSkills,workMode,applicationDeadline} = req.body;

        if(!title || !companyName || !salaryMin || !salaryMax || !experience || !location || !jobDescription || !requiredSkills || !workMode || !applicationDeadline){
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
            workMode,
            applicationDeadline
        });

        await newJob.save();

        res.status(201).json({message: "Job posted successfully", job: newJob});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// Edit job
const editJobPost = async(req,res)=>{
    try{
        const {jobId} = req.params;
        const {title, companyName, salaryMin, salaryMax, experience, location, jobDescription, requiredSkills, workMode, applicationDeadline} = req.body;

        const isExistjob = await Job.findById(jobId);

        if(!isExistjob){
            return res.status(404).json({message: "Job not found"});
        }

       const newJobData = await Job.findByIdAndUpdate(jobId,{
            title,
            companyName,
            salaryMin,
            salaryMax,
            experience,
            location,
            jobDescription,
            requiredSkills,
            workMode,
            applicationDeadline
        },{new: true});

        await newJobData.save();

        res.status(200).json({message: "Job updated successfully", job: newJobData});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// Archive job

const archiveJobs = async(req,res)=>{
    try{
        const {jobId} = req.params;
        const job = await Job.findById(jobId);

        if(!job){
            res.status(404).json({mssage: "JobPost not found"});
        }

        const updatedJob = await Job.findByIdAndUpdate(jobId, { isArchived: true }, { new: true });

        res.status(200).json({message: "Job archived successfully", job: updatedJob});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}


module.exports = {postJob, editJobPost, archiveJobs};