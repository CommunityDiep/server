const WebSocket = require("uws");
const wss = new WebSocket.Server({
	port: 8080,
});

const classes = require("./classes.js");

const entities = [];
const connections = [];

function broadcast() {
	connections.forEach(ws => {
		send(ws, ...arguments);
	});
}
function send(ws, msg, data) {
	if (ws !== null) {
		return ws.send(JSON.stringify([
			msg,
			data,
		]));
	}
}
function update() {
	return broadcast("UPDATE", entities);
}

setInterval(() => {
	entities.forEach(entity => {
		if (entity.update) {
			entity.update();
		}
	});
});

wss.on("connection", ws => {
	const connectIndex = connections.push(ws) - 1;
	const index = entities.push(new classes.PlayableTank()) - 1;

	ws.on("message", data => {
		const msg = JSON.parse(data);
		switch (msg[0]) {
			case "SPAWN": {
				entities[index].spawn(msg[1]);

				send(ws, "SPAWN_RESPONSE", index);
				update();

				break;
			}
		}
	});

	ws.on("close", () => {
		connections[connectIndex] = null;
		entities[index] = null;
	});
});