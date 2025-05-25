const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const cors = require("cors");
app.use(cors({
  origin: "https://tictactoegroup8.netlify.app", // your Netlify frontend
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);
// const io = new Server(server);
const io = new Server(server, {
  cors: {
    origin: "https://tictactoegroup8.netlify.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Serve static files (HTML, CSS, JS)
app.use(express.static(path.resolve("")));

// === CLASSIC MODE ===
const classic = io.of("/classic");
let classicQueue = [];
let classicGames = [];

classic.on("connection", (socket) => {
    console.log("User connected to CLASSIC");

     socket.on("find", (e) => {
        const userName = e.userName?.trim();
        if (!userName) return;

        socket.userName = userName;

        // ✅ Check for duplicate name in queue or active games
        const nameInQueue = classicQueue.includes(userName);
        const nameInGame = classicGames.some(
            game => game.p1.p1name === userName || game.p2.p2name === userName
        );

        if (nameInQueue || nameInGame) {
            socket.emit("nameError", {
                message: "This name is already in use. Please choose another one."
            });
            return;
        }

        console.log(`[FIND] ${userName} is searching. Queue length: ${classicQueue.length}`);
        classicQueue.push(userName);

        if (classicQueue.length >= 2) {
            console.log(`[MATCH] Pairing ${classicQueue[0]} with ${classicQueue[1]}`);
            const game = {
                p1: { p1name: classicQueue[0], p1value: "X", p1move: "" },
                p2: { p2name: classicQueue[1], p2value: "O", p2move: "" },
                sum: 1
            };
            classicGames.push(game);
            classicQueue.splice(0, 2);
            setTimeout(() => {
                classic.emit("find", { allPlayers: classicGames });
                console.log(`[START] Game between ${game.p1.p1name} and ${game.p2.p2name} has started.`);
            }, 3000); // 3 seconds
        }
    });


        socket.on("cancelSearch", () => {
        classicQueue = classicQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} cancelled search (CLASSIC).`);
    });

    socket.on("disconnect", () => {
        classicQueue = classicQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} disconnected and was removed from CLASSIC queue.`);
    });



    socket.on("playing", (e) => {
        const game = classicGames.find(g => g.p1.p1name === e.userName || g.p2.p2name === e.userName);
        if (game) {
            if (e.value === "X") game.p1.p1move = e.id;
            if (e.value === "O") game.p2.p2move = e.id;
            game.sum++;
            classic.emit("playing", { allPlayers: classicGames });
        }
    });

    socket.on("Game Over!", (e) => {
        classicGames = classicGames.filter(g => g.p1.p1name !== e.userName && g.p2.p2name !== e.userName);
    });
});


// === BLITZ MODE ===
const blitz = io.of("/blitz");
let blitzQueue = [];
let blitzGames = [];

blitz.on("connection", (socket) => {
    console.log("User connected to BLITZ");

 socket.on("find", (e) => {
        if (e.userName) {
        const userName = e.userName?.trim();
        if (!userName) return;

        socket.userName = userName;

        const nameInQueue = blitzQueue.includes(userName);
        const nameInGame = blitzGames.some(game =>
            game.p1.p1name === userName || game.p2.p2name === userName
        );

        if (nameInQueue || nameInGame) {
            socket.emit("nameError", {
                message: "This name is already in use. Please choose another one."
            });
            return;
        }

        console.log(`[FIND] ${userName} is searching in BLITZ`);
        blitzQueue.push(userName);
            if (blitzQueue.length >= 2) {
                const game = {
                    p1: { p1name: blitzQueue[0], p1value: "X", p1moves: [] },
                    p2: { p2name: blitzQueue[1], p2value: "O", p2moves: [] },
                    sum: 10001
                };
                blitzGames.push(game);
                blitzQueue.splice(0, 2);
                setTimeout(() => {
                 blitz.emit("find", { allPlayers: blitzGames });
                console.log(`[START] Game between ${game.p1.p1name} and ${game.p2.p2name} has started.`);
            }, 3000); // 3 seconds
            }
        }

        socket.on("turnTimeout", (e) => {
            const gameIndex = blitzGames.findIndex(
                g => g.p1.p1name === e.userName || g.p2.p2name === e.userName
            );
    
            if (gameIndex !== -1) {
                const game = blitzGames[gameIndex];
                const loser = e.userName;
                const winner = (game.p1.p1name === loser) ? game.p2.p2name : game.p1.p1name;
    
                // Notify both players about the timeout
                blitz.emit("Game Over!", {
                    reason: "timeout",
                    loser,
                    winner
                });
    
                // Remove the game from active games
                blitzGames.splice(gameIndex, 1);
            }
        });
    
    });

        socket.on("cancelSearch", () => {
        blitzQueue = blitzQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} cancelled search (BLITZ).`);
    });

    socket.on("disconnect", () => {
        blitzQueue = blitzQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} disconnected and was removed from BLITZ queue.`);
    });

    socket.on("playing", (e) => {
        const game = blitzGames.find(g => g.p1.p1name === e.userName || g.p2.p2name === e.userName);
        if (game) {
            if (e.value === "X") {
                game.p1.p1moves.push(e.id);
                if (game.p1.p1moves.length > 3) game.p1.p1moves.shift();
            } else if (e.value === "O") {
                game.p2.p2moves.push(e.id);
                if (game.p2.p2moves.length > 3) game.p2.p2moves.shift();
            }
            game.sum++;
            blitz.emit("playing", { allPlayers: blitzGames });
        }
    });

    socket.on("Game Over!", (e) => {
        blitzGames = blitzGames.filter(g => g.p1.p1name !== e.userName && g.p2.p2name !== e.userName);
    });
});




// === POWERUP MODE ===
const powerup = io.of("/powerup");
let powerupQueue = [];
let powerupGames = [];

powerup.on("connection", (socket) => {
    console.log("User connected to POWERUP");

 socket.on("find", (e) => {
        if (e.userName) { 
        const userName = e.userName?.trim();
        if (!userName) return;

        socket.userName = userName;

        const nameInQueue = powerupQueue.includes(userName);
        const nameInGame = powerupGames.some(game =>
            game.p1.p1name === userName || game.p2.p2name === userName
        );

        if (nameInQueue || nameInGame) {
            socket.emit("nameError", {
                message: "This name is already in use. Please choose another one."
            });
            return;
        }

        console.log(`[FIND] ${userName} is searching in POWERUP`);
            
            powerupQueue.push(e.userName);
            if (powerupQueue.length >= 2) {
                const game = {
                    p1: { p1name: powerupQueue[0], p1value: "X", p1moves: [], p1time: 30 },
                    p2: { p2name: powerupQueue[1], p2value: "O", p2moves: [], p2time: 30 },
                    sum: 50001
                };
                powerupGames.push(game);
                powerupQueue.splice(0, 2);
                setTimeout(() => {
                powerup.emit("find", { allPlayers: powerupGames });
                console.log(`[START] Game between ${game.p1.p1name} and ${game.p2.p2name} has started.`);
            }, 3000); // 3 seconds
            }
        }
    });

    // Power-up remove time logic: it should remove from the opponent's timer, not the player using it.
    socket.on("removeTime", ({ target, userName }) => {
        const game = powerupGames.find(g => g.p1.p1name === userName || g.p2.p2name === userName);
        if (!game) return;
    
        let opponent;
        let opponentTimeKey;
    
        if (game.p1.p1name === target) {
            opponent = game.p1;
            opponentTimeKey = 'p1time';
        } else if (game.p2.p2name === target) {
            opponent = game.p2;
            opponentTimeKey = 'p2time';
        } else {
            return;
        }
    
        if (opponent[opponentTimeKey] > 10) {
            opponent[opponentTimeKey] -= 10;
        } else {
            opponent[opponentTimeKey] = 0;
        }
    
        powerup.emit("removeTime", { target: target, time: opponent[opponentTimeKey] });
        console.log(`Removed 10s from ${target}'s time.`);
    });
    
    socket.on("turnTimeout", (e) => {
        const gameIndex = powerupGames.findIndex(
            g => g.p1.p1name === e.userName || g.p2.p2name === e.userName
        );
    
        if (gameIndex !== -1) {
            const game = powerupGames[gameIndex];
            const loser = e.userName;
            const winner = (game.p1.p1name === loser) ? game.p2.p2name : game.p1.p1name;
    
            // Notify both players about the timeout
            powerup.emit("Game Over!", {
                reason: "timeout",
                loser,
                winner
            });
    
            // Remove the game from active games
            powerupGames.splice(gameIndex, 1);
        }
    });
    
    socket.on("cancelSearch", () => {
        powerupQueue = powerupQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} cancelled search (POWERUP).`);
    });

    socket.on("disconnect", () => {
        powerupQueue = powerupQueue.filter(player => player !== socket.userName);
        console.log(`${socket.userName} disconnected and was removed from POWERUP queue.`);
    });

    socket.on("playing", (e) => {
        const game = powerupGames.find(g => g.p1.p1name === e.userName || g.p2.p2name === e.userName);
        if (game) {
            if (e.value === "X") {
                game.p1.p1moves.push(e.id);
                if (game.p1.p1moves.length > 3) game.p1.p1moves.shift();
            } else if (e.value === "O") {
                game.p2.p2moves.push(e.id);
                if (game.p2.p2moves.length > 3) game.p2.p2moves.shift();
            }
            game.sum++;
            powerup.emit("playing", { allPlayers: powerupGames });
        }
    });

    socket.on("Game Over!", (e) => {
        powerupGames = powerupGames.filter(g =>
            g.p1.p1name !== e.userName && g.p2.p2name !== e.userName
        );
    });
});





// Serve home page (main menu)
app.get("/", (req, res) => {
    res.sendFile(path.resolve("index.html"));
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});