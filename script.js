let grid_size = 10;
let grid = document.querySelector('.grid');
const sizeToggle = document.getElementById("difficulty");
const SMALL = 10;
const MED = 15;
const LARGE = 23;

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
    grid.replaceChildren();
    changeGridSize(SIDE_LENGTH);

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
}

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