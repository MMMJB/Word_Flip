const mutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type !== "attributes" ) return;

        if (mutation.attributeName == "data-lives") {
            mutation.target.classList.add("changed");
            setTimeout(() => {
                mutation.target.classList.remove("changed");
            }, 210)
        }
    }
}

function animateCountUp(el, startNum, endNum) {
    const animationDuration = 500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(animationDuration / frameDuration);
    const easeOutQuat = t => t * (2 - t);

    let frame = 0;
    const countTo = parseInt((endNum - startNum), 10);

    const counter = setInterval(() => {
        frame++;

        const progress = easeOutQuat(frame / totalFrames);
        const currentCount = Math.round(countTo * progress + startNum);

        if (parseInt(el.innerHTML, 10) !== currentCount) el.innerHTML = currentCount;

        if (frame == totalFrames) clearInterval(counter);
    }, frameDuration)
}

const pause = document.getElementById("pause-menu");

function handlePause(e) {
    e.target.classList.toggle("pressed");
    if (e.target.classList.contains("pause")) pause.classList.remove("hidden");
    paused = true;
}

function handleResume(e) {
    document.querySelector("#pause-menu:not(.hidden")?.classList.toggle("hidden");
    paused = false;
}

function handleRestart() {
    initialize(false);
    document.getElementById("finish").dataset.high = 0;
    document.querySelector(".score").innerText = sc;
    document.getElementById("finish").classList.add("hidden");
    handleResume();
}

function home() {
    location.replace("index.html");
}

//const canHover = window.matchMedia("(hover: hover)").matches;

document.querySelector(".resume").onclick = handleResume;
document.querySelectorAll(".restart").forEach(e => e.onclick = handleRestart);
document.querySelectorAll(".home").forEach(e => e.onclick = home);

document.querySelector(".pause").onmousedown = handlePause;
document.querySelector(".pause").onmouseup = handlePause;

function endGame() {
    paused = true;

    if (sc > userdata.highscores[GAME_LENGTH]) {
        userdata.highscores[GAME_LENGTH] = sc;
        chrome.storage?.sync.set({userdata});
        document.getElementById("finish").dataset.high = 1;
    }

    cancel();

    tiles.forEach(t => {
        t.classList.add("switched");
        setTimeout(() => {
            t.dataset.lives = "";
            t.innerText = "";
            t.classList.remove("switched");
        }, 160)
    })

    animateCountUp(document.querySelector(".score"), sc, 0);
    setTimeout(() => {
        document.querySelector(".item-value.sc").innerText = sc;
        document.querySelector(".item-value.words").innerText = words.size;
        document.getElementById("finish").classList.remove("hidden");

        if (words.size <= 1) new Howl({src: sounds.laughter}).play()
        else new Howl({src: sounds.applause}).play()
        updateVol();
    }, 1000)
}

var page = 0;
var tutorialText = [
    "Click and hold on a tile, then drag over nearby tiles to form words!",
    "Pay attention to the lives of each tile. Once it hits zero, the letter is replaced!",
    "Create longer words to get a higher score!",
    "Rare letters are worth more bonus points, but have less lives!",
    "Once the timer reaches zero, the game is over. Get the highest score you can!"
]

function updatePagePos() {
    const pages = document.querySelectorAll(".page");

    document.querySelectorAll(".page-control").forEach(e => e.classList.remove("hidden"));
    if (page == 0) document.querySelector(".page-control.left").classList.add("hidden");
    else if (page == 4) document.querySelector(".page-control.right").classList.add("hidden");
    
    pages.forEach(p => p.style.setProperty("--left", `${200 - (100 * page)}%`));
    document.querySelector(".tutorial-page-select-button.selected").classList.remove("selected");
    document.querySelectorAll(".tutorial-page-select-button")[page].classList.add("selected");

    document.getElementById("tutorial-page-description").innerText = tutorialText[page];
}

document.querySelectorAll(".page-control").forEach(c => c.addEventListener("click", e => {
    if (e.target.classList.contains("hidden")) return;

    if (!e.target.classList.contains("left")) page++;
    else page--;

    updatePagePos();
}))

document.querySelectorAll(".tutorial-page-select-button").forEach(c => c.addEventListener("click", e => {
    const buttons = document.querySelectorAll(".tutorial-page-select-button");

    let index = [...buttons].indexOf(e.target);

    page = index;
    updatePagePos();
}))

function handleHelp() {
    const tutorial = document.getElementById("tutorial");
    const hidden = tutorial.classList.contains("hidden");
    paused = hidden;

    if (hidden) tutorial.classList.remove("hidden");
    else tutorial.classList.add("hidden");
}

document.querySelector(".help").onclick = handleHelp;
document.getElementById("exit-tutorial").onclick = handleHelp;