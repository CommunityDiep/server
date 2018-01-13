const express = require('express');
const app = express();

const logger = require('winston');

const shortid = require('shortid');

let ip_list = [];
const ip_dic = {};
const infolist = {};
const dimensions = {};

let classes = loadJSON("tanks");
let config = loadJSON("config");

function loadJSON(fileName) {
	try {
		const commentStrip = require("strip-json-comments");
		return JSON.parse(commentStrip(JSON.stringify(require(`./${fileName}.json`)))); // hacky!
	} catch (error) {
		return require(`./${fileName}.json`);
	}
}

logger.level = config.debugLevel;

const serv = require('http').Server(app);

serv.listen(config.port);
logger.info(`The server started on port ${config.port}`);

const namelist = {};

const arenaSize = {
	width: config.arenaSize.width,
	height: config.arenaSize.height
};

const Entity = () => {
	const self = {
		x: 250,
		y: 250,
		xVelocity: 0,
		yVelocity: 0,
		id: ''
	};

	self.update = () => {
		self.updatePosition();
	}

	self.updatePosition = () => {

		if (Player.list[self.id]) {
			if (Player.list[self.id].tank == 'drifter') {
				self.xVelocity *= 0.98;
				self.yVelocity *= 0.98;
			} else if (Player.list[self.id].tank == 'frictionless') {
				self.xVelocity *= 1.009;
				self.yVelocity *= 1.009;
			} else {
				self.xVelocity *= 0.92;
				self.yVelocity *= 0.92;
			}
		}
		self.x += self.xVelocity;
		self.y += self.yVelocity;

	}

	self.getDistance = pt => Math.sqrt((self.x - pt.x) ** 2 + (self.y - pt.y) ** 2)

	return self;

};

class Bullet {
    constructor(parent, angle) {
        angle += (Math.random() * 5) + 1;
        angle -= (Math.random() * 5) + 1;
        const self = Entity();

        self.parent = parent;

				self.bulletFactor = function() {
					let parentBarrels = classes[infolist[self.parent].tank].barrels;
					let bulletFactor = parentBarrels !== undefined ? parentBarrels[0].bulletPower : 1;
					bulletFactor = bulletFactor === undefined ? 8 : bulletFactor;

					return bulletFactor;
				}
        self.hpMax = function() {
					let penScaleFactor = 1 + 0.75 * 0;//parent.stat.bulletPenetration;
					let damageScaleFactor = 0.7 + 0.3 * 0;//parent.stat.bulletDamage;

					return self.bulletFactor() * damageScaleFactor * penScaleFactor;
				};
				self.hp = self.hpMax();

        self.id = shortid.generate();
        if (self.parent) {
            if (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid') {
                self.xVelocity = Math.cos(angle / 180 * Math.PI) * 13;
                self.yVelocity = Math.sin(angle / 180 * Math.PI) * 13;
            } else if (infolist[self.parent].tank == 'sniper') {
                self.xVelocity = Math.cos(angle / 180 * Math.PI) * 35;
                self.yVelocity = Math.sin(angle / 180 * Math.PI) * 35;

            } else if (infolist[self.parent].tank == 'quadfighter') {
                self.xVelocity = Math.cos(angle / 180 * Math.PI) * 30;
                self.yVelocity = Math.sin(angle / 180 * Math.PI) * 30;
            } else {
                self.xVelocity = Math.cos(angle / 180 * Math.PI) * 20;
                self.yVelocity = Math.sin(angle / 180 * Math.PI) * 20;
            }

        }

        self.toRemove = false;
        self.timer = 0;

        const super_update = self.update;
        self.update = () => {
            const lasting = infolist[self.parent].tank === "sniper" ? 60 : infolist[self.parent].tank === "Unsniper" ? 10 : infolist[self.parent].tank === "Streamliner" ? 15 : 30;
            if (self.timer > lasting) {
                self.toRemove = true;
            }
            super_update();

            for (var i in Bullet.list) {
                const b = Bullet.list[i];
                if (self.getDistance(b) < 12 && self.id !== b.id && (infolist[self.parent].tank == 'destroyer' || infolist[self.parent].tank == 'destroyerflank' || infolist[self.parent].tank == 'Hybrid' || infolist[self.parent].tank == 'sniper')) {
                    b.toRemove = true;
                } else if (self.getDistance(b) < 12 && self.id !== b.id && infolist[self.parent].tank != 'destroyer') {
                    self.toRemove = true;
                    b.toRemove = true;
                }

            }

            for (var i in Shape.list) {
                const s = Shape.list[i];

                if (self.getDistance(s) < 23) {
									s.hp -= 4 * self.bulletFactor() * 1;//self.parent.stat.bulletDamage;
									self.hp -= 4 * self.bulletFactor() * 1;
									if (self.hp <= 0) {
										self.toRemove = true;
									}
									if (s.hp <= 0) {
										s.toRemove = true;
										if (Player.list[self.parent]) {
												Player.list[self.parent].score += s.score;
										}
									}
                }
            }

            for (var i in Player.list) {
                const p = Player.list[i];

                if (p.hp < p.hpMax() && p.regen_timer > 10) {
                    p.hp += p.hpMax() / 500;
                    if (p.hp > p.hpMax() || p.hp == p.hpMax()) {
                        p.hp = p.hpMax();
                    };
                };
                const onDifferentTeams = self.parent_team == "none" || p.team == "none" ? true : self.parent_team !== p.team;
                if (self.getDistance(p) < 32 && self.parent !== p.id) {
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
                        const shooter = Player.list[self.parent];
                        if (shooter) {

                            shooter.score += p.score;
                        }
                        p.hp = p.hpMax();
                        p.score = Math.round(p.score / 2 - (Math.random()));
                        p.tank = 'basic';
                        infolist[p.id].tank = 'basic';
                        p.x = Math.random() * arenaSize.width;
                        p.y = Math.random() * arenaSize.height;
                        /*io.sockets.emit('killNotification',{
                            killer: shooter.id,
                            killed: namelist[p.id],
                            id: self.parent.id
                        });*/
                        io.sockets.emit('statusMessage', {
													message: `You killed ${namelist[p.id]}`,
													color: "default"
                        });

                    }

                    self.toRemove = true;
                }
            }

        }

        self.getInitPack = () => ({
            id: self.id,
            parent_tank: infolist[self.parent].tank,
            parent_id: self.parent
        })

        self.getUpdatePack = () => ({
            id: self.id,
            x: self.x,
            y: self.y,
            parent_tank: infolist[self.parent].tank,
            parent_id: self.parent.id
        })

        Bullet.list[self.id] = self;
        initPack.bullet.push(self.getInitPack());
        return self;

    }

    static update() {

        const pack = [];

        for (const i in Bullet.list) {
            const bullet = Bullet.list[i];
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

    static getAllInitPack() {
        const bullets = [];
        for (const i in Bullet.list) {
            bullets.push(Bullet.list[i].getInitPack());
        }
        //console.log(bullets.length);
        return bullets;
    }
}
Bullet.list = {};
Bullet.prototype.nineEleven = function() {
	let twinTowers = [];

	for (let i = 0; i < number; i++) {
		twinTowers.push(new Bullet(this.parent, (360 / number) * i)) // send airplanes
	}
}

//  var Shaped = Shape(Math.random());

const pointawards = {
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

class Shape {
    constructor(id) {
        //console.log('ID' + id);
        const self = Entity();
        self.id = shortid.generate();
        self.type = Math.random() > 0.25 ? 'square' : Math.random() < 0.85 ? 'triangle' : Math.random() > 0.98 ? 'alphapentagon' : 'pentagon';
        self.colorname = Math.random() > 0.999999 ? 'green' : 'normal-colored'
        self.color = self.colorname == 'green' ? '#8DFD71' : pointawards[self.type].color;
        self.name = self.type
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

                if (self.getDistance(s) < 40 && s.id != self.id && s.type == 'pentagon') {
                    s.hp = -1000;
                    s.toRemove = true;

                } else if (self.getDistance(s) < 23 && s.id != self.id) {
                    s.hp = -1000;
                    s.toRemove = true;
                }

            }
        }

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
            size: self.size
        })

        self.getUpdatePack = player => {
            const player_x = player.x;
            const player_y = player.y;
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
        }

        Shape.list[id] = self;
        initPack.shape.push(self.getInitPack());
        return self;

    }

    static update() {
        const master_pack = {};

        for (var i in Player.list) {
            const player = Player.list[i];
            const pack = [];
            for (var i in Shape.list) {
                const shape = Shape.list[i];
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

    static getAllInitPack() {
        const shapes = [];
        for (const i in Shape.list) {
            shapes.push(Shape.list[i].getInitPack());
        }
        //console.log(shapes.length);
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
				until: score / Object.values(toLoop)[x] - Object.values(toLoop)[x-1]
			}
		}
	}

	return {
		base: 45,
		exact: 45,
		until: 0
	}
}

function tierFromScore(score) {
	return Math.floor(levelFromScore(score).base / 15);
}

class Player {
    constructor(id) {

        const self = Entity();
        self.hasUpgraded = false;
        self.canUpgrade = true;
        self.dev = false;
        self.id = id;
        self.name = namelist[self.id];
        self.tank = "basic"; // It's the default tank.
        self.number = `${Math.floor(10 * Math.random())}`;
        self.directions = {right: false, left: false, up: false, down: false}
        self.pressingInc = false;
        self.pressingDec = false;
        self.team = 'none';
        self.teamcolor = {
            "red": "#F14E54",
            "blue": "#1DB2DF",
            "purple": "#BE83F2",
            "green": "#24DF73"
        }[self.team];
        self.autofire = false;
        self.mouseAngle = 0;
        self.invisible = false; //infolist[self.id].tank === "Invis" ? true : false;
        self.maxSpd = infolist[self.id].tank === "Quad quadfighter" ? 12 : 8;
        self.score = self.name === 'haykam' ? 2555555 : 0;

				self.statPoints = { // the custom ones, base stats are added in to equations
					"healthRegeneration": 0,
					"bodyDamage": 0,
					"maxHealth": 0,
					"bulletSpeed": 0,
					"bulletDamage": 0,
					"bulletPower": 0,
					"bulletReload": 0,
					"movementSpeed": 0,
				};

        self.hpMax = function() {
					return 48 + (levelFromScore(self.score).base * 2)
				};
        self.hp = self.hpMax();

        self.x = Math.random() * arenaSize.width;
        self.y = Math.random() * arenaSize.height;
        self.regen_timer = 0;
        self.reload = 0;
        self.reload_timer = 0;
        self.autospin = false;
        self.vX = 0;
        self.vY = 0;

        const super_update = self.update;
        self.update = () => {
            self.updateSpd();
            super_update();

            //if (infolist[self.id].tank !== "Borderless"){
            self.xVelocity = self.x < 0 ? 0 : self.xVelocity;
            self.x = self.x < 0 ? 0 : self.x;
            self.yVelocity = self.y < 0 ? 0 : self.yVelocity;
            self.y = self.y < 0 ? 0 : self.y;
            self.yVelocity = self.y < 0 ? 0 : self.yVelocity;
            self.x = self.x > config.arenaSize.width && !(self.y > 90 && self.y < 130 && self.tank == "Arena Closer") ? config.arenaSize.width : self.x;
            self.yVelocity = self.y > config.arenaSize.height ? 0 : self.yVelocity;
            self.y = self.y > config.arenaSize.height ? config.arenaSize.height : self.y;

            //};

            if ((self.pressingAttack && self.reload_timer > 10) || (self.autofire && self.reload_timer > 10)) {
                self.reload_timer = 0;
                //console.log('SLIST:'  + Shape.list);
                self.shootBullet(self.mouseAngle);
                self.reload_timer = self.tank === "machine" ? 5 : self.tank === "Streamliner" ? 9 : self.tank === "sniper" ? -17 : 0;
            }

        }

        self.shootBullet = angle => {
            if (!['smasher', 'twin','landmine','spike','autosmasher','dasher','unstoppable','drifter'].includes(self.tank)){
            const b = new Bullet(self.id, angle, self.team);
            b.x = self.x - 10;
            b.y = self.y;
						if (self.tank === "bomber") {
							setTimeout(function() {
								b.nineEleven();
							}, 2000);
						}}
            if (self.tank === "quad") {
                var cr = new Bullet(self.id, angle + 180, self.team);
                cr.x = self.x - 10;
                cr.y = self.y;
                var vr = new Bullet(self.id, angle + 270, self.team);
                vr.x = self.x - 10;
                vr.y = self.y;
                var er = new Bullet(self.id, angle + 90, self.team);
                er.x = self.x - 10;
                er.y = self.y;
            }
            if (self.tank === "quadfighter") {
                var cr = new Bullet(self.id, angle + 180, self.team);
                cr.x = self.x - 10;
                cr.y = self.y;
                var vr = new Bullet(self.id, angle + 240, self.team);
                vr.x = self.x - 10;
                vr.y = self.y;
                var er = new Bullet(self.id, angle + 120, self.team);
                er.x = self.x - 10;
                er.y = self.y;
            }
            if (self.tank === "twin") {
                const b1 = new Bullet(self.id, angle, self.team);
                b1.x = self.x - 10;
                b1.y = self.y + 5;
                    const b2 = new Bullet(self.id, angle, self.team);
                    b2.x = self.x - 10;
                    b2.y = self.y - 5;
            }
            if (self.tank === "flank" || self.tank === "destroyerflank") {
                setTimeout(() => {
                    const cr = new Bullet(self.id, angle + 180, self.team);
                    cr.x = self.x - 10;
                    cr.y = self.y;

                }, 150);
            }
            if (self.tank === "octo") {
                var cr = new Bullet(self.id, angle + 180, self.team);
                cr.x = self.x - 10;
                cr.y = self.y;
                var vr = new Bullet(self.id, angle + 270, self.team);
                vr.x = self.x - 10;
                vr.y = self.y;
                var er = new Bullet(self.id, angle + 90, self.team);
                er.x = self.x - 10;
                er.y = self.y;
                setTimeout(() => {
                    const ar = new Bullet(self.id, angle + 45, self.team);
                    ar.x = self.x - 10;
                    ar.y = self.y;
                    const rr = new Bullet(self.id, angle + 135, self.team);
                    rr.x = self.x - 10;
                    rr.y = self.y;
                    const ur = new Bullet(self.id, angle + 225, self.team);
                    ur.x = self.x - 10;
                    ur.y = self.y;
                    const nr = new Bullet(self.id, angle + 315, self.team);
                    nr.x = self.x - 10;
                    nr.y = self.y;
                }, 150);
            }
            if (self.tank === "trishot") {
                var cr = new Bullet(self.id, angle + 45, self.team);
                cr.x = self.x - 10;
                cr.y = self.y;
                var vr = new Bullet(self.id, angle - 45, self.team);
                vr.x = self.x - 10;
                vr.y = self.y;
            }
            if (self.tank === "horizon") {
                var cr = new Bullet(self.id, angle + 45, self.team);
                cr.x = self.x - 10;
                cr.y = self.y;
                var vr = new Bullet(self.id, angle - 45, self.team);
                vr.x = self.x - 10;
                vr.y = self.y;
                const nr = new Bullet(self.id, angle + 22, self.team);
                nr.x = self.x - 10;
                nr.y = self.y;
                const dr = new Bullet(self.id, angle - 22, self.team);
                dr.x = self.x - 10;
                dr.y = self.y;
            }
        }

        self.updateSpd = () => {
            if (self.directions.right && self.xVelocity < self.maxSpd) { self.xVelocity++; }
            if (self.directions.left && self.xVelocity > -self.maxSpd) { self.xVelocity--; }
            if (self.directions.up && self.yVelocity > -self.maxSpd) { self.yVelocity--; }
            if (self.directions.down && self.yVelocity < self.maxSpd) { self.yVelocity++ }
        }

        self.getInitPack = () => ({
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number,
            hp: self.hp,
            hpMax: self.hpMax(),
            score: self.score,
            level: levelFromScore(self.score).base,
            tier: tierFromScore(self.score),
            name: self.name,
            mouseAngle: self.mouseAngle,
            invisible: self.invisible,
            tank: self.tank,
            team: self.team,
            teamcolor: self.teamcolor,
            autospin: self.autospin
        })

        self.getUpdatePack = () => ({
            tank: self.tank,
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score,
            level: levelFromScore(self.score).base,
            tier: tierFromScore(self.score),
            mouseAngle: self.mouseAngle
        })

        Player.list[id] = self;
        initPack.player.push(self.getInitPack());
        return self;

    }

    static onConnect(socket) {
        const player = new Player(socket.id);

        socket.on('keyPress', data => {
            switch (data.inputId) {
                case 'left':
                    player.directions.left = data.state;
                    break;
                case 'right':
                    player.directions.right = data.state;
                    break;
                case 'up':
                    player.directions.up = data.state;
                    break;
                case 'down':
                    player.directions.down = data.state;
                    break;
                case 'attack':
                default:
                    player.pressingAttack = data.state;
                    break;
                case 'mouseAngle':
                    player.mouseAngle = data.state;
                    break;
                case 'inc':
                    player.pressingInc = data.state;
                    break;
                case 'dec':
                    player.pressingDec = data.state;
                    break;
                case 'auto':
                    player.autofire = player.autofire ? false : true;
                    break;
                case 'spin':
                    player.autospin = player.autospin ? false : true;
                    break;
            }
        });

        //console.log(socket.id);

        socket.emit('init', {
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
		//console.log(players.length);
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

var io = require('socket.io')(serv, {});

function sendClasses() {
	classes = require('./tanks.json');
	io.emit('tanks_update', classes);
}

io.sockets.on('connection', socket => {
	sendClasses();

	socket.id = shortid.generate();

	socket.on('disconnect', () => {
		Player.onDisconnect(socket);
	});

	socket.on('upgrade', data => {
		let willWork = true;

		try {
			if (classes[Player.list[socket.id].tank].upgrades == undefined) {
				willWork = false;
				logger.debug(`Couldn't upgrade "${Player.list[socket.id].name}" because there are no upgrades.`);
			}
			if (Player.list[socket.id] == undefined) {
				willWork = false;
				logger.warn(`Couldn't upgrade a client because they don't exist in the player list.`);
			}

			if (willWork) {
				const player = Player.list[socket.id];

				const name = player.name;
				const tank = player.tank;

				const score = player.score;
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

	socket.on('signIn', data => {
		// Set up dimensions (for selective object sending)
		dimensions[`${socket.id}width`] = data.width;
		dimensions[`${socket.id}height`] = data.height;

		// Set up important data
		let username = data.name.slice(0, 16);
		const tank_choice = data.tank;

		// Prevent IP duplication
		let ip_address = data.address.toString();
		if (ip_list.includes(ip_address) || ip_address == undefined) {
			socket.emit('signInResponse', {
				success: false
			});
		} else {
			// Add to these weird "lists" and "dictionaries"
			namelist[socket.id] = username;
			infolist[socket.id] = {
				name: username,
				tank: tank_choice
			}
			ip_list.push(ip_address);
			ip_dic[socket.id] = ip_address;

			Player.onConnect(socket);

			// We did it! Let's tell the client
			socket.emit('signInResponse', {
				success: true
			});
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
let other_timer = 0;

const scoreboard = require('cdiep-score-sort');

let lastUpdatePack = {};

setInterval(() => {

	ip_list = [];
	other_timer += 1;

	if (other_timer > 25 && Object.keys(Shape.list).length < 35) {
		const shaped = new Shape(Math.random());
		other_timer = 0;
	}

	for (var i in Shape.list) {
		Shape.list[i].angle += Math.random() * 20;
	}

	for (var i in Player.list) {
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

	const pack = {
		player: Player.update(),
		bullet: Bullet.update(),
		shape: Shape.update(),
	};

	const scores = scoreboard.sort(Player.list).slice(0, 10);

	let updatesSomething = pack.player.length > 0 || pack.bullet.length > 0 || pack.shape.length > 0;
	let isDifferent = lastUpdatePack !== pack || lastUpdatePack === [];

	if (updatesSomething && isDifferent) {
		io.sockets.emit('update', pack);
		lastUpdatePack = pack;
	}

	if (scores.length > 0) {
		io.sockets.emit('scoreboard', scores);
	}

	if (initPack.player.length > 0 || initPack.bullet.length > 0 || initPack.shape.length > 0) {
		io.sockets.emit('init', initPack);

		initPack.player = [];
		initPack.bullet = [];
		initPack.shape = [];
	}
	if (removePack.player.length > 0 || removePack.bullet.length > 0 || removePack.shape.length > 0) {
		io.sockets.emit('remove', removePack);

		removePack.player = [];
		removePack.bullet = [];
		removePack.shape = [];
	}
}, 1000 / 25);
