var express = require('express');
var app = express();
var timer = 0;
var ip_list = [];
var ip_dic = {};
var infolist = {};
var dimensions = {};

function speed(name) {
	switch (name) {
	case 'none':
		return 0;
	case 'low':
		return 4;
	case 'normal':
	default:
		return 8;
	case 'high':
		return 14;
	}
}

var classes = require('./tanks.json');
var config = require('./config.json');

function inArray(value, array) {
	return array.indexOf(value) > -1;
}
var serv = require('http').Server(app);

serv.listen(config.port);
console.log('Server started on port', config.port)

var namelist = {};
var arenasize = [1500, 1500]

var SOCKET_LIST = {};
var spawn_width = arenasize[0];
var spawn_height = arenasize[1];

var Entity = function() {
	var self = {
		x: 250,
		y: 250,
		spdX: 0,
		spdY: 0,
		id: ''
	}

	self.update = function() {
		self.updatePosition();
	}

	self.updatePosition = function() {

		if (Player.list[self.id]) {
			if (Player.list[self.id].tank == 'drifter') {
				self.spdX *= 0.98;
				self.spdY *= 0.98;
			} else if (Player.list[self.id].tank == 'frictionless') {
				self.spdX *= 1.009;
				self.spdY *= 1.009;
			} else {
				self.spdX *= 0.92;
				self.spdY *= 0.92;
			}
		}
		self.x += self.spdX;
		self.y += self.spdY;

	}

	self.getDistance = function(pt) {
		return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
	}

	return self;

}

var Bullet = function(parent, angle) {
	angle += (Math.random() * 5) + 1;
	angle -= (Math.random() * 5) + 1;
	var self = Entity();
	self.hp = 10;
	self.parent = parent;
	self.id = Math.random();
	if (self.parent) {
		if (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid') {
			self.spdX = Math.cos(angle / 180 * Math.PI) * 13;
			self.spdY = Math.sin(angle / 180 * Math.PI) * 13;
		} else if (infolist[self.parent].tank == 'sniper') {
			self.spdX = Math.cos(angle / 180 * Math.PI) * 35;
			self.spdY = Math.sin(angle / 180 * Math.PI) * 35;

		} else if (infolist[self.parent].tank == 'quadfighter') {
			self.spdX = Math.cos(angle / 180 * Math.PI) * 30;
			self.spdY = Math.sin(angle / 180 * Math.PI) * 30;
		} else {
			self.spdX = Math.cos(angle / 180 * Math.PI) * 20;
			self.spdY = Math.sin(angle / 180 * Math.PI) * 20;
		}

	}

	self.toRemove = false;
	self.timer = 0;

	var super_update = self.update;
	self.update = function() {
		var lasting = infolist[self.parent].tank === "sniper" ? 60 : infolist[self.parent].tank === "Unsniper" ? 10 : infolist[self.parent].tank === "Streamliner" ? 15 : 30
		if (self.timer > lasting) {
			self.toRemove = true;
		}
		super_update();

		for (var i in Bullet.list) {
			var b = Bullet.list[i];
			if (self.getDistance(b) < 12 && self.id !== b.id && (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid' || infolist[self.parent].tank == 'sniper')) {
				b.toRemove = true;
			} else if (self.getDistance(b) < 12 && self.id !== b.id && infolist[self.parent].tank != 'destroyer') {
				self.toRemove = true;
				b.toRemove = true;
			}

		}

		for (var i in Shape.list) {
			var s = Shape.list[i];

			if (self.getDistance(s) < 23) {
				//console.log('distance');
				if (infolist[self.parent].tank == 'Arena Closer') {
					s.hp -= 10000;
				} else if (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid') {
					s.hp -= 12;
				} else if (infolist[self.parent].tank == 'Annihilator') {
					s.hp -= 16;
				} else if (infolist[self.parent].tank == 'Streamliner') {
					s.hp -= 1;
				} else {
					s.hp -= 4;
				}
				if (s.hp <= 0) {
					if (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid' || infolist[self.parent].tank == 'sniper') {

					} else {
						self.toRemove = true;
					}
					s.toRemove = true;
					if (Player.list[self.parent]) {
						Player.list[self.parent].score += s.score;
					}
				}
			}

		}

		for (var i in Player.list) {
			var p = Player.list[i];

			if (p.hp < p.hpMax && p.regen_timer > 10) {
				p.hp += p.hpMax / 500;
				if (p.hp > p.hpMax || p.hp == p.hpMax) {
					p.hp = p.hpMax;
				};
			};
			var notsameteam = self.parent_team == "none" || p.team == "none" ? true : self.parent_team !== p.team
			if (self.getDistance(p) < 32 && self.parent !== p.id) {
				console.log('Here it is: ' + infolist[self.parent].tank)
				p.regen_timer = 0;

				if (infolist[self.parent].tank == 'healthsteal') { // special healthstealing hax
					Player.list[self.parent].hp += 4;
				}

				if (infolist[self.parent].tank == 'Arena Closer') {
					p.hp -= 10000;
				} else if (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid') {
					p.hp -= 12;
				} else if (infolist[self.parent].tank == 'Annihilator') {
					p.hp -= 16;
				} else if (infolist[self.parent].tank == 'Streamliner') {
					p.hp -= 1;
				} else {
					p.hp -= 4;
				}
				if (p.hp <= 0) {
					var shooter = Player.list[self.parent];
					if (shooter) {

						shooter.score += p.score;
					}
					p.hp = p.hpMax;
					p.score = Math.round(p.score / 2 - (Math.random()));
					p.tank = 'basic';
					infolist[p.id].tank = 'basic';
					p.x = Math.random() * spawn_width;
					p.y = Math.random() * spawn_height;
					/*io.sockets.emit('killNotification',{
					    killer: shooter.id,
					    killed: namelist[p.id],
					    id: self.parent.id
					});*/
					io.sockets.emit('death', {
						id: p.id
					})

				}

				self.toRemove = true;
			}
		}

	}

	self.getInitPack = function() {
		return {
			id: self.id,
			parent_tank: infolist[self.parent].tank,
			parent_id: self.parent,
		};

	}

	self.getUpdatePack = function() {
		return {
			id: self.id,
			x: self.x,
			y: self.y,
			parent_tank: infolist[self.parent].tank,
			parent_id: self.parent.id

		};

	}

	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;

};
Bullet.list = {};

Bullet.update = function() {

	var pack = [];

	for (var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.update();
		if (bullet.toRemove) {
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else {
			pack.push(bullet.getUpdatePack());
		}
	}

	return pack;
}

Bullet.getAllInitPack = function() {
	var bullets = [];
	for (var i in Bullet.list) {
		bullets.push(Bullet.list[i].getInitPack());
	}
	//console.log(bullets.length);
	return bullets;
}

//  var Shaped = Shape(Math.random());

var pointawards = {
	'square': {
		score: 10,
		color: '#FEE769',
		hp: 1
	},
	'pentagon': {
		score: 130,
		color: '#7790F9',
		hp: 15
	},
	'triangle': {
		score: 25,
		color: '#F97779',
		hp: 3
	},
	'alphapentagon': {
		score: 4000,
		color: '#7790F9',
		hp: 750
	}
};

var Shape = function(id) {
	//console.log('ID' + id);
	var self = Entity();
	self.id = id;
	self.type = Math.random() > 0.25 ? 'square' : Math.random() < 0.85 ? 'triangle' : Math.random() > 0.98 ? 'alphapentagon' : 'pentagon';
	self.colorname = Math.random() > 0.999999 ? 'green' : 'normal-colored'
	self.color = self.colorname == 'green' ? '#8DFD71' : pointawards[self.type].color;
	self.name = self.type
	self.toRemove = false;
	self.score = pointawards[self.type].score;
	self.size = 0;
	self.regen_timer = 0;
	self.x = Math.random() * arenasize[0];
	self.y = Math.random() * arenasize[1];
	self.hpMax = pointawards[self.type].hp;
	self.hp = pointawards[self.type].hp;
	self.angle = Math.random() * 360;
	self.spdX = Math.cos(self.angle / 180 * Math.PI) * 0.18;
	self.spdY = Math.sin(self.angle / 180 * Math.PI) * 0.18;

	var super_update = self.update;
	self.update = function() {
		super_update();

		self.x = self.x < 0 ? 0 : self.x;
		self.y = self.y < 0 ? 0 : self.y;
		self.x = self.x > arenasize[0] ? arenasize[0] : self.x;
		self.y = self.y > arenasize[1] ? arenasize[1] : self.y;

		for (var i in Shape.list) {
			var s = Shape.list[i];

			if (self.getDistance(s) < 40 && s.id != self.id && s.type == 'pentagon') {
				console.log('distance');
				s.hp = -1000;
				s.toRemove = true;

			} else if (self.getDistance(s) < 23 && s.id != self.id) {
				console.log('distance');
				s.hp = -1000;
				s.toRemove = true;
			}

		}
	}

	self.getInitPack = function() {
		return {
			id: self.id,
			x: self.x,
			y: self.y,
			hp: self.hp,
			hpPercent: self.hp / self.hpMax,
			name: self.type,
			angle: self.angle,
			color: self.color,
			colorname: self.color,
			size: self.size
		};

	}

	self.getUpdatePack = function(player) {
		var player_x = player.x;
		var player_y = player.y;
		var screen_width = dimensions[player.id + 'width'];
		var screen_height = dimensions[player.id + 'height'];
		if (Math.abs(player.x - self.x) < screen_width && Math.abs(player.y - self.y) < screen_height) {
			return {
				id: self.id,
				x: self.x,
				y: self.y,
			};
		} else {

			return false;

		}
	}

	Shape.list[id] = self;
	initPack.shape.push(self.getInitPack());
	return self;

};

Shape.list = {};

Shape.update = function() {
	var master_pack = {};

	for (var i in Player.list) {
		var player = Player.list[i];
		var pack = [];
		for (var i in Shape.list) {
			var shape = Shape.list[i];
			shape.update();
			if (shape.toRemove) {
				delete Shape.list[i];
				removePack.shape.push(shape.id);
			} else {
				if (shape.getUpdatePack(player)) {
					pack.push(shape.getUpdatePack(player));
				}
			}
		}

		master_pack[player.id] = pack;
		//console.log(master_pack[player.id]);
	}
	return master_pack;
}

Shape.getAllInitPack = function() {
	var shapes = [];
	for (var i in Shape.list) {
		shapes.push(Shape.list[i].getInitPack());
	}
	//console.log(shapes.length);
	return shapes;

}

var Player = function(id) {

	var self = Entity();
	self.backtoZero = false;
	self.tier = 4;
	self.hasUpgraded = false;
	self.canUpgrade = true;
	self.hasSecondUpgraded = false
	self.hasThirdUpgraded = false;
	self.dev = false;
	self.id = id;
	self.name = namelist[self.id];
	self.tank = self.dev ? 'Arena Closer' : 'basic'; //infolist[self.id].tank
	self.number = "" + Math.floor(10 * Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingInc = false;
	self.pressingDec = false;
	self.team = 'none';
	self.teamcolor = {
		"red": "F14E54",
		"blue": "1DB2DF",
		"purple": "#BE83F2",
		"green": "#24DF73"
	}[self.team];
	self.autofire = false;
	self.mouseAngle = 0;
	self.invisible = false; //infolist[self.id].tank === "Invis" ? true : false;
	self.maxSpd = infolist[self.id].tank === "Quad quadfighter" ? 12 : 8;
	self.hpMax = infolist[self.id].tank === "Weighted" ? 50 : infolist[self.id].tank == 'Latoonia Tank' ? 25 : infolist[self.id].tank === "Arena Closer" ? 10001 : 10;
	self.hp = self.hpMax;
	self.x = Math.random() * spawn_width;
	self.y = Math.random() * spawn_height;
	self.regen_timer = 0;
	self.score = 0;
	self.reload = 0;
	self.reload_timer = 0;
	self.autospin = false;
	self.vX = 0;
	self.vY = 0;

	var super_update = self.update;
	self.update = function() {
		self.updateSpd();
		super_update();

		/* for (var i in Player.list){
		    var p = Player.list[i];
		        if (self.tank == "quadfighter" && p.id != self.id){
		            if (self.getDistance(p)<25){
		                p.hp -=0.5;
		            }
		        }

		        };*/

		//if (infolist[self.id].tank !== "Borderless"){
		self.spdX = self.x < 0 ? 0 : self.spdX;
		self.x = self.x < 0 ? 0 : self.x;
		self.spdY = self.y < 0 ? 0 : self.spdY;
		self.y = self.y < 0 ? 0 : self.y;
		self.spdY = self.y < 0 ? 0 : self.spdY;
		self.x = self.x > arenasize[0] && !(self.y > 90 && self.y < 130 && self.tank == "Arena Closer") ? arenasize[0] : self.x;
		self.spdY = self.y > arenasize[1] ? 0 : self.spdY;
		self.y = self.y > arenasize[1] ? arenasize[1] : self.y;

		//};

		if ((self.pressingAttack && self.reload_timer > 10) || (self.autofire && self.reload_timer > 10)) {
			self.reload_timer = 0;
			//console.log('SLIST:'  + Shape.list);
			self.shootBullet(self.mouseAngle);
			self.reload_timer = self.tank === "machine" ? 5 : self.tank === "Streamliner" ? 9 : self.tank === "sniper" ? -17 : 0;
		}

	}

	self.shootBullet = function(angle) {
		if (['smasher', 'twin','landmine','spike','autosmasher','dasher','unstoppable','drifter'].indexOf(self.tank) == -1){
		var b = Bullet(self.id, angle, self.team);
		b.x = self.x - 10;
		b.y = self.y;}
		if (self.tank === "quad") {
			var cr = Bullet(self.id, angle + 180, self.team);
			cr.x = self.x - 10;
			cr.y = self.y;
			var vr = Bullet(self.id, angle + 270, self.team);
			vr.x = self.x - 10;
			vr.y = self.y;
			var er = Bullet(self.id, angle + 90, self.team);
			er.x = self.x - 10;
			er.y = self.y;
		}
		if (self.tank === "quadfighter") {
			var cr = Bullet(self.id, angle + 180, self.team);
			cr.x = self.x - 10;
			cr.y = self.y;
			var vr = Bullet(self.id, angle + 240, self.team);
			vr.x = self.x - 10;
			vr.y = self.y;
			var er = Bullet(self.id, angle + 120, self.team);
			er.x = self.x - 10;
			er.y = self.y;
		}
		if (self.tank === "twin") {
			var b1 = Bullet(self.id, angle, self.team);
			b1.x = self.x - 10;
			b1.y = self.y + 5;
				var b2 = Bullet(self.id, angle, self.team);
				b2.x = self.x - 10;
				b2.y = self.y - 5;
		}
		if (self.tank === "flank" || self.tank === "destroyerflank") {
			setTimeout(function() {
				var cr = Bullet(self.id, angle + 180, self.team);
				cr.x = self.x - 10;
				cr.y = self.y;

			}, 150);
		}
		if (self.tank === "octo") {
			var cr = Bullet(self.id, angle + 180, self.team);
			cr.x = self.x - 10;
			cr.y = self.y;
			var vr = Bullet(self.id, angle + 270, self.team);
			vr.x = self.x - 10;
			vr.y = self.y;
			var er = Bullet(self.id, angle + 90, self.team);
			er.x = self.x - 10;
			er.y = self.y;
			setTimeout(function() {
				var ar = Bullet(self.id, angle + 45, self.team);
				ar.x = self.x - 10;
				ar.y = self.y;
				var rr = Bullet(self.id, angle + 135, self.team);
				rr.x = self.x - 10;
				rr.y = self.y;
				var ur = Bullet(self.id, angle + 225, self.team);
				ur.x = self.x - 10;
				ur.y = self.y;
				var nr = Bullet(self.id, angle + 315, self.team);
				nr.x = self.x - 10;
				nr.y = self.y;
			}, 150);
		}
		if (self.tank === "trishot") {
			var cr = Bullet(self.id, angle + 45, self.team);
			cr.x = self.x - 10;
			cr.y = self.y;
			var vr = Bullet(self.id, angle - 45, self.team);
			vr.x = self.x - 10;
			vr.y = self.y;
		}
		if (self.tank === "horizon") {
			var cr = Bullet(self.id, angle + 45, self.team);
			cr.x = self.x - 10;
			cr.y = self.y;
			var vr = Bullet(self.id, angle - 45, self.team);
			vr.x = self.x - 10;
			vr.y = self.y;
			var nr = Bullet(self.id, angle + 22, self.team);
			nr.x = self.x - 10;
			nr.y = self.y;
			var dr = Bullet(self.id, angle - 22, self.team);
			dr.x = self.x - 10;
			dr.y = self.y;
		}
	}

	self.updateSpd = function() {
		if (self.pressingRight && self.spdX < self.maxSpd) { self.spdX++; }
		if (self.pressingLeft && self.spdX > -self.maxSpd) { self.spdX--; }
		if (self.pressingUp && self.spdY > -self.maxSpd) { self.spdY--; }
		if (self.pressingDown && self.spdY < self.maxSpd) { self.spdY++ }
	}

	self.getInitPack = function() {
		return {
			id: self.id,
			x: self.x,
			y: self.y,
			number: self.number,
			hp: self.hp,
			hpMax: self.hpMax,
			score: self.score,
			name: self.name,
			mouseAngle: self.mouseAngle,
			invisible: self.invisible,
			tank: self.tank,
			team: self.team,
			teamcolor: self.teamcolor,
			autospin: self.autospin
		};

	}

	self.getUpdatePack = function() {
		return {
			tank: self.tank,
			id: self.id,
			x: self.x,
			y: self.y,
			hp: self.hp,
			score: self.score,
			mouseAngle: self.mouseAngle,
		};

	}

	Player.list[id] = self;
	initPack.player.push(self.getInitPack());
	return self;

}

Player.list = {};

Player.onConnect = function(socket) {

	var player = Player(socket.id);

	socket.on('keyPress', function(data) {
		if (data.inputId === 'left')
			player.pressingLeft = data.state;
		else if (data.inputId === 'right')
			player.pressingRight = data.state;
		else if (data.inputId === 'up')
			player.pressingUp = data.state;
		else if (data.inputId === 'down')
			player.pressingDown = data.state;
		else if (data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if (data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
		else if (data.inputId === 'inc')
			player.pressingInc = data.state;
		else if (data.inputId === 'dec')
			player.pressingDec = data.state;
		//Player.list[socket.id].mouseAngle = data.state;
		else if (data.inputId === 'auto')
			player.autofire = player.autofire ? false : true;
		else if (data.inputId === 'spin') {
			player.autospin = player.autospin ? false : true;
		}

	});

	Player.getAllInitPack = function() {
		var players = [];
		for (var i in Player.list) {
			players.push(Player.list[i].getInitPack());
		}
		//console.log(players.length);
		return players;
	}

	//console.log(socket.id);

	socket.emit('init', {
		selfId: socket.id,
		player: Player.getAllInitPack(),
		bullet: Bullet.getAllInitPack(),
		shape: Shape.getAllInitPack(),
	});
}

Player.onDisconnect = function(socket) {
	console.log('HERE IS THE IP LIST: ' + ip_list);
	console.log('disconnection');
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
	console.log('removed');
	var index_of = ip_list.indexOf(ip_dic[socket.id]);
	if (index_of > -1) {
		console.log('IP found at ' + String(index_of));
		ip_list.splice(index_of, 1);
	}
	delete ip_dic[socket.id];
	console.log('removed ip addressses');
	console.log('HERE IS THE IP LIST AFTER: ' + ip_list);
	console.log('HERE IS THE IP DICTIONARY AFTER: ' + ip_dic);

}

Player.update = function() {

	var pack = [];

	for (var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}

	return pack;
}

var USERS = {
	//username:password

	"bob": "asd",
	"b": "b",
	"time": "lol",
	"": "",

}

var isValidPassword = function(data, cb) {
	setTimeout(function() {
		cb(USERS[data.username] === data.password);
	}, 10);
}

var isUsernameTaken = function(data, cb) {
	setTimeout(function() {
		cb(USERS[data.username]);
	}, 10);
}

var addUser = function(data, cb) {
	setTimeout(function() {
		USERS[data.username] = data.password;
		cb();
	}, 10);
}

var io = require('socket.io')(serv, {});

function sendClasses() {
	classes = require('./tanks.json');
	io.emit('tanks_update', classes);
}

io.sockets.on('connection', function(socket) {
	sendClasses();
	//console.log(socket);

	console.log('connection');

	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('disconnect', function() {
		console.log('disconnection');

		Player.onDisconnect(socket);
		delete SOCKET_LIST[socket.id];

	});

	function randInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	socket.on('upgrade', function(data) {
		try {
			if (classes[Player.list[socket.id].tank].upgrades == undefined) {
				console.log(`Couldn't upgrade "${Player.list[socket.id].name}" because there are no upgrades.`)
			} else {
				var upgrades = classes[Player.list[socket.id].tank].upgrades;
				var choice = Object.keys(upgrades)[data.pos];

				if (classes[choice] == undefined) {
					console.log(`Couldn't upgrade "${Player.list[socket.id].name}" to that tank because it doesn't exist.`)
				} else {
					console.log(`Upgrade data: player data is ${Player.list[socket.id]}, upgrade offset is ${data.pos}, tank internal name is ${choice}, localized tank name is ${classes[choice].localized}.`)

					if (Player.list[socket.id].tier >= Object.values(upgrades)[data.pos]) {
						console.log(`Upgraded "${Player.list[socket.id].name}" to tank ${classes[choice].localized}.`)
						Player.list[socket.id].tank = choice;
						infolist[socket.id].tank = choice;
					} else {
						console.log(`Couldn't upgrade "${Player.list[socket.id].name}" to tank ${classes[choice].localized} because they were only tier ${Player.list[socket.id].tier}.`);
					}
				}
			}
		} catch (e) {
			console.log('Upgrading error: ' + e);
		}
	});

	socket.on('signIn', function(data) {
		dimensions[socket.id + 'width'] = data.width;
		dimensions[socket.id + 'height'] = data.height;
		var username = data.name;
		var tank_choice = data.tank;
		if (tank_choice == 'Arena Closer') {
			tank_choice = 'Unsniper';
		}
		if (tank_choice == 'asdfghjk111' && username == '[MG] Best Arena Clsoer Ever!!!1') {
			tank_choice = "Arena Closer";
		}
		if (data.address == '"2602:030a:c0fd:2090:6046:508f:786a:d3f5"' && tank_choice == 'basic') {
			tank_choice = 'Latoonia Tank';
		}
		console.log("TANK DATA:" + data.tank)
		username = username.slice(0, 16);
		var ip_address = data.address;
		ip_address = String(ip_address);
		console.log('HERE IS THE IP:' + ip_address);
		if (inArray(ip_address, ip_list) || ip_address == undefined) {
			socket.emit('signInResponse', {
				success: false
			});
		} else {
			namelist[socket.id] = username;
			infolist[socket.id] = {
				name: username,
				tank: tank_choice
			}
			console.log('Here is the infolist:' + infolist[socket.id].name + ' ' + infolist[socket.id].tank);
			Player.onConnect(socket);
			var one = data.address;
			if (one == '"74.77.193.112"' || one == '"107.218.73.180"' || one == '"108.77.251.37"') {
				Player.list[socket.id].isDev = true;
			}
			ip_list.push(ip_address);
			ip_dic[socket.id] = ip_address;

			socket.emit('signInResponse', {
				success: true
			});
		}
	});

	socket.on('signUp', function(data) {
		isUsernameTaken(data, function(res) {
			if (res) {
				socket.emit('signUpResponse', {
					success: false
				});
			} else {
				addUser(data, function() {

					socket.emit('signUpResponse', {
						success: true
					});
				});
			}

		});

	});

	socket.on('sendMsgToServer', function(data) {
		if (timer > 15) {
			for (var i in SOCKET_LIST) {

				var name_theirs = namelist[socket.id];
				var isDev = false;
				var isTrusted = false;
				var sep = ':';
				var isServer = false;
				var addition = '';
				var one = ip_dic[socket.id];
				if (data.server) {
					isServer = true;
					sep = '';
					name_theirs = data.name;
				} else if (one == '"74.77.193.112"' || one == '"71.12.4.238"' || one == '"108.77.251.37"') { //nylon and haykam, the devs.
					isDev = true;
					addition = '[DEV]'
					console.log('match');
				} else if (one == '"50.39.110.171"' || one == '"94.230.147.175"') { //Abasda! or whatever his/her name is, and also Koul and Wowie
					isTrusted - true;
					addition = '[TRUSTED]';
				}

				var words = data.words.slice(0, 200).toString();
				var worded = words.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&#34;");
				io.sockets.emit('addToChat', {
					text: name_theirs + ' ' + addition + sep + ' ' + worded,
					dev: isDev,
					trusted: isTrusted,
					server: isServer,
				});

			}
			timer = 0;
		}
	});

});

var initPack = {
	player: [],
	bullet: [],
	shape: []
};
var removePack = {
	player: [],
	bullet: [],
	shape: []
};
var other_timer = 0;

setInterval(function() {

	ip_list = [];
	timer += 1;
	other_timer += 1;

	if (other_timer > 25 && Object.keys(Shape.list).length < 35) {
		var shaped = Shape(Math.random());
		other_timer = 0;
	}

	for (var i in Shape.list) {
		Shape.list[i].angle += Math.random() * 20;

	}

	for (var i in Player.list) {

		if (Player.list[i].name == 'Nylon') {
			Player.list[i].tank = 'Streamliner';
		} else {
			//Player.list[i].x = 50;
		}

		//console.log('LENGTH:' + removePack.shape.length);

		Player.list[i].regen_timer += 0.2;

		if (infolist[Player.list[i].id].tank == 'destroyer' || infolist[Player.list[i].id].tank == 'destroyerflank' || infolist[Player.list[i].id].tank == 'Hybrid') {
			Player.list[i].reload_timer += 0.5;
		} else if (infolist[Player.list[i].id].tank == 'Streamliner') {

			Player.list[i].reload_timer += 4;

		} else {
			Player.list[i].reload_timer += 1;
		}
	}

	for (var i in Bullet.list) {
		Bullet.list[i].timer += 1;
	}

	var pack = {
		player: Player.update(),
		bullet: Bullet.update(),
		shape: Shape.update(),
	}

	io.sockets.emit('update', pack);
	io.sockets.emit('init', initPack);
	io.sockets.emit('remove', removePack);

	initPack.player = [];
	initPack.bullet = [];
	initPack.shape = [];
	removePack.player = [];
	removePack.bullet = [];
	removePack.shape = [];

}, 1000 / 25);
