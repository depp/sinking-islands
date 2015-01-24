'use strict';

// Global game instance.
var gGame = null;

// Global menu instance.
var gMenu = null

// Main animation handle.
var gHandleId = 0;

// Global graphics instance.
var gGraphics = null;

// Timestamp for the last turn.
var gFrameTime = 0;

// The number of milliseconds between turn.
var TURN_TIME = 1000;

var KEYS = {
    '40': 'down',
    '38': 'up',
    '39': 'right',
    '37': 'left',
    '13': 'enter',
    '32': 'enter',
    '27': 'esc'
}

function main() {
    function startItem(n) {
        return {
            text: 'Start new game ' + n + 'P',
            func: function() { startGame(n); }
        }
    }
    gMenu = new Menu([
        startItem(2),
        startItem(3),
        startItem(4)
    ]);

    window.addEventListener('keydown', function (e) {
        var key = KEYS[e.keyCode];
        if (!key) {
            return;
        }
        e.preventDefault();
        if (gMenu !== null) {
            gMenu.keyDown(key);
        }
        return false;
    }, false);

    gGraphics = new CanvasUI();

    start();
}

function start() {
    if (gHandleId !== 0) {
        return;
    }
    function runFrame(time) {
        var delta;
        if (gFrameTime == 0) {
            gFrameTime = time;
            delta = 0;
        } else {
            if (time >= gFrameTime + TURN_TIME) {
                gFrameTime = Math.max(
                    gFrameTime + TURN_TIME,
                    time - TURN_TIME * 0.5);
                gGame.update();
            }
            delta = time - gFrameTime;
        }
        gHandleId = window.requestAnimationFrame(runFrame);
        gGraphics.draw(delta / TURN_TIME);
    }
    window.requestAnimationFrame(runFrame);
}

function stop() {
    if (gHandleId === 0) {
        return;
    }
    window.cancelAnimationFrame(gHandleId);
    gHandleId = 0;
}

function startGame(numPlayers) {
    var game = new Game();
    game.createIslands(6, 4);
    game.createPlayers(numPlayers);
    bindControls(game);
    gGame = game;
    gMenu = null;
}

function test() {
	startGame(4);
	gGame.testInit();
}
