import OpenAI from "openai";
import { fallbackAnalyzeAlert } from "./fallback.js";

const ALLOWED_CATEGORIES = [
  "phishing",
  "scam",
  "data breach",
  "network issue",
  "physical safety",
  "general safety"
];

let client = null;
let disableAiDueToQuota = false;

function isQuotaError(error) {
  const status = error?.status;
  const message = String(error?.message || "").toLowerCase();
  return status === 429 && (message.includes("quota") || message.includes("billing"));
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAnalysis(parsed, fallback) {
  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  const category = typeof parsed.category === "string"
    ? parsed.category.trim().toLowerCase()
    : fallback.category;

  const safeCategory = ALLOWED_CATEGORIES.includes(category)
    ? category
    : fallback.category;

  const summary = typeof parsed.summary === "string" && parsed.summary.trim().length >= 12
    ? parsed.summary.trim()
    : fallback.summary;

  const checklist = Array.isArray(parsed.checklist)
    ? parsed.checklist
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 4)
    : fallback.checklist;

  return {
    category: safeCategory,
    summary,
    checklist: checklist.length ? checklist : fallback.checklist,
    analysisSource: "ai"
  };
}

export async function analyzeAlert(alert) {
  const fallback = fallbackAnalyzeAlert(alert);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || disableAiDueToQuota) {
    return fallback;
  }

  try {
    if (!client) {
      client = new OpenAI({ apiKey });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5-mini";

    const prompt = `
You are analyzing a community safety and digital wellness alert.

Classify the alert into exactly one of these categories:
- phishing
- scam
- data breach
- network issue
- physical safety
- general safety

Return ONLY valid JSON with this shape:
{
  "category": "one allowed category",
  "summary": "2 short calm sentences",
  "checklist": ["3 short action items", "item 2", "item 3"]
}

Alert title: ${alert.title}
Alert description: ${alert.description}
Location: ${alert.location}
Severity: ${alert.severity}
`.trim();

    const response = await client.responses.create({
      model,
      input: prompt
    });

    const text = response.output_text?.trim();

    if (!text) {
      return fallback;
    }

    const parsed = extractJson(text);
    return normalizeAnalysis(parsed, fallback);
  } catch (error) {
    if (isQuotaError(error)) {
      disableAiDueToQuota = true;
      console.warn("OpenAI quota exceeded. Using fallback analysis until server restart.");
      return fallback;
    }

    console.error("AI analysis failed. Using fallback instead.", error.message);
    return fallback;
  }
}
