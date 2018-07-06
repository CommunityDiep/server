// import { setInterval } from "core-js/library/web/timers";

const express = require("express");
const app = express();

const winston = require("winston");
const shortid = require("shortid");

const shapeWord = {
	line: "line",
	point: "point",
	circle: "circle",
	polygon: "polygon",
};

let ip_list = [];
const ip_dic = {};
const infolist = {};
const dimensions = {};

let classes = loadJSON("tanks");
const config = loadJSON("config");

function loadJSON(fileName) {
	try {
		// This is a bit hacky, but it works!
		const commentStrip = require("strip-json-comments");
		return JSON.parse(commentStrip(JSON.stringify(require(`./${fileName}.json`))));
	} catch (error) {
		// Fallback to loading basic JSON if it doesn't work.
		return require(`./${fileName}.json`);
	}
}

const logger = winston.createLogger({
	level: config.debugLevel || "info",
	transports: [
		new winston.transports.Console({
			colorize: true,
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

const serv = require("http").Server(app);

serv.listen(config.port);
logger.info(`The server started on port ${config.port}`);

const namelist = {};

const arenaSize = {
	width: config.arenaSize.width,
	height: config.arenaSize.height,
};

class Entity {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.xVelocity = 0;
		this.yVelocity = 0;

		this.id = "";

		this.update = () => {
			this.updatePosition();
		};

		this.updatePosition = () => {

			if (Player.list[this.id]) {
				if (Player.list[this.id].tank == "drifter") {
					this.xVelocity *= 0.98;
					this.yVelocity *= 0.98;
				} else if (Player.list[this.id].tank == "frictionless") {
					this.xVelocity *= 1.009;
					this.yVelocity *= 1.009;
				} else {
					this.xVelocity *= 0.92;
					this.yVelocity *= 0.92;
				}
			}
			this.x += this.xVelocity;
			this.y += this.yVelocity;

		};

		this.getDistance = pt => Math.sqrt((this.x - pt.x) ** 2 + (this.y - pt.y) ** 2);
	}

	collisionShape() {
		return {
			type: shapeWord.circle,
			points: [{
				"x": this.x,
				"y": this.y,
			}],
			r: 30,
		};
	}
}

class Bullet extends Entity {
	constructor(obj) {
		super(obj.x, obj.y);

		this.parent = obj.parent;

		const angle = obj.angle;
		this.angle = obj.angle;
		this.barrel = obj.barrel;
		this.tank = obj.tank;
		this.parent_tenk = obj.parent_tank;

		this.autofire = true;
		this.reload = 0;
		this.reload_timer = 0;

		this.bulletFactor = function() {
			const parentInfo = infolist[this.parent];
			if (!parentInfo) return 0;

			const parentTankBarrels = classes[parentInfo.tank].barrels;
			let bulletFactor = parentTankBarrels !== undefined ? parentTankBarrels[0].bulletPower : 1;
			bulletFactor = bulletFactor === undefined ? 8 : bulletFactor;

			return bulletFactor;
		};
		this.hpMax = function() {
			const penScaleFactor = 1 + 0.75 * 0;// parent.stat.bulletPenetration;
			const damageScaleFactor = 0.7 + 0.3 * 0;// parent.stat.bulletDamage;

			return this.bulletFactor() * damageScaleFactor * penScaleFactor;
		};
		this.hp = this.hpMax();

		this.id = shortid.generate();
		infolist[this.id] = {
			name: "bulle^t",
			tank: this.tank,
			speedSet: 0,
		};
		if (this.parent) {
			if (infolist[this.parent].tank == "destroyer" || infolist[this.parent].tank == "destroyerflank" || infolist[this.parent].tank == "Hybrid") {
				this.xVelocity = Math.cos(angle / 180 * Math.PI) * 13;
				this.yVelocity = Math.sin(angle / 180 * Math.PI) * 13;
			} else if (infolist[this.parent].tank == "sniper") {
				this.xVelocity = Math.cos(angle / 180 * Math.PI) * 35;
				this.yVelocity = Math.sin(angle / 180 * Math.PI) * 35;

			} else if (infolist[this.parent].tank == "quadfighter") {
				this.xVelocity = Math.cos(angle / 180 * Math.PI) * 30;
				this.yVelocity = Math.sin(angle / 180 * Math.PI) * 30;
			} else {
				this.xVelocity = Math.cos(angle / 180 * Math.PI) * 20;// + infolist[this.parent].speedSet;
				this.yVelocity = Math.sin(angle / 180 * Math.PI) * 20;// + infolist[this.parent].speedSet;
				// infolist[this.id].speedSet = 20 + infolist[this.parent].speedSet;
			}

		}

		this.shootingTenk = setInterval(() => {
			this.reload_timer = this.reload_timer + 1;
		}, 100);

		this.toRemove = false;
		this.timer = 0;

		const super_update = this.update;

		this.update = () => {
			const lasting = infolist[this.parent].tank === "sniper" ? 60 : infolist[this.parent].tank === "Unsniper" ? 10 : infolist[this.parent].tank === "Streamliner" ? 15 : 30;
			if (this.timer > lasting) {
				this.toRemove = true;
			}
			super_update();

			if (this.autofire && this.reload_timer > 10) {
				this.reload_timer = 0;

				this.shootBullet(this.mouseAngle);
				this.reload_timer = this.tank === "machine" ? 5 : this.tank === "Streamliner" ? 9 : this.tank === "sniper" ? -17 : 0;
			}

			Shape.list.forEach(shape => {
				if (this.getDistance(shape) < 23) {
					shape.hp -= 4 * this.bulletFactor() * 1;
					this.hp -= 4 * this.bulletFactor() * 1;
					if (this.hp <= 0) {
						this.toRemove = true;
					}
					if (shape.hp <= 0) {
						shape.toRemove = true;
						if (Player.list[this.parent]) {
							Player.list[this.parent].score += shape.score;
						}
					}
				}
			});

			Player.list.forEach(player => {
				if (player.hp < player.hpMax() && player.regen_timer > 10) {
					player.hp += player.hpMax() / 500;
					if (player.hp > player.hpMax() || player.hp == player.hpMax()) {
						player.hp = player.hpMax();
					}
				}
				
				if (this.getDistance(player) < 32 && this.parent !== player.id) {
					player.regen_timer = 0;

					// Give the health-stealing tank its special ability
					if (infolist[this.parent].tank == "healthsteal") {
						Player.list[this.parent].hp += 4;
					}

					if (infolist[this.parent].tank == "Arena Closer") {
						player.hp -= 10000;
					} else if (infolist[this.parent].tank == "destroyer" || infolist[this.parent].tank == "destroyerflank" || infolist[this.parent].tank == "Hybrid") {
						player.hp -= 12;
					} else if (infolist[this.parent].tank == "Annihilator") {
						player.hp -= 16;
					} else if (infolist[this.parent].tank == "Streamliner") {
						player.hp -= 1;
					} else {
						player.hp -= 4;
					}
					if (player.hp <= 0) {
						const shooter = Player.list[this.parent];
						if (shooter) {

							shooter.score += player.score;
						}
						player.hp = player.hpMax();
						player.score = Math.round(player.score / 2 - (Math.random()));
						player.tank = "basic";
						infolist[player.id].tank = "basic";
						player.x = Math.random() * arenaSize.width;
						player.y = Math.random() * arenaSize.height;
						/* io.sockets.emit('killNotification',{
												killer: shooter.id,
												killed: namelist[p.id],
												id: this.parent.id
										});*/
						io.sockets.emit("statusMessage", {
							message: `You killed ${namelist[player.id]}`,
							color: "default",
						});

					}

					this.toRemove = true;
				}
			});

		};

		Bullet.list[this.id] = this;
		initPack.bullet.push(this.getInitPack());
	}

	getInitPack() {
		return {
			id: this.id,
			parent_tank: Player.list[this.parent] === undefined ? Bullet.list[this.parent] === undefined ? this.tank : Bullet.list[this.parent].tank : Player.list[this.parent].tank,
			parent_id: this.parent,
			barrels: this.barrel,
			angle: this.angle,
			tank: this.tank,
		};
	}

	shootBullet(angle) {
		if (classes[this.tank].barrelsNew) {
			const shootenedBullets = [];
			const barrels = classes[this.tank].barrelsNew;

			for (const item of barrels) {
				const spreadPart = Math.random() * (item.spreadAngle * 2) - item.spreadAngle;

				const spreadedAngle = item.offsetAngle + angle + spreadPart;
				shootenedBullets.push(new Bullet({
					parent: this.id,
					x: this.x,
					y: this.y,
					angle: spreadedAngle,
					barrel: classes[classes[this.tank].barrels[0].bulletType].barrels,
					tank: classes[this.tank].barrels[0].bulletType,
					parent_tank: this.tank,
				}));
			}
		}
	}

	getUpdatePack() {
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			parent_tank: this.parent_tenk,
			parent_id: this.parent,
			barrels: this.barrel,
			angle: this.angle,
			tank: this.tank,
		};
	}

	static update() {
		const pack = [];

		for (const i in Bullet.list) {
			const bullet = Bullet.list[i];
			bullet.update();
			if (bullet.toRemove) {
				delete Bullet.list[i];
				removePack.bullet.push(bullet.id);
				clearInterval(this.shootingTenk);
			} else {
				pack.push(bullet.getUpdatePack());
			}
		}

		return pack;
	}

	static getAllInitPack() {
		const bullets = [];
		for (const i in Bullet.list) {
			bullets.push(Bullet.list[i].getInitPack());
		}

		return bullets;
	}

	explode(number) {
		if (this.tankData) return;

		const explodedBullets = [];

		// Loop through all angles
		for (let explodeLoop = 0; explodeLoop < number; explodeLoop++) {
			explodedBullets.push(new Bullet({
				parent: this.parent,
				angle: (360 / number) * explodeLoop,
				tank: "bullet",
				parent_tank: "rocketeer",
			}));
		}
	}
}
Bullet.list = {};

const pointawards = {
	"square": {
		score: 10,
		color: "#FEE769",
		hp: 1,
	},
	"pentagon": {
		score: 130,
		color: "#7790F9",
		hp: 15,
	},
	"triangle": {
		score: 25,
		color: "#F97779",
		hp: 3,
	},
	"alphapentagon": {
		score: 4000,
		color: "#7790F9",
		hp: 750,
	},
};

class Shape {
	constructor(id) {
		const self = new Entity();
		self.id = shortid.generate();
		self.type = Math.random() > 0.25 ? "square" : Math.random() < 0.85 ? "triangle" : Math.random() > 0.98 ? "alphapentagon" : "pentagon";
		self.colorname = Math.random() > 0.999999 ? "green" : "normal-colored";
		self.color = self.colorname == "green" ? "#8DFD71" : pointawards[self.type].color;
		self.name = self.type;
		self.toRemove = false;
		self.score = pointawards[self.type].score;
		self.size = 0;
		self.regen_timer = 0;
		self.x = Math.random() * config.arenaSize.width;
		self.y = Math.random() * config.arenaSize.height;
		self.hpMax = pointawards[self.type].hp;
		self.hp = pointawards[self.type].hp;
		self.angle = Math.random() * 360;
		self.xVelocity = Math.cos(self.angle / 180 * Math.PI) * 0.18;
		self.yVelocity = Math.sin(self.angle / 180 * Math.PI) * 0.18;

		const super_update = self.update;
		self.update = () => {
			super_update();

			self.x = self.x < 0 ? 0 : self.x;
			self.y = self.y < 0 ? 0 : self.y;
			self.x = self.x > config.arenaSize.width ? config.arenaSize.width : self.x;
			self.y = self.y > config.arenaSize.height ? config.arenaSize.height : self.y;

			for (const i in Shape.list) {
				const s = Shape.list[i];

				if (self.getDistance(s) < 40 && s.id != self.id && s.type == "pentagon") {
					s.hp = -1000;
					s.toRemove = true;

				} else if (self.getDistance(s) < 23 && s.id != self.id) {
					s.hp = -1000;
					s.toRemove = true;
				}

			}
		};

		self.getInitPack = () => ({
			id: self.id,
			x: self.x,
			y: self.y,
			hp: self.hp,
			hpPercent: self.hp / self.hpMax,
			name: self.type,
			angle: self.angle,
			color: self.color,
			colorname: self.color,
			size: self.size,
		});

		self.getUpdatePack = player => {
			const screen_width = dimensions[`${player.id}width`];
			const screen_height = dimensions[`${player.id}height`];
			if (Math.abs(player.x - self.x) < screen_width && Math.abs(player.y - self.y) < screen_height) {
				return {
					id: self.id,
					x: self.x,
					y: self.y,
				};
			} else {

				return false;

			}
		};

		Shape.list[id] = self;
		initPack.shape.push(self.getInitPack());

	}

	static update() {
		const master_pack = {};

		for (const updatePlayerLoop in Player.list) {
			const player = Player.list[updatePlayerLoop];
			const pack = [];
			for (const innerLoop in Shape.list) {
				const shape = Shape.list[innerLoop];
				shape.update();
				if (shape.toRemove) {
					delete Shape.list[innerLoop];
					removePack.shape.push(shape.id);
				} else if (shape.getUpdatePack(player)) {
					pack.push(shape.getUpdatePack(player));
				}
			}

			master_pack[player.id] = pack;
		}
		return master_pack;
	}

	static getAllInitPack() {
		const shapes = [];
		for (const i in Shape.list) {
			shapes.push(Shape.list[i].getInitPack());
		}

		return shapes;

	}
}

Shape.list = {};

function levelFromScore(score) {
	const toLoop = config.levels;

	for (let x = 0; x < Object.keys(toLoop).length; x++) {
		if (Object.values(toLoop)[x] > score) {
			const base = parseInt(Object.keys(toLoop)[x - 1]);

			return {
				base,
				exact: base + (base + score) / Object.values(toLoop)[x],
				until: score / Object.values(toLoop)[x] - Object.values(toLoop)[x - 1],
			};
		}
	}

	return {
		base: 45,
		exact: 45,
		until: 0,
	};
}

function tierFromScore(score) {
	return Math.floor(levelFromScore(score).base / 15);
}

class Player extends Entity {
	constructor(id) {
		super();

		this.hasUpgraded = false;
		this.canUpgrade = true;
		this.dev = this.name === "5dfh7s4GFD5" ? true : false;
		this.id = id;
		this.name = namelist[this.id];

		// Everyone starts basic!
		this.tank = "debug";

		this.number = `${Math.floor(10 * Math.random())}`;
		this.directions = { right: false, left: false, up: false, down: false };
		this.pressingInc = false;
		this.pressingDec = false;
		this.team = "purple";
		this.teamcolor = config.teamColors[this.team];
		this.autofire = false;
		this.mouseAngle = 0;
		this.invisible = false;
		this.maxSpd = infolist[this.id].tank === "Quad quadfighter" ? 12 : 8;
		this.score = this.name === "5dfh7s4GFD5" ? 50000 : 0;


		// Add custom stat points (base stats are defined with tank).
		this.statPoints = {
			"healthRegeneration": 0,
			"bodyDamage": 0,
			"maxHealth": 0,
			"bulletSpeed": 0,
			"bulletDamage": 0,
			"bulletPower": 0,
			"bulletReload": 0,
			"movementSpeed": 0,
		};

		this.hpMax = function() {
			return 48 + (levelFromScore(this.score).base * 2);
		};
		this.hp = this.hpMax();

		this.x = Math.random() * arenaSize.width;
		this.y = Math.random() * arenaSize.height;
		this.regen_timer = 0;
		this.reload = 0;
		this.reload_timer = 0;
		this.autospin = false;
		this.vX = 0;
		this.vY = 0;

		const super_update = this.update;
		this.update = () => {
			this.updateSpd();
			super_update();

			if (infolist[this.id].tank !== "debugBounds") {
				this.xVelocity = this.x < 0 ? 0 : this.xVelocity;
				this.x = this.x < 0 ? 0 : this.x;
				this.yVelocity = this.y < 0 ? 0 : this.yVelocity;
				this.y = this.y < 0 ? 0 : this.y;
				this.yVelocity = this.y < 0 ? 0 : this.yVelocity;
				this.x = this.x > config.arenaSize.width && !(this.y > 90 && this.y < 130 && this.tank == "Arena Closer") ? config.arenaSize.width : this.x;
				this.yVelocity = this.y > config.arenaSize.height ? 0 : this.yVelocity;
				this.y = this.y > config.arenaSize.height ? config.arenaSize.height : this.y;
			}

			if ((this.pressingAttack && this.reload_timer > 10) || (this.autofire && this.reload_timer > 10)) {
				this.reload_timer = 0;

				this.shootBullet(this.mouseAngle);
				this.reload_timer = this.tank === "machine" ? 5 : this.tank === "Streamliner" ? 9 : this.tank === "sniper" ? -17 : 0;
			}

		};

		this.updateSpd = () => {
			if (this.directions.right && this.xVelocity < this.maxSpd) { this.xVelocity++; }
			if (this.directions.left && this.xVelocity > -this.maxSpd) { this.xVelocity--; }
			if (this.directions.up && this.yVelocity > -this.maxSpd) { this.yVelocity--; }
			if (this.directions.down && this.yVelocity < this.maxSpd) { this.yVelocity++; }
		};

		this.getInitPack = () => ({
			id: this.id,
			x: this.x,
			y: this.y,
			number: this.number,
			hp: this.hp,
			hpMax: this.hpMax(),
			score: this.score,
			level: levelFromScore(this.score).base,
			tier: tierFromScore(this.score),
			name: this.name,
			mouseAngle: this.mouseAngle,
			invisible: this.invisible,
			tank: this.tank,
			team: this.team,
			teamcolor: this.teamcolor,
			autospin: this.autospin,
		});

		this.getUpdatePack = () => ({
			tank: this.tank,
			id: this.id,
			x: this.x,
			y: this.y,
			hp: this.hp,
			score: this.score,
			level: levelFromScore(this.score).base,
			tier: tierFromScore(this.score),
			mouseAngle: this.mouseAngle,
		});

		Player.list[id] = this;
		initPack.player.push(this.getInitPack());
		return this;

	}

	shootBullet(angle) {
		if (classes[this.tank].barrelsNew) {
			const shootenedBullets = [];
			const barrels = classes[this.tank].barrelsNew;

			for (const item of barrels) {
				const spreadPart = Math.random() * (item.spreadAngle * 2) - item.spreadAngle;

				const spreadedAngle = item.offsetAngle + angle + spreadPart;
				shootenedBullets.push(new Bullet({
					parent: this.id,
					x: this.x,
					y: this.y,
					angle: spreadedAngle,
					barrel: classes[classes[this.tank].barrels[0].bulletType].barrels,
					tank: classes[this.tank].barrels[0].bulletType,
					parent_tank: this.tank,
				}));
			}
		}
	}

	static onConnect(socket) {
		const player = new Player(socket.id);

		socket.on("keyPress", data => {
			switch (data.inputId) {
				case "left":
					player.directions.left = data.state;
					break;
				case "right":
					player.directions.right = data.state;
					break;
				case "up":
					player.directions.up = data.state;
					break;
				case "down":
					player.directions.down = data.state;
					break;
				case "attack":
				default:
					player.pressingAttack = data.state;
					break;
				case "mouseAngle":
					player.mouseAngle = data.state;
					break;
				case "inc":
					player.pressingInc = data.state;
					break;
				case "dec":
					player.pressingDec = data.state;
					break;
				case "auto":
					player.autofire = player.autofire ? false : true;
					break;
				case "spin":
					player.autospin = player.autospin ? false : true;
					break;
			}
		});

		socket.emit("init", {
			selfId: socket.id,
			player: Player.getAllInitPack(),
			bullet: Bullet.getAllInitPack(),
			shape: Shape.getAllInitPack(),
		});
	}

	static getAllInitPack() {
		const players = [];
		for (const i in Player.list) {
			players.push(Player.list[i].getInitPack());
		}

		return players;
	}

	static onDisconnect(socket) {
		delete Player.list[socket.id];
		removePack.player.push(socket.id);
		const index_of = ip_list.indexOf(ip_dic[socket.id]);
		if (index_of > -1) {
			ip_list.splice(index_of, 1);
		}
		delete ip_dic[socket.id];

	}

	static update() {

		const pack = [];

		for (const i in Player.list) {
			const player = Player.list[i];
			player.update();
			pack.push(player.getUpdatePack());
		}

		return pack;
	}
}

Player.list = {};

var io = require("socket.io")(serv, {});

function sendClasses() {
	classes = require("./tanks.json");
	io.emit("tanks_update", classes);
}

io.sockets.on("connection", socket => {
	sendClasses();

	socket.id = shortid.generate();

	socket.emit("serverInfo", {

	});

	socket.on("disconnect", () => {
		Player.onDisconnect(socket);
	});

	socket.on("upgrade", data => {
		let willWork = true;

		try {
			if (classes[Player.list[socket.id].tank].upgrades == undefined) {
				willWork = false;
				logger.debug(`Couldn't upgrade "${Player.list[socket.id].name}" because there are no upgrades.`);
			}
			if (Player.list[socket.id] == undefined) {
				willWork = false;
				logger.warn("Couldn't upgrade a client because they don't exist in the player list.");
			}

			if (willWork) {
				const player = Player.list[socket.id];

				const name = player.name;
				const tier = tierFromScore(player.score);

				const upgrades = classes[player.tank].upgrades;
				const choice = Object.keys(upgrades)[data.pos];
				const upgradeToTier = Object.values(upgrades)[data.pos];

				if (classes[choice] == undefined) {
					logger.warn(`Couldn't upgrade "${name}" to that tank (${JSON.stringify(classes[player.tank])}) because it doesn't exist.`);
				} else {
					logger.debug(`Player data for this upgrade is ${player}.`);
					logger.debug(`The player's tier is ${tier}.`);
					logger.debug(`Upgrade offset is ${data.pos}.`);
					logger.debug(`The tank's internal name is ${choice}.`);
					logger.debug(`The localized name is ${classes[choice].localized}.`);

					if (tier >= upgradeToTier) {
						logger.debug(`Upgraded "${name}" to tank ${classes[choice].localized}.`);

						Player.list[socket.id].tank = choice;
						infolist[socket.id].tank = choice;
					} else {
						logger.debug(`Couldn't upgrade "${name}" to tank ${classes[choice].localized} because they were only tier ${tier}.`);
					}
				}
			}
		} catch (error) {
			logger.error(`Unknown upgrading error: ${error}`);
		}
	});

	socket.on("signIn", data => {
		// Set up dimensions (for selective object sending)
		dimensions[`${socket.id}width`] = data.width;
		dimensions[`${socket.id}height`] = data.height;

		// Set up important data
		const username = data.name.slice(0, 16);
		const tank_choice = data.tank;

		// Prevent IP duplication
		const ip_address = data.address.toString();
		if (ip_list.includes(ip_address) || ip_address == undefined) {
			socket.emit("signInResponse", {
				success: false,
			});
		} else {
			// Add to these weird "lists" and "dictionaries"
			namelist[socket.id] = username;
			infolist[socket.id] = {
				name: username,
				tank: tank_choice,
			};
			ip_list.push(ip_address);
			ip_dic[socket.id] = ip_address;

			Player.onConnect(socket);

			// We did it! Let's tell the client
			socket.emit("signInResponse", {
				success: true,
			});
		}
	});
});

var initPack = {
	player: [],
	bullet: [],
	shape: [],
};
var removePack = {
	player: [],
	bullet: [],
	shape: [],
};
let other_timer = 0;

const scoreboard = require("cdiep-score-sort");

let lastUpdatePack = {};

setInterval(() => {

	ip_list = [];
	other_timer += 1;

	if (other_timer > 25 && Object.keys(Shape.list).length < 35) {
		other_timer = 0;
	}

	for (var i in Shape.list) {
		Shape.list[i].angle += Math.random() * 20;
	}

	for (var i in Player.list) {
		Player.list[i].regen_timer += 0.2;

		if (infolist[Player.list[i].id].tank == "destroyer" || infolist[Player.list[i].id].tank == "destroyerflank" || infolist[Player.list[i].id].tank == "Hybrid") {
			Player.list[i].reload_timer += 0.5;
		} else if (infolist[Player.list[i].id].tank == "Streamliner") {
			Player.list[i].reload_timer += 4;
		} else {
			Player.list[i].reload_timer += 1;
		}
	}

	for (var i in Bullet.list) {
		Bullet.list[i].timer += 1;
	}

	const pack = {
		player: Player.update(),
		bullet: Bullet.update(),
		shape: Shape.update(),
	};

	const scores = scoreboard.sort(Player.list).slice(0, 10);

	const updatesSomething = pack.player.length > 0 || pack.bullet.length > 0 || pack.shape.length > 0;
	const isDifferent = lastUpdatePack !== pack || lastUpdatePack === [];

	if (updatesSomething && isDifferent) {
		io.sockets.emit("update", pack);
		lastUpdatePack = pack;
	}

	if (scores.length > 0) {
		io.sockets.emit("scoreboard", scores);
	}

	if (initPack.player.length > 0 || initPack.bullet.length > 0 || initPack.shape.length > 0) {
		io.sockets.emit("init", initPack);

		initPack.player = [];
		initPack.bullet = [];
		initPack.shape = [];
	}
	if (removePack.player.length > 0 || removePack.bullet.length > 0 || removePack.shape.length > 0) {
		io.sockets.emit("remove", removePack);

		removePack.player = [];
		removePack.bullet = [];
		removePack.shape = [];
	}
}, 1000 / 25);
