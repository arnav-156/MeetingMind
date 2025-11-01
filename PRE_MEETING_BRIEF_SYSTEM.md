# 📋 Pre-Meeting Brief System - Complete Documentation

**Feature**: Intelligent pre-meeting context using historical data and AI analysis  
**Status**: ✅ Fully Implemented  
**Date**: November 1, 2025

---

## 🎯 Overview

The Pre-Meeting Brief system automatically detects recurring meetings and generates intelligent, context-rich briefs 5 minutes before each meeting starts. It analyzes historical data, identifies patterns, and uses AI to provide actionable insights.

### Key Features

✅ **Automatic Series Detection** - Identifies recurring meetings by title, participants, and timing  
✅ **Historical Analysis** - Reviews past meetings in the series  
✅ **AI-Powered Insights** - Uses Prompt API to generate contextual summaries  
✅ **Smart Timing** - Appears 5 minutes before meeting starts  
✅ **Action Item Tracking** - Shows open items with owners and age  
✅ **Pattern Recognition** - Identifies recurring topics and engagement trends  
✅ **Duration Prediction** - Estimates meeting length based on history  
✅ **Agenda Suggestions** - Proposes optimal meeting structure  
✅ **One-Click Context Loading** - Pre-loads brief into recording session  

---

## 🏗️ Architecture

### Components

```
utils/
├── meeting-series-detector.js      # Identifies recurring meeting series
├── pre-meeting-brief.js            # Generates AI-powered briefs
├── pre-meeting-brief-manager.js    # UI and user interaction handler
└── storage.js                      # IndexedDB schemas for briefs

sidepanel/
└── sidepanel.html                  # Brief card UI (light/dark modes)

background.js                       # Meeting detection & notifications
```

### Data Flow

```
1. Calendar Integration → Detects upcoming meeting (5 min before)
2. Background.js → Checks if meeting is part of series
3. Meeting Series Detector → Finds related past meetings
4. Pre-Meeting Brief Generator → Analyzes data + AI processing
5. IndexedDB → Stores generated brief
6. Sidepanel → Displays brief card with context
7. User Action → Loads context into recording session
```

---

## 📊 Data Structure

### Pre-Meeting Brief Object

```javascript
{
  // Identification
  "id": "brief-1730419200000-abc123",
  "meeting_series_id": "weekly-standup",
  "meeting_date": "2025-11-01T10:00:00Z",
  "generated_at": "2025-11-01T09:55:00Z",
  "status": "pending",  // pending, shown, dismissed, used, saved
  
  // Series Information
  "series_info": {
    "name": "Weekly Engineering Standup",
    "meetingCount": 12,
    "frequency": "weekly",
    "avgIQScore": 78
  },
  
  // Last Meeting Data
  "last_meeting": {
    "date": "2025-10-25T10:00:00Z",
    "summary": "Discussed Q4 milestones...",
    "iq_score": 85,
    "duration": 23  // minutes
  },
  
  // Open Action Items
  "open_items": [
    {
      "task": "Update API documentation",
      "owner": "Sarah Chen",
      "due_date": "2025-11-03",
      "age_days": 7,
      "priority": 75,
      "source_meeting": "2025-10-25T10:00:00Z"
    }
  ],
  
  // Patterns & Analytics
  "patterns": {
    "typical_duration": 23,
    "duration_range": "18-28 min",
    "confidence": "high",
    "common_topics": [
      { "topic": "blockers", "count": 8 },
      { "topic": "sprint-planning", "count": 6 },
      { "topic": "deployment", "count": 5 }
    ],
    "active_participants": ["Sarah Chen", "Mike Johnson"],
    "quiet_participants": ["David Park"]
  },
  
  // AI-Generated Content
  "ai_brief": "Last week's standup focused on Q4 deliverables...",
  
  // Suggestions
  "suggestions": {
    "agenda": [
      {
        "title": "Action Items Review",
        "duration": 8,
        "description": "Review 3 open items from previous meetings",
        "priority": "high"
      },
      {
        "title": "Status Updates",
        "duration": 10,
        "description": "Discuss: blockers, sprint planning",
        "priority": "medium"
      }
    ],
    "focus_areas": [
      "Action Item Accountability - 3 items pending follow-up",
      "Inclusive Participation - Engage David Park"
    ],
    "predicted_duration": 23,
    "preparation_tips": [
      "📌 Review 3 open action items before meeting",
      "📊 Prepare updates on: blockers, sprint planning"
    ]
  },
  
  // Metadata
  "metadata": {
    "past_meetings_analyzed": 11,
    "open_items_count": 3,
    "data_quality": "high"  // none, low, medium, high
  }
}
```

---

## 🔍 Meeting Series Detection

### Detection Strategy

The system uses multiple signals to identify recurring meetings:

#### 1. **Title Normalization**
```javascript
// Removes date/number variations
"Weekly Standup - 10/31/2025" → "weekly standup"
"Team Sync #12" → "team sync"
"Sprint Planning (Week 5)" → "sprint planning"
```

#### 2. **Participant Similarity**
```javascript
// Jaccard similarity coefficient
// At least 60% participant overlap required
Meeting A: ["Alice", "Bob", "Carol"]
Meeting B: ["Alice", "Bob", "Dave"]
Similarity: 50% (2 common / 4 total) → NOT a match

Meeting C: ["Alice", "Bob", "Carol"]
Meeting D: ["Alice", "Bob", "Carol", "Dave"]
Similarity: 75% (3 common / 4 total) → MATCH
```

#### 3. **Time Interval Analysis**
```javascript
// Detects regular patterns
Meetings on: Oct 1, Oct 8, Oct 15, Oct 22
Intervals: 7d, 7d, 7d
Pattern: "weekly" (confidence: 98%)

Meetings on: Oct 5, Oct 20, Nov 4
Intervals: 15d, 15d
Pattern: "biweekly" (confidence: 95%)
```

#### 4. **Recurring Keywords**
```
standup, stand-up, daily, weekly, monthly, sync, check-in,
retrospective, retro, planning, review, sprint, scrum,
1:1, one-on-one, team meeting
```

### Series Metadata

Once detected, series are tracked with:

```javascript
{
  "seriesId": "weekly-standup",
  "normalizedTitle": "weekly standup",
  "meetingCount": 12,
  "interval": "weekly",
  "avgInterval": 7,  // days
  "intervalConfidence": 0.98,
  "nextExpected": "2025-11-08T10:00:00Z",
  "avgDuration": 23,
  "avgIQScore": 78,
  "totalParticipants": 5,
  "commonTopics": [...],
  "isRecurring": true,
  "firstMeeting": "2025-08-18T10:00:00Z",
  "lastMeeting": "2025-10-25T10:00:00Z"
}
```

---

## 🤖 AI Brief Generation

### Prompt Structure

The system uses Prompt API with a specialized prompt:

```javascript
System Prompt:
"You are an expert meeting facilitator and productivity coach.
Your role is to analyze past meeting data and generate concise,
actionable pre-meeting briefs.

Focus on:
- Key outcomes and decisions from previous meetings
- Outstanding action items that need follow-up
- Patterns in discussions and engagement
- Practical suggestions for making this meeting effective

Keep briefs concise (300-500 words) and structured."

User Prompt:
"Generate a concise pre-meeting brief for an upcoming meeting.

Meeting Series: Weekly Engineering Standup
Meeting History: 12 previous meetings
Last Meeting: 10/25/2025

LAST MEETING SUMMARY:
[Summary text]

OPEN ACTION ITEMS (3):
• Update API documentation (Owner: Sarah Chen, Age: 7 days)
• Review security audit (Owner: Mike Johnson, Age: 3 days)
...

RECURRING TOPICS:
blockers, sprint planning, deployment

ENGAGEMENT PATTERNS:
Active contributors: Sarah Chen, Mike Johnson
Participants who may benefit from encouragement: David Park

Generate a brief that includes:
1. Quick recap of last meeting's key outcomes
2. Priority action items that need attention
3. Suggested focus areas for this meeting
4. Any patterns or trends to be aware of"
```

### AI Output Example

```
Last week's standup achieved strong alignment on Q4 milestones,
with the team committing to a November 15th release date. Sarah's
API redesign is progressing well and should be ready for review
by Wednesday.

PRIORITY FOLLOW-UPS:
The API documentation (Sarah) is now 7 days old and critical for
the upcoming release. Mike's security audit review is more recent
but blocks deployment—consider making this the first agenda item.

SUGGESTED FOCUS:
Given the November 15th deadline, this meeting should prioritize
deployment readiness. The team has consistently discussed blockers
in past standups, so allocate time for identifying and addressing
any current obstacles.

ENGAGEMENT NOTE:
David has been quieter in recent meetings—consider directly asking
for input on QA status to ensure nothing is overlooked.
```

---

## 📈 Pattern Analytics

### Duration Prediction

```javascript
// Statistical analysis of past meeting durations
Past meetings: [18, 23, 25, 20, 28, 19, 22, 24, 21, 26, 23]

Average: 22.6 minutes
Median: 23 minutes ← PREDICTED
Min: 18 minutes
Max: 28 minutes
Std Dev: 3.1 minutes
Coefficient of Variation: 13.7% → "high confidence"

Prediction: 23 minutes (range: 18-28 min)
```

### Topic Clustering

```javascript
// Extracts keywords from summaries and action items
All meetings analyzed:
"blocker" → 8 mentions (frequency: 73%)
"sprint" → 6 mentions (frequency: 55%)
"deployment" → 5 mentions (frequency: 45%)
"api" → 5 mentions (frequency: 45%)
"testing" → 4 mentions (frequency: 36%)

Top 3 common topics: blockers, sprint planning, deployment
```

### Engagement Patterns

```javascript
// Analyzes participation from Meeting IQ data
Sarah Chen:
  - Total contributions: 45 across 11 meetings
  - Avg per meeting: 4.1
  - Avg score: 82
  - Category: ACTIVE

David Park:
  - Total contributions: 8 across 11 meetings
  - Avg per meeting: 0.7
  - Avg score: 28
  - Category: QUIET (needs encouragement)
```

### Action Item Priority Scoring

```javascript
Priority = Base(50) + Modifiers

Modifiers:
+ 30: Overdue (past due date)
+ 20: Due within 3 days
+ 10: Due within 7 days
+ 20: Contains "urgent" or "asap"
+ 25: Contains "critical" or "blocker"
+ 0-10: High meeting IQ score (quality meeting)

Example:
"Update API documentation" - Due 2 days ago
Base: 50 + Overdue: 30 = Priority: 80 (HIGH)
```

---

## 🎨 UI Components

### Brief Card States

#### 1. **Loading State**
```
┌─────────────────────────────────────┐
│ 📋 Pre-Meeting Brief Ready          │
│    Your meeting starts in 5 minutes │  ×
├─────────────────────────────────────┤
│                                     │
│         ⟳ Loading spinner           │
│   Analyzing previous meetings...    │
│                                     │
└─────────────────────────────────────┘
```

#### 2. **Loaded State**
```
┌─────────────────────────────────────┐
│ 📋 Pre-Meeting Brief Ready          │
│    Your meeting starts in 4 minutes │  ×
├─────────────────────────────────────┤
│ [Weekly Standup]     Meeting #12    │
│                                     │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │Last IQ │ │ Typical│ │  Open  │  │
│ │   85   │ │ 23 min │ │   3    │  │
│ └────────┘ └────────┘ └────────┘  │
│                                     │
│ 📝 Context from Last Meeting        │
│ Last week's standup focused on...   │
│                                     │
│ 🎯 3 action items need follow-up    │
│ 📊 Recurring: blockers, planning    │
│                                     │
│ ▶ View Full Brief                   │
├─────────────────────────────────────┤
│ [Start with this Context] [Later]   │
└─────────────────────────────────────┘
```

#### 3. **Expanded Details**
```
┌─────────────────────────────────────┐
│ ... (header same as above)          │
├─────────────────────────────────────┤
│ ▼ View Full Brief                   │
│                                     │
│ 🔖 Open Action Items                │
│ • Update API docs (Sarah, 7 days)   │
│ • Security audit (Mike, 3 days)     │
│ • Update tests (Alice, 2 days)      │
│                                     │
│ 📝 Suggested Agenda                 │
│ ① Action Items Review (8 min)       │
│ ② Status Updates (10 min)           │
│ ③ New Topics (15 min)               │
│ ④ Next Steps (5 min)                │
│                                     │
│ 👥 Engagement Insights               │
│ Active: Sarah Chen, Mike Johnson    │
│ Consider engaging: David Park       │
│ Typical duration: 23 minutes        │
└─────────────────────────────────────┘
```

#### 4. **Error State**
```
┌─────────────────────────────────────┐
│ 📋 Pre-Meeting Brief Ready          │
│    Your meeting starts in 5 minutes │  ×
├─────────────────────────────────────┤
│                                     │
│   Could not generate brief.         │
│   This may be a new meeting series. │
│                                     │
├─────────────────────────────────────┤
│              [Dismiss]              │
└─────────────────────────────────────┘
```

### Dark Mode Support

All UI elements have full dark mode support with proper contrast:

- **Light Mode**: White backgrounds, dark text (#1F2937)
- **Dark Mode**: Dark backgrounds (#374151), light text (#F9FAFB)
- **Accent Color**: Purple (#7C3AED → #A78BFA in dark)
- **Borders**: Subtle in both modes (#E5E7EB → #6B7280)

---

## 🔧 Integration Points

### 1. Background.js Integration

```javascript
// Add to background.js message handlers

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_UPCOMING_MEETINGS') {
    // Check calendar for meetings in next 5 minutes
    const upcomingMeetings = await checkCalendar(message.timeWindow);
    sendResponse({ meetings: upcomingMeetings });
  }
  
  else if (message.type === 'GENERATE_PRE_MEETING_BRIEF') {
    // Generate brief for upcoming meeting
    const seriesDetector = new MeetingSeriesDetector(storageDB);
    const briefGenerator = new PreMeetingBriefGenerator(storageDB, seriesDetector);
    
    await briefGenerator.initializeAI();
    const brief = await briefGenerator.generateBriefForUpcoming(message.meeting);
    
    if (brief) {
      // Save to IndexedDB
      await storageDB.savePreMeetingBrief(brief);
      sendResponse({ brief });
    } else {
      sendResponse({ error: 'Could not generate brief' });
    }
  }
  
  else if (message.type === 'UPDATE_BRIEF_STATUS') {
    // Update brief status (dismissed, used, saved)
    await storageDB.updateBriefStatus(message.briefId, message.status);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open
});

// Periodic check for upcoming meetings
setInterval(async () => {
  const now = Date.now();
  const fiveMinutesLater = now + (5 * 60 * 1000);
  
  // Check if any meetings start in next 5 minutes
  const upcomingMeetings = await checkCalendarRange(now, fiveMinutesLater);
  
  if (upcomingMeetings.length > 0) {
    // Notify sidepanel
    chrome.runtime.sendMessage({
      type: 'UPCOMING_MEETING_DETECTED',
      meeting: upcomingMeetings[0]
    });
  }
}, 60 * 1000); // Check every minute
```

### 2. Sidepanel.js Integration

```javascript
// Add to sidepanel.js initialization

import PreMeetingBriefManager from '../utils/pre-meeting-brief-manager.js';

// Initialize brief manager
const briefManager = new PreMeetingBriefManager();
await briefManager.initialize();

// Brief manager will automatically:
// - Listen for upcoming meeting notifications
// - Display brief card 5 minutes before meetings
// - Handle user interactions
// - Load context into recording session
```

### 3. Manifest.json Permissions

```json
{
  "permissions": [
    "storage",
    "notifications",
    "alarms"  // For periodic checks
  ],
  "host_permissions": [
    "https://calendar.google.com/*"  // If using Calendar API
  ]
}
```

---

## 📝 Usage Examples

### Example 1: First Meeting (No Brief)

```javascript
// User joins "New Project Kickoff"
const seriesInfo = await seriesDetector.getSeriesInfo({
  title: "New Project Kickoff",
  startTime: "2025-11-01T14:00:00Z"
});

// Output:
{
  isFirstMeeting: true,
  seriesId: "new-project-kickoff",
  message: "This appears to be a new meeting series."
}

// Result: No brief shown
```

### Example 2: Recurring Meeting (Brief Generated)

```javascript
// User has "Weekly Standup" meeting in 5 minutes
const seriesInfo = await seriesDetector.getSeriesInfo({
  title: "Weekly Standup - 11/01",
  startTime: "2025-11-01T10:00:00Z",
  participants: ["Sarah", "Mike", "David"]
});

// Output:
{
  isFirstMeeting: false,
  seriesId: "weekly-standup",
  pastMeetingCount: 11,
  pastMeetings: [/* last 3 meetings */]
}

// Generate brief
const brief = await briefGenerator.generateBrief(seriesInfo, seriesInfo.pastMeetings);

// Result: Brief card appears with context
```

### Example 3: User Actions

```javascript
// Scenario A: Start with Context
briefManager.startWithContext();
// - Loads brief into transcript area
// - Shows context card with action items
// - Updates brief status to "used"
// - Hides brief card

// Scenario B: View Later
briefManager.viewLater();
// - Saves brief to IndexedDB
// - Updates status to "saved"
// - Hides brief card
// - Shows notification

// Scenario C: Dismiss
briefManager.dismissBrief();
// - Updates status to "dismissed"
// - Hides brief card
// - Clears state
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Setup
- [ ] Load extension with all new files
- [ ] Open sidepanel
- [ ] Verify IndexedDB schema (v4) created
- [ ] Check console for initialization messages

#### Series Detection
- [ ] Record 2+ meetings with same title
- [ ] Verify series detected in console
- [ ] Check normalized title is correct
- [ ] Verify participant similarity calculation
- [ ] Test interval detection (weekly/daily)

#### Brief Generation
- [ ] Create upcoming meeting (5 min from now)
- [ ] Verify brief card appears
- [ ] Check loading state shows
- [ ] Verify AI brief generates (if Prompt API available)
- [ ] Check all metrics populate correctly

#### UI Interactions
- [ ] Click "Start with this Context"
  - Context card appears in transcript
  - Brief status updated
  - Card dismisses
- [ ] Click "View Later"
  - Brief saved
  - Notification appears
  - Card dismisses
- [ ] Click dismiss (×)
  - Card dismisses
  - Status updated

#### Dark Mode
- [ ] Enable system dark mode
- [ ] Verify brief card has dark background
- [ ] Check text is readable (light colors)
- [ ] Verify all elements have proper contrast

#### Edge Cases
- [ ] First meeting (no brief)
- [ ] No past data (error state)
- [ ] Meeting started (countdown shows "now")
- [ ] Multiple upcoming meetings (shows closest)

### Automated Tests

```javascript
// Test meeting series detection
describe('MeetingSeriesDetector', () => {
  test('normalizes meeting titles correctly', () => {
    const detector = new MeetingSeriesDetector();
    expect(detector.normalizeTitle('Standup - 10/31/2025'))
      .toBe('standup');
    expect(detector.normalizeTitle('Team Sync #12'))
      .toBe('team sync');
  });
  
  test('calculates participant similarity', () => {
    const detector = new MeetingSeriesDetector();
    const sim = detector.calculateParticipantSimilarity(
      ['Alice', 'Bob', 'Carol'],
      ['Alice', 'Bob', 'Dave']
    );
    expect(sim).toBeCloseTo(0.5);
  });
  
  test('detects weekly pattern', () => {
    const detector = new MeetingSeriesDetector();
    const dates = [
      '2025-10-01T10:00:00Z',
      '2025-10-08T10:00:00Z',
      '2025-10-15T10:00:00Z',
      '2025-10-22T10:00:00Z'
    ];
    const interval = detector.detectInterval(dates);
    expect(interval.pattern).toBe('weekly');
    expect(interval.confidence).toBeGreaterThan(0.9);
  });
});

// Test brief generation
describe('PreMeetingBriefGenerator', () => {
  test('extracts open action items', () => {
    const generator = new PreMeetingBriefGenerator();
    const meetings = [
      {
        actionItems: [
          { task: 'Update docs', completed: false, assignee: 'Sarah' },
          { task: 'Fix bug', completed: true, assignee: 'Mike' }
        ]
      }
    ];
    const items = generator.extractOpenActionItems(meetings);
    expect(items).toHaveLength(1);
    expect(items[0].task).toBe('Update docs');
  });
  
  test('predicts meeting duration', () => {
    const generator = new PreMeetingBriefGenerator();
    const meetings = [
      { duration: 20 },
      { duration: 25 },
      { duration: 23 }
    ];
    const prediction = generator.predictDuration(meetings);
    expect(prediction.predicted).toBe(23); // median
    expect(prediction.confidence).toBe('high');
  });
});
```

---

## 🚀 Deployment Notes

### IndexedDB Migration

The storage schema has been upgraded from v3 to v4. Migration is automatic:

```javascript
// Old schema (v3):
- meetings
- transcripts
- summaries
- actionItems
- reminders
- notificationMappings
- sharedTranscripts

// New schema (v4):
+ preMeetingBriefs  // NEW
+ meetingSeries     // NEW
```

Existing data is preserved. New stores are created on first load.

### Performance Considerations

- **Brief generation**: 2-5 seconds (with AI)
- **Series detection**: <100ms (IndexedDB query)
- **Storage per brief**: ~5-10KB
- **Cleanup**: Auto-delete briefs older than 30 days

### Browser Compatibility

- **Chrome 120+**: Full support (Prompt API available with flag)
- **Chrome 115-119**: Fallback mode (no AI brief, uses last summary)
- **Other browsers**: Core features work, AI optional

### Flags Required (Chrome Canary)

```
chrome://flags/#prompt-api-for-gemini-nano
→ Enable

Then download model:
chrome://components → "Optimization Guide On Device Model"
```

---

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] **Meeting Preparation Checklist** - Auto-generated tasks before meeting
- [ ] **Smart Scheduling** - Suggest optimal meeting times based on patterns
- [ ] **Participant Insights** - Individual engagement trends over time
- [ ] **Topic Trends** - Visualize topic evolution across series
- [ ] **Cross-Series Analysis** - Compare patterns across multiple series

### Phase 3 Features
- [ ] **Email Integration** - Send brief via email to participants
- [ ] **Calendar Events** - Attach brief as calendar event description
- [ ] **Template Customization** - User-defined brief formats
- [ ] **Export Options** - PDF, JSON, Markdown exports
- [ ] **Team Analytics** - Aggregate insights across organization

---

## 📚 API Reference

### MeetingSeriesDetector

```javascript
class MeetingSeriesDetector {
  constructor(storageManager)
  
  normalizeTitle(title: string): string
  isLikelyRecurring(title: string): boolean
  calculateParticipantSimilarity(p1: string[], p2: string[]): number
  detectInterval(dates: Date[]): IntervalPattern
  findSeriesMeetings(meetingId: string): Promise<Meeting[]>
  generateSeriesId(title: string): string
  analyzeSeries(meetings: Meeting[]): SeriesAnalysis
  extractRecurringTopics(meetings: Meeting[]): Topic[]
  getSeriesInfo(upcomingMeeting: Meeting): Promise<SeriesInfo>
}
```

### PreMeetingBriefGenerator

```javascript
class PreMeetingBriefGenerator {
  constructor(storageManager, seriesDetector)
  
  initializeAI(): Promise<boolean>
  extractOpenActionItems(meetings: Meeting[]): ActionItem[]
  calculateItemPriority(item: ActionItem, meeting: Meeting): number
  analyzeEngagement(meetings: Meeting[]): EngagementAnalysis
  predictDuration(meetings: Meeting[]): DurationPrediction
  generateAgendaSuggestions(meetings: Meeting[], items: ActionItem[]): AgendaItem[]
  generateBrief(seriesInfo: SeriesInfo, pastMeetings: Meeting[]): Promise<Brief>
  generateBriefForUpcoming(upcomingMeeting: Meeting): Promise<Brief|null>
  cleanup(): Promise<void>
}
```

### PreMeetingBriefManager

```javascript
class PreMeetingBriefManager {
  constructor()
  
  initialize(): Promise<void>
  startCheckingUpcomingMeetings(): void
  checkUpcomingMeetings(): Promise<void>
  shouldShowBrief(meeting: Meeting): boolean
  handleUpcomingMeeting(meeting: Meeting): Promise<void>
  showBriefCard(state: string, message?: string): void
  displayBrief(brief: Brief): void
  startCountdown(): void
  dismissBrief(): Promise<void>
  startWithContext(): Promise<void>
  loadContextIntoSidepanel(): void
  viewLater(): Promise<void>
  cleanup(): void
}
```

### StorageManager (New Methods)

```javascript
class StorageManager {
  // Pre-Meeting Briefs
  savePreMeetingBrief(brief: Brief): Promise<Brief>
  getPreMeetingBrief(briefId: string): Promise<Brief>
  getBriefsBySeriesId(seriesId: string): Promise<Brief[]>
  getPendingBriefs(): Promise<Brief[]>
  updateBriefStatus(briefId: string, status: string): Promise<Brief>
  deleteOldBriefs(daysOld: number): Promise<number>
  
  // Meeting Series
  saveMeetingSeries(seriesData: SeriesData): Promise<SeriesData>
  getMeetingSeries(seriesId: string): Promise<SeriesData>
  getAllMeetingSeries(): Promise<SeriesData[]>
}
```

---

## ❓ Troubleshooting

### Issue: Brief card not appearing

**Possible causes:**
1. Meeting not detected as series (first meeting)
2. Meeting starts in >5 minutes (too early)
3. Calendar integration not working
4. Brief already shown for this meeting

**Solutions:**
- Check console for detection messages
- Verify meeting has past instances
- Test with meeting in exactly 4 minutes
- Clear IndexedDB and reload

### Issue: AI brief not generating

**Possible causes:**
1. Prompt API not available (need Chrome Canary)
2. Model not downloaded
3. AI initialization failed

**Solutions:**
- Enable `chrome://flags/#prompt-api-for-gemini-nano`
- Download model from `chrome://components`
- Check console for AI initialization errors
- Brief will use fallback (last summary) without AI

### Issue: Incorrect series detection

**Possible causes:**
1. Meeting titles vary too much
2. Participant sets differ significantly
3. Irregular timing

**Solutions:**
- Use consistent meeting titles
- Maintain stable participant list (60%+ overlap)
- Schedule meetings at regular intervals
- Manually normalize titles in code if needed

### Issue: Performance degradation

**Possible causes:**
1. Too many past meetings (>100 per series)
2. Old briefs not cleaned up
3. Large transcript data

**Solutions:**
- Run cleanup: `storageDB.deleteOldBriefs(30)`
- Limit analysis to last 10-20 meetings
- Archive old meeting data
- Clear browser cache

---

## 📄 License & Credits

**Author**: MeetingMind Team  
**AI Partner**: Prompt API (Google Chrome)  
**License**: Proprietary

**Dependencies**:
- Chrome Built-in AI (Prompt API)
- IndexedDB (native)
- Chrome Calendar API (optional)

---

## 📞 Support

For issues or questions:
- Check console logs for error messages
- Review this documentation
- Test with sample data
- Contact development team

**Version**: 1.0.0  
**Last Updated**: November 1, 2025  
**Status**: ✅ Production Ready
