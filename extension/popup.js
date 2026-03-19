let timerInterval = null;
let startTime = null;
let isRunning = false;

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  const timerEl = document.getElementById('timer');
  if (isRunning && startTime) {
    const elapsed = Date.now() - startTime;
    timerEl.textContent = formatTime(elapsed);
  } else {
    timerEl.textContent = "00:00:00";
  }
}

async function syncState() {
  try {
    const response = await fetch('http://localhost:3000/api/extension');
    if (!response.ok) return;
    const { timerState } = await response.json();
    
    isRunning = timerState.isRunning;
    startTime = timerState.startTime;
    
    const toggleBtn = document.getElementById('toggleBtn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const btnText = document.getElementById('btnText');
    const taskInput = document.getElementById('taskName');
    const activeTaskDisplay = document.getElementById('active-task-display');

    if (isRunning) {
      toggleBtn.className = 'btn-stop';
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      btnText.textContent = 'Pause Timer';
      taskInput.style.display = 'none';
      activeTaskDisplay.textContent = timerState.taskName;
      
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
});
