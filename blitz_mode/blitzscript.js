window.addEventListener('DOMContentLoaded', () => {
      // const socket = io("/blitz");
    const socket = io("https://tictactoe-group8.onrender.com/blitz", {
  transports: ["websocket"]
});


 let userName;
    let searchCancelled = false;

    // Get elements
    const loading = document.getElementById("loading");
    const bigContainer = document.getElementById("bigContainer");
    const userCont = document.getElementById("userCont");
    const oppNameCont = document.getElementById("oppNameCont");
    const valueCont = document.getElementById("valueCont");
    const whosTurn = document.getElementById("whosTurn");
    const findBtn = document.getElementById("find");
    const playBotBtn = document.getElementById("playBot");
    const userNameInput = document.getElementById("userName");
    
    const cancelSearchBtn = document.getElementById("cancelSearch");
    const enterNameLabel = document.getElementById("enterName");
    const userNameDisplay = document.getElementById("user");
    const oppNameDisplay = document.getElementById("oppName");
    const valueDisplay = document.getElementById("value");
    const gameTimer = document.getElementById("gameTimer");
    const turnTimer = document.getElementById("turnTimer");
    let turnTime = 30;
    let turnInterval = null; // Add this


    if (
        !loading || !bigContainer || !userCont || !oppNameCont || !valueCont || !whosTurn ||
        !findBtn || !userNameInput || !enterNameLabel || !userNameDisplay || !oppNameDisplay || !valueDisplay
    ) {
        console.error("❌ One or more DOM elements not found. Check your HTML element IDs.");
        return;
    }

    // Initial visibility
    loading.style.display = "none";
    bigContainer.style.display = "none";
    userCont.style.display = "none";
    oppNameCont.style.display = "none";
    valueCont.style.display = "none";
    whosTurn.style.display = "none";


         findBtn.addEventListener("click", () => {
        userName = userNameInput.value.trim();
        userNameDisplay.innerText = userName;

        if (!userName) {
            alert("Please enter a name");
            return;
        }

        searchCancelled = false; // Reset flag
        socket.emit("find", { userName });

        loading.style.display = "block";
        findBtn.disabled = true;
        cancelSearchBtn.style.display = "inline-block";
    });

    cancelSearchBtn.addEventListener("click", () => {
        searchCancelled = true;
        socket.disconnect();
        socket.connect(); // Reconnect to start fresh
        loading.style.display = "none";
        findBtn.disabled = false;
        cancelSearchBtn.style.display = "none";
    });

    socket.on("nameError", (e) => {
        alert(e.message);
        findBtn.disabled = false;
        loading.style.display = "none";
        cancelSearchBtn.style.display = "none";
    });

    // On finding a match
    socket.on("find", (e) => {
        if (searchCancelled) return; // Ignore if user already cancelled search
        const allPlayersArray = e.allPlayers;
        const foundObject = allPlayersArray.find(obj => obj.p1.p1name === userName || obj.p2.p2name === userName);

        cancelSearchBtn.style.display = "none";

        if (!foundObject) return;

        let oppName, value;

        if (foundObject.p1.p1name === userName) {
            oppName = foundObject.p2.p2name;
            value = foundObject.p1.p1value;
        } else {
            oppName = foundObject.p1.p1name;
            value = foundObject.p2.p2value;
        }

        oppNameDisplay.innerText = oppName;
        valueDisplay.innerText = value;

        userCont.style.display = "block";
        oppNameCont.style.display = "block";
        valueCont.style.display = "block";
        loading.style.display = "none";
        userNameInput.style.display = "none";
        findBtn.style.display = "none";
        playBotBtn.style.display = "none";
        enterNameLabel.style.display = "none";
        bigContainer.style.display = "block";
        whosTurn.style.display = "block";
        whosTurn.innerText = "X's Turn";

        let gameTime = 600; // 10 minutes
        const timerElement = document.createElement("p");
        timerElement.id = "gameTimer";
        timerElement.innerText = "Game Time Left: 10:00";
        document.body.appendChild(timerElement);
        
        // Create and append turn timer display
        const turnDisplay = document.createElement("p");
        turnDisplay.id = "turnTimer";
        turnDisplay.innerText = "Turn Time Left: 30s";
        document.body.appendChild(turnDisplay);

        const gameTimerInterval = setInterval(() => {
            if (gameTime <= 0) {
                clearInterval(gameTimerInterval);
                whosTurn.innerText = "Time's up! Draw.";
                alert("⏰ Time's up! It's a draw.");
                socket.emit("Game Over!", { userName });
                setTimeout(() => location.reload(), 200);
            } else {
                timerElement.innerText = `Game Time Left: ${Math.floor(gameTime / 60)}:${String(gameTime % 60).padStart(2, '0')}`;
                gameTime--;
            }
        }, 1000);
        

    });
    
    // On player move
    document.querySelectorAll(".btn").forEach((e) => {
        e.addEventListener("click", function () {
            const value = document.getElementById("value").innerText;
            const currentTurn = document.getElementById("whosTurn").innerText.charAt(0);
    
            if (value === currentTurn && e.innerText === "") {
                e.innerText = value;
                e.style.backgroundImage = `url(${value === "X" ? "/images/blue_X.png" : "/images/red_O.png"})`;
                e.style.backgroundSize = "contain";
                e.style.backgroundRepeat = "no-repeat";
                e.style.backgroundPosition = "center";
                e.style.color = "transparent";
                socket.emit("playing", { value: value, id: e.id, userName: userName }); // Ensure userName is defined
            }
        });
    });

    // Update board on move
    socket.on("playing", (e) => {
        const foundObject = e.allPlayers.find(obj => obj.p1.p1name === userName || obj.p2.p2name === userName);
        if (!foundObject) return;
    
        const { p1, p2, sum } = foundObject;
        const currentTurn = (sum % 2 === 0) ? "O" : "X";
        whosTurn.innerText = `${currentTurn}'s Turn`;
    
        // Clear and re-render board
        document.querySelectorAll(".btn").forEach(btn => {
            btn.innerText = "";
            btn.disabled = false;
            btn.style.backgroundImage = "";
        });
    
        p1.p1moves.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.innerText = "X";
                btn.disabled = true;
                btn.style.color = "transparent";
                btn.style.backgroundImage = `url(${btn.innerText === "X" ? "/images/blue_X.png" : "/images/red_O.png"})`;
                btn.style.backgroundSize = "contain";
                btn.style.backgroundRepeat = "no-repeat";
                btn.style.backgroundPosition = "center";
            }
        });
    
        p2.p2moves.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.innerText = "O";
                btn.disabled = true;
                btn.style.color = "transparent";
                btn.style.backgroundImage = `url(${btn.innerText === "X" ? "/images/blue_X.png" : "/images/red_O.png"})`;
                btn.style.backgroundSize = "contain";
                btn.style.backgroundRepeat = "no-repeat";
                btn.style.backgroundPosition = "center";
            }
        });
    
        const myValue = valueDisplay.innerText;
    
        if (myValue === currentTurn) {
            if (!turnInterval) {
                startTurnTimer();
            }
        } else {
            clearInterval(turnInterval);
            turnInterval = null;
            hideTurnTimerDisplay();
        }
    
        checkWinner(sum);
    });
    


    function startTurnTimer() {
        clearInterval(turnInterval);
        turnInterval = null;
    
        turnTime = 30;
        updateTurnTimerDisplay();
    
        const turnDisplay = document.getElementById("turnTimer");
        if (turnDisplay) turnDisplay.style.display = "block";
    
        turnInterval = setInterval(() => {
            turnTime--;
            updateTurnTimerDisplay();
    
            if (turnTime <= 0) {
                clearInterval(turnInterval);
                turnInterval = null;
                hideTurnTimerDisplay();
                alert("⏱ Time's up for your turn! You lost.");
                socket.emit("turnTimeout", { userName });
            }
        }, 1000);
    }
    

    function hideTurnTimerDisplay() {
        const turnDisplay = document.getElementById("turnTimer");
        if (turnDisplay) {
            turnDisplay.style.display = "none";
            turnDisplay.innerText = "";
        }
    }
    

    function updateTurnTimerDisplay() {
        const turnDisplay = document.getElementById("turnTimer");
        if (turnDisplay) {
            turnDisplay.innerText = `Turn Time Left: ${turnTime}s`;
        }
        turnDisplay.innerText = `Turn Time Left: ${turnTime}s`;
        turnDisplay.style.display = "block";
    }
    
    
    // Win / Draw check
    function checkWinner(sum) {
        const getVal = id => document.getElementById(id).innerText || id;

        const b1 = getVal("btn1"), b2 = getVal("btn2"), b3 = getVal("btn3");
        const b4 = getVal("btn4"), b5 = getVal("btn5"), b6 = getVal("btn6");
        const b7 = getVal("btn7"), b8 = getVal("btn8"), b9 = getVal("btn9");

        const win =
            (b1 === b2 && b2 === b3) || (b4 === b5 && b5 === b6) ||
            (b7 === b8 && b8 === b9) || (b1 === b4 && b4 === b7) ||
            (b2 === b5 && b5 === b8) || (b3 === b6 && b6 === b9) ||
            (b1 === b5 && b5 === b9) || (b3 === b5 && b5 === b7);

            socket.on("Game Over!", ({ reason, loser, winner }) => {
                if (reason === "timeout") {
                    const message = (loser === userName)
                        ? "⏱ You ran out of time. You lost."
                        : "🎉 Opponent ran out of time. You win!";
                    whosTurn.innerText = message;
                    alert(message);
                    setTimeout(() => location.reload(), 300);
                }
            });
            

            if (win) {
                socket.emit("Game Over!", { userName: userName });
            
                const winner = (sum % 2 === 0 ? "X" : "O");
                const message = (valueDisplay.innerText === winner) ? "You Win!" : "Opponent Wins!";
                whosTurn.innerText = message;
            
                setTimeout(() => {
                    alert(message);
                    setTimeout(() => location.reload(), 200);
                }, 100);
                // Maybe a small check on the sum could be good. but it kinda works with 100000.
            } else if (sum === 1000000) {
                socket.emit("Game Over!", { userName: userName });
            
                whosTurn.innerText = "It's a draw!";
                setTimeout(() => {
                    alert("DRAW!!");
                    setTimeout(() => location.reload(), 200);
                }, 100);
            }
    }
});