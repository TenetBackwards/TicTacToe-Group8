window.addEventListener('DOMContentLoaded', () => {
    const playBotBtn = document.getElementById("playBot");
    const whosTurn = document.getElementById("whosTurn");
    const bigContainer = document.getElementById("bigContainer");
    const allBox = document.querySelectorAll(".btn");

    const playerXIcon = "fa-solid fa-x";
    const playerOIcon = "fa-solid fa-o";

    let playerSign = "X";
    let isGameActive = false;

    let playerMoves = [];
    let botMoves = [];

    let gameTime = 600; // 10 minutes
    let gameTimerInterval = null;
    let turnTime = 30;
    let turnInterval = null;

    playBotBtn.addEventListener("click", () => {
        bigContainer.style.display = "block";
        whosTurn.style.display = "block";
        isGameActive = true;
        whosTurn.innerText = "X's Turn";

        // Hide setup UI
        document.getElementById("userName").style.display = "none";
        document.getElementById("find").style.display = "none";
        document.getElementById("enterName").style.display = "none";
        document.getElementById("playBot").style.display = "none";

        document.getElementById("powerUps").style.display = "block";

        let usedAddTime = false;
        let usedRemoveTime = false;

        const addTimeBtn = document.getElementById("addTime");
        const removeTimeBtn = document.getElementById("removeTime");

        addTimeBtn.disabled = false;
        removeTimeBtn.disabled = true; // Bot uses it automatically

        addTimeBtn.onclick = () => {
            if (playerSign !== "X") {
                alert("❌ Not your turn!");
                return;
            }
            if (usedAddTime) {
                alert("🕒 You already used Add Time!");
                return;
            }

            turnTime += 10;
            updateTurnTimerDisplay();
            usedAddTime = true;
            addTimeBtn.disabled = true;
            alert("✅ 10 seconds added to your turn!");
        };


        // Game Timer UI
        const timerElement = document.createElement("p");
        timerElement.id = "gameTimer";
        timerElement.innerText = "Game Time Left: 10:00";
        document.body.appendChild(timerElement);

        gameTimerInterval = setInterval(() => {
            if (gameTime <= 0) {
                clearInterval(gameTimerInterval);
                endGame("⏰ Time's up! It's a draw.");
            } else {
                timerElement.innerText = `Game Time Left: ${Math.floor(gameTime / 60)}:${String(gameTime % 60).padStart(2, '0')}`;
                gameTime--;
            }
        }, 1000);

        startTurnTimer(); // Start 30s turn timer
    });

    allBox.forEach(box => {
        box.addEventListener("click", () => {
            if (!isGameActive || playerSign !== "X" || box.innerHTML !== "") return;

            makeMove(box, playerXIcon, "X");

            if (checkWinner("X")) return endGame("🎉 You Win!");
            if (isDraw()) return endGame("🤝 It's a draw!");

            playerSign = "O";
            whosTurn.innerText = "O's Turn";

            clearInterval(turnInterval);
            turnInterval = null;

            setTimeout(() => {
                botMove();
            }, 600);
        });
    });

    function updateTurnTimerDisplay() {
        const turnDisplay = document.getElementById("turnTimer");
        if (turnDisplay) {
            turnDisplay.innerText = `Turn Time Left: ${turnTime}s`;
            turnDisplay.style.display = "block";
        }
    }
    

    function makeMove(box, icon, player) {
        box.innerHTML = `<i class="${icon}"></i>`;
        box.setAttribute("data-player", player);
        box.style.pointerEvents = "none";
        box.style.backgroundImage = `url(${icon === "fa-solid fa-x" ? "/images/blue_X.png" : "/images/red_O.png"})`;
        box.style.backgroundSize = "contain";
        box.style.backgroundRepeat = "no-repeat";
        box.style.backgroundPosition = "center";
        box.style.color = "transparent";

        const moveArray = (player === "X") ? playerMoves : botMoves;
        moveArray.push(box);

        if (moveArray.length > 3) {
            const oldBox = moveArray.shift();
            oldBox.innerHTML = "";
            oldBox.removeAttribute("data-player");
            oldBox.style.pointerEvents = "auto";
            oldBox.style.backgroundImage = "";
        }
    }


    

    function findBestMove(player) {
        const combos = [
            ["btn1", "btn2", "btn3"], ["btn4", "btn5", "btn6"], ["btn7", "btn8", "btn9"],
            ["btn1", "btn4", "btn7"], ["btn2", "btn5", "btn8"], ["btn3", "btn6", "btn9"],
            ["btn1", "btn5", "btn9"], ["btn3", "btn5", "btn7"]
        ];

        for (let combo of combos) {
            const [a, b, c] = combo;
            const boxes = [document.getElementById(a), document.getElementById(b), document.getElementById(c)];
            const marks = boxes.map(box => box.getAttribute("data-player"));

            const countPlayer = marks.filter(mark => mark === player).length;
            const countEmpty = marks.filter(mark => !mark).length;

            if (countPlayer === 2 && countEmpty === 1) {
                return boxes.find(box => !box.getAttribute("data-player"));
            }
        }

        return null;
    }

    function botMove() {
        const emptyBoxes = Array.from(allBox).filter(box => box.innerHTML === "");
        if (emptyBoxes.length === 0) return;

        const winningMove = findBestMove("O");
        if (winningMove) {
            makeMove(winningMove, playerOIcon, "O");
            if (checkWinner("O")) return endGame("🤖 Bot Wins!");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            startTurnTimer();
            return;
        }

        const blockMove = findBestMove("X");
        if (blockMove) {
            makeMove(blockMove, playerOIcon, "O");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            startTurnTimer();
            return;
        }

        const center = document.getElementById("btn5");
        if (center && center.innerHTML === "") {
            makeMove(center, playerOIcon, "O");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            startTurnTimer();
            return;
        }

        const randomBox = emptyBoxes[Math.floor(Math.random() * emptyBoxes.length)];
        makeMove(randomBox, playerOIcon, "O");

        if (checkWinner("O")) return endGame("🤖 Bot Wins!");
        if (isDraw()) return endGame("🤝 It's a draw!");

        playerSign = "X";
        whosTurn.innerText = "X's Turn";
        startTurnTimer();
    }

    function isDraw() {
        return Array.from(allBox).every(box => box.innerHTML !== "");
    }

    function checkWinner(player) {
        const b = id => document.getElementById(id).getAttribute("data-player");
        const winCombos = [
            ["btn1", "btn2", "btn3"], ["btn4", "btn5", "btn6"], ["btn7", "btn8", "btn9"],
            ["btn1", "btn4", "btn7"], ["btn2", "btn5", "btn8"], ["btn3", "btn6", "btn9"],
            ["btn1", "btn5", "btn9"], ["btn3", "btn5", "btn7"]
        ];
        return winCombos.some(combo => combo.every(id => b(id) === player));
    }

    function endGame(message) {
        isGameActive = false;
        whosTurn.innerText = message;

        clearInterval(gameTimerInterval);
        clearInterval(turnInterval);
        turnInterval = null;

        setTimeout(() => {
            alert(message);
            location.reload();
        }, 500);
    }

    function startTurnTimer() {
        clearInterval(turnInterval);
        turnTime = 30;

        let turnDisplay = document.getElementById("turnTimer");
        if (!turnDisplay) {
            turnDisplay = document.createElement("p");
            turnDisplay.id = "turnTimer";
            document.body.appendChild(turnDisplay);
        }

        turnDisplay.style.display = "block";
        turnDisplay.innerText = `Turn Time Left: ${turnTime}s`;

        turnInterval = setInterval(() => {
            turnTime--;
            turnDisplay.innerText = `Turn Time Left: ${turnTime}s`;

            if (turnTime <= 0) {
                clearInterval(turnInterval);
                turnInterval = null;
                endGame("⏱ Time's up! You lost.");
            }
        }, 1000);
    }
    
});
