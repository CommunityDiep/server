const ids = require("short-id");
const utils = require("./utils.js");

class Entity {
	constructor(x = utils.randPos()[0], y = utils.randPos()[1]) {
		this.position = {
			x,
			y,
		};
		this.rotation = 0;
		this.spawned = true;

		this.health = 100;

		this.id = ids.generate();
	}

	kill(killer) {
		this.shouldRemove = true;

		if (killer && killer.score !== undefined) {
			killer.score += this.getKillValue();
		}
	}

	collide() {
		this.health -= 5;
		if (this.health <= 0) {
			this.kill();
		}
	}

	getLevel() {
		return 0;
	}

	getKillValue() {
		return 0;
	}
}

class Drifting extends Entity {
	constructor(x, y) {
		super(x, y);
	}

	update() {
		this.position.x += Math.random();
		this.position.y += Math.random();
	}
}

class Bullet extends Entity {
	constructor(parentEntity, x = parentEntity.position.x, y = parentEntity.position.y, speed = 12) {
		super(x, y);

		this.parentEntity = parentEntity;
		this.rotation = this.parentEntity.rotation;

		this.velocity = speed;
	}

	update() {
		this.position.x += this.velocity * Math.cos(this.rotation * Math.PI / 180);
		this.position.y += this.velocity * Math.sin(this.rotation * Math.PI / 180);

		this.velocity *= 0.98;
		if (this.velocity < 6) {
			this.kill();
		}
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

	fire(entities) {
		return entities.push(new Bullet(this));
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

module.exports = {
	Entity,
	Drifting,
	Bullet,
	Tank,
	Boss,
};