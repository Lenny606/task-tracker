let timerInterval = null;
let startTime = null;
let isRunning = false;
let accumulatedSeconds = 0;

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  const timerEl = document.getElementById('timer');
  let totalMs = (accumulatedSeconds || 0) * 1000;
  if (isRunning && startTime) {
    totalMs += Date.now() - startTime;
  }
  timerEl.textContent = formatTime(totalMs);
}

async function syncState() {
  try {
    const response = await fetch('http://localhost:3000/api/extension');
    if (!response.ok) return;
    const { timerState } = await response.json();
    
    isRunning = timerState.isRunning;
    startTime = timerState.startTime;
    accumulatedSeconds = timerState.accumulatedSeconds || 0;
    
    const toggleBtn = document.getElementById('toggleBtn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const btnText = document.getElementById('btnText');
    const taskInput = document.getElementById('taskName');
    const activeActions = document.getElementById('active-actions');
    const activeTaskDisplay = document.getElementById('active-task-display');

    if (isRunning) {
      toggleBtn.className = 'btn-stop';
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      btnText.textContent = 'Pause Timer';
      taskInput.style.display = 'none';
      activeTaskDisplay.textContent = timerState.taskName;
      activeActions.style.display = 'flex';
      
      if (!timerInterval) {
        timerInterval = setInterval(updateDisplay, 1000);
      }
    } else {
      toggleBtn.className = 'btn-start';
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      btnText.textContent = 'Start Timer';
      taskInput.style.display = 'block';
      activeTaskDisplay.textContent = '';
      
      // Still show Save button if there was a startTime (paused state)
      if (startTime) {
        activeActions.style.display = 'flex';
      } else {
        activeActions.style.display = 'none';
      }
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      updateDisplay();
    }
  } catch (err) {
    console.error('Sync failed', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  syncState();
  setInterval(syncState, 5000); // Polling for sync

  document.getElementById('toggleBtn').addEventListener('click', async () => {
    const taskName = document.getElementById('taskName').value;
    const status = document.getElementById('status');
    status.textContent = 'Syncing...';

    try {
      const response = await fetch('http://localhost:3000/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'TOGGLE_TIMER',
          taskName: taskName || 'Untitled Task'
        }),
      });

      if (response.ok) {
        status.textContent = '';
        await syncState();
      } else {
        status.textContent = 'Error toggling timer';
      }
    } catch (err) {
      status.textContent = 'Failed to connect to app';
    }
  });

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = 'Saving...';
    try {
      const response = await fetch('http://localhost:3000/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SAVE_TIMER' }),
      });
      if (response.ok) {
        status.textContent = 'Saved!';
        setTimeout(() => status.textContent = '', 2000);
        await syncState();
      }
    } catch (err) {
      status.textContent = 'Error saving timer';
    }
  });

  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset the timer without saving?')) return;
    try {
      const response = await fetch('http://localhost:3000/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CLEAR_TIMER' }),
      });
      if (response.ok) {
        await syncState();
      }
    } catch (err) {}
  });
});
