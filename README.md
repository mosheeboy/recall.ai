# Recall.ai

An AI-powered study assistant that helps students better understand and retain course material.

## Features

- **Smart Learning**: AI-powered tutoring tailored to your syllabus
- **Time Management**: Built-in Pomodoro timer for focused study sessions
- **Progress Tracking**: Interactive quizzes to test understanding
- **Syllabus Integration**: Upload and analyze course syllabi
- **Dark Mode**: Comfortable viewing experience in any lighting condition

## Tech Stack

- **Backend**: Python/Flask
- **Frontend**: HTML, CSS, JavaScript
- **AI Integration**: OpenAI GPT-3.5
- **PDF Processing**: PyMuPDF
- **Math Rendering**: MathJax
- **Diagram Generation**: Mermaid.js

## Installation

1. Clone the repository:
    bash
    git clone https://github.com/yourusername/recall.git
    cd recall

2. Create and activate a virtual environment:   
    bash
    python3 -m venv venv
    source venv/bin/activate

3. Install dependencies:
    bash
    pip install -r requirements.txt

4. Set up OpenAI API key:
    bash
    export OPENAI_API_KEY='your_openai_api_key'

5. Run the application:
    bash
    python3 server.py


## Directory Structure

recall-ai/
├── server.py # Flask server and API routes
├── requirements.txt # Python dependencies
├── openai_secrets.py # API key configuration
├── static/
│ ├── css/
│ │ ├── main.css # Landing page styles
│ │ └── study.css # Study interface styles
│ ├── js/
│ │ └── script.js # Frontend functionality
│ └── data/
│ └── stem_facts.json # Facts for carousel
└── templates/
├── index.html # Landing page
└── study.html # Study interface