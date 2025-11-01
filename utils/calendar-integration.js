/**
 * Calendar Integration Manager
 * 
 * Handles calendar-related features:
 * - Generate .ics files for follow-up meetings
 * - Format notes for calendar events
 * - Create shareable transcript links
 * - Integration with Smart Reminders
 * 
 * @module calendar-integration
 */

import { storageDB } from './storage.js';
import { scheduleRemindersForActionItem } from './reminder-manager.js';

// ============================================================================
// ICS FILE GENERATION
// ============================================================================

/**
 * Generate .ics file for follow-up meeting
 * @param {Object} meeting - Original meeting data
 * @param {Array} actionItems - Action items from meeting
 * @param {Object} options - Additional options
 * @returns {string} - ICS file content
 */
export function generateFollowUpICS(meeting, actionItems, options = {}) {
  console.log('[CalendarIntegration] Generating follow-up .ics file');
  
  // Calculate follow-up date (1 week out or before first deadline)
  const followUpDate = calculateFollowUpDate(meeting, actionItems);
  
  // Format attendees (if available)
  const attendees = options.attendees || [];
  
  // Generate unique UID
  const uid = generateUID();
  
  // Format action items for description
  const actionItemsText = formatActionItemsForICS(actionItems);
  
  // Get meeting title
  const originalTitle = meeting.title || 'Meeting';
  const followUpTitle = `Follow-up: ${originalTitle}`;
  
  // Generate VTIMEZONE for user's timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const vtimezone = generateVTIMEZONE(timezone);
  
  // Format dates for ICS (YYYYMMDDTHHMMSS format)
  const dtstart = formatICSDate(followUpDate);
  const dtstamp = formatICSDate(new Date());
  
  // Generate ICS content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MeetingMind//Calendar Integration//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:MeetingMind Follow-ups
X-WR-TIMEZONE:${timezone}
${vtimezone}
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=${timezone}:${dtstart}
DURATION:PT30M
SUMMARY:${escapeICSText(followUpTitle)}
DESCRIPTION:${escapeICSText(generateFollowUpDescription(meeting, actionItems))}
LOCATION:${escapeICSText(options.location || '')}
STATUS:TENTATIVE
SEQUENCE:0
CREATED:${dtstamp}
LAST-MODIFIED:${dtstamp}
${formatAttendeesForICS(attendees)}
${generateVALARM()}
END:VEVENT
END:VCALENDAR`;

  console.log('[CalendarIntegration] ICS file generated successfully');
  return icsContent;
}

/**
 * Calculate optimal follow-up date
 * Strategy: 1 week from meeting, or 2 days before earliest deadline
 */
function calculateFollowUpDate(meeting, actionItems) {
  const meetingDate = new Date(meeting.startTime);
  const oneWeekOut = new Date(meetingDate.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  // Find earliest deadline
  let earliestDeadline = null;
  for (const item of actionItems) {
    if (item.due && item.due !== 'Not specified' && item.due !== 'TBD') {
      const deadline = parseDeadlineToDate(item.due, meetingDate);
      if (deadline && (!earliestDeadline || deadline < earliestDeadline)) {
        earliestDeadline = deadline;
      }
    }
  }
  
  // If earliest deadline exists and is less than 1 week out, schedule 2 days before it
  if (earliestDeadline && earliestDeadline < oneWeekOut) {
    const twoDaysBefore = new Date(earliestDeadline.getTime() - (2 * 24 * 60 * 60 * 1000));
    // Make sure it's after the original meeting
    if (twoDaysBefore > meetingDate) {
      // Set to 10:00 AM
      twoDaysBefore.setHours(10, 0, 0, 0);
      return twoDaysBefore;
    }
  }
  
  // Default: 1 week out at 10:00 AM
  oneWeekOut.setHours(10, 0, 0, 0);
  return oneWeekOut;
}

/**
 * Parse deadline string to Date object
 */
function parseDeadlineToDate(dueString, referenceDate) {
  if (!dueString) return null;
  
  const now = new Date(referenceDate);
  const normalized = dueString.toLowerCase().trim();
  
  // Common patterns
  if (normalized.includes('today')) {
    const date = new Date(now);
    date.setHours(17, 0, 0, 0);
    return date;
  }
  
  if (normalized.includes('tomorrow')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(17, 0, 0, 0);
    return date;
  }
  
  if (normalized.includes('next week')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    date.setHours(17, 0, 0, 0);
    return date;
  }
  
  if (normalized.includes('friday')) {
    return getNextWeekday(now, 5);
  }
  
  if (normalized.includes('monday')) {
    return getNextWeekday(now, 1);
  }
  
  // Try parsing MM/DD or MM/DD/YY
  const dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? 
      (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : 
      now.getFullYear();
    return new Date(year, month, day, 17, 0, 0, 0);
  }
  
  return null;
}

function getNextWeekday(from, targetDay) {
  const result = new Date(from);
  const currentDay = result.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilTarget);
  result.setHours(17, 0, 0, 0);
  return result;
}

/**
 * Generate VTIMEZONE component for ICS file
 */
function generateVTIMEZONE(timezone) {
  // Simplified VTIMEZONE - most calendar apps handle TZID without full VTIMEZONE
  // For production, you'd want a full timezone database
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}${String(offsetMinutes).padStart(2, '0')}`;
  
  return `BEGIN:VTIMEZONE
TZID:${timezone}
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:${offsetString}
TZOFFSETTO:${offsetString}
END:STANDARD
END:VTIMEZONE`;
}

/**
 * Generate VALARM component for reminder
 */
function generateVALARM() {
  return `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Follow-up meeting reminder
TRIGGER:-PT15M
END:VALARM`;
}

/**
 * Format action items for ICS description
 */
function formatActionItemsForICS(actionItems) {
  if (!actionItems || actionItems.length === 0) {
    return 'No action items';
  }
  
  return actionItems.map((item, index) => {
    const who = item.who || item.assignee || 'Unassigned';
    const task = item.task || item.text || item;
    const due = item.due || '';
    
    let line = `${index + 1}. ${task} (${who})`;
    if (due && due !== 'Not specified') {
      line += ` - Due: ${due}`;
    }
    return line;
  }).join('\\n');
}

/**
 * Generate full description for follow-up meeting
 */
function generateFollowUpDescription(meeting, actionItems) {
  const originalDate = new Date(meeting.startTime).toLocaleDateString();
  const originalTitle = meeting.title || 'Meeting';
  
  let description = `Follow-up meeting for "${originalTitle}" (${originalDate})\\n\\n`;
  description += `ACTION ITEMS TO REVIEW:\\n`;
  description += formatActionItemsForICS(actionItems);
  description += `\\n\\nGenerated by MeetingMind`;
  
  return description;
}

/**
 * Format attendees for ICS
 */
function formatAttendeesForICS(attendees) {
  if (!attendees || attendees.length === 0) {
    return '';
  }
  
  return attendees.map(email => 
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`
  ).join('\n');
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSS)
 */
function formatICSDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escape text for ICS format (RFC 5545)
 */
function escapeICSText(text) {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\\\')   // Backslash
    .replace(/;/g, '\\;')     // Semicolon
    .replace(/,/g, '\\,')     // Comma
    .replace(/\n/g, '\\n')    // Newline
    .replace(/\r/g, '');      // Remove carriage return
}

/**
 * Generate unique UID for calendar event
 */
function generateUID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}@meetingmind.app`;
}

/**
 * Download ICS file
 */
export function downloadICSFile(icsContent, filename = 'follow-up-meeting.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('[CalendarIntegration] ICS file downloaded:', filename);
}

// ============================================================================
// CALENDAR NOTES FORMATTING
// ============================================================================

/**
 * Generate formatted notes for calendar event
 * @param {Object} meeting - Meeting data
 * @param {Array} transcripts - Transcript entries
 * @param {Object} summary - Meeting summary
 * @param {Array} actionItems - Action items
 * @returns {string} - Formatted notes
 */
export function generateCalendarNotes(meeting, transcripts, summary, actionItems) {
  console.log('[CalendarIntegration] Generating calendar notes');
  
  const meetingTitle = meeting.title || 'Meeting';
  const meetingDate = new Date(meeting.startTime).toLocaleString();
  const duration = meeting.endTime ? 
    Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000) : 
    'N/A';
  
  let notes = `📋 ${meetingTitle}\n`;
  notes += `📅 ${meetingDate}\n`;
  notes += `⏱️ Duration: ${duration} minutes\n`;
  notes += `\n`;
  
  // Add summary
  if (summary && summary.text) {
    notes += `📝 SUMMARY\n`;
    notes += `${summary.text}\n`;
    notes += `\n`;
  }
  
  // Add action items
  if (actionItems && actionItems.length > 0) {
    notes += `✅ ACTION ITEMS (${actionItems.length})\n`;
    actionItems.forEach((item, index) => {
      const who = item.who || item.assignee || 'Unassigned';
      const task = item.task || item.text || item;
      const due = item.due || 'Not specified';
      
      notes += `${index + 1}. ${task}\n`;
      notes += `   👤 ${who}`;
      if (due !== 'Not specified') {
        notes += ` | 📅 ${due}`;
      }
      notes += `\n`;
    });
    notes += `\n`;
  }
  
  // Add key moments
  if (summary && summary.keyMoments && summary.keyMoments.length > 0) {
    notes += `💡 KEY MOMENTS\n`;
    summary.keyMoments.forEach((moment, index) => {
      notes += `• ${moment}\n`;
    });
    notes += `\n`;
  }
  
  // Add Meeting IQ score if available
  if (meeting.meetingIQScore) {
    notes += `🎓 Meeting IQ Score: ${meeting.meetingIQScore}/100\n`;
    notes += `\n`;
  }
  
  notes += `Generated by MeetingMind`;
  
  return notes;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[CalendarIntegration] Text copied to clipboard');
    return true;
  } catch (error) {
    console.error('[CalendarIntegration] Failed to copy to clipboard:', error);
    
    // Fallback method
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('[CalendarIntegration] Text copied using fallback method');
      return true;
    } catch (fallbackError) {
      console.error('[CalendarIntegration] Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

// ============================================================================
// SHAREABLE TRANSCRIPT LINKS
// ============================================================================

/**
 * Create shareable transcript link
 * @param {Object} meeting - Meeting data
 * @param {Array} transcripts - Transcript entries
 * @param {Object} summary - Meeting summary
 * @param {Array} actionItems - Action items
 * @param {Object} meetingIQReport - Meeting IQ report
 * @returns {Object} - Shareable link data
 */
export async function createShareableLink(meeting, transcripts, summary, actionItems, meetingIQReport) {
  console.log('[CalendarIntegration] Creating shareable transcript link');
  
  // Generate unique ID
  const shareId = generateShareableID();
  
  // Calculate expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  // Create shareable data package
  const shareableData = {
    id: shareId,
    meetingId: meeting.id,
    title: meeting.title || 'Meeting',
    date: meeting.startTime,
    duration: meeting.endTime ? 
      Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000) : 
      null,
    
    // Transcript data
    transcripts: transcripts.map(t => ({
      timestamp: t.timestamp,
      text: t.text,
      speaker: t.speaker
    })),
    
    // Summary
    summary: summary ? {
      text: summary.text,
      keyMoments: summary.keyMoments || []
    } : null,
    
    // Action items (anonymize if needed)
    actionItems: actionItems.map(item => ({
      task: item.task || item.text || item,
      who: item.who || item.assignee || 'Unassigned',
      due: item.due || 'Not specified'
    })),
    
    // Meeting IQ score
    meetingIQ: meetingIQReport ? {
      score: meetingIQReport.finalScore || meetingIQReport.overallScore,
      rating: meetingIQReport.rating,
      highlights: meetingIQReport.highlights || []
    } : null,
    
    // Metadata
    createdAt: Date.now(),
    expiresAt: expiryDate.getTime(),
    accessCount: 0,
    status: 'active'
  };
  
  // Save to storage
  await storageDB.addSharedTranscript(shareableData);
  
  // Generate link
  const shareLink = `https://meetingmind.app/transcript/${shareId}`;
  
  console.log('[CalendarIntegration] Shareable link created:', shareLink);
  
  return {
    shareId,
    shareLink,
    expiryDate: expiryDate.toLocaleDateString(),
    data: shareableData
  };
}

/**
 * Generate unique shareable ID
 */
function generateShareableID() {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random1}-${random2}`;
}

/**
 * Get shareable transcript by ID
 */
export async function getSharedTranscript(shareId) {
  const shared = await storageDB.getSharedTranscript(shareId);
  
  if (!shared) {
    throw new Error('Shared transcript not found');
  }
  
  // Check if expired
  if (shared.expiresAt < Date.now()) {
    await storageDB.updateSharedTranscript(shareId, { status: 'expired' });
    throw new Error('Shared transcript has expired');
  }
  
  // Increment access count
  await storageDB.updateSharedTranscript(shareId, {
    accessCount: shared.accessCount + 1
  });
  
  return shared;
}

/**
 * Cleanup expired shared transcripts
 */
export async function cleanupExpiredShares() {
  console.log('[CalendarIntegration] Cleaning up expired shares...');
  
  const allShares = await storageDB.getAllSharedTranscripts();
  const now = Date.now();
  let cleaned = 0;
  
  for (const share of allShares) {
    if (share.expiresAt < now && share.status === 'active') {
      await storageDB.updateSharedTranscript(share.id, { status: 'expired' });
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[CalendarIntegration] Cleaned up ${cleaned} expired shares`);
  }
  
  return cleaned;
}

// ============================================================================
// SMART REMINDERS INTEGRATION
// ============================================================================

/**
 * Schedule reminders for follow-up meeting
 * Integrates with Smart Reminders system
 */
export async function scheduleFollowUpReminders(followUpDate, meeting, actionItems) {
  console.log('[CalendarIntegration] Scheduling reminders for follow-up meeting');
  
  try {
    // Create a synthetic "action item" for the follow-up meeting itself
    const followUpItem = {
      id: `followup_${meeting.id}_${Date.now()}`,
      task: `Attend follow-up meeting for "${meeting.title || 'Meeting'}"`,
      who: 'All attendees',
      due: followUpDate.toLocaleDateString(),
      meetingId: meeting.id,
      priority: 'high',
      status: 'pending',
      timestamp: new Date().toISOString(),
      isFollowUpMeeting: true
    };
    
    // Save to database
    await storageDB.saveActionItem(meeting.id, followUpItem);
    
    // Schedule reminders using Smart Reminders system
    const meetingStartTime = new Date(meeting.startTime).getTime();
    await scheduleRemindersForActionItem(followUpItem, meetingStartTime);
    
    console.log('[CalendarIntegration] Follow-up reminders scheduled successfully');
    
    return followUpItem;
    
  } catch (error) {
    console.error('[CalendarIntegration] Error scheduling follow-up reminders:', error);
    throw error;
  }
}

/**
 * Add calendar event reference to action item reminders
 * Enhances reminder notifications with calendar event info
 */
export function enhanceReminderWithCalendar(reminder, calendarEvent) {
  return {
    ...reminder,
    calendarEvent: {
      title: calendarEvent.title,
      date: calendarEvent.date,
      hasICS: true
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate filename for ICS file
 */
export function generateICSFilename(meeting) {
  const title = (meeting.title || 'Meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date(meeting.startTime).toISOString().split('T')[0];
  return `followup-${title}-${date}.ics`;
}

/**
 * Validate email address
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse attendees from string
 */
export function parseAttendees(attendeesString) {
  if (!attendeesString) return [];
  
  return attendeesString
    .split(/[,;\n]/)
    .map(email => email.trim())
    .filter(email => isValidEmail(email));
}

// Export for testing
export const _testUtils = {
  parseDeadlineToDate,
  calculateFollowUpDate,
  formatICSDate,
  escapeICSText
};
