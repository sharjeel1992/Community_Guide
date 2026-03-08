import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

vi.mock("../src/ai.js", () => ({
  analyzeAlert: vi.fn()
}));

import app from "../src/app.js";
import { analyzeAlert } from "../src/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const alertsFilePath = path.join(__dirname, "../data/alerts.json");

const originalAlertsData = fs.existsSync(alertsFilePath)
  ? fs.readFileSync(alertsFilePath, "utf-8")
  : "[]";

beforeEach(() => {
  fs.writeFileSync(alertsFilePath, "[]");
  vi.clearAllMocks();
});

afterAll(() => {
  fs.writeFileSync(alertsFilePath, originalAlertsData);
});

describe("Alerts API", () => {
  it("creates a valid alert and stores analysis", async () => {
    analyzeAlert.mockResolvedValue({
      category: "phishing",
      summary:
        "This alert appears related to a phishing attempt in Bothell. Users should avoid suspicious links.",
      checklist: [
        "Do not click suspicious links.",
        "Verify the sender independently.",
        "Report the email to the admin."
      ],
      analysisSource: "ai"
    });

    const payload = {
      title: "Suspicious password reset email",
      description:
        "Several residents received urgent email messages asking them to verify their account and reset their password through a link.",
      location: "Bothell",
      severity: "high"
    };

    const response = await request(app).post("/api/alerts").send(payload);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(payload.title);
    expect(response.body.category).toBe("phishing");
    expect(response.body.analysisSource).toBe("ai");
    expect(response.body.checklist).toHaveLength(3);

    const savedAlerts = JSON.parse(fs.readFileSync(alertsFilePath, "utf-8"));
    expect(savedAlerts).toHaveLength(1);
    expect(savedAlerts[0].title).toBe(payload.title);
  });

  it("rejects invalid alert input with 400", async () => {
    const response = await request(app).post("/api/alerts").send({
      title: "11111",
      description: "abc",
      location: "12345",
      severity: "extreme"
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details.title).toBeDefined();
    expect(response.body.details.description).toBeDefined();
    expect(response.body.details.location).toBeDefined();
    expect(response.body.details.severity).toBeDefined();

    expect(analyzeAlert).not.toHaveBeenCalled();

    const savedAlerts = JSON.parse(fs.readFileSync(alertsFilePath, "utf-8"));
    expect(savedAlerts).toHaveLength(0);
  });

  it("filters alerts by search query and severity", async () => {
    const seedAlerts = [
      {
        id: "1",
        title: "Suspicious password reset email",
        description: "Email asks users to verify account credentials.",
        location: "Bothell",
        severity: "high",
        status: "new",
        category: "phishing",
        summary: "Potential phishing attempt.",
        checklist: ["Avoid clicking links."],
        analysisSource: "ai",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Internet outage in building A",
        description: "Residents report Wi-Fi connectivity problems.",
        location: "Seattle",
        severity: "medium",
        status: "new",
        category: "network issue",
        summary: "Likely network outage.",
        checklist: ["Check router."],
        analysisSource: "fallback",
        createdAt: new Date().toISOString()
      }
    ];

    fs.writeFileSync(alertsFilePath, JSON.stringify(seedAlerts, null, 2));

    const response = await request(app)
      .get("/api/alerts")
      .query({ q: "email", severity: "high" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Suspicious password reset email");
  });
});