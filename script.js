import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";


    // Your Firebase configuration.  Go to your Firebase project settings in the console
    // to find your config object.
    const firebaseConfig = {
        apiKey: "AIzaSyCjZMNkIC2z49GqeuRAV7yUdMIoIRL2ppg",
        authDomain: "penalty-game-1fbf5.firebaseapp.com",
        projectId: "penalty-game-1fbf5",
        storageBucket: "penalty-game-1fbf5.appspot.com",
        messagingSenderId: "380097885589",
        appId: "1:380097885589:web:d5633cbb1103045592f29c",
        measurementId: "G-R0P48VMRY4"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);
    logEvent(analytics, 'notification_received');
    console.log("Firebase initialized!");
    

let score = 0;
let currentQuestionIndex = 0;
let ball; // Declare the ball variable outside the function to be used globally
let playerName; // Declare playerName globally
let gameStarted = false; // Add a flag to track if the game has started

export function checkNameInput() {
    const playerName = document.getElementById("playerName").value;
    const startButton = document.getElementById("start-button");
    if (playerName.trim() !== "") {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
}

export function startGame() {
    if (gameStarted) {
        return; // Prevent starting the game if it has already started
    }
    gameStarted = true; // Set the flag to true when the game starts
    playerName = document.getElementById("playerName").value; // Assign playerName here
    if (!playerName) {
        alert("Please enter your name before starting the game.");
        return; // Prevent game from starting if no name is entered.
    }

    // Save the player name to localStorage
    localStorage.setItem("playerName", playerName);
    const startPage = document.getElementById("start-page");
    const questionBox = document.getElementById("question-box");
    const overlay = document.getElementById("overlay");
    const startButton = document.getElementById("start-button");
    const mainMenuButton = document.getElementById("main-menu-button");
    

    if (startPage) {
        startPage.style.display = "none";
    }

    if (questionBox) {
        questionBox.style.display = "block";
        questionBox.innerHTML = '<h2 id="question-text"></h2><div id="answer-buttons"></div>'; // Reset question box content
    }

    if (overlay) {
        overlay.style.display = "none"; // Hide the overlay
    }

    if (startButton) {
        startButton.style.display = "none"; // Hide the start button
    }

    if (mainMenuButton) {
        mainMenuButton.style.display = "block"; // Show the main menu button
    }

    // Reset the game state
    score = 0;
    currentQuestionIndex = 0;
    updateScoreboard();

    // Ensure the ball is created when the game starts
    createBall();
    showQuestion();
    loadHighScoresFirestore(); // Load high scores when the game starts
    saveHighScoreFirestore(); // Save high score when the game starts
}

function createBall() {
    if (!ball) { // Only create a ball if it doesn't exist
        ball = document.createElement("div");
        ball.classList.add("ball");
        document.body.appendChild(ball);

        // Set initial ball position
        ball.style.left = `${window.innerWidth / 2}px`;
        ball.style.top = `${window.innerHeight - 350}px`; // Closer to the goal
    }
}

function launchBallToGoal() {
    // Animate ball into the goal with random trajectory
    ball.style.transition = "all 0.5s ease";
    ball.style.top = "10%"; // Moves closer to the goal
    ball.style.left = `${window.innerWidth / 2}px`; // Centered goal position
    ball.style.opacity = 0; // Disappear after goal

    setTimeout(() => {
        // Reset ball position after goal
        ball.style.transition = "none";
        ball.style.left = `${window.innerWidth / 2}px`;
        ball.style.top = `${window.innerHeight - 350}px`;
        ball.style.opacity = 1;
    }, 1000);
}

function showQuestion() {
    const questionBox = document.getElementById("question-box");
    const questionText = document.getElementById("question-text");
    const answerButtons = document.getElementById("answer-buttons");

    if (!questionBox || !questionText || !answerButtons) {
        console.error("Essential DOM elements not found!");
        return;
    }

    // Update the question text
    questionText.textContent = questions[currentQuestionIndex].question;

    // Clear previous answer buttons
    answerButtons.innerHTML = "";

    // Shuffle the answers
    const shuffledAnswers = shuffleArray([...questions[currentQuestionIndex].answers]);

    // Create and append the buttons
    shuffledAnswers.forEach(answer => {
        const button = document.createElement("button");
        button.textContent = answer;
        button.classList.add("answer-button");
        button.onclick = () => checkAnswer(button, answer);
        answerButtons.appendChild(button);
    });

    // Ensure question box is on top using z-index
    questionBox.style.zIndex = "9999"; // Bring the question box and buttons to the front
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkAnswer(selectedButton, selectedAnswer) {
    const correctAnswer = questions[currentQuestionIndex].correct;
    const answerButtons = document.querySelectorAll(".answer-button");

    // Disable buttons and provide feedback
    answerButtons.forEach(button => {
        button.disabled = true;
        if (button.textContent === correctAnswer) {
            button.style.backgroundColor = "green"; // Correct answer
        } else {
            button.style.backgroundColor = "red"; // Incorrect answer
        }
    });

    // Increment score if correct answer
    if (selectedAnswer === correctAnswer) {
        score++;
        updateScoreboard();
        launchBallToGoal();
        saveHighScoreFirestore();
        playGoalSound(); 
    }

    // Move to next question after a brief delay
    currentQuestionIndex++;
    setTimeout(() => {
        if (currentQuestionIndex < questions.length) {
            showQuestion(); // Show the next question
        } else {
            endGame(); // End the game if no more questions
        }
    }, 1000); // Wait for 1 second before showing the next question
}

function updateScoreboard() {
    let scoreboard = document.getElementById("scoreboard");
    if (!scoreboard) {
        scoreboard = document.createElement("div");
        scoreboard.id = "scoreboard";
        scoreboard.style.position = "fixed";
        scoreboard.style.top = "20px";
        scoreboard.style.right = "20px";
        scoreboard.style.fontSize = "1.2rem";
        scoreboard.style.color = "#0ff";
        scoreboard.style.textShadow = "0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #00f";
        document.body.appendChild(scoreboard);
    }

    const playerName = localStorage.getItem("playerName");
    scoreboard.textContent = `Player: ${playerName} | Score: ${score}`;
}

function endGame() {
    document.getElementById("question-box").innerHTML = `<h2>Game Over! Your score: ${score}</h2>`;
    saveHighScoreFirestore();
    loadHighScoresFirestore();
    // Automatically return to the main menu after a brief delay
    setTimeout(goToMainMenu, 2000); // Wait for 2 seconds before returning to the main menu
}

function goToMainMenu() {
    // Save the score before going to the main menu
    saveHighScoreFirestore().then(() => {
        gameStarted = false; // Reset the flag when returning to the main menu
        // Show the overlay and start page
        const overlay = document.getElementById("overlay");
        const startPage = document.getElementById("start-page");
        const questionBox = document.getElementById("question-box");
        const mainMenuButton = document.getElementById("main-menu-button");
        const playerNameInput = document.getElementById("playerName");
        const startButton = document.getElementById("start-button");

        if (overlay) {
            overlay.style.display = "flex";
        }

        if (startPage) {
            startPage.style.display = "block";
        }

        if (questionBox) {
            questionBox.style.display = "none";
        }

        if (mainMenuButton) {
            mainMenuButton.style.display = "none"; // Hide the main menu button
        }

        if (playerNameInput) {
            playerNameInput.value = ""; // Clear the player name input
        }

        if (startButton) {
            startButton.disabled = true; // Disable the start button
            startButton.style.display = "block"; // Show the start button
        }

        // Reset the game state
        score = 0;
        currentQuestionIndex = 0;
        updateScoreboard();
    }).catch(error => {
        console.error("Error saving high score: ", error);
    });
}

window.onload = function () {
    const startPage = document.getElementById("start-page");

    // Add event listener for start button
    if (startPage) {
        const startButton = document.getElementById("start-button");
        startButton.addEventListener("click", startGame);
        const playerNameInput = document.getElementById("playerName");
        playerNameInput.addEventListener("input", checkNameInput);
    } else {
        console.error("Start page not found!");
    }
    
    // Add event listener for main menu button
    const mainMenuButton = document.getElementById("main-menu-button");
    if (mainMenuButton) {
        mainMenuButton.addEventListener("click", goToMainMenu);
    } else {
        console.error("Main menu button not found!");
    }
};

const questions = [
    {
        question: "Which club has won the most Eredivisie titles?",
        answers: ["Ajax Amsterdam", "PSV Eindhoven", "Feyenoord"],
        correct: "Ajax Amsterdam"
    },
    {
        question: "In which year was the Eredivisie founded?",
        answers: ["1956", "1960", "1948"],
        correct: "1956"
    },
    {
        question: "Which club is known as 'De Godenzonen'?",
        answers: ["Ajax Amsterdam", "Feyenoord", "AZ Alkmaar"],
        correct: "Ajax Amsterdam"
    },
    {
        question: "What is the home stadium of PSV Eindhoven?",
        answers: ["Philips Stadion", "De Kuip", "Johan Cruyff Arena"],
        correct: "Philips Stadion"
    },
    {
        question: "Who is the all-time top scorer in Eredivisie history?",
        answers: ["Willy van der Kuijlen", "Robin van Persie", "Ruud Gullit"],
        correct: "Willy van der Kuijlen"
    },
    {
        question: "Which team won the Eredivisie title in the 2022-2023 season?",
        answers: ["Feyenoord", "Ajax Amsterdam", "PSV Eindhoven"],
        correct: "Feyenoord"
    },
    {
        question: "What city is Feyenoord based in?",
        answers: ["Rotterdam", "Amsterdam", "Eindhoven"],
        correct: "Rotterdam"
    },
    {
        question: "Which club is nicknamed 'De Superboeren'?",
        answers: ["De Graafschap", "FC Twente", "NEC Nijmegen"],
        correct: "De Graafschap"
    },
    {
        question: "Who holds the record for most appearances in the Eredivisie?",
        answers: ["Pim Doesburg", "Johan Cruyff", "Dirk Kuyt"],
        correct: "Pim Doesburg"
    },
    {
        question: "What is the name of Ajax Amsterdam's youth academy?",
        answers: ["De Toekomst", "Ajax Campus", "Amsterdam Academy"],
        correct: "De Toekomst"
    },
    {
        question: "Which Eredivisie club has a partnership with Red Bull?",
        answers: ["FC Utrecht", "RB Leipzig", "None"],
        correct: "None"
    },
    {
        question: "What is the biggest rivalry in Dutch football?",
        answers: ["De Klassieker", "De Derby", "De Supermatch"],
        correct: "De Klassieker"
    },
    {
        question: "Which club won their first Eredivisie title in 2010?",
        answers: ["FC Twente", "AZ Alkmaar", "Vitesse"],
        correct: "FC Twente"
    },
    {
        question: "What color is Ajax Amsterdam's home jersey?",
        answers: ["Red and White", "Blue and White", "Black and Red"],
        correct: "Red and White"
    },
    {
        question: "Which Dutch footballer won the Ballon d'Or in 1987?",
        answers: ["Ruud Gullit", "Marco van Basten", "Johan Cruyff"],
        correct: "Ruud Gullit"
    },
    {
        question: "What club is famous for its youth development in the Eredivisie?",
        answers: ["Ajax Amsterdam", "PSV Eindhoven", "Feyenoord"],
        correct: "Ajax Amsterdam"
    },
    {
        question: "Which Eredivisie club plays at the 'GelreDome' stadium?",
        answers: ["Vitesse", "FC Utrecht", "SC Heerenveen"],
        correct: "Vitesse"
    },
    {
        question: "Who scored the fastest goal in Eredivisie history?",
        answers: ["Koos Waslander", "Robin van Persie", "Arjen Robben"],
        correct: "Koos Waslander"
    },
    {
        question: "Which Eredivisie team has a cow mascot called 'Hertog Jan'?",
        answers: ["PSV Eindhoven", "FC Twente", "AZ Alkmaar"],
        correct: "PSV Eindhoven"
    },
    {
        question: "How many teams compete in the Eredivisie each season?",
        answers: ["18", "20", "16"],
        correct: "18"
    }
];

// Firestore: Save high score
async function saveHighScoreFirestore() {
    try {
      if (!playerName) return;
      const playerDocRef = doc(db, "playerScores", playerName);
      const docSnap = await getDoc(playerDocRef);
      if (docSnap.exists()) {
        const existingScore = docSnap.data().score;
        if (score > existingScore) {
          await updateDoc(playerDocRef, { score: score });
        }
      } else {
        await setDoc(playerDocRef, { name: playerName, score: score });
      }
    } catch (error) {
      console.error("Error saving high score: ", error);
    }
  }
  
  // Firestore: Load top 5 high scores
  async function loadHighScoresFirestore() {
    try {
      const leaderboardRef = collection(db, "playerScores");
      const q = query(leaderboardRef, orderBy("score", "desc"), limit(5)); // Change limit to 5
      const querySnapshot = await getDocs(q);
      const scoreList = document.getElementById("highScoreList");
      scoreList.innerHTML = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `${data.name}: ${data.score}`;
        scoreList.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading high scores: ", error);
    }
  }
  // Load high scores on window load (for leaderboard on start page)
window.addEventListener("load", loadHighScoresFirestore);

const goalSound = new Audio(`../sounds/soccer-kick.mp3`);
function playGoalSound() {
    goalSound.currentTime = 0;
    goalSound.play();
}
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !gameStarted) {
        document.getElementById("start-button").click();
    }
});

