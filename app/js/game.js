'use strict';

// List of all directions.
var DIRECTIONS = ['up', 'down', 'right', 'left'];

var OPPOSITE_DIRECTION = {
    'up': 'down',
    'down': 'up',
    'right': 'left',
    'left': 'right'
}

// List of all orders that can be given to islands.
var ORDERS = ['move', 'build', 'recruit']

// Convert (x, y) coordinates to a string.
function point(x, y) {
    return '' + x + ',' + y;
}

// Generate a random integer in a half-open range.
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

// The game state.
function Game() {
    // List of all islands in the game.
    this.islands = null;
    // List of all players in the game.
    this.players = null;
	// List of all units.
	this.units = [];
	// List of all buildings.
	this.buildings = [];
}

// Create a grid of islands.
Game.prototype.createIslands = function(width, height) {
    var x, y;
    var islands = [];
    var locs = {};
    if (width < 2) {
        width = 2;
    }
    if (height < 2) {
        height = 2;
    }
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            var island = new Island(
                islands.length,
                -1 + 2 * x / (width - 1),
                -1 + 2 * y / (height - 1));
            locs[point(x, y)] = island;
            islands.push(island);
        }
    }
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            var island = locs[point(x, y)];
            if (y < height - 1) {
                island.connect(locs[point(x,y+1)], 'up');
            }
            if (x < width - 1) {
                island.connect(locs[point(x+1,y)], 'right');
            }
        }
    }
    this.islands = islands;
}

// Set up a random game with lots of stuff.
Game.prototype.testInit = function() {
	var i;
	for (i = 0; i < this.islands.length; i++) {
		var island = this.islands[i];
		island.owner = randInt(-1, this.players.length);
        if (island.owner >= 0) {
            var j, n;
            n = randInt(0, 6);
            for (j = 0; j < n; j++) {
                island.units.push(new Unit());
            }
            n = randInt(0, 6);
            for (j = 0; j < n; j++) {
                island.buildings.push(new Building());
            }
    		island.giveRandomOrders();
        }
		island.defense = randInt(1, 100);
		island.sinkCounter = randInt(1, 100);
	}
}

// Create the players.
// depends on createIslands being called first.
Game.prototype.createPlayers = function(numPlayers) {
    var i;
    this.players = [];
    for (i = 0; i < numPlayers; i++) {
        this.players.push(new Player(i));
        this.players[i].cursor.island = this.islands[0];

    }
}

// Update unit movement and attacks.
Game.prototype.updateMove = function() {
	var i, j;
	// Gather all of the movement orders.
	var movement = [];
	for (i = 0; i < this.islands.length; i++) {
		var island = this.islands[i];
		var move = {
			owner0: island.owner,
            owner1: island.owner,
			target: -1,
			sources: [],
			force: island.units.length,
			alone: false,
			result: 'stand',
            unit: null
		};
        console.log(island);
		if (island.orders === 'move' && island.units.length > 0) {
			move.target = island.neighbors[island.direction].index;
			move.alone = (island.units.length === 1 &&
						  island.buildings.length === 0);
            move.result = null;
            move.unit = island.units[island.units.length - 1];
		}
		movement.push(move);
	}
	for (i = 0; i < movement.length; i++) {
		var move = movement[i];
		if (move.target >= 0) {
			movement[move.target].sources.push(i);
		}
	}
    var forces = [];
    for (i = 0; i < this.players.length; i++) {
        forces.push(0);
    }
    console.log(movement);
    // Loop until there is no more plain movement.
    var didMove;
    do {
        didMove = false;
        // Resolve ownership of unowned islands.
        for (i = 0; i < movement.length; i++) {
            var move = movement[i];
            if (move.owner1 >= 0 || move.sources.length == 0) {
                continue;
            }
            for (j = 0; j < forces.length; j++) {
                forces[j] = 0;
            }
            var src = move.sources;
            for (j = 0; j < src.length; j++) {
                var smove = movement[src[j]];
                forces[smove.owner0] += smove.force;
            }
            var winningForce = Math.max.apply(forces);
            var whoWon = -1;
            for (j = 0; j < forces.length; j++) {
                if (forces[j] != winningForce) {
                    break;
                }
                if (whoWon < 0) {
                    whoWon = j;
                } else {
                    whoWon = -1;
                    break;
                }
            }
            move.owner1 = whoWon;
        }
    	// Resolve movement.
        for (i = 0; i < movement.length; i++) {
            var move = movement[i];
            console.log('Move ' + i + ' ' + move.result)
            if (move.result !== null) {
                continue;
            }
            console.log('Unresolved move ' + i);
            var tmove = movement[move.target];
            if (move.owner0 == tmove.owner1) {
                console.log('Same owner');
                didMove = true;
                move.result = 'move';
            }
        }
        // Remove ownership from empty islands.
        for (i = 0; i < movement.length; i++) {
            var move = movement[i];
            if (move.result == 'move' && move.alone) {
                move.owner1 = -1;
            }
        }
    } while (didMove);
    // Reslove remaining actions.
    for (i = 0; i < movement.length; i++) {
        var move = movement[i];
        if (move.result === null) {
            var tmove = movement[move.target];
            if (tmove.owner1 < 0) {
                move.result = 'failmove';
            } else {
                move.result = 'attack';
            }
        }
    }
    // Make all units stand.
    for (i = 0; i < movement.length; i++) {
        var units = this.islands[i].units;
        for (j = 0; j < units.length; j++) {
            var unit = units[j];
            unit.state = 'stand';
            unit.relIsland = null;
            unit.oldIndex = j;
        }
    }
    // Apply movement and attacks to units.
    for (i = 0; i < movement.length; i++) {
        var move = movement[i];
        if (move.result == 'stand') {
            continue;
        }
        var island = this.islands[i];
        var tisland = this.islands[move.target];
        var units = island.units;
        var unit = move.unit;
        unit.state = move.result;
        switch (move.result) {
        case 'move':
            for (j = 0; j < units.length; j++) {
                if (units[j] === unit) {
                    units.splice(j, 1);
                    tisland.units.push(unit);
                    break;
                }
            }
            if (j == units.length) {
                console.log('movement failed');
                debugger;
            }
            unit.relIsland = island;
            break;
        case 'failmove':
            unit.relIsland = tisland;
            break;
        case 'attack':
            unit.relIsland = tisland;
            break;
        }
    }
}

// Run one turn of the game.
Game.prototype.update = function() {
    console.log('update');
    this.updateMove();
}

// Player class.
function Player(index) {
    // Unique identifier for the player (0..N-1).
    this.index = index;
    // Island that the player's cursor is pointing at.
    this.cursor = new Cursor();

    // Number of rocket parts that the player has (0..100).
    // Reaching 100 wins the game.
    this.rocketParts = 0;
}

// Island class.
function Island(index, x, y) {
    // Unique identifier for the island (0..N-1).
    this.index = index;
    // (x, y) visual location on the map, in the range -1..+1.
    this.location = [x, y];
    // The island's owner (0..N), or -1 if nobody owns it.
    this.owner = -1;
    // The units on this island
    this.units = [];
    // The buildings on this island.
    this.buildings = [];
    // The current orders for this island.
    this.orders = null;
	// If orders are to move, which direction?
	this.direction = null;
    // The island's neighboring islands.
    this.neighbors = {up:null, down:null, right:null, left:null};
    // The current defensive health of this island (0..100).
    // When this reaches 0, a unit or building on the island is destroyed,
    // and defense resets to 100.
    this.defense = 100;
    // How close the island is to sinking (0..100).  When this reaches 0, the
    // island sinks into the void.
    this.sinkCounter = 100;
}

Island.prototype.connect = function(other, dir) {
    var dir2 = OPPOSITE_DIRECTION[dir];
    if (this.neighbors[dir] !== null || other.neighbors[dir] !== null) {
        console.log("Cannot connect islands.");
        return;
    }
    this.neighbors[dir] = other;
    other.neighbors[dir2] = this;
}

Island.prototype.giveRandomOrders = function() {
    if (this.owner < 0) {
        this.orders = null;
        this.direction = null;
    } else {
    	this.orders = ORDERS[randInt(0, ORDERS.length)];
        if (this.orders == 'move') {
    		do {
    			this.direction = DIRECTIONS[randInt(0, DIRECTIONS.length)];
    		} while (this.neighbors[this.direction] === null);
        }
    }
}

// Possible states for a unit.
var UNIT_STATES = [
	// Do nothing.
	'stand',
	// Move from unit.relIsland.
	'move',
	// Attack unit.relIsland.
	'attack',
	// Attempt to move to unit.relIsland, but fail.
	'failmove',
	// Appear on screen.
	'recruit',
	// Disappear.
	'die'
];

// A unit.  Owned by an island.
function Unit() {
	// The unit's action this turn.
	this.state = 'stand';
	// The unit's target or source island.
	this.relIsland = null;
	// The slot index of the unit on the last turn.
	this.oldIndex = 0;
}

// Possible states for a building.
var BUILDING_STATES = [
	// Do nothing.
	'stand',
	// Appear on the island.
	'appear',
	// Disappear.
	'die'
];

// A building.  Tracks its state.
function Building() {
	// The building's state.
	this.state = 'stand';
}
