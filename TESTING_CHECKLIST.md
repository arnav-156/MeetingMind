# ✅ Testing Checklist - Quick Reference

## Before You Start
- [ ] Chrome browser open
- [ ] Microphone working
- [ ] Quiet environment
- [ ] 15-45 minutes available
- [ ] Notepad ready for observations

---

## Test 1: Load Extension ⏱️ 2 min
- [ ] Go to `chrome://extensions/`
- [ ] Enable "Developer mode"
- [ ] Click "Load unpacked"
- [ ] Select MeetingMind folder
- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Service worker active

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Notes:** ________________________________

---

## Test 2: Basic Recording ⏱️ 5 min
- [ ] Click extension icon
- [ ] Side panel opens
- [ ] Click "Start Recording"
- [ ] Button changes to "Stop Recording"
- [ ] Status shows "Recording"
- [ ] Timer starts counting
- [ ] Speak test phrase
- [ ] Transcript appears (within 3 sec)
- [ ] Click "Stop Recording"
- [ ] Recording stops cleanly

**Critical Check:**
- [ ] Button text does NOT duplicate

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Transcription Accuracy:** _____%  
**Notes:** ________________________________

---

## Test 3: AI Detection ⏱️ 10 min
- [ ] Start recording with "GENERAL" type
- [ ] Speak standup phrases:
  - [ ] "Yesterday I worked on..."
  - [ ] "Today I'm going to..."
  - [ ] "I'm blocked on..."
- [ ] Wait for 3:00 on timer
- [ ] Suggestion banner appears
- [ ] Shows meeting type suggestion
- [ ] Shows confidence percentage
- [ ] Shows reasoning text
- [ ] Click "✓ Switch to this type"
- [ ] Dropdown updates to new type
- [ ] Hint text updates
- [ ] Success notification shows
- [ ] Recording continues

**Alternative Test:**
- [ ] Click "Keep current" dismisses banner

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Suggested Type:** ________________  
**Confidence:** _____%  
**Notes:** ________________________________

---

## Test 4: Transcription Quality ⏱️ 5 min
Read this script and check accuracy:
- [ ] "The quick brown fox jumps over the lazy dog"
- [ ] "Artificial intelligence is transforming software"
- [ ] "API endpoints use RESTful architecture"
- [ ] "JSON responses"
- [ ] "Quarterly revenue grew by fifteen percent"

**Count Errors:**
- Missed words: ______
- Wrong words: ______
- Garbled sections: ______

**Accuracy:** (Correct / Total) × 100 = _____%

**Result:** ✅ >90% / ⚠️ 80-90% / ❌ <80%  
**Notes:** ________________________________

---

## Test 5: Speaker Detection ⏱️ 5 min
- [ ] Start recording
- [ ] Person 1 speaks
- [ ] Pause 3 seconds
- [ ] Person 2 speaks
- [ ] Pause 3 seconds
- [ ] Person 1 speaks again
- [ ] Speaker labels appear
- [ ] Changes detected correctly
- [ ] Labels consistent

**Result:** ✅ Pass / ⚠️ Needs Work / ❌ Fail  
**Accuracy:** _____%  
**Notes:** ________________________________

---

## Test 6: Meeting IQ ⏱️ 5 min
- [ ] Select "Daily Standup" type
- [ ] Record 2 minutes
- [ ] Stop recording
- [ ] Meeting IQ score appears
- [ ] Breakdown shows metrics
- [ ] Scores make sense for type
- [ ] Emoji indicator shows
- [ ] Final report generated

**Score:** ____/100  
**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Notes:** ________________________________

---

## Test 7: UI Stress Test ⏱️ 5 min
- [ ] Rapid clicks on Start (5x)
- [ ] Switch tabs rapidly
- [ ] Click Stop multiple times
- [ ] Refresh page during recording
- [ ] Close/reopen side panel
- [ ] No crashes
- [ ] No text duplication
- [ ] No console errors
- [ ] State recovers correctly

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Notes:** ________________________________

---

## Test 8: Export Functions ⏱️ 3 min
- [ ] Complete a recording
- [ ] Export as TXT
- [ ] Export as Markdown
- [ ] Export as JSON
- [ ] All files download
- [ ] Content is correct
- [ ] Formatting preserved

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Notes:** ________________________________

---

## Test 9: Summary & Actions ⏱️ 5 min
- [ ] Record with action items mentioned
- [ ] Click "Generate Summary"
- [ ] Summary appears (<10 sec)
- [ ] Summary is accurate
- [ ] Action items extracted
- [ ] Assignees noted
- [ ] Content makes sense

**Result:** ✅ Pass / ⚠️ Issues / ❌ Fail  
**Notes:** ________________________________

---

## 📊 OVERALL RESULTS

**Tests Passed:** ____ / 9

**Critical Issues Found:**
1. ________________________________
2. ________________________________
3. ________________________________

**Nice-to-Have Improvements:**
1. ________________________________
2. ________________________________
3. ________________________________

**Overall Rating:** ⭐⭐⭐⭐⭐ (1-5 stars)

**Ready for Production?** ✅ Yes / ⚠️ With Fixes / ❌ Needs Work

---

## 🎯 Next Actions

**If All Pass (8-9/9):**
→ Polish UI, prepare for deployment 🚀

**If Most Pass (6-7/9):**
→ Fix critical bugs, re-test 🔧

**If Mixed (4-5/9):**
→ Prioritize improvements, iterate 🔄

**If Many Fail (<4/9):**
→ Deep dive into core issues, rebuild 🏗️

---

**Testing Date:** ________________  
**Tested By:** ________________  
**Chrome Version:** ________________  
**Time Spent:** ________________

---

**Share Results With:** GitHub Copilot / Team / Documentation

**Next Steps:** ________________________________
