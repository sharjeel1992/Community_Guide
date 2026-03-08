const form = document.getElementById("alertForm");
const message = document.getElementById("message");
const alertsList = document.getElementById("alertsList");
const searchInput = document.getElementById("searchInput");
const filterSeverity = document.getElementById("filterSeverity");
const filterStatus = document.getElementById("filterStatus");
const createAlertButton = document.getElementById("createAlertButton");
const processingOverlay = document.getElementById("processingOverlay");

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const locationInput = document.getElementById("location");
const severityInput = document.getElementById("severity");

const titleError = document.getElementById("titleError");
const descriptionError = document.getElementById("descriptionError");
const locationError = document.getElementById("locationError");
const severityError = document.getElementById("severityError");
const createButtonLabel = createAlertButton?.textContent || "Create Alert";

function setCreateLoading(isLoading) {
  if (!createAlertButton || !processingOverlay) return;

  createAlertButton.disabled = isLoading;
  createAlertButton.textContent = isLoading ? "Processing..." : createButtonLabel;
  processingOverlay.classList.toggle("active", isLoading);
  processingOverlay.setAttribute("aria-hidden", isLoading ? "false" : "true");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clearFieldErrors() {
  titleError.textContent = "";
  descriptionError.textContent = "";
  locationError.textContent = "";
  severityError.textContent = "";

  titleInput.classList.remove("input-error");
  descriptionInput.classList.remove("input-error");
  locationInput.classList.remove("input-error");
  severityInput.classList.remove("input-error");
}

function setFieldError(input, errorElement, text) {
  input.classList.add("input-error");
  errorElement.textContent = text;
}

function hasLetters(value) {
  return /[a-zA-Z]/.test(value);
}

function containsUnsafeInput(value) {
  const unsafePatterns = [
    /<[^>]+>/i,
    /\bjavascript\s*:/i,
    /\bon\w+\s*=/i,
    /(?:\bor\b|\band\b)\s+\d+\s*=\s*\d+/i
  ];

  return unsafePatterns.some((pattern) => pattern.test(value));
}

function isMostlyNumbers(value) {
  const cleaned = value.replace(/\s/g, "");
  return /^\d+$/.test(cleaned);
}

function looksLikeGibberish(value) {
  const cleaned = value.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length < 4) return false;

  const vowels = cleaned.match(/[aeiou]/g)?.length || 0;
  const vowelRatio = vowels / cleaned.length;
  const repeatedChars = /(.)\1\1/.test(cleaned);
  const longConsonantCluster = /[bcdfghjklmnpqrstvwxyz]{6,}/.test(cleaned);

  const commonBigrams = new Set([
    "th", "he", "in", "er", "an", "re", "on", "at", "en", "nd",
    "ti", "es", "or", "te", "of", "ed", "is", "it", "al", "ar",
    "st", "to", "nt", "ng", "se", "ha", "as", "ou", "io", "le",
    "ve", "co", "me", "de", "hi", "ri", "ro", "ic", "ne", "ea",
    "ra", "ce", "li", "ch", "ll", "be", "ma", "si", "om", "ur"
  ]);

  function isSuspiciousWord(word) {
    const token = word.toLowerCase().replace(/[^a-z]/g, "");
    if (token.length < 3) return false;

    const tokenVowels = token.match(/[aeiou]/g)?.length || 0;
    const tokenVowelRatio = tokenVowels / token.length;
    const noVowels = tokenVowels === 0;
    const tokenConsonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/.test(token);

    let bigramMatches = 0;
    for (let i = 0; i < token.length - 1; i += 1) {
      const bigram = token.slice(i, i + 2);
      if (commonBigrams.has(bigram)) {
        bigramMatches += 1;
      }
    }

    const bigramCount = Math.max(token.length - 1, 1);
    const bigramRatio = bigramMatches / bigramCount;
    const lowBigramQuality = token.length >= 7 && bigramRatio < 0.2;
    const lowVowelsForLongWord = token.length >= 7 && tokenVowelRatio < 0.25;

    return noVowels || tokenConsonantCluster || lowBigramQuality || lowVowelsForLongWord;
  }

  const wordTokens = value
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z]/g, ""))
    .filter((token) => token.length >= 3);

  const suspiciousWords = wordTokens.filter((token) => isSuspiciousWord(token)).length;
  const suspiciousWordRatio = wordTokens.length ? suspiciousWords / wordTokens.length : 0;

  return (
    vowelRatio < 0.2 ||
    repeatedChars ||
    longConsonantCluster ||
    suspiciousWordRatio >= 0.6
  );
}

function validateField(name, value) {
  const trimmed = value.trim();

  if (name === "title") {
    if (!trimmed) return "Title is required.";
    if (trimmed.length < 5) return "Title must be at least 5 characters.";
    if (trimmed.length > 120) return "Title cannot exceed 120 characters.";
    if (!hasLetters(trimmed)) return "Title must contain letters.";
    if (containsUnsafeInput(trimmed)) return "Title contains unsafe content.";
    if (looksLikeGibberish(trimmed)) return "Title looks invalid or unclear.";
  }

  if (name === "description") {
    if (!trimmed) return "Description is required.";
    if (trimmed.length < 12) return "Description must be at least 12 characters.";
    if (trimmed.length > 1200) return "Description cannot exceed 1200 characters.";
    if (trimmed.split(/\s+/).length < 3) return "Description should have at least 3 words.";
    if (!hasLetters(trimmed)) return "Description must contain readable text.";
    if (containsUnsafeInput(trimmed)) return "Description contains unsafe content.";
    if (looksLikeGibberish(trimmed)) return "Description looks invalid or unclear.";
  }

  if (name === "location") {
    if (!trimmed) return "Location is required.";
    if (trimmed.length < 2) return "Location must be at least 2 characters.";
    if (trimmed.length > 120) return "Location cannot exceed 120 characters.";
    if (isMostlyNumbers(trimmed)) return "Location cannot be only numbers.";
    if (containsUnsafeInput(trimmed)) return "Location contains unsafe content.";
    if (!/^[a-zA-Z\s,.'-]+$/.test(trimmed)) return "Location contains invalid characters.";
    if (!hasLetters(trimmed)) return "Location must contain letters.";
    if (looksLikeGibberish(trimmed)) return "Location looks invalid.";
  }

  if (name === "severity") {
    if (!["low", "medium", "high"].includes(value)) {
      return "Severity must be low, medium, or high.";
    }
  }

  return "";
}

function showSingleFieldError(name, errorText) {
  if (name === "title") setFieldError(titleInput, titleError, errorText);
  if (name === "description") setFieldError(descriptionInput, descriptionError, errorText);
  if (name === "location") setFieldError(locationInput, locationError, errorText);
  if (name === "severity") setFieldError(severityInput, severityError, errorText);
}

function attachLiveValidation(input, fieldName) {
  input.addEventListener("input", () => {
    const errorText = validateField(fieldName, input.value);

    if (fieldName === "title") {
      titleError.textContent = errorText;
      titleInput.classList.toggle("input-error", !!errorText);
    }

    if (fieldName === "description") {
      descriptionError.textContent = errorText;
      descriptionInput.classList.toggle("input-error", !!errorText);
    }

    if (fieldName === "location") {
      locationError.textContent = errorText;
      locationInput.classList.toggle("input-error", !!errorText);
    }
  });
}

function statusOptionsMarkup(currentStatus) {
  const statuses = ["new", "investigating", "resolved"];
  return statuses
    .map((status) => {
      const selected = currentStatus === status ? "selected" : "";
      return `<option value="${status}" ${selected}>${status}</option>`;
    })
    .join("");
}

function renderAlerts(alerts) {
  if (!alerts.length) {
    alertsList.innerHTML = `<p class="empty">No matching alerts found.</p>`;
    return;
  }

  alertsList.innerHTML = alerts
    .slice()
    .reverse()
    .map((alert) => `
      <article class="alert-card">
        <div class="card-top">
          <h3>${escapeHtml(alert.title)}</h3>
          <span class="status-chip status-${escapeHtml(alert.status || "new")}">${escapeHtml(alert.status || "new")}</span>
        </div>

        <p>${escapeHtml(alert.description)}</p>

        <div class="meta-grid">
          <span><strong>Location:</strong> ${escapeHtml(alert.location)}</span>
          <span><strong>Severity:</strong> ${escapeHtml(alert.severity)}</span>
          <span><strong>Category:</strong> ${escapeHtml(alert.category || alert.catagory || "Not analyzed yet")}</span>
          <span><strong>Analysis:</strong> ${escapeHtml(alert.analysisSource || "pending")}</span>
        </div>

        ${alert.summary ? `<p class="summary"><strong>Summary:</strong> ${escapeHtml(alert.summary)}</p>` : ""}

        ${
          Array.isArray(alert.checklist) && alert.checklist.length
            ? `<div><strong>Recommended Actions:</strong><ul>${alert.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`
            : ""
        }

        <div class="update-row">
          <label for="status-${escapeHtml(alert.id)}">Update status</label>
          <select id="status-${escapeHtml(alert.id)}" class="status-select" data-id="${escapeHtml(alert.id)}">
            ${statusOptionsMarkup(alert.status || "new")}
          </select>
          <button type="button" class="update-status-btn" data-id="${escapeHtml(alert.id)}">Save</button>
        </div>
      </article>
    `)
    .join("");
}

async function loadAlerts() {
  try {
    const params = new URLSearchParams();
    const searchValue = searchInput.value.trim();
    const severityValue = filterSeverity.value;
    const statusValue = filterStatus.value;

    if (searchValue) params.append("q", searchValue);
    if (severityValue) params.append("severity", severityValue);
    if (statusValue) params.append("status", statusValue);

    const url = params.toString() ? `/api/alerts?${params.toString()}` : "/api/alerts";
    const response = await fetch(url);
    const alerts = await response.json();

    renderAlerts(alerts);
  } catch (error) {
    alertsList.innerHTML = `<p class="empty">Failed to load alerts.</p>`;
  }
}

async function updateAlertStatus(id, status) {
  const response = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const result = await response.json();

  if (!response.ok) {
    const detail = result?.details?.status || result?.error || "Failed to update alert status.";
    throw new Error(detail);
  }

  return result;
}

attachLiveValidation(titleInput, "title");
attachLiveValidation(descriptionInput, "description");
attachLiveValidation(locationInput, "location");

severityInput.addEventListener("change", () => {
  const errorText = validateField("severity", severityInput.value);
  severityError.textContent = errorText;
  severityInput.classList.toggle("input-error", !!errorText);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (createAlertButton?.disabled) return;

  message.textContent = "";
  clearFieldErrors();

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    location: locationInput.value.trim(),
    severity: severityInput.value
  };

  const localErrors = {
    title: validateField("title", payload.title),
    description: validateField("description", payload.description),
    location: validateField("location", payload.location),
    severity: validateField("severity", payload.severity)
  };

  let hasErrors = false;

  for (const [field, errorText] of Object.entries(localErrors)) {
    if (errorText) {
      hasErrors = true;
      showSingleFieldError(field, errorText);
    }
  }

  if (hasErrors) {
    message.textContent = "Please fix the highlighted fields.";
    message.className = "message error";
    return;
  }

  try {
    setCreateLoading(true);

    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const details = result.details || {};
      for (const [field, errorText] of Object.entries(details)) {
        showSingleFieldError(field, errorText);
      }
      message.textContent = "Please fix the highlighted fields.";
      message.className = "message error";
      return;
    }

    message.textContent = "Alert created successfully.";
    message.className = "message success";
    form.reset();
    clearFieldErrors();
    severityInput.value = "medium";
    loadAlerts();
  } catch (error) {
    message.textContent = "Something went wrong while creating the alert.";
    message.className = "message error";
  } finally {
    setCreateLoading(false);
  }
});

alertsList.addEventListener("click", async (event) => {
  const button = event.target.closest(".update-status-btn");
  if (!button) return;

  const { id } = button.dataset;
  const select = document.getElementById(`status-${id}`);
  if (!select) return;

  try {
    button.disabled = true;
    await updateAlertStatus(id, select.value);
    message.textContent = "Alert status updated.";
    message.className = "message success";
    loadAlerts();
  } catch (error) {
    message.textContent = error.message;
    message.className = "message error";
  } finally {
    button.disabled = false;
  }
});

searchInput.addEventListener("input", loadAlerts);
filterSeverity.addEventListener("change", loadAlerts);
filterStatus.addEventListener("change", loadAlerts);

loadAlerts();
