const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreDisplay = document.getElementById("score");
const scoreboard = document.querySelector(".scoreboard");
const healthBar = document.getElementById("health");
const gameOverScreen = document.getElementById("gameOver");
const finishBtn = document.getElementById("finishBtn");

// Define MAX ATP score
const MAX_SCORE = 100;

let score = 0;
let health = 100;
let playerX = window.innerWidth / 2;
let hasGlucose = false;
let spawnInterval;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && playerX > 50) {
    playerX -= 40;
  } else if (e.key === "ArrowRight" && playerX < window.innerWidth - 100) {
    playerX += 40;
  }
  player.style.left = playerX + "px";
});

function spawnFalling() {
  const types = ["glucose", "oxygen", "toxin"];
  const type = types[Math.floor(Math.random() * types.length)];
  const el = document.createElement("div");
  el.classList.add("falling", type);
  el.style.left = Math.random() * (window.innerWidth - 50) + "px";
  el.innerText = type === "glucose" ? "G" : type === "oxygen" ? "O₂" : "X";

  let duration = 4 + Math.random() * 3;
  el.style.animationDuration = duration + "s";

  game.appendChild(el);

  let fallInterval = setInterval(() => {
    let elRect = el.getBoundingClientRect();
    let playerRect = player.getBoundingClientRect();

    if (
      elRect.bottom >= playerRect.top &&
      elRect.right >= playerRect.left &&
      elRect.left <= playerRect.right
    ) {
      if (type === "glucose") {
        hasGlucose = true;
        score += 5;
        health = Math.min(100, health + 5);
      } else if (type === "oxygen") {
        if (hasGlucose) {
          score += 30; // Combo bonus
          health = Math.min(100, health + 10);
          hasGlucose = false;
          scoreboard.classList.add("flash");
          setTimeout(() => scoreboard.classList.remove("flash"), 600);
        } else {
          score += 10;
          health = Math.min(100, health + 3);
        }
      } else if (type === "toxin") {
        score -= 10;
        health -= 20;
        hasGlucose = false;
      }

      scoreDisplay.innerText = score;
      healthBar.style.width = health + "%";

      // ✅ Check for full ATP
      if (score >= MAX_SCORE) {
        score = MAX_SCORE;
        endGame(true); // finished by full ATP
      }

      // ✅ Check for health loss
      if (health <= 0) {
        endGame(false); // finished by death
      }

      el.remove();
      clearInterval(fallInterval);
    }

    if (elRect.top > window.innerHeight) {
      el.remove();
      clearInterval(fallInterval);
    }
  }, 50);
}

function startGame() {
  gameOverScreen.style.display = "none";
  spawnInterval = setInterval(spawnFalling, 1500);
}

function endGame(finishedByScore = false) {
  clearInterval(spawnInterval);

  if (finishedByScore) {
    gameOverScreen.textContent = "🎉 ATP FULL! You can Finish now!";
  } else {
    gameOverScreen.textContent = "💀 Game Over! Respawn to Continue";
  }

  gameOverScreen.style.display = "block";
}

  function goBack() {
    window.location.href = "bio.html";
  }
function restartGame() {
  score = 0;
  health = 100;
  hasGlucose = false;
  scoreDisplay.innerText = score;
  healthBar.style.width = health + "%";
  gameOverScreen.style.display = "none";

  document.querySelectorAll(".falling").forEach(el => el.remove());

  clearInterval(spawnInterval);
  startGame();
}

// ✅ Finish button handler (always available)
async function finishTest() {
  clearInterval(spawnInterval);
  document.querySelectorAll(".falling").forEach(el => el.remove());

  // Calculate progress dynamically from score
  let progress = Math.min(100, Math.round((score / MAX_SCORE) * 100));

  const subject = "Biology";
  const gameName = "Mitochondria1";
  const username = sessionStorage.getItem("loggedInUser");

  // Save locally
  localStorage.setItem(`progress_${username}_${subject}_${gameName}`, progress);
  localStorage.setItem(`score_${username}_${subject}_${gameName}`, score);

  gameOverScreen.style.display = "block";
  gameOverScreen.textContent = `✅ Game Finished! Progress: ${progress}% | Score: ${score}`;

  // ✅ Upload only progress (DB doesn’t store score)
  await uploadProgress(subject, gameName, progress);
}

// ✅ Upload progress to backend
async function uploadProgress(subject, gameName, progress) {
  const username = sessionStorage.getItem("loggedInUser");
  if (!username) {
    alert("⚠️ Please log in before uploading progress.");
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        subject,
        gameName,
        progressPercent: progress
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Progress uploaded!\nProgress: ${progress}%`);
    } else {
      alert("❌ Upload failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("🚨 Server error. Please try again later.");
  }
}

startGame();
