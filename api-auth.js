// api-auth.js — connects Register and Login to the PostgreSQL server.
// Must be loaded AFTER script.js (and after register-validation.js on the register page).
(function () {
    // Same address as the page when served by node (port 3000, or https when hosted).
    // From Live Server or file://, it talks to the node server on port 3000.
    const API = (location.port === "3000" || location.protocol === "https:")
        ? ""
        : "http://" + (location.hostname || "localhost") + ":3000";

    const SESSION_KEY  = "synchrochain_session";
    const ACTIVITY_KEY = "synchrochain_activity";

    function show(box, text, ok) {
        if (!box) return;
        box.textContent = text;
        box.className = "auth-message " + (ok ? "success" : "error");
    }

    function logActivity(action, details) {
        try {
            const list = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");
            const activity = Array.isArray(list) ? list : [];
            activity.unshift({
                id: Date.now(),
                action: action,
                details: details || "",
                time: new Date().toLocaleString()
            });
            if (activity.length > 100) activity.length = 100;
            localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
        } catch (err) {
            console.error("Could not save activity:", err);
        }
    }

    async function post(path, body) {
        const res = await fetch(API + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        let data = {};
        try { data = await res.json(); } catch (err) { /* ignore */ }
        return { ok: res.ok, data: data };
    }

    /* =====================================================
       REGISTER  (saves the account in PostgreSQL)
    ===================================================== */
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        const box = document.getElementById("registerMessage");

        // Runs after register-validation.js. If validation failed, that file
        // already stopped the event, so this code never runs.
        document.addEventListener("submit", async function (e) {
            if (e.target !== registerForm) return;

            e.preventDefault();
            e.stopImmediatePropagation(); // stops script.js from saving to localStorage

            const btn = registerForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;
            show(box, "Creating your account...", true);

            try {
                const result = await post("/api/register", {
                    firstName:  document.getElementById("registerFirstName").value,
                    middleName: document.getElementById("registerMiddleName").value,
                    lastName:   document.getElementById("registerLastName").value,
                    mobile:     "+63" + document.getElementById("registerMobile").value,
                    email:      document.getElementById("registerEmail").value,
                    password:   document.getElementById("registerPassword").value
                });

                if (result.ok) {
                    const fullName = document.getElementById("registerName").value;
                    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
                    logActivity("User Registration", fullName + " (" + email + ") created an account.");
                    show(box, "Account created successfully! Redirecting to login...", true);
                    setTimeout(function () { window.location.href = "login.html"; }, 1200);
                } else {
                    show(box, result.data.message || "Registration failed.", false);
                    if (btn) btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                show(box, "Cannot reach the server. Make sure node server.js is running.", false);
                if (btn) btn.disabled = false;
            }
        }, true);
    }

    /* =====================================================
       USER LOGIN  (checks PostgreSQL, then creates the same
       session that script.js and every other page already use)
    ===================================================== */
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        const box = document.getElementById("loginMessage");

        document.addEventListener("submit", async function (e) {
            if (e.target !== loginForm) return;

            e.preventDefault();
            e.stopImmediatePropagation(); // stops script.js from checking localStorage

            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPassword").value;

            if (!email || !password) {
                show(box, "Please enter your email and password.", false);
                return;
            }

            const btn = loginForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;
            show(box, "Signing in...", true);

            try {
                const result = await post("/api/login", { email: email, password: password });

                if (!result.ok) {
                    show(box, result.data.message || "Invalid email or password.", false);
                    if (btn) btn.disabled = false;
                    return;
                }

                const user = result.data.user;

                if (user.role === "admin") {
                    show(box, "Please use Administrator Login.", false);
                    if (btn) btn.disabled = false;
                    return;
                }

                const fullName = [user.firstName, user.middleName, user.lastName]
                    .filter(Boolean).join(" ");

                // Same shape as the session script.js creates
                const userSession = {
                    id: user.id,
                    name: fullName,
                    email: user.email,
                    role: "user",
                    loginTime: new Date().toLocaleString()
                };

                localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
                logActivity("User Login", fullName + " (" + user.email + ") logged in.");

                show(box, "Login successful! Redirecting...", true);
                setTimeout(function () { window.location.href = "index.html"; }, 600);

            } catch (err) {
                console.error(err);
                show(box, "Cannot reach the server. Make sure node server.js is running.", false);
                if (btn) btn.disabled = false;
            }
        }, true);
    }
})();