function detectCategory(text) {
    const rules = [
      {
        category: "phishing",
        keywords: ["password reset", "verify account", "login", "credential", "sign in", "security alert", "reset email"]
      },
      {
        category: "scam",
        keywords: ["gift card", "wire transfer", "payment", "government office", "irs", "urgent payment", "phone scam"]
      },
      {
        category: "data breach",
        keywords: ["breach", "leak", "exposed", "stolen data", "compromised records"]
      },
      {
        category: "network issue",
        keywords: ["wifi", "wi-fi", "internet", "outage", "network", "router", "connectivity"]
      },
      {
        category: "physical safety",
        keywords: ["break-in", "stolen", "suspicious person", "unsafe", "harassment", "threat", "trespassing"]
      }
    ];
  
    for (const rule of rules) {
      if (rule.keywords.some((keyword) => text.includes(keyword))) {
        return rule.category;
      }
    }
  
    return "general safety";
  }
  
  function buildChecklist(category) {
    switch (category) {
      case "phishing":
        return [
          "Do not click suspicious links.",
          "Do not enter your password on untrusted pages.",
          "Report the message to the platform admin."
        ];
      case "scam":
        return [
          "Do not send money or gift cards.",
          "Verify the caller or sender independently.",
          "Report the scam attempt to the proper authority."
        ];
      case "data breach":
        return [
          "Change passwords for affected accounts.",
          "Review account activity for unusual behavior.",
          "Notify impacted users if needed."
        ];
      case "network issue":
        return [
          "Check whether the issue affects multiple users.",
          "Restart local network equipment if appropriate.",
          "Escalate to the internet or IT provider."
        ];
      case "physical safety":
        return [
          "Avoid direct confrontation.",
          "Move to a safe location if necessary.",
          "Contact security or emergency services if there is immediate risk."
        ];
      default:
        return [
          "Review the alert carefully.",
          "Verify the information before acting.",
          "Escalate if the situation worsens."
        ];
    }
  }
  
  function buildSummary(category, title, location) {
    const safeLocation = location || "the area";
  
    switch (category) {
      case "phishing":
        return `This alert appears related to a phishing attempt in ${safeLocation}. Users should avoid suspicious links and verify account requests through trusted channels.`;
      case "scam":
        return `This alert appears to describe a scam incident in ${safeLocation}. People should avoid sending money or sharing sensitive information before verifying the source.`;
      case "data breach":
        return `This alert may involve exposed or compromised information in ${safeLocation}. Affected users should review accounts and update credentials promptly.`;
      case "network issue":
        return `This alert appears to describe a network or connectivity problem in ${safeLocation}. The issue should be verified across users and escalated if it persists.`;
      case "physical safety":
        return `This alert may involve a physical safety concern in ${safeLocation}. People should stay aware, avoid risk, and contact the proper authority if needed.`;
      default:
        return `This alert titled "${title}" should be reviewed carefully in ${safeLocation}. Verify the details and take appropriate action based on the level of risk.`;
    }
  }
  
  export function fallbackAnalyzeAlert(alert) {
    const combinedText = `${alert.title} ${alert.description}`.toLowerCase();
    const category = detectCategory(combinedText);
  
    return {
      category,
      summary: buildSummary(category, alert.title, alert.location),
      checklist: buildChecklist(category),
      analysisSource: "fallback"
    };
  }