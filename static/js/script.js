// Global variables
let isPaused = false;
let timerInterval;
let currentTopic = "Foundations of Optimization";
let correctAnswersCount = parseInt(localStorage.getItem('quiz_score_correct')) || 0;
let totalQuestionsCount = parseInt(localStorage.getItem('quiz_score_total')) || 0;
let isBreakTime = false;
let breakTimer;

// Initialize theme
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle-btn');
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';

        themeToggle.addEventListener('change', function() {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFactCarousel();
    
    const display = document.getElementById('timer');
    if (display) {
        const duration = 25 * 60;
        startTimer(duration, display);
    }
});

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
        if (!isPaused) {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(timerInterval);
                startBreak();
            }
        }
    }, 1000);
}

function startBreak() {
    isBreakTime = true;
    const breakOverlay = document.getElementById("break-overlay");
    breakOverlay.style.display = "flex";
    
    // Start 5-minute break timer
    let breakTime = 5 * 60; // 5 minutes in seconds
    const timerDisplay = document.getElementById("timer");
    
    breakTimer = setInterval(() => {
        let minutes = parseInt(breakTime / 60, 10);
        let seconds = parseInt(breakTime % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerDisplay.textContent = minutes + ":" + seconds;

        if (--breakTime < 0) {
            clearInterval(breakTimer);
            endBreak();
        }
    }, 1000);
}

function endBreak() {
    isBreakTime = false;
    const breakOverlay = document.getElementById("break-overlay");
    const confirmation = document.getElementById('break-confirmation');
    
    // Hide both overlay and confirmation
    breakOverlay.style.display = "none";
    confirmation.style.display = "none";
    
    // Reset and start new timer
    const duration = 25 * 60;  // Changed from 30 to 25 * 60 (25 minutes)
    const display = document.getElementById('timer');
    
    // Clear any existing intervals
    clearInterval(timerInterval);
    clearInterval(breakTimer);
    
    // Reset timer display immediately
    display.textContent = "25:00";  // Updated to show 25:00
    
    // Wait a brief moment before starting new timer
    setTimeout(() => {
        startTimer(duration, display);
    }, 100);
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
    const breakOverlay = document.getElementById("break-overlay");
    const duration = 25 * 60;  // Changed from 30 to 25 * 60 (25 minutes)

    if (timerElement) {
        startTimer(duration, timerElement);
        timerElement.addEventListener("click", () => {
            if (!isBreakTime) {
                togglePause();
            }
        });
    }

    if (overlay) {
        overlay.addEventListener("click", togglePause);
    }

    if (breakOverlay) {
        breakOverlay.addEventListener("click", (e) => {
            // Only show confirmation if clicking the main overlay
            if (e.target === breakOverlay) {
                const confirmation = document.getElementById('break-confirmation');
                confirmation.style.display = 'block';
            }
        });

        // Handle confirmation buttons
        document.getElementById('confirm-skip').addEventListener('click', () => {
            clearInterval(breakTimer);
            endBreak();
        });

        document.getElementById('cancel-skip').addEventListener('click', () => {
            document.getElementById('break-confirmation').style.display = 'none';
        });
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

async function displayLLMMessage(text, type = 'text', diagramCode = null) {
    return new Promise((resolve) => {
        const chatContainer = document.getElementById("chat-container");
        const messageDiv = document.createElement("div");
        messageDiv.className = "message llm-message";
        
        if (type === 'diagram') {
            // Diagram handling remains the same
            // ...
        } else {
            // Protect LaTeX delimiters and wrap display math in divs
            text = text.replace(/\$\$(.*?)\$\$/g, (match, p1) => {
                // Center align display math
                return `\n<div class="math-display" style="text-align: center;">${match}</div>\n`;
            });
            
            // Handle inline math carefully
            text = text.replace(/\$(.*?)\$/g, (match) => {
                return match.replace(/[_*]/g, '\\$&');
            });

            // Special handling for matrix notation and "subject to" formatting
            text = text.replace(/subject to:/g, (match) => {
                return `\n\n${match}\n`;
            });

            // Parse markdown
            const parsedContent = marked.parse(text);
            
            // Create a temporary div to parse HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = parsedContent;
            
            // Split content into blocks while preserving HTML
            const blocks = [];
            tempDiv.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    // Split text nodes into sentences
                    const textSentences = node.textContent.match(/[^.!?]+[.!?]+/g) || [node.textContent];
                    textSentences.forEach(sentence => {
                        const span = document.createElement('span');
                        span.className = 'sentence fade-in';
                        span.textContent = sentence.trim();
                        if (sentence.trim()) blocks.push(span);
                    });
                } else if (node.classList && node.classList.contains('math-display')) {
                    // Preserve math blocks with special styling
                    const mathBlock = document.createElement('div');
                    mathBlock.className = 'math-display fade-in';
                    mathBlock.innerHTML = node.innerHTML;
                    blocks.push(mathBlock);
                } else {
                    // Preserve other HTML elements
                    const span = document.createElement('span');
                    span.className = 'sentence fade-in';
                    span.appendChild(node.cloneNode(true));
                    blocks.push(span);
                }
            });
            
            // Append all blocks to message div with proper spacing
            blocks.forEach((block, index) => {
                block.style.animationDelay = `${index * 0.3}s`;
                messageDiv.appendChild(block);
            });
            
            chatContainer.appendChild(messageDiv);
            
            // Wait for all animations to complete before resolving
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock) {
                lastBlock.addEventListener('animationend', () => {
                    // Force MathJax to reprocess the content
                    if (window.MathJax) {
                        window.MathJax.typesetPromise([messageDiv])
                            .then(() => {
                                chatContainer.scrollTop = chatContainer.scrollHeight;
                                resolve();
                            })
                            .catch((err) => {
                                console.error("MathJax error:", err);
                                resolve();
                            });
                    } else {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                        resolve();
                    }
                });
            } else {
                if (window.MathJax) {
                    window.MathJax.typesetPromise([messageDiv])
                        .then(() => {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                            resolve();
                        })
                        .catch((err) => {
                            console.error("MathJax error:", err);
                            resolve();
                        });
                } else {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    resolve();
                }
            }
        }
    });
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
async function submitUserInput() {
    const userInput = document.getElementById("user-input");
    const chatContainer = document.getElementById("chat-container");
    const userMessage = userInput.value.trim();

    if (userMessage) {
        // Display user message
        const userMessageDiv = document.createElement("div");
        userMessageDiv.className = "message user-message";
        userMessageDiv.textContent = userMessage;
        chatContainer.appendChild(userMessageDiv);

        userInput.value = "";

        try {
            // Show loading state (optional)
            const loadingDiv = document.createElement("div");
            loadingDiv.className = "message llm-message";
            loadingDiv.textContent = "Thinking...";
            chatContainer.appendChild(loadingDiv);

            const response = await fetch('/get_response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_message: userMessage })
            });
            
            const data = await response.json();
            
            // Remove loading message
            chatContainer.removeChild(loadingDiv);

            // Display the response
            if (data.type === 'diagram') {
                await displayLLMMessage(data.response, 'diagram', data.diagram);
            } else {
                await displayLLMMessage(data.response, 'text');
            }

            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (error) {
            console.error('Error:', error);
            // Display error message to user
            const errorDiv = document.createElement("div");
            errorDiv.className = "message llm-message error";
            errorDiv.textContent = "Sorry, I encountered an error. Please try again.";
            chatContainer.appendChild(errorDiv);
        }
    }
}

// Update the topic when the user selects one
function setCurrentTopic(topic) {
    currentTopic = topic;
    displayLLMMessage(`Let's dive into ${topic}.`);
}

// Start Knowledge Check: Blur the tutor section and start the quiz
function startKnowledgeCheck() {
    // Update score display immediately when starting a new quiz
    updateScoreDisplay();
    
    const tutorSection = document.getElementById("tutor-section");
    const quizSection = document.getElementById("quiz-section");
    
    // Blur the tutor section
    tutorSection.classList.add("blur");
    
    // Clear previous quiz content and add score display
    quizSection.innerHTML = `
        <div id="score-display">Score: ${correctAnswersCount}/${totalQuestionsCount}</div>
        <div class="quiz-container"></div>
    `;
    
    // Fetch the first question
    fetchQuizQuestion();
}


function fetchQuizQuestion() {
    // Get conversation history from chat container
    const chatContainer = document.getElementById("chat-container");
    const messages = Array.from(chatContainer.children).map(msg => msg.textContent);
    
    fetch('/generate_quiz_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            topic: currentTopic,
            conversation: messages
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            displayQuiz("Quiz unavailable at this time.");
        } else {
            displayQuiz(data.question, data.options, data.correctAnswer);
            updateScoreDisplay();
        }
    })
    .catch(error => console.error('Error fetching quiz question:', error));
}


function displayQuiz(question, options, correctAnswer) {
    const quizSection = document.getElementById("quiz-section");
    quizSection.innerHTML = "";  // Clear previous content

    // Create container for question and feedback
    const quizContainer = document.createElement("div");
    quizContainer.className = "quiz-container";

    // Display question
    const questionElement = document.createElement("p");
    questionElement.className = "quiz-question";
    questionElement.textContent = question;
    quizContainer.appendChild(questionElement);

    // Create options container
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "quiz-options";

    // Limit options to 5 and randomize them
    let limitedOptions = options;
    if (options.length > 5) {
        // Always include the correct answer and randomly select others
        const otherOptions = options.filter(opt => opt !== correctAnswer);
        const shuffledOthers = otherOptions.sort(() => Math.random() - 0.5).slice(0, 4);
        limitedOptions = [...shuffledOthers, correctAnswer].sort(() => Math.random() - 0.5);
    }

    // Display multiple-choice options
    limitedOptions.forEach(option => {
        const optionButton = document.createElement("button");
        optionButton.className = "quiz-option";
        optionButton.textContent = option;
        optionButton.onclick = () => handleAnswerSelection(optionButton, correctAnswer, optionsContainer);
        optionsContainer.appendChild(optionButton);
    });

    quizContainer.appendChild(optionsContainer);
    quizSection.appendChild(quizContainer);
}

// Function to sync quiz data with server
async function syncQuizData() {
    try {
        const quizHistory = JSON.parse(localStorage.getItem('quiz_history') || '[]');
        const correctAnswers = parseInt(localStorage.getItem('quiz_score_correct')) || 0;
        const totalQuestions = parseInt(localStorage.getItem('quiz_score_total')) || 0;

        await fetch('/sync_quiz_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correct_answers: correctAnswers,
                total_questions: totalQuestions,
                quiz_history: quizHistory
            })
        });
    } catch (error) {
        console.error('Error syncing quiz data:', error);
    }
}

// Handle answer selection
function handleAnswerSelection(selectedButton, correctAnswer, optionsContainer) {
    // Disable all buttons to prevent multiple selections
    const allButtons = optionsContainer.getElementsByClassName("quiz-option");
    Array.from(allButtons).forEach(button => {
        button.disabled = true;
        if (button.textContent === correctAnswer) {
            button.classList.add("correct-answer");
        }
    });

    const isCorrect = selectedButton.textContent === correctAnswer;

    if (isCorrect) {
        selectedButton.classList.add("correct-answer");
        correctAnswersCount++;
    } else {
        selectedButton.classList.add("incorrect-answer");
    }

    // Create feedback message
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackDiv.textContent = isCorrect ? 
        "Correct! Well done!" : 
        `Incorrect. The correct answer is: ${correctAnswer}`;
    
    // Add feedback after the options
    optionsContainer.parentNode.insertBefore(feedbackDiv, optionsContainer.nextSibling);

    // Increment total questions and update score
    totalQuestionsCount++;
    
    // Save scores to localStorage
    localStorage.setItem('quiz_score_correct', correctAnswersCount.toString());
    localStorage.setItem('quiz_score_total', totalQuestionsCount.toString());
    updateScoreDisplay();

    // Store quiz history in localStorage
    const quizHistory = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    quizHistory.push({
        question: document.querySelector('.quiz-question').textContent,
        correct_answer: correctAnswer,
        selected_answer: selectedButton.textContent,
        is_correct: isCorrect,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('quiz_history', JSON.stringify(quizHistory));

    // Sync with server
    syncQuizData();

    // Add a longer delay before fetching the next question
    setTimeout(() => {
        if (totalQuestionsCount % 3 === 0) {  // Changed condition to use modulo
            endQuizSession(); // End current quiz session but keep the score
        } else {
            fetchQuizQuestion(); // Fetch the next question
        }
    }, 2000);
}

// Function to end current quiz session but keep the score
function endQuizSession() {
    const tutorSection = document.getElementById("tutor-section");
    const quizSection = document.getElementById("quiz-section");

    // Unblur the tutor section
    tutorSection.classList.remove("blur");

    // Restore the original layout with buttons and add summary content div
    quizSection.innerHTML = `
        <div class="action-buttons">
            <button id="knowledge-check-button" onclick="startKnowledgeCheck()">Knowledge Check</button>
            <button id="summarize-button" onclick="generateSummary()">Summarize</button>
        </div>
        <div id="summary-content" class="summary-content"></div>`;

    // Sync with server before ending session
    syncQuizData();
}

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

    // Show loading state immediately
    factDisplay.textContent = "Loading facts...";

    fetch('/static/data/stem_facts.json')
        .then(response => response.json())
        .then(data => {
            if (data.facts && data.facts.length > 0) {
                // Create a continuous string of facts with more spacing
                const repeatedFacts = Array(3).fill(data.facts).flat();
                const factsString = repeatedFacts.join('                                                            ');
                factDisplay.textContent = factsString;
            } else if (factDisplay) {
                factDisplay.textContent = "No facts available.";
            }
        })
        .catch(error => {
            console.error('Error fetching facts:', error);
            if (factDisplay) {
                factDisplay.textContent = "Failed to load facts.";
            }
        });
}

// Move fact carousel initialization to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeFactCarousel();
});

// Consolidate onload functions - remove fact carousel from here
window.onload = function () {
    const display = document.getElementById('timer');
    if (display) {  // Only start timer if element exists
        const duration = 25 * 60;
        startTimer(duration, display);
    }
};

// Theme toggle functionality - only for pages with theme toggle
if (document.getElementById('theme-toggle-btn')) {
    document.addEventListener('DOMContentLoaded', () => {
        const themeToggle = document.getElementById('theme-toggle-btn');
        // Check for saved theme preference or default to 'light'
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);

        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });
}

// Only define theme-related functions if theme toggle exists
if (document.getElementById('theme-toggle-btn')) {
    function updateThemeIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle-btn');
        themeToggle.checked = theme === 'dark';
    }
}

async function generateSummary() {
    const chatContainer = document.getElementById("chat-container");
    const messages = Array.from(chatContainer.children)
        .filter(msg => !msg.textContent.includes("Thank you for sharing your syllabus!"))  // Exclude initial greeting
        .map(msg => msg.textContent);
    const summaryContent = document.getElementById("summary-content");
    
    // Check if there are any messages to summarize
    if (messages.length === 0) {
        summaryContent.style.display = 'block';
        summaryContent.innerHTML = `
            <div class="empty-summary-message">
                No conversation to summarize yet. Start a dialogue with the tutor first!
            </div>`;
        return;
    }
    
    try {
        // Show loading state
        summaryContent.style.display = 'block';
        summaryContent.innerHTML = 'Generating summary...';
        
        const response = await fetch('/generate_summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                conversation: messages,
                topic: currentTopic
            })
        });
        
        const data = await response.json();
        
        // Display the summary in the summary content area
        summaryContent.innerHTML = marked.parse(data.summary);
        
        // Render any LaTeX in the summary
        if (window.MathJax) {
            await window.MathJax.typesetPromise([summaryContent]);
        }
        
    } catch (error) {
        console.error('Error generating summary:', error);
        summaryContent.innerHTML = 'Error generating summary. Please try again.';
    }
}

// End the quiz and return to the tutor page
function endQuiz() {
    const tutorSection = document.getElementById("tutor-section");
    const quizSection = document.getElementById("quiz-section");

    // Unblur the tutor section
    tutorSection.classList.remove("blur");

    // Restore the original layout with both buttons
    quizSection.innerHTML = `
        <div class="action-buttons">
            <button id="knowledge-check-button" onclick="startKnowledgeCheck()">Knowledge Check</button>
            <button id="summarize-button" onclick="generateSummary()">Summarize</button>
        </div>`;

    // Reset question count and score
    correctAnswersCount = 0;
    totalQuestionsCount = 0;
    updateScoreDisplay();
}


