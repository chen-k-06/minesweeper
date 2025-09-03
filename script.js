let grid_size = 10;
let grid = document.querySelector('.grid');
let boxes;
let moveCount = 0;
const sizeToggle = document.getElementById("difficulty");
const SMALL = 10;
const MED = 15;
const LARGE = 23;
const bombCounts = {
    SMALL: 10,
    MED: 17,
    LARGE: 20
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
            moveCount++;

            if (moveCount == 0) {
                generateBombs(SIDE_LENGTH, index); // only generate bombs on the first click
                // this guarentees that the first click is safe
            }
            else if (box.classList.contains("bomb")) {
                endGame(false);
            }
            else if (!box.classList.contains("dug")) {
                box.classList.add("dug");
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
    }
    else if (SIDE_LENGTH === MED || SIDE_LENGTH === "MED") {
        grid.classList.add("m-grid");
    }
    else if (SIDE_LENGTH === LARGE || SIDE_LENGTH === "LARGE") {
        grid.classList.add("l-grid");
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
    // randomly generate a bombCounts[SIDE_LENGTH] long sequence of numbers between 0 and SIDE_LENGTH^2
    let sequence;

    for (let i = 0; i < bombCounts[SIDE_LENGTH]; i++) {
        let num = Math.floor(Math.random() * (SIDE_LENGTH ** 2 + 1));
        while (num in sequence && num != selectedIdx) {
            num = Math.floor(Math.random() * (SIDE_LENGTH ** 2 + 1));
        }
        sequence.push(num);
    }

    // append bomb class to all tiles indexed in sequence
    for (let num in sequence) {

    }

    generateNumbers(SIDE_LENGTH);
}

/**
 * Populates each non-bomb tile in the grid with the number of adjacent bombs.
 *
 * For every tile that does not have the `bomb` class, this function counts
 * the bombs in the surrounding 8 neighboring tiles (or fewer on edges/corners),
 * and assigns that count (e.g., via textContent or a data attribute).
 *
 * @param {number} SIDE_LENGTH - One of the numeric constants `SMALL`, `MED`, or `LARGE`,
 *   representing the current grid size (used to calculate tile positions).
 * @returns {void}
 */
function generateNumbers(SIDE_LENGTH) {
    let bombs = document.querySelectorAll('.bomb');
    let safeTiles = document.querySelectorAll(".tile:not(.bomb)");
}

function endGame(won) {
    if (won) {
        console.log("User won the game!");
    }
    else {
        console.log("Game over. User lost.");
    }
}