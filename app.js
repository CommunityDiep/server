const WebSocket = require("uws");
const wss = new WebSocket.Server({
	port: 8080,
});

const classes = require("./classes.js");
const entities = [];

wss.on("connection", ws => {
	const index = entities.push(new classes.Player()) - 1;

	ws.on("message", data => {
		const msg = JSON.parse(data);
		switch (msg[0]) {
			case "SPAWN": {
				entities[index].spawn(msg[1]);
				break;
			}
		}
	});
});