let timerInterval = null;

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function getLocalState() {
  const data = await chrome.storage.local.get(['timerState']);
  return data.timerState || { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' };
}

async function setLocalState(state) {
  await chrome.storage.local.set({ timerState: state });
}

async function updateDisplay() {
  const state = await getLocalState();
  const timerEl = document.getElementById('timer');
  const activeTaskDisplay = document.getElementById('active-task-display');
  
  let totalMs = (state.accumulatedSeconds || 0) * 1000;
  if (state.isRunning && state.startTime) {
    totalMs += Date.now() - state.startTime;
  }
  
  timerEl.textContent = formatTime(totalMs);
  activeTaskDisplay.textContent = state.isRunning ? state.taskName : '';
}

async function refreshUI() {
  const state = await getLocalState();
  const toggleBtn = document.getElementById('toggleBtn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const btnText = document.getElementById('btnText');
  const taskInput = document.getElementById('taskName');
  const activeActions = document.getElementById('active-actions');

  if (state.isRunning) {
    toggleBtn.className = 'btn-stop';
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    btnText.textContent = 'Pause Timer';
    taskInput.style.display = 'none';
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
    
    // Show actions if there's any accumulated time or it was a pause
    if (state.accumulatedSeconds > 0 || state.startTime) {
      activeActions.style.display = 'flex';
    } else {
      activeActions.style.display = 'none';
    }
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  updateDisplay();
}

document.addEventListener('DOMContentLoaded', async () => {
  await refreshUI();

  document.getElementById('toggleBtn').addEventListener('click', async () => {
    const state = await getLocalState();
    const taskInput = document.getElementById('taskName');
    
    if (state.isRunning) {
      // Pausing
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      state.isRunning = false;
      state.accumulatedSeconds = (state.accumulatedSeconds || 0) + elapsed;
      state.startTime = null;
    } else {
      // Starting
      state.isRunning = true;
      state.startTime = Date.now();
      state.taskName = taskInput.value || state.taskName || 'Untitled Task';
    }
    
    await setLocalState(state);
    await refreshUI();
  });

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const state = await getLocalState();
    
    status.textContent = 'Saving to Task Tracker...';
    
    let totalSeconds = state.accumulatedSeconds || 0;
    if (state.isRunning && state.startTime) {
      totalSeconds += Math.floor((Date.now() - state.startTime) / 1000);
    }

    if (totalSeconds <= 0) {
      status.textContent = 'Nothing to save';
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: state.taskName || 'Extension Task',
          totalSeconds: totalSeconds,
          isTimerTask: true
        }),
      });

      if (response.ok) {
        status.textContent = 'Saved! Sync web app to see results.';
        await setLocalState({ isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' });
        setTimeout(() => status.textContent = '', 3000);
        await refreshUI();
      } else {
        status.textContent = 'Error saving to server';
      }
    } catch (err) {
      status.textContent = 'Failed to connect to web app';
    }
  });

  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset the timer?')) return;
    await setLocalState({ isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' });
    await refreshUI();
  });
});
