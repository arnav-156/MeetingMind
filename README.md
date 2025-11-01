# 🎙️ MeetingMind

**AI-powered Chrome Extension for Virtual Meetings**

Transform how you engage in virtual meetings with real-time transcription, intelligent summaries, and automated follow-ups—all processed locally on your device.

---

## ✨ Features

### 🎯 Core Capabilities
- **Real-time Audio Capture** - Capture meeting audio from Google Meet, Zoom, and Microsoft Teams
- **Live Transcription** - Convert speech to text in real-time using Chrome's Built-in AI or Web Speech API
- **Smart Summaries** - Generate bullet-point summaries automatically every 5 minutes
- **Action Item Detection** - AI automatically extracts tasks, decisions, and assignments
- **Multilingual Support** - Translate summaries into your preferred language
- **Email Generator** - One-click creation of professional follow-up emails

### 🔒 Privacy First
- ✅ All processing happens **locally on your device**
- ✅ No cloud services or external APIs
- ✅ Data stored in IndexedDB (encrypted)
- ✅ Auto-cleanup after 30 days
- ✅ You own your data completely

---

## 🚀 Installation

### Prerequisites
- **Chrome Canary** or **Chrome Dev** (version 120+)
- Enable experimental AI features:
  1. Open `chrome://flags/#optimization-guide-on-device-model`
  2. Set to "Enabled"
  3. Open `chrome://flags/#prompt-api-for-gemini-nano`
  4. Set to "Enabled"
  5. Restart Chrome

### Install Extension
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `meeting mind` folder
6. The extension icon should appear in your toolbar 🎙️

---

## 📖 Usage

### Starting a Recording

**Method 1: Floating Button**
1. Join a meeting on Google Meet, Zoom, or Teams
2. Click the **MeetingMind** floating button (bottom right)
3. Side panel opens automatically
4. Click "Start Recording"

**Method 2: Extension Icon**
1. Click the MeetingMind icon in toolbar
2. Click "Open Panel"
3. Click "Start Recording"

### During a Meeting
- **Live transcript** appears in real-time
- **Summaries** generated every 5 minutes automatically
- **Action items** detected and highlighted
- Click **📝 Summarize Now** for manual summary
- **Pause/Resume** recording anytime

### After a Meeting
- **Export** transcript as TXT, Markdown, or JSON
- **Generate email** draft with one click
- **Review** action items and mark as complete
- **Search** through past meetings

---

## 🎨 Screenshots

### Side Panel Interface
- ![Side Panel Interface]](screenshot/01.11.2025_07.39.30_REC.png)
- ![Meeting Mind features]](screenshot/01.11.2025_07.40.29_REC.png)

---

## 🛠️ Technology Stack

### Core Technologies
- **Manifest V3** Chrome Extension
- **Chrome Built-in AI APIs**:
  - Prompt API (transcription & text analysis)
  - Summarizer API (summaries)
  - Writer API (email generation)
  - Proofreader API (text cleanup)
  - Translator API (multilingual)
- **Web Speech API** (fallback transcription)
- **IndexedDB** (local storage)

### Frontend
- Vanilla JavaScript (ES6 modules)
- Tailwind CSS (via CDN)
- Responsive design

### Audio Processing
- **MediaRecorder API** (audio capture)
- **chrome.tabCapture** (tab audio)
- **Web Audio API** (audio analysis)
- 30-second chunking for processing

---

## 📁 Project Structure

```
meeting mind/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (AI orchestration)
├── content/
│   └── content.js            # Inject into meeting pages
├── sidepanel/
│   ├── sidepanel.html        # Main UI
│   └── sidepanel.js          # UI logic
├── popup/
│   ├── popup.html            # Quick settings
│   └── popup.js              # Popup logic
├── utils/
│   ├── ai-manager.js         # Chrome AI APIs wrapper
│   ├── storage.js            # IndexedDB manager
│   └── audio-processor.js    # Audio processing
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔧 Configuration

### Settings (via Popup)
- **Summary Interval**: 3, 5, or 10 minutes
- **Language**: English, Spanish, French, German, Chinese
- **Auto-start**: Automatically start recording when meeting detected
- **Dark Mode**: Toggle dark/light theme
- **Data Retention**: Auto-delete meetings after X days (1-90)

---

## 🧪 Development

### Local Development
```powershell
# Clone repository
git clone https://github.com/yourusername/meetingmind.git
cd meetingmind

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder
```

### Testing
1. Join a test Google Meet
2. Start recording
3. Speak test phrases
4. Verify transcript appears
5. Check summaries generate
6. Test export functions

### Debugging
- Open DevTools for:
  - **Background**: `chrome://extensions/` → "Inspect views: service worker"
  - **Side Panel**: Right-click side panel → "Inspect"
  - **Popup**: Right-click extension icon → "Inspect popup"
  - **Content Script**: F12 on meeting page

---

## ⚠️ Known Limitations

1. **AI APIs Availability**: Chrome's Built-in AI APIs are experimental (as of Oct 2025)
   - Fallback to Web Speech API for transcription
   - May not be available on all devices

2. **Tab Audio Capture**: Requires user permission each session

3. **Speaker Detection**: Basic implementation (coming soon: advanced AI speaker diarization)

4. **Platform Support**: 
   - ✅ Google Meet (full support)
   - ⚠️ Zoom (limited - web version only)
   - ⚠️ Microsoft Teams (limited)

5. **Performance**: Long meetings (2+ hours) may use significant memory

---

## 🗺️ Roadmap

### Phase 2 (Post-MVP)
- [ ] Advanced speaker detection & diarization
- [ ] Meeting analytics dashboard
- [ ] Custom meeting templates
- [ ] Collaborative note-taking
- [ ] Browser notifications for @mentions
- [ ] PDF export with formatting
- [ ] Integration with calendar apps

### Phase 3 (Future)
- [ ] Mobile companion app
- [ ] Team workspace features
- [ ] Advanced search & filtering
- [ ] Meeting insights & recommendations
- [ ] Integration with project management tools

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Chrome Built-in AI team for experimental APIs
- Web Speech API contributors
- Tailwind CSS for beautiful styling
- All beta testers and contributors

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/meetingmind/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/meetingmind/discussions)
- **Email**: arnavrai141@gmail.com

---

## 🔒 Privacy Policy

**MeetingMind takes your privacy seriously:**

1. **Local Processing**: All transcription and AI processing happens on your device
2. **No Cloud Storage**: No data is sent to external servers
3. **No Tracking**: We don't track your usage or collect analytics
4. **Data Control**: You control your data - export or delete anytime
5. **Auto-Cleanup**: Meetings automatically deleted after retention period
6. **Open Source**: Full transparency - audit the code yourself

---

## ⭐ Star History

If you find MeetingMind useful, please consider giving it a star! ⭐

---

**Built with ❤️ for productive meetings**

*v1.0.0 - October 2025*
