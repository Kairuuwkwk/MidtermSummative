// register-validation.js — load AFTER script.js
(function () {
    const form = document.getElementById("registerForm");
    if (!form) return;

    const el = {
        full:    document.getElementById("registerName"), // hidden, read by script.js
        first:   document.getElementById("registerFirstName"),
        middle:  document.getElementById("registerMiddleName"),
        last:    document.getElementById("registerLastName"),
        email:   document.getElementById("registerEmail"),
        mobile:  document.getElementById("registerMobile"),
        pass:    document.getElementById("registerPassword"),
        confirm: document.getElementById("registerConfirm")
    };

    // Letters (including Ñ, accents), spaces, hyphen, apostrophe, period. No digits.
    const NAME_OK   = /^\p{L}[\p{L}\s.'-]*$/u;
    const NAME_JUNK = /[^\p{L}\s.'-]/gu;
    const EMAIL_OK  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const MOBILE_OK = /^9\d{9}$/;

    function setError(input, msg) {
        const box = input.closest(".auth-field");
        let err = box.querySelector(".field-error");
        if (!err) {
            err = document.createElement("small");
            err.className = "field-error";
            box.appendChild(err);
        }
        err.textContent = msg;
        input.classList.toggle("invalid", !!msg);
        return !msg;
    }

    const clean = (s) => s.replace(/\s+/g, " ").trim();

    function checkName(input, label, required) {
        const v = clean(input.value);
        if (!v) return setError(input, required ? label + " is required." : "");
        if (v.length < 2) return setError(input, label + " must be at least 2 letters.");
        if (!NAME_OK.test(v)) return setError(input, label + " can only contain letters.");
        return setError(input, "");
    }

    function checkEmail() {
        const v = el.email.value.trim();
        if (!v) return setError(el.email, "Email is required.");
        if (!EMAIL_OK.test(v)) return setError(el.email, "Enter a valid email address.");
        return setError(el.email, "");
    }

    function checkMobile() {
        const v = el.mobile.value;
        if (!v) return setError(el.mobile, "Mobile number is required.");
        if (!MOBILE_OK.test(v)) return setError(el.mobile, "Enter 10 digits starting with 9 (e.g. 9123456789).");
        return setError(el.mobile, "");
    }

    function checkPass() {
        if (!el.pass.value) return setError(el.pass, "Password is required.");
        if (el.pass.value.length < 6) return setError(el.pass, "Password must be at least 6 characters.");
        return setError(el.pass, "");
    }

    function checkConfirm() {
        if (!el.confirm.value) return setError(el.confirm, "Please confirm your password.");
        if (el.confirm.value !== el.pass.value) return setError(el.confirm, "Passwords do not match.");
        return setError(el.confirm, "");
    }

    // Live: block numbers/symbols while typing in the name fields
    [el.first, el.middle, el.last].forEach((input) => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(NAME_JUNK, "");
        });
    });
    el.first.addEventListener("blur",  () => checkName(el.first, "First name", true));
    el.middle.addEventListener("blur", () => checkName(el.middle, "Middle name", false));
    el.last.addEventListener("blur",   () => checkName(el.last, "Last name", true));
    el.email.addEventListener("blur", checkEmail);
    el.pass.addEventListener("blur", checkPass);
    el.confirm.addEventListener("blur", checkConfirm);

    // Live: mobile accepts digits only, handles 09..., 639..., +639... when pasted
    el.mobile.addEventListener("input", () => {
        let v = el.mobile.value.replace(/\D/g, "");
        if (v.startsWith("63") && v.length > 10) v = v.slice(2);
        if (v.startsWith("0")) v = v.slice(1);
        el.mobile.value = v.slice(0, 10);
    });
    el.mobile.addEventListener("blur", checkMobile);

    // Runs BEFORE script.js's own submit handler (capture phase on document)
    document.addEventListener("submit", function (e) {
        if (e.target !== form) return;

        const results = [
            checkName(el.first, "First name", true),
            checkName(el.middle, "Middle name", false),
            checkName(el.last, "Last name", true),
            checkEmail(),
            checkMobile(),
            checkPass(),
            checkConfirm()
        ];

        if (results.includes(false)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const bad = form.querySelector(".invalid");
            if (bad) bad.focus();
            return;
        }

        // Tidy values
        el.first.value  = clean(el.first.value);
        el.middle.value = clean(el.middle.value);
        el.last.value   = clean(el.last.value);

        // Combined name for script.js (which still reads #registerName)
        el.full.value = [el.first.value, el.middle.value, el.last.value]
            .filter(Boolean).join(" ");

        // Save the separate details so other pages can autofill them
        try {
            const KEY = "synchrochain_profiles";
            const profiles = JSON.parse(localStorage.getItem(KEY) || "{}");
            profiles[el.email.value.trim().toLowerCase()] = {
                firstName:  el.first.value,
                middleName: el.middle.value,
                lastName:   el.last.value,
                mobile:     "+63" + el.mobile.value
            };
            localStorage.setItem(KEY, JSON.stringify(profiles));
        } catch (err) {
            console.error("Could not save profile:", err);
        }
    }, true);

    // ---- Fix: remove duplicate "+63" added by other scripts ----
    const phoneWrap  = document.querySelector(".phone-input");
    const phoneField = phoneWrap && phoneWrap.closest(".auth-field");

    function removeDuplicatePrefix() {
        if (!phoneWrap || !phoneField) return;

        // Stray "+63" text or elements outside the box (keep the label)
        Array.from(phoneField.childNodes).forEach(function (n) {
            if (n === phoneWrap) return;
            if (n.nodeType === 1 && n.tagName === "LABEL") return;
            if (n.textContent.trim() === "+63") n.remove();
        });

        // Only one prefix inside the box
        const prefixes = phoneWrap.querySelectorAll(".phone-prefix");
        for (let i = 1; i < prefixes.length; i++) prefixes[i].remove();
    }

    removeDuplicatePrefix();
    // Re-run if another script adds it after the page loads
    if (phoneField) {
        new MutationObserver(removeDuplicatePrefix).observe(phoneField, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
})();