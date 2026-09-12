const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const authorize = require('../helperFunctions/authorize');
const {postJob} = require('../controllers/recruiter.controller');
const {editJobPost} = require('../controllers/recruiter.controller');
const {archiveJobs,getApplicationForJob,shortlistApplication,fetchRecruiterData,editRecruiterProfile,deleteJobPost} = require('../controllers/recruiter.controller');


router.use(verifyToken, authorize(('recruiter')));

router.post('/jobs',postJob);
router.put('/jobs/:jobId',editJobPost);
router.patch('/jobs/:jobId/archive',archiveJobs);
router.get("/applications", getApplicationForJob);
router.put("/applications/status/:applicationId", shortlistApplication);
router.get("/profile",verifyToken, fetchRecruiterData);
router.put("/editProfile/:userId", editRecruiterProfile);
router.delete("/deleteJob/:jobId", deleteJobPost);
module.exports = router;