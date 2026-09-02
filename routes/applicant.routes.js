const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const {getAllJobs,searchJobs,toggleBookMark} = require('../controllers/applicant.controller');
const {requireAuth} = require('../auth/auth');
const authorize = require('../helperFunctions/authorize');


router.use(verifyToken, authorize(('applicant')));

router.get('/jobs',getAllJobs);
router.get('/jobs/search',searchJobs);
router.patch('/jobs/:jobId/bookmark',toggleBookMark);



module.exports = router;

