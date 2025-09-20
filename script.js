class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.gamesPlayed = 0;
    this.gamesAsWhite = 0;
    this.opponents = [];
    this.buchholz = 0;
    this.status = "ACTIVE";
    this.colorHistory = [];
  }
}

let players = [];
let currentRound = 1;
let matches = [];

// Add player
document.getElementById("addPlayerBtn").addEventListener("click", () => {
  const name = document.getElementById("playerName").value.trim();
  const id = document.getElementById("playerID").value.trim();

  if (!name || !id) return alert("Enter both name and ID!");
  if (players.some(p => p.id === id)) return alert("ID already exists!");

  players.push(new Player(id, name));
  updatePlayerList();

  if (players.length >= 2) {
    document.getElementById("tournament-section").style.display = "block";
  }
});

function updatePlayerList() {
  const ul = document.getElementById("playerList");
  ul.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} (${p.id})`;
    ul.appendChild(li);
  });
}

// Generate pairings
document.getElementById("pairingsBtn").addEventListener("click", () => {
  matches = [];
  let activePlayers = players.filter(p => p.status === "ACTIVE");

  // shuffle for first round
  if (currentRound === 1) {
    activePlayers.sort(() => Math.random() - 0.5);
  } else {
    activePlayers.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
  }

  // handle bye if odd number
  if (activePlayers.length % 2 !== 0) {
    let byePlayer = activePlayers.find(p => !p.hasReceivedBye);
    if (byePlayer) {
      byePlayer.score += 1;
      byePlayer.hasReceivedBye = true;
      alert(`${byePlayer.name} receives a bye`);
      activePlayers = activePlayers.filter(p => p.id !== byePlayer.id);
    }
  }

  for (let i = 0; i < activePlayers.length; i += 2) {
    matches.push({ white: activePlayers[i], black: activePlayers[i + 1] });
  }

  showPairings();
});

function showPairings() {
  const div = document.getElementById("pairings");
  div.innerHTML = "<h3>Pairings</h3>";
  matches.forEach((m, idx) => {
    div.innerHTML += `<p>${idx + 1}. ${m.white.name} (W) vs ${m.black.name} (B)</p>`;
  });

  const resDiv = document.getElementById("results");
  resDiv.innerHTML = "";
  matches.forEach((m, idx) => {
    resDiv.innerHTML += `
      <label>Match ${idx + 1} result:</label>
      <select data-idx="${idx}">
        <option value="">--select--</option>
        <option value="1">White wins</option>
        <option value="0">Black wins</option>
        <option value="0.5">Draw</option>
      </select>
      <br>
    `;
  });
}

// Process results & standings
document.getElementById("standingsBtn").addEventListener("click", () => {
  document.querySelectorAll("#results select").forEach(sel => {
    const idx = parseInt(sel.dataset.idx);
    const val = sel.value;
    if (val === "") return;

    let white = matches[idx].white;
    let black = matches[idx].black;
    let result = parseFloat(val);

    white.opponents.push(black.id);
    black.opponents.push(white.id);

    white.score += result;
    black.score += (1 - result);
    white.gamesPlayed++;
    black.gamesPlayed++;
  });

  calculateBuchholz();
  showStandings();
  currentRound++;
  document.getElementById("roundNum").textContent = currentRound;
});

function calculateBuchholz() {
  let scoreMap = {};
  players.forEach(p => scoreMap[p.id] = p.score);

  players.forEach(p => {
    let oppScores = p.opponents.map(id => scoreMap[id] || 0);
    oppScores.sort((a, b) => a - b);
    if (oppScores.length > 2) {
      oppScores = oppScores.slice(1, -1);
    }
    p.buchholz = oppScores.reduce((a, b) => a + b, 0);
  });
}

function showStandings() {
  const div = document.getElementById("standings");
  div.innerHTML = "<h3>Standings</h3>";

  let sorted = [...players].sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);

  let html = `<table>
    <tr><th>Rank</th><th>Name</th><th>Score</th><th>Buchholz</th><th>Status</th><th>ID</th></tr>`;
  sorted.forEach((p, idx) => {
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${p.name}</td>
      <td>${p.score.toFixed(1)}</td>
      <td>${p.buchholz.toFixed(1)}</td>
      <td>${p.status}</td>
      <td>${p.id}</td>
    </tr>`;
  });
  html += "</table>";

  div.innerHTML += html;
}
