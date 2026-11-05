import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { newGame, play } from './othello.js';

const PORT = Number(process.env.PORT) || 3000;
const FILES = {
  '/': ['public/index.html', 'text/html'],
  '/client.js': ['public/client.js', 'text/javascript'],
  '/othello.js': ['othello.js', 'text/javascript'],
};

let game = newGame();
const seats = { black: null, white: null };
const listeners = new Set();

const snapshot = () => `data: ${JSON.stringify({ game, seats })}\n\n`;

async function readJson(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return JSON.parse(body);
}

const actions = {
  sit({ player, color }) {
    if (!(color in seats)) throw new Error('Unknown seat');
    if (seats[color] && seats[color] !== player) throw new Error('That seat is taken');
    seats[color] = player;
  },
  leave({ player, color }) {
    if (seats[color] === player) seats[color] = null;
  },
  move({ player, row, col }) {
    if (seats[game.turn] !== player) throw new Error("It's not your turn");
    game = play(game, row, col);
  },
  reset({ player }) {
    if (!Object.values(seats).includes(player)) throw new Error('Only seated players can restart');
    game = newGame();
  },
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.write(snapshot());
    listeners.add(res);
    req.on('close', () => listeners.delete(res));
    return;
  }

  const action = actions[pathname.slice(1)];
  if (req.method === 'POST' && action) {
    try {
      action(await readJson(req));
      for (const listener of listeners) listener.write(snapshot());
      res.writeHead(204).end();
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' }).end(error.message);
    }
    return;
  }

  const file = FILES[pathname];
  if (req.method === 'GET' && file) {
    res.writeHead(200, { 'Content-Type': file[1] });
    res.end(await readFile(new URL(file[0], import.meta.url)));
    return;
  }

  res.writeHead(404).end();
}).listen(PORT, () => {
  console.log(`Othello is running. Open one of these:`);
  console.log(`  http://localhost:${PORT}`);
  for (const addresses of Object.values(networkInterfaces())) {
    for (const { family, internal, address } of addresses) {
      if (family === 'IPv4' && !internal) console.log(`  http://${address}:${PORT}`);
    }
  }
});
