var userdata = {
    settings: {volume: 1},
    highscores: {
        30000: 0,
        60000: 0,
        120000: 0
    },
    firstTime: true
};

const dataPromise = Promise.resolve(chrome.storage?.sync.get("userdata"));

dataPromise.then(v => {
    if (v?.userdata !== undefined) Object.assign(userdata, v.userdata);
    else chrome.storage?.sync.set({userdata});

    updateVolume();
    slider.value = userdata.settings.volume;
});

var sounds = {
    bg: "SOUNDS/bg-music.mp3",
    error: "SOUNDS/error.mp3",
    click: "SOUNDS/click.mp3",
    open: "SOUNDS/open.mp3"
}

//document.addEventListener("contextmenu", (e) => e.preventDefault());
window.localStorage.removeItem("mode");

document.querySelectorAll(".timed-options > *").forEach(e => {
    e.addEventListener("click", () => {
        window.localStorage.setItem("mode", e.dataset.value);
        location.replace("game.html");
    })
})

function op(e) {
    let target;
    
    if (e.type == "touchstart") target = e.targetTouches[0].target;
    else target = e.target;

    if (target.classList.contains("play")) new Howl({src: sounds.open, volume: quiet}).play();
    else new Howl({src: sounds.click, volume: quiet}).play()

    if (document.querySelector(".option.timed").classList.contains("open")) {
        document.querySelector(".option.timed").classList.remove("open");
    }
    target.classList.toggle("open");
}

function announce() {
    if (!document.getElementById("announcer").classList.contains("hidden")) return;
    document.getElementById("announcer").classList.remove("hidden");
    error.play();
    
    setTimeout(() => {
        document.getElementById("announcer").classList.add("hidden");
    }, 2500)
}

document.querySelectorAll(".account, .option.daily").forEach(e => e.onclick = announce);
document.querySelectorAll(".play.button, .option.timed, .settings.button").forEach(e => e.onclick = op);

var error = new Howl({
    src: sounds.error
});

new Howl({
    src: sounds.bg,
    loop: true
}).play();

function updateVolume() {
    quiet = userdata.settings.volume>0?userdata.settings.volume/4:0;

    Howler._howls.forEach(h => {
        if (userdata.settings.volume !== undefined && userdata.settings.volume == 0) return h.mute(true);
        else h.mute(false);

        if (h.volume !== quiet) h.volume(userdata.settings.volume?userdata.settings.volume:1)
        else h.volume(quiet);
    })
}

function changeValue(value) {
    userdata.settings.volume = value;
    chrome.storage?.sync.set({userdata});
    updateVolume();
}

const slider = document.querySelector("#sound-container > input");
slider.addEventListener("change", () => changeValue(parseFloat(slider.value)));
slider.addEventListener("input", () => changeValue(parseFloat(slider.value)));

// Fluffing a Duck Kevin MacLeod (incompetech.com)
// Licensed under Creative Commons: By Attribution 3.0 License
// http://creativecommons.org/licenses/by/3.0/
// Music promoted by https://www.chosic.com/free-music/all/

// Lobby Time by Kevin MacLeod | https://incompetech.com/
// Music promoted by https://www.chosic.com/free-music/all/
// Creative Commons Creative Commons: By Attribution 3.0 License
// http://creativecommons.org/licenses/by/3.0/