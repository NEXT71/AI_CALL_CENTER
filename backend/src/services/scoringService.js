const ComplianceRule = require('../models/ComplianceRule');
const logger = require('../config/logger');

/**
 * Check compliance against rules
 */
exports.checkCompliance = async (transcript, campaign) => {
  try {
    // Get all active rules for this campaign
    const [mandatoryRules, forbiddenRules] = await Promise.all([
      ComplianceRule.find({ campaign, ruleType: 'mandatory', isActive: true }),
      ComplianceRule.find({ campaign, ruleType: 'forbidden', isActive: true }),
    ]);

    const transcriptLower = transcript.toLowerCase();

    // Check mandatory phrases
    const missingMandatory = [];
    let mandatoryScore = 0;
    let totalMandatoryWeight = 0;

    for (const rule of mandatoryRules) {
      totalMandatoryWeight += rule.weight;
      const isPresent = checkPhrasePresence(transcriptLower, rule.phrase, rule.fuzzyTolerance);
      
      if (isPresent) {
        mandatoryScore += rule.weight;
      } else {
        missingMandatory.push(rule.phrase);
      }
    }

    // Check forbidden phrases
    const detectedForbidden = [];
    let forbiddenPenalty = 0;

    for (const rule of forbiddenRules) {
      const isPresent = checkPhrasePresence(transcriptLower, rule.phrase, rule.fuzzyTolerance);
      
      if (isPresent) {
        detectedForbidden.push(rule.phrase);
        forbiddenPenalty += rule.weight * 10; // Heavy penalty for violations
      }
    }

    // Calculate compliance score (0-100)
    let score = 0;
    
    if (totalMandatoryWeight > 0) {
      score = (mandatoryScore / totalMandatoryWeight) * 100;
    } else {
      score = 100; // No mandatory rules = full score
    }

    // Apply penalty for forbidden phrases
    score = Math.max(0, score - forbiddenPenalty);

    return {
      score: Math.round(score),
      missingMandatory,
      detectedForbidden,
      details: {
        mandatoryChecked: mandatoryRules.length,
        mandatoryMissed: missingMandatory.length,
        forbiddenDetected: detectedForbidden.length,
      },
    };
  } catch (error) {
    logger.error('Compliance check error', { error: error.message });
    throw error;
  }
};

/**
 * Calculate quality score based on various metrics (AGENT-FOCUSED)
 */
exports.calculateQualityScore = (data) => {
  const { transcript, sentiment, complianceScore, duration, talkTimeRatio, deadAirTotal } = data;
  
  const transcriptLower = transcript.toLowerCase();
  
  // Initialize score
  let score = 0;
  const metrics = {
    hasGreeting: false,
    hasProperClosing: false,
    complianceLinesSpoken: false,
    agentInterruptionCount: 0,
    avgSpeechRate: 0,
    talkTimeBalance: 'unknown',
    deadAirPenalty: 0,
  };

  // 1. Check for greeting (10 points)
  const greetingPhrases = [
    'hello', 'hi', 'good morning', 'good afternoon', 'good evening',
    'thank you for calling', 'welcome', 'how may i help',
  ];
  
  if (greetingPhrases.some(phrase => transcriptLower.includes(phrase))) {
    metrics.hasGreeting = true;
    score += 10;
  }

  // 2. Check for proper closing (10 points)
  const closingPhrases = [
    'thank you', 'have a great day', 'have a nice day', 'goodbye',
    'take care', 'is there anything else', 'glad i could help',
  ];
  
  if (closingPhrases.some(phrase => transcriptLower.includes(phrase))) {
    metrics.hasProperClosing = true;
    score += 10;
  }

  // 3. Compliance contribution (30 points)
  if (complianceScore >= 90) {
    score += 30;
    metrics.complianceLinesSpoken = true;
  } else if (complianceScore >= 70) {
    score += 20;
  } else if (complianceScore >= 50) {
    score += 10;
  }

  // 4. Agent sentiment score (20 points) - AGENT-SPECIFIC
  if (sentiment === 'positive') {
    score += 20;
  } else if (sentiment === 'neutral') {
    score += 10;
  } else {
    score += 0; // Negative sentiment = no points
  }

  // 5. Call duration appropriateness (10 points)
  // Assuming ideal call duration is 3-10 minutes (180-600 seconds)
  if (duration >= 180 && duration <= 600) {
    score += 10;
  } else if (duration > 60 && duration < 900) {
    score += 5;
  }

  // 6. Professional language check (10 points)
  const professionalIndicators = [
    'understand', 'assist', 'help', 'certainly', 'appreciate',
    'apologize', 'sorry', 'please', 'definitely',
  ];
  
  const professionalCount = professionalIndicators.filter(word => 
    transcriptLower.includes(word)
  ).length;

  if (professionalCount >= 3) {
    score += 10;
  } else if (professionalCount >= 1) {
    score += 5;
  }

  // 7. Detect agent interruptions (penalty)
  const interruptionMarkers = transcript.match(/--/g) || [];
  metrics.agentInterruptionCount = interruptionMarkers.length;
  
  if (metrics.agentInterruptionCount > 5) {
    score -= 15;
  } else if (metrics.agentInterruptionCount > 3) {
    score -= 10;
  } else if (metrics.agentInterruptionCount > 1) {
    score -= 5;
  }

  // 8. Speech rate estimation (10 points)
  const wordCount = transcript.split(/\s+/).length;
  const minutes = duration / 60;
  metrics.avgSpeechRate = minutes > 0 ? Math.round(wordCount / minutes) : 0;

  // Ideal speech rate: 120-150 words per minute
  if (metrics.avgSpeechRate >= 120 && metrics.avgSpeechRate <= 150) {
    score += 10;
  } else if (metrics.avgSpeechRate >= 100 && metrics.avgSpeechRate <= 180) {
    score += 5;
  }

  // 9. Talk-time ratio balance (NEW - 10 points bonus/penalty)
  if (talkTimeRatio && talkTimeRatio !== 'N/A') {
    const ratio = parseFloat(talkTimeRatio.split(':')[0]);
    
    // Ideal agent:customer ratio is 0.6:1 to 1.2:1 (agent speaks 60%-120% of customer)
    if (ratio >= 0.6 && ratio <= 1.2) {
      score += 10;
      metrics.talkTimeBalance = 'balanced';
    } else if (ratio < 0.3) {
      score -= 10; // Agent spoke too little
      metrics.talkTimeBalance = 'agent_too_quiet';
    } else if (ratio > 2.0) {
      score -= 10; // Agent spoke too much
      metrics.talkTimeBalance = 'agent_dominates';
    } else {
      score += 5;
      metrics.talkTimeBalance = 'acceptable';
    }
  }

  // 10. Dead air penalty (NEW)
  if (deadAirTotal) {
    const deadAirPercentage = (deadAirTotal / duration) * 100;
    
    if (deadAirPercentage > 15) {
      metrics.deadAirPenalty = 15;
      score -= 15;
    } else if (deadAirPercentage > 10) {
      metrics.deadAirPenalty = 10;
      score -= 10;
    } else if (deadAirPercentage > 5) {
      metrics.deadAirPenalty = 5;
      score -= 5;
    }
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    metrics,
  };
};

/**
 * Helper function to check phrase presence with fuzzy matching
 */
function checkPhrasePresence(text, phrase, tolerance = 0) {
  const phraseLower = phrase.toLowerCase();
  
  if (tolerance === 0) {
    // Exact match
    return text.includes(phraseLower);
  }
  
  // Simple fuzzy matching using word proximity
  const phraseWords = phraseLower.split(/\s+/);
  const textWords = text.split(/\s+/);
  
  // Check if all words from phrase appear within a window
  let foundWords = 0;
  for (const phraseWord of phraseWords) {
    if (textWords.some(textWord => {
      return textWord === phraseWord || 
             (levenshteinDistance(textWord, phraseWord) <= tolerance);
    })) {
      foundWords++;
    }
  }
  
  // Consider it a match if most words are found
  return foundWords >= phraseWords.length * 0.7;
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
