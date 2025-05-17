window.addEventListener('DOMContentLoaded', () => {
    const playBotBtn = document.getElementById("playBot");
    const whosTurn = document.getElementById("whosTurn");
    const bigContainer = document.getElementById("bigContainer");
    const allBox = document.querySelectorAll(".btn");

    const playerXIcon = "fa-solid fa-x";
    const playerOIcon = "fa-solid fa-o";

    let playerSign = "X";
    let isGameActive = false;

    playBotBtn.addEventListener("click", () => {
        bigContainer.style.display = "block";
        whosTurn.style.display = "block";
        isGameActive = true;
        whosTurn.innerText = "X's Turn";
    
        // 👇 Hide or disable name input and search button
        document.getElementById("userName").style.display = "none";  // hides the input
        document.getElementById("find").style.display = "none";      // hides the search button
        document.getElementById("enterName").style.display = "none"; // optional label hiding
        document.getElementById("playBot").style.display = "none"; // optional label hiding
    });

    allBox.forEach(box => {
        box.addEventListener("click", () => {
            if (!isGameActive || playerSign !== "X" || box.innerHTML !== "") return;

            makeMove(box, playerXIcon, "X");
            if (checkWinner("X")) return endGame("You Win!");
            if (isDraw()) return endGame("It's a draw!");

            playerSign = "O";
            whosTurn.innerText = "O's Turn";

            setTimeout(() => {
                botMove();
            }, 600);
        });
    });

    function makeMove(box, icon, player) {
        box.innerHTML = `<i class="${icon}"></i>`;
        box.setAttribute("data-player", player);
        box.style.pointerEvents = "none";
        box.style.backgroundImage = `url(${icon === "fa-solid fa-x" ? "/images/blue_X.png" : "/images/red_O.png"})`;
        box.style.backgroundSize = "contain";
        box.style.backgroundRepeat = "no-repeat";
        box.style.backgroundPosition = "center";
        box.style.color = "transparent";
    }

    // ✅ Place it right here 👇
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
    
        // Try to win
        const winningMove = findBestMove("O");
        if (winningMove) {
            makeMove(winningMove, playerOIcon, "O");
            if (checkWinner("O")) return endGame("Bot Wins!");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            return;
        }
    
        // Try to block player's win
        const blockMove = findBestMove("X");
        if (blockMove) {
            makeMove(blockMove, playerOIcon, "O");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            return;
        }
    
        // Take center if available
        const center = document.getElementById("btn5");
        if (center && center.innerHTML === "") {
            makeMove(center, playerOIcon, "O");
            playerSign = "X";
            whosTurn.innerText = "X's Turn";
            return;
        }
    
        // Take random move
        const randomBox = emptyBoxes[Math.floor(Math.random() * emptyBoxes.length)];
        makeMove(randomBox, playerOIcon, "O");
    
        if (checkWinner("O")) return endGame("Bot Wins!");
        if (isDraw()) return endGame("It's a draw!");
    
        playerSign = "X";
        whosTurn.innerText = "X's Turn";
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
        setTimeout(() => {
            alert(message);
            location.reload();
        }, 500);
    }
});
