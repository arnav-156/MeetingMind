/**
 * Smart Reminder Manager
 * 
 * Manages action item reminders using chrome.alarms and chrome.notifications
 * Features:
 * - 24-hour before deadline reminders
 * - Day-after meeting follow-ups
 * - Weekly digest of open items
 * - Timezone-aware scheduling
 * - Do Not Disturb hours
 * - Max 3 reminders per item
 * - Snooze functionality
 * 
 * @module reminder-manager
 */

import { storageDB } from './storage.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REMINDER_CONFIG = {
  // Do Not Disturb hours (24-hour format, user's local timezone)
  DND_START_HOUR: 22, // 10 PM
  DND_END_HOUR: 8,    // 8 AM
  
  // Maximum reminders per action item
  MAX_REMINDERS_PER_ITEM: 3,
  
  // Reminder types and their configurations
  TYPES: {
    BEFORE_DEADLINE: {
      name: 'before_deadline',
      hoursBeforeDeadline: 24,
      title: '⏰ Action Item Due Tomorrow',
      priority: 2
    },
    DAY_AFTER_MEETING: {
      name: 'day_after_meeting',
      hoursAfterMeeting: 24,
      title: '📋 Follow-up: Action Item from Yesterday',
      priority: 1
    },
    WEEKLY_DIGEST: {
      name: 'weekly_digest',
      dayOfWeek: 1, // Monday
      hour: 9, // 9 AM
      title: '📊 Weekly Action Items Digest',
      priority: 0
    }
  },
  
  // Snooze durations (milliseconds)
  SNOOZE_DURATIONS: {
    '1_HOUR': 60 * 60 * 1000,
    '1_DAY': 24 * 60 * 60 * 1000,
    '3_DAYS': 3 * 24 * 60 * 60 * 1000
  }
};

// ============================================================================
// REMINDER SCHEDULING
// ============================================================================

/**
 * Schedule reminders for an action item
 * @param {Object} actionItem - Action item with id, task, who, due, meetingId
 * @param {number} meetingDate - Meeting timestamp
 */
export async function scheduleRemindersForActionItem(actionItem, meetingDate) {
  console.log('[ReminderManager] Scheduling reminders for:', actionItem.task);
  
  try {
    // Parse deadline from action item
    const deadline = parseDeadline(actionItem.due, meetingDate);
    
    if (!deadline) {
      console.log('[ReminderManager] No valid deadline, skipping deadline reminder');
      return;
    }
    
    // Schedule 24-hour before deadline reminder
    await scheduleBeforeDeadlineReminder(actionItem, deadline, meetingDate);
    
    // Schedule day-after meeting reminder
    await scheduleDayAfterMeetingReminder(actionItem, meetingDate);
    
    console.log('[ReminderManager] Reminders scheduled successfully');
    
  } catch (error) {
    console.error('[ReminderManager] Error scheduling reminders:', error);
  }
}

/**
 * Schedule 24-hour before deadline reminder
 */
async function scheduleBeforeDeadlineReminder(actionItem, deadline, meetingDate) {
  const reminderTime = new Date(deadline.getTime() - (24 * 60 * 60 * 1000));
  const now = new Date();
  
  // Skip if deadline is less than 24 hours away or already passed
  if (reminderTime <= now) {
    console.log('[ReminderManager] Deadline too soon or passed, skipping before-deadline reminder');
    return;
  }
  
  // Adjust for Do Not Disturb hours
  const adjustedTime = adjustForDND(reminderTime);
  
  // Create reminder record
  const reminder = {
    id: `reminder_${actionItem.id}_before_deadline`,
    actionItemId: actionItem.id,
    type: REMINDER_CONFIG.TYPES.BEFORE_DEADLINE.name,
    scheduledTime: adjustedTime.getTime(),
    originalTime: reminderTime.getTime(),
    retryCount: 0,
    status: 'scheduled',
    actionItem: actionItem,
    meetingDate: meetingDate,
    createdAt: Date.now()
  };
  
  // Save to IndexedDB
  await storageDB.addReminder(reminder);
  
  // Schedule chrome alarm
  const alarmName = reminder.id;
  const delayInMinutes = (adjustedTime.getTime() - now.getTime()) / (60 * 1000);
  
  await chrome.alarms.create(alarmName, {
    when: adjustedTime.getTime()
  });
  
  console.log(`[ReminderManager] Scheduled before-deadline reminder: ${alarmName} in ${Math.round(delayInMinutes)} minutes`);
}

/**
 * Schedule day-after meeting reminder
 */
async function scheduleDayAfterMeetingReminder(actionItem, meetingDate) {
  const reminderTime = new Date(meetingDate + (24 * 60 * 60 * 1000));
  const now = new Date();
  
  // Skip if meeting was more than 24 hours ago
  if (reminderTime <= now) {
    console.log('[ReminderManager] Meeting too old, skipping day-after reminder');
    return;
  }
  
  // Adjust for Do Not Disturb hours
  const adjustedTime = adjustForDND(reminderTime);
  
  // Create reminder record
  const reminder = {
    id: `reminder_${actionItem.id}_day_after`,
    actionItemId: actionItem.id,
    type: REMINDER_CONFIG.TYPES.DAY_AFTER_MEETING.name,
    scheduledTime: adjustedTime.getTime(),
    originalTime: reminderTime.getTime(),
    retryCount: 0,
    status: 'scheduled',
    actionItem: actionItem,
    meetingDate: meetingDate,
    createdAt: Date.now()
  };
  
  // Save to IndexedDB
  await storageDB.addReminder(reminder);
  
  // Schedule chrome alarm
  const alarmName = reminder.id;
  
  await chrome.alarms.create(alarmName, {
    when: adjustedTime.getTime()
  });
  
  console.log(`[ReminderManager] Scheduled day-after reminder: ${alarmName}`);
}

/**
 * Schedule weekly digest alarm (recurring every Monday at 9 AM)
 */
export async function scheduleWeeklyDigest() {
  const now = new Date();
  const nextMonday = getNextMonday(now);
  nextMonday.setHours(REMINDER_CONFIG.TYPES.WEEKLY_DIGEST.hour, 0, 0, 0);
  
  // Adjust for Do Not Disturb
  const adjustedTime = adjustForDND(nextMonday);
  
  console.log(`[ReminderManager] Scheduling weekly digest for: ${adjustedTime.toLocaleString()}`);
  
  // Create recurring alarm (checks every Monday)
  await chrome.alarms.create('weekly_digest', {
    when: adjustedTime.getTime(),
    periodInMinutes: 7 * 24 * 60 // 7 days
  });
}

// ============================================================================
// NOTIFICATION HANDLING
// ============================================================================

/**
 * Trigger a reminder (called by chrome.alarms.onAlarm)
 * @param {string} alarmName - Name of the alarm that triggered
 */
export async function triggerReminder(alarmName) {
  console.log('[ReminderManager] Triggering reminder:', alarmName);
  
  try {
    // Handle weekly digest separately
    if (alarmName === 'weekly_digest') {
      await sendWeeklyDigest();
      return;
    }
    
    // Get reminder from database
    const reminder = await storageDB.getReminder(alarmName);
    
    if (!reminder) {
      console.warn('[ReminderManager] Reminder not found:', alarmName);
      return;
    }
    
    // Check retry count
    if (reminder.retryCount >= REMINDER_CONFIG.MAX_REMINDERS_PER_ITEM) {
      console.log('[ReminderManager] Max reminders reached, skipping:', alarmName);
      await storageDB.updateReminder(alarmName, { status: 'max_reached' });
      return;
    }
    
    // Check if action item is already completed
    const actionItem = await storageDB.getActionItem(reminder.actionItemId);
    if (actionItem && actionItem.completed) {
      console.log('[ReminderManager] Action item already completed, skipping reminder');
      await storageDB.updateReminder(alarmName, { status: 'completed' });
      return;
    }
    
    // Send notification
    await sendReminderNotification(reminder);
    
    // Update reminder status
    await storageDB.updateReminder(alarmName, {
      status: 'sent',
      sentAt: Date.now(),
      retryCount: reminder.retryCount + 1
    });
    
  } catch (error) {
    console.error('[ReminderManager] Error triggering reminder:', error);
  }
}

/**
 * Send reminder notification
 */
async function sendReminderNotification(reminder) {
  const config = REMINDER_CONFIG.TYPES[reminder.type.toUpperCase()] || 
                 REMINDER_CONFIG.TYPES.BEFORE_DEADLINE;
  
  // Get meeting info for context
  const meeting = await storageDB.getMeeting(reminder.actionItem.meetingId);
  const meetingTitle = meeting ? meeting.title : 'Meeting';
  const meetingDateStr = new Date(reminder.meetingDate).toLocaleDateString();
  
  // Format body text
  const bodyText = formatNotificationBody(reminder, meetingTitle, meetingDateStr);
  
  // Create notification
  const notificationId = `notification_${reminder.id}`;
  
  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: config.title,
    message: bodyText,
    priority: config.priority,
    requireInteraction: true, // Notification stays until user interacts
    buttons: [
      { title: '✓ Mark Done' },
      { title: '⏰ Snooze 1 Day' }
    ],
    contextMessage: `From: ${meetingTitle} (${meetingDateStr})`
  });
  
  // Store notification-to-reminder mapping
  await storageDB.addNotificationMapping(notificationId, reminder.id);
  
  console.log('[ReminderManager] Notification sent:', notificationId);
}

/**
 * Format notification body text
 */
function formatNotificationBody(reminder, meetingTitle, meetingDateStr) {
  const task = reminder.actionItem.task;
  const who = reminder.actionItem.who;
  const due = reminder.actionItem.due;
  
  let body = `📌 ${task}`;
  
  if (who && who !== 'Unassigned') {
    body += `\n👤 Owner: ${who}`;
  }
  
  if (due) {
    body += `\n📅 Due: ${due}`;
  }
  
  return body;
}

/**
 * Send weekly digest notification
 */
async function sendWeeklyDigest() {
  console.log('[ReminderManager] Sending weekly digest...');
  
  try {
    // Get all open action items
    const allActionItems = await storageDB.getAllActionItems();
    const openItems = allActionItems.filter(item => !item.completed);
    
    if (openItems.length === 0) {
      console.log('[ReminderManager] No open action items for digest');
      return;
    }
    
    // Group by meeting
    const itemsByMeeting = {};
    for (const item of openItems) {
      if (!itemsByMeeting[item.meetingId]) {
        const meeting = await storageDB.getMeeting(item.meetingId);
        itemsByMeeting[item.meetingId] = {
          meeting: meeting,
          items: []
        };
      }
      itemsByMeeting[item.meetingId].items.push(item);
    }
    
    // Format digest message
    const totalCount = openItems.length;
    const meetingCount = Object.keys(itemsByMeeting).length;
    
    let message = `You have ${totalCount} open action item${totalCount > 1 ? 's' : ''} from ${meetingCount} meeting${meetingCount > 1 ? 's' : ''}.\n\n`;
    
    // Add top 3 items
    const topItems = openItems.slice(0, 3);
    topItems.forEach((item, idx) => {
      message += `${idx + 1}. ${item.task.substring(0, 50)}${item.task.length > 50 ? '...' : ''}\n`;
    });
    
    if (openItems.length > 3) {
      message += `\n... and ${openItems.length - 3} more`;
    }
    
    // Create notification
    await chrome.notifications.create('weekly_digest', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '📊 Weekly Action Items Digest',
      message: message,
      priority: 1,
      buttons: [
        { title: '📋 View All Items' }
      ]
    });
    
    console.log('[ReminderManager] Weekly digest sent');
    
  } catch (error) {
    console.error('[ReminderManager] Error sending weekly digest:', error);
  }
}

/**
 * Handle notification button clicks
 */
export async function handleNotificationButtonClick(notificationId, buttonIndex) {
  console.log(`[ReminderManager] Button ${buttonIndex} clicked on notification ${notificationId}`);
  
  try {
    // Handle weekly digest
    if (notificationId === 'weekly_digest') {
      if (buttonIndex === 0) { // View All Items
        await openSidePanelWithFilter('all');
      }
      chrome.notifications.clear(notificationId);
      return;
    }
    
    // Get reminder ID from notification
    const mapping = await storageDB.getNotificationMapping(notificationId);
    if (!mapping) {
      console.warn('[ReminderManager] No mapping found for notification:', notificationId);
      return;
    }
    
    const reminder = await storageDB.getReminder(mapping.reminderId);
    if (!reminder) {
      console.warn('[ReminderManager] Reminder not found:', mapping.reminderId);
      return;
    }
    
    // Handle button actions
    if (buttonIndex === 0) {
      // Mark Done
      await markActionItemComplete(reminder.actionItemId);
      await storageDB.updateReminder(reminder.id, { status: 'completed' });
      
      // Show confirmation
      await chrome.notifications.create(`${notificationId}_done`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: '✓ Action Item Completed',
        message: `"${reminder.actionItem.task}" marked as done!`,
        priority: 0
      });
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        chrome.notifications.clear(`${notificationId}_done`);
      }, 3000);
      
    } else if (buttonIndex === 1) {
      // Snooze 1 Day
      await snoozeReminder(reminder, REMINDER_CONFIG.SNOOZE_DURATIONS['1_DAY']);
      
      // Show confirmation
      await chrome.notifications.create(`${notificationId}_snoozed`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: '⏰ Reminder Snoozed',
        message: 'You\'ll be reminded again in 24 hours',
        priority: 0
      });
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        chrome.notifications.clear(`${notificationId}_snoozed`);
      }, 3000);
    }
    
    // Clear original notification
    chrome.notifications.clear(notificationId);
    
  } catch (error) {
    console.error('[ReminderManager] Error handling button click:', error);
  }
}

/**
 * Handle notification clicks (opens side panel with highlighted item)
 */
export async function handleNotificationClick(notificationId) {
  console.log('[ReminderManager] Notification clicked:', notificationId);
  
  try {
    // Handle weekly digest
    if (notificationId === 'weekly_digest') {
      await openSidePanelWithFilter('all');
      chrome.notifications.clear(notificationId);
      return;
    }
    
    // Get reminder from notification mapping
    const mapping = await storageDB.getNotificationMapping(notificationId);
    if (!mapping) {
      console.warn('[ReminderManager] No mapping found, opening side panel anyway');
      await openSidePanel();
      chrome.notifications.clear(notificationId);
      return;
    }
    
    const reminder = await storageDB.getReminder(mapping.reminderId);
    if (reminder) {
      // Open side panel with highlighted action item
      await openSidePanelWithHighlight(reminder.actionItemId);
    } else {
      await openSidePanel();
    }
    
    // Clear notification
    chrome.notifications.clear(notificationId);
    
  } catch (error) {
    console.error('[ReminderManager] Error handling notification click:', error);
  }
}

/**
 * Snooze a reminder
 */
async function snoozeReminder(reminder, snoozeDuration) {
  console.log(`[ReminderManager] Snoozing reminder ${reminder.id} for ${snoozeDuration}ms`);
  
  const newTime = Date.now() + snoozeDuration;
  const adjustedTime = adjustForDND(new Date(newTime));
  
  // Update reminder
  await storageDB.updateReminder(reminder.id, {
    scheduledTime: adjustedTime.getTime(),
    status: 'snoozed',
    snoozedAt: Date.now(),
    snoozeCount: (reminder.snoozeCount || 0) + 1
  });
  
  // Reschedule alarm
  await chrome.alarms.create(reminder.id, {
    when: adjustedTime.getTime()
  });
  
  console.log(`[ReminderManager] Reminder rescheduled for: ${adjustedTime.toLocaleString()}`);
}

/**
 * Mark action item as complete
 */
async function markActionItemComplete(actionItemId) {
  console.log('[ReminderManager] Marking action item complete:', actionItemId);
  
  await storageDB.updateActionItem(actionItemId, {
    completed: true,
    completedAt: Date.now()
  });
  
  // Cancel all pending reminders for this action item
  await cancelRemindersForActionItem(actionItemId);
}

/**
 * Cancel all reminders for an action item
 */
async function cancelRemindersForActionItem(actionItemId) {
  console.log('[ReminderManager] Cancelling reminders for action item:', actionItemId);
  
  const allReminders = await storageDB.getAllReminders();
  const itemReminders = allReminders.filter(r => r.actionItemId === actionItemId);
  
  for (const reminder of itemReminders) {
    if (reminder.status === 'scheduled' || reminder.status === 'snoozed') {
      await chrome.alarms.clear(reminder.id);
      await storageDB.updateReminder(reminder.id, { status: 'cancelled' });
      console.log('[ReminderManager] Cancelled reminder:', reminder.id);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse deadline from action item due string
 * @param {string} dueString - Due date string (e.g., "Tomorrow", "Next Monday", "12/31")
 * @param {number} meetingDate - Meeting timestamp as reference
 * @returns {Date|null} - Parsed deadline or null
 */
function parseDeadline(dueString, meetingDate) {
  if (!dueString || dueString === 'No deadline' || dueString === 'TBD') {
    return null;
  }
  
  const now = new Date();
  const meeting = new Date(meetingDate);
  
  // Normalize string
  const normalized = dueString.toLowerCase().trim();
  
  // Common patterns
  if (normalized.includes('today')) {
    const deadline = new Date(now);
    deadline.setHours(17, 0, 0, 0); // 5 PM today
    return deadline;
  }
  
  if (normalized.includes('tomorrow')) {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(17, 0, 0, 0);
    return deadline;
  }
  
  if (normalized.includes('next week')) {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 7);
    deadline.setHours(17, 0, 0, 0);
    return deadline;
  }
  
  if (normalized.includes('end of week') || normalized.includes('eow')) {
    const deadline = new Date(now);
    const daysUntilFriday = (5 - deadline.getDay() + 7) % 7;
    deadline.setDate(deadline.getDate() + daysUntilFriday);
    deadline.setHours(17, 0, 0, 0);
    return deadline;
  }
  
  if (normalized.includes('monday')) return getNextWeekday(now, 1);
  if (normalized.includes('tuesday')) return getNextWeekday(now, 2);
  if (normalized.includes('wednesday')) return getNextWeekday(now, 3);
  if (normalized.includes('thursday')) return getNextWeekday(now, 4);
  if (normalized.includes('friday')) return getNextWeekday(now, 5);
  
  // Try parsing as date (MM/DD, MM/DD/YY, MM/DD/YYYY)
  const dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // 0-indexed
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? 
      (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : 
      now.getFullYear();
    
    const deadline = new Date(year, month, day, 17, 0, 0, 0);
    return deadline;
  }
  
  // Try parsing "in X days"
  const daysMatch = normalized.match(/in (\d+) days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + days);
    deadline.setHours(17, 0, 0, 0);
    return deadline;
  }
  
  // Default: 1 week from meeting
  const deadline = new Date(meeting);
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(17, 0, 0, 0);
  return deadline;
}

/**
 * Get next occurrence of a weekday
 */
function getNextWeekday(from, targetDay) {
  const result = new Date(from);
  const currentDay = result.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilTarget);
  result.setHours(17, 0, 0, 0);
  return result;
}

/**
 * Get next Monday
 */
function getNextMonday(from) {
  return getNextWeekday(from, 1);
}

/**
 * Adjust time to avoid Do Not Disturb hours
 * If time falls in DND window, move to DND_END_HOUR
 */
function adjustForDND(time) {
  const adjusted = new Date(time);
  const hour = adjusted.getHours();
  
  const { DND_START_HOUR, DND_END_HOUR } = REMINDER_CONFIG;
  
  // Check if time is in DND window
  // Handle case where DND spans midnight (e.g., 22:00 to 08:00)
  const inDND = DND_START_HOUR > DND_END_HOUR ?
    (hour >= DND_START_HOUR || hour < DND_END_HOUR) :
    (hour >= DND_START_HOUR && hour < DND_END_HOUR);
  
  if (inDND) {
    adjusted.setHours(DND_END_HOUR, 0, 0, 0);
    console.log(`[ReminderManager] Adjusted time to avoid DND: ${adjusted.toLocaleString()}`);
  }
  
  return adjusted;
}

/**
 * Open side panel
 */
async function openSidePanel() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    }
  } catch (error) {
    console.error('[ReminderManager] Error opening side panel:', error);
  }
}

/**
 * Open side panel with specific action item highlighted
 */
async function openSidePanelWithHighlight(actionItemId) {
  try {
    // Store highlight request in session storage
    await chrome.storage.session.set({
      highlightActionItem: actionItemId
    });
    
    await openSidePanel();
    
  } catch (error) {
    console.error('[ReminderManager] Error opening side panel with highlight:', error);
  }
}

/**
 * Open side panel with filter
 */
async function openSidePanelWithFilter(filter) {
  try {
    await chrome.storage.session.set({
      actionItemFilter: filter
    });
    
    await openSidePanel();
    
  } catch (error) {
    console.error('[ReminderManager] Error opening side panel with filter:', error);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize reminder system
 * Call this when extension loads
 */
export async function initializeReminderSystem() {
  console.log('[ReminderManager] Initializing reminder system...');
  
  try {
    // Ensure storage is initialized first
    if (!storageDB.db) {
      console.log('[ReminderManager] Initializing storage DB...');
      await storageDB.initialize();
    }
    
    // Schedule weekly digest
    await scheduleWeeklyDigest();
    
    // Clean up old reminders (older than 30 days)
    await cleanupOldReminders();
    
    console.log('[ReminderManager] Reminder system initialized');
    
  } catch (error) {
    console.error('[ReminderManager] Error initializing reminder system:', error);
  }
}

/**
 * Clean up old reminders
 */
async function cleanupOldReminders() {
  try {
    if (!storageDB.db) {
      console.warn('[ReminderManager] Storage DB not initialized, skipping cleanup');
      return;
    }
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const allReminders = await storageDB.getAllReminders();
    
    let cleaned = 0;
    for (const reminder of allReminders) {
      if (reminder.createdAt < thirtyDaysAgo && 
          (reminder.status === 'completed' || reminder.status === 'cancelled' || reminder.status === 'max_reached')) {
        await storageDB.deleteReminder(reminder.id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[ReminderManager] Cleaned up ${cleaned} old reminders`);
    }
  } catch (error) {
    console.error('[ReminderManager] Error cleaning up reminders:', error);
  }
}

// Export configuration for testing/customization
export { REMINDER_CONFIG };
