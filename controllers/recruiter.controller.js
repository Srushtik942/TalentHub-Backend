const Job = require('../models/Job.model');
const Application = require('../models/application.model');
const User = require('../models/NaukriAspirant.model');

// create new job
const postJob = async(req,res)=>{
    try{

        const {title, companyName, salaryMin,salaryMax, experience, location, jobDescription, requiredSkills,workMode,applicationDeadline, employmentType, companySize} = req.body;

        if(!title || !companyName || !salaryMin || !salaryMax || !experience || !location || !jobDescription || !requiredSkills || !workMode || !applicationDeadline || !employmentType || !companySize){
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
            employmentType,
            requiredSkills,
            workMode,
            applicationDeadline,
            companySize,
            postedBy: req.user._id
        });


        res.status(201).json({message: "Job posted successfully", job: newJob});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// delete job

const deleteJobPost = async(req,res)=>{
    try{
        const {jobId} = req.params;

        const job = await Job.findById(jobId);

        if(!job){
            return res.status(404).json({message:"JobPost is not showing"})
        }

        const deletedJob = await Job.findByIdAndDelete(jobId);

        res.status(200).json({message: "Job deleted successfully", job: deletedJob});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}
// Edit job
const editJobPost = async (req, res) => {
    try {
        const { jobId } = req.params;

        if(!jobId){
            return res.status(400).json({ message: "Job ID is required" });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // External jobs shouldn't be edited
        if (job.isExternal) {
            return res.status(403).json({ message: "External jobs cannot be edited" });
        }
        const allowedFields = [
            "title", "companyName", "salaryMin", "salaryMax",
            "workMode", "employmentType", "experience", "location",
            "jobDescription", "requiredSkills", "tags",
            "applicationDeadline", "isArchived"
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided to update" });
        }

        // Cross-field check using new values, falling back to existing ones
        const min = updates.salaryMin ?? job.salaryMin;
        const max = updates.salaryMax ?? job.salaryMax;
        if (min > max) {
            return res.status(400).json({ message: "salaryMin cannot be greater than salaryMax" });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            jobId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Job updated successfully", job: updatedJob });

    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Validation failed", err: err.message });
        }
        res.status(500).json({ message: "Internal Server Error", err: err.message });
    }
};
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

// fetch all jobPost

const getAllJobPosts = async(req,res)=>{
    try{
        const recruiterId = req.params.recruiterId;
        const jobPosts = await Job.find({postedBy: recruiterId});
        console.log(jobPosts);

        if(jobPosts.length === 0){
            res.status(404).json({message: "No job posts found for this recruiter"});
        }

        res.status(200).json({message: "Job posts fetched successfully", count: jobPosts.length, jobPosts});



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


// fetch users data
const fetchRecruiterData = async(req,res)=>{
    try{
        const userId = req.user._id;

        const userData = await User.findById(userId).select("-password -refreshToken").populate("fullName email role experience location companyName companySize");
        console.log("userData",userData);
        res.status(200).json({message:"Profile fetched successfully",userData})

    }catch(error){
        res.status(500).json({message:"Internal Server Error",error:error.message});
    }
}

// edit profile
const editRecruiterProfile = async(req,res)=>{
    try{
        const userId = req.user._id;
        const {fullName, email, experience, location, companyName, website, about} = req.body;

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        const updatedUser = await User.findByIdAndUpdate(userId,{
            fullName,
            email,
            experience,
            location,
            companyName,
            website,
            about
        },{new: true});

        res.status(200).json({message: "Profile updated successfully", user: updatedUser});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

module.exports = {postJob, editJobPost, archiveJobs,getApplicationForJob, shortlistApplication,fetchRecruiterData,editRecruiterProfile,deleteJobPost,getAllJobPosts};