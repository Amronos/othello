import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, legalMoves, play, score } from './othello.js';

const emptyBoard = () => Array.from({ length: 8 }, () => Array(8).fill(null));

test('black opens with four legal moves', () => {
  assert.deepEqual(legalMoves(newGame().board, 'black'), [[2, 3], [3, 2], [4, 5], [5, 4]]);
});

test('a move flips the outflanked disc and hands the turn over', () => {
  const game = play(newGame(), 2, 3);
  assert.equal(game.board[3][3], 'black');
  assert.equal(game.turn, 'white');
  assert.deepEqual(score(game.board), { black: 4, white: 1 });
});

test('the player keeps the turn when the opponent must pass', () => {
  const board = emptyBoard();
  board[0][0] = 'black';
  board[0][1] = 'white';
  board[7][0] = 'black';
  board[7][1] = 'white';
  const game = play({ board, turn: 'black', winner: null }, 0, 2);
  assert.equal(game.passed, 'white');
  assert.equal(game.turn, 'black');
});

test('the game ends when nobody can move', () => {
  const board = emptyBoard();
  board[0][0] = 'black';
  board[0][1] = 'white';
  const game = play({ board, turn: 'black', winner: null }, 0, 2);
  assert.equal(game.winner, 'black');
});
