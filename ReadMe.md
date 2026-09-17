# Job Board — Backend API

A Node.js + Express + MongoDB (Mongoose) backend for a job board application. Supports posting jobs, browsing/sorting job listings, and managing applicant/recruiter accounts.

> **Note:** This README covers the parts of the backend confirmed so far (Job model + salary sorting). Sections marked `TODO` should be filled in with your actual routes/auth setup — update as your API grows.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Testing:** Postman
- **Will use playwright for UI testing.**

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local instance or MongoDB Atlas connection string)
- npm or yarn

### Installation

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobboard
JWT_SECRET=your_jwt_secret_here  
NODE_ENV=development
```

### Running the Server

```bash
# development (with nodemon, if configured)
npm run dev

# production
npm start
```

Server will run at: `http://localhost:5000`

---

## Project Structure

```
├── models/
│   └── Job.js
├── controllers/
│   └── jobController.js
├── routes/
│   └── jobRoutes.js
├── middleware/          # TODO: auth, error handling, etc.
├── config/
│   └── db.js            # TODO: MongoDB connection setup
├── .env
├── server.js / index.js
└── package.json
```

---

## Data Model

### Job Schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | String | Yes | 3–100 chars |
| `companyName` | String | Yes | |
| `salaryMin` | Number | Yes | |
| `salaryMax` | Number | Yes | |
| `workMode` | String | Yes | Enum: `remote`, `on-site`, `hybrid` |
| `experience` | Number | Yes | Min 0 (years) |
| `location` | String | Yes | |
| `jobDescription` | String | Yes | 10–1000 chars |
| `requiredSkills` | String | Yes | 3–100 chars |
| `applicationDeadline` | Date | Yes | Must be a future date |
| `isArchived` | Boolean | No | Default: `false` |
| `postedBy` | ObjectId (ref: `NaukriAspirant`) | Yes | |
| `createdAt` / `updatedAt` | Date | Auto | Via `timestamps: true` |

> ⚠️ **Known issue:** Some legacy documents in the `jobs` collection predate this schema and use a different shape (`salary` as a string instead of `salaryMin`/`salaryMax`). These should be migrated or removed — see [Data Cleanup](#data-cleanup) below.

---

## Authentication & Authorization

All recruiter and applicant routes are protected by two middlewares, applied at the router level:

- **`verifyToken`** — validates the JWT and attaches the authenticated user to the request. *(TODO: confirm token source — `Authorization` header, cookie, etc.)*
- **`authorize(role)`** — restricts access to users with a specific role (`'recruiter'` or `'applicant'`).

```javascript
router.use(verifyToken, authorize('recruiter'));  // recruiter.routes.js
router.use(verifyToken, authorize('applicant'));  // applicant.routes.js
```

> Every route below (unless noted) requires a valid JWT **and** the matching role. Send the token as a Bearer token in Postman:
> `Authorization: Bearer <your_jwt_token>`

Auth endpoints themselves (register/login) aren't shown in the routers above — `TODO`: document these once confirmed (likely a separate `auth.routes.js`).

---

## API Endpoints

Base URL: `/api` *(TODO: confirm your actual mount prefix, e.g. `/api/recruiter` and `/api/applicant`)*

### Recruiter Routes
*(role: `recruiter`, file: `recruiter.routes.js`)*

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| `POST` | `/jobs` | `postJob` | Create a new job posting |
| `PUT` | `/jobs/:jobId` | `editJobPost` | Edit an existing job posting |
| `PATCH` | `/jobs/:jobId/archive` | `archiveJobs` | Archive a job posting |
| `DELETE` | `/deleteJob/:jobId` | `deleteJobPost` | Delete a job posting |
| `GET` | `/applications` | `getApplicationForJob` | Get applications for recruiter's job(s) |
| `PUT` | `/applications/status/:applicationId` | `shortlistApplication` | Update an application's status (e.g. shortlist) |
| `GET` | `/profile` | `fetchRecruiterData` | Get logged-in recruiter's profile |
| `PUT` | `/editProfile/:userId` | `editRecruiterProfile` | Edit recruiter profile |
| `GET` | `/ai-assistant/:jobId` | `Assistant` | AI assistant for a given job — `TODO`: describe what this returns |

### Applicant Routes
*(role: `applicant`, file: `applicant.routes.js`)*

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| `GET` | `/jobs` | `getAllJobs` | Get all job listings |
| `GET` | `/jobs/search` | `searchJobs` | Search jobs — `TODO`: document query params (e.g. `q`, keyword) |
| `GET` | `/jobs/filter` | `filterByOptions` | Filter jobs — `TODO`: document filter params (e.g. `workMode`, `location`, `experience`) |
| `GET` | `/jobs/sort` | `sortBySalary` | Sort jobs by salary (see below) |
| `PATCH` | `/jobs/:jobId/bookmark` | `toggleBookMark` | Toggle bookmark on a job |
| `POST` | `/jobs/:jobId/apply` | `ApplyToJob` | Apply to a job |
| `PATCH` | `/applications/:applicationId/withdraw` | `withdrawnApplication` | Withdraw a submitted application |
| `GET` | `/profile` | `fetchProfileData` | Get logged-in applicant's profile |
| `PUT` | `/editProfile/:userId` | `editProfile` | Edit applicant profile |
| `GET` | `/ai-interview-prep/:jobId` | `generateInterviewPrep` | AI-generated interview prep for a job — `TODO`: describe response shape |

#### `GET /applicant/jobs/sort` — Sort Jobs by Salary

Sorts job listings by `salaryMin` or `salaryMax`, ascending or descending.

**Query Parameters:**

| Param | Values | Default | Description |
|---|---|---|---|
| `order` | `asc`, `desc` | `asc` | Sort direction |
| `field` | `salaryMin`, `salaryMax` | `salaryMin` | Which salary field to sort by |

**Example Requests:**
```
GET /api/applicant/jobs/sort?order=asc&field=salaryMin
GET /api/applicant/jobs/sort?order=desc&field=salaryMax
```

**Example Response:**
```json
{
  "message": "Jobs fetched successfully",
  "jobs": [
    {
      "_id": "6a96b564346e44b4ea507f22",
      "title": "UI/UX Designer",
      "companyName": "CloudNest Labs",
      "salaryMin": 600000,
      "salaryMax": 1000000,
      "workMode": "hybrid",
      "location": "Chandigarh, India",
      "...": "..."
    }
  ]
}
```

**Error Response:**
```json
{
  "message": "Internal Server Error",
  "err": "<error details>"
}
```

> Note: this route requires the `applicant` role and a valid token, per the router-level middleware above.

---

## Data Cleanup

The `jobs` collection currently has documents from an older schema mixed in with the current one. Before relying on salary-based sorting/filtering in production, run a cleanup:

```javascript
// Find legacy docs missing salaryMin
db.jobs.find({ salaryMin: { $exists: false } });

// Option 1: delete them
db.jobs.deleteMany({ salaryMin: { $exists: false } });

// Option 2: migrate them manually (parse old "salary" string → salaryMin/salaryMax)
```

---

## Testing

Import the Postman collection (if exported) or manually test endpoints against `http://localhost:5000/api`. Recommended checks for the sort endpoint:

- `order=asc` → `salaryMin`/`salaryMax` values increase down the list
- `order=desc` → values decrease down the list
- Legacy (schema-mismatched) documents are excluded or handled gracefully

---

## License

MIT