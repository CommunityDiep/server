const config = require("./config.json");

const randInt = require("random-int");
/**
 * Generates a random position in the arena.
 */
module.exports.randPos = (margin = 0) => {
	return [
		randInt(margin, config.arenaSize.width - margin),
		randInt(margin, config.arenaSize.height - margin),
	];
};