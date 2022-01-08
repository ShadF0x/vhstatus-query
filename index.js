const http = require("http")
const express = require('express')
const app = express()
const fs = require("fs");
let users = {}

const server = http.createServer(app);
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

app.get("/query/valheim", function(request, response){
	fs.readFile(config.log, "utf8", (err, data) => {
		if (err) {
			console.log(err)
			process.exit(1)
		} else {
			let lines = data.split("\n");

			let lastUser;
			for (let line of lines) {
				let handshake = line.match(/(handshake from client )(\d+)/);
				let user = line.match(/(Got character ZDOID from )([\w ]+)(\s:)/);
				let disconnected = line.match(/(Closing socket )(\d\d+)/)
				if (handshake) {
					let id = handshake[2];
					let time = new Date(line.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/));
					users[id] = {connectedTimestamp: time, disconnectedTimestamp: undefined, name: undefined, connected: undefined};
					lastUser = id;
				}
				if (disconnected) {
					let id = disconnected[2];
					if (!users[id]) continue;
					let user = users[id];
					user.disconnectedTimestamp = new Date(line.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/));
					user.connected = false;
				}
				if (user) {
					if (lastUser) {
						users[lastUser].name = user[2];
						users[lastUser].connected = true;
						for (let u in users) { // Clean up users showing up multiple times in the list
							if (users[u].name === user[2] && u !== lastUser) delete users[u];
						}
						lastUser = undefined;
					}
				}
			}
			let msg = {};
			msg.users = users;
			msg.serverName = config.serverName;
			return response.status(200).send(msg);
		}
	});
})

server.listen(config.port, config.ip, () => {
	console.log(`Valheim status at http://${config.ip}:${config.port}/query/valheim`)
})
