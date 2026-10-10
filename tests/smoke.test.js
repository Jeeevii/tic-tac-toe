const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createGame() {
  const elements = new Map();
  const makeElement = (dataset = {}) => ({
    dataset,
    textContent: "",
    className: "",
    disabled: false,
    attrs: {},
    handlers: {},
    classList: { toggle() {} },
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, handler) { this.handlers[name] = handler; },
    click() { this.handlers.click?.(); }
  });
  const cells = Array.from({ length: 9 }, () => makeElement());
  const modes = [makeElement({ mode: "computer" }), makeElement({ mode: "friend" })];
  for (const id of ["#status", "#score-x", "#score-o", "#score-draw", "#new-round", "#reset-scores", "#player-x-label", "#player-o-label"]) {
    elements.set(id, makeElement());
  }
  let timer = null;
  const context = vm.createContext({
    document: {
      querySelector(selector) { return elements.get(selector); },
      querySelectorAll(selector) { return selector === ".cell" ? cells : modes; }
    },
    window: {
      setTimeout(callback) { timer = callback; return 1; },
      clearTimeout() { timer = null; }
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8"), context);
  return { cells, modes, elements, flushComputer() { const callback = timer; timer = null; callback?.(); } };
}

test("two players can finish a round, score it, and start over", () => {
  const game = createGame();
  game.modes[1].click();
  [0, 3, 1, 4, 2].forEach(index => game.cells[index].click());
  assert.equal(game.elements.get("#status").textContent, "X wins! Nice one.");
  assert.equal(game.elements.get("#score-x").textContent, 1);
  assert.equal(game.cells[0].disabled, true);
  game.elements.get("#new-round").click();
  assert.equal(game.cells[0].textContent, "");
  assert.equal(game.elements.get("#score-x").textContent, 1);
});

test("computer takes a legal move and scores reset", () => {
  const game = createGame();
  game.cells[0].click();
  game.flushComputer();
  assert.equal(game.cells.filter(cell => cell.textContent === "O").length, 1);
  assert.equal(game.cells.filter(cell => cell.textContent === "X").length, 1);
  game.elements.get("#reset-scores").click();
  assert.equal(game.elements.get("#score-x").textContent, 0);
  assert.equal(game.cells.filter(cell => cell.textContent).length, 0);
});

test("switching modes cancels a pending computer move", () => {
  const game = createGame();
  game.cells[0].click();
  game.modes[1].click();
  game.flushComputer();
  assert.equal(game.cells.filter(cell => cell.textContent).length, 0);
  assert.equal(game.elements.get("#player-o-label").textContent, "PLAYER 2");
});
