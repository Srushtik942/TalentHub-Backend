const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const authorize = require('../helperFunctions/authorize');
const {postJob} = require('../controllers/recruiter.controller');


router.use(verifyToken, authorize(('recruiter')));


// create a new job

router.post('/jobs',postJob);

module.exports = router;