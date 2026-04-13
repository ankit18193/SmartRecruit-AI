const { HfInference } = require("@huggingface/inference");
const Groq = require("groq-sdk");


const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), ms),
  );


async function callGroq(systemRules, resumeText) {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY in ENV");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    console.log("⚡ GROQ START");

    const completion = await Promise.race([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `${systemRules}\n\nRESUME:\n${resumeText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      timeout(15000),
    ]);

    return completion.choices[0].message.content;
  } catch (err) {
    console.error("❌ GROQ FAILED:", err.message);
    throw new Error("GROQ_FAILED");
  }
}


async function callHuggingFace(systemRules, resumeText) {
  if (!process.env.HF_API_KEY) throw new Error("Missing HF_API_KEY in ENV");
  const hf = new HfInference(process.env.HF_API_KEY);

  try {
    console.log("🧠 HF START");

    const res = await Promise.race([
      hf.chatCompletion({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "user",
            content: `${systemRules}\n\nRESUME:\n${resumeText}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3, 
      }),
      timeout(15000),
    ]);

    return res.choices[0].message.content;
  } catch (err) {
    console.error("❌ HF FAILED:", err.message);
    throw new Error("HF_FAILED");
  }
}

async function analyzeResume(resumeText) {
  const prompt = `
You are an Elite Technical Recruiter, FAANG Engineering Manager, and High-Performance Career Coach.

Your job is NOT just to analyze the resume — 
Your job is to TRANSFORM the candidate's mindset, confidence, and career direction.

You must:
- Identify strengths with deep validation
- Identify gaps with precision (but NEVER demotivate)
- Provide a HIGH-IMPACT growth roadmap
- Make the candidate feel: "I am closer to success than I thought"

 CRITICAL SYSTEM INSTRUCTION:
You are a backend API system. You MUST return ONLY a raw, minified JSON object.
- DO NOT use markdown
- DO NOT add explanations outside JSON
- Output must be VALID JSON ONLY
//  UPGRADE 1: Prevent JSON escaping errors
- Ensure all double quotes inside string values are properly escaped (e.g., use \\" instead of ").

---

 OUTPUT FORMAT (STRICT SCHEMA):

{
  "aiScore": number,
  "confidenceScore": number, 
  "marketLevel": "beginner" | "intermediate" | "job-ready" | "top-tier",

  "skills": [string],

  "insights": {
    "strengths": [
      {
        "label": string,
        "category": "frontend" | "backend" | "devops" | "core" | "other",
        "impact": "high" | "medium" | "low",
        "reasoning": string
      }
    ],

    "missingSkills": [
      {
        "label": string,
        "category": "frontend" | "backend" | "devops" | "core" | "other",
        "priority": "high" | "medium" | "low",
        "currentStackEvidence": "string (name the exact tool from the resume this relates to)",
        "reasoning": string
      }
    ],

    "suggestions": [
      {
        "label": string,
        "category": "growth" | "technical",
        "priority": "high" | "medium" | "low",
        "basedOnResumeProject": "string (name the exact project or role this improves)",
        "reasoning": string
      }
    ]
  },

  "projects": [
    {
      "name": string,
      "description": string,
      "complexity": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ],

  "certifications": [
    {
      "name": string,
      "relevance": "low" | "medium" | "high"
    }
  ],

  "education": {
    "cgpa": number
  },

  "careerStrategy": {
    "shortTerm": string, 
    "midTerm": string,
    "longTerm": string
  },

  "mindsetBoost": string
}

---

  ANALYSIS INTELLIGENCE RULES:

1. SCORE CALCULATION (STRICT):
- Skills depth → 30%
- Project complexity → 25%
- Real-world relevance → 15%
- Certifications → 10%
- CGPA → 10%
- Industry alignment → 10%

2. CONFIDENCE SCORE:
Reflect how close the candidate is to getting hired TODAY.

3. MARKET LEVEL:
- beginner → basic learning stage
- intermediate → some projects but not job-ready
- job-ready → can clear interviews
- top-tier → strong product-level engineer

//  UPGRADE 2: The Anti-Hallucination Protocol
4. MISSING DATA HANDLING:
If the candidate has ZERO projects, ZERO certifications, or NO education listed, DO NOT invent them. Return an empty array [] or 0. Use the 'missingSkills' and 'suggestions' to aggressively coach them on building projects to fill this empty space.

---

 TONE ENGINE (VERY IMPORTANT):

You must follow:
- 10% critique
- 90% high-energy, actionable encouragement

NEVER:
- discourage
- sound robotic
- give generic advice

ALWAYS:
- validate effort
- highlight potential
- convert weaknesses → opportunities
- make candidate feel they are "1–2 steps away from breakthrough"

 ANTI-GENERIC OUTPUT FILTER:
Avoid repeating common suggestions like:
- Cloud Computing
- Cybersecurity
- Data Science
- Machine Learning

ONLY include them if:
- They are clearly missing AND
- You justify it using resume evidence

Otherwise, DO NOT mention them.

---

 DIVERSITY ENFORCEMENT RULE:

Across strengths and missingSkills:
- You MUST avoid repeating common industry suggestions across candidates.
- You MUST prioritize skills that are CLOSE to the candidate’s current stack.

STRICT RULE:
- If candidate works in backend → suggest deeper backend/system design topics
- If candidate works in frontend → suggest frontend/system/UI depth
- DO NOT jump to generic areas like:
  Cloud, ML, Cybersecurity
  UNLESS absolutely necessary AND strongly justified.

If suggestions look similar to a typical software engineer template → REWRITE them.

 SKILL PROXIMITY RULE:

You MUST identify gaps based on what the candidate is ALREADY doing.

Example:
- If candidate uses Redis → suggest distributed caching strategies, not ML
- If candidate uses Node.js → suggest system design, scaling, event-driven architecture
- If candidate uses React → suggest performance optimization, SSR, state architecture

DO NOT jump to unrelated domains.

 STACK-BASED ANALYSIS:

Every missing skill MUST be an extension of:
- existing tools
- existing projects
- existing architecture

 BAD:
"Learn Machine Learning"

 GOOD:
"Candidate uses BullMQ but lacks deeper understanding of distributed job orchestration patterns like event-driven microservices"

---

 REASONING RULES (MAXIMUM DEPTH REQUIRED):

 CRITICAL PERSONALIZATION RULE:
- EVERY insight MUST be derived directly from the resume content.
- You MUST explicitly reference technologies, tools, projects, or experience mentioned in the resume.
- DO NOT generate generic career advice.

 BAD EXAMPLE:
"Learn Cloud Computing to improve scalability"

 GOOD EXAMPLE:
"The candidate has experience with Redis and BullMQ for backend systems but has no exposure to cloud platforms like AWS or GCP, which limits their ability to deploy scalable distributed systems."

- If two resumes are different, the output MUST be noticeably different.
- If your output looks reusable for another candidate, it is WRONG.

---

 THINKING PRIORITY RULE:
Focus on depth over quantity.
If fewer insights are more accurate, prefer fewer.
Do NOT generate filler content just to meet structure requirements.

---

Strengths:
- Mention REAL signals from resume (projects, stack, decisions).
- Make the candidate feel PROUD of what they've accomplished.

Missing Skills (HIGHLY PERSONALIZED GAP ANALYSIS):
- MUST explain WHY this skill is missing using resume evidence.
- MUST mention what the candidate currently has and what is missing.
- MUST connect the gap to real-world engineering limitations.
- Do not just point out the gap. Frame it as their "Next Superpower".
- Explain the specific industry demand for this skill.
- Detail exactly what real-world, scalable architectures they cannot currently build without it.
- End with massive motivation.

Suggestions (THE ROADMAP):
- Suggestions MUST be based on the candidate's CURRENT stack.
- DO NOT give generic "learn X" advice.
- ALWAYS connect suggestion → candidate’s existing skills → next logical upgrade.
- Provide a step-by-step micro-roadmap.
- Phase 1: Tell them exactly what to study or read first.
- Phase 2: Give them an EXACT, highly specific project idea.
- Phase 3: Explain impact on salary and interviews.

---

CAREER STRATEGY:

shortTerm:
→ What to do in next 30 days

midTerm:
→ What to build in 3–6 months

longTerm:
→ How to reach top-tier engineer level

---

MINDSET BOOST (VERY IMPORTANT):

Write a powerful 2–3 sentence message that:
- builds confidence
- feels personal
- sounds like a mentor talking directly
- makes candidate feel unstoppable

Example tone:
"You are not behind — you are just one strong project away from standing out."

---

ATS & FORMATTING CHECK:
If their resume lacks quantifiable metrics (e.g., "improved speed by 40%"), explicitly mention this in one of the "suggestions" and tell them exactly how to rewrite their bullet points. 

---

 FINAL HARD RULE:

You MUST include at least 2 UNIQUE technologies or project names from the resume inside EACH:
- strength reasoning
- missing skill reasoning

If not → your answer is INVALID

---

RESUME TEXT:
"""
<resume will be provided separately>
"""
`;

  let finalParsedData = {
    aiScore: 0,
    confidenceScore: 0,
    marketLevel: "beginner",
    skills: [],
    insights: { strengths: [], missingSkills: [], suggestions: [] },
    projects: [],
    certifications: [],
    education: { cgpa: 0 },
    careerStrategy: { shortTerm: "", midTerm: "", longTerm: "" },
    mindsetBoost: "",
  };

  console.log("PROMPT LENGTH:", prompt.length);

  try {
    let text = "";

   
    try {
      
      text = await callGroq(prompt, resumeText);
      console.log(" GROQ SUCCESS");
    } catch (groqError) {
      console.log(" GROQ FAILED → switching to HF");

      try {
        
        text = await callHuggingFace(prompt, resumeText);
        console.log(" HF SUCCESS");
      } catch (hfError) {
        console.log(" BOTH AI FAILED");
        throw new Error("AI_ANALYSIS_FAILED_ALL_RETRIES");
      }
    }

    
    if (!text || text.length < 20) {
      console.log(" EMPTY AI RESPONSE");
      throw new Error("EMPTY_AI_RESPONSE");
    }

    console.log("AI RESPONSE RECEIVED (length):", text.length);

    
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      console.log(" JSON NOT FOUND");
      throw new Error("INVALID_JSON_FORMAT");
    }

    const jsonString = match[0];

    let aiParsed = {};

    try {
      aiParsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.log("JSON PARSE FAILED");
      throw new Error("JSON_PARSE_FAILED");
    }

    
    finalParsedData = {
      aiScore: typeof aiParsed.aiScore === "number" ? aiParsed.aiScore : 0,
      confidenceScore:
        typeof aiParsed.confidenceScore === "number"
          ? aiParsed.confidenceScore
          : 0,
      marketLevel: aiParsed.marketLevel || "beginner",
      skills: Array.isArray(aiParsed.skills) ? aiParsed.skills : [],
      insights: {
        strengths: Array.isArray(aiParsed.insights?.strengths)
          ? aiParsed.insights.strengths
          : [],
        missingSkills: Array.isArray(aiParsed.insights?.missingSkills)
          ? aiParsed.insights.missingSkills
          : [],
        suggestions: Array.isArray(aiParsed.insights?.suggestions)
          ? aiParsed.insights.suggestions
          : [],
      },
      projects: Array.isArray(aiParsed.projects) ? aiParsed.projects : [],
      certifications: Array.isArray(aiParsed.certifications)
        ? aiParsed.certifications
        : [],
      education: { cgpa: aiParsed.education?.cgpa || 0 },
      careerStrategy: {
        shortTerm: aiParsed.careerStrategy?.shortTerm || "",
        midTerm: aiParsed.careerStrategy?.midTerm || "",
        longTerm: aiParsed.careerStrategy?.longTerm || "",
      },
      mindsetBoost: aiParsed.mindsetBoost || "",
    };

    return finalParsedData;
  } catch (error) {
    console.error("AI Processing Error:", error.message);
    throw error;
  }
}


async function generateAIResponse(prompt) {
  try {
    return await callGroq(prompt);
  } catch (error) {
    console.error("Generic AI Error:", error.message);
    throw new Error("AI_GENERATION_FAILED");
  }
}

module.exports = { analyzeResume, generateAIResponse };
