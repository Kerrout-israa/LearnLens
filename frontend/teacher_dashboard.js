const STORAGE_KEY = "learnlens_classrooms";

const state = {
    classrooms: [],
    selectedClassroom: null,
    joinCode: ""
};

const mockClassrooms = [
    {
        id: "class-001",
        name: "Database Systems",
        subject: "Computer Science",
        level: "Undergraduate",
        joinCode: "DB-7K42",
        studentCount: 24,
        activeAssessments: 1,
        materialCount: 0
    },
    {
        id: "class-002",
        name: "Machine Learning",
        subject: "Artificial Intelligence",
        level: "Undergraduate",
        joinCode: "ML-4P81",
        studentCount: 18,
        activeAssessments: 2,
        materialCount: 0
    },
    {
        id: "class-003",
        name: "Web Development",
        subject: "Software Engineering",
        level: "Undergraduate",
        joinCode: "WD-9M25",
        studentCount: 31,
        activeAssessments: 3,
        materialCount: 0
    }
];

const dashboardView = document.getElementById("dashboardView");
const classroomView = document.getElementById("classroomView");
const teacherAnalyticsView = document.getElementById(
    "teacherAnalyticsView"
);

const classroomGrid = document.getElementById("classroomGrid");
const classroomTotal = document.getElementById("classroomTotal");
const studentTotal = document.getElementById("studentTotal");
const assessmentTotal = document.getElementById("assessmentTotal");

const classroomModal = document.getElementById("classroomModal");
const createClassroomForm = document.getElementById(
    "createClassroomForm"
);

const classroomName = document.getElementById("classroomName");
const classroomSubjectInput = document.getElementById(
    "newClassroomSubject"
);
const classroomLevel = document.getElementById("classroomLevel");
const joinCode = document.getElementById("joinCode");

const formError = document.getElementById("formError");
const createClassroomButton = document.getElementById(
    "createClassroomButton"
);

const materialFile = document.getElementById("materialFile");
const materialEmptyState = document.getElementById(
    "materialEmptyState"
);
const processingCard = document.getElementById("processingCard");
const analysisResult = document.getElementById("analysisResult");

const processingTitle = document.getElementById("processingTitle");
const processingPercent = document.getElementById(
    "processingPercent"
);
const progressBar = document.getElementById("progressBar");

const assessmentEmpty = document.getElementById("assessmentEmpty");
const assessmentPreview = document.getElementById(
    "assessmentPreview"
);

const classroomTitle = document.getElementById("classroomTitle");
const classroomSubject = document.getElementById(
    "classroomSubject"
);
const classCode = document.getElementById("classCode");
const classroomStudentCount = document.getElementById(
    "classroomStudentCount"
);
const classroomAssessmentCount = document.getElementById(
    "classroomAssessmentCount"
);
const classroomMaterialCount = document.getElementById(
    "classroomMaterialCount"
);

const analyticsClassTitle = document.getElementById(
    "analyticsClassTitle"
);
const analyticsStudentCount = document.getElementById(
    "analyticsStudentCount"
);
const analyticsAssessmentCount = document.getElementById(
    "analyticsAssessmentCount"
);

function loadClassrooms() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored !== null) {
            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
                state.classrooms = parsed;
                return;
            }
        }
    } catch (error) {
        console.error("Unable to load classrooms:", error);
    }

    state.classrooms = [...mockClassrooms];
    saveClassrooms();
}

function saveClassrooms() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state.classrooms)
        );
    } catch (error) {
        console.error("Unable to save classrooms:", error);
    }
}

function generateJoinCode(name = "") {
    const cleanName = name
        .trim()
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean);

    let prefix = "CL";

    if (cleanName.length >= 2) {
        prefix = `${cleanName[0][0]}${cleanName[1][0]}`.toUpperCase();
    } else if (cleanName.length === 1) {
        prefix = cleanName[0].substring(0, 2).toUpperCase();
    }

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";

    if (
        window.crypto &&
        typeof window.crypto.getRandomValues === "function"
    ) {
        const values = new Uint32Array(4);
        window.crypto.getRandomValues(values);

        values.forEach((value) => {
            randomPart += characters[value % characters.length];
        });
    } else {
        for (let index = 0; index < 4; index += 1) {
            randomPart += characters[
                Math.floor(Math.random() * characters.length)
            ];
        }
    }

    return `${prefix}-${randomPart}`;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderDashboard() {
    classroomGrid.innerHTML = "";

    classroomTotal.textContent = state.classrooms.length;

    studentTotal.textContent = state.classrooms.reduce(
        (total, classroom) =>
            total + Number(classroom.studentCount || 0),
        0
    );

    assessmentTotal.textContent = state.classrooms.reduce(
        (total, classroom) =>
            total + Number(classroom.activeAssessments || 0),
        0
    );

    if (state.classrooms.length === 0) {
        classroomGrid.innerHTML = `
            <div class="empty-classrooms">
                <h3>No classrooms yet</h3>
                <p>
                    Create your first classroom to start managing
                    learning activities.
                </p>
            </div>
        `;

        return;
    }

    state.classrooms.forEach((classroom) => {
        const card = document.createElement("article");

        card.className = "classroom-card";

        card.innerHTML = `
            <div class="classroom-card-header">
                <div>
                    <h3>${escapeHTML(classroom.name)}</h3>

                    <span class="classroom-card-subject">
                        ${escapeHTML(classroom.subject)}
                    </span>
                </div>

                <span class="level-pill">
                    ${escapeHTML(classroom.level)}
                </span>
            </div>

            <span class="classroom-card-code">
                ${escapeHTML(classroom.joinCode)}
            </span>

            <div class="classroom-card-stats">
                <div class="classroom-card-stat">
                    <span>Students</span>
                    <strong>
                        ${Number(classroom.studentCount || 0)}
                    </strong>
                </div>

                <div class="classroom-card-stat">
                    <span>Active assessments</span>
                    <strong>
                        ${Number(classroom.activeAssessments || 0)}
                    </strong>
                </div>
            </div>

            <button
                type="button"
                class="primary-button classroom-card-button"
                data-classroom-id="${escapeHTML(classroom.id)}"
            >
                Enter Classroom
            </button>
        `;

        classroomGrid.appendChild(card);
    });
}

function openCreateModal() {
    classroomModal.classList.remove("hidden");

    createClassroomForm.reset();

    formError.classList.add("hidden");
    formError.textContent = "";

    state.joinCode = generateJoinCode();
    joinCode.value = state.joinCode;

    window.setTimeout(() => {
        classroomName.focus();
    }, 50);
}

function closeCreateModal() {
    classroomModal.classList.add("hidden");
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
}

function createClassroomPayload() {
    return {
        name: classroomName.value.trim(),
        subject: classroomSubjectInput.value.trim(),
        level: classroomLevel.value,
        joinCode: joinCode.value
    };
}

async function postClassroom(payload) {
    try {
        const response = await fetch("/api/teacher/classrooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        return await response.json();
    } catch (error) {
        await new Promise((resolve) => {
            window.setTimeout(resolve, 500);
        });

        return {
            id: `class-${Date.now()}`,
            name: payload.name,
            subject: payload.subject,
            level: payload.level,
            joinCode: payload.joinCode,
            studentCount: 0,
            activeAssessments: 0,
            materialCount: 0
        };
    }
}

async function handleCreateClassroom(event) {
    event.preventDefault();

    formError.classList.add("hidden");

    const payload = createClassroomPayload();

    if (!payload.name) {
        showFormError("Please enter a classroom name.");
        return;
    }

    if (!payload.subject) {
        showFormError("Please enter a subject.");
        return;
    }

    if (!payload.level) {
        showFormError("Please select a level.");
        return;
    }

    createClassroomButton.disabled = true;
    createClassroomButton.textContent = "Creating...";

    try {
        const classroom = await postClassroom(payload);

        state.classrooms.push(classroom);
        saveClassrooms();

        closeCreateModal();
        renderDashboard();
        showToast("Classroom created successfully.");

        openClassroom(classroom.id);
    } catch (error) {
        console.error(error);
        showFormError(
            "Unable to create the classroom. Please try again."
        );
    } finally {
        createClassroomButton.disabled = false;
        createClassroomButton.textContent = "Create Classroom";
    }
}

function showView(view) {
    dashboardView.classList.add("hidden");
    classroomView.classList.add("hidden");
    teacherAnalyticsView.classList.add("hidden");

    view.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function openClassroom(classroomId) {
    const classroom = state.classrooms.find(
        (item) => item.id === classroomId
    );

    if (!classroom) {
        return;
    }

    state.selectedClassroom = classroom;

    classroomTitle.textContent = classroom.name;

    classroomSubject.textContent =
        `${classroom.subject} · ${classroom.level}`;

    classCode.textContent = classroom.joinCode;

    classroomStudentCount.textContent =
        Number(classroom.studentCount || 0);

    classroomAssessmentCount.textContent =
        Number(classroom.activeAssessments || 0);

    classroomMaterialCount.textContent =
        Number(classroom.materialCount || 0);

    resetClassroomWorkspace();
    showView(classroomView);
}

function returnToDashboard() {
    state.selectedClassroom = null;

    showView(dashboardView);
    renderDashboard();
}

function openAnalytics() {
    if (!state.selectedClassroom) {
        return;
    }

    analyticsClassTitle.textContent =
        state.selectedClassroom.name;

    analyticsStudentCount.textContent =
        Number(state.selectedClassroom.studentCount || 0);

    analyticsAssessmentCount.textContent =
        Number(state.selectedClassroom.activeAssessments || 0);

    showView(teacherAnalyticsView);
}

function returnToClassroom() {
    if (!state.selectedClassroom) {
        returnToDashboard();
        return;
    }

    showView(classroomView);
}

function resetClassroomWorkspace() {
    materialFile.value = "";

    materialEmptyState.classList.remove("hidden");
    processingCard.classList.add("hidden");
    analysisResult.classList.add("hidden");

    assessmentPreview.classList.add("hidden");
    assessmentEmpty.classList.remove("hidden");

    progressBar.style.width = "0%";
    processingPercent.textContent = "0%";
    processingTitle.textContent = "Reading document...";

    document.querySelectorAll(".processing-step").forEach((step) => {
        step.classList.remove("active", "complete");
    });
}

async function processMaterial(file) {
    if (!file) {
        return;
    }

    const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
        showToast("Please upload a PDF file.");
        materialFile.value = "";
        return;
    }

    materialEmptyState.classList.add("hidden");
    processingCard.classList.remove("hidden");
    analysisResult.classList.add("hidden");

    assessmentPreview.classList.add("hidden");
    assessmentEmpty.classList.remove("hidden");

    const steps = [
        "Reading document...",
        "Cleaning material...",
        "Identifying sections...",
        "Extracting concepts...",
        "Preparing assessment..."
    ];

    const stepElements = document.querySelectorAll(
        ".processing-step"
    );

    for (let index = 0; index < steps.length; index += 1) {
        processingTitle.textContent = steps[index];

        stepElements.forEach((step, stepIndex) => {
            step.classList.remove("active");

            if (stepIndex < index) {
                step.classList.add("complete");
            }

            if (stepIndex === index) {
                step.classList.add("active");
            }
        });

        const progress = Math.round(
            ((index + 1) / steps.length) * 100
        );

        progressBar.style.width = `${progress}%`;
        processingPercent.textContent = `${progress}%`;

        await new Promise((resolve) => {
            window.setTimeout(resolve, 850);
        });
    }

    stepElements.forEach((step) => {
        step.classList.remove("active");
        step.classList.add("complete");
    });

    processingTitle.textContent = "Material processed";
    processingPercent.textContent = "100%";

    await new Promise((resolve) => {
        window.setTimeout(resolve, 400);
    });

    processingCard.classList.add("hidden");
    analysisResult.classList.remove("hidden");

    if (state.selectedClassroom) {
        state.selectedClassroom.materialCount =
            Number(state.selectedClassroom.materialCount || 0) + 1;

        classroomMaterialCount.textContent =
            state.selectedClassroom.materialCount;

        saveClassrooms();
    }

    showToast("Material analyzed successfully.");
}

async function generateAssessment() {
    if (!state.selectedClassroom) {
        return;
    }

    const materialWasAnalyzed =
        !analysisResult.classList.contains("hidden");

    if (!materialWasAnalyzed) {
        showToast("Upload and analyze a PDF first.");
        return;
    }

    const button = document.getElementById(
        "generateAssessment"
    );

    button.disabled = true;
    button.textContent = "Generating...";

    await new Promise((resolve) => {
        window.setTimeout(resolve, 1000);
    });

    assessmentEmpty.classList.add("hidden");
    assessmentPreview.classList.remove("hidden");

    state.selectedClassroom.activeAssessments =
        Number(state.selectedClassroom.activeAssessments || 0) + 1;

    classroomAssessmentCount.textContent =
        state.selectedClassroom.activeAssessments;

    saveClassrooms();

    button.disabled = false;
    button.textContent = "Generate Diagnostic";

    showToast("Diagnostic assessment generated.");
}

function publishAssessment() {
    if (!state.selectedClassroom) {
        return;
    }

    showToast("Assessment published to the classroom.");
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.remove("hidden");

    window.clearTimeout(showToast.timeout);

    showToast.timeout = window.setTimeout(() => {
        toast.classList.add("hidden");
    }, 2800);
}

document
    .getElementById("brandHome")
    .addEventListener("click", (event) => {
        event.preventDefault();
        returnToDashboard();
    });

document
    .getElementById("openCreateClassroom")
    .addEventListener("click", openCreateModal);

document
    .getElementById("closeCreateClassroom")
    .addEventListener("click", closeCreateModal);

document
    .getElementById("cancelCreateClassroom")
    .addEventListener("click", closeCreateModal);

classroomModal.addEventListener("click", (event) => {
    if (event.target === classroomModal) {
        closeCreateModal();
    }
});

document
    .getElementById("generateJoinCode")
    .addEventListener("click", () => {
        state.joinCode = generateJoinCode(classroomName.value);
        joinCode.value = state.joinCode;
    });

classroomName.addEventListener("input", () => {
    if (!joinCode.value) {
        state.joinCode = generateJoinCode(classroomName.value);
        joinCode.value = state.joinCode;
    }
});

createClassroomForm.addEventListener(
    "submit",
    handleCreateClassroom
);

classroomGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-classroom-id]");

    if (!button) {
        return;
    }

    openClassroom(button.dataset.classroomId);
});

document
    .getElementById("backToDashboard")
    .addEventListener("click", returnToDashboard);

document
    .getElementById("openAnalytics")
    .addEventListener("click", openAnalytics);

document
    .getElementById("analyticsBackBtn")
    .addEventListener("click", returnToClassroom);

materialFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    processMaterial(file);
});

document
    .getElementById("generateAssessment")
    .addEventListener("click", generateAssessment);

document
    .getElementById("publishAssessment")
    .addEventListener("click", publishAssessment);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCreateModal();
    }
});

loadClassrooms();
renderDashboard();