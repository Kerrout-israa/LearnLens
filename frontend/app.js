const LearnLensApp = {
    state: {
        currentView: "landing",
        selectedRole: null
    },

    routes: {
        landing: "landing-view",
        "teacher-dashboard": "teacher-dashboard-view",
        "student-join": "student-join-view"
    },

    init() {
        this.restoreSession();
        this.bindEvents();
        this.initializeRoute();
    },

    restoreSession() {
        const storedRole = localStorage.getItem("learnlens_role");

        if (storedRole === "teacher" || storedRole === "student") {
            this.state.selectedRole = storedRole;
        }
    },

    bindEvents() {
        document.addEventListener("click", (event) => {
            const routeElement = event.target.closest("[data-route]");

            if (routeElement) {
                const route = routeElement.dataset.route;

                if (route) {
                    this.navigate(route);
                    return;
                }
            }

            const roleCard = event.target.closest("[data-role]");

            if (roleCard) {
                const role = roleCard.dataset.role;
                const route = roleCard.dataset.route;

                this.selectRole(role);

                if (route) {
                    this.navigate(route);
                }
            }
        });

        document.addEventListener("keydown", (event) => {
            const interactiveBrand = event.target.closest(
                '[data-route][role="button"]'
            );

            if (!interactiveBrand) {
                return;
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                const route = interactiveBrand.dataset.route;

                if (route) {
                    this.navigate(route);
                }
            }
        });

        window.addEventListener("popstate", () => {
            const route = this.getRouteFromUrl();

            this.showView(route, false);
        });
    },

    initializeRoute() {
        const initialRoute = this.getRouteFromUrl();

        if (this.routes[initialRoute]) {
            this.showView(initialRoute, false);
        } else {
            this.showView("landing", false);
        }
    },

    getRouteFromUrl() {
        const hash = window.location.hash.replace("#", "").trim();

        if (hash && this.routes[hash]) {
            return hash;
        }

        return "landing";
    },

    navigate(route) {
        if (!this.routes[route]) {
            this.showToast("This LearnLens page is not available yet.");
            return;
        }

        this.showView(route, true);
    },

    showView(route, updateHistory = true) {
        const targetId = this.routes[route];

        if (!targetId) {
            return;
        }

        const views = document.querySelectorAll(".view");

        views.forEach((view) => {
            const isActive = view.id === targetId;

            view.classList.toggle("active-view", isActive);
            view.setAttribute("aria-hidden", String(!isActive));
        });

        this.state.currentView = route;

        if (updateHistory) {
            const newUrl = `${window.location.pathname}${window.location.search}#${route}`;

            window.history.pushState(
                {
                    route
                },
                "",
                newUrl
            );
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    },

    selectRole(role) {
        if (role !== "teacher" && role !== "student") {
            return;
        }

        this.state.selectedRole = role;

        localStorage.setItem("learnlens_role", role);

        const roleName = role === "teacher"
            ? "Teacher Portal"
            : "Student Portal";

        this.showToast(`${roleName} selected.`);
    },

    getCurrentRole() {
        return this.state.selectedRole;
    },

    clearSession() {
        this.state.selectedRole = null;
        localStorage.removeItem("learnlens_role");
        this.navigate("landing");
    },

    showToast(message) {
        const container = document.getElementById("toast-container");

        if (!container) {
            return;
        }

        const toast = document.createElement("div");

        toast.className = "toast";
        toast.textContent = message;

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    LearnLensApp.init();
});

window.LearnLensApp = LearnLensApp;