// Hide all the upgrade detectors
document.getElementsByClassName('upgradedetect')[0].style.display = 'none';
document.getElementsByClassName('upgradedetect')[1].style.display = 'none';
document.getElementsByClassName('upgradedetect')[2].style.display = 'none';
document.getElementsByClassName('upgradedetect')[3].style.display = 'none';
document.getElementsByClassName('upgradedetect')[4].style.display = 'none';
document.getElementsByClassName('upgradedetect')[5].style.display = 'none';
document.getElementsByClassName('upgradedetect')[6].style.display = 'none';
document.getElementsByClassName('upgradedetect')[7].style.display = 'none';

function isMobile() {
	var mobile = false;
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		mobile = true;
	}
	return mobile;
}

if (isMobile()) {
	alert('It looks likes you\'re on mobile. For the best experience, play on your PC.')
}

// for soft stroking
// Source: https://stackoverflow.com/a/13542669/5513988
function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

var softStroke = true;
var inGame = false;

var bgImage = new Image(window.innerWidth, window.innerHeight);
bgImage.src = 'https://diep.io/title.png';

// Prevent scrolling
window.addEventListener('scroll', function(event) {
	event.preventDefault();
	window.scrollTo(0, 0);
});

// Disable Chrome two-finger swipe to go back/forward
// Source: https://stackoverflow.com/a/46439501/5513988
document.addEventListener(
  'touchstart',
  this.handleTouchStart,
  {passive: false}
)
document.addEventListener(
  'touchmove',
  this.handleTouchMove,
  {passive: false}
)

document.getElementsByClassName('upgradedetect')[0].onclick = function() {
	socket.emit('upgrade', {
		pos: 0
	});
};

document.getElementsByClassName('upgradedetect')[1].onclick = function() {
	socket.emit('upgrade', {
		pos: 2
	});
};

document.getElementsByClassName('upgradedetect')[2].onclick = function() {
	socket.emit('upgrade', {
		pos: 1
	});
};

document.getElementsByClassName('upgradedetect')[3].onclick = function() {
	socket.emit('upgrade', {
		pos: 3
	});
};

document.getElementsByClassName('upgradedetect')[4].onclick = function() {
	socket.emit('upgrade', {
		pos: 4
	});
};

document.getElementsByClassName('upgradedetect')[5].onclick = function() {
	socket.emit('upgrade', {
		pos: 5
	});
};

document.getElementsByClassName('upgradedetect')[6].onclick = function() {
	socket.emit('upgrade', {
		pos: 6
	});
};

document.getElementsByClassName('upgradedetect')[7].onclick = function() {
	socket.emit('upgrade', {
		pos: 7
	});
};

function randInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function param(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

var par = param('s') == undefined ? 'ffa' : param('s');
document.getElementById('server').value = par;

var servers = {
	ffa: {
		name: 'Free For All',
		servers: ['localhost:8080'] //['https://cdiep-serv-nylr.c9users.io/','https://cdiep-serv-nylr.c9users.io/']
	},
	tdm: {
		name: '2 Teams Deathmatch'
	},
	ftdm: {
		name: '4 Teams Deathmatch',
		servers: []
	},
	tag: {
		name: 'Tag',
		servers: []
	},
	farm: {
		name: 'Farming',
		servers: []
	}
};

var resulter;

var servernum = randInt(1, servers[par].servers.length);
var servername = par + 1; // randInt(0,servers[param('s')].servers.length-1)]

var socket = io.connect(param('ip') == undefined ? servers[par].servers[servernum - 1] : param('ip'), {
	reconnect: false
});
var tanktree = {};
socket.on('tanks_update', function(data) {
	tanktree = data;
})

socket.on('disconnect', function(err) {
	console.log(err)
	var socket = function() {
		return io.connect(servers[par].servers[servernum - 1], {
			reconnect: false
		})
	};
});

document.getElementById('server').onchange = function() {
	if (!(document.getElementById('server').value == 'select')) {
		window.open(`${location.origin}${location.pathname}?s=${document.getElementById('server').value}`, "_self");
	}
};

function calculateBarrelPos(angle) {
	var xPos = Math.cos(angle / 180 * Math.PI) * 15;
	var yPos = Math.sin(angle / 180 * Math.PI) * 15;

	return {
		x: xPos,
		y: yPos
	};
}

function drawTank(x, y, angle, radius, color, barrels, bodyType) {
	var animationTime = new Date().getTime()

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(degToRad(angle));
	ctx.scale(radius / 48, radius / 48);

	ctx.lineJoin = "round";
	ctx.strokeStyle = softStroke ? shadeColor2("#999999", -0.25) : "#555555";
	ctx.fillStyle = "#999999";
	ctx.lineWidth = 4 / (radius / 48);

	for (var i = 0; i < barrels.length; i++) {
		if (barrels[i].barrelType == 0) {
			ctx.save();
			ctx.rotate(degToRad(barrels[i].angle));
			ctx.fillRect(0, (48 - barrels[i].width) - 48 + barrels[i].offsetX, barrels[i].length * 2, barrels[i].width * 2);
			ctx.strokeRect(0, (48 - barrels[i].width) - 48 + barrels[i].offsetX, barrels[i].length * 2, barrels[i].width * 2);
			ctx.restore();
		} else if (barrels[i].barrelType == 1) {
			ctx.save();
			ctx.rotate(degToRad(barrels[i].angle));
			ctx.beginPath();
			ctx.moveTo(0, ((-1 * barrels[i].width) / 2) + barrels[i].offsetX);
			ctx.lineTo(barrels[i].length * 2, ((-1 * barrels[i].width * 2) / 2) + barrels[i].offsetX);
			ctx.lineTo(barrels[i].length * 2, ((barrels[i].width * 2) / 2) + barrels[i].offsetX);
			ctx.lineTo(0, ((barrels[i].width) / 2) + barrels[i].offsetX);
			ctx.lineTo(0, ((-1 * barrels[i].width) / 2) + barrels[i].offsetX);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
			ctx.restore();
		};
	};
	ctx.rotate(0);
	ctx.lineWidth = 4 / (radius / 48);

	if (bodyType == 0) {
		ctx.beginPath();
		ctx.arc(48 - 48, 48 - 48, 48, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = "#000000";
	} else if (bodyType == 1) {
		ctx.fillStyle = color;
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";

		ctx.fillRect(-1 * radius * 2, -1 * radius * 2, radius * 4, radius * 4);
		ctx.strokeRect(-1 * radius * 2, -1 * radius * 2, radius * 4, radius * 4);
	} else if (bodyType == 2) {
		ctx.beginPath();
		ctx.fillStyle = "#555555";
		ctx.strokeStyle = "#555555";
		ctx.lineJoin = "round";
		var hA = ((Math.PI * 2) / 6);
		ctx.moveTo(Math.cos((hA * hI) - degToRad(angle) + degToRad((animationTime / 6) % 360)) * 58, Math.sin((hA * hI) - degToRad(angle) + degToRad((animationTime / 6) % 360)) * 58);
		for (var hI = 1; hI < 8; hI++) {
			ctx.lineTo(Math.cos((hA * hI) - degToRad(angle) + degToRad((animationTime / 6) % 360)) * 58, Math.sin((hA * hI) - degToRad(angle) + degToRad((animationTime / 6) % 360)) * 58);
		};
		ctx.fill();
		ctx.stroke();

		ctx.closePath();

		ctx.beginPath();
		ctx.arc(48 - 48, 48 - 48, 48, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = "#000000";
	} else if (bodyType == 3) {
		ctx.beginPath();
		ctx.fillStyle = "#555555";
		ctx.strokeStyle = "#555555";
		ctx.lineJoin = "round";
		var hA = ((Math.PI * 2) / 3);
		ctx.moveTo(Math.cos((hA * hI) - degToRad(angle) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle) + degToRad((animationTime / 3) % 360)) * 64);
		for (var hI = 1; hI < 5; hI++) {
			ctx.lineTo(Math.cos((hA * hI) - degToRad(angle) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle) + degToRad((animationTime / 3) % 360)) * 64);
		};
		ctx.moveTo(Math.cos((hA * hI) - degToRad(angle - 90) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 90) + degToRad((animationTime / 3) % 360)) * 64);
		for (var hI = 1; hI < 5; hI++) {
			ctx.lineTo(Math.cos((hA * hI) - degToRad(angle - 90) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 90) + degToRad((animationTime / 3) % 360)) * 64);
		};
		ctx.moveTo(Math.cos((hA * hI) - degToRad(angle - 180) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 180) + degToRad((animationTime / 3) % 360)) * 64);
		for (var hI = 1; hI < 5; hI++) {
			ctx.lineTo(Math.cos((hA * hI) - degToRad(angle - 180) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 180) + degToRad((animationTime / 3) % 360)) * 64);
		};
		ctx.moveTo(Math.cos((hA * hI) - degToRad(angle - 270) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 270) + degToRad((animationTime / 3) % 360)) * 64);
		for (var hI = 1; hI < 5; hI++) {
			ctx.lineTo(Math.cos((hA * hI) - degToRad(angle - 270) + degToRad((animationTime / 3) % 360)) * 60, Math.sin((hA * hI) - degToRad(angle - 270) + degToRad((animationTime / 3) % 360)) * 64);
		};

		ctx.fill();
		ctx.stroke();

		ctx.closePath();
		ctx.beginPath();
		ctx.arc(48 - 48, 48 - 48, 48, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.fillStyle = "#000000";
	};

	ctx.restore();
};

var width = window.innerWidth;
var height = window.innerHeight;

//sigin

//var chooseTank = document.getElementById('choose-tank');
var gameDiv = document.getElementById('gameDiv');
var signDiv = document.getElementById('signDiv');
var input = document.getElementById('textInput');
var play = document.getElementById('play');

document.getElementById('textInput').onchange = function() {
	ga('send', {
		hitType: 'event',
		eventCategory: 'Title Screen',
		eventAction: 'name-change',
		eventLabel: `Changed name to '${document.getElementById('textInput').value}'.`
	});
}

var spin_angle = 0;

play.onclick = function() {
	//var tank_choice = chooseTank.options[chooseTank.selectedIndex].value;
	/*if(signDivUsername.value != ''){
	  $.getJSON('//api.ipify.org?format=jsonp&callback=?', function(data) {
	    var ip = JSON.stringify(data.ip, null, 2);
	    socket.emit('signIn',{name:signDivUsername.value,address:ip,tank:"Tank",width:width,height:height});
	  }); */

	if (input.value != '') {
		var ip = 104024 * Math.random();
		socket.emit('signIn', {
			name: input.value,
			address: ip,
			tank: "basic",
			width: width,
			height: height
		});

		inGame = true;

		/*global localStorage*/
		localStorage.username = localStorage.username == undefined ? "" : document.getElementById("textInput").value;

		ga('send', {
			hitType: 'event',
			eventCategory: 'Title Screen',
			eventAction: 'play',
			eventLabel: 'Pressed play and joined game.'
		});
	} else {
		alert('Please enter a name.');

	}
}

window.onload = function() {
	document.getElementById("textInput").value = document.getElementById("textInput").value == undefined ? "" : localStorage.username;
};

socket.on('signInResponse', function(data) {
	if (data.success) {

		signDiv.style.display = 'none';
		gameDiv.style.display = 'inline-block';
	} else
		alert("Unable to join. Please try again later.");

});

socket.on('signUpResponse', function(data) {
	if (data.success) {
		alert("Sign up successful!");
	} else
		alert("Sign up unsuccessful!");

});

socket.on('alert', function(data) {});

socket.on('killNotification', function(data) {
	if (selfId) {
		Player.list[data.killer].notif_timer = 0;
		Player.list[data.killer].killtext = 'You\'ve killed ' + data.killed + '.';
	}

});

//chat

/* global ga */

var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');
socket.on('addToChat', function(data) {
	var usertype = data.dev ? 'developer' : data.trusted ? 'trusted user' : 'normal user';
	if (data.server) {
		return
	} else if (data.dev) {
		chatText.innerHTML += '<div style="color:#EF5058;">' + data.text + '</div>';
	} else if (data.trusted) {
		chatText.innerHTML += '<div style="color:#7790F9;">' + data.text + '</div>';
	} else {
		chatText.innerHTML += '<div>' + data.text + '</div>';
	}
	chatText.scrollTop = chatText.scrollHeight;

});

chatForm.onsubmit = function(e) {
	e.preventDefault();
	socket.emit('sendMsgToServer', {
		words: chatInput.value,
		name: input.value,
	});
	chatInput.value = '';

}

//game

var scoreboard_content = document.getElementById('scoreboard-content');
scoreboard_content.style.left = width - 200;
var actual_leaders = document.getElementById('actual-leaders');
var sorted = [];
var changed_indexes = [];
var original_indexes = [];
var points = [];
var nicknames = [];
var scoreboard_list = {};
var selfId = null;

var sortedScores = {};

var ctx = document.getElementById('ctx').getContext("2d");
var canvas = document.getElementById('ctx');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

scoreboard_content.style.opacity = 0;
chatForm.style.opacity = 0;
chatInput.style.opacity = 0;
chatText.style.opacity = 0;

ctx.lineJoin = "round";

//init

/**
 * Draw Diep.io-styled text in object form.
 * @param {Object} obj - The object containing all the text data.
 * @param {string} obj.text - The text to draw.
 * @param {number} obj.x - X position of the text center.
 * @param {number} obj.y - Y position of the text center.
 * @param {number} [obj.maxSize=200] - The maximum width the text can go before condensing.
 * @param {number} [obj.opacity] - The opacity of the text.
 * @param {string} [obj.color=white] - The color of the text.
 * @param {string} [obj.strokeColor=#333333] - The color of the text's stroke.
 * @param {string} [obj.font] - The font to draw the text in.
 */
function drawText(obj) {
	ctx.globalOpacity = obj.opacity == undefined ? 1 : obj.opacity;
	ctx.font = obj.font == undefined ? ctx.font == undefined ? "20px Ubuntu" : ctx.font : obj.font;
	obj.maxSize = obj.maxSize == undefined ? 200 : obj.maxSize;
	ctx.lineWidth = 4;
	ctx.textAlign = "center";

	ctx.save();
	ctx.translate(obj.x, obj.y);

	ctx.fillStyle = obj.strokeColor == undefined ? "#333333" : obj.strokeColor;
	ctx.strokeText(obj.text, 0, 0, obj.maxSize);

	ctx.fillStyle = obj.color == undefined ? "white" : obj.color;
	ctx.fillText(obj.text, 0, 0, obj.maxSize);

	ctx.restore();
};

function degToRad(deg) {
	return deg * (Math.PI / 180);
}

function drawPolygon(x, y, angle, radius, color, sides) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
	ctx.lineJoin = "round";
	ctx.beginPath();
	var step = ((Math.PI * 2) / sides);
	ctx.translate(x, y);
	ctx.rotate(degToRad(angle));
	ctx.moveTo(radius * 2, 0);
	for (var i = 1; i < sides + 2; i++) {
		ctx.lineTo(2 * radius * Math.cos(step * i), 2 * radius * Math.sin(step * i));
	}
	ctx.lineWidth = 4;
	ctx.fill();
	ctx.stroke();

	ctx.closePath();
	ctx.restore();
};

var Shape = function(initPack) {
	var self = {}
	self.id = initPack.id;
	self.x = initPack.x;
	self.y = initPack.y;
	self.angle = initPack.angle;
	self.name = initPack.name;
	self.color = initPack.color;
	self.colorname = initPack.colorname;
	self.hp = initPack.hp;
	self.hpPercent = initPack.hpPercent;
	self.draw = function() {

		if (Math.abs(Player.list[selfId].x - self.x) > width / 2 + 50 || Math.abs(Player.list[selfId].y - self.y) > height / 2 + 50) {
			return;
		}

		var x = self.x - Player.list[selfId].x + width / 2;
		var y = self.y - Player.list[selfId].y + height / 2;
		if (self.name === 'secret-shape1') {
			drawPolygon(x, y, self.angle, 17, self.color, 10);
			drawPolygon(x, y, self.angle, 15, self.color, 9);
			drawPolygon(x, y, self.angle, 13, self.color, 8);
			drawPolygon(x, y, self.angle, 11, self.color, 7);
			drawPolygon(x, y, self.angle, 9, self.color, 6);
		} else {
			if (self.name === 'triangle') {
				drawPolygon(x, y, self.angle, 9, self.color, 3);
				/*ga('send', {hitType: 'event',
				        eventCategory: 'Render',
				        eventAction: 'polygon-render',
				        eventLabel: `Rendered a ${self.colorname} triangle at x ${self.x} and y ${self.y} (relative to player, x ${x} and y ${y}) with angle ${angle} and size ${9}.`
				      });*/
			} else {
				if (self.name === 'alphapentagon') {
					drawPolygon(x, y, self.angle, 50, self.color, 5);
					/*ga('send', {hitType: 'event',
					        eventCategory: 'Render',
					        eventAction: 'polygon-render',
					        eventLabel: `Rendered a ${self.colorname} alpha pentagon at x ${self.x} and y ${self.y} (relative to player, x ${x} and y ${y}) with angle ${angle} and size ${50}.`
					      });*/
				} else {
					if (self.name === 'pentagon') {
						drawPolygon(x, y, self.angle, 17, self.color, 5);
						/*ga('send', {hitType: 'event',
        eventCategory: 'Render',
        eventAction: 'polygon-render',
        eventLabel: `Rendered a ${self.colorname} pentagon at x ${self.x} and y ${self.y} (relative to player, x ${x} and y ${y}) with angle ${angle} and size ${17}.`
      });*/
					} else {
						if (self.name === 'square') {
							drawTank(x, y, self.angle, 18.5, self.color, [], 1);

							/*ga('send', {hitType: 'event',
							  eventCategory: 'Render',
							  eventAction: 'polygon-render',
							  eventLabel: `Rendered a ${self.colorname} square at x ${self.x} and y ${self.y} (relative to player, x ${x} and y ${y}) with angle ${angle} and size ${18.5}.`
							});*/
						}
					}
				}
			}
		}
	}

	Shape.list[self.id] = self;
	return self;

}

Shape.list = {};

var Player = function(initPack) {
	var self = {};
	self.canUpgrade = false;
	self.hasUpgraded = false;
	self.notif_timer = 0;
	self.killtext = '';
	self.id = initPack.id;
	self.number = initPack.number;
	self.x = initPack.x;
	self.y = initPack.y;
	self.tank = initPack.tank;
	self.hp = initPack.hp,
		self.hpMax = initPack.hpMax,
		self.score = initPack.score,
		self.name = initPack.name,
		self.mouseAngle = initPack.mouseAngle;
	self.invisible = initPack.invisible;
	self.team = initPack.team;
	self.autospin = initPack.autospin;
	self.angle = self.mouseAngle;
	self.draw = function(angle, isPlayer) {

		if (isPlayer) {
			self.angle = angle;
		} else {
			self.angle = self.mouseAngle;
		}

		var x = self.x - Player.list[selfId].x + width / 2;
		var y = self.y - Player.list[selfId].y + height / 2;

		var tcolor = {
			"red": "#F14E54",
			"blue": "#1DB2DF",
			"purple": "#BE83F2",
			"green": "#24DF73"
		};

		//console.log('mouse loc: ' + self.mouseAngle);
		//var x_loc = calculateBarrelX(self.mouseAngle);
		//var y_loc = calculateBarrelY(self.mouseAngle);
		//console.log(x_loc);
		//console.log(y_loc);
		ctx.fillStyle = 'black';
		var hpWidth = 30 * self.hp / self.hpMax;
		ctx.font = '30px Ubuntu';
		//ctx.save();
		//ctx.rotate();
		if (!self.invisible) {
			var size = 25; // + parseInt(self.score)*1.25;
			var score = self.score + 3
			if (size > 32) {
				var size = 32;
			}
			if (size < 25) {
				var size = 25;
			}
			if (score > 3) {
				var score = 3;
			} //What are we doing? you do shapes, i do team hey can't target each other also for teas ok
			var angle;
			var tcolor = {
				"red": "#F14E54",
				"blue": "#1DB2DF",
				"purple": "#BE83F2",
				"green": "#24DF73"
			};
			if (self.team === "none") {
				var color = self.id === selfId ? '#1DB2DF' : '#F14E54';
			} else {
				var color = tcolor[self.team];
			};
			drawTank(x, y, self.angle, size, color, tanktree[self.tank].barrels, tanktree[self.tank].body);
			/*if (self.tank === "destroyer"){
			  drawTank(x+28, y+28, self.angle, size, color, , 0);
			} else {
			if (self.tank === "destroyerflank"){
			  drawTank(x+28, y+28, self.angle, size, color, , 0);
			} else {
			if (self.tank === "Hybrid"){
			  drawTank(x+28, y+28, self.angle, size, color, [{barrelType:0,width:39,length:48,angle:0,offsetX:0},{barrelType:1,width:39,length:37,angle:180,offsetX:0}], 0);
			} else {
			  if (self.tank === "sniper"){
			    drawTank(x+28, y+28, self.angle, size, color, , 0);
			} else {
			  if (self.tank === "MachineGun"){
			    drawTank(x+28, y+28, self.angle, size, color, , 0);
			  } else {
			    if (self.tank === "streamliner"){
			      drawTank(x+28, y+28,  self.angle, size, color, [{barrelType:0,width:19,length:51,angle:0,offsetX:0},{barrelType:0,width:19,length:46,angle:0,offsetX:0},{barrelType:0,width:19,length:41,angle:0,offsetX:0},{barrelType:0,width:19,length:36,angle:0,offsetX:0},{barrelType:0,width:19,length:31,angle:0,offsetX:0}], 0);
			    } else {
			        if (self.tank === "Twin Flank"){
			          drawTank(x+28, y+28,  self.angle, size, color, [{barrelType:0,width:19,length:48,angle:0,offsetX:25},{barrelType:0,width:19,length:48,angle:0,offsetX:-25},{barrelType:0,width:19,length:48,angle:180,offsetX:25},{barrelType:0,width:19,length:48,angle:180,offsetX:-25}], 0);
			        } else {*/
			/*
			                if (self.tank === "Octo Tank"){
			                  drawTank(x+28, y+28, self.angle, size, color, [{barrelType:0,width:19,length:48,angle:0,offsetX:0},{barrelType:0,width:19,length:48,angle:90,offsetX:0},{barrelType:0,width:19,length:48,angle:180,offsetX:0},{barrelType:0,width:19,length:48,angle:270,offsetX:0},{barrelType:0,width:19,length:48,angle:45,offsetX:0},{barrelType:0,width:19,length:48,angle:135,offsetX:0},{barrelType:0,width:19,length:48,angle:225,offsetX:0},{barrelType:0,width:19,length:48,angle:315,offsetX:0}], 0);
			                } else {
			                  if (self.tank === "Arena Closer"){
			              drawTank(x+28, y+28,  self.angle, 60, '#FEE769', [{barrelType:0,width:16,length:37,angle:0,offsetX:0}], 0);
			                  } else {
			                    if (self.tank === "Latoonia Tank"){
			                    drawTank(x+28, y+28,  self.angle, size, color, [{barrelType:0,width:19,length:300,angle:0,offsetX:0}], 0);
			                    } else {
			                      if (self.tank == 'basic'){
			            drawTank(x+28, y+28,  self.angle, size, color, [{barrelType:0,width:19,length:48,angle:0,offsetX:0}], 0);
			          } else {
			            drawTank(x+28, y+28, self.angle, size, color, tanktree[self.tank].barrels)
			          }
			        }}}}}}}}}}}}}}}};*/
			//    ctx.drawImage(Img.player,x,y,55,55);
			//ctx.restore();
			//ctx.fillStyle = 'gray';
			// ctx.fillRect(x+x_loc+27.5/2,y+y_loc+27.5,30,4);

			// DRAW HEALTH BAR
			drawBar({
				x: x + size,
				y: (y + size) + 15,
				filled: self.hp / self.hpMax,
				width: 38,
				height: 7,
				renderOnFull: false
			});

			// DRAW NAMES
			if (self.id !== selfId) {
				drawText({
					text: self.name,
					x: x + (size / 2),
					y: y - size + 16,
					font: '17px Ubuntu'
				});
			}

		}
	};

	Player.list[self.id] = self;
	return self;
}
var angle = 0;
var angle_pure = 0;
var mouseX;
var mouseY;
$(document).mousemove(function(e) {
	if (!selfId || Player.list[selfId].autospin)
		return;

	var x = -width + e.pageX - 8;
	var y = -height + e.pageY - 8;

	angle = Math.atan2(y, x) / (Math.PI * 180);

	var boxCenter = [(width / 2) + 25 / 2, (height / 2) + 25 / 2];

	angle = Math.atan2(e.pageX - boxCenter[0], -(e.pageY - boxCenter[1])) * (180 / Math.PI);
	angle_pure = Math.atan2(e.pageX - boxCenter[0], -(e.pageY - boxCenter[1]) * (180 / Math.PI));
	angle = angle - 90;

	if (Player.list[selfId].autospin) {
		var mgpower = setInterval(function() {
			if (!Player.list[selfId].autospin) {
				clearInterval(mgpower);
			}
			angle++
		})
	}

	socket.emit('keyPress', {
		inputId: 'mouseAngle',
		state: angle
	});

});

Player.list = {};

function drawGrid(x, y, width, height, slotSize, lineColor, xOffset, yOffset) {
	ctx.fillStyle = '#cdcdcd';
	ctx.fillRect(x, y, width, height);

	ctx.save();
	ctx.translate(x, y);
	ctx.beginPath();
	ctx.strokeColor = lineColor;
	ctx.lineWidth = 1;

	for (var i = 0; i < width || i < height; i += slotSize) {
		ctx.moveTo(0, i);
		ctx.lineTo(width, i);
		ctx.moveTo(i + (xOffset % slotSize), 0);
		ctx.lineTo(i + (xOffset % slotSize), height);
	};
	ctx.strokeStyle = lineColor;
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

function drawUpgrades() {
	function drawUpgradeSlot(x, y, width, height, color, tankData) {
		ctx.save();

		ctx.globalAlpha = 0.9;
		ctx.font = "bold 20px Ubuntu";
		ctx.lineWidth = 5;
		ctx.textAlign = "center";
		ctx.strokeStyle = "#555555";
		ctx.lineJoin = "round";
		ctx.fillStyle = color;

		ctx.fillRect(x, y, width, height);
		ctx.fillStyle = "#000000";

		ctx.globalAlpha = 0.2;
		ctx.fillRect(x, y + (height / 2), width, height / 2);

		ctx.globalAlpha = 1;
		ctx.strokeRect(x, y, width, height);

		if (typeof tankData !== 'string') {
			ctx.globalAlpha = 1;
			drawTank(x + (width / 2), y + (height / 2), spin_angle, 20, '#1DB2DF', tankData.barrels, tankData.body);
		}

		drawText({
			text: typeof tankData == 'string' ? tankData : tankData.localized,
			x: x + (width / 2),
			y: y + height - 10,
			maxSize: width - 3
		});

		ctx.restore();
	};

	function nfup(pos) {
		var uptank = tanktree[Object.keys(tanktree[Player.list[selfId].tank].upgrades)[pos]];

		if (uptank == undefined) {
			return undefined;
		} else {
			if (uptank.barrels == undefined) {
				uptank.barrels = [];
			}
			if (uptank.body == undefined) {
				uptank.body = 0;
			}

			return uptank;
		}
	}

	if (Player.list[selfId].canUpgrade && tanktree[Player.list[selfId].tank].upgrades !== undefined && Object.keys(tanktree[Player.list[selfId].tank].upgrades).length > 0) {

		if (nfup(0) !== undefined) {
			drawUpgradeSlot(10, 60, 128, 128, "#6cf1ec", nfup(0));
		}

		if (nfup(1) !== undefined) {
			drawUpgradeSlot(148, 60, 128, 128, "#98f06b", nfup(1));
		}

		if (nfup(2) !== undefined) {
			drawUpgradeSlot(10, 198, 128, 128, "#f06c6c", nfup(2));
		}

		if (nfup(3) !== undefined) {
			drawUpgradeSlot(148, 198, 128, 128, "#f0d96c", nfup(3));
		}

		if (nfup(4) !== undefined) {
			drawUpgradeSlot(10, 336, 128, 128, "#6c96f0", nfup(4));
		}

		if (nfup(5) !== undefined) {
			drawUpgradeSlot(148, 336, 128, 128, "#b894fa", nfup(5));
		}

		if (nfup(6) !== undefined) {
			drawUpgradeSlot(10, 476, 128, 128, "#ec6bf1", nfup(6));
		}

		if (nfup(7) !== undefined) {
			drawUpgradeSlot(148, 476, 128, 128, "#eeb790", nfup(7));
		}

		drawUpgradeSlot(98, 626, 100, 30, "#b0b0b0", "Ignore");

		drawText({
			text: "Upgrades",
			x: 138,
			y: 40,
			opacity: '1',
			font: "bold 30px Ubuntu"
		});
	}

};

function drawCircle(x, y, radius, color, trap) {
	color = color == undefined ? '#1DB2DF' : color;

	if (trap == 'trap') {
		var radius = 0;
		ctx.save();
		ctx.lineWidth = 4;
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
		ctx.fillStyle = color;
		ctx.translate(x, y)
		ctx.beginPath();
		ctx.lineJoin = "round";
		var hA = ((Math.PI * 2) / 3);
		ctx.moveTo(Math.cos(hA * hI) * radius, Math.sin(hA * hI) * radius);
		for (var hI = 1; hI < 5; hI++) {

			ctx.lineTo(Math.cos(hA * hI) * radius, Math.sin(hA * hI) * radius);
			ctx.lineTo(Math.cos((hA * hI) + (hA / 2)) * (radius / 3.5), Math.sin((hA * hI) + (hA / 2)) * (radius / 3.5));
		};
		ctx.fill();
		ctx.stroke();

		ctx.closePath();
		ctx.restore();
	} else {
		ctx.save();
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = softStroke ? shadeColor2(color, -0.25) : "#555555";
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	}
};

/* global tcolor */
var Bullet = function(initPack) {
	var self = {};
	self.id = initPack.id;
	self.pid = initPack.parent_id;
	self.x = initPack.x;
	self.y = initPack.y;
	if (Player.list[self.pid]) {
		self.parent_tank = Player.list[self.pid].tank;
	}
	self.type = initPack.type;
	var color = self.parent_tank == 'Arena Closer' ? '#FEE769' : self.pid === selfId ? '#1DB2DF' : '#F14E54';
	self.draw = function() {
		var x = self.x - Player.list[selfId].x + width / 2;
		var y = self.y - Player.list[selfId].y + height / 2;
		if (self.parent_tank == 'destroyer' || self.parent_tank == 'destroyerflank' || self.parent_tank == 'Hybrid') {
			ctx.fillStyle = color;
			drawCircle(x, y, 20, color, self.type)
		} else if (self.parent_tank == 'Arena Closer') {
			ctx.fillStyle = color;
			drawCircle(x, y, 19, color, self.type)

		} else if (self.parent_tank == 'streamliner') {
			ctx.fillStyle = color;
			drawCircle(x, y, 8, color, self.type)
			//ctx.drawImage(Img.bullet,self.x-5,self.y-5,15,15);

		} else {
			ctx.fillStyle = color;
			drawCircle(x, y, 10, {
				"red": "F14E54",
				"blue": "#1DB2DF"
			}.team, self.type)
			//ctx.drawImage(Img.bullet,self.x-5,self.y-5,20,20);
		}

	}
	Bullet.list[self.id] = self;
	return self;
}

Bullet.list = {};

socket.on('init', function(data) {
	if (data.selfId) {
		selfId = data.selfId;
	}

	//console.log(data.player.length);
	for (var i = 0; i < data.player.length; i++) {
		new Player(data.player[i]);
	}

	for (var i = 0; i < data.bullet.length; i++) {
		new Bullet(data.bullet[i]);
	}

	//console.log(data.shape.length);
	for (var i = 0; i < data.shape.length; i++) {
		//console.log('adding shape');
		new Shape(data.shape[i]);
		//console.log('LIST LEN:' + Object.keys(Shape.list).length);
	}

});

//update

/*socket.on('death',function(data){
  if (selfId === data.id) {
      signDiv.style.display = 'inline-block';
      gameDiv.style.display = 'none';
  }
})*/

socket.on('update', function(data) {
	points = [];
	nicknames = [];
	for (var i = 0; i < data.player.length; i++) {
		var player_id = data.player[i].id;

		var pack = data.player[i];
		//console.log(pack);
		var p = Player.list[pack.id]
		player_id = Number(String(player_id).replace('0.', ''));
		points.push(data.player[i].score + '.' + player_id);

		if (p) {

			scoreboard_list[player_id] = Player.list[p.id].name;

			if (pack.tank) {
				p.tank = pack.tank;
			}

			if (pack.mouseAngle !== undefined) {
				p.mouseAngle = pack.mouseAngle;
			}
			if (pack.upgraded != undefined)
				p.hasUpgraded = pack.upgraded;
			if (pack.x !== undefined)
				p.x = pack.x;
			if (pack.y !== undefined)
				p.y = pack.y;
			if (pack.hp !== undefined)
				p.hp = pack.hp;
			if (pack.score !== undefined)
				p.score = pack.score;
		}
	}

	for (var i = 0; i < data.player.length; i++) {
		if (data.player[i].id == selfId) {
			var pack = data.shape[data.player[i].id];
			for (var i = 0; i < pack.length; i++) {
				//console.log(pack[i].id);
				//console.log(Shape.list);
				var s = Shape.list[pack[i].id];
				if (s) {
					if (pack[i].x !== undefined)
						s.x = pack[i].x;
					if (pack[i].y !== undefined)
						s.y = pack[i].y;
				}

			}
		}
	}

	for (var i = 0; i < data.bullet.length; i++) {
		var pack = data.bullet[i];
		var b = Bullet.list[data.bullet[i].id];
		if (b) {
			if (pack.x !== undefined)
				b.x = pack.x;
			if (pack.y !== undefined)
				b.y = pack.y;
		}
	}

	var toShow;
	if (sorted.length > 3) {
		toShow = 3;
	} else {
		toShow = sorted.length;
	}

	sorted = points.sort(function(a, b) {
		return b - a
	});

	var addToLeaderboard = '';

	for (var i = 0; i < toShow; i++) {
		var current_score = sorted[i];
		var current_score_string = String(current_score);
		var split = current_score_string.split('.');

		var score_current = split[0];
		var currentName = scoreboard_list[Number(split[1])];

		addToLeaderboard += currentName + ' - ' + score_current + '<br/><br/><br/><br/>';

		// for new leaderboard
		sortedScores[currentName] = score_current;
	}

	actual_leaders.innerHTML = addToLeaderboard;

});

//remove

socket.on('remove', function(data) {
	for (var i = 0; i < data.player.length; i++) {
		delete Player.list[data.player[i]];
	}

	for (var i = 0; i < data.bullet.length; i++) {
		delete Bullet.list[data.bullet[i]];
	}

	for (var i = 0; i < data.shape.length; i++) {
		delete Shape.list[data.shape[i]];
	}

});

//drawing

var pastx;
var pasty;

setInterval(function() {
	canvas.width = window.innerWidth;
	width = window.innerWidth;

	canvas.height = window.innerHeight;
	height = window.innerHeight;

	if (inGame) {
		if (Player.list[selfId]) {
			scoreboard_content.style.opacity = 0;
			textInput.style.display = "none";
			chatForm.style.opacity = 1;
			chatInput.style.opacity = 1;
			chatText.style.opacity = 1;

			if (Player.list[selfId].score > 20 && Player.list[selfId].hasUpgraded == false) {
				Player.list[selfId].canUpgrade = true;
				document.getElementsByClassName('upgradedetect')[0].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[1].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[2].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[3].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[4].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[5].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[6].style.display = 'inline';
				document.getElementsByClassName('upgradedetect')[7].style.display = 'inline';
			}
		}
		if (spin_angle < 360) {
			spin_angle += 0.25;
		} else {
			spin_angle = 0;
		}
		if (!selfId)
			return;
		/*if (!(pastx == Player.list[selfId].x) || !(pasty == Player.list[selfId].y)){
		}*/
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#b9b9b9';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#cdcdcd';
		drawGrid(width / 2 - Player.list[selfId].x, height / 2 - Player.list[selfId].y, 1500, 1500, 24, "#C6C6C6", 0, 0);
		pastx = Player.list[selfId].x;
		pasty = Player.list[selfId].y;

		for (var i in Shape.list) {
			Shape.list[i].draw();
		}
		for (var i in Bullet.list) {
			Bullet.list[i].draw();
		}
		for (var i in Player.list) {
			if (Player.list[i].id == selfId) {
				Player.list[i].draw(angle, true);
			} else {
				Player.list[i].draw(angle, false);
			}
			Player.list[i].notif_timer += 1;
		}

		drawUpgrades();
		drawHotbar();
		drawKills();
		drawPlayerCount();
		drawScoreboard();
	} else {
		// SHOW TEXT INPUT
		textInput.style.display = "initial";

		// TITLE SCREEN IMAGE
		if (canvas.width / canvas.height > bgImage.width / bgImage.height) {
			ctx.drawImage(bgImage, canvas.width / 2 - bgImage.width / 2, 0, canvas.width, canvas.height);
		} else {
			ctx.drawImage(bgImage, 0, canvas.height / 2 - bgImage.height / 2, canvas.width, canvas.height);
		}

		// DARKEN THE IMAGE
		/*ctx.fillColor = "black";
		ctx.globalAlpha = 0.03;

		ctx.fillRect(0, 0, canvas.width, canvas.height);*/

		drawText({
			text: 'This is the tale of...',
			x: canvas.width / 2,
			y: (canvas.height / 2) - 28,
			font: "bold 18px Ubuntu"
		});

		ctx.fillStyle = "white";
		ctx.fillRect((canvas.width / 2) - 160, (canvas.height / 2) - 20, 320, 40);

		ctx.fillStyle = "black";
		ctx.strokeRect((canvas.width / 2) - 160, (canvas.height / 2) - 20, 320, 40);

		document.getElementById('textInput').style.left = (canvas.width / 2) - 160 + "px";
		document.getElementById('textInput').style.top = (canvas.height / 2) - 20 + "px";

		drawText({
			text: '(press enter to spawn)',
			x: canvas.width / 2,
			y: (canvas.height / 2) + 32,
			font: "bold 10px Ubuntu"
		});
	}
}, 10);



// Replace this with drawStats soon.
// The new function will include player count/server name,
// but will look more like Diep.io's bottom-right corner text.
function drawPlayerCount() {
	var players = Object.keys(Player.list).length
	var plural = Object.keys(Player.list).length == 1 ? '' : 's';

	drawText({
		text: `${Object.keys(Player.list).length} player${plural} on ${servername}`,
		x: width - 190,
		y: height - 50,
		font: "bold 30px Ubuntu"
	});
};

function drawKills() {
	if (Player.list[selfId].notif_timer < 400) {
		ctx.fillStyle = 'white';
		drawText({
			text: Player.list[selfId].killtext,
			x: (width / 2) - 120,
			y: 30,
			font: "bold 30px Ubuntu"
		});
	}
};

function drawHotbar() {
	ctx.fillStyle = 'white';

	drawText({
		text: Player.list[selfId].name,
		x: width / 2,
		y: height - 50,
		opacity: '0.8',
		font: "bold 30px Ubuntu"
	});

	// Will soon be replaced by score bar, which uses drawBar's native label property
	drawText({
		text: `Score: ${Player.list[selfId].score}`,
		x: width / 2,
		y: height - 30,
		font: '10px Ubuntu'
	});

	// How bout we don't try that score bar
	//drawBar({})
}

// obj.width: total width of bar (in pixels)
// obj.height: total height of bar (in pixels)
// obj.color: background color
// obj.fillColor: color of filled area
// obj.filled: decimal representing how much of bar is filled
// obj.renderOnFull: still render even if a full bar
// obj.label: label inside of bar
// obj.x: X position of bar (centered)
// obj.y: Y position of bar (centered)
function drawBar(obj) {
	// CREATE OBJECT IF NOT SPECIFIED
	obj = obj == undefined ? {} : obj;

	// DEFAULTS
	obj.width = obj.width == undefined ? 30 : obj.width;
	obj.height = obj.height == undefined ? 6 : obj.height;
	obj.color = obj.color == undefined ? '#555555' : obj.color;
	obj.fillColor = obj.fillColor == undefined ? '#88e281' : obj.fillColor;
	obj.filled = obj.filled == undefined ? 0.5 : obj.filled;
	obj.renderOnFull = obj.renderOnFull == undefined ? true : obj.renderOnFull;
	obj.label = obj.label == undefined ? '' : obj.label;
	obj.x = obj.x == undefined ? 30 : obj.x - (obj.width / 2);
	obj.y = obj.y == undefined ? 30 : obj.y - (obj.height / 2);

	if (obj.filled < 1 || obj.renderOnFull) {
		ctx.lineJoin = 'round';

		ctx.fillStyle = obj.color;
		ctx.fillRect(obj.x - (obj.width / 2), obj.y - (obj.height / 2), obj.width, obj.height);

		ctx.fillStyle = obj.fillColor;
		ctx.fillRect(obj.x - (obj.width / 2) + 1, (obj.y - (obj.height / 2)) + 1, obj.filled * (obj.width - 2), obj.height - 2);
	}
}

var drawScoreboard = function() {
	drawText({
		text: 'Scoreboard',
		x: width - 200,
		y: 40,
		opacity: '0.8',
		font: "bold 30px Ubuntu"
	});

	//console.log(sortedScores)

	// Change back to default font
	ctx.font = "bold 30px Ubuntu";
}

document.onkeydown = function(event) {
	if (!(document.activeElement == document.getElementById('chat-input'))) {
		if (event.keyCode == 69) //e
			socket.emit('keyPress', {
				inputId: 'auto',
				state: true
			});
		if (event.keyCode == 67) //c
			socket.emit('keyPress', {
				inputId: 'spin',
				state: true
			});
		if (event.keyCode == 68 || event.keyCode == 39) { //d or right
			socket.emit('keyPress', {
				inputId: 'right',
				state: true
			});
			//Player.list[i].x +=1;
		} else if (event.keyCode == 83 || event.keyCode == 40) //s or down
			socket.emit('keyPress', {
				inputId: 'down',
				state: true
			});
		else if (event.keyCode == 65 || event.keyCode == 37) { //a or left
			socket.emit('keyPress', {
				inputId: 'left',
				state: true
			});
			//Player.list[i].x -= 1;

		} else if (event.keyCode == 87 || event.keyCode == 38) //w or up
			socket.emit('keyPress', {
				inputId: 'up',
				state: true
			});
		else if (event.keyCode == 32) //spacebar
			socket.emit('keyPress', {
				inputId: 'attack',
				state: true
			});
		else if (event.keyCode == 16) //shift
			socket.emit('keyPress', {
				inputId: 'repel',
				state: true
			});
		else if (event.keyCode == 123)//f11
			if (!document.fullscreenElement) {
				document.getElementById('ctx').webkitRequestFullscreen();
			} else {
				document.exitFullscreen();
			}
	}
};

document.onkeyup = function(event) {
	if (!(document.activeElement == document.getElementById('chat-input'))) {
		if (event.keyCode == 68 || event.keyCode == 39) { //d or right
			socket.emit('keyPress', {
				inputId: 'right',
				state: false
			});
		} else if (event.keyCode == 83 || event.keyCode == 40) //s or down
			socket.emit('keyPress', {
				inputId: 'down',
				state: false
			});
		else if (event.keyCode == 65 || event.keyCode == 37) //a or left
			socket.emit('keyPress', {
				inputId: 'left',
				state: false
			});
		else if (event.keyCode == 87 || event.keyCode == 38) //w or up
			socket.emit('keyPress', {
				inputId: 'up',
				state: false
			});
		else if (event.keyCode == 187) //=
			socket.emit('keyPress', {
				inputId: 'inc',
				state: false
			});
		else if (event.keyCode == 189) //-
			socket.emit('keyPress', {
				inputId: 'dec',
				state: false
			});
		else if (event.keyCode == 32) //spacebar
			socket.emit('keyPress', {
				inputId: 'attack',
				state: false
			});
		else if (event.keyCode == 16) //shift
			socket.emit('keyPress', {
				inputId: 'repel',
				state: false
			});
	}
};

//window.onscroll = function () { window.scrollTo(0, 0); };

document.onmousedown = function(event) {
	if (signDiv.style.display == 'none') {
		socket.emit('keyPress', {
			inputId: event.button == 0 ? 'attack' : 'repel',
			state: true
		});
	}
}

document.onmouseup = function(event) {
	socket.emit('keyPress', {
		inputId: event.button == 0 ? 'attack' : 'repel',
		state: false
	});
}
