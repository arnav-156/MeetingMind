/**
 * Meeting Types Configuration
 * 
 * Defines 8 core meeting types with:
 * - Custom scoring emphasis (weights per dimension)
 * - Success criteria
 * - Red flags to watch for
 * - Typical characteristics
 * 
 * This enables context-aware Meeting IQ scoring that adapts
 * based on what type of meeting you're in.
 */

export const MEETING_TYPES = {
  STANDUP: {
    id: 'STANDUP',
    name: 'Daily Standup / Status Update',
    icon: '☀️',
    description: 'Quick daily sync - everyone updates, identify blockers',
    typical_duration: 15,
    
    primary_goals: [
      'Quick updates from everyone',
      'Identify blockers',
      'Stay synchronized'
    ],
    
    // Custom scoring weights (must total 1.00)
    scoring_emphasis: {
      time_efficiency: 0.30,  // CRITICAL - must be fast
      participation: 0.25,    // Everyone speaks
      focus: 0.20,            // Stay on topic
      actions: 0.15,          // Identify blockers
      decisions: 0.05,        // Few decisions needed
      engagement: 0.05        // Less important
    },
    
    success_criteria: [
      'Meeting ends in ≤15 minutes',
      'All team members give update',
      'Blockers identified and noted',
      'No deep technical dives'
    ],
    
    red_flags: [
      'Running over 20 minutes',
      'Deep diving into solutions',
      'Not everyone has updated',
      'Long monologues (>2 min per person)'
    ],
    
    insights_templates: {
      excellent: 'Perfect standup! Quick, focused, everyone participated.',
      good: 'Good standup. Everyone updated and blockers identified.',
      needs_work: 'Consider tightening format - running a bit long.',
      poor: 'Standup losing effectiveness - too long or unfocused.'
    }
  },

  BRAINSTORM: {
    id: 'BRAINSTORM',
    name: 'Brainstorming / Ideation',
    icon: '💡',
    description: 'Creative ideation session - generate ideas, explore possibilities',
    typical_duration: 45,
    
    primary_goals: [
      'Generate many ideas',
      'Creative thinking',
      'Build on each other\'s ideas',
      'No judgment phase'
    ],
    
    scoring_emphasis: {
      engagement: 0.30,       // CRITICAL - high energy
      participation: 0.25,    // All voices matter
      focus: 0.10,            // Allow tangents! (lower weight)
      actions: 0.15,          // Capture ideas
      decisions: 0.10,        // Few decisions at this stage
      time_efficiency: 0.10   // Can run long
    },
    
    success_criteria: [
      'Generate ≥20 ideas',
      '80%+ of participants contribute ideas',
      'High energy and engagement',
      'All ideas documented',
      'Building on each other\'s ideas'
    ],
    
    red_flags: [
      'One person dominating',
      'Shooting down ideas too quickly',
      'Low participation (<50%)',
      'Too much criticism, not enough creation',
      'Energy dropping'
    ],
    
    insights_templates: {
      excellent: 'Fantastic creative energy! Great idea generation and building.',
      good: 'Solid brainstorm with good participation and ideas.',
      needs_work: 'Could use more energy - encourage wild ideas.',
      poor: 'Brainstorm falling flat - too much judgment, not enough ideation.'
    }
  },

  DECISION_MAKING: {
    id: 'DECISION_MAKING',
    name: 'Decision Meeting',
    icon: '⚖️',
    description: 'Make important decisions - evaluate options, choose direction',
    typical_duration: 30,
    
    primary_goals: [
      'Make clear decision',
      'Evaluate options',
      'Reach consensus or decide',
      'Document rationale'
    ],
    
    scoring_emphasis: {
      decisions: 0.35,        // CRITICAL - must decide
      focus: 0.25,            // Stay on decision at hand
      participation: 0.15,    // Key stakeholders speak
      actions: 0.15,          // Next steps post-decision
      time_efficiency: 0.05,
      engagement: 0.05
    },
    
    success_criteria: [
      'Clear decision made with owner',
      'Reasoning documented',
      'Agreement level recorded',
      'Next steps defined',
      'Decision timeboxed (<30 min)'
    ],
    
    red_flags: [
      'No decision after 30 minutes',
      'Circular arguments',
      'Key stakeholder missing or silent',
      'Reopening settled discussions',
      'Analysis paralysis'
    ],
    
    insights_templates: {
      excellent: 'Decisive! Clear choice made with good rationale.',
      good: 'Decision reached with stakeholder alignment.',
      needs_work: 'Taking too long to decide - consider voting or RACI.',
      poor: 'Meeting indecisive - need clearer decision process.'
    }
  },

  ONE_ON_ONE: {
    id: 'ONE_ON_ONE',
    name: '1:1 / Coaching Session',
    icon: '🤝',
    description: 'Personal development conversation - coaching, feedback, career growth',
    typical_duration: 30,
    
    primary_goals: [
      'Build relationship',
      'Career development',
      'Give/receive feedback',
      'Personal growth'
    ],
    
    scoring_emphasis: {
      engagement: 0.30,       // CRITICAL - deep conversation
      participation: 0.25,    // Balanced dialogue
      actions: 0.20,          // Development actions
      focus: 0.15,            // Can be organic
      decisions: 0.05,
      time_efficiency: 0.05
    },
    
    success_criteria: [
      'Roughly 50-50 talk time balance',
      'Meaningful, not surface-level conversation',
      '1-3 development action items',
      'Next meeting scheduled',
      'Trust and rapport evident'
    ],
    
    red_flags: [
      'Manager talking >70% of time',
      'No action items or growth plan',
      'Only surface-level topics',
      'Rushed conversation',
      'One-sided feedback'
    ],
    
    insights_templates: {
      excellent: 'Excellent 1:1! Deep conversation with balanced participation.',
      good: 'Good coaching session with actionable development items.',
      needs_work: 'Could go deeper - ask more open-ended questions.',
      poor: '1:1 too one-sided or surface-level - build more trust.'
    }
  },

  PLANNING: {
    id: 'PLANNING',
    name: 'Planning / Strategy Session',
    icon: '📅',
    description: 'Strategic planning - set goals, create roadmap, align on direction',
    typical_duration: 60,
    
    primary_goals: [
      'Set clear goals',
      'Create roadmap',
      'Align on strategy',
      'Define ownership'
    ],
    
    scoring_emphasis: {
      actions: 0.30,          // CRITICAL - concrete plan
      focus: 0.25,            // Stay strategic
      decisions: 0.20,        // Key choices
      participation: 0.15,    // Key voices
      engagement: 0.05,
      time_efficiency: 0.05
    },
    
    success_criteria: [
      'Clear objectives defined',
      'Milestones and timeline established',
      'Responsibilities assigned',
      'Team alignment achieved',
      'Success metrics identified'
    ],
    
    red_flags: [
      'No concrete outcomes',
      'Too tactical, not strategic',
      'No timeline defined',
      'Lack of ownership',
      'Scope creep or too broad'
    ],
    
    insights_templates: {
      excellent: 'Strategic and actionable! Clear plan with ownership.',
      good: 'Solid planning with goals and timeline established.',
      needs_work: 'Plan needs more specificity and clear owners.',
      poor: 'Planning session unfocused - missing concrete outcomes.'
    }
  },

  REVIEW: {
    id: 'REVIEW',
    name: 'Review / Demo / Presentation',
    icon: '📊',
    description: 'Share updates and get feedback - demos, presentations, reviews',
    typical_duration: 45,
    
    primary_goals: [
      'Share information clearly',
      'Get quality feedback',
      'Align stakeholders',
      'Answer questions'
    ],
    
    scoring_emphasis: {
      focus: 0.30,            // CRITICAL - clear message
      engagement: 0.25,       // Q&A quality
      actions: 0.20,          // Feedback captured
      time_efficiency: 0.15,  // Respect time
      participation: 0.05,    // Presenter leads
      decisions: 0.05
    },
    
    success_criteria: [
      'Clear message delivered',
      'Questions addressed thoroughly',
      'Feedback captured as actions',
      'Finished within allocated time',
      'Stakeholders aligned'
    ],
    
    red_flags: [
      'No time for Q&A',
      'Audience clearly disengaged',
      'Running significantly over time',
      'Unclear takeaways or next steps',
      'Too much detail / lost in weeds'
    ],
    
    insights_templates: {
      excellent: 'Excellent presentation! Clear, engaging, with good Q&A.',
      good: 'Good review with clear takeaways and feedback captured.',
      needs_work: 'Could improve clarity or allow more Q&A time.',
      poor: 'Review unfocused or disengaging - refine message.'
    }
  },

  PROBLEM_SOLVING: {
    id: 'PROBLEM_SOLVING',
    name: 'Problem Solving / Troubleshooting',
    icon: '🔧',
    description: 'Fix issues and find solutions - troubleshooting, debugging, resolution',
    typical_duration: 45,
    
    primary_goals: [
      'Diagnose root cause',
      'Find solution',
      'Assign ownership',
      'Set timeline'
    ],
    
    scoring_emphasis: {
      decisions: 0.30,        // CRITICAL - decide on solution
      actions: 0.30,          // Who fixes what
      focus: 0.20,            // Stay on problem
      engagement: 0.10,
      participation: 0.05,
      time_efficiency: 0.05
    },
    
    success_criteria: [
      'Root cause identified',
      'Solution agreed upon',
      'Owner assigned to fix',
      'Timeline/deadline set',
      'Prevention discussed'
    ],
    
    red_flags: [
      'No root cause analysis',
      'No owner assigned',
      'Blaming instead of solving',
      'No timeline for fix',
      'Missing key technical people'
    ],
    
    insights_templates: {
      excellent: 'Problem solved! Clear diagnosis, solution, and owner.',
      good: 'Good troubleshooting with action plan established.',
      needs_work: 'Need clearer ownership or more specific solution.',
      poor: 'Problem-solving stalled - need structure or expertise.'
    }
  },

  CLIENT_MEETING: {
    id: 'CLIENT_MEETING',
    name: 'Client / External Meeting',
    icon: '🤝',
    description: 'External stakeholder meeting - clients, customers, partners',
    typical_duration: 60,
    
    primary_goals: [
      'Build relationship',
      'Understand client needs',
      'Deliver value',
      'Establish trust'
    ],
    
    scoring_emphasis: {
      engagement: 0.30,       // CRITICAL - client experience
      focus: 0.25,            // Address their needs
      actions: 0.20,          // Clear next steps
      time_efficiency: 0.15,  // Respect their time
      participation: 0.05,    // Client should talk most
      decisions: 0.05
    },
    
    success_criteria: [
      'Client speaks >50% of time',
      'Delivered insights or solutions',
      'Clear follow-up plan established',
      'Positive interaction',
      'Value demonstrated'
    ],
    
    red_flags: [
      'Internal team talking too much',
      'Not listening to client',
      'No clear next steps',
      'Unprepared team',
      'Client disengagement signals'
    ],
    
    insights_templates: {
      excellent: 'Outstanding client meeting! Great listening and value delivery.',
      good: 'Positive client interaction with clear next steps.',
      needs_work: 'Let client talk more - focus on listening and understanding.',
      poor: 'Client meeting at risk - improve preparation and listening.'
    }
  },

  GENERAL: {
    id: 'GENERAL',
    name: 'General Meeting',
    icon: '📋',
    description: 'Standard meeting - balanced scoring across all dimensions',
    typical_duration: 30,
    
    primary_goals: [
      'Achieve meeting objective',
      'Good participation',
      'Clear outcomes'
    ],
    
    // Balanced scoring (original weights)
    scoring_emphasis: {
      participation: 0.20,
      focus: 0.25,
      actions: 0.20,
      decisions: 0.15,
      engagement: 0.15,
      time_efficiency: 0.05
    },
    
    success_criteria: [
      'Clear objective achieved',
      'Good participation',
      'Action items defined',
      'Respectful of time'
    ],
    
    red_flags: [
      'Unclear purpose',
      'Low engagement',
      'No outcomes',
      'Running significantly over'
    ],
    
    insights_templates: {
      excellent: 'Excellent meeting! Well-run with clear outcomes.',
      good: 'Good meeting with solid participation and results.',
      needs_work: 'Could improve focus or time management.',
      poor: 'Meeting needs better structure or clearer purpose.'
    }
  }
};

/**
 * Get meeting type configuration by ID
 */
export function getMeetingType(typeId) {
  return MEETING_TYPES[typeId] || MEETING_TYPES.GENERAL;
}

/**
 * Get all meeting type options for UI dropdown
 */
export function getAllMeetingTypes() {
  return Object.values(MEETING_TYPES);
}

/**
 * Get display name for meeting type
 */
export function getMeetingTypeName(typeId) {
  const type = getMeetingType(typeId);
  return `${type.icon} ${type.name}`;
}

/**
 * Detect meeting type from title (basic pattern matching)
 * Returns typeId or null if no match
 */
export function detectMeetingTypeFromTitle(title) {
  if (!title) return null;
  
  const lowerTitle = title.toLowerCase();
  
  // Pattern matching for common meeting types
  const patterns = {
    STANDUP: ['standup', 'stand up', 'daily sync', 'daily scrum', 'morning sync', 'status update'],
    BRAINSTORM: ['brainstorm', 'ideation', 'idea', 'creative', 'innovation'],
    DECISION_MAKING: ['decision', 'decide', 'approval', 'vote', 'choose'],
    ONE_ON_ONE: ['1:1', '1-1', 'one on one', 'one-on-one', 'check-in', 'catch up'],
    PLANNING: ['planning', 'roadmap', 'strategy', 'quarterly', 'sprint planning', 'okr'],
    REVIEW: ['review', 'demo', 'presentation', 'showcase', 'sprint review'],
    PROBLEM_SOLVING: ['bug', 'issue', 'problem', 'incident', 'troubleshoot', 'debug'],
    CLIENT_MEETING: ['client', 'customer', 'partner', 'vendor', 'external']
  };
  
  // Check each pattern
  for (const [typeId, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return typeId;
    }
  }
  
  return null;
}

/**
 * Get contextual insight based on score and meeting type
 */
export function getContextualInsight(typeId, score) {
  const type = getMeetingType(typeId);
  
  if (score >= 81) {
    return type.insights_templates.excellent;
  } else if (score >= 61) {
    return type.insights_templates.good;
  } else if (score >= 41) {
    return type.insights_templates.needs_work;
  } else {
    return type.insights_templates.poor;
  }
}

/**
 * Get scoring weights for a meeting type
 */
export function getScoringWeights(typeId) {
  const type = getMeetingType(typeId);
  return type.scoring_emphasis;
}

/**
 * Check if meeting type is valid
 */
export function isValidMeetingType(typeId) {
  return typeId in MEETING_TYPES;
}
