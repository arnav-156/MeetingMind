// ============================================
// Sidepanel Redesign Demo Script
// ============================================

// Basic tab switching
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    
    // Update content sections
    const tabName = button.getAttribute('data-tab');
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');
  });
});

// Demo: Start/Stop Recording
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const meetingInfo = document.getElementById('meeting-info');

startBtn.addEventListener('click', () => {
  startBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  statusBadge.classList.add('recording');
  statusText.textContent = 'Recording';
  meetingInfo.classList.add('active');
});

stopBtn.addEventListener('click', () => {
  stopBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
  statusBadge.classList.remove('recording');
  statusText.textContent = 'Stopped';
});

// Demo: Action item checkbox
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('action-checkbox')) {
    e.target.classList.toggle('checked');
    e.target.closest('.action-item').classList.toggle('completed');
  }
});
