const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const authorize = require('../helperFunctions/authorize');
const {postJob} = require('../controllers/recruiter.controller');
const {editJobPost} = require('../controllers/recruiter.controller');
const {archiveJobs} = require('../controllers/recruiter.controller');


router.use(verifyToken, authorize(('recruiter')));

router.post('/jobs',postJob);
router.put('/jobs/:jobId',editJobPost);
router.patch('/jobs/:jobId/archive',archiveJobs);
module.exports = router;