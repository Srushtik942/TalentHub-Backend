const express = require('express');
const router = express.Router();
const verifyToken = require('../helperFunctions/verifyToken');
const {getAllJobs} = require('../controllers/applicant.controller');
const {requireAuth} = require('../auth/auth');
const authorize = require('../helperFunctions/authorize');

router.use(verifyToken, authorize(('applicant')));

router.get('/jobs',getAllJobs);



module.exports = router;

