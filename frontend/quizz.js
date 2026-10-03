const state = {
    questions: [],
    currentIndex: 0,
    answers: [],
    toastTimer: null
};

// 1. Fetch data from backend when page loads
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // NOTE: Replace 'backend_endpoint/quiz_data.json' with your actual API endpoint
        const response = await fetch('backend_endpoint/quiz_data.json'); 
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        state.questions = await response.json();
        
        // Setup initial state
        state.answers = new Array(state.questions.length).fill(null);
        
        // Hide loading, show interface
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('quizInterface').classList.remove('hidden');
        
        renderQuestion();
        setupEventListeners();

    } catch (error) {
        console.error("Failed to load questions:", error);
        document.getElementById('loadingState').textContent = "Failed to load assessment. Please check your connection or backend.";
    }
});

function renderQuestion() {
    const question = state.questions[state.currentIndex];
    const total = state.questions.length;
    const progress = ((state.currentIndex + 1) / total) * 100;

    // Update Text Elements
    document.getElementById("questionCounter").textContent = `Question ${state.currentIndex + 1} of ${total}`;
    document.getElementById("questionNumber").textContent = `Question ${state.currentIndex + 1}`;
    document.getElementById("questionCategory").textContent = question.category;
    document.getElementById("questionText").textContent = question.question;
    document.getElementById("quizProgressFill").style.width = `${progress}%`;

    // Render Options
    const optionsList = document.getElementById("optionsList");
    optionsList.innerHTML = "";
    
    question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "option-button";
        
        if (state.answers[state.currentIndex] === index) {
            button.classList.add("selected");
        }

        const letter = document.createElement("span");
        letter.className = "option-letter";
        letter.textContent = String.fromCharCode(65 + index); // A, B, C, D...

        const text = document.createElement("span");
        text.textContent = option;

        button.appendChild(letter);
        button.appendChild(text);

        button.addEventListener("click", () => {
            state.answers[state.currentIndex] = index;
            renderQuestion(); // Re-render to show selected state
        });

        optionsList.appendChild(button);
    });

    // Handle Button Visibility/State
    const prevBtn = document.getElementById("previousQuestionBtn");
    const nextBtn = document.getElementById("nextQuestionBtn");
    const submitBtn = document.getElementById("submitQuizBtn");

    prevBtn.disabled = state.currentIndex === 0;
    
    const isLastQuestion = state.currentIndex === total - 1;
    nextBtn.classList.toggle("hidden", isLastQuestion);
    submitBtn.classList.toggle("hidden", !isLastQuestion);
}

function setupEventListeners() {
    document.getElementById("previousQuestionBtn").addEventListener("click", () => {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            renderQuestion();
        }
    });

    document.getElementById("nextQuestionBtn").addEventListener("click", () => {
        if (state.answers[state.currentIndex] === null) {
            showToast("Please select an answer before continuing.");
            return;
        }
        if (state.currentIndex < state.questions.length - 1) {
            state.currentIndex++;
            renderQuestion();
        }
    });

    document.getElementById("submitQuizBtn").addEventListener("click", submitAssessment);
    
    document.getElementById("quizBackBtn").addEventListener("click", () => {
        // Go back to the main dashboard
        window.location.href = "students_dashboard.html"; 
    });
}

function submitAssessment() {
    if (state.answers[state.currentIndex] === null) {
        showToast("Please select an answer before submitting.");
        return;
    }
    
    if (state.answers.includes(null)) {
        showToast("Please answer all questions before submitting.");
        return;
    }

    // Processing scores (Same logic you had in your dashboard)
    let totalCorrect = 0;
    const categories = {
        Recall: { correct: 0, total: 0 },
        Understanding: { correct: 0, total: 0 },
        Application: { correct: 0, total: 0 },
        Reasoning: { correct: 0, total: 0 }
    };

    state.questions.forEach((q, idx) => {
        if (categories[q.category]) categories[q.category].total++;
        if (state.answers[idx] === q.answer) {
            totalCorrect++;
            if (categories[q.category]) categories[q.category].correct++;
        }
    });

    const scoreFor = cat => categories[cat].total === 0 ? 0 : Math.round((categories[cat].correct / categories[cat].total) * 100);

    const results = {
        overall: Math.round((totalCorrect / state.questions.length) * 100),
        understanding: scoreFor("Understanding"),
        recall: scoreFor("Recall"),
        application: scoreFor("Application"),
        reasoning: scoreFor("Reasoning")
    };

    // Save results to localStorage so the main dashboard can read them
    localStorage.setItem("learnlens_quiz_results", JSON.stringify(results));
    
    // Redirect back to dashboard to view results
    window.location.href = "students_dashboard.html#results";
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    toastMessage.textContent = message;
    toast.classList.add("show");
    
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}