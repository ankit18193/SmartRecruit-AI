require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Say hello");

    const text = result.response.text();

    console.log("✅ GEMINI WORKING:", text);
  } catch (error) {
    console.error("❌ GEMINI FAILED:", error.message);
  }
}

test();