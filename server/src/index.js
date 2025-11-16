import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

//routes
import userRoutes from "./routes/userRoutes.js";
import dictionaryRoutes from "./routes/dictionaryRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

// env
dotenv.config();

const app = express();
app.locals.dbConnected = false;

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isDevelopment =
    !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    process.env.CLIENT_URL,
  ].filter(Boolean);

  if (isDevelopment) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept"
      );
      res.header("Access-Control-Expose-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
    } else {
      console.warn("Unexpected origin in development:", origin);
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept"
      );

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
    }
  } else {
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept"
      );

      if (req.method === "OPTIONS") {
        return res.sendStatus(204);
      }
    } else if (origin) {
      console.error("CORS blocked origin:", origin);
      return res.status(403).json({
        message: "CORS policy: Origin not allowed",
        origin: origin,
        allowedOrigins: allowedOrigins,
      });
    }
  }

  next();
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15p
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
});
app.use("/api/", limiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/dictionary", dictionaryRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);

// check health
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    nodeEnv: process.env.NODE_ENV || "development",
    port: app.locals.PORT || process.env.PORT || 5000,
    dbConnected: !!app.locals.dbConnected,
    clientUrl: process.env.CLIENT_URL || null,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  app.locals.PORT = PORT;
  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT} in ${
        process.env.NODE_ENV || "development"
      } mode`
    );
  });

  try {
    await connectDB();
    app.locals.dbConnected = true;
    console.log(" Database connection established");

    const bootstrapAdmin = async () => {
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME || "Admin";
      if (!adminEmail || !adminPassword) {
        return;
      }
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const hash = await bcrypt.hash(adminPassword, 12);
        await User.create({
          name: adminName,
          email: adminEmail,
          password: hash,
          role: "admin",
          isActive: true,
        });
        console.log(" Admin account created:", adminEmail);
      }
      const envAdmin = await User.findOne({ email: adminEmail, role: "admin" });
      if (envAdmin) {
        await User.updateMany(
          { role: "admin", _id: { $ne: envAdmin._id } },
          { role: "user" }
        );
      }
    };

    await bootstrapAdmin();
  } catch (error) {
    app.locals.dbConnected = false;
    console.error("Database connection failed:", error.message);
  }
};

startServer();
