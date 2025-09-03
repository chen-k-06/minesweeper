let gridSize = 10;
let grid = document.querySelector('.grid');
let boxes;
let moveCount = 0;
let gameOver = false;
const sizeToggle = document.getElementById("difficulty");
const SMALL = 10;
const MED = 15;
const LARGE = 23;
const bombCounts = {
    SMALL: 18,
    MED: 40,
    LARGE: 60
}

document.addEventListener("DOMContentLoaded", function () {
    generateGrid(SMALL);
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
            }
            else {
                box.classList.add("dark");
            }

            grid.appendChild(box);
        }
    }

    // makes the boxes on the board clickable 
    boxes = document.querySelectorAll('.box');

    console.log("Adding box event handlers.");
    boxes.forEach((box, index) => {
        box.addEventListener("click", function (event) {
            if (gameOver) {
                return;
            }

            moveCount++;
            if (!box.classList.contains("dug")) {
                box.classList.add("dug");
            }
            if (moveCount == 1) {
                generateBombs(SIDE_LENGTH, index); // only generate bombs on the first click
                // this guarentees that the first click is safe

                // eliminate all squares that 1. touch an already dug square and 2. do not contain a 
                // bfs
                bfsSquares(index, SIDE_LENGTH);
            }
            else if (box.classList.contains("bomb")) {
                endGame(false);
                return;
            }

            if (checkGameOver()) {
                endGame(true);
                return;
            }
        })
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
        let num = Math.floor(Math.random() * (SIDE_LENGTH ** 2 + 1));
        while (sequence.includes(num) || num == selectedIdx) {
            num = Math.floor(Math.random() * (SIDE_LENGTH ** 2 + 1));
        }
        sequence.push(num);
    }

    console.log(`Bombs on ${sequence} indexes`);

    // append bomb class to all tiles indexed in sequence
    boxes.forEach((box, index) => {
        if (sequence.includes(index)) {
            box.classList.add('bomb');
            box.textContent = "B";
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
        console.log(tiles[index - SIDE_LENGTH])

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

        console.log(`${bombCount} bombs on index ${index}`);

        switch (bombCount) {
            case 0:
                break;
            case 1:
                box.classList.add("one");
                box.textContent = "1";
                break;
            case 2:
                box.classList.add("two");
                box.textContent = "2";
                break;
            case 3:
                box.classList.add("three");
                box.textContent = "3";
                break;
            case 4:
                box.classList.add("four");
                box.textContent = "4";
                break;
            case 5:
                box.classList.add("five");
                box.textContent = "5";
                break;
            case 6:
                box.classList.add("six");
                box.textContent = "6";
                break;
            case 7:
                box.classList.add("seven");
                box.textContent = "7";
                break;
            case 8:
                box.classList.add("eight");
                box.textContent = "8";
                break;
        }
    });
}

function bfsSquares(inital, SIDE_LENGTH) {
    let revealed = 0;
    let max = 15;
    let tiles = document.querySelectorAll(".box");
    let queue = [];
    queue.push(inital);

    while (queue.length > 0 && revealed < max) {
        let index = queue.pop();
        let row = Math.floor(index / SIDE_LENGTH);
        let col = index % SIDE_LENGTH;

        tiles[index].classList.add("dug");

        // north
        if (row > 0 && !tiles[index - SIDE_LENGTH].classList.contains("bomb")) {
            queue.push(index - SIDE_LENGTH);
        }
        // // northeast
        // if (row > 0 && col + 1 < SIDE_LENGTH && !tiles[index - SIDE_LENGTH + 1].classList.contains("bomb")) {
        //     queue.push(index - SIDE_LENGTH + 1);
        // }
        // east
        if (col + 1 < SIDE_LENGTH && !tiles[index + 1].classList.contains("bomb")) {
            queue.push(index + 1);
        }

        // // southeast
        // if (row + 1 < SIDE_LENGTH && col + 1 < SIDE_LENGTH && !tiles[index + SIDE_LENGTH + 1].classList.contains("bomb")) {
        //     queue.push(index + SIDE_LENGTH + 1);
        // }

        // south
        if (row + 1 < SIDE_LENGTH && !tiles[index + SIDE_LENGTH].classList.contains("bomb")) {
            queue.push(index + SIDE_LENGTH);
        }

        // // southwest
        // if (row + 1 < SIDE_LENGTH && col - 1 >= 0 && !tiles[index - 1 + SIDE_LENGTH].classList.contains("bomb")) {
        //     queue.push(index - 1 + SIDE_LENGTH);
        // }

        // west
        if (col - 1 >= 0 && !tiles[index - 1].classList.contains("bomb")) {
            queue.push(index - 1);
        }

        // // northwest
        // if (row > 0 && col - 1 >= 0 && !tiles[index - 1 - SIDE_LENGTH].classList.contains("bomb")) {
        //     queue.push(index - 1 - SIDE_LENGTH);
        // }

        revealed++;
    }

}

function checkGameOver() {
    let bombs = document.querySelectorAll('.bomb');
    let safeTiles = document.querySelectorAll(".box:not(.bomb)");
    let tiles = document.querySelectorAll(".box");
}

function endGame(won) {
    if (won) {
        console.log("User won the game!");
    }
    else {
        console.log("Game over. User lost.");
    }
    gameOver = true;
}
