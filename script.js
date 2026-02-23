// Get today's date in YYYY-MM-DD format for history tracking
const today = new Date().toISOString().split('T')[0];

// Load saved momentum data from localStorage or initialize default structure
let data = JSON.parse(localStorage.getItem("momentumData")) || {
    goals: []
};

// Save current data state into localStorage
function saveData() {
    localStorage.setItem("momentumData", JSON.stringify(data));
}

// Add a new goal to the goals list and refresh page
function addGoal() {
    const name = document.getElementById("goalName").value;
    const color = document.getElementById("goalColor").value;
    const startDate = document.getElementById("goalStartDate").value;

    if (!name || !startDate) return;

    // Prevent users from selecting a future start date
    const todayStr = new Date().toISOString().split('T')[0];
    if (startDate > todayStr) {
        alert("Start date cannot be in the future.");
        return;
    }
    
    data.goals.push({
        id: Date.now(),
        name,
        color,
        startDate,   // New field
        history: {},
        bestStreak: 0
    });

    saveData();
    location.reload();
}

// Remove a goal by filtering it out of the goals array
function deleteGoal(id) {
    data.goals = data.goals.filter(g => g.id !== id);
    saveData();
    location.reload();
}

// Mark today's goal as complete and play feedback sound
function markComplete(id) {
    const goal = data.goals.find(g => g.id === id);
    
    // Record completion for today
    goal.history[today] = true; 

    // Play confirmation sound
    playFlameSound(); 

    saveData();
    renderGoals(); // Refresh UI display
}

// Calculate current streak by walking backward through dates
// Stops after encountering more than one missed day
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

    // Update best streak if current streak is higher
    if (streak > goal.bestStreak) {
        goal.bestStreak = streak;
        saveData();
    }

    return streak;
}

// Render all goals inside the UI container
function renderGoals() {
    const container = document.getElementById("goalsContainer");
    if (!container) return;

    container.innerHTML = "";
    let completedToday = 0;

    data.goals.forEach(goal => {

        const streak = calculateStreak(goal);
        const isDone = goal.history[today];

        if (isDone) completedToday++;

        // Create goal card UI element
        const card = document.createElement("div");
        card.className = "goalCard";
        card.style.border = `2px solid ${goal.color}`;

        // Populate goal card content
        card.innerHTML = `
        <h3>${goal.name}</h3>
        <p>📅 Started: ${goal.startDate}</p>        
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

    // Display total number of goals completed today
    document.getElementById("dailyScore").innerText =
        `🔥 ${completedToday} / ${data.goals.length} Completed Today`;
}

// Audio context for flame completion sound
let audioCtx;

// Generate short flame-like sound effect when goal is completed
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

// Generate 30-day progress chain bar (fills left → right based on streak)
function generateChain(goal) {
    let html = "";

    if (!goal.startDate) return "";

    const startDate = new Date(goal.startDate);
    const todayDate = new Date(today);

    // Get first day of current month
    const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

    // Get number of days in current month
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

        // Fill only if:
        // 1. After start date
        // 2. Before or equal today
        // 3. History shows completion
        const isFilled =
            chainDate >= startDate &&
            chainDate <= todayDate &&
            goal.history[chainDateStr];

        html += `
            <div class="chainDay ${isFilled ? "done" : ""}"
                 title="${chainDateStr}">
            </div>
        `;
    }

    return html;
}

// Render goal management list with delete buttons
function renderManage() {
    const list = document.getElementById("goalList");
    if (!list) return;

    list.innerHTML = "";

    // Show each goal with a delete option
    data.goals.forEach(goal => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${goal.name}
            <button onclick="deleteGoal(${goal.id})">Delete</button>
        `;
        list.appendChild(li);
    });
}

// Initial render calls when page loads
renderGoals();
renderManage();



