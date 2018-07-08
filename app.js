const WebSocket = require("uws");

/**
 * The websocket server.
 */
const wss = new WebSocket.Server({
	port: 8080,
});

const classes = require("./classes.js");
const utils = require("./utils.js");

class PlayableTank extends classes.Tank {
	constructor(ws, x, y, name) {
		super(x, y);

		this.name = name;
		this.spawned = false;

		this.websocket = ws;
		this.websocket.on("message", data => {
			const msg = JSON.parse(data);
			switch (msg[0]) {
				case "SPAWN": {
					this.spawn(msg[1]);

					send(ws, "SPAWN_RESPONSE", this.id);
					update();

					break;
				}
				case "IS_FIRING": {
					if (this.spawned) {
						this.isFiring = msg[1];
					}
					break;
				}
			}
		});
		this.websocket.on("disconnect", () => this.kill());
	}

	update() {
		if (this.isFiring) {
			entities.push(new classes.Bullet(this));
		}
	}

	spawn(data) {
		if (!this.spawned) {
			this.spawned = true;

			this.name = data.name.slice(0, 16);
			this.tank = "basic";

			const pos = utils.randPos();
			this.position.x = pos[0];
			this.position.y = pos[1];
		}
	}
}

/**
 * The list of every entity in this arena.
 */
const entities = [];

/**
 * Broadcasts a message to each connected client.
 */
function broadcast() {
	wss.clients.forEach(ws => {
		send(ws, ...arguments);
	});
}

/**
 * Sends a message with data to a client.
 */
function send(ws, msg, data) {
	if (ws !== null) {
		return ws.send(JSON.stringify([
			msg,
			data,
		]));
	}
}

/**
 * Gives every client updated entity data.
 */
function update() {
	return broadcast("UPDATE", entities);
}

setInterval(() => {
	entities.forEach((entity, index) => {
		if (entity.update) {
			entity.update();
		}
		if (entity.shouldRemove) {
			entities.splice(index, 1);
		}
	});
	update();
}, 50);

wss.on("connection", ws => {
	entities.push(new PlayableTank(ws));
});