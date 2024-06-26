/* - */

import "/socket.io.min.js";

const pad = document.querySelector("#pad");
const left = document.querySelector("#left");
const right = document.querySelector("#right");
const socket = io();

let settings = {
    horizontal_scroll_direction: -1,
    vertical_scroll_direction: 1
}

let padSize = {};
let firstPos = {};
let lastPos = {};
let scaling = {};
let padRect;
let actions = {
    moving: false,
    scrolling: false,
    clicking: false
}
let buttonStates = {
    left: false,
    right: false
}
let pointers = 0;
let padTimer;

function getCenter(touches) {
    let touchesSum = { x: 0, y: 0 };
    for(let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        touchesSum.x += touch.clientX;
        touchesSum.y += touch.clientY;
    }
    return { x: Math.round(touchesSum.x / touches.length), y: Math.round(touchesSum.y / touches.length) };
}

function getRelativePos(x, y, rect) {
    return { x: x - rect.left, y: y - rect.top };
}

function updateFirstPos(touchPos) {
    firstPos.x = touchPos.x;
    firstPos.y = touchPos.y;
}

function updateLastPos(touchPos) {
    lastPos.x = touchPos.x;
    lastPos.y = touchPos.y;
}

function changeButtonState(state, value) {
    buttonStates[state] = value;
    socket.emit("statechange", { state: state, value: value });
}

function checkPos(x, y, rect) {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    )
}

function handleTouchstart(touches) {
    actions.clicking = true;
    
    if(touches.length > 1) {
        for(let i = 0; i < touches.length; i++) {
            const relativeTouch = getRelativePos(touches[i].clientX, touches[i].clientY, padRect);
    
            if(!checkPos(relativeTouch.x, relativeTouch.y, padRect)) {
                return;
            }
        }
        const centeredTouches = getCenter(touches);
        const relativeTouch = getRelativePos(centeredTouches.x, centeredTouches.y, padRect);
        updateFirstPos(relativeTouch);
        updateLastPos(relativeTouch);
    } else {
        const relativeTouch = getRelativePos(touches[0].clientX, touches[0].clientY, padRect);
        updateFirstPos(relativeTouch);
        updateLastPos(relativeTouch);
    }
    
    pointers = touches.length;
    padTimer = setTimeout(() => {
        actions.clicking = false;
    }, 250)
}

function handleTouchmove(touches) {
    let relativeTouch;

    if(touches.length > 1) { 
        const centeredTouches = getCenter(touches);
        relativeTouch = getRelativePos(centeredTouches.x, centeredTouches.y, padRect);
    } else {
        relativeTouch = getRelativePos(touches[0].clientX, touches[0].clientY, padRect);
    }

    if(!checkPos(relativeTouch.x, relativeTouch.y, padRect)) {
        return handleTouchstart(touches);
    }

    if(Math.abs(relativeTouch.x - firstPos.x) < (Math.min(padSize.x, padSize.y) * 0.1) && Math.abs(relativeTouch.y - firstPos.y) < (Math.min(padSize.x, padSize.y) * 0.1)) {
        actions.clicking = false;
    }

    if(touches.length == 1) {
        handleMove(relativeTouch);
    } else if(touches.length == 2) {
        handleScroll(relativeTouch);
    }
}

function handleTouchend() {
    clearTimeout(padTimer);
    
    if(actions.clicking != true) {
        return;
    }
    
    if(pointers == 1) {
        handleLeftClick();
    } else if(pointers == 2) {
        handleRightClick();
    }
    
    actions.clicking = false;
    pointers = 0;
}

function handleMove(pos) {
    const moveValues = { x: ((pos.x - lastPos.x) * scaling.x) * 1.5, y: ((pos.y - lastPos.y) * scaling.y) * 1.5 };

    socket.emit("move", moveValues);
    updateLastPos(pos);
}

function handleScroll(pos) {
    const scrollValues = { x: ((pos.x - lastPos.x) * scaling.x) * 1, y: ((pos.y - lastPos.y) * scaling.y) * 1 };

    socket.emit("scroll", scrollValues);
    updateLastPos(pos);
}

function handleLeftClick() {
    socket.emit("click", { button: "left" })
}

function handleRightClick() {
    socket.emit("click", { button: "right" });
}

socket.on("init", (data) => {
    const aspectRatio = data[0] / data[1];
    padSize.x = window.innerWidth - 20;
    padSize.y = window.innerWidth / aspectRatio;
    pad.style.width = padSize.x + "px";
    pad.style.height = padSize.y + "px";
    left.style.width = `${window.innerWidth / 2 - 10 - 1.5}px`;
    left.style.height = `${(window.innerWidth / aspectRatio) / 2.5}px`;
    right.style.width = `${window.innerWidth / 2 - 10 - 1.5}px`;
    right.style.height = `${(window.innerWidth / aspectRatio) / 2.5}px`;
    scaling = {
        x: data[0] / padSize.x,
        y: data[1] / padSize.y
    }
    padRect = pad.getBoundingClientRect();
})

pad.addEventListener("touchstart", (ev) => {
    ev.preventDefault();
    handleTouchstart(ev.touches);
})

pad.addEventListener("touchmove", (ev) => {
    ev.preventDefault();
    const touches = ev.touches;
    
    if(pointers != touches.length) {
        return handleTouchstart(touches);
    }
    
    handleTouchmove(touches);
})

pad.addEventListener("touchend", (ev) => {
    handleTouchend(ev.touches);
})

pad.addEventListener("touchend", (ev) => {
    handleTouchend(ev.touches);
})