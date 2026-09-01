const Job = require("../models/Job.model")

// get all jobs

const getAllJobs = async(req,res)=>{
    try{
        const jobsData = await Job.find({isArchived: false});

        if(jobsData.length === 0){
            res.status(404).json({message: "No jobs found"});
        }

        res.status(200).json({message: "Jobs fetched successfully", jobs: jobsData});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

module.exports = {getAllJobs}