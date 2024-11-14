let isPaused = false;
let timerInterval;

// Display selected file name and show submit button
function showSubmit(input) {
    const buttonText = document.getElementById('button-text');
    const submitContainer = document.getElementById('submit-container');
    
    if (input.files.length > 0) {
        buttonText.textContent = `${input.files[0].name}`;
        submitContainer.classList.remove('hidden');
    } else {
        submitContainer.classList.add('hidden');
    }
}


// Clear selected file
function clearFile() {
    const fileInput = document.getElementById('syllabus');
    const buttonText = document.getElementById('button-text');
    const submitButton = document.getElementById('submit-button');
    const removeFile = document.getElementById('remove-file');
    
    fileInput.value = "";
    buttonText.textContent = "Upload Syllabus";
    submitButton.classList.add('hidden');
    removeFile.classList.add('hidden');
}


// Timer functionality
function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    timerInterval = setInterval(function () {
        if (!isPaused) {  // Only update the timer if not paused
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(timerInterval);
                alert("Time's up!");
            }
        }
    }, 1000);
}


// Pause and resume functionality
function togglePause() {
    const overlay = document.getElementById("overlay");

    if (isPaused) {
        overlay.style.display = "none"; // Hide overlay when resuming
        isPaused = false;               // Resume timer
    } else {
        overlay.style.display = "block"; // Show overlay when pausing
        isPaused = true;                // Pause timer
    }
}


// Add event listener to the timer and overlay
document.addEventListener("DOMContentLoaded", function() {
    const timerElement = document.getElementById("timer");
    const overlay = document.getElementById("overlay");
    const duration = 25 * 60; // 25 minutes in seconds

    if (timerElement) {
        startTimer(duration, timerElement); // Start the timer on load
        timerElement.addEventListener("click", togglePause); // Toggle pause on timer click
    }

    if (overlay) {
        overlay.addEventListener("click", togglePause); // Toggle pause on overlay click
    }
});


// Fetch and display file summary and update current topic
function fetchAndDisplayFileSummary() {
    fetch('/upload_syllabus', {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        },
        body: new FormData(document.getElementById('syllabusForm'))
    })
    .then(response => response.json())
    .then(data => {
        if (data.summary) {
            // Display the summary message
            displayLLMMessage(data.summary);

            // Update currentTopic with the main topic from the syllabus
            if (data.mainTopic) {
                currentTopic = data.mainTopic;
                displayLLMMessage(`The main topic is set to: ${currentTopic}`);
            }
        } else {
            displayLLMMessage("No summary available.");
        }
    })
    .catch(error => console.error('Error fetching file summary:', error));
}

// Display a message from the LLM in the chat container
function displayLLMMessage(text) {
    const chatContainer = document.getElementById("chat-container");
    const llmMessageDiv = document.createElement("div");
    llmMessageDiv.className = "message llm-message";

    if (text.includes("- ")) {
        const ul = document.createElement("ul");
        ul.style.paddingLeft = "20px";
        ul.style.margin = "10px 0";

        text.split("\n").forEach(line => {
            if (line.trim().startsWith("-")) {
                const li = document.createElement("li");
                li.textContent = line.trim().substring(1).trim();
                ul.appendChild(li);
            } else {
                const p = document.createElement("p");
                p.textContent = line.trim();
                llmMessageDiv.appendChild(p);
            }
        });
        llmMessageDiv.appendChild(ul);
    } else {
        llmMessageDiv.textContent = text;
    }

    chatContainer.appendChild(llmMessageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (window.MathJax) {
        window.MathJax.typesetPromise([llmMessageDiv]).catch((err) => console.error("MathJax rendering error:", err));
    }
}

// Enter key submission in user input area
document.addEventListener("DOMContentLoaded", function() {
    const userInput = document.getElementById("user-input");
    if (userInput) {  // Check if userInput element exists
        userInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitUserInput();
            }
        });
    }
});


// Send user input to the server and display the LLM's response and example
function submitUserInput() {
    const userInput = document.getElementById("user-input");
    const chatContainer = document.getElementById("chat-container");
    const userMessage = userInput.value.trim();

    if (userMessage) {
        const userMessageDiv = document.createElement("div");
        userMessageDiv.className = "message user-message";
        userMessageDiv.textContent = userMessage;
        chatContainer.appendChild(userMessageDiv);

        userInput.value = "";

        fetch('/get_response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_message: userMessage })
        })
        .then(response => response.json())
        .then(data => {
            displayLLMMessage(data.response);
            if (data.example) {
                setTimeout(() => displayLLMMessage(data.example), 1000);
            }
        })
        .catch(error => console.error('Error fetching LLM response:', error));
    }
}

let currentTopic = "Foundations of Optimization";

// Update the topic when the user selects one
function setCurrentTopic(topic) {
    currentTopic = topic;
    displayLLMMessage(`Let's dive into ${topic}.`);
}

// Start Knowledge Check: Blur the tutor section and start the quiz
function startKnowledgeCheck() {
    const tutorSection = document.getElementById("tutor-section");
    const knowledgeCheckButton = document.getElementById("knowledge-check-button");

    // Blur the tutor section
    tutorSection.classList.add("blur");

    // Hide the "Knowledge Check" button
    knowledgeCheckButton.style.display = "none";

    // Fetch and display the first quiz question
    fetchQuizQuestion();
}


function fetchQuizQuestion() {
    fetch('/generate_quiz_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayQuiz("Quiz unavailable at this time.");
        } else if (data.question && data.options && data.correctAnswer) {
            totalQuestionsCount++;
            displayQuiz(data.question, data.options, data.correctAnswer);
            updateScoreDisplay(); // Update the score display for total questions
        } else {
            displayQuiz("Error loading quiz question.");
        }
    })
    .catch(error => console.error('Error fetching quiz question:', error));
}

function displayQuiz(question, options, correctAnswer) {
    const quizSection = document.getElementById("quiz-section");
    quizSection.innerHTML = "";  // Clear previous content

    // Display question
    const questionElement = document.createElement("p");
    questionElement.textContent = question;
    quizSection.appendChild(questionElement);

    // Display multiple-choice options
    options.forEach(option => {
        const optionButton = document.createElement("button");
        optionButton.className = "quiz-option";
        optionButton.textContent = option;
        optionButton.onclick = () => handleAnswerSelection(optionButton, correctAnswer);
        quizSection.appendChild(optionButton);
    });
}


// Handle answer selection
function handleAnswerSelection(selectedButton, correctAnswer) {
    const isCorrect = selectedButton.textContent === correctAnswer;
    if (isCorrect) {
        selectedButton.classList.add("correct-answer");
        correctAnswersCount++;  // Increment the correct answers count
        updateScoreDisplay();   // Update the score display
        fetchQuizQuestion();    // Fetch a new question
    } else {
        selectedButton.classList.add("incorrect-answer");
    }
}

// Initialize score counters
let correctAnswersCount = 0;
let totalQuestionsCount = 0;

// Function to update the score display
function updateScoreDisplay() {
    const scoreDisplay = document.getElementById("score-display");
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${correctAnswersCount}/${totalQuestionsCount}`;
    }
}




// Initialize the Fact Carousel
function initializeFactCarousel() {
    const factDisplay = document.getElementById("fact-display");
    if (!factDisplay) return;

    let currentIndex = 0;
    let facts = [];

    fetch('/static/data/stem_facts.json')
        .then(response => response.json())
        .then(data => {
            facts = data.facts;
            if (facts.length > 0) {
                updateFact();
                setInterval(updateFact, 5000);
            } else {
                factDisplay.text

Content = "No facts available.";
            }
        })
        .catch(error => {
            console.error('Error fetching facts:', error);
            factDisplay.textContent = "Failed to load facts.";
        });

    function updateFact() {
        factDisplay.textContent = facts[currentIndex];
        currentIndex = (currentIndex + 1) % facts.length;
    }
}

// Consolidate onload functions
window.onload = function () {
    const duration = 25 * 60;
    const display = document.getElementById('timer');
    startTimer(duration, display); // Start the timer
    initializeFactCarousel();
};