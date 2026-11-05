const SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const opponent = (color) => (color === 'black' ? 'white' : 'black');

export function newGame() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  board[3][3] = 'white';
  board[4][4] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  return { board, turn: 'black', lastMove: null, passed: null, winner: null };
}

function flipsFor(board, color, row, col) {
  if (board[row]?.[col] !== null) return [];
  const flips = [];
  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let r = row + dr;
    let c = col + dc;
    while (board[r]?.[c] === opponent(color)) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length && board[r]?.[c] === color) flips.push(...line);
  }
  return flips;
}

export function legalMoves(board, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (flipsFor(board, color, r, c).length) moves.push([r, c]);
    }
  }
  return moves;
}

export function score(board) {
  const cells = board.flat();
  return {
    black: cells.filter((x) => x === 'black').length,
    white: cells.filter((x) => x === 'white').length,
  };
}

export function play(game, row, col) {
  if (game.winner) throw new Error('The game is over');
  const flips = flipsFor(game.board, game.turn, row, col);
  if (!flips.length) throw new Error('Illegal move');

  const board = game.board.map((line) => [...line]);
  for (const [r, c] of [[row, col], ...flips]) board[r][c] = game.turn;

  const next = { board, turn: opponent(game.turn), lastMove: [row, col], passed: null, winner: null };
  if (!legalMoves(board, next.turn).length) {
    if (legalMoves(board, game.turn).length) {
      next.passed = next.turn;
      next.turn = game.turn;
    } else {
      const { black, white } = score(board);
      next.winner = black === white ? 'draw' : black > white ? 'black' : 'white';
    }
  }
  return next;
}
