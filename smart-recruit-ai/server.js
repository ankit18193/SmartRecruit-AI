require("dotenv").config();
require("./config/redis.js");
const { client: esClient, createJobIndex } = require("./utils/elastic");

const auth = require("./middleware/auth.middleware");

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const passport = require("passport"); 
require("./config/passport.js");
const session = require("express-session"); 

const bullBoard = require("./utils/bullBoard");



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

// Allow configuring allowed origins via environment variable:
// Example: ALLOWED_ORIGINS="https://example.com,http://localhost:5173"
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
const allowAllOrigins = allowedOriginsEnv.trim() === "*";
const allowedOrigins = allowAllOrigins
  ? []
  : (allowedOriginsEnv
      ? allowedOriginsEnv.split(",").map((s) => s.trim()).filter(Boolean)
      : ["http://localhost:5173", "https://smart-recruit-ai-weld.vercel.app", "https://verbose-potato-69r94w475rvxf54xr-5173.app.github.dev"]);

console.log("CORS allowed origins:", allowAllOrigins ? "* (all origins)" : allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    // allow localhost
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // allow ALL github codespaces domains
    if (origin.includes("app.github.dev")) {
      return callback(null, true);
    }

    return callback(null, true); // 🔥 TEMP: allow all (to fix issue)
  },
  credentials: true,
};
app.use(cors(corsOptions));
 
// Ensure OPTIONS (preflight) responses include CORS headers without using
// app.options('*') which can crash with certain path-to-regexp versions.
// Respect proxy headers on hosted platforms
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// app.use((req, res, next) => {
//   if (req.method !== "OPTIONS") return next();

//   const origin = req.get("origin");
//   if (origin && isOriginAllowed(origin)) {
//     // echo origin so credentials work
//     res.header("Access-Control-Allow-Origin", origin);
//   } else {
//     res.header("Access-Control-Allow-Origin", "null");
//   }

//   const allowCreds = process.env.ALLOW_CREDENTIALS !== 'false';
//   res.header("Access-Control-Allow-Credentials", allowCreds ? "true" : "false");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
//   );

//   return res.sendStatus(200);
// });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // 🔥 THIS IS KEY
  }

  next();
});
  
app.use(express.json());

app.use(
  "/admin/queues",
  auth, // your middleware
  bullBoard.getRouter()
);


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


// Debug endpoint to inspect CORS decision for a given request origin
function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowAllOrigins) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".github.dev") || origin.endsWith(".githubpreview.dev")) return true;
  if (process.env.ALLOWED_ORIGINS_REGEX) {
    try {
      const re = new RegExp(process.env.ALLOWED_ORIGINS_REGEX);
      if (re.test(origin)) return true;
    } catch (e) {
      console.error("Invalid ALLOWED_ORIGINS_REGEX:", e);
    }
  }
  return false;
}

app.get("/api/debug/cors", (req, res) => {
  try {
    const origin = req.get("origin") || null;
    const allowed = isOriginAllowed(origin);
    res.json({ origin, allowed, allowAllOrigins, allowedOrigins, allowedOriginsRegex: process.env.ALLOWED_ORIGINS_REGEX || null });
  } catch (err) {
    console.error('Debug CORS handler error:', err);
    return res.status(500).json({ message: 'Debug endpoint failed', error: err.message });
  }
});


app.get("/", (req, res) => res.send("SmartRecruit API is running..."));

// Basic request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} Origin=${req.get('origin')}`);
  next();
});

// Central error handler (returns JSON and logs stack)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  const payload = { message: err && err.message ? err.message : 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production') payload.stack = err && err.stack ? err.stack : null;
  res.status(status).json(payload);
});

const http = require("http");
const { Server } = require("socket.io");



const PORT = process.env.PORT || 5000;

// create server
const server = http.createServer(app);


// attach socket
const io = new Server(server, {
  cors: {
    origin: true, // 🔥 IMPORTANT
    credentials: true,
  },
});
module.exports.io = io;

// connection check
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);
});

// start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

async function waitForES(retries = 10) {
  while (retries) {
    try {
      await esClient.info();
      console.log("✅ Elasticsearch Connected");
      return;
    } catch (err) {
      console.log("⏳ Waiting for Elasticsearch...");
      await new Promise((res) => setTimeout(res, 3000));
      retries--;
    }
  }
  console.error("❌ Elasticsearch failed after retries");
}

waitForES();

waitForES().then(() => {
  createJobIndex();
});