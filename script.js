```javascript
// ================================
// Momentum Tracker - Updated Script
// Features:
// ✅ Dynamic date handling (avoids midnight bugs)
// ✅ Correct calendar chain filling logic
// ✅ Safe date formatting (DD-MMM-YYYY)
// ✅ Progress bar responds to start date + history
// ✅ Sound feedback on completion
// ================================


// ---------- Date Helper ----------

// Returns today's date in YYYY-MM-DD format dynamically
function getToday() {
    return new Date().toISOString().split('T')[0];
}


// ---------- Data Storage ----------

// Load saved momentum data or initialize structure
let data = JSON.parse(localStorage.getItem("momentumData")) || {
    goals: []
};


// Save current application state to localStorage
function saveData() {
    localStorage.setItem("momentumData", JSON.stringify(data));
}


// ---------- Goal Creation ----------

// Add a new goal with validation
function addGoal() {
    const name = document.getElementById("goalName").value;
    const color = document.getElementById("goalColor").value;
    const startDate = document.getElementById("goalStartDate").value;

    if (!name || !startDate) return;

    // Prevent future start dates
    const todayStr = getToday();
    if (startDate > todayStr) {
        alert("Start date cannot be in the future.");
        return;
    }

    // Initialize goal object
    data.goals.push({
        id: Date.now(),
        name,
        color,
        startDate,
        history: {},
        bestStreak: 0
    });

    saveData();
    location.reload();
}


// ---------- Goal Deletion ----------

// Delete goal by filtering array
function deleteGoal(id) {
    data.goals = data.goals.filter(g => g.id !== id);
    saveData();
    location.reload();
}


// ---------- Date Formatting ----------

// Format dates as DD-MMM-YYYY
function formatDisplayDate(dateStr) {
    if (!dateStr) return "";

    const date = new Date(dateStr + "T00:00:00");

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ---------- Completion Logic ----------

// Mark goal as complete for today
function markComplete(id) {
    const goal = data.goals.find(g => g.id === id);

    const today = getToday();

    // Record completion history
    goal.history[today] = true;

    playFlameSound();

    saveData();
    renderGoals();
}


// ---------- Streak Calculation ----------

// Calculate streak by walking backward day-by-day
function calculateStreak(goal) {
    let streak = 0;
    let missedOnce = false;
    let date = new Date();

    while (true) {
        const dateStr = date.toISOString().split('T')[0];

        if (goal.history[dateStr]) {
            streak++;
        } else {
            if (!missedOnce) {
                missedOnce = true;
            } else {
                break;
            }
        }

        date.setDate(date.getDate() - 1);
    }

    // Update best streak
    if (streak > goal.bestStreak) {
        goal.bestStreak = streak;
        saveData();
    }

    return streak;
}


// ---------- Rendering ----------

// Render all goals in main container
function renderGoals() {
    const container = document.getElementById("goalsContainer");
    if (!container) return;

    container.innerHTML = "";

    let completedToday = 0;

    const today = new Date(getToday());

    data.goals.forEach(goal => {

        const streak = calculateStreak(goal);
        const isDone = goal.history[getToday()];

        if (isDone) completedToday++;

        const card = document.createElement("div");
        card.className = "goalCard";
        card.style.border = `2px solid ${goal.color}`;

        card.innerHTML = `
            <h3>${goal.name}</h3>
            <p>🕒 Started: ${formatDisplayDate(goal.startDate)}</p>
            <p>🔥 ${streak} Day Streak</p>
            <p>🏆 Best: ${goal.bestStreak}</p>

            <button 
                onclick="markComplete(${goal.id})"
                ${isDone ? "disabled" : ""}
            >
                ${isDone ? "✔ Completed" : "Mark Complete"}
            </button>

            <div class="chainBar">${generateChain(goal)}</div>
        `;

        container.appendChild(card);
    });

    // Update daily completion score
    const scoreElement = document.getElementById("dailyScore");
    if (scoreElement) {
        scoreElement.innerText =
            `🔥 ${completedToday} / ${data.goals.length} Completed Today`;
    }
}


// ---------- Audio Feedback ----------

// Audio context (lazy initialized)
let audioCtx;


// Play flame-like confirmation sound
function playFlameSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "triangle";

    const now = audioCtx.currentTime;

    oscillator.frequency.setValueAtTime(350, now);
    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
}


// ---------- Progress Chain Rendering ----------

// Generate calendar progress chain bar
function generateChain(goal) {

    let html = "";

    if (!goal.startDate) return "";

    const startDate = new Date(goal.startDate + "T00:00:00");
    const todayDate = new Date(getToday());

    // Number of days in current month
    const monthDays = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() + 1,
        0
    ).getDate();

    for (let day = 1; day <= monthDays; day++) {

        const chainDate = new Date(
            todayDate.getFullYear(),
            todayDate.getMonth(),
            day
        );

        const chainDateStr = chainDate.toISOString().split('T')[0];

        // Fill box only if:
        // 1. After start date
        // 2. Before or equal today
        // 3. History shows completion
        const isFilled =
            chainDate.getTime() >= startDate.getTime() &&
            chainDate.getTime() <= todayDate.getTime() &&
            goal.history[chainDateStr];

        html += `
            <div class="chainDay ${isFilled ? "done" : ""}"
                 title="${chainDateStr}">
            </div>
        `;
    }

    return html;
}


// ---------- Goal Management List ----------

// Render manage page goal list
function renderManage() {
    const list = document.getElementById("goalList");
    if (!list) return;

    list.innerHTML = "";

    data.goals.forEach(goal => {
        const li = document.createElement("li");

        li.innerHTML = `
            ${goal.name}
            <button onclick="deleteGoal(${goal.id})">Delete</button>
        `;

        list.appendChild(li);
    });
}


// ---------- Initial Render ----------

// Run UI rendering when page loads
renderGoals();
renderManage();
```




