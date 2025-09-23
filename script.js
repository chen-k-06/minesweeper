let gridSize = 10;
let grid = document.querySelector('.grid');
let boxes;
let moveCount = 0;
let gameOver = false;
let flagCount;
let longTapFired = false;
let longTapTimer = null;
const board = document.getElementById("board");
const LONG_TAP_MS = 600;
const sizeToggle = document.getElementById("difficulty");
const flagCounter = document.getElementById("flag-counter");
const helpButton = document.getElementById("hint");
const endgamePopup = document.getElementById("endgame-popup");
const endgameText = document.getElementById("endgame-text");
const playAgainButton = document.getElementById("play-again");
const suppressClickAfterLongPress = new WeakSet();
const longPressTimers = new Map();
const SMALL = 10;
const MED = 15;
const LARGE = 23;
const bombCounts = {
    SMALL: 18,
    MED: 40,
    LARGE: 60
}
const colors = ["#FF6B81", "#FFD93D", "#40BFFF", "#7DFF6A", "#A566FF", "#FF914D"]; // bomb colors

document.addEventListener("DOMContentLoaded", function () {
    generateGrid(SMALL);

    document.addEventListener(
        "contextmenu",
        (e) => {
            const tile = e.target.closest(".box");
            if (!tile || gameOver) return;
            e.preventDefault();   // stop the menu
            e.stopPropagation();  // stop bubbling
            handleFlagging(tile);
        },
        true
    );
});

sizeToggle.addEventListener("change", function (event) {
    console.log("Selected difficulty:", event.target.value);
    let sideLength;
    if (event.target.value === "SMALL") {
        sideLength = SMALL;
    }
    else if (event.target.value === "MED") {
        sideLength = MED;
    }
    else {
        sideLength = LARGE;
    }
    generateGrid(sideLength);
});

function generateGrid(SIDE_LENGTH) {
    console.log(`Generating new grid of size ${SIDE_LENGTH}`);

    // reset globals 
    moveCount = 0;
    flagCounter.textContent = `🚩 ${bombCounts[sizeToggle.value]}`;
    flagCount = bombCounts[sizeToggle.value];
    gameOver = false;
    grid.replaceChildren();

    // update grid class
    changeGridSize(SIDE_LENGTH);

    // creates the divs -> front end board
    for (let row = 0; row < SIDE_LENGTH; row++) {
        for (let column = 0; column < SIDE_LENGTH; column++) {
            let box = document.createElement('div');
            box.classList.add('box');
            box.dataset.row = row;
            box.dataset.col = column;

            if ((row + column) % 2 == 0) {
                box.classList.add("light");
            } else {
                box.classList.add("dark");
            }

            grid.appendChild(box);
        }
    }

    boxes = document.querySelectorAll('.box');
    console.log("Adding box event handlers.");

    boxes.forEach((box, index) => {
        // left click -> dig
        box.addEventListener("click", function (event) {
            // If flagged via long-press or contextmenu recently, skip this click
            if (suppressClickAfterLongPress.has(box)) {
                event.preventDefault();
                suppressClickAfterLongPress.delete(box);
                return;
            }

            if (gameOver || box.classList.contains("flag")) return;

            moveCount++;
            if (moveCount == 1) {
                box.classList.add("dug");
                generateBombs(SIDE_LENGTH, index); // first click is always safe
                bfsSquares(index, SIDE_LENGTH);

                // adding bomb counts (text)
                boxes.forEach((b) => {
                    if (!b.classList.contains("dug")) return;
                    if (b.classList.contains("one")) b.textContent = "1";
                    else if (b.classList.contains("two")) b.textContent = "2";
                    else if (b.classList.contains("three")) b.textContent = "3";
                    else if (b.classList.contains("four")) b.textContent = "4";
                    else if (b.classList.contains("five")) b.textContent = "5";
                    else if (b.classList.contains("six")) b.textContent = "6";
                    else if (b.classList.contains("seven")) b.textContent = "7";
                    else if (b.classList.contains("eight")) b.textContent = "8";
                });
            } else if (box.classList.contains("bomb")) {
                endGame(false);
                return;
            } else if (!box.classList.contains("dug")) {
                box.classList.add("dug");
                if (box.classList.contains("one")) box.textContent = "1";
                else if (box.classList.contains("two")) box.textContent = "2";
                else if (box.classList.contains("three")) box.textContent = "3";
                else if (box.classList.contains("four")) box.textContent = "4";
                else if (box.classList.contains("five")) box.textContent = "5";
                else if (box.classList.contains("six")) box.textContent = "6";
                else if (box.classList.contains("seven")) box.textContent = "7";
                else if (box.classList.contains("eight")) box.textContent = "8";
            }
            if (checkGameOver()) {
                endGame(true);
                return;
            }
        });

        // right click / two finger tap -> flag
        box.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameOver) handleFlagging(box);
            // suppress the synthetic click that often follows contextmenu
            suppressClickAfterLongPress.add(box);

            if (checkGameOver()) {
                endGame(true);
                return;
            }
        });

        // some browsers fire 'auxclick' for non-left buttons; suppress it.
        box.addEventListener("auxclick", (e) => {
            if (e.button !== 0) e.preventDefault();
        });

        // long press even handler 
        let startX = 0, startY = 0;

        box.addEventListener("pointerdown", (e) => {
            if (gameOver || box.classList.contains("dug")) return;

            // prevents double fire 
            if (e.pointerType === "mouse" && e.button !== 0) return;

            if (e.pointerType === "touch" && e.isPrimary === false) {
                e.preventDefault();
                handleFlagging(box);
                suppressClickAfterLongPress.add(box);
                return;
            }

            const isTouchPrimary = e.pointerType === "touch" && e.isPrimary === true;
            const isMousePrimaryDown = e.pointerType === "mouse" && (e.buttons & 1) === 1;
            if (!(isTouchPrimary || isMousePrimaryDown)) return;

            startX = e.clientX; startY = e.clientY;

            // Start long-press timer (works for mouse & primary touch)
            const timerId = setTimeout(() => {
                suppressClickAfterLongPress.add(box);  // prevent the subsequent click from digging
                handleFlagging(box);
            }, LONG_TAP_MS);

            longPressTimers.set(e.pointerId, timerId);

            if (checkGameOver()) {
                endGame(true);
                return;
            }
        }, { passive: true });

        function clearLP(e) {
            const t = longPressTimers.get(e.pointerId);
            if (t) {
                clearTimeout(t);
                longPressTimers.delete(e.pointerId);
            }

            if (checkGameOver()) {
                endGame(true);
                return;
            }
        }

        box.addEventListener("pointerup", clearLP);
        box.addEventListener("pointercancel", clearLP);
        box.addEventListener("pointerleave", clearLP);
        box.addEventListener("pointerout", clearLP);

        if (checkGameOver()) {
            endGame(true);
            return;
        }
    });
}

/**
 * Updates the global DOM element `grid` by assigning it one of the
 * size-specific classes: `s-grid`, `m-grid`, or `l-grid`.
 *
 * The function first resets `grid`'s classes, ensures it has the base
 * `"grid"` class, and then adds the size modifier class based on the
 * provided `SIDE_LENGTH`.
 *
 * @param {number|string} SIDE_LENGTH - Either:
 *   - one of the numeric constants `SMALL`, `MED`, `LARGE`
 *   - or the corresponding strings `"SMALL"`, `"MED"`, `"LARGE"`
 *
 * @returns {void}
 */
function changeGridSize(SIDE_LENGTH) {
    grid.className = "";
    grid.classList.add("grid");
    grid = document.querySelector('.grid');

    if (SIDE_LENGTH === SMALL || SIDE_LENGTH === "SMALL") {
        grid.classList.add("s-grid");
        gridSize = SMALL;
    }
    else if (SIDE_LENGTH === MED || SIDE_LENGTH === "MED") {
        grid.classList.add("m-grid");
        gridSize = MED;
    }
    else if (SIDE_LENGTH === LARGE || SIDE_LENGTH === "LARGE") {
        grid.classList.add("l-grid");
        gridSize = LARGE;
    }
    else {
        console.log("Passed invalid grid size to changeGridSize()");
    }
}

/**
 * Randomly assigns the `bomb` class to a set of tiles within the grid.
 *
 * The number of tiles chosen depends on the grid size:
 * - `SMALL`: assigns bombs to `SMALL` tiles
 * - `MED`: assigns bombs to `MED` tiles
 * - `LARGE`: assigns bombs to `LARGE` tiles
 *
 * @param {number} SIDE_LENGTH - One of the numeric constants `SMALL`, `MED`, or `LARGE`,
 *   indicating how many tiles should receive the `bomb` class.
 * @returns {void}
 */
function generateBombs(SIDE_LENGTH, selectedIdx) {
    // randomly generate a bombCounts[sizeToggle.value] long sequence of numbers between 0 and SIDE_LENGTH^2
    let sequence = [];
    console.log(bombCounts[sizeToggle.value]) // must use the sizeToggle because this stores the strings "SMALL"/"MED"/"LARGE" and not the numeric constants

    for (let i = 0; i < bombCounts[sizeToggle.value]; i++) {
        let num = Math.floor(Math.random() * (SIDE_LENGTH ** 2));
        while (sequence.includes(num) || num === selectedIdx) {
            num = Math.floor(Math.random() * (SIDE_LENGTH ** 2));
        }
        sequence.push(num);
    }

    console.log(`Bombs on ${sequence} indexes`);

    // append bomb class to all tiles indexed in sequence
    boxes.forEach((box, index) => {
        if (sequence.includes(index)) {
            box.classList.add('bomb');
        }
    });

    generateNumbers(SIDE_LENGTH);
}

/**
 * Populates each non-bomb tile in the grid with the number of adjacent bombs.
 *
 * For every tile that does not have the `bomb` class, this function counts
 * the bombs in the surrounding 8 neighboring tiles (or fewer on edges/corners),
 * and assigns that count (via textContent).
 *
 * @param {number} SIDE_LENGTH - One of the numeric constants `SMALL`, `MED`, or `LARGE`,
 *   representing the current grid size (used to calculate tile positions).
 * @returns {void}
 */
function generateNumbers(SIDE_LENGTH) {
    let tiles = document.querySelectorAll(".box");

    tiles.forEach((box, index) => {
        if (box.classList.contains("bomb")) {
            return;
        }

        let bombCount = 0;
        let row = Math.floor(index / SIDE_LENGTH);
        let col = index % SIDE_LENGTH;

        // north
        if (row > 0 && tiles[index - SIDE_LENGTH].classList.contains("bomb")) {
            bombCount++;
        }
        // northeast
        if (row > 0 && col + 1 < SIDE_LENGTH && tiles[index - SIDE_LENGTH + 1].classList.contains("bomb")) {
            bombCount++;
        }
        // east
        if (col + 1 < SIDE_LENGTH && tiles[index + 1].classList.contains("bomb")) {
            bombCount++;
        }

        // southeast
        if (row + 1 < SIDE_LENGTH && col + 1 < SIDE_LENGTH && tiles[index + SIDE_LENGTH + 1].classList.contains("bomb")) {
            bombCount++;
        }

        // south
        if (row + 1 < SIDE_LENGTH && tiles[index + SIDE_LENGTH].classList.contains("bomb")) {
            bombCount++;
        }

        // southwest
        if (row + 1 < SIDE_LENGTH && col - 1 >= 0 && tiles[index - 1 + SIDE_LENGTH].classList.contains("bomb")) {
            bombCount++;
        }

        // west
        if (col - 1 >= 0 && tiles[index - 1].classList.contains("bomb")) {
            bombCount++;
        }

        // northwest
        if (row > 0 && col - 1 >= 0 && tiles[index - 1 - SIDE_LENGTH].classList.contains("bomb")) {
            bombCount++;
        }

        switch (bombCount) {
            case 0:
                break;
            case 1:
                box.classList.add("one");
                if (box.classList.contains("dug")) {
                    box.textContent = "1";
                }
                break;
            case 2:
                box.classList.add("two");
                if (box.classList.contains("dug")) {
                    box.textContent = "2";
                } break;
            case 3:
                box.classList.add("three");
                if (box.classList.contains("dug")) {
                    box.textContent = "3";
                } break;
            case 4:
                box.classList.add("four");
                if (box.classList.contains("dug")) {
                    box.textContent = "4";
                }
                break;
            case 5:
                box.classList.add("five");
                if (box.classList.contains("dug")) {
                    box.textContent = "5";
                }
                break;
            case 6:
                box.classList.add("six");
                if (box.classList.contains("dug")) {
                    box.textContent = "6";
                }
                break;
            case 7:
                box.classList.add("seven");
                if (box.classList.contains("dug")) {
                    box.textContent = "7";
                }
                break;
            case 8:
                box.classList.add("eight");
                if (box.classList.contains("dug")) {
                    box.textContent = "8";
                }
                break;
        }
    });
}

function bfsSquares(inital, SIDE_LENGTH) {
    let revealed = 0;
    let max = 25;
    let tiles = document.querySelectorAll(".box");
    let queue = [];
    queue.push(inital);

    while (queue.length > 0 && revealed < max) {
        let index = queue.shift();
        revealed++;

        let row = Math.floor(index / SIDE_LENGTH);
        let col = index % SIDE_LENGTH;

        tiles[index].classList.add("dug");

        // north
        if (row > 0 && !tiles[index - SIDE_LENGTH].classList.contains("bomb") && !tiles[index - SIDE_LENGTH].classList.contains("dug")) {
            queue.push(index - SIDE_LENGTH);
        }

        // east
        if (col + 1 < SIDE_LENGTH && !tiles[index + 1].classList.contains("bomb") && !tiles[index + 1].classList.contains("dug")) {
            queue.push(index + 1);
        }

        // south
        if (row + 1 < SIDE_LENGTH && !tiles[index + SIDE_LENGTH].classList.contains("bomb") && !tiles[index + SIDE_LENGTH].classList.contains("dug")) {
            queue.push(index + SIDE_LENGTH);
        }

        // west
        if (col - 1 >= 0 && !tiles[index - 1].classList.contains("bomb") && !tiles[index - 1].classList.contains("dug")) {
            queue.push(index - 1);
        }
    }
}

function handleFlagging(box) {
    if (box.classList.contains("dug")) {
        return;
    }
    if (box.classList.contains("flag")) {
        console.log("Removed flag");
        box.textContent = "";
        flagCount++;
        box.classList.remove("flag");
        if (box.classList.contains("bomb")) {
        }
    }
    else {
        console.log("Added flag.");
        box.textContent = "🚩"
        flagCount--;
        box.classList.add("flag");
    }
    checkGameOver();
    updateFlagCounter();
}

function updateFlagCounter() {
    flagCounter.textContent = `🚩 ${flagCount}`;
}

helpButton.addEventListener("click", () => {
    if (moveCount == 0) {
        generateBombs(gridSize, 0); // first click is always safe
        moveCount++;
    }

    if (gameOver) return;

    const tiles = Array.from(document.querySelectorAll(".box"));
    const safeTiles = tiles.filter(tile =>
        !tile.classList.contains("bomb") &&
        !tile.classList.contains("dug") &&
        !tile.classList.contains("flag")
    );

    if (safeTiles.length === 0) return;

    // pick a random safe tile
    const randomTile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
    randomTile.classList.add("dug");

    // show number if it has one
    if (randomTile.classList.contains("one")) randomTile.textContent = "1";
    else if (randomTile.classList.contains("two")) randomTile.textContent = "2";
    else if (randomTile.classList.contains("three")) randomTile.textContent = "3";
    else if (randomTile.classList.contains("four")) randomTile.textContent = "4";
    else if (randomTile.classList.contains("five")) randomTile.textContent = "5";
    else if (randomTile.classList.contains("six")) randomTile.textContent = "6";
    else if (randomTile.classList.contains("seven")) randomTile.textContent = "7";
    else if (randomTile.classList.contains("eight")) randomTile.textContent = "8";

    if (checkGameOver()) {
        endGame(true);
    }
});

/**
 * Checks if the game is over by checking if every bomb is marked with the `flag` class, or if 
 * all safe tiles have been marked with the `dug` class.
 * 
 * @returns {boolean} true if game over, false otherwise
 */
function checkGameOver() {
    if (moveCount == 0) {
        return false;
    }
    let bombs = document.querySelectorAll('.bomb');
    let tiles = document.querySelectorAll(".box");

    // win condition 1: all bombs are flagged
    let flag1 = true;
    for (let bomb of bombs) {
        if (!bomb.classList.contains("flag")) {
            flag1 = false; // this win condition was not satisfied
            break;
        }
    }

    // win condition 2: all safe tiles have been dug
    let flag2 = true;
    for (let tile of tiles) {
        if (tile.classList.contains("bomb")) {
            continue;
        }
        else if (!tile.classList.contains("dug")) { // only safe tiles
            flag2 = false; // this win condition was not satisfied
        }
    }
    return flag1 || flag2; // game is over if either win condition 1 or 2 have been satisfied
}

/**
 * Handles game ending logic, including console logging and bomb reveals/coloring.
 * 
 * @param {boolean} won - true if the user won the game, and false otherwise
 * @returns {void}
 */
function endGame(won) {
    let delay = 0; // gradually increment the delay to create a determinate ordering
    let lag = 75;
    if (grid.classList.contains("l-grid")) {
        lag = 15;
    }
    if (grid.classList.contains("m-grid")) {
        lag = 40;
    }

    if (won) {
        console.log("User won the game!");
        endgameText.textContent = "You won!"

        let bombs = document.querySelectorAll('.bomb');
        for (let bomb of bombs) {
            setTimeout(() => { // delay the coloring of bombs
                let color = Math.floor(Math.random() * colors.length);
                bomb.style.backgroundColor = colors[color];
                bomb.style.color = "#ffffff";
                bomb.style.paddingBottom = "15%";
                if (grid.classList.contains("s-grid")) {
                    bomb.style.fontSize = "300%";
                }
                else if (grid.classList.contains("m-grid")) {
                    bomb.style.fontSize = "225%";
                }
                else {
                    bomb.style.fontSize = "150%";
                }
                bomb.textContent = "❀";
            }, delay);
            delay += lag;
        }
    }
    else {
        console.log("Game over. User lost.");
        endgameText.textContent = "Game Over!"

        let bombs = document.querySelectorAll('.bomb');
        for (let bomb of bombs) {
            setTimeout(() => { // delay the coloring of bombs
                let color = Math.floor(Math.random() * colors.length);
                bomb.style.backgroundColor = colors[color];
                bomb.style.color = "rgba(0, 0, 0, 0.35)";
                bomb.style.paddingTop = "0px";
                bomb.style.paddingBottom = "15%";
                if (grid.classList.contains("s-grid")) {
                    bomb.style.fontSize = "300%";
                }
                else if (grid.classList.contains("m-grid")) {
                    bomb.style.fontSize = "225%";
                }
                else {
                    bomb.style.fontSize = "150%";
                }
                bomb.textContent = "●";
            }, delay);
            delay += lag;
        }
    }
    gameOver = true;
    delay += 150; // take longer to display final popup 

    setTimeout(() => {
        endgameText.classList.remove("hidden");
        endgamePopup.classList.remove("hidden");
    }, delay);
}
