const today = new Date().toISOString().split('T')[0];

let data = JSON.parse(localStorage.getItem("momentumData")) || {
    goals: [],
    theme: "dark"
};

function saveData() {
    localStorage.setItem("momentumData", JSON.stringify(data));
}

function toggleTheme() {
    if (data.theme === "dark") {
        document.body.classList.add("light");
        data.theme = "light";
    } else {
        document.body.classList.remove("light");
        data.theme = "dark";
    }
    saveData();
}

if (data.theme === "light") document.body.classList.add("light");

function addGoal() {
    const name = document.getElementById("goalName").value;
    const color = document.getElementById("goalColor").value;
    if (!name) return;

    data.goals.push({
        id: Date.now(),
        name,
        color,
        history: {},
        bestStreak: 0
    });

    saveData();
    location.reload();
}

function deleteGoal(id) {
    data.goals = data.goals.filter(g => g.id !== id);
    saveData();
    location.reload();
}

function markComplete(id) {
    const goal = data.goals.find(g => g.id === id);
    goal.history[today] = true;

    playFlameSound();

    saveData();
    renderGoals();
}

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

    if (streak > goal.bestStreak) {
        goal.bestStreak = streak;
        saveData();
    }

    return streak;
}

function renderGoals() {
    const container = document.getElementById("goalsContainer");
    if (!container) return;

    container.innerHTML = "";
    let completedToday = 0;

    data.goals.forEach(goal => {
    const streak = calculateStreak(goal);
    const isDone = goal.history[today];

    if (isDone) completedToday++;

    const card = document.createElement("div");
    card.className = "goalCard";
    card.style.border = `2px solid ${goal.color}`;

    card.innerHTML = `
        <h3>${goal.name}</h3>
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

    document.getElementById("dailyScore").innerText =
        `🔥 ${completedToday} / ${data.goals.length} Completed Today`;
}

let audioCtx;

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

function generateChain(goal) {
    let html = "";
    const days = [];

    // Build array oldest → newest
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push(dateStr);
    }

    // Render in natural order (left to right)
    days.forEach(dateStr => {
        const done = goal.history[dateStr];
        html += `<div class="chainDay ${done ? 'done' : ''}"></div>`;
    });

    return html;
}

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

renderGoals();

renderManage();
