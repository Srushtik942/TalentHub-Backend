const axios = require("axios");
require("dotenv").config();

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.API_KEY;
const MODEL = "nvidia/nemotron-3.5-lightning:free";

const SYSTEM_PROMPT = `
You are a senior technical interviewer helping a job applicant prepare.

Given a job description, generate interview preparation material.

Respond with JSON only, no extra text or markdown. Use exactly this schema:
{
  "interviewQuestions": ["string", "string", "string", "string", "string"],
  "topicsToRevise": ["string"],
  "preparationTips": "string"
}

Rules:
- "interviewQuestions" must contain exactly 5 likely interview questions based on the job description.
- "topicsToRevise" must be a short list of key topics/technologies relevant to the role.
- "preparationTips" must be 1-3 sentences of practical advice for this specific role.
- Do not include any commentary outside the JSON.
`;

async function getInterviewPrep(jobDescription, requiredSkills) {
  if (!API_KEY) {
    throw new Error("API_KEY is not set in .env");
  }

  const userMessage = `
Job Description:
${jobDescription}

Required Skills:
${requiredSkills}
`;

  const response = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
    },
    { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
  );

  const raw = response.data.choices[0].message.content;
  const cleaned = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

module.exports = getInterviewPrep;