const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];
const positions = ["Top left", "Top middle", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom middle", "Bottom right"];
const cells = [...document.querySelectorAll(".cell")];
const status = document.querySelector("#status");
const scores = { X: 0, O: 0, draw: 0 };
let board = Array(9).fill("");
let mode = "computer";
let turn = "X";
let finished = false;
let computerTimer = null;

function outcome(state) {
  for (const line of lines) {
    const [a, b, c] = line;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return { winner: state[a], line };
  }
  return state.every(Boolean) ? { winner: "draw", line: [] } : null;
}

function updateScores() {
  document.querySelector("#score-x").textContent = scores.X;
  document.querySelector("#score-o").textContent = scores.O;
  document.querySelector("#score-draw").textContent = scores.draw;
}

function render() {
  const result = outcome(board);
  cells.forEach((cell, index) => {
    cell.textContent = board[index];
    cell.className = "cell" + (board[index] ? ` ${board[index].toLowerCase()}` : "") + (result?.line.includes(index) ? " winner" : "");
    cell.disabled = finished || Boolean(board[index]) || (mode === "computer" && turn === "O");
    cell.setAttribute("aria-label", `${positions[index]}, ${board[index] || "empty"}${result?.line.includes(index) ? ", winning square" : ""}`);
  });
}

function move(index) {
  if (finished || board[index] || (mode === "computer" && turn === "O")) return;
  place(index, turn);
  if (!finished && mode === "computer") {
    computerTimer = window.setTimeout(() => {
      computerTimer = null;
      place(bestMove(), "O");
    }, 360);
  }
}

function place(index, player) {
  board[index] = player;
  const result = outcome(board);
  if (result) {
    finished = true;
    scores[result.winner] += 1;
    updateScores();
    status.textContent = result.winner === "draw" ? "It's a draw. Run it back?" : result.winner === "X" ? (mode === "computer" ? "You win! Nice one." : "X wins! Nice one.") : (mode === "computer" ? "Computer wins. Rematch?" : "O wins! Nice one.");
  } else {
    turn = player === "X" ? "O" : "X";
    status.textContent = mode === "computer" ? (turn === "X" ? "Your move, X." : "Computer is thinking…") : `${turn}'s move.`;
  }
  render();
}

function bestMove() {
  const open = board.map((value, index) => value ? -1 : index).filter(index => index !== -1);
  const score = (state, player, depth) => {
    const result = outcome(state);
    if (result) return result.winner === "O" ? 10 - depth : result.winner === "X" ? depth - 10 : 0;
    const values = state.map((value, index) => {
      if (value) return null;
      state[index] = player;
      const valueAtMove = score(state, player === "O" ? "X" : "O", depth + 1);
      state[index] = "";
      return valueAtMove;
    }).filter(value => value !== null);
    return player === "O" ? Math.max(...values) : Math.min(...values);
  };
  let choice = open[0];
  let highest = -Infinity;
  for (const index of open) {
    board[index] = "O";
    const value = score(board, "X", 0);
    board[index] = "";
    if (value > highest || (value === highest && index === 4)) {
      highest = value;
      choice = index;
    }
  }
  return choice;
}

function newRound() {
  if (computerTimer !== null) window.clearTimeout(computerTimer);
  computerTimer = null;
  board = Array(9).fill("");
  turn = "X";
  finished = false;
  status.textContent = mode === "computer" ? "Your move, X." : "X's move.";
  render();
}

cells.forEach((cell, index) => cell.addEventListener("click", () => move(index)));
document.querySelector("#new-round").addEventListener("click", newRound);
document.querySelector("#reset-scores").addEventListener("click", () => {
  scores.X = scores.O = scores.draw = 0;
  updateScores();
  newRound();
});
document.querySelectorAll(".mode-button").forEach(button => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  document.querySelectorAll(".mode-button").forEach(option => {
    const active = option === button;
    option.classList.toggle("active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#player-x-label").textContent = mode === "computer" ? "YOU" : "PLAYER 1";
  document.querySelector("#player-o-label").textContent = mode === "computer" ? "COMPUTER" : "PLAYER 2";
  scores.X = scores.O = scores.draw = 0;
  updateScores();
  newRound();
}));
render();
