require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const passport = require("passport"); 
require("./config/passport.js");
const session = require("express-session"); 


const authRoutes = require("./routes/auth.routes.js");
const jobRoutes = require("./routes/job.routes.js");
const applicationRoutes = require("./routes/application.routes.js");
const interviewRoutes = require("./routes/interview.routes.js");
const resumeRoutes = require("./routes/resume.routes.js");
const aiRoutes = require("./routes/ai.routes.js");
const notificationRoutes = require("./routes/notification.routes");
const userRoutes = require("./routes/user.routes");

const app = express();


connectDB();


const allowedOrigins = [
    "http://localhost:5173",
    "https://smart-recruit.vercel.app", 
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true // Important for cookies/sessions
  }));
  
  
app.use(express.json());


app.use(
  session({
    secret: process.env.JWT_SECRET || "smart_recruit_secret",
    resave: false,
    saveUninitialized: false,
  })
);


app.use(passport.initialize());



app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);


app.get("/", (req, res) => res.send("SmartRecruit API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));