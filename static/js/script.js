// Global variables
let isPaused = false;
let timerInterval;
let currentTopic = "Foundations of Optimization";
let correctAnswersCount = parseInt(localStorage.getItem('quiz_score_correct')) || 0;
let totalQuestionsCount = parseInt(localStorage.getItem('quiz_score_total')) || 0;
let isBreakTime = false;
let breakTimer;
const STUDY_DURATION = 25 * 60; // 25 minutes in seconds

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
    
    // Restore chat history if on study page
    if (document.getElementById("chat-container")) {
        restoreChatHistory();
    }
    
    const display = document.getElementById('timer');
    if (display) {
        display.textContent = "25:00"; // Set initial display to 25 minutes
        startTimer(STUDY_DURATION, display);
    }
});

// Display selected file name and show submit button
function showSubmit(input) {
    const buttonText = document.getElementById('button-text');
    const submitContainer = document.getElementById('submit-container');
    
    if (input.files.length > 0) {
        const file = input.files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes

        // Check file type
        if (!file.type.match('application/pdf')) {
            buttonText.textContent = "Please upload a PDF file";
            submitContainer.classList.add('hidden');
            input.value = ''; // Clear the input
            return;
        }

        // Check file size
        if (file.size > maxSize) {
            buttonText.textContent = "File must be smaller than 10MB";
            submitContainer.classList.add('hidden');
            input.value = ''; // Clear the input
            return;
        }

        buttonText.textContent = `${file.name}`;
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
    // Clear any existing interval
    if (timerInterval) clearInterval(timerInterval);
    
    let timer = STUDY_DURATION;
    
    // Initial display update
    updateStudyTimer(timer, display);
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timer--;
            updateStudyTimer(timer, display);
            
            if (timer < 0) {
                clearInterval(timerInterval);
                startBreak();
            }
        }
    }, 1000);
}

function startBreak() {
    isBreakTime = true;
    const breakOverlay = document.getElementById("break-overlay");
    const breakTimerDisplay = document.getElementById("break-timer");
    breakOverlay.style.display = "flex";
    
    // Start 5-minute break timer
    let breakTime = 5 * 60; // 5 minutes in seconds
    
    // Initial display update
    updateBreakTimer(breakTime, breakTimerDisplay);
    
    breakTimer = setInterval(() => {
        breakTime--;
        updateBreakTimer(breakTime, breakTimerDisplay);
        
        if (breakTime < 0) {
            clearInterval(breakTimer);
            endBreak();
        }
    }, 1000);
}

// Separate function to update break timer display
function updateBreakTimer(time, display) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function endBreak() {
    isBreakTime = false;
    const breakOverlay = document.getElementById("break-overlay");
    const confirmation = document.getElementById('break-confirmation');
    const display = document.getElementById('timer');
    
    // Hide overlays
    breakOverlay.style.display = "none";
    confirmation.style.display = "none";
    
    // Clear all intervals
    if (timerInterval) clearInterval(timerInterval);
    if (breakTimer) clearInterval(breakTimer);
    
    // Reset study timer to initial duration
    display.textContent = "25:00";
    
    // Start fresh timer
    startTimer(STUDY_DURATION, display);
}

// Separate function to update study timer display
function updateStudyTimer(time, display) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            // Configure marked.js options to preserve LaTeX delimiters
            marked.setOptions({
                gfm: true,
                breaks: true,
                smartLists: true,
                smartypants: true
            });

            // Protect LaTeX delimiters before markdown parsing
            text = text.replace(/\$\$(.*?)\$\$/g, (match) => {
                return `\n<div class="math-display">${match}</div>\n`;
            });
            
            text = text.replace(/\$(.*?)\$/g, (match) => {
                return match.replace(/[_*]/g, '\\$&');
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
                } else {
                    // Preserve HTML elements (including math and formatting)
                    const wrapper = document.createElement('div');
                    wrapper.className = 'sentence fade-in';
                    wrapper.appendChild(node.cloneNode(true));
                    blocks.push(wrapper);
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
            // Show loading state
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

            // Save chat history after each message
            saveChatHistory();

            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (error) {
            console.error('Error:', error);
            const errorDiv = document.createElement("div");
            errorDiv.className = "message llm-message error";
            errorDiv.textContent = "Sorry, I encountered an error. Please try again.";
            chatContainer.appendChild(errorDiv);
            saveChatHistory(); // Save even if there's an error
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
        display.textContent = "25:00"; // Set initial display to 25 minutes
        startTimer(STUDY_DURATION, display);
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

// Save chat history to localStorage
function saveChatHistory() {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
        const messages = Array.from(chatContainer.children).map(msg => ({
            text: msg.innerHTML,  // Save the full HTML content instead of just text
            isUser: msg.classList.contains('user-message')
        }));
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }
}

// Restore chat history from localStorage
function restoreChatHistory() {
    const chatContainer = document.getElementById("chat-container");
    if (!chatContainer) return;

    const savedHistory = localStorage.getItem('chat_history');
    if (savedHistory) {
        const messages = JSON.parse(savedHistory);
        chatContainer.innerHTML = ''; // Clear default greeting
        
        messages.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.className = `message ${msg.isUser ? 'user-message' : 'llm-message'}`;
            messageDiv.innerHTML = msg.text;  // Restore the full HTML content
            chatContainer.appendChild(messageDiv);
        });

        // Reprocess LaTeX after restoring messages
        if (window.MathJax) {
            window.MathJax.typesetPromise([chatContainer])
                .catch(err => console.error("MathJax error:", err));
        }
    }
}

// Handle skip break confirmation
document.addEventListener('DOMContentLoaded', function() {
    const confirmSkip = document.getElementById('confirm-skip');
    const cancelSkip = document.getElementById('cancel-skip');
    const breakConfirmation = document.getElementById('break-confirmation');
    const breakMessage = document.querySelector('.break-message');
    
    if (confirmSkip) {
        confirmSkip.addEventListener('click', function() {
            if (breakTimer) clearInterval(breakTimer);
            endBreak();
        });
    }
    
    if (cancelSkip) {
        cancelSkip.addEventListener('click', function() {
            breakConfirmation.style.display = 'none';
        });
    }

    if (breakMessage) {
        breakMessage.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up
            breakConfirmation.style.display = 'block';
        });
    }
});


