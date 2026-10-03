# LearnLens

AI-powered educational content analysis platform built for the hackathon.

LearnLens allows teachers to upload educational PDF documents, automatically extract their content, and use AI to analyze and structure the material into concepts, exercises, projects, homework, and other educational elements.

---

## Current Status

**Completed through Phase 5**

```text
PDF Upload
    ↓
PDF Text Extraction
    ↓
Document Storage
    ↓
AI Analysis with Gemini
    ↓
Structured Educational Content
```

The current version focuses on the teacher/document-processing side of the MVP.

Features such as student chat, RAG, quiz generation, personalized learning, and dashboards are planned for later phases.

---

# 1. Project Goal

LearnLens is designed to help transform traditional educational documents into structured, AI-readable learning material.

Instead of treating a PDF as a simple block of text, LearnLens analyzes its educational structure.

For example, a Python course PDF can be transformed into:

```text
Variables & Data Types
│
├── Concepts
│   ├── Variables
│   ├── Variable naming
│   ├── int
│   ├── float
│   ├── str
│   ├── bool
│   ├── type()
│   ├── input()
│   └── Type conversion
│
├── Exercises
│
├── Solutions
│
├── Mini Projects
│
└── Homework
```

This structured representation will later serve as the foundation for features such as AI tutoring, question answering, quizzes, and personalized learning.

---

# 2. Current Features

## PDF Upload

Teachers can upload educational PDF files.

The backend:

* receives the PDF
* validates the file
* checks the configured file-size limit
* stores the file
* creates a document record
* processes the PDF

The maximum PDF size is currently configurable through:

```env
MAX_PDF_MB=10
```

---

## PDF Text Extraction

After upload, LearnLens extracts text from the PDF.

The extracted content is stored with the document record.

The system preserves useful educational content such as:

* headings
* paragraphs
* explanations
* code examples
* exercises
* solutions
* projects
* homework
* tables converted into readable text

Example extracted content:

```text
What is a variable?

A named box that stores a piece of information for later.

name = "Sarah"
print(name)
```

The current parser is designed for practical MVP use rather than pixel-perfect reconstruction of the original PDF layout.

For example, tables may be flattened into text instead of being represented as HTML or structured table objects.

---

# 3. AI Provider

LearnLens currently uses **Google Gemini** for AI-powered document analysis.

The AI configuration is controlled through environment variables:

```env
AI_MODE=live
AI_PROVIDER=gemini
AI_API_KEY=YOUR_API_KEY
AI_MODEL=YOUR_MODEL
AI_TIMEOUT_SECONDS=45
```

API keys must never be committed to the repository.

The `.env` file should be included in `.gitignore`.

---

# 4. AI Document Analysis

The current AI phase converts extracted PDF text into structured educational information.

The analysis identifies information such as:

* document title
* subject
* summary
* concepts
* exercises
* solutions
* projects
* homework
* important terms

The AI is instructed to extract information from the source document without inventing unsupported content.

---

## Example

Input:

```text
Variables & Data Types

A variable is a name you choose to store a value in your program.

name = "Sarah"
print(name)

...

Exercise:
Create a variable university with your university's name and print it.
```

The AI can produce a structure conceptually similar to:

```json
{
  "title": "Variables & Data Types",
  "subject": "Python",
  "summary": "Introduction to Python variables and data types.",
  "concepts": [
    {
      "title": "Variables",
      "explanation": "A variable stores a value that can be reused in a program.",
      "examples": [
        "name = \"Sarah\""
      ]
    }
  ],
  "exercises": [
    {
      "title": "Variables and naming",
      "questions": [
        "Create a variable university with your university's name and print it."
      ]
    }
  ],
  "solutions": [],
  "projects": [],
  "homework": [],
  "important_terms": [
    "variable"
  ]
}
```

The exact output depends on the document being analyzed.

---

# 5. Document Analysis API

The document analysis functionality is exposed through an API endpoint similar to:

```http
POST /documents/{document_id}/analyze
```

### Process

The endpoint:

1. Receives the document ID.
2. Checks that the document exists.
3. Checks that extracted content is available.
4. Sends the extracted content to the configured AI provider.
5. Requests structured JSON output.
6. Validates the AI response.
7. Stores the analysis.
8. Returns the structured result.

---

# 6. Error Handling

The API handles common failure cases such as:

### Document not found

```http
404
```

Returned when the requested document does not exist.

### No extracted content

Returned when the document exists but does not contain usable extracted text.

### AI provider failure

Returned when the configured AI provider fails to process the request.

### Invalid AI response

Returned when the AI does not produce valid structured data matching the expected schema.

Server-side logs are used for debugging while sensitive information such as API keys is never exposed in API responses.

---

# 7. Environment Configuration

Create a local `.env` file:

```env
# AI
AI_MODE=live
AI_PROVIDER=gemini
AI_API_KEY=YOUR_GEMINI_API_KEY
AI_MODEL=YOUR_GEMINI_MODEL
AI_TIMEOUT_SECONDS=45

# Application
DATABASE_URL=sqlite:///./learnlens.db
UPLOAD_DIR=./uploads
MAX_PDF_MB=10
CORS_ORIGINS=*
```

Do not commit the `.env` file.

Recommended `.gitignore` entries:

```gitignore
.env
backend/.env

venv/
__pycache__/
*.pyc

learnlens.db

uploads/
```

---

# 8. Current Data Flow

The current backend pipeline is:

```text
                ┌──────────────┐
                │    Teacher   │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │  PDF Upload  │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ PDF Parsing  │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Extracted    │
                │ Text         │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Gemini AI    │
                │ Analysis     │
                └──────┬───────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Structured       │
              │ Educational Data │
              └──────────────────┘
```

---

# 9. Example Document Lifecycle

A typical document goes through the following states:

```text
Uploaded
   ↓
Processing
   ↓
Processed
   ↓
AI Analysis
   ↓
Analyzed
```

If processing fails, the document can contain an associated error message rather than silently appearing successful.

---

# 10. Example: Python Course PDF

A 25-page Python lesson about variables and data types was successfully processed during development.

The extracted content included:

* variables
* assignment and reassignment
* variable naming rules
* integers
* floats
* strings
* booleans
* `type()`
* `input()`
* type conversion
* `None`
* exercises
* exercise solutions
* mixed practice
* mini project
* homework

This demonstrates that the PDF extraction stage preserves the main educational content needed by the AI analysis stage.

---

# 11. Important Design Decisions

## AI does not replace PDF extraction

PDF extraction and AI analysis are separate stages.

```text
PDF
 ↓
Parser
 ↓
Text
 ↓
AI
 ↓
Educational structure
```

This separation makes the system easier to debug and allows the extraction system to be replaced or improved independently.

---

## AI output is structured

The AI is not asked to simply generate a long summary.

Instead, it produces structured information that can be consumed by the backend and frontend.

This makes future features easier to implement.

---

## Source-grounded extraction

The AI is instructed not to invent educational content.

If a section does not exist in the source document, the corresponding field should remain empty rather than being fabricated.

---

# 12. Security

Sensitive configuration must remain outside the source code.

Never commit:

```text
.env
API keys
database files
uploaded documents
```

API keys should only be accessed through environment variables.

If an API key is accidentally exposed, it should be revoked and replaced immediately.

---

# 13. Current Limitations

The current MVP intentionally has several limitations.

### PDF layout

The extracted text is not guaranteed to preserve the exact visual layout of the PDF.

For example, tables may become linear text.

### Complex PDFs

Scanned PDFs or image-only documents may require OCR and are not currently guaranteed to produce the same extraction quality as text-based PDFs.

### AI interpretation

AI analysis depends on the quality and structure of the extracted text.

Poor extraction can lead to incomplete or incorrect analysis.

### Large documents

Very large documents may require additional chunking or summarization strategies before being sent to the AI provider.

### Educational validation

The AI output is structured and source-grounded, but it is not currently independently verified by a teacher or another validation model.

---

# 14. Testing

A sample document used during development:

```text
Session_2_Variables_and_Data_Types.pdf
```

The document contains approximately 25 pages of Python educational material.

The test confirmed that:

* PDF upload works
* PDF text extraction works
* extracted text is stored
* Gemini API communication works
* AI document analysis works
* educational sections can be identified
* structured analysis can be returned

---

# 15. Roadmap

The current implementation ends at educational document analysis.

Planned future phases include:

```text
Phase 1
Project foundation
        ↓
Phase 2
PDF upload
        ↓
Phase 3
PDF text extraction
        ↓
Phase 4
AI provider integration
        ↓
Phase 5
Educational document analysis   ← CURRENT
        ↓
Phase 6
Knowledge retrieval / RAG
        ↓
Phase 7
AI student assistant
        ↓
Phase 8
Quiz & exercise generation
        ↓
Phase 9
Student progress / personalization
        ↓
Phase 10
Final MVP integration
```

Future phases may change as the hackathon requirements become clearer.

---

# 16. Project Philosophy

LearnLens is being developed as an MVP, so the priority is:

```text
Working
    >
Simple
    >
Understandable
    >
Extensible
```

The system should demonstrate a complete useful workflow rather than attempting to implement every possible AI feature.

The current milestone establishes the foundation:

> **Turn an educational PDF into structured knowledge that future LearnLens features can use.**

---

## Status

**Current milestone: Phase 5 — Educational Document Analysis**

Core pipeline:

**PDF → Extraction → Gemini Analysis → Structured Educational Data**

More functionality will be added in subsequent phases.
