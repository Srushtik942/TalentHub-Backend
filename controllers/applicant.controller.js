const Job = require("../models/Job.model");
const User = require("../models/NaukriAspirant.model");
const Application = require("../models/application.model");

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

// search by name
const searchJobs = async(req,res)=>{
    try{
        const {title, location, requiredSkills} = req.query;

        const filter = {isArchived : false};

        if(title){
            filter.title = { $regex: title, $options: 'i' };
        }

        if(location){
            filter.location = { $regex: location, $options: 'i' };
        }

        if(requiredSkills){
             const skillsArray = requiredSkills
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean)
                .map(skill => new RegExp(skill, "i"));

                filter.$or = skillsArray.map(regex => ({ requiredSkills: regex }));
        }

        const jobData = await Job.find(filter);
        if(jobData.length === 0){
            return res.status(404).json({message:`Filter with ${JSON.stringify(filter)} jobs are not present`})
        }
        console.log("jobData", jobData);
        res.status(200).json({message: "Jobs fetched successfully", jobs: jobData});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

//  Bookmark application
const toggleBookMark = async (req, res) => {
    try {
        const userId = req.user._id;
        const { jobId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isBookmarked = user.bookmarks.some(id => id && id.toString() === jobId);

        if (isBookmarked) {
            user.bookmarks.pull(jobId);
        } else {
            user.bookmarks.push(jobId);
        }

        user.bookmarks = user.bookmarks.filter(id => id != null);

        await user.save();

        res.status(200).json({
            message: isBookmarked ? "Job removed from bookmarks" : "Job bookmarked successfully",
            bookmarks: user.bookmarks
        });

    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", err: err.message });
    }
};

// Apply for the job
const ApplyToJob = async(req,res)=>{
    try{
        const applicantId  = req.user._id;
        const {jobId} = req.params;
        const {coverLetter} = req.body;

        if(!jobId || Job.isArchived){
           return res.status(400).json({message: "Job ID is required"});
        }


        const application = await Application.create({
            applicant : applicantId,
            job: jobId,
            coverLetter
        });

        await application.save();

        res.status(201).json({ message: "Applied successfully", application });


    }catch(err){
         if (err.code === 11000) {
            return res.status(409).json({ message: "You have already applied to this job" });
        }
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
};


module.exports = {getAllJobs, searchJobs, toggleBookMark, ApplyToJob};
