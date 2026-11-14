// auth-ui.js — adds a Show/Hide button to every password field on the auth pages
(function () {
    document.querySelectorAll('.auth-split input[type="password"]').forEach(function (input) {
        const wrap = document.createElement("div");
        wrap.className = "pw-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pw-toggle";
        btn.textContent = "Show";
        btn.setAttribute("aria-label", "Show password");
        btn.addEventListener("click", function () {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.textContent = show ? "Hide" : "Show";
            btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        });
        wrap.appendChild(btn);
    });
})();