/**
 * services/importExternalJobs.js
 * --------------------------------
 * Fetches external jobs and upserts them into your `jobs` collection using
 * the Job model, keyed by `externalId` so re-running this is idempotent
 * (safe to call on a schedule — it won't create duplicates).
 *
 * Requires the schema additions in job-model-additions.js to already be
 * applied to models/Job.js (isExternal, source, sourceUrl, externalId,
 * and postedBy/applicationDeadline made conditionally required).
 *
 * Usage as a one-off script:
 *   node services/importExternalJobs.js
 *
 * Usage from a route/controller (see externalJobsController.js example):
 *   const { importExternalJobs } = require('./importExternalJobs');
 *   const result = await importExternalJobs({ greenhouseCompanies: ['stripe'] });
 */

const mongoose = require('mongoose');
const Job = require('../models/Job.model');
const { externalJobFetcher } = require('./externalJobFetcher');

const DEFAULT_SALARY_MIN = 0;
const DEFAULT_SALARY_MAX = 0;
const DEFAULT_EXPERIENCE = 0;
const DEFAULT_DEADLINE_DAYS_OUT = 30;

function toJobDoc(externalJob) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + DEFAULT_DEADLINE_DAYS_OUT);

  return {
    title: externalJob.title,
    companyName: externalJob.companyName,
    salaryMin: DEFAULT_SALARY_MIN,
    salaryMax: DEFAULT_SALARY_MAX,
    workMode: externalJob.workMode,
    experience: DEFAULT_EXPERIENCE,
    location: externalJob.location || 'Not specified',
    jobDescription: externalJob.jobDescription || 'See original posting for details.',
    requiredSkills: externalJob.requiredSkills || 'Not specified',
    applicationDeadline: deadline,
    isArchived: false,
    isExternal: true,
    source: externalJob.source,
    sourceUrl: externalJob.sourceUrl,
    externalId: externalJob.externalId,
    // postedBy intentionally omitted — schema should allow this when isExternal is true
  };
}

/**
 * @param {object} opts - same options as fetchAllExternalJobs
 * @returns {Promise<{ fetched: number, upserted: number, modified: number }>}
 */
async function importExternalJobs(opts = {}) {
  const externalJobs = await externalJobFetcher(opts);

  if (externalJobs.length === 0) {
    return { fetched: 0, upserted: 0, modified: 0 };
  }

  const ops = externalJobs.map((job) => ({
    updateOne: {
      filter: { externalId: job.externalId },
      update: { $set: toJobDoc(job) },
      upsert: true,
    },
  }));

  const result = await Job.bulkWrite(ops, { ordered: false });

  return {
    fetched: externalJobs.length,
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0,
  };
}

// Allow running directly: `node services/importExternalJobs.js`
if (require.main === module) {
  require('dotenv').config();

  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB, fetching external jobs...');
      const result = await importExternalJobs({
        greenhouseCompanies: ['stripe', 'airbnb'], // customize
        leverCompanies: ['netflix'], // customize
      });
      console.log('Import complete:', result);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}

module.exports = { importExternalJobs };