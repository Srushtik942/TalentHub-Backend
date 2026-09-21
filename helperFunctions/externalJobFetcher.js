
const DEFAULT_TIMEOUT_MS = 10_000;

async function fetchJson(url, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
async function fetchArbeitnow() {
  try {
    const data = await fetchJson('https://arbeitnow.com/api/job-board-api');
    return (data.data || []).map((job) => ({
      externalId: `arbeitnow:${job.slug}`,
      title: job.title,
      companyName: job.company_name,
      location: job.location || (job.remote ? 'Remote' : ''),
      sourceUrl: job.url,
      source: 'arbeitnow',
      workMode: job.remote ? 'remote' : 'on-site',
      jobDescription: stripHtml(job.description).slice(0, 1000),
      requiredSkills: (job.tags || []).join(', ') || 'Not specified',
    }));
  } catch (err) {
    console.error('[externalJobFetcher] Arbeitnow failed:', err.message);
    return [];
  }
}

async function fetchRemotive({ query } = {}) {
  try {
    const url = new URL('https://remotive.com/api/remote-jobs');
    if (query) url.searchParams.set('search', query);
    const data = await fetchJson(url.toString());
    return (data.jobs || []).map((job) => ({
      externalId: `remotive:${job.id}`,
      title: job.title,
      companyName: job.company_name,
      location: job.candidate_required_location || 'Remote',
      sourceUrl: job.url,
      source: 'remotive',
      workMode: 'remote',
      jobDescription: stripHtml(job.description).slice(0, 1000),
      requiredSkills: (job.tags || []).join(', ') || 'Not specified',
    }));
  } catch (err) {
    console.error('[externalJobFetcher] Remotive failed:', err.message);
    return [];
  }
}

async function fetchGreenhouseCompany(slug) {
  try {
    const data = await fetchJson(
      `://boards-api.grhttpseenhouse.io/v1/boards/${slug}/jobs?content=true`
    );
    return (data.jobs || []).map((job) => ({
      externalId: `greenhouse:${slug}:${job.id}`,
      title: job.title,
      companyName: slug,
      location: job.location?.name || '',
      sourceUrl: job.absolute_url,
      source: 'greenhouse',
      workMode: /remote/i.test(job.location?.name || '') ? 'remote' : 'on-site',
      jobDescription: stripHtml(job.content).slice(0, 1000),
      requiredSkills: 'Not specified',
    }));
  } catch (err) {
    console.error(`[externalJobFetcher] Greenhouse (${slug}) failed:`, err.message);
    return [];
  }
}

async function fetchLeverCompany(slug) {
  try {
    const data = await fetchJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    return (data || []).map((job) => ({
      externalId: `lever:${slug}:${job.id}`,
      title: job.text,
      companyName: slug,
      location: job.categories?.location || '',
      sourceUrl: job.hostedUrl,
      source: 'lever',
      workMode: /remote/i.test(job.categories?.location || '') ? 'remote' : 'on-site',
      jobDescription: stripHtml(job.descriptionPlain || job.description || '').slice(0, 1000),
      requiredSkills: 'Not specified',
    }));
  } catch (err) {
    console.error(`[externalJobFetcher] Lever (${slug}) failed:`, err.message);
    return [];
  }
}

/**
 * @param {object} opts
 * @param {string[]} [opts.greenhouseCompanies]
 * @param {string[]} [opts.leverCompanies]
 * @param {string} [opts.query]
 */
async function externalJobFetcher({
  greenhouseCompanies = [],
  leverCompanies = [],
  query = '',
} = {}) {
  const [arbeitnow, remotive, greenhouse, lever] = await Promise.all([
    fetchArbeitnow(),
    fetchRemotive({ query }),
    Promise.all(greenhouseCompanies.map(fetchGreenhouseCompany)).then((r) => r.flat()),
    Promise.all(leverCompanies.map(fetchLeverCompany)).then((r) => r.flat()),
  ]);

  let all = [...arbeitnow, ...remotive, ...greenhouse, ...lever];

  if (query) {
    const q = query.toLowerCase();
    all = all.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.jobDescription.toLowerCase().includes(q)
    );
  }

  return all;
}

module.exports = { externalJobFetcher };