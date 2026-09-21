/**
 * controllers/externalJobsController.js
 * ---------------------------------------
 * Exposes the import as an HTTP endpoint, e.g. for an admin-triggered
 * refresh button, or for hitting with a cron/scheduled task service
 * (like a GitHub Action, Render cron job, or node-cron in Server.js).
 */

const {importExternalJobs} = require('../helperFunctions/Importexternaljobs');

async function refreshExternalJobs(req, res) {
  try {
    const { greenhouseCompanies, leverCompanies, query } = req.body || {};

    const result = await importExternalJobs({
      greenhouseCompanies: greenhouseCompanies || ['stripe', 'airbnb'],
      leverCompanies: leverCompanies || ['netflix'],
      query: query || '',
    });

    res.status(200).json({
      message: 'External jobs imported successfully',
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Internal Server Error',
      err: err.message,
    });
  }
}

module.exports = {refreshExternalJobs}
/**
 * routes/externalJobRoutes.js
 * -----------------------------
 * Wire this into your app, ideally behind an admin-only auth check
 * since it triggers outbound API calls and DB writes.
 *
 *   const express = require('express');
 *   const router = express.Router();
 *   const { refreshExternalJobs } = require('../controllers/externalJobsController');
 *   const { verifyToken, authorize } = require('../auth/...');
 *
 *   router.post('/admin/jobs/refresh-external', verifyToken, authorize('recruiter'), refreshExternalJobs);
 *   // or protect with your own admin check if recruiters shouldn't trigger this
 *
 *   module.exports = router;
 *
 * Then in Server.js:
 *   app.use('/api', require('./routes/externalJobRoutes'));
 *
 * Test with Postman:
 *   POST http://localhost:5000/api/admin/jobs/refresh-external
 *   Body (optional): { "greenhouseCompanies": ["stripe"], "leverCompanies": ["netflix"] }
 */