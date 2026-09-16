const getTopCandidates = require("../helperFunctions/getTopCandidates");
const Job = require("../models/Job.model");
const Application = require("../models/application.model");

async function Assistant(req, res) {
  const { jobId } = req.params; // matches router.post("/ai-assistant/:jobId", Assistant)

  try {
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const applications = await Application.find({ job: jobId })
      .populate("applicant", "fullName email skills experience location");

    if (applications.length === 0) {
      return res.status(200).json({ candidates: [] });
    }

    const candidates = applications.map((app) => ({
      applicationId: app._id,
      name: app.applicant.fullName,
      email: app.applicant.email,
      skills: app.applicant.skills,
      experience: app.applicant.experience,
      location: app.applicant.location,
    }));

    const result = await getTopCandidates(job.jobDescription, candidates);

    return res.status(200).json(result);

  } catch (err) {
    console.error("Assistant error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to generate shortlist" });
  }
}

module.exports = { Assistant };