const Job = require("../models/Job.model");
const User = require("../models/NaukriAspirant.model");
const Application = require("../models/application.model");
const getInterviewPrep = require("../helperFunctions/getInterviewPrep");
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET = process.env.S3_BUCKET;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};




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


// get job by id

const getJobById = async(req,res)=>{
    try{
        const jobId = req.params.jobId;
        if(!jobId){
            return res.status(400).json({message: "Job ID is required"});
        }
        const jobData = await Job.findById(jobId)
        .populate('postedBy', 'fullName email title companyName location website')
        .lean();
        console.log("jobData", jobData);

        if(!jobData){
            return res.status(404).json({message: "Job not found"});
        }
        res.status(200).json({message: "Job fetched successfully", job: jobData});

    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// search by name
const searchJobs = async(req,res)=>{
    try{
        const {title, location, requiredSkills, excludeId} = req.query;

        const filter = {isArchived : false};

        if(excludeId){
            filter._id = {$ne: excludeId};
        }

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

                filter.$or = skillsArray.flatMap(regex => [
                    { requiredSkills: regex },
                    { tags: regex },
                ]);
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


// Filter the salary , experience, employment type
const filterByOptions = async(req,res)=>{
    try{
        const {minSalary, maxSalary, experience, employmentType} = req.query;

        const filter = {isArchived: false};
 if (minSalary) {
      const minNum = Number(minSalary);
      if (isNaN(minNum)) {
        return res.status(400).json({ message: "minSalary must be a number" });
      }
      filter.salaryMax = { $gte: minNum };
    }

    if (maxSalary) {
      const maxNum = Number(maxSalary);
      if (isNaN(maxNum)) {
        return res.status(400).json({ message: "maxSalary must be a number" });
      }
      filter.salaryMin = { $lte: maxNum };
    }

    if (minSalary && maxSalary && Number(minSalary) > Number(maxSalary)) {
      return res.status(400).json({ message: "minSalary cannot be greater than maxSalary" });
    }

        if(experience){
            const expNum = Number(experience);
            if(isNaN(expNum)){
                return res.status(400).json({message:"experience must be a number"});
            }
            filter.experience = {$lte:expNum};
        }

        if(employmentType){
            const allowedModes = ["remote","on-site","hybrid"];

            if(!allowedModes.includes(employmentType)){
                return res.status(400).json({
                message: `employmentType must be one of: ${allowedModes.join(", ")}`,
                });
            }
            filter.workMode = employmentType;
        }

        const jobData = await Job.find(filter).populate("postedBy", "companyName location");


        return res.status(200).json({ count: jobData.length, jobs: jobData });



    }catch(err){
        return res.status(500).json({message:"Internal Server Error",err:err.message});
    }
}

// sort by salary

const sortBySalary = async(req,res)=>{
    try{
        const {order, field} = req.query;

        const sortOrder = order === "desc" ? -1 : 1;
        const sortField = field === "salaryMax" ? "salaryMax" : "salaryMin";

        const jobs = await Job.find({salaryMin: {$exists: true}}).sort({[sortField]: sortOrder});

       return res.status(200).json({message:"Jobs fetched successfully!",jobs});

    }catch(err){
        res.status(500).json({message:"Internal Server Error",err:err.message});
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
const ApplyToJob = async (req, res) => {
  try {
    const applicantId = req.user._id;
    const { jobId } = req.params;
    const { coverLetter } = req.body || {};

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const job = await Job.findById(jobId).select("_id isArchived");
    if (!job) {
      return res.status(404).json({ message: "Job not found!" });
    }
    if (job.isArchived) {
      return res.status(410).json({ message: "This job is no longer accepting applications" });
    }

    const existing = await Application.findOne({ applicant: applicantId, job: jobId });

    if (existing) {
      // Already has an active application: don't touch it, just report it
      if (existing.status !== "withdrawn") {
        return res.status(409).json({
          message: "You have already applied to this job",
          application: existing,
        });
      }

      // Withdrawn earlier: reactivate it
      existing.status = "applied"; // use your schema's default status value
      if (coverLetter) existing.coverLetter = coverLetter;
      await existing.save();
      return res.status(200).json({ message: "Applied successfully", application: existing });
    }

    const application = await Application.create({
      applicant: applicantId,
      job: jobId,
      coverLetter,
    });

    return res.status(201).json({ message: "Applied successfully", application });
  } catch (err) {
    console.error("Error applying for job:", err);
    if (err.code === 11000) {
      const application = await Application.findOne({
        applicant: req.user._id,
        job: req.params.jobId,
      });
      return res.status(409).json({ message: "You have already applied to this job", application });
    }
    return res.status(500).json({ message: "Internal Server Error", err: err.message });
  }
};

// withdraw application
const withdrawnApplication = async(req,res)=>{
    try{
        const application = await Application.findById(req.params.applicationId);

        if(!application){
            return res.status(404).json({message: "Application not found"});
        }

        if(application.applicant.toString()!== req.user._id.toString()){
            return res.status(403).json({message: "You are not authorized to withdraw this application"});
        }

        if(application.status === "withdrawn"){
            return res.status(400).json({message: "Application is already withdrawn"});
        }

        if (["rejected", "hired"].includes(application.status)) {
         return res.status(409).json({ message: "Cannot withdraw an application that's already been decided" });
        }

        application.status = "withdrawn";
        application.withdrawnAt = new Date();
        await application.save();

        res.status(200).json({message: "Application withdrawn successfully", application});


    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// fetch profile data
const fetchProfileData = async(req,res)=>{
    try{
        const userId = req.user._id;
        const userData = await User.findById(userId).select("-password -refreshToken").populate("fullName email role experience location skills resume");
        res.status(200).json({ message: "Profile data fetched successfully", userData });
    }catch(err){
        res.status(500).json({message: "Internal Server Error",err: err.message});
    }
}

// edit profile data
const editProfile = async(req,res)=>{
    try{
        const userId = req.user._id;

        const user = await User.findById(userId);

         if(!user){
            return res.status(404).json({message: "User not found"});
         }

         const editableFields = ["fullName", "email", "experience", "location", "skills", "resume", "about"];

         for(const field of editableFields){
            if(req.body[field] !== undefined){
                user[field] = req.body[field];
            }
         }
          // Skills
        if (Array.isArray(req.body.skills)) {
            user.skills = [...new Set([...(user.skills || []), ...req.body.skills])];
        }

        await user.save();

        res.status(200).json({message: "Profile updated successfully", userData:user});

    }catch(err){
        res.status(500).json({message:"Internal Server Error",err:err.message});
    }
}

// AI Helper function for prep

const generateInterviewPrep = async (req,res)=>{
    try{
        const {jobId} = req.params;
        const job = await Job.findById(jobId);

        if(!job){
            return res.status(404).json({error:"JobPost not found"});
        }

        const result = await getInterviewPrep(job.jobDescription, job.requiredSkills);
        console.log("result",result);

        return res.status(200).json({message:"QUestions generated successfully!",result});

    }catch(err){
        res.status(500).json({message:"Internal Server Error",err:err.message});
    }
}


// upload resume

// upload resume: step 1, get a presigned upload form
const getResumeUploadUrl = async (req, res) => {
    try {
        const { contentType } = req.body || {};
        const ext = ALLOWED[contentType];
        if (!ext) {
            return res.status(400).json({ message: "Only PDF, DOC or DOCX allowed" });
        }

        const key = `resumes/${req.user._id}/${Date.now()}.${ext}`;
        const { url, fields } = await createPresignedPost(s3, {
            Bucket: BUCKET,
            Key: key,
            Conditions: [
                ["content-length-range", 1, MAX_SIZE],
                ["eq", "$Content-Type", contentType],
            ],
            Fields: { "Content-Type": contentType },
            Expires: 300,
        });

        return res.status(200).json({ url, fields, key });
    } catch (err) {
        console.error("Upload URL error:", err);
        return res.status(500).json({ message: "Could not create upload URL", err: err.message });
    }
};

// upload resume:  save the key after the browser uploaded the file
const confirmResumeUpload = async (req, res) => {
    try {
        const { key } = req.body || {};
        if (!key || !key.startsWith(`resumes/${req.user._id}/`)) {
            return res.status(400).json({ message: "Invalid key" });
        }

        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        await User.findByIdAndUpdate(req.user._id, { resume: key });

        return res.status(200).json({ message: "Resume saved", key });
    } catch (err) {
        console.error("Confirm resume error:", err);
        return res.status(400).json({ message: "File not found in storage, upload again" });
    }
};

const getResumeDownloadUrl = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("resume");
        if (!user?.resume) {
            return res.status(404).json({ message: "No resume uploaded" });
        }

        const url = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: BUCKET, Key: user.resume }),
            { expiresIn: 300 }
        );
        return res.status(200).json({ url });
    } catch (err) {
        console.error("Download URL error:", err);
        return res.status(500).json({ message: "Could not create download URL", err: err.message });
    }
};


const fetchStatus = async(req,res)=>{
    try{
        const applicantId = req.params.applicantId;

        if(!applicantId){
            res.status(400).json({message:"Applicant ID is required"});
        }

        const response = await Application.findOne({applicant:applicantId});

        if(!response){
            res.status(404).json({message:"Application not found"});
        }
        res.status(200).json({message:"Application found", data:response});


    }catch(err){
        res.status(500).json({message:"Internal Server Error",err:err.message})
    }
}






module.exports = {getAllJobs, searchJobs, toggleBookMark, ApplyToJob, withdrawnApplication, fetchProfileData, editProfile,generateInterviewPrep,filterByOptions,sortBySalary,getJobById,getResumeUploadUrl, confirmResumeUpload, getResumeDownloadUrl, fetchStatus};
