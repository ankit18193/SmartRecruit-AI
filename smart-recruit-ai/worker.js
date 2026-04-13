require("dotenv").config();

const connectDB = require("./config/db");


console.log("HF KEY:", !!process.env.HF_API_KEY);
console.log("OPENAI KEY:", !!process.env.OPENAI_API_KEY);

(async () => {
  try {
    
    await connectDB();
    console.log(" Worker DB Connected");

    
    require("./workers/resumeWorker");

    console.log("Resume worker started");

  } catch (error) {
    console.error("Worker failed to start:", error);
    process.exit(1); 
  }
})();