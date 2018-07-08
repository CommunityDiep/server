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
	}

	update() {}
}

class Bullet extends Entity {
	constructor(x, y, parentEntity) {
		super(x, y);
		this.parentEntity = parentEntity;
	}
}

class Player extends Entity {
	constructor(x, y) {
		super(x, y);
		this.name = "";
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
	Player,
};