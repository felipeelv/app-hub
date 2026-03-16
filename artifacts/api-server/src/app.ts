import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// CORS configuration for multiple portals
const allowedOrigins = [
  // Development
  "http://localhost:3000",
  "http://localhost:3001", 
  "http://localhost:3002",
  // Production - Vercel deployments
  "https://admin-portal.vercel.app",      // Replace with actual domain
  "https://prestador-portal.vercel.app",  // Replace with actual domain
  "https://cliente-portal.vercel.app",    // Replace with actual domain
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-profile-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
