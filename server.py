from flask import Flask, render_template, request, jsonify, redirect, url_for
import openai
import json
import fitz
from openai import OpenAI
import openai_secrets
import os
from flask import session

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'temp_key')

# Initialize OpenAI client
client = OpenAI(api_key=openai_secrets.SECRET_KEY)

def extract_text_from_pdf(file):
    text = ""
    with fitz.open(stream=file.read(), filetype="pdf") as pdf_document:
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            text += page.get_text()
    return text

# Move preprocess_latex function to top level
def preprocess_latex(text):
    # Split text into LaTeX and non-LaTeX parts
    parts = []
    current_text = ""
    in_latex = False
    i = 0
    
    while i < len(text):
        if text[i:i+2] == '$$':  # Display math
            if current_text:
                parts.append(('text', current_text))
                current_text = ""
            i += 2
            latex = ""
            while i < len(text) and text[i:i+2] != '$$':
                latex += text[i]
                i += 1
            i += 2  # Skip closing $$
            parts.append(('display_math', latex))
        elif text[i] == '$':  # Inline math
            if current_text:
                parts.append(('text', current_text))
                current_text = ""
            i += 1
            latex = ""
            while i < len(text) and text[i] != '$':
                latex += text[i]
                i += 1
            i += 1  # Skip closing $
            parts.append(('inline_math', latex))
        else:
            current_text += text[i]
            i += 1
    
    if current_text:
        parts.append(('text', current_text))
    
    # Reconstruct text with processed LaTeX
    processed_text = ""
    for part_type, content in parts:
        if part_type == 'text':
            processed_text += content
        elif part_type == 'inline_math':
            processed_text += f'<span class="math-tex">${content}$</span>'
        elif part_type == 'display_math':
            processed_text += f'<div class="math-tex">$${content}$$</div>'
    
    return processed_text

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload_syllabus', methods=['POST'])
def upload_syllabus():
    if 'file' in request.files:
        file = request.files['file']
        
        # Check if the file is a PDF
        if file.filename.endswith('.pdf'):
            try:
                text = extract_text_from_pdf(file)
            except Exception as e:
                print(f"Error extracting text from PDF: {e}")
                return render_template('study.html', summary="Unable to read the PDF file. Please try again with a different file.")
        else:
            try:
                text = file.read().decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = file.read().decode('ISO-8859-1')
                except UnicodeDecodeError:
                    return render_template('study.html', summary="Unable to read the file. Please upload a text-based file.")
        
        # First, get the main topic from the syllabus
        topic_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Extract the main topic or course name from this syllabus. Return only the topic/course name."
                },
                {
                    "role": "user",
                    "content": f"What is the main topic or course name from this syllabus:\n\n{text}"
                }
            ],
            max_tokens=50
        )
        
        # Store the topic in session
        current_topic = topic_response.choices[0].message.content.strip()
        session['current_topic'] = current_topic
        
        # Generate a summary using OpenAI API with better error handling
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages = [
                    {
                        "role": "system",
                        "content": "You are a friendly and supportive tutor, helping a student understand their syllabus. Provide a warm, concise summary focusing only on the core topics and skills that will be covered. After summarizing, follow up with 'Which topic would you like to tackle first?'"
                    },
                    {
                        "role": "user",
                        "content": f"Read the following syllabus content and give a brief summary of just the main topics and skills the student will learn, without extra details. Keep it short, friendly, and focused on what the course will teach. Here’s the syllabus content: {text}"
                    }
                ],
                max_tokens=250
            )
            summary = response.choices[0].message.content.strip()
            
            # Store the summary as JSON to serve on the /file_summary route
            with open('static/file_summary.json', 'w') as f:
                json.dump({"summary": summary}, f)
            
            # Pass both summary and current_topic to the template
            return render_template('study.html', summary=summary, current_topic=current_topic)
        
        except Exception as e:
            print(f"OpenAI API Error: {e}")
            # Return a user-friendly error message
            return render_template('study.html', 
                                summary="Unable to process syllabus at this time. Please try again later.")
    
    return redirect(url_for('index'))


@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.get_json()
    user_message = data.get('user_message', '')
    
    print(f"Received message: {user_message}")  # Debug log
    
    # More specific diagram request detection
    is_diagram_request = any(phrase in user_message.lower() for phrase in [
        "create a diagram",
        "show me a diagram",
        "make a flowchart",
        "create a flowchart",
        "draw a graph",
        "create a graph",
        "show the relationship",
        "visualize this"
    ])

    try:
        # Handle diagram requests or proceed with normal response
        if is_diagram_request:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Generate a Mermaid.js diagram. Use this format:\n"
                            "1. First provide a brief explanation\n"
                            "2. Then provide the diagram code between '```mermaid' tags\n"
                            "Use appropriate diagram type:\n"
                            "- flowchart for processes\n"
                            "- graph for relationships\n"
                            "- sequenceDiagram for sequences\n"
                            "Keep diagrams clear and focused."
                        )
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                max_tokens=500
            )
            
            main_response = response.choices[0].message.content.strip()
            parts = main_response.split('```mermaid')
            if len(parts) > 1:
                explanation = parts[0].strip()
                diagram_code = parts[1].split('```')[0].strip()
                return jsonify({
                    "response": explanation,
                    "diagram": diagram_code,
                    "type": "diagram"
                })

        # Normal text response
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an experienced mathematics tutor. Format your responses following these rules:\n"
                        "1. Use proper LaTeX math mode with double dollar signs for display equations: $$\\text{equation}$$\n"
                        "2. Use single dollar signs for inline math: $x + y$\n"
                        "3. Always escape text commands in LaTeX: $\\text{maximize}$\n"
                        "4. Use **bold** for key terms\n"
                        "5. Keep responses focused and complete\n"
                        "6. Use bullet points for lists\n"
                        "7. Ensure all mathematical expressions are properly formatted and complete"
                    )
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            max_tokens=500,
            temperature=0.7
        )

        main_response = response.choices[0].message.content.strip()
        processed_response = preprocess_latex(main_response)
        
        return jsonify({
            "response": processed_response,
            "type": "text"
        })

    except Exception as e:
        print(f"Error generating response: {e}")
        return jsonify({
            "response": "I apologize, but I'm having difficulty with that request. Could you rephrase it?",
            "type": "text"
        })


@app.route('/generate_quiz_question', methods=['POST'])
def generate_quiz_question():
    data = request.get_json()
    topic = data.get('topic', 'Foundations of Optimization')
    conversation = data.get('conversation', [])  # Get conversation history from frontend
    
    # Create context from recent conversations
    context = "\n".join(conversation[-3:]) if conversation else topic  # Use last 3 messages or topic
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Create a multiple-choice question based on the recent conversation. Format: First line is question, followed by options prefixed with A) through E), and end with 'CORRECT:' followed by the letter of the correct answer."
                },
                {
                    "role": "user",
                    "content": f"Based on this context:\n{context}\n\nCreate a challenging multiple-choice question that tests understanding of the concepts discussed."
                }
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        quiz_content = response.choices[0].message.content.strip()
        lines = [line.strip() for line in quiz_content.split('\n') if line.strip()]
        
        # Extract question (first line)
        question = lines[0]
        
        # Extract options (skip any lines that don't start with a letter and parenthesis)
        options = []
        for line in lines[1:]:
            if line[0].upper() in 'ABCDE' and ')' in line:
                option = line.split(')', 1)[1].strip()
                options.append(option)
        
        # Extract correct answer (just the letter A-E)
        correct_line = next((line for line in lines if line.upper().startswith('CORRECT:')), None)
        if correct_line:
            correct_letter = correct_line.split(':')[1].strip()[0]  # Get just the letter
            correct_answer = options[ord(correct_letter.upper()) - ord('A')]
        else:
            raise ValueError("No correct answer found")

        print("Sending quiz response:", {
            "question": question,
            "options": options,
            "correctAnswer": correct_answer
        })
        
        return jsonify({
            "question": question,
            "options": options,
            "correctAnswer": correct_answer
        })

    except Exception as e:
        print(f"Error generating quiz question: {e}")
        return jsonify({
            "error": "Unable to generate a quiz question.",
            "question": "An error occurred. Please try again.",
            "options": ["Error occurred", "Please try again", "Contact support", "Refresh page", "Start over"],
            "correctAnswer": "Error occurred"
        })


@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    data = request.get_json()
    conversation = data.get('conversation', [])
    topic = data.get('topic', '')
    
    try:
        # Add debug logging
        print(f"Generating summary for topic: {topic}")
        print(f"Conversation length: {len(conversation)}")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a skilled tutor creating a concise summary. Format your response with:\n"
                        "• **Key Concepts Discussed:**\n"
                        "  - Use bullet points\n"
                        "  - Include mathematical concepts in LaTeX ($...$ for inline, $$...$$)\n\n"
                        "• **Main Takeaways:**\n"
                        "  - Summarize key learning points\n"
                        "  - Keep it clear and focused"
                    )
                },
                {
                    "role": "user",
                    "content": f"Create a summary of this conversation about {topic}. Here's the conversation:\n\n{' '.join(conversation[-10:])}"
                }
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content.strip()
        print(f"Generated summary before processing: {summary}")  # Debug log
        
        # Process LaTeX in summary
        processed_summary = preprocess_latex(summary)
        print(f"Processed summary: {processed_summary}")  # Debug log
        
        return jsonify({
            "summary": processed_summary
        })
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        return jsonify({
            "summary": "I apologize, but I'm having trouble generating a summary. Please try again."
        })


@app.route('/sync_quiz_data', methods=['POST'])
def sync_quiz_data():
    data = request.get_json()
    session['correct_answers'] = data.get('correct_answers', 0)
    session['total_questions'] = data.get('total_questions', 0)
    session['quiz_history'] = data.get('quiz_history', [])
    return jsonify({'status': 'success'})


@app.route('/progress')
def progress():
    current_topic = session.get('current_topic', 'No topic selected')
    score = f"{session.get('correct_answers', 0)}/{session.get('total_questions', 0)}"
    quiz_history = session.get('quiz_history', [])
    
    return render_template('progress.html', 
                         current_topic=current_topic,
                         score=score,
                         quiz_history=quiz_history)


@app.route('/study')
def study():
    current_topic = session.get('current_topic', 'No topic selected')
    return render_template('study.html', current_topic=current_topic)


if __name__ == '__main__':
    app.run(debug=True)
