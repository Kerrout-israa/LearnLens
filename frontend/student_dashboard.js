const DEMO_PROFILE = {
overall: 63,
understanding: 82,
recall: 78,
application: 34,
reasoning: 51
};

const quizQuestions = [
{
category: "Recall",
question: "What is the main purpose of normalization in a relational database?",
options: [
"To reduce redundancy and improve data organization",
"To make every table contain more columns",
"To remove all relationships between tables",
"To increase the amount of duplicated data"
],
answer: 0
},
{
category: "Recall",
question: "Which normal form removes partial dependencies?",
options: [
"First Normal Form",
"Second Normal Form",
"Third Normal Form",
"Fourth Normal Form"
],
answer: 1
},
{
category: "Understanding",
question: "What does First Normal Form mainly require?",
options: [
"Every attribute contains atomic values",
"Every table must have two primary keys",
"Every relationship must be removed",
"Every table must contain exactly three columns"
],
answer: 0
},
{
category: "Understanding",
question: "Why can transitive dependencies cause problems in a relational table?",
options: [
"They can create unnecessary duplication and update anomalies",
"They always make queries impossible",
"They prevent primary keys from existing",
"They automatically remove foreign keys"
],
answer: 0
},
{
category: "Application",
question: "A table contains OrderID, ProductID, ProductName and Quantity. OrderID + ProductID is the composite key, while ProductID determines ProductName. What should be done?",
options: [
"Move ProductName into a separate Product table",
"Duplicate ProductName for every order",
"Remove ProductID from the database",
"Make Quantity the primary key"
],
answer: 0
},
{
category: "Application",
question: "A Customer table contains CustomerID, CustomerName, OrderID and OrderDate. A customer can have many orders. What design better applies normalization?",
options: [
"Keep every order in the Customer table",
"Create separate Customer and Order tables linked by CustomerID",
"Remove CustomerID from the database",
"Store all orders in one text field"
],
answer: 1
},
{
category: "Reasoning",
question: "Why is separating Customer information from Order information useful?",
options: [
"It reduces repeated customer information and makes updates more consistent",
"It guarantees that no SQL queries are needed",
"It prevents customers from having multiple orders",
"It removes the need for relationships"
],
answer: 0
},
{
category: "Reasoning",
question: "Which design best represents a normalized structure for employees and departments?",
options: [
"One table repeating department information for every employee",
"Employee and Department tables connected through DepartmentID",
"One text field containing every employee and department",
"Separate tables with no relationship between them"
],
answer: 1
}
];

const remediationQuestions = [
{
question: "A table contains StudentID, StudentName, CourseID and CourseName. StudentID + CourseID form the composite key. CourseID determines CourseName. What problem exists?",
options: [
"A partial dependency exists",
"There is no primary key",
"The table violates only First Normal Form",
"There is no dependency"
],
answer: 0
},
{
question: "A Product table stores ProductID, ProductName and ProductCategoryName. ProductCategoryID determines ProductCategoryName. What is a suitable design?",
options: [
"Keep all category information duplicated in every product",
"Separate product category information into its own table",
"Remove ProductID",
"Store category names inside ProductID"
],
answer: 1
},
{
question: "You discover that CustomerName is repeated in many Order records. What should you consider first?",
options: [
"Separating customer data into a Customer table",
"Duplicating CustomerName more frequently",
"Removing the OrderID",
"Combining all customers into one text field"
],
answer: 0
}
];

const state = {
currentView: "join",
quizIndex: 0,
quizAnswers: [],
quizSubmitted: false,
quizResults: null,
remediationIndex: 0,
remediationAnswers: [],
remediationResults: null,
toastTimer: null
};

const views = {
join: document.getElementById("joinView"),
dashboard: document.getElementById("dashboardView"),
quiz: document.getElementById("quizView"),
results: document.getElementById("resultsView"),
remediation: document.getElementById("remediationView"),
teacherAnalytics: document.getElementById("teacherAnalyticsView")
};

const roleBadge = document.getElementById("roleBadge");

function getStoredStudent() {
try {
return JSON.parse(
localStorage.getItem("learnlens_student")
) || null;
} catch {
return null;
}
}

function saveStudent(student) {
localStorage.setItem(
"learnlens_student",
JSON.stringify(student)
);
}

function getProfile() {
if (state.quizSubmitted && state.quizResults) {
return state.quizResults;
}

```
return DEMO_PROFILE;
```

}

function showToast(message) {
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

```
if (!toast || !toastMessage) {
    return;
}

toastMessage.textContent = message;

toast.classList.add("show");

clearTimeout(state.toastTimer);

state.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
}, 2600);
```

}

function goToView(view, updateHash = true) {
if (!views[view]) {
view = "join";
}

```
Object.values(views).forEach(element => {
    if (element) {
        element.classList.add("hidden");
    }
});

views[view].classList.remove("hidden");

state.currentView = view;

if (roleBadge) {
    roleBadge.textContent =
        view === "teacherAnalytics"
            ? "Teacher"
            : "Student";
}

if (updateHash) {
    history.replaceState(
        null,
        "",
        `#${view}`
    );
}

if (view === "dashboard") {
    renderDashboard();
}

if (view === "quiz") {
    renderQuizQuestion();
}

if (view === "results") {
    renderResults();
}

if (view === "remediation") {
    renderRemediationQuestion();
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
```

}

function initializeJoinForm() {
const form = document.getElementById("joinForm");

```
if (!form) {
    return;
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const nameInput = document.getElementById("studentName");
    const codeInput = document.getElementById("classCode");

    const name = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();

    if (!name) {
        showToast("Please enter your name.");
        nameInput.focus();
        return;
    }

    if (!code) {
        showToast("Please enter your classroom code.");
        codeInput.focus();
        return;
    }

    saveStudent({
        name,
        classCode: code
    });

    showToast(`Welcome, ${name}.`);

    goToView("dashboard");
});
```

}

function renderDashboard() {
const student = getStoredStudent();
const profile = getProfile();

```
const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage && student) {
    welcomeMessage.textContent =
        `Welcome back, ${student.name}. Continue learning and explore your latest activities.`;
}

updateText(
    "dashboardOverallScore",
    `${profile.overall}%`
);

updateText(
    "dashboardUnderstanding",
    `${profile.understanding}%`
);

updateText(
    "dashboardRecall",
    `${profile.recall}%`
);

updateText(
    "dashboardApplication",
    `${profile.application}%`
);

updateText(
    "dashboardReasoning",
    `${profile.reasoning}%`
);

updateWidth(
    "dashboardUnderstandingBar",
    profile.understanding
);

updateWidth(
    "dashboardRecallBar",
    profile.recall
);

updateWidth(
    "dashboardApplicationBar",
    profile.application
);

updateWidth(
    "dashboardReasoningBar",
    profile.reasoning
);
```

}

function updateText(id, value) {
const element = document.getElementById(id);

```
if (element) {
    element.textContent = value;
}
```

}

function updateWidth(id, value) {
const element = document.getElementById(id);

```
if (element) {
    element.style.width =
        `${Math.max(0, Math.min(100, value))}%`;
}
```

}

function startQuiz() {
state.quizIndex = 0;

```
state.quizAnswers =
    new Array(quizQuestions.length).fill(null);

state.quizSubmitted = false;
state.quizResults = null;

goToView("quiz");
```

}

function renderQuizQuestion() {
const question =
quizQuestions[state.quizIndex];

```
if (!question) {
    return;
}

const questionNumber =
    state.quizIndex + 1;

const totalQuestions =
    quizQuestions.length;

const progress =
    (questionNumber / totalQuestions) * 100;

updateText(
    "questionCounter",
    `Question ${questionNumber} of ${totalQuestions}`
);

updateText(
    "questionNumber",
    `Question ${questionNumber}`
);

updateText(
    "questionCategory",
    question.category
);

updateText(
    "questionText",
    question.question
);

updateWidth(
    "quizProgressFill",
    progress
);

const optionsList =
    document.getElementById("optionsList");

if (!optionsList) {
    return;
}

optionsList.innerHTML = "";

question.options.forEach((option, index) => {

    const button =
        document.createElement("button");

    button.type = "button";
    button.className = "option-button";

    if (
        state.quizAnswers[state.quizIndex] === index
    ) {
        button.classList.add("selected");
    }

    const letter =
        document.createElement("span");

    letter.className = "option-letter";
    letter.textContent =
        String.fromCharCode(65 + index);

    const text =
        document.createElement("span");

    text.textContent = option;

    button.appendChild(letter);
    button.appendChild(text);

    button.addEventListener("click", () => {
        state.quizAnswers[state.quizIndex] =
            index;

        renderQuizQuestion();
    });

    optionsList.appendChild(button);
});

const previousButton =
    document.getElementById(
        "previousQuestionBtn"
    );

const nextButton =
    document.getElementById(
        "nextQuestionBtn"
    );

const submitButton =
    document.getElementById(
        "submitQuizBtn"
    );

if (previousButton) {
    previousButton.disabled =
        state.quizIndex === 0;
}

const lastQuestion =
    state.quizIndex ===
    quizQuestions.length - 1;

if (nextButton) {
    nextButton.classList.toggle(
        "hidden",
        lastQuestion
    );
}

if (submitButton) {
    submitButton.classList.toggle(
        "hidden",
        !lastQuestion
    );
}
```

}

function goToPreviousQuestion() {
if (state.quizIndex > 0) {
state.quizIndex -= 1;
renderQuizQuestion();
}
}

function goToNextQuestion() {
if (
state.quizAnswers[state.quizIndex] === null
) {
showToast(
"Select an answer before continuing."
);

```
    return;
}

if (
    state.quizIndex <
    quizQuestions.length - 1
) {
    state.quizIndex += 1;
    renderQuizQuestion();
}
```

}

function submitQuiz() {
if (
state.quizAnswers[state.quizIndex] === null
) {
showToast(
"Select an answer before submitting."
);

```
    return;
}

const unanswered =
    state.quizAnswers.some(
        answer => answer === null
    );

if (unanswered) {
    showToast(
        "Please answer all questions before submitting."
    );

    return;
}

const categories = {
    Recall: {
        correct: 0,
        total: 0
    },
    Understanding: {
        correct: 0,
        total: 0
    },
    Application: {
        correct: 0,
        total: 0
    },
    Reasoning: {
        correct: 0,
        total: 0
    }
};

let totalCorrect = 0;

quizQuestions.forEach(
    (question, index) => {

        const category =
            categories[question.category];

        category.total += 1;

        if (
            state.quizAnswers[index] ===
            question.answer
        ) {
            category.correct += 1;
            totalCorrect += 1;
        }
    }
);

const scoreFor = category => {

    const item =
        categories[category];

    return item.total === 0
        ? 0
        : Math.round(
            (item.correct / item.total) * 100
        );
};

state.quizResults = {
    overall:
        Math.round(
            (totalCorrect /
                quizQuestions.length) *
                100
        ),

    understanding:
        scoreFor("Understanding"),

    recall:
        scoreFor("Recall"),

    application:
        scoreFor("Application"),

    reasoning:
        scoreFor("Reasoning")
};

state.quizSubmitted = true;

localStorage.setItem(
    "learnlens_quiz_results",
    JSON.stringify(state.quizResults)
);

showToast("Assessment submitted.");

goToView("results");
```

}

function loadSavedQuizResults() {
try {
const saved =
JSON.parse(
localStorage.getItem(
"learnlens_quiz_results"
)
);

```
    if (saved) {
        state.quizResults = saved;
        state.quizSubmitted = true;
    }
} catch {
    state.quizResults = null;
    state.quizSubmitted = false;
}
```

}

function renderResults() {
const profile = getProfile();

```
updateText(
    "overallScore",
    `${profile.overall}%`
);

updateText(
    "understandingScore",
    `${profile.understanding}%`
);

updateText(
    "recallScore",
    `${profile.recall}%`
);

updateText(
    "applicationScore",
    `${profile.application}%`
);

updateText(
    "reasoningScore",
    `${profile.reasoning}%`
);

updateWidth(
    "understandingBar",
    profile.understanding
);

updateWidth(
    "recallBar",
    profile.recall
);

updateWidth(
    "applicationBar",
    profile.application
);

updateWidth(
    "reasoningBar",
    profile.reasoning
);

const categories = [
    {
        name: "Application",
        score: profile.application
    },
    {
        name: "Reasoning",
        score: profile.reasoning
    },
    {
        name: "Recall",
        score: profile.recall
    },
    {
        name: "Understanding",
        score: profile.understanding
    }
];

categories.sort(
    (a, b) => a.score - b.score
);

const weakest = categories[0];

updateText(
    "mainAreaTitle",
    weakest.name
);

const descriptions = {
    Application:
        "Your application result indicates an opportunity for additional targeted practice.",

    Reasoning:
        "Additional practice connecting concepts across unfamiliar situations may be useful.",

    Recall:
        "Additional practice recalling key concepts and terminology may be useful.",

    Understanding:
        "Additional practice explaining how and why concepts work may be useful."
};

updateText(
    "mainAreaDescription",
    descriptions[weakest.name]
);
```

}

function startRemediation() {
state.remediationIndex = 0;

```
state.remediationAnswers =
    new Array(
        remediationQuestions.length
    ).fill(null);

state.remediationResults = null;

const exercise =
    document.getElementById(
        "remediationExercise"
    );

const completion =
    document.getElementById(
        "remediationCompletion"
    );

if (exercise) {
    exercise.classList.remove("hidden");
}

if (completion) {
    completion.classList.add("hidden");
}

goToView("remediation");
```

}

function renderRemediationQuestion() {
const question =
remediationQuestions[
state.remediationIndex
];

```
if (!question) {
    return;
}

const current =
    state.remediationIndex + 1;

const total =
    remediationQuestions.length;

const progress =
    (current / total) * 100;

updateText(
    "remediationQuestionCounter",
    `Practice question ${current} of ${total}`
);

updateWidth(
    "remediationProgressFill",
    progress
);

updateText(
    "remediationQuestionText",
    question.question
);

const optionsList =
    document.getElementById(
        "remediationOptionsList"
    );

if (!optionsList) {
    return;
}

optionsList.innerHTML = "";

question.options.forEach(
    (option, index) => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "option-button";

        if (
            state.remediationAnswers[
                state.remediationIndex
            ] === index
        ) {
            button.classList.add("selected");
        }

        const letter =
            document.createElement("span");

        letter.className =
            "option-letter";

        letter.textContent =
            String.fromCharCode(65 + index);

        const text =
            document.createElement("span");

        text.textContent = option;

        button.appendChild(letter);
        button.appendChild(text);

        button.addEventListener(
            "click",
            () => {

                state.remediationAnswers[
                    state.remediationIndex
                ] = index;

                renderRemediationQuestion();
            }
        );

        optionsList.appendChild(button);
    }
);

const previousButton =
    document.getElementById(
        "previousRemediationBtn"
    );

const nextButton =
    document.getElementById(
        "nextRemediationBtn"
    );

const submitButton =
    document.getElementById(
        "submitRemediationBtn"
    );

if (previousButton) {
    previousButton.disabled =
        state.remediationIndex === 0;
}

const lastQuestion =
    state.remediationIndex ===
    remediationQuestions.length - 1;

if (nextButton) {
    nextButton.classList.toggle(
        "hidden",
        lastQuestion
    );
}

if (submitButton) {
    submitButton.classList.toggle(
        "hidden",
        !lastQuestion
    );
}
```

}

function previousRemediationQuestion() {
if (state.remediationIndex > 0) {
state.remediationIndex -= 1;
renderRemediationQuestion();
}
}

function nextRemediationQuestion() {
if (
state.remediationAnswers[
state.remediationIndex
] === null
) {
showToast(
"Select an answer before continuing."
);

```
    return;
}

if (
    state.remediationIndex <
    remediationQuestions.length - 1
) {
    state.remediationIndex += 1;
    renderRemediationQuestion();
}
```

}

function submitRemediation() {
if (
state.remediationAnswers[
state.remediationIndex
] === null
) {
showToast(
"Select an answer before finishing."
);

```
    return;
}

const unanswered =
    state.remediationAnswers.some(
        answer => answer === null
    );

if (unanswered) {
    showToast(
        "Please answer all practice questions."
    );

    return;
}

let correctAnswers = 0;

remediationQuestions.forEach(
    (question, index) => {

        if (
            state.remediationAnswers[index] ===
            question.answer
        ) {
            correctAnswers += 1;
        }
    }
);

const remediationScore =
    Math.round(
        (correctAnswers /
            remediationQuestions.length) *
            100
    );

const profile = getProfile();

const baselineApplication =
    profile.application;

const improvementPoints =
    remediationScore -
    baselineApplication;

state.remediationResults = {
    baseline: baselineApplication,
    result: remediationScore,
    correct: correctAnswers,
    total: remediationQuestions.length,
    improvementPoints
};

localStorage.setItem(
    "learnlens_remediation_results",
    JSON.stringify(
        state.remediationResults
    )
);

showRemediationCompletion();
```

}

function showRemediationCompletion() {
const result =
state.remediationResults;

```
const exercise =
    document.getElementById(
        "remediationExercise"
    );

const completion =
    document.getElementById(
        "remediationCompletion"
    );

if (exercise) {
    exercise.classList.add("hidden");
}

if (completion) {
    completion.classList.remove("hidden");
}

updateText(
    "beforeApplicationScore",
    `${result.baseline}%`
);

updateText(
    "afterApplicationScore",
    `${result.result}%`
);

const sign =
    result.improvementPoints >= 0
        ? "+"
        : "";

updateText(
    "improvementPoints",
    `${sign}${result.improvementPoints} percentage points`
);

updateText(
    "remediationAccuracy",
    `${result.correct} of ${result.total} targeted questions answered correctly.`
);
```

}

function loadSavedRemediationResults() {
try {
const saved =
JSON.parse(
localStorage.getItem(
"learnlens_remediation_results"
)
);

```
    if (saved) {
        state.remediationResults =
            saved;
    }
} catch {
    state.remediationResults = null;
}
```

}

function changeClassroom() {
localStorage.removeItem(
"learnlens_student"
);

```
const nameInput =
    document.getElementById(
        "studentName"
    );

const codeInput =
    document.getElementById(
        "classCode"
    );

if (nameInput) {
    nameInput.value = "";
}

if (codeInput) {
    codeInput.value = "";
}

goToView("join");

showToast(
    "Enter the new classroom details."
);
```

}

function initializeButtons() {

```
document
    .getElementById("brandButton")
    ?.addEventListener(
        "click",
        () => goToView("dashboard")
    );

document
    .getElementById("classInsightsBtn")
    ?.addEventListener(
        "click",
        () => goToView("teacherAnalytics")
    );

document
    .getElementById("startAssessmentBtn")
    ?.addEventListener(
        "click",
        () => {
            window.location.href = "quizz.html";
        }
    );

document
    .getElementById("viewProfileBtn")
    ?.addEventListener(
        "click",
        () => goToView("results")
    );

document
    .getElementById("practiceFromDashboardBtn")
    ?.addEventListener(
        "click",
        startRemediation
    );

document
    .getElementById("startPersonalizedPracticeBtn")
    ?.addEventListener(
        "click",
        startRemediation
    );

document
    .getElementById("quizBackBtn")
    ?.addEventListener(
        "click",
        () => goToView("dashboard")
    );

document
    .getElementById("previousQuestionBtn")
    ?.addEventListener(
        "click",
        goToPreviousQuestion
    );

document
    .getElementById("nextQuestionBtn")
    ?.addEventListener(
        "click",
        goToNextQuestion
    );

document
    .getElementById("submitQuizBtn")
    ?.addEventListener(
        "click",
        submitQuiz
    );

document
    .getElementById("resultsBackBtn")
    ?.addEventListener(
        "click",
        () => goToView("dashboard")
    );

document
    .getElementById("remediationBackBtn")
    ?.addEventListener(
        "click",
        () => goToView("results")
    );

document
    .getElementById("previousRemediationBtn")
    ?.addEventListener(
        "click",
        previousRemediationQuestion
    );

document
    .getElementById("nextRemediationBtn")
    ?.addEventListener(
        "click",
        nextRemediationQuestion
    );

document
    .getElementById("submitRemediationBtn")
    ?.addEventListener(
        "click",
        submitRemediation
    );

document
    .getElementById("completionProfileBtn")
    ?.addEventListener(
        "click",
        () => goToView("results")
    );

document
    .getElementById("retryRemediationBtn")
    ?.addEventListener(
        "click",
        startRemediation
    );

document
    .getElementById("changeClassroomBtn")
    ?.addEventListener(
        "click",
        changeClassroom
    );

document
    .getElementById("analyticsBackBtn")
    ?.addEventListener(
        "click",
        () => goToView("dashboard")
    );
```

}

function initializeFromHash() {
const hash =
window.location.hash.replace("#", "");

```
const student =
    getStoredStudent();

if (hash && views[hash]) {
    goToView(hash, false);
    return;
}

if (student) {
    goToView("dashboard", false);
} else {
    goToView("join", false);
}
```

}

window.addEventListener(
"hashchange",
() => {

```
    const hash =
        window.location.hash.replace("#", "");

    if (views[hash]) {
        goToView(hash, false);
    }
}
```

);

document.addEventListener(
"DOMContentLoaded",
() => {

```
    initializeJoinForm();

    initializeButtons();

    loadSavedQuizResults();

    loadSavedRemediationResults();

    initializeFromHash();
}
```

);
