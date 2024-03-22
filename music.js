var audio = new Audio();

export function loadSong(song) {
    audio.src = song;
    audio.play();
}

function playMusic() {
    audio.play();
}

function pauseMusic() {
    audio.pause();
}

function skipMusic() {
    // Implement skipping logic
}
