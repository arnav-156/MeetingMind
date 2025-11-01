# 🧪 Testing AI Meeting Type Detection

## Quick Test Guide

### Prerequisites
1. Load unpacked extension in Chrome
2. Navigate to any website (or Google Meet)
3. Open side panel (click extension icon or floating button)

---

## Test Scenario 1: Standup Detection

### Setup
1. Click "Start Recording"
2. Leave meeting type as "GENERAL"
3. Wait 3 minutes

### Trigger Detection
Speak these phrases (or type in a meeting):
```
"Yesterday I worked on the login feature"
"Today I'm going to fix the bug in the dashboard"
"I'm blocked on the API integration"
"No blockers otherwise"
```

### Expected Result
- After 3 minutes, suggestion banner appears
- Suggested type: **Daily Standup**
- Confidence: ~75-85%
- Reasoning: "Based on: update patterns, time references"

### Validation
- ✅ Banner slides down smoothly
- ✅ Confidence percentage shows
- ✅ Accept button works (switches type)
- ✅ Reject button dismisses banner
- ✅ Auto-dismisses after 15 seconds if ignored

---

## Test Scenario 2: Brainstorming Detection

### Setup
1. Start recording with GENERAL type
2. Wait 3 minutes

### Trigger Detection
```
"What if we tried a different approach?"
"We could implement this feature"
"How about adding a new section?"
"Yes, and we should also consider..."
"I have an idea - what if..."
```

### Expected Result
- Suggested type: **Brainstorming Session**
- Confidence: ~70-80%
- Reasoning: "Based on: idea markers, question density"

---

## Test Scenario 3: Decision-Making Detection

### Setup
1. Start recording with GENERAL type
2. Wait 3 minutes

### Trigger Detection
```
"Let's decide on the architecture"
"We need to vote on this proposal"
"Should we approve this change?"
"I think we should go with option A"
"Let's finalize the approach"
```

### Expected Result
- Suggested type: **Decision-Making Session**
- Confidence: ~70-85%
- Reasoning: "Based on: decision language"

---

## Test Scenario 4: No Suggestion (Manual Type)

### Setup
1. Start recording
2. **Manually select** "Sprint Planning" from dropdown
3. Wait 3 minutes

### Expected Result
- ❌ **NO suggestion banner** should appear
- System respects user's manual choice
- Detection still runs but doesn't trigger UI

---

## Test Scenario 5: Low Confidence (No Suggestion)

### Setup
1. Start recording with GENERAL type
2. Wait 3 minutes

### Trigger Detection
Speak generic, non-pattern phrases:
```
"This is a test"
"Hello everyone"
"Can you hear me?"
```

### Expected Result
- ❌ **NO suggestion banner** (confidence < 70%)
- No errors in console
- Recording continues normally

---

## Test Scenario 6: Accept Suggestion Flow

### Setup
1. Trigger any detection (use Standup example)
2. Wait for suggestion banner

### Actions
1. Click "✓ Switch to this type"

### Expected Results
1. ✅ Banner disappears
2. ✅ Dropdown updates to suggested type
3. ✅ Hint text shows optimized weights
4. ✅ Success notification appears: "✨ Switched to Daily Standup - scoring optimized!"
5. ✅ Meeting IQ continues with new type
6. ✅ No errors in console

### Validation Points
- Check dropdown value matches suggested type
- Verify `selectedMeetingType` variable updated
- Confirm background received CHANGE_MEETING_TYPE message
- Ensure MeetingIQEngine reinitialized with new type

---

## Test Scenario 7: Reject Suggestion Flow

### Setup
1. Trigger any detection
2. Wait for suggestion banner

### Actions
1. Click "Keep current"

### Expected Results
1. ✅ Banner fades out
2. ✅ Meeting type stays GENERAL
3. ✅ Recording continues normally
4. ✅ No notification shown
5. ✅ No errors in console

---

## Test Scenario 8: Close Button

### Setup
1. Trigger any detection
2. Wait for suggestion banner

### Actions
1. Click "×" close button in top-right

### Expected Results
1. ✅ Banner dismisses (same as reject)
2. ✅ Type stays GENERAL
3. ✅ No errors

---

## Test Scenario 9: Auto-Dismiss

### Setup
1. Trigger any detection
2. Wait for suggestion banner
3. **Don't interact** - just wait

### Expected Results
1. ✅ After 15 seconds, banner auto-dismisses
2. ✅ Fade-out animation
3. ✅ No errors in console
4. ✅ Recording continues normally

---

## Test Scenario 10: Chrome AI Integration

### Setup
1. Enable Chrome AI (Gemini Nano)
   - Check `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"
   - Restart Chrome
2. Start recording with GENERAL type
3. Wait 3 minutes

### Trigger Detection
Use any pattern (Standup example works well)

### Expected Results
- ✅ Detection includes AI analysis
- ✅ Confidence may be higher (AI contributes 25%)
- ✅ Reasoning may include semantic understanding
- ✅ Check console for "🤖 AI Analysis completed" log

### Without Chrome AI
- ✅ System still works (AI is optional)
- ✅ Confidence based on patterns only
- ✅ No errors if AI unavailable

---

## Console Debug Commands

### Check Detection Status
```javascript
// In background.js console
console.log('Detector:', meetingTypeDetector);
console.log('Detection performed:', typeDetectionPerformed);
console.log('Meeting type:', currentMeeting?.meetingType);
```

### Check Transcript Buffer
```javascript
// In background.js console
console.log('Transcripts:', transcriptBuffer.length);
console.log('Duration:', meetingDuration, 'ms');
```

### Manually Trigger Detection (Testing)
```javascript
// In background.js console
performMeetingTypeDetection();
```

### Check Sidepanel State
```javascript
// In sidepanel.js console
console.log('Selected type:', selectedMeetingType);
console.log('Banner:', document.getElementById('meeting-type-suggestion'));
```

---

## Expected Console Logs

### During Detection (Background)
```
🤖 Initializing Meeting Type Detector
⏱️ 3 minutes elapsed - performing meeting type detection
📊 Meeting type detection result: {type: "DAILY_STANDUP", confidence: 78, ...}
🚀 Broadcasting type suggestion to sidepanel
```

### During Suggestion Display (Sidepanel)
```
🤖 AI Meeting Type Suggestion: {suggestedType: "DAILY_STANDUP", confidence: 78, ...}
```

### During Accept (Sidepanel + Background)
```
[Sidepanel] ✅ Accepting AI suggestion: DAILY_STANDUP
[Background] 🔄 Changing meeting type to: DAILY_STANDUP
[Background] ✨ Meeting IQ Engine reinitialized with new type
```

---

## Error Cases to Test

### 1. Missing UI Elements
- **Test**: Remove banner HTML, trigger detection
- **Expected**: Console error, no crash

### 2. Invalid Meeting Type
- **Test**: Manually send invalid type to background
- **Expected**: Validation, no type change

### 3. Detection During Non-Recording
- **Test**: Try to trigger when not recording
- **Expected**: No detection, no errors

### 4. Rapid Accept/Reject Clicks
- **Test**: Click accept/reject buttons rapidly
- **Expected**: Single action processed, no duplicate changes

---

## Performance Validation

### Memory
- ✅ Check memory before/after detection
- ✅ No memory leaks on repeated detections
- ✅ Banner cleanup on dismiss

### Timing
- ✅ Detection triggers at exactly 3 minutes
- ✅ Banner appears within 100ms of detection
- ✅ Auto-dismiss at exactly 15 seconds

### CPU
- ✅ No CPU spikes during detection
- ✅ Pattern matching completes <100ms
- ✅ UI animations smooth (60fps)

---

## Regression Testing

After any code changes, verify:
- [ ] All 9 meeting types still work
- [ ] Manual type selection still works
- [ ] Meeting IQ scoring still accurate
- [ ] Detection doesn't interfere with recording
- [ ] Suggestion banner doesn't block UI
- [ ] Accept flow fully functional
- [ ] Reject flow fully functional
- [ ] Auto-dismiss working
- [ ] No console errors
- [ ] Extension loads successfully

---

## Success Criteria

A successful test means:
1. ✅ Detection triggers after 3 minutes
2. ✅ Confidence calculation accurate
3. ✅ Suggestion banner appears smoothly
4. ✅ Accept button switches type and updates scoring
5. ✅ Reject button dismisses cleanly
6. ✅ Auto-dismiss works after 15 seconds
7. ✅ No errors in console
8. ✅ Recording continues uninterrupted
9. ✅ UI remains responsive
10. ✅ Type change persists throughout meeting

---

## Troubleshooting

### Banner Doesn't Appear
1. Check: Is meeting type GENERAL? (Detection only triggers for GENERAL)
2. Check: Has 3 minutes passed? (Console log meetingDuration)
3. Check: Are there 10+ transcripts? (Console log transcriptBuffer.length)
4. Check: Is confidence >= 70%? (Check console for detection result)
5. Check: Was detection already performed? (Check typeDetectionPerformed flag)

### Accept Button Doesn't Work
1. Check: Are event listeners attached? (Console log in setupEventListeners)
2. Check: Is dataset populated? (Check suggestionBanner.dataset)
3. Check: Is background receiving message? (Check background console)
4. Check: Is dropdown updating? (Inspect dropdown.value)

### Wrong Type Detected
1. Check: What patterns were detected? (Console log conversation analysis)
2. Check: What was the confidence? (Should be >= 70%)
3. Check: Was Chrome AI involved? (Check AI score contribution)
4. Adjust: Test with clearer pattern phrases
5. Validate: Is this actually the right type for the content?

---

## Next Steps After Testing

1. ✅ **If all tests pass**: Mark as production-ready
2. 🐛 **If bugs found**: Document in GitHub issues
3. 📝 **If UX issues**: Gather feedback and iterate
4. 🚀 **If successful**: Deploy to Chrome Web Store
5. 📊 **Track metrics**: Monitor detection accuracy in production

---

*Happy Testing! 🎉*
