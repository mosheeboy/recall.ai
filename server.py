from flask import Flask, render_template, request, jsonify, redirect, url_for
import openai
import json
import pymupdf as fitz
from openai import OpenAI
import openai_secrets
import os

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
            
            return render_template('study.html', summary=summary)
        
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return render_template('study.html', summary="Unable to generate a summary. Please try again.")
    
    return redirect(url_for('index'))



@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.get_json()
    user_message = data.get('user_message', '')

    try:
        # Main response: Summary with bullet-pointed details
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an experienced tutor. Provide a clear and concise explanation of the topic followed by important details."
                        " Start with a single summary line, then list key points in bullet form without introductory phrases."
                        " Do not use headings or phrases like 'Understanding...' or 'Summary of...'."
                        " Format the response as:\n\n"
                        "[Summary Line]\n\n- Bullet Point 1\n- Bullet Point 2\n- Bullet Point 3"
                    )
                },
                {
                    "role": "user",
                    "content": f"Explain the topic '{user_message}' with a summary followed by bullet-pointed details."
                }
            ],
            max_tokens=150
        )
        main_response = response.choices[0].message.content.strip()

        # Example response: Summary with bullet-pointed details for an example
        example_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a knowledgeable tutor. Provide a practical example that illustrates the concept in a straightforward, real-world scenario."
                        " Begin with a single line summarizing the scenario, followed by bullet points explaining the example."
                        " Avoid phrases like 'Example of...' or 'Understanding...'. Use clear, direct language."
                        " Format the response as follows:\n\n"
                        "[Scenario Summary Line]\n\n- Bullet Point 1\n- Bullet Point 2\n- Bullet Point 3"
                    )
                },
                {
                    "role": "user",
                    "content": f"Provide a practical example of '{user_message}' relevant to the student's understanding, with a summary line and detailed points in bullet format."
                }
            ],
            max_tokens=150  # Adjusted for the format
        )
        example_text = example_response.choices[0].message.content.strip()

        return jsonify({"response": main_response, "example": example_text})

    except Exception as e:
        print(f"Error generating LLM response: {e}")
        return jsonify({"response": "I'm having trouble answering that. Please try again later.", "example": ""})


@app.route('/generate_quiz_question', methods=['POST'])
def generate_quiz_question():
    data = request.get_json()
    topic = data.get('topic', 'Foundations of Optimization')

    try:
        # Call OpenAI API to generate quiz question
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful tutor creating a quiz question."},
                {"role": "user", "content": f"Create a challenging multiple-choice question about {topic}. Provide five answer choices labeled A through E, with only one correct answer. Clearly mark the correct answer."}
            ],
            max_tokens=150
        )

        # Access the message content from the response object
        quiz_content = response.choices[0].message.content.strip()

        lines = quiz_content.split('\n')
        
        # Extract the question, removing "Question:" if present
        question = lines[0].replace("Question:", "").strip()

        # Extract options
        options = [line.strip() for line in lines[1:] if line.strip() and not line.lower().startswith("correct answer")]

        # Extract the correct answer
        correct_answer_line = next((line for line in lines if line.lower().startswith("correct answer")), None)
        correct_option = correct_answer_line.split(":", 1)[1].strip() if correct_answer_line else None

        # Verify that we have all parts of the quiz question
        if not question or not options or not correct_option:
            print("Error: Missing question, options, or correct answer in API response.")
            return jsonify({"error": "Unable to generate a quiz question with a correct answer."})

        # Return the parsed question data
        return jsonify({
            "question": question,
            "options": options,
            "correctAnswer": correct_option
        })

    except Exception as e:
        print(f"Error generating quiz question: {e}")
        return jsonify({"error": "Unable to generate a quiz question."})


# Helper function to parse the quiz response from LLM
def parse_llm_quiz_response(llm_response):
    lines = llm_response.split("\n")
    question = lines[0].replace(" ")
    options = [line.split(") ")[1] for line in lines[1:6]]
    correct_answer = lines[-1].split(": ")[1]
    return question, options, correct_answer


if __name__ == '__main__':
    app.run(debug=True)
