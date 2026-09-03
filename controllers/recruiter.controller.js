const Job = require('../models/Job.model');
const Application = require('../models/application.model')

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
            applicationDeadline,
            postedBy: req.user._id
        });


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

// fetch application
const getApplicationForJob = async(req,res)=>{
    try{
        const recruiterId = req.user._id;

        if(req.user.role !== "recruiter"){

        return res.status(403).json({ message: "Only recruiters can view applications" });
        }
        const recruiterJobs = await Job.find({ postedBy: recruiterId }).select("_id");
        const jobIds = recruiterJobs.map(job => job._id);

 if (jobIds.length === 0) {
            return res.status(404).json({ message: "You haven't posted any jobs yet" });
        }

          // 2. Get all applications where job is one of those job IDs
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate("applicant", "fullName email experience location skills resume")
            .populate("job", "title companyName location")
            .sort({ createdAt: -1 });

        if (applications.length === 0) {
            return res.status(404).json({ message: "No applications found for your jobs yet" });
        }

        res.status(200).json({
            message: "Applications fetched successfully",
            count: applications.length,
            applications
        });


    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// Shortlist application
const shortlistApplication = async(req,res)=>{
    try{
        const {applicationId} = req.params;
        console.log("Passing applicationId")

        const application = await Application.findById(applicationId).populate("job");
        console.log("Finding application by id",application)


        if (application.job.postedBy.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: "Not authorized to update this application" });
         }


if (application.status === "withdrawn") {
  return res.status(409).json({ message: "Cannot update a withdrawn application" });
}

const allowedStatuses = ["shortlisted", "interview", "rejected", "hired"];

if (!allowedStatuses.includes(req.body.status)) {
  return res.status(400).json({ message: "Invalid status value" });
}

application.status = req.body.status;
await application.save();

res.status(200).json({message:" Application status updated successfully", application});

    }catch(err){
      res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}


module.exports = {postJob, editJobPost, archiveJobs,getApplicationForJob, shortlistApplication};