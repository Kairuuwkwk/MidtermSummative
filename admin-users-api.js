// admin-users-api.js — shows registered users from PostgreSQL in the Users tab.
// Load on admin.html AFTER admin.js.
(function () {
    const usersBody = document.querySelector("#usersTable tbody");
    if (!usersBody) return;

    const API = (location.port === "3000" || location.protocol === "https:")
        ? ""
        : "http://" + (location.hostname || "localhost") + ":3000";
    const TOKEN_KEY = "synchrochain_admin_token";

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function notify(msg, type) {
        if (typeof showToast === "function") showToast(msg, type || "error");
        else console.warn(msg);
    }

    function render(users) {
        if (!users.length) {
            usersBody.innerHTML = "<tr class='empty-row'><td colspan='6'>No registered users yet.</td></tr>";
            return;
        }
        usersBody.innerHTML = users.map(function (u) {
            const created = new Date(u.createdAt);
            return "<tr>" +
                "<td>" + esc(u.name) + "</td>" +
                "<td>" + esc(u.email) + "</td>" +
                "<td>" + esc(u.role) + "</td>" +
                "<td>" + esc(isNaN(created) ? "-" : created.toLocaleString("en-US")) + "</td>" +
                "</tr>";
        }).join("");
    }

    async function loadUsers() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            notify("Log out and log in again as administrator to load database users.");
            return;
        }
        try {
            const res = await fetch(API + "/api/users", {
                headers: { Authorization: "Bearer " + token }
            });
            if (res.status === 401) {
                notify("Administrator session expired. Please log out and log in again.");
                return;
            }
            const data = await res.json();
            render(data.users || []);
        } catch (err) {
            console.error(err);
            notify("Cannot reach the server. Make sure node server.js is running.");
        }
    }

    function start() {
        loadUsers();
        // refresh whenever the Users tab is opened
        document.querySelectorAll(".admin-tab").forEach(function (t) {
            if (t.dataset.tab === "panel-users") t.addEventListener("click", loadUsers);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
})();