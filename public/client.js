import { legalMoves, score } from '/othello.js';

const player = localStorage.player ??= crypto.randomUUID();
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetEl = document.getElementById('reset');
const name = (color) => color[0].toUpperCase() + color.slice(1);

async function send(action, body = {}) {
  const res = await fetch(`/${action}`, { method: 'POST', body: JSON.stringify({ player, ...body }) });
  if (!res.ok) statusEl.textContent = await res.text();
}

function renderPlayer(color, { game, seats }, counts) {
  const el = document.getElementById(color);
  const mine = seats[color] === player;
  el.className = `player${!game.winner && game.turn === color ? ' active' : ''}`;
  el.innerHTML = `
    <span class="chip ${color}"></span>
    <div>
      <div>${name(color)}</div>
      <div class="who">${mine ? 'You' : seats[color] ? 'Friend' : 'Empty seat'}</div>
    </div>
    <span class="count">${counts[color]}</span>`;
  if (mine || !seats[color]) {
    const button = document.createElement('button');
    button.textContent = mine ? 'Leave' : 'Sit';
    button.className = mine ? 'secondary' : '';
    button.onclick = () => send(mine ? 'leave' : 'sit', { color });
    el.querySelector('div').after(button);
  }
}

function statusText({ game, seats }, counts) {
  if (game.winner === 'draw') return `Draw, ${counts.black}–${counts.white}`;
  if (game.winner) return `${name(game.winner)} wins, ${counts.black}–${counts.white}`;
  const passNote = game.passed ? `${name(game.passed)} has no moves and passes. ` : '';
  if (seats[game.turn] === player) return `${passNote}Your move (${game.turn})`;
  if (!seats[game.turn]) return `${passNote}Waiting for someone to sit as ${name(game.turn)}`;
  return `${passNote}Waiting for ${name(game.turn)}…`;
}

function render(state) {
  const { game, seats } = state;
  const counts = score(game.board);
  const myTurn = !game.winner && seats[game.turn] === player;
  const legal = new Set(myTurn ? legalMoves(game.board, game.turn).map(([r, c]) => `${r},${c}`) : []);

  renderPlayer('black', state, counts);
  renderPlayer('white', state, counts);
  statusEl.textContent = statusText(state, counts);
  resetEl.hidden = !Object.values(seats).includes(player);

  boardEl.replaceChildren(...game.board.flatMap((line, r) => line.map((disc, c) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}${disc ? `, ${disc}` : ''}`);
    if (game.lastMove?.[0] === r && game.lastMove?.[1] === c) cell.classList.add('last');
    if (disc) cell.innerHTML = `<span class="chip ${disc}"></span>`;
    if (legal.has(`${r},${c}`)) {
      cell.classList.add('legal');
      cell.onclick = () => send('move', { row: r, col: c });
    } else {
      cell.disabled = true;
    }
    return cell;
  })));
}

resetEl.onclick = () => confirm('Start a new game?') && send('reset');
new EventSource('/events').onmessage = (event) => render(JSON.parse(event.data));
