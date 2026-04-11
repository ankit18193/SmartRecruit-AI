require("dotenv").config();

const connectDB = require("./config/db");

// 🔒 ENV CHECK (UPDATED)
console.log("HF KEY:", !!process.env.HF_API_KEY);
console.log("OPENAI KEY:", !!process.env.OPENAI_API_KEY);

(async () => {
  try {
    // ✅ STEP 1: Connect DB FIRST
    await connectDB();
    console.log("✅ Worker DB Connected");

    // ✅ STEP 2: Start worker AFTER DB
    require("./workers/resumeWorker");

    console.log("🚀 Resume worker started");

  } catch (error) {
    console.error("❌ Worker failed to start:", error);
    process.exit(1); // 🔥 Important: crash properly
  }
})();