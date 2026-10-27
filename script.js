import { THEMES } from "./words.js";

// initialize global vars
const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let rightGuessString = ""
let currentWordList = [];
console.log(rightGuessString)

// play again button
const playAgainBtn = document.getElementById("play-again")

// stats button 
const STATS_KEY = "wordle-stats"

// theme menu logic
document.getElementById("theme-menu") .addEventListener("click", (e) => {
    if (!e.target.classList.contains("theme-button")) {
        return
    }
    let theme = e.target.dataset.theme
    startGame(theme)
})

// load save update and render functions for stats feature
function loadStats () {
    let saved = localStorage.getItem(STATS_KEY)
    if (saved) {
        return JSON.parse(saved)
    }
    return {
        played: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0]  
    }
}

let stats = loadStats()

function saveStats () {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

function updateStats (won, guessNumber) {
    stats.played += 1
    if (won) {
        stats.wins += 1
        stats.currentStreak += 1
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
        stats.distribution[guessNumber - 1] += 1
    } else {
        stats.currentStreak = 0
    }
    saveStats()
}

function renderStats () {
    document.getElementById("stat-played").textContent = stats.played
    let winPct = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100)
    document.getElementById("stat-winpct").textContent = winPct
    document.getElementById("stat-streak").textContent = stats.currentStreak
    document.getElementById("stat-maxstreak").textContent = stats.maxStreak

    let distEl = document.getElementById("guess-distribution")
    distEl.innerHTML = ""
    let maxCount = Math.max(...stats.distribution, 1)
    stats.distribution.forEach((count, i) => {
        let row = document.createElement("div")
        row.className = "dist-row"

        let label = document.createElement("span")
        label.textContent = i + 1

        let bar = document.createElement("div")
        bar.className = "dist-bar"
        bar.textContent = count
        bar.style.width = `${(count / maxCount) * 100}%`

        row.appendChild(label)
        row.appendChild(bar)
        distEl.appendChild(row)
    })
}

// stats open/close
document.getElementById("stats-button").addEventListener("click", () => {
    renderStats()
    document.getElementById("stats-model").classList.add("visible")
})

document.getElementById("stats-close").addEventListener("click", () => {
    document.getElementById("stats-model").classList.remove("visible")
})

document.getElementById("stats-model").addEventListener("click", (e) => {
    if (e.target.id === "stats-model") {
        document.getElementById("stats-model").classList.remove("visible")
    }
})

// logic for when theme is picked
function startGame (theme) {
    currentWordList = THEMES[theme]
    rightGuessString = currentWordList[Math.floor(Math.random() * currentWordList.length)]
    console.log(rightGuessString)

    document.body.classList.remove ("theme-classic", "theme-halloween", "theme-christmas")
    document.body.classList.add (`theme-${theme}`)

    document.getElementById("theme-menu").style.display = "none"
    document.getElementById("game-container").classList.add("visible")

    document.getElementById("game-board").innerHTML = ""
    initBoard()

    guessesRemaining = NUMBER_OF_GUESSES
    currentGuess = []
    nextLetter = 0

    for (const elem of document.getElementsByClassName("keyboard-button")) {
        elem.style.backgroundColor = ""
        elem.style.opacity = ""
    }
    playAgainBtn.classList.remove("visible")
}

document.getElementById("game-title").addEventListener("click", () => {
    goToMenu()
})

function goToMenu () {
    guessesRemaining = 0
    document.getElementById("game-container").classList.remove("visible")
    document.getElementById("theme-menu").style.display = "flex"

    document.body.classList.remove("theme-classic", "theme-halloween", "theme-christmas")

    for (const elem of document.getElementsByClassName("keyboard-button")) {
        elem.style.backgroundColor = ""
        elem.style.opacity = ""
    }

    playAgainBtn.classList.remove("visible")
    toastr.clear()
}

// creates one row for each guess and there is a total of 5 boxes per row
// also adds each row to game board container respective classes are assigned like letter-row and letter-box
function initBoard() {
    let board = document.getElementById("game-board");

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement("div")
        row.className = "letter-row"

        for (let j = 0; j < 5; j ++) {
            let box = document.createElement("div")
            box.className = "letter-box"
            row.appendChild(box)
        }
        board.appendChild(row)
    }
}

// listener to determine what key is pressed and it correlates to the position you want it to be
document.addEventListener("keyup", (e) => {

    if (guessesRemaining === 0) {
        return
    }

    let pressedKey = String(e.key) 
    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter()
        return
    }

    if (pressedKey === "Enter") {
        checkGuess()
        return
    }

    let found = pressedKey.match(/[a-z]/gi)
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }

})

// define insert letter function
// checks if theres still space to guess a letter and finds respective row then puts letter in box
// added pulse animation to each box quickly before filling with letter
function insertLetter (pressedKey) {
    if (nextLetter === 5) {
        return
    }
    pressedKey = pressedKey.toLowerCase()

    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter]
    animateCSS(box, "pulse")
    box.textContent = pressedKey
    box.classList.add ("filled-box")
    currentGuess.push(pressedKey)
    nextLetter +=1
}

// define delete letter function
// gets row and finds last box then clears it, resetting nextLetter count
function deleteLetter () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter - 1]
    box.textContent = ""
    box.classList.remove("filled-box")
    currentGuess.pop()
    nextLetter -= 1
}

// checks if guess is 5 letters, checks guess is a valid list, checks each letter of word and shades them, tells user end game
// algorithm for shading simply checks if letter is in correct word if its not then shades grey
// if letter is in the word then checks position if in right position then shades green else shades yellow
function checkGuess () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let guessNumber = 6 - guessesRemaining + 1
    let guessString = ""

    for (const val of currentGuess) {
        guessString += val
    }

    if (guessString.length != 5) {
        toastr.error ("Not enough letters!")
        return
    }

    if (!currentWordList.includes(guessString)) {
        toastr.error ("Word not in list!")

        for (let i = 0; i < 5; i++) {
            let box = row.children[i]
            box.textContent = ""
            box.classList.remove("filled-box")
        }

        currentGuess = []
        nextLetter = 0
        
        return
    }

    let colors = Array(5).fill('grey')
    let remaining = Array.from(rightGuessString)

    for (let i = 0; i < 5; i ++) {
        if (currentGuess[i] === rightGuessString[i]) {
            colors[i] = 'green'
            remaining[i] = '#'
        }
    }

    for (let i = 0; i < 5; i++) {
        if (colors[i] === 'green') {
            continue
        }
        let pos = remaining.indexOf(currentGuess[i])
        if (pos !== -1) {
            colors[i] = 'yellow'
            remaining[pos] = '#'
        }
    }

    for (let i = 0; i < 5; i++) {
        let letterColor = colors[i]
        let box = row.children[i]
        let letter = currentGuess[i]

        let delay = 250 * i
        setTimeout(() => {
            // flip box vertically before color change
            animateCSS(box, 'flipInX')
            // shade box logic
            box.style.backgroundColor = letterColor
            shadeKeyBoard(letter, letterColor)
        }, delay)
    }

    if (guessString === rightGuessString) {
        toastr.success ("You guessed right! Game over!")
        guessesRemaining = 0
        updateStats(true, guessNumber)
        showPlayAgain()
        return
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            toastr.error ("You've run out of guesses! Game over!")
            toastr.info (`The correct word was: "${rightGuessString}"`)
            updateStats(false, null)
            showPlayAgain()
        }
    }
}

// define shadekeyboard function
// logic is to recieve letter from on screen keyboard we want to shade and the color we want to shade it
// finds key that matches given letter if its green do nothing, if its yellow only can become green
// anything else just shade key 
function shadeKeyBoard (letter,color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            let oldColor = elem.style.backgroundColor
            if (oldColor === 'green') {
                return
            }

            if (oldColor === 'yellow' && color != 'green') {
                return
            }

            elem.style.backgroundColor = color == 'grey' ? '#3a3a3c' : color
            elem.style.opacity = color === 'grey' ? '0.6' : ''
            break
        }
    }
}

// logic to show play again button after last file finishes flipping
function showPlayAgain () {
    setTimeout(() => {
        playAgainBtn.classList.add("visible")
    }, 1300)
}

// resets the game entirely
function resetGame() {
    let theme = "classic"
    if (document.body.classList.contains("theme-halloween")) {
        theme = "halloween"
    } else if (document.body.classList.contains("theme-christmas")) {
        theme = "christmas"
    }
    startGame(theme)
}

playAgainBtn.addEventListener("click", resetGame)

// define on screen keyboard input function
// listens for click on keyboard if clicked element is not a button it exits the function
// anything else is dispatched with a keyup event to corresponding key
document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target

    if (!target.classList.contains("keyboard-button")) {
        return
    }

    let key = target.textContent

    if (key === "Del") {
        key = "Backspace"
    }

    document.dispatchEvent(new KeyboardEvent("keyup", {'key': key}))
})

// pulse animation everytime letter is typed
// flip animation on each tile when guess is submitted
const animateCSS = (element, animation, prefix = 'animate__') =>
    new Promise((resolve,reject) => {
        const animationName = `${prefix}${animation}`;
        const node = element
        node.style.setProperty('--animate-duration', '0.3s');

        node.classList.add(`${prefix}animated`, animationName);
        
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }
        node.addEventListener('animationend', handleAnimationEnd, {once: true});
});