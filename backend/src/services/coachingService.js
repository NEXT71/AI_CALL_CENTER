const logger = require('../config/logger');

/**
 * Generate AI Coaching Recommendations for a call
 * Analyzes transcript, quality metrics, compliance, sentiment, and AI factors
 * to provide actionable coaching feedback
 */
exports.generateCoachingRecommendations = (call) => {
  try {
    logger.info('Generating coaching recommendations', { callId: call.callId });
    
    const strengths = [];
    const improvementAreas = [];
    const recommendations = [];
    const trainingTags = [];
    
    // ==================== ANALYZE STRENGTHS ====================
    
    // AI Quality Factors Analysis
    if (call.qualityMetrics?.aiFactors) {
      const factors = call.qualityMetrics.aiFactors;
      
      // Customer Tone (max 25 pts)
      if (factors.customer_tone_score >= 20) {
        strengths.push('Maintained positive customer satisfaction throughout the call');
        trainingTags.push('Customer Satisfaction');
      }
      
      // Language Selection (max 10 pts)
      if (factors.language_score >= 8) {
        const lang = call.qualityMetrics.aiDetails?.detected_language || 'preferred';
        strengths.push(`Correctly handled ${lang} language customer interaction`);
      }
      
      // Agent Professionalism (max 25 pts)
      if (factors.agent_professionalism_score >= 20) {
        strengths.push('Demonstrated professional communication with appropriate language');
        trainingTags.push('Professionalism');
      }
      
      // Customer Communication (max 20 pts)
      if (factors.customer_communication_score >= 16) {
        strengths.push('Successfully managed customer communication style');
      }
      
      // No Penalties
      if (!factors.abusive_language_penalty && !factors.dnc_penalty) {
        strengths.push('Maintained compliance with zero critical violations');
        trainingTags.push('Compliance Excellence');
      }
    }
    
    // Traditional Quality Metrics
    if (call.qualityMetrics?.hasGreeting) {
      strengths.push('Opened call with proper greeting');
      trainingTags.push('Call Etiquette');
    }
    
    if (call.qualityMetrics?.hasProperClosing) {
      strengths.push('Closed call professionally');
    }
    
    // Compliance
    if (call.complianceScore >= 90) {
      strengths.push('Excellent compliance adherence with all mandatory phrases');
      trainingTags.push('Compliance');
    }
    
    // Sentiment
    if (call.agentSentiment === 'positive') {
      strengths.push('Maintained positive and engaging tone');
      trainingTags.push('Tone & Empathy');
    }
    
    if (call.customerSentiment === 'positive') {
      strengths.push('Customer left the call satisfied');
    }
    
    // Talk Time Balance
    if (call.qualityMetrics?.talkTimeBalance === 'balanced') {
      strengths.push('Maintained balanced conversation with appropriate talk time');
      trainingTags.push('Active Listening');
    }
    
    // Speech Rate
    if (call.qualityMetrics?.avgSpeechRate >= 120 && call.qualityMetrics?.avgSpeechRate <= 150) {
      strengths.push('Spoke at ideal pace for customer comprehension');
    }
    
    // Overall Quality
    if (call.qualityScore >= 90) {
      strengths.push('Achieved excellent overall quality score');
    }
    
    // ==================== IDENTIFY IMPROVEMENT AREAS ====================
    
    // AI Factors - Issues
    if (call.qualityMetrics?.aiFactors) {
      const factors = call.qualityMetrics.aiFactors;
      const details = call.qualityMetrics.aiDetails || {};
      const flags = call.qualityMetrics.aiFlags || {};
      
      // Customer Tone Issues
      if (factors.customer_tone_score < 15) {
        improvementAreas.push('Customer ended call frustrated or dissatisfied');
        trainingTags.push('Customer Satisfaction');
        recommendations.push({
          category: 'Customer Satisfaction',
          issue: flags.customer_frustrated ? 'Customer expressed frustration' : 'Customer tone was negative',
          suggestion: 'Focus on empathy and active listening. Acknowledge customer concerns before offering solutions.',
          suggestedScript: "I understand your frustration, and I apologize for the inconvenience. Let me help you resolve this right away.",
          priority: 'High',
        });
      }
      
      // Agent Professionalism Issues
      if (factors.agent_professionalism_score < 15) {
        improvementAreas.push('Used casual or unprofessional language');
        trainingTags.push('Professionalism');
        
        const casualPhrases = details.agent_casual_phrases || [];
        recommendations.push({
          category: 'Professionalism',
          issue: `Detected casual language: ${casualPhrases.slice(0, 3).join(', ')}`,
          suggestion: 'Replace casual phrases with professional alternatives to maintain credibility.',
          suggestedScript: 'Instead of "yeah", use "yes" or "certainly". Instead of "gonna", use "going to".',
          priority: 'Medium',
        });
      }
      
      // Customer Communication Issues
      if (factors.customer_communication_score < 12) {
        improvementAreas.push('Customer displayed aggressive or difficult communication style');
        trainingTags.push('De-escalation');
        recommendations.push({
          category: 'De-escalation',
          issue: 'Customer showed aggressive communication patterns',
          suggestion: 'Use de-escalation techniques: stay calm, lower your voice slightly, and use empathetic phrases.',
          suggestedScript: "I completely understand why you feel that way. Let me work with you to find the best solution.",
          priority: 'High',
        });
      }
      
      // Abusive Language
      if (factors.abusive_language_penalty < 0) {
        improvementAreas.push('Detected inappropriate language during call');
        trainingTags.push('Professionalism');
        trainingTags.push('Compliance');
        
        const abusiveWords = details.abusive_words_found || [];
        recommendations.push({
          category: 'Critical Compliance',
          issue: `Profanity detected: ${abusiveWords.slice(0, 3).join(', ')}`,
          suggestion: 'NEVER use profanity or inappropriate language, even if the customer does. Maintain professionalism at all times.',
          suggestedScript: "I understand this is frustrating. Let's focus on resolving this issue together.",
          priority: 'High',
        });
      }
      
      // DNC Request
      if (factors.dnc_penalty < 0) {
        improvementAreas.push('Customer requested to be placed on Do Not Call list');
        trainingTags.push('Compliance');
        trainingTags.push('DNC Compliance');
        
        recommendations.push({
          category: 'Critical Compliance',
          issue: 'Customer requested Do Not Call',
          suggestion: 'Immediately honor DNC requests. Confirm the request verbally and ensure proper documentation.',
          suggestedScript: "I understand you'd like to be placed on our Do Not Call list. I'll process that request right away and confirm your phone number.",
          priority: 'High',
        });
      }
    }
    
    // Traditional Metric Issues
    if (!call.qualityMetrics?.hasGreeting) {
      improvementAreas.push('Missing proper call opening/greeting');
      trainingTags.push('Call Etiquette');
      recommendations.push({
        category: 'Call Opening',
        issue: 'No greeting detected at call start',
        suggestion: 'Always open with a warm, professional greeting including your name and company.',
        suggestedScript: "Hello! Thank you for calling [Company Name]. My name is [Your Name]. How may I help you today?",
        priority: 'Medium',
      });
    }
    
    if (!call.qualityMetrics?.hasProperClosing) {
      improvementAreas.push('Missing professional call closing');
      trainingTags.push('Call Etiquette');
      recommendations.push({
        category: 'Call Closing',
        issue: 'No proper closing detected',
        suggestion: 'End every call by confirming resolution, asking if there\'s anything else, and thanking the customer.',
        suggestedScript: "Is there anything else I can help you with today? Thank you for calling, and have a great day!",
        priority: 'Medium',
      });
    }
    
    // Compliance Issues
    if (call.missingMandatoryPhrases && call.missingMandatoryPhrases.length > 0) {
      improvementAreas.push(`Missing ${call.missingMandatoryPhrases.length} required compliance phrase(s)`);
      trainingTags.push('Compliance');
      
      call.missingMandatoryPhrases.slice(0, 3).forEach(phrase => {
        recommendations.push({
          category: 'Compliance',
          issue: `Missing mandatory phrase: "${phrase}"`,
          suggestion: 'This phrase must be included in every call for legal/regulatory compliance.',
          suggestedScript: phrase,
          priority: 'High',
        });
      });
    }
    
    if (call.detectedForbiddenPhrases && call.detectedForbiddenPhrases.length > 0) {
      improvementAreas.push('Used forbidden or prohibited language');
      trainingTags.push('Compliance');
      
      recommendations.push({
        category: 'Critical Compliance',
        issue: `Forbidden phrases detected: ${call.detectedForbiddenPhrases.slice(0, 3).join(', ')}`,
        suggestion: 'These phrases violate compliance rules and must never be used.',
        suggestedScript: 'Review the compliance manual for approved alternative phrases.',
        priority: 'High',
      });
    }
    
    // Sentiment Issues
    if (call.sentiment === 'negative' || call.customerSentiment === 'negative') {
      improvementAreas.push('Overall call sentiment was negative');
      trainingTags.push('Customer Satisfaction');
      
      if (!recommendations.find(r => r.category === 'Customer Satisfaction')) {
        recommendations.push({
          category: 'Customer Satisfaction',
          issue: 'Call ended with negative sentiment',
          suggestion: 'Focus on building rapport, showing empathy, and ensuring the customer feels heard and valued.',
          suggestedScript: "I really appreciate your patience. Let me make sure we get this resolved to your satisfaction.",
          priority: 'High',
        });
      }
    }
    
    // Agent Sentiment
    if (call.agentSentiment === 'negative') {
      improvementAreas.push('Agent tone came across as negative or disengaged');
      trainingTags.push('Tone & Empathy');
      recommendations.push({
        category: 'Agent Tone',
        issue: 'Negative or monotone delivery detected',
        suggestion: 'Smile while speaking (it changes your voice!), use a warm tone, and show genuine interest in helping.',
        suggestedScript: 'Practice vocal variety and enthusiasm in your delivery.',
        priority: 'Medium',
      });
    }
    
    // Interruptions
    if (call.qualityMetrics?.agentInterruptionCount > 3) {
      improvementAreas.push('Frequently interrupted the customer');
      trainingTags.push('Active Listening');
      recommendations.push({
        category: 'Active Listening',
        issue: `${call.qualityMetrics.agentInterruptionCount} interruptions detected`,
        suggestion: 'Let customers finish speaking before responding. Use brief acknowledgments like "I see" instead of interrupting.',
        suggestedScript: "I understand. Please go on... [pause to let customer speak]",
        priority: 'Medium',
      });
    }
    
    // Talk Time Imbalance
    if (call.qualityMetrics?.talkTimeBalance === 'agent_too_quiet') {
      improvementAreas.push('Agent spoke too little - may indicate lack of engagement');
      trainingTags.push('Engagement');
      recommendations.push({
        category: 'Engagement',
        issue: 'Low agent talk time',
        suggestion: 'Be more proactive in the conversation. Ask clarifying questions, provide explanations, and guide the conversation.',
        suggestedScript: "Let me explain how we can help... Can you tell me more about... Here's what I recommend...",
        priority: 'Medium',
      });
    }
    
    if (call.qualityMetrics?.talkTimeBalance === 'agent_dominates') {
      improvementAreas.push('Agent spoke too much - may have dominated conversation');
      trainingTags.push('Active Listening');
      recommendations.push({
        category: 'Active Listening',
        issue: 'Excessive agent talk time',
        suggestion: 'Balance speaking with listening. Ask open-ended questions and allow customer to express their needs.',
        suggestedScript: "What are your thoughts on this? How does that sound to you?",
        priority: 'Medium',
      });
    }
    
    // Speech Rate Issues
    if (call.qualityMetrics?.avgSpeechRate < 100) {
      improvementAreas.push('Spoke too slowly - may lose customer engagement');
      trainingTags.push('Communication Skills');
      recommendations.push({
        category: 'Communication Skills',
        issue: 'Speech rate too slow',
        suggestion: 'Pick up the pace slightly to maintain customer engagement and efficiency.',
        suggestedScript: 'Practice speaking at 120-150 words per minute.',
        priority: 'Low',
      });
    }
    
    if (call.qualityMetrics?.avgSpeechRate > 180) {
      improvementAreas.push('Spoke too quickly - customer may struggle to follow');
      trainingTags.push('Communication Skills');
      recommendations.push({
        category: 'Communication Skills',
        issue: 'Speech rate too fast',
        suggestion: 'Slow down to ensure customer comprehension. Pause between key points.',
        suggestedScript: 'Practice speaking at 120-150 words per minute with clear pauses.',
        priority: 'Low',
      });
    }
    
    // Dead Air
    if (call.deadAirTotal > 30) {
      improvementAreas.push('Excessive silence/dead air detected');
      trainingTags.push('Engagement');
      recommendations.push({
        category: 'Engagement',
        issue: `${Math.round(call.deadAirTotal)} seconds of dead air`,
        suggestion: 'Keep customer informed during hold times or when looking up information.',
        suggestedScript: "I'm checking that for you now... Thank you for your patience while I pull up your account...",
        priority: 'Medium',
      });
    }
    
    // Overall Quality Score
    if (call.qualityScore < 70) {
      improvementAreas.push('Overall quality score below target');
      trainingTags.push('General Training');
    }
    
    // Compliance Score
    if (call.complianceScore < 80) {
      improvementAreas.push('Compliance score needs improvement');
      trainingTags.push('Compliance');
    }
    
    // ==================== DETERMINE PRIORITY ====================
    
    let priorityScore = 'Low';
    const criticalIssues = recommendations.filter(r => r.priority === 'High').length;
    
    if (criticalIssues >= 3 || call.qualityScore < 50 || call.complianceScore < 60) {
      priorityScore = 'High';
    } else if (criticalIssues >= 1 || call.qualityScore < 70 || call.complianceScore < 80) {
      priorityScore = 'Medium';
    }
    
    // ==================== BUILD COACHING OBJECT ====================
    
    const coaching = {
      strengths: strengths.length > 0 ? strengths : ['Call was processed successfully'],
      improvementAreas: improvementAreas.length > 0 ? improvementAreas : ['Continue maintaining current performance standards'],
      recommendations: recommendations,
      trainingTags: [...new Set(trainingTags)], // Remove duplicates
      priorityScore: priorityScore,
      managerNotes: '',
      generatedAt: new Date(),
      lastModified: new Date(),
    };
    
    logger.info('Coaching recommendations generated successfully', {
      callId: call.callId,
      strengthsCount: coaching.strengths.length,
      improvementAreasCount: coaching.improvementAreas.length,
      recommendationsCount: coaching.recommendations.length,
      priorityScore: coaching.priorityScore,
    });
    
    return coaching;
    
  } catch (error) {
    logger.error('Error generating coaching recommendations', {
      error: error.message,
      callId: call.callId,
    });
    throw error;
  }
};

/**
 * Update manager notes for a coaching recommendation
 */
exports.updateManagerNotes = (coaching, notes) => {
  coaching.managerNotes = notes;
  coaching.lastModified = new Date();
  return coaching;
};

/**
 * Calculate coaching statistics for a set of calls
 */
exports.getCoachingStats = (calls) => {
  const stats = {
    totalCalls: calls.length,
    callsWithCoaching: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    topTrainingNeeds: {},
    commonIssues: {},
  };
  
  calls.forEach(call => {
    if (call.coaching) {
      stats.callsWithCoaching++;
      
      // Priority breakdown
      if (call.coaching.priorityScore === 'High') stats.highPriority++;
      else if (call.coaching.priorityScore === 'Medium') stats.mediumPriority++;
      else stats.lowPriority++;
      
      // Training tags frequency
      (call.coaching.trainingTags || []).forEach(tag => {
        stats.topTrainingNeeds[tag] = (stats.topTrainingNeeds[tag] || 0) + 1;
      });
      
      // Common issues
      (call.coaching.improvementAreas || []).forEach(area => {
        stats.commonIssues[area] = (stats.commonIssues[area] || 0) + 1;
      });
    }
  });
  
  // Sort by frequency
  stats.topTrainingNeeds = Object.entries(stats.topTrainingNeeds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  stats.commonIssues = Object.entries(stats.commonIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  return stats;
};
