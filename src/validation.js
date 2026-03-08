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
  
  export function validateAlertInput(data) {
    const errors = {};
  
    const title = data.title?.trim() || "";
    const description = data.description?.trim() || "";
    const location = data.location?.trim() || "";
    const severity = data.severity;
  
    if (!title) {
      errors.title = "Title is required.";
    } else if (title.length < 5) {
      errors.title = "Title must be at least 5 characters.";
    } else if (title.length > 120) {
      errors.title = "Title cannot exceed 120 characters.";
    } else if (!hasLetters(title)) {
      errors.title = "Title must contain letters.";
    } else if (containsUnsafeInput(title)) {
      errors.title = "Title contains unsafe content.";
    } else if (looksLikeGibberish(title)) {
      errors.title = "Title looks invalid or unclear.";
    }
  
    if (!description) {
      errors.description = "Description is required.";
    } else if (description.length < 12) {
      errors.description = "Description must be at least 12 characters.";
    } else if (description.length > 1200) {
      errors.description = "Description cannot exceed 1200 characters.";
    } else if (description.split(/\s+/).length < 3) {
      errors.description = "Description should have at least 3 words.";
    } else if (!hasLetters(description)) {
      errors.description = "Description must contain readable text.";
    } else if (containsUnsafeInput(description)) {
      errors.description = "Description contains unsafe content.";
    } else if (looksLikeGibberish(description)) {
      errors.description = "Description looks invalid or unclear.";
    }
  
    if (!location) {
      errors.location = "Location is required.";
    } else if (location.length < 2) {
      errors.location = "Location must be at least 2 characters.";
    } else if (location.length > 120) {
      errors.location = "Location cannot exceed 120 characters.";
    } else if (isMostlyNumbers(location)) {
      errors.location = "Location cannot be only numbers.";
    } else if (containsUnsafeInput(location)) {
      errors.location = "Location contains unsafe content.";
    } else if (!/^[a-zA-Z\s,.'-]+$/.test(location)) {
      errors.location = "Location contains invalid characters.";
    } else if (!hasLetters(location)) {
      errors.location = "Location must contain letters.";
    } else if (looksLikeGibberish(location)) {
      errors.location = "Location looks invalid.";
    }
  
    const allowedSeverities = ["low", "medium", "high"];
    if (!allowedSeverities.includes(severity)) {
      errors.severity = "Severity must be low, medium, or high.";
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  export function validateStatusUpdateInput(data) {
    const errors = {};
    const status = data.status?.trim?.() || "";
    const allowedStatuses = ["new", "investigating", "resolved"];

    if (!status) {
      errors.status = "Status is required.";
    } else if (!allowedStatuses.includes(status)) {
      errors.status = "Status must be new, investigating, or resolved.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
