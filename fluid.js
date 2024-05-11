window.onload = function() {
    this.particleSize = 5;
    this.restDensity = 1;
	this.stiffness = 1;
	this.bulkViscosity = 1;
	this.elasticity = 0;
	this.shearViscosity = 0;
	this.meltRate = 0;
	this.gravity = .05;
	this.smoothing = 1;

	var gui = new DAT.GUI();
	gui.add(this, "particleSize", 0, 100);
	gui.add(this, "restDensity", 0.1, 5.0);
	gui.add(this, "stiffness", 0, 1);
	gui.add(this, "bulkViscosity", 0, 1);
	gui.add(this, "elasticity", 0, 1);
	gui.add(this, "shearViscosity", 0, 1);
	gui.add(this, "meltRate", 0, 1);
	gui.add(this, "gravity", 0, 0.2);
	gui.add(this, "smoothing", 0, 1);

	//gee animation: https://github.com/georgealways/gee
	var g = new GEE({ context: '2d', fullscreen: true, container: document.body, fallback: function() {
			alert("You got no canvas!");
		}});
	console.log("hello");
	var ctx = g.ctx;

	//initialize
	var particles = [];
	var grid = [];
	for (i=0;i<100;i++) {
		for (j=0;j<100;j++) {
			particles.push(new Particle(i,j,0.1,0));
		}
	}
    
    var accelX = 0;
    var accelY = 0;
    window.addEventListener('deviceorientation', function(event) {
        accelX = gravity*event.gamma;
        accelY = gravity*event.beta;
    }, false);

	var minX = particles[0].x;
	var minY = particles[0].y;
	var maxX = minX;
	var maxY = minY;
	var gsizeY;
	var nodes = [];
	for (i=0,il=particles.length;i<il;i++) {
		var p = particles[i];
		if (p.x<minX) {
			minX = p.x;
		} else if (p.x>maxX) {
			maxX = p.x;
		}
		if (p.y<minY) {
			minY = p.y;
		} else if (p.y>maxY) {
			maxY = p.y;
		}
	}

	minX = Math.floor(minX-1);
	minY = Math.floor(minY-1);
	maxX = Math.floor(maxX+3);
	maxY = Math.floor(maxY+3);

    var clearLeft;
    var clearRight;
    var clearTop;
    var clearBottom;
    
    var wx = window.screenX;
    var wy = window.screenY;
	g.draw = function() {
		var bx = g.width/particleSize-1;
		var by = g.height/particleSize-1;
		console.log(nodes.length);
		grid.length = 0;
		gsizeY = Math.floor(maxY-minY);

		var activeCount = 0;
        
        var wdx = (window.screenX-wx)/particleSize;
        var wdy = (window.screenY-wy)/particleSize;
        wx = window.screenX;
        wy = window.screenY;
		for (var pi = 0, il = particles.length; pi < il; pi++) {
			var p = particles[pi];
			p.cx = Math.floor(p.x-minX - 0.5);
			p.cy = Math.floor(p.y-minY - 0.5);
			p.gi = p.cx*gsizeY+p.cy;

			var x = p.cx - (p.x-minX);
			p.px[0] = (0.5 * x * x + 1.5 * x + 1.125);
			p.gx[0] = (x++ + 1.5);
			p.px[1] = (-x * x + 0.75);
			p.gx[1] = (-2.0 * (x++));
			p.px[2] = (0.5 * x * x - 1.5 * x + 1.125);
			p.gx[2] = (x - 1.5);

			var y = p.cy - (p.y-minY);
			p.py[0] = (0.5 * y * y + 1.5 * y + 1.125);
			p.gy[0] = (y++ + 1.5);
			p.py[1] = (-y * y + 0.75);
			p.gy[1] = (-2.0 * (y++));
			p.py[2] = (0.5 * y * y - 1.5 * y + 1.125);
			p.gy[2] = (y - 1.5);

			for (var i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
                var pgxi = p.gx[i];
				for (var j = 0; j < 3; j++) {
					var gaj = ga+j;
					var n = grid[gaj];
					if (n === undefined) {
                        grid[gaj] = n = new Node();
                        activeCount++;
					}
					phi = pxi * p.py[j];
					n.m += phi;
					n.gx += pgxi * p.py[j];
					n.gy += pxi * p.gy[j];
				}
			}
		}

		for (var pi = 0, il = particles.length; pi < il; pi++) {
			var p = particles[pi];
			var density = 0;
			for (var i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
				for (var j = 0; j < 3; j++) {
					var n = grid[ga+j];
					var phi = pxi * p.py[j];
					density += phi*n.m;
				}
			}
			var pressure = (density-restDensity)/restDensity;
			if (pressure > 4.0)
				pressure = 4.0;

			var fx = 0, fy = 0;
			if (p.x<2) {
				fx += 2-p.x;
                p.u *= 0.1;
			} else if (p.x>bx) {
				fx += bx-p.x;
                p.u *= 0.1;
			}
			if (p.y<2) {
				fy += 2-p.y;
                p.v *= 0.1;
			} else if (p.y>by) {
				fy += by-p.y;
                p.v *= 0.1;
			}

			for (var i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
                var gxi = p.gx[i];
				for (var j = 0; j < 3; j++) {
					var n = grid[ga+j];
					phi = pxi * p.py[j];
					n.ax += -((gxi * p.py[j]) * pressure) + fx * phi;
					n.ay += -((pxi * p.gy[j]) * pressure) + fy * phi;
				}
			}
		}

		for (var i in grid) {
			var n = grid[i];
			if (n.m > 0.0) {
				n.ax /= n.m;
				n.ay /= n.m;
				//n.ay += gravity;
                n.ax += accelX;
                n.ay += accelY;
			}
		}

		for (var pi = 0, il = particles.length; pi < il; pi++) {
			var p = particles[pi];
			for (var i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
				for (var j = 0; j < 3; j++) {
					var n = grid[ga+j];
					phi = pxi * p.py[j];
					p.u += phi*n.ax;
					p.v += phi*n.ay;
				}
			}
			for (var i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
				for (var j = 0; j < 3; j++) {
					var n = grid[ga+j];
					phi = pxi * p.py[j];
					n.u += phi*p.u;
					n.v += phi*p.v;
				}
			}
		}

		for (var i in grid) {
			var n = grid[i];
			if (n.m > 0.0) {
				n.u /= n.m;
				n.v /= n.m;
			}
		}

		minX = particles[0].x;
		minY = particles[0].y;
		maxX = minX;
		maxY = minY;
		for (var pi = 0, il = particles.length; pi < il; pi++) {
			var p = particles[pi];
			var gu = 0, gv = 0;
			for (i = 0; i < 3; i++) {
				var ga = p.gi+i*gsizeY;
                var pxi = p.px[i];
				for (j = 0; j < 3; j++) {
					var n = grid[ga+j];
					phi = pxi * p.py[j];
					gu += phi*n.u;
					gv += phi*n.v;
				}
			}
			p.x += gu-wdx;
			p.y += gv-wdy;
			p.u += smoothing*(gu-p.u);
			p.v += smoothing*(gv-p.v);
			p.gu = gu;
			p.gv = gv;

			if (p.x<minX) {
				minX = p.x;
			} else if (p.x>maxX) {
				maxX = p.x;
			}
			if (p.y<minY) {
				minY = p.y;
			} else if (p.y>maxY) {
				maxY = p.y;
			}
		}

		minX = Math.floor(minX-1);
		minY = Math.floor(minY-1);
		maxX = Math.floor(maxX+3);
		maxY = Math.floor(maxY+3);
			ctx.clearRect(clearLeft-1,clearTop-1,clearRight-clearLeft+2,clearBottom-clearTop+2);
            clearLeft = particles[0].x;
    	    clearTop = particles[0].y;
            clearRight = clearLeft;
            clearBottom = clearTop;
            ctx.lineWidth = .5;
			ctx.beginPath();
			for (i=0,il=particles.length;i<il;i++) {
				var p = particles[i];
                var x1 = p.x*particleSize;
                var y1 = p.y*particleSize;
                var x2 = (p.x-p.gu)*particleSize;
                var y2 = (p.y-p.gv)*particleSize;
                ctx.moveTo(x1,y1);
    			ctx.lineTo(x2,y2);
                if (x1<clearLeft) {
                    clearLeft = x1;   
                } else if (x1>clearRight) {
                    clearRight = x1;   
                }
                if (x2<clearLeft) {
                    clearLeft = x2;   
                } else if (x2>clearRight) {
                    clearRight = x2;   
                }
                if (y1<clearTop) {
                    clearTop = y1;   
                } else if (y1>clearBottom) {
                    clearBottom = y1;   
                }
                if (y2<clearTop) {
                    clearTop = y2;   
                } else if (y2>clearBottom) {
                    clearBottom = y2;   
                }
			}
			ctx.stroke();
	};
	g.mousedrag = function() {
		with (g) {
		}
	};
	g.mousedown = function() {
		with (g) {
		}
	};
	g.mouseup = function() {
		with (g) {
		}
	};
}
function Particle(x, y, u, v) {
	this.x = x;
	this.y = y;
	this.u = u;
	this.v = v;
	this.gu = u;
	this.gv = v;

	this.dudx = 0;
	this.dudy = 0;
	this.dvdx = 0;
	this.dvdy = 0;
	this.cx = 0;
	this.cy = 0;
	this.gi = 0;

	this.px = [0,0,0];
	this.py = [0,0,0];
	this.gx = [0,0,0];
	this.gy = [0,0,0];
}

function Node() {
	this.m = 0;
	this.d = 0;
	this.gx = 0;
	this.gy = 0;
	this.u = 0;
	this.v = 0;
	this.ax = 0;
	this.ay = 0;
}
