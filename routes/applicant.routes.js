const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const {getAllJobs,searchJobs,toggleBookMark,ApplyToJob,withdrawnApplication} = require('../controllers/applicant.controller');
const {requireAuth} = require('../auth/auth');
const authorize = require('../helperFunctions/authorize');


router.use(verifyToken, authorize(('applicant')));

router.get('/jobs',getAllJobs);
router.get('/jobs/search',searchJobs);
router.patch('/jobs/:jobId/bookmark',toggleBookMark);
router.post('/jobs/:jobId/apply',ApplyToJob);
router.patch('/applications/:applicationId/withdraw',withdrawnApplication);



module.exports = router;

