const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.API_KEY;
const MODEL = "nvidia/nemotron-3.5-lightning:free";

if (!API_KEY) {
  console.log("Please set API_KEY in .env");
  process.exit(1);
}

const SYSTEM_PROMPT = `
You are a senior recruiter. Shortlist up to 3 candidates who best match the job description.

Respond with JSON only, no extra text or markdown. Use exactly this schema:
{
  "candidates": [
    {
      "name": "string",
      "email": "string",
      "skills": ["string"],
      "experience": "number (years)",
      "location": "string"
    }
  ]
}

Rules:
- "skills" must only include skills that match the job description.
- "experience" must be a number, not a string.
- If no suitable candidates are found, return { "candidates": [] }.
`;

// Calls the model and returns { candidates: [...] }
async function getTopCandidates(jobDescription, candidates) {
  const userMessage = `
Job Description:
${jobDescription}

Applicants:
${JSON.stringify(candidates, null, 2)}
`;

  const response = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
    },
    { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
  );

  const raw = response.data.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

module.exports = getTopCandidates;