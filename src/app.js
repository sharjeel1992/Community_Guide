import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateAlertInput, validateStatusUpdateInput } from "./validation.js";
import { analyzeAlert } from "./ai.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultAlertsFilePath = path.join(__dirname, "../data/alerts.json");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

function getAlertsFilePath() {
  return process.env.ALERTS_FILE_PATH
    ? path.resolve(process.env.ALERTS_FILE_PATH)
    : defaultAlertsFilePath;
}

// Helper function to read alerts from file
function readAlerts() {
  try {
    const data = fs.readFileSync(getAlertsFilePath(), "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// Helper function to write alerts to file
function writeAlerts(alerts) {
  fs.writeFileSync(getAlertsFilePath(), JSON.stringify(alerts, null, 2));
}

// Test route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server is healthy" });
});

// Get all alerts
app.get("/api/alerts", (req, res) => {
  const alerts = readAlerts();
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  const severity = typeof req.query.severity === "string"
    ? req.query.severity.trim().toLowerCase()
    : "";
  const status = typeof req.query.status === "string"
    ? req.query.status.trim().toLowerCase()
    : "";

  const filtered = alerts.filter((alert) => {
    const matchesSearch = !q || [
      alert.title,
      alert.description,
      alert.location,
      alert.category,
      alert.summary
    ].some((field) => String(field || "").toLowerCase().includes(q));

    const matchesSeverity = !severity || String(alert.severity || "").toLowerCase() === severity;
    const matchesStatus = !status || String(alert.status || "").toLowerCase() === status;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  res.json(filtered);
});

// Create one alert
app.post("/api/alerts", async (req, res) => {
    const validation = validateAlertInput(req.body);

    if (!validation.isValid) {
    return res.status(400).json({
        error: "Validation failed",
        details: validation.errors
    });
    }
  
    const alerts = readAlerts();

    const baseAlert = {
      id: Date.now().toString(),
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      location: req.body.location.trim(),
      severity: req.body.severity,
      status: "new",
      createdAt: new Date().toISOString()
    };

    const analysis = await analyzeAlert(baseAlert);

    const newAlert = {
      ...baseAlert,
      category: analysis.category,
      summary: analysis.summary,
      checklist: analysis.checklist,
      analysisSource: analysis.analysisSource
    };
  
    alerts.push(newAlert);
    writeAlerts(alerts);
  
    res.status(201).json(newAlert);
  });

app.patch("/api/alerts/:id", (req, res) => {
  const nextStatus = String(req.body?.status || "").trim().toLowerCase();
  const validation = validateStatusUpdateInput({ status: nextStatus });

  if (!validation.isValid) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.errors
    });
  }

  const alerts = readAlerts();
  const alertIndex = alerts.findIndex((alert) => alert.id === req.params.id);

  if (alertIndex === -1) {
    return res.status(404).json({ error: "Alert not found" });
  }

  alerts[alertIndex] = {
    ...alerts[alertIndex],
    status: nextStatus,
    updatedAt: new Date().toISOString()
  };

  writeAlerts(alerts);
  return res.json(alerts[alertIndex]);
});

export default app;
