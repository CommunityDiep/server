const config = require("./config.json");

const randInt = require("random-int");
/**
 * Generates a random position in the arena.
 */
function randPos(margin = 0) {
	return [
		randInt(margin, config.arenaSize.width - margin),
		randInt(margin, config.arenaSize.height - margin),
	];
}

class Entity {
	constructor(x = 0, y = 0) {
		this.position = {
			x,
			y,
		};
		this.rotation = 0;
		this.spawned = true;
	}

	getLevel() {
		return 0;
	}

	getKillValue() {
		return 0;
	}
}

class Bullet extends Entity {
	constructor(x, y, parentEntity) {
		super(x, y);
		this.parentEntity = parentEntity;
	}
}

class Tank extends Entity {
	constructor(x, y) {
		super(x, y);
		this.name = "";
		this.score = 0;
	}

	getKillValue() {
		return Math.min(23536, this.score);
	}

	getLevel() {
		return 0;
	}
}

class Boss extends Tank {
	getKillValue() {
		return 30000;
	}

	getLevel() {
		return 75;
	}
}

class PlayableTank extends Tank {
	constructor(x, y, name) {
		super(x, y);
		this.name = name;
		this.spawned = false;
	}

	spawn(data) {
		if (!this.spawned) {
			this.spawned = true;

			this.name = data.name.slice(0, 16);
			this.tank = "basic";

			const pos = randPos();
			this.position.x = pos[0];
			this.position.y = pos[1];
		}
	}
}

module.exports = {
	Entity,
	Bullet,
	Tank,
	PlayableTank,
};