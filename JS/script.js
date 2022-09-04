const src = "./words.txt";

const container = document.getElementById("game-board");

const BOARD_SIZE = 4;
const MIN_SOLS = 60;
const NUM_VOWELS = 6;
const GAME_LENGTH = parseInt(window.localStorage.mode);

var userdata = {
    settings: {volume: 1},
    highscores: {
        30000: 0,
        60000: 0,
        120000: 0
    },
    firstTime: true
}

document.documentElement.style.setProperty("--board-size", BOARD_SIZE);

var dict, tiles, board, covered, words, str, sc, seeds, random, moving = false, paused = false;

document.addEventListener("contextmenu", (e) => e.preventDefault());

const dataPromise = Promise.resolve(chrome.storage?.sync.get("userdata"));

var sounds = {
    bg: "SOUNDS/bg-music-game.mp3",
    countdown: "SOUNDS/countdown.wav",
    success: "SOUNDS/success.wav",
    applause: "SOUNDS/applause.mp3",
    laughter: "SOUNDS/laughter.mp3"
}

async function getWords() {
    const d = await fetch(src).then(r => r.text());
    let regex = new RegExp(/\n/, 'g');
    dict = d.replaceAll(regex, "").split(/\r/);
    dict = new Set(dict.filter(d => d.length > 2));
}

let trie = new Trie();

getWords().then(() => dict.forEach(w => trie.insert(w))).then(() => initialize());

const chars = [/*"aeilorstn"*/"lrstn", "bcdghmp"/*u"*/, "fjkqvwxyz"];
const vowels = "aeiou".split("");
var charFrequency = {};
chars.forEach((c, i) => chars[i] = c.split("")); 

function setTile(index) {
    tiles[index].innerHTML = `${board[index].char.toUpperCase()}<div class="hb"></div>`;
    tiles[index].dataset.lives = board[index].lives;
}

function generateTile(index, animate = false, pl = undefined) {
    if (animate) tiles[index].classList.add("switched")

    let pool, rand;

    if (board[index]?.char !== undefined && !vowels.includes(board[index].char)) charFrequency[board[index].char]--;

    function generateRandom() {
        function generatePool() {
            pool = Math.floor(random[index]() * 6);
            pool = pool <= 2 ? 0 : pool >= 3 && pool <= 4 ? 1 : 2;
        }

        if (pl == undefined) generatePool();
        else pool = pl;
        rand = Math.floor(random[index]() * chars[pool].length);

        if (charFrequency[chars[pool][rand]] > pool + 2) generateRandom();
    
        let output = chars[pool][rand];

        charFrequency[output] = charFrequency[output] == undefined ? 1 : charFrequency[output] + 1;

        board[index] = {
            char: output,
            index: index,
            lives: 3 - pool,
            pool: pool
        }

        if (animate) {
            setTimeout(() => {
                setTile(index);

                tiles[index].classList.remove("switched");
            }, 160)
        } else setTile(index);
    }

    generateRandom();
}

function generateVowel(i) {
    let char = vowels[Math.floor(random[random.length - 1]() * vowels.length)];
    let pool = char=="u"?1:0;

    if (board[i]?.char !== undefined) charFrequency[board[i].char]--;
    
    board[i] = {
        char: char,
        index: i,
        lives: 3 - pool,
        pool: pool
    }

    setTile(i);
}

var timer;

function initialize(countdown = true, startSeeds = undefined) {
    covered = [], words = new Set(), str = "", sc = 0;
    document.getElementById("timer").classList.remove("flashing");

    if (startSeeds !== undefined) seeds = startSeeds;
    else seeds = Array.from({length: Math.pow(BOARD_SIZE, 2) + 1}, () => Math.seedrandom());
    
    random = Array.from(seeds, s => new Math.seedrandom(s));

    if (timer !== undefined) clearInterval(timer);
    while (container.firstChild) container.removeChild(container.firstChild);

    function generateBoard() {
        container.innerHTML = "";
        board = [], charFrequency = [];

        let vowelPos = [];
        for (let i = 0; i < NUM_VOWELS; i++) {
            function generateVowels() {
                let rand = Math.floor(random[random.length - 1]() * (Math.pow(BOARD_SIZE, 2)));
                
                if (vowelPos.includes(rand)) generateVowels();
                else vowelPos.push(rand);
            }

            generateVowels();
        }

        for (let i = 0; i < Math.pow(BOARD_SIZE, 2); i++) {
            container.innerHTML += `<div class="tile wood"></div>`;
            tiles = document.querySelectorAll(".tile");

            if (vowelPos.includes(i)) generateVowel(i)
            else generateTile(board.length);
        }

        let sols = evalSols(board, true, MIN_SOLS).then(v => sols = v).then(() => {
            if (sols.length < MIN_SOLS) generateBoard();
        })
    }

    generateBoard();

    const observer = new MutationObserver(mutationCallback);
    tiles.forEach(t => observer.observe(t, { attributes: true }));

    var count = 3;

    if (countdown) var countDown = setInterval(() => {
        if (count == 3) {
            new Howl({
                src: sounds.countdown
            }).play();
            updateVol();
        }

        if (count < 1) {
            document.getElementById("start").classList.add("hidden");
            clearInterval(countDown);

            startTimer();

            new Howl({
                src: sounds.bg,
                loop: true
            }).play();
            updateVol();

            if (userdata.firstTime) {
                handleHelp();
                
                userdata.firstTime = false;
                chrome.storage?.sync.set({userdata});
            }
        }

        document.querySelector(".start-text").innerText = count;
        document.querySelector(".start-text").style.setProperty("animation", "text-fade 1.1s ease-out infinite");

        count--;
    }, 1000) 
    else startTimer();
}

function startTimer() {
    var pauseTime = 0, pauseStart = 0;
    const startTime = Date.now();
    const timerCont = document.getElementById("timer");

    if (!isNaN(GAME_LENGTH) && start) timer = setInterval(() => {
        if (paused) {
            if (pauseStart == 0) pauseStart = Date.now();
            return pauseTime = Date.now() - pauseStart;
        } else pauseStart = 0, pauseStart = 0;

        const timeVisible = (Date.now() - pauseTime) - startTime;
        const progress = 1 - timeVisible / GAME_LENGTH;
        timerCont.style.setProperty("--progress", progress);

        if (progress <= .25) timerCont.classList.add("flashing");

        if (progress <= 0) {
            clearInterval(timer);
            timerCont.classList.remove("flashing");
            endGame();
        }
    }, 10);
}

function handleDown(e) {
    if (e.target.parentElement) var target = e.target.parentElement;
    else return;

    if (!target.classList.contains("tile") || moving || paused) return;

    moving = true;
    
    covered.push(target);
    str += target.innerText;
    target.classList.add("hc");
}

document.onmousedown = handleDown;
document.ontouchstart = handleDown;

function score(str, update = false) {
    let base = str.length == 3 ? 100 : 400 * (str.length - 3);
    let bonus = 0;

    for (let c of str) {
        let rarity;
        
        if (vowels.includes(c.toLowerCase())) rarity = c.toLowerCase() == "u"? 1 : 0;
        else rarity = chars.indexOf(chars.find(e => e.includes(c.toLowerCase())));

        bonus += rarity * 50;
    }
    
    if (update) {
        animateCountUp(
            document.querySelector(".score"),
            sc,
            sc + base + bonus
        )
        sc += base + bonus;
        //document.querySelector(".score").innerText = sc;
    } else {
        document.querySelector(".base").innerText = `+${base}`;
        if (bonus !== 0) document.querySelector(".bonus").innerText = `+${bonus}`;
    }
}

function evaluateDir(t1, t2) {
    let pos1 = board.indexOf(t1);
    let y = Math.floor(pos1 / BOARD_SIZE);
    let x = pos1%BOARD_SIZE;

    let pos2 = board.indexOf(t2);

    let bs = BOARD_SIZE - 1;

    switch (pos2 - pos1) {
        case BOARD_SIZE * -1: if (y > 0) return 0; break;
        case BOARD_SIZE * -1 + 1: if (y > 0 && x < bs) return 45; break;
        case 1: if (x < bs) return 90; break;
        case BOARD_SIZE + 1: if (y < bs && x < bs) return 135; break;
        case BOARD_SIZE: if (y < bs) return 180; break;
        case BOARD_SIZE - 1: if (y < bs && x > 0) return 225; break;
        case -1: if (x > 0) return 270; break;
        case BOARD_SIZE * -1 - 1: if (x > 0 && y > 0) return 315; break;
        default: return undefined;
    }
}

function handleDrag(e) {
    var target = (e.type == "touchmove")?document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY):e.target;
    if (target.parentElement) target = target.parentElement;
    else return;

    if (!moving || !target.classList.contains("tile") || paused) return;
    if (!covered.includes(target)) {
        let p1 = board[[...tiles].indexOf(covered[covered.length - 1])];
        let p2 = board[[...tiles].indexOf(target)];
        let dir = evaluateDir(p1, p2);

        if (dir == undefined) return cancel();

        covered.push(target);

        covered[covered.length - 2].style.setProperty("--rotation", `${dir}deg`);
        covered[covered.length - 2].classList.add("hovered");
        covered[covered.length - 1].classList.add("hc");

        if (dir%90 !== 0) {
            let size = covered[0].getBoundingClientRect().width;
            document.documentElement.style.setProperty("--diaglength", `${Math.hypot(size, size)}px`);
            covered[covered.length - 2].classList.add("diag");
        }

        str += target.innerText;

        const hhc = document.querySelectorAll(".hovered, .hc");

        if (dict.has(str)) {
            function check(t) {
                t.classList.remove("valid", "includes");
                if (words.has(str)) t.classList.add("includes");
                else {
                    t.classList.add("valid");
                    score(str);
                }
            }
            
            hhc.forEach(t => check(t));
        } else {
            hhc.forEach(t => t.classList.remove("valid", "includes"));
            document.querySelectorAll(".base, .bonus").forEach(e => e.innerText = "");
        }
    }
}

document.onmousemove = handleDrag;
document.ontouchmove = handleDrag;

function cancel() {
    if (moving == false) return;
    moving = false;

    covered.forEach(c => {
        c.classList.remove("hovered", "diag", "hc", "includes", "valid");
        c.style.setProperty("--rotation", undefined);
    });
    covered = [];

    document.querySelectorAll(".base, .bonus").forEach(e => e.innerText = "");

    str = "";
}

function handleUp() {
    if (dict.has(str) && !words.has(str)) {
        covered.forEach(c => {
            let index = [...tiles].indexOf(c);
            let existingVowels = board.filter(t => vowels.includes(t.char)).length;

            if (board[index].lives - 1 == 0) {
                if (existingVowels == NUM_VOWELS) generateTile(index, true/*, board[index].pool*/);
                else generateVowel(index);
            } else {
                tiles[index].dataset.lives--;
                board[index].lives--;
            }
        })

        new Howl({
            src: sounds.success
        }).play();
        updateVol();

        words.add(str);

        score(str, true);

        checkIfPossible();
    }
    
    cancel();
}

document.onmouseup = handleUp;
document.ontouchend = handleUp;

var checkWord;

function checkIfPossible() {
    if (checkWord !== undefined && findWord(checkWord)) return;

    let sols = evalSols(board, true, 1).then(v => sols = v).then(() => {
        if (sols.length == 0) {
            board.forEach(t => generateTile(board.indexOf(t), true));
            document.getElementById("announce").classList.add("visible");
            setTimeout(() => {
                document.getElementById("announce").classList.remove("visible");
                checkIfPossible();
            }, 1400)
        } else checkWord = sols[0];
    });
}

dataPromise.then(v => {
    if (v?.userdata !== undefined) Object.assign(userdata, v.userdata);
    else chrome.storage?.sync.set({userdata});
});

function updateVol() {
    Howler._howls.forEach(h => {
        if (userdata.settings.volume !== undefined && userdata.settings.volume == 0) return h.mute(true);
        else h.mute(false);

        h.volume(userdata.settings.volume?userdata.settings.volume:1);
    })
}
