const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


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

⚠️ CRITICAL SYSTEM INSTRUCTION:
You are a backend API system. You MUST return ONLY a raw, minified JSON object.
- DO NOT use markdown
- DO NOT add explanations outside JSON
- Output must be VALID JSON ONLY
// 🔥 UPGRADE 1: Prevent JSON escaping errors
- Ensure all double quotes inside string values are properly escaped (e.g., use \\" instead of ").

---

📦 OUTPUT FORMAT (STRICT SCHEMA):

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
        "reasoning": string
      }
    ],

    "suggestions": [
      {
        "label": string,
        "category": "growth" | "technical",
        "priority": "high" | "medium" | "low",
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

📌 ANALYSIS INTELLIGENCE RULES:

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

// 🔥 UPGRADE 2: The Anti-Hallucination Protocol
4. MISSING DATA HANDLING:
If the candidate has ZERO projects, ZERO certifications, or NO education listed, DO NOT invent them. Return an empty array [] or 0. Use the 'missingSkills' and 'suggestions' to aggressively coach them on building projects to fill this empty space.

---

💡 TONE ENGINE (VERY IMPORTANT):

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

---

🧠 REASONING RULES (MAXIMUM DEPTH REQUIRED):

Strengths:
- 2–3 sentences.
- Mention REAL signals from resume (projects, stack, decisions).
- Make the candidate feel PROUD of what they've accomplished.

Missing Skills (THE MENTOR'S GUIDANCE):
- 5–6 sentences minimum.
- Do not just point out the gap. Frame it as their "Next Superpower".
- Explain the specific industry demand for this skill.
- Detail exactly what real-world, scalable architectures they cannot currently build without it.
- End with massive motivation (e.g., "Mastering this bridges the exact gap between your current profile and a Senior role.")

Suggestions (THE ROADMAP):
- 6–8 sentences minimum.
- Provide a step-by-step micro-roadmap.
- Phase 1: Tell them exactly what to study or read first.
- Phase 2: Give them an EXACT, highly specific project idea to build using this skill. Include architecture hints.
- Phase 3: Explain exactly how adding this project to their resume will drastically boost their salary and interview callbacks. Sound like a mentor pushing them to greatness.

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

//  UPGRADE 3: ATS Formatting Check
---
ATS & FORMATTING CHECK:
If their resume lacks quantifiable metrics (e.g., "improved speed by 40%"), explicitly mention this in one of the "suggestions" and tell them exactly how to rewrite their bullet points. 

---

MINIMUM DATA:
- 5 skills
- 3 strengths
- 4 missingSkills
- 4 suggestions

---

RESUME TEXT:
"""
${resumeText}
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
    mindsetBoost: ""
  };

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    console.log("RAW AI RESPONSE RECEIVED");

    
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    
    const startIndex = text.indexOf("{");
    const endIndex = text.lastIndexOf("}");
    
    if (startIndex !== -1 && endIndex !== -1) {
      const jsonString = text.substring(startIndex, endIndex + 1);
      const aiParsed = JSON.parse(jsonString);

      
      finalParsedData = {
        aiScore: typeof aiParsed.aiScore === "number" ? aiParsed.aiScore : 0,
        confidenceScore: typeof aiParsed.confidenceScore === "number" ? aiParsed.confidenceScore : 0,
        marketLevel: aiParsed.marketLevel || "beginner",
        skills: Array.isArray(aiParsed.skills) ? aiParsed.skills : [],
        insights: {
          strengths: Array.isArray(aiParsed.insights?.strengths) ? aiParsed.insights.strengths : [],
          missingSkills: Array.isArray(aiParsed.insights?.missingSkills) ? aiParsed.insights.missingSkills : [],
          suggestions: Array.isArray(aiParsed.insights?.suggestions) ? aiParsed.insights.suggestions : []
        },
        projects: Array.isArray(aiParsed.projects) ? aiParsed.projects : [],
        certifications: Array.isArray(aiParsed.certifications) ? aiParsed.certifications : [],
        education: { cgpa: aiParsed.education?.cgpa || 0 },
        careerStrategy: {
          shortTerm: aiParsed.careerStrategy?.shortTerm || "",
          midTerm: aiParsed.careerStrategy?.midTerm || "",
          longTerm: aiParsed.careerStrategy?.longTerm || ""
        },
        mindsetBoost: aiParsed.mindsetBoost || ""
      };
    }
  } catch (error) {
    console.error("Gemini API or Parsing Error:", error.message);
    if (error.message.includes("429") || error.message.toLowerCase().includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error("AI_ANALYSIS_FAILED");
  }

  return finalParsedData;
}



async function generateAIResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Generic AI Error:", error.message);
    throw new Error("AI_GENERATION_FAILED");
  }
}


module.exports = { analyzeResume, generateAIResponse };

