// admin-auth.js — Administrator login using PostgreSQL. Load AFTER script.js on admin-login.html.
(function () {
    const form = document.getElementById("adminLoginForm");
    if (!form) return;

    const API = (location.port === "3000" || location.protocol === "https:")
        ? ""
        : "http://" + (location.hostname || "localhost") + ":3000";

    const SESSION_KEY  = "synchrochain_session";
    const ACTIVITY_KEY = "synchrochain_activity";
    const TOKEN_KEY    = "synchrochain_admin_token";
    const box = document.getElementById("adminLoginMessage");

    function show(text, ok) {
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

    document.addEventListener("submit", async function (e) {
        if (e.target !== form) return;

        e.preventDefault();
        e.stopImmediatePropagation(); // stops script.js from using the old fixed admin account

        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;

        if (!username || !password) {
            show("Please enter your administrator username and password.", false);
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        show("Signing in...", true);

        try {
            const res = await fetch(API + "/api/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username, password: password })
            });
            let data = {};
            try { data = await res.json(); } catch (err) { /* ignore */ }

            if (!res.ok) {
                show(data.message || "Invalid administrator username or password.", false);
                if (btn) btn.disabled = false;
                return;
            }

            const admin = data.user;

            localStorage.setItem(SESSION_KEY, JSON.stringify({
                id: admin.id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: "admin",
                loginTime: new Date().toLocaleString()
            }));
            localStorage.setItem(TOKEN_KEY, data.token);

            logActivity("Administrator Login", admin.name + " logged in as administrator.");

            show("Login successful! Redirecting...", true);
            setTimeout(function () { window.location.href = "admin.html"; }, 600);

        } catch (err) {
            console.error(err);
            show("Cannot reach the server. Make sure node server.js is running.", false);
            if (btn) btn.disabled = false;
        }
    }, true);
})();