'use strict';

// Canvas graphics implementation

var CANVAS_DATA = {
	colors: {
		menu_bkg: '#000000',
		menu_item: '#AAAAAA',
		menu_sel: '#FFFFAA',

		water: '#09374F',
		island: '#E1D6B2',

		p0: { // Red
			c0: 'hsl(  9,100%, 50%)',
			c1: 'hsl(  9, 50%, 20%)',
			c2: 'hsl(  9, 20%, 50%)',
		},
		p1: { // Blue
			c0: 'hsl(225,100%, 66%)',
			c1: 'hsl(225, 50%, 36%)',
			c2: 'hsl(225, 20%, 66%)',
		},
		p2: { // Green
			c0: 'hsl(128,100%, 32%)',
			c1: 'hsl(128, 50%, 22%)',
			c2: 'hsl(128, 20%, 42%)',
		},
		p3: { // Yellow
			c0: 'hsl( 47,100%, 50%)',
			c1: 'hsl( 47, 60%, 30%)',
			c2: 'hsl( 47, 50%, 70%)',
		}
	},

	island_size: 64,
	building_size: [40, 20],
	building_loc: [
		[[ 0,  0]],
		[[ 0, -1],
		 [ 0, +1]],
		[[-1, +1],
		 [+1, +1],
		 [ 0, -1]],
		[[-1, +1],
		 [+1, +1],
		 [-1, -1],
		 [+1, -1]],
		[[-1, +1],
		 [+1, +1],
		 [-1, -1],
		 [+1, -1],
		 [ 0, -3]]
	]
};

function CanvasUI() {
    var width = Math.max(window.innerWidth, 512);
    var height = Math.round(width * 9 / 16);
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    this.canvas = canvas;
    this.cxt = canvas.getContext('2d');
    this.width = width;
    this.height = height;
}

CanvasUI.prototype.drawMenu = function(time, menu) {
    var cxt = this.cxt;

    cxt.fillStyle = CANVAS_DATA.colors.menu_bkg;
    cxt.fillRect(0, 0, this.width, this.height);

    cxt.font = '48px Sans-Serif';
    for (var i = 0; i < menu.items.length; i++) {
        if (i == menu.selection) {
            cxt.fillStyle = CANVAS_DATA.colors.menu_sel;
            cxt.fillText('>', 20, 60 + 60 * i);
        } else {
            cxt.fillStyle = CANVAS_DATA.colors.menu_item;
        }
        cxt.fillText(menu.items[i].text, 60, 60 + 60*i);
    }
}

CanvasUI.prototype.drawGame = function(time, game) {
    var i;
    var cxt = this.cxt;
    var width = this.width, height = this.height;

    cxt.fillStyle = CANVAS_DATA.colors.water;
    cxt.fillRect(0, 0, this.width, this.height);

	cxt.save();
	var scale = this.width / 1280;
	cxt.scale(scale, scale);

    function enterIsland(island) {
        var loc = island.location;
        cxt.translate((loc[0] * 0.75 + 1) * (1280 / 2),
					  (-loc[1] * 0.75 + 1) * (720 / 2));
    }

	var clocs = {};
    for (i = 0; i < game.players.length; i++) {
        var player = game.players[i];
		var island = player.cursor.island;
		cxt.save();
		enterIsland(island);
		var cnum = clocs[island.index];
		if (cnum === undefined) {
			cnum = 0;
		}
		clocs[island.index] = cnum + 1;
        cxt.strokeStyle = CANVAS_DATA.colors['p' + i].c0;
		cxt.lineWidth = 3.0;
        cxt.beginPath();
        cxt.arc(0, 0, 64 * (1.1 + 0.1 * cnum),
				0, Math.PI*2, true);
        cxt.stroke();
		cxt.restore();
    }

	var bw = CANVAS_DATA.building_size[0],
		bh = CANVAS_DATA.building_size[1];
    for (i = 0; i < game.islands.length; i++) {
        var island = game.islands[i];
		cxt.save();
		enterIsland(island);
        cxt.fillStyle = CANVAS_DATA.colors.island;
        cxt.beginPath();
        cxt.arc(0, 0, 64, 0, Math.PI*2, true);
        cxt.fill();
		if (island.owner >= 0) {
			var col = CANVAS_DATA.colors['p' + island.owner];
			var j;
			if (island.buildings.length > 0) {
                var n = island.buildings.length;
				var bloc = CANVAS_DATA.building_loc[n-1];
				cxt.fillStyle = col.c2;
				cxt.strokeStyle = col.c1;
				cxt.lineWidth = 3.0;
				cxt.beginPath();
				for (j = 0; j < n; j++) {
					cxt.rect(
						bloc[j][0] * (bw/2 + 2) - bw/2,
						bloc[j][1] * (bh/2 + 2) - bh/2,
						bw, bh);
				}
				cxt.fill();
				cxt.stroke();
			}
			if (island.units.length > 0) {
				var n = island.units.length;
				cxt.fillStyle = col.c1;
				cxt.beginPath();
				for (j = 0; j < n; j++) {
					cxt.arc((j * 2 + 1 - n) * 9, 35, 8,
							0, Math.PI*2, true);
				}
				cxt.fill();
			}
			if (island.orders === null) {
			} else if (island.orders === 'move') {
				var loc1 = island.location;
				var loc2 = island.neighbors[island.direction].location;
				var dx = loc2[0] - loc1[0], dy = loc2[1] - loc1[1];
				var a = Math.atan2(dy, dx);
				cxt.save();
				cxt.lineWidth = 3.0;
				cxt.rotate(-a);
				cxt.translate(79, 0);
				cxt.beginPath();
				var xs = 8, ys = 9;
				cxt.moveTo(xs, 0);
				cxt.lineTo(-xs, ys);
				cxt.lineTo(-xs, -ys);
				cxt.closePath();
				if (island.unitCount > 0) {
					cxt.fillStyle = col.c1;
					cxt.strokeStyle = col.c2;
					cxt.fill();
					cxt.stroke();
				} else {
					cxt.strokeStyle = col.c1;
					cxt.stroke();
				}
				cxt.restore();
			} else {
				cxt.save();
				cxt.translate(56, 56);
				cxt.strokeStyle = col.c2;
				cxt.lineWidth = 3.0;
				cxt.beginPath();
				if (island.orders === 'build') {
					cxt.rect(-8, -8, 16, 16);
				} else if (island.orders == 'recruit') {
					cxt.arc(0, 0, 8, 0, Math.PI*2, true);
				}
				cxt.stroke();
				cxt.restore();
			}
		}
		cxt.restore();
    }

	cxt.restore();
}

CanvasUI.prototype.draw = function(time) {
    if (gMenu !== null) {
        this.drawMenu(time, gMenu);
    } else if (gGame !== null) {
        this.drawGame(time, gGame);
    }
}
