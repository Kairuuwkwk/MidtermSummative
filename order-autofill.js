// order-autofill.js — load AFTER script.js and product-details.js
// Upgrades the "Order Details" popup that script.js builds:
//  - splits Recipient name into First / Middle / Last (letters only)
//  - mobile number with fixed +63 prefix
//  - validation on every field when pressing "Place Order"
//  - autofills name + mobile from the account that was registered
(function () {
    const PROFILE_KEY = "synchrochain_profiles";
    const NAME_OK = /^\p{L}[\p{L}\s.'-]*$/u;

    // ---------- styles ----------
    const style = document.createElement("style");
    style.textContent = `
        .ord-name-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .ord-name-grid input { width: 100%; box-sizing: border-box; min-width: 0; }
        .ord-phone { display: flex; }
        .ord-prefix {
            display: flex; align-items: center; padding: 0 14px;
            background: #f1efe9; border: 1px solid #e4e2dc; border-right: 0;
            border-radius: 8px 0 0 8px; color: #444; font-weight: 600;
        }
        .ord-phone input { flex: 1; min-width: 0; border-radius: 0 8px 8px 0 !important; }
        .ord-err { display: block; margin-top: 4px; color: #d93025; font-size: 12px; }
        .ord-bad { border-color: #d93025 !important; }
        @media (max-width: 560px) { .ord-name-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);

    // ---------- helpers ----------
    function field(text) {
        const label = [...document.querySelectorAll("label")]
            .find((l) => l.textContent.trim().toLowerCase().startsWith(text));
        if (!label) return null;
        const wrap = label.parentElement;
        const input = label.control && !label.control.dataset.ord
            ? label.control
            : wrap.querySelector("input:not([data-ord]), select, textarea");
        return input ? { label, wrap, input } : null;
    }

    function setErr(host, msg, ctrls) {
        let err = host.querySelector(":scope > .ord-err");
        if (!err) {
            err = document.createElement("small");
            err.className = "ord-err";
            host.appendChild(err);
        }
        err.textContent = msg || "";
        [].concat(ctrls).forEach((c) => c.classList.toggle("ord-bad", !!msg));
        return !msg;
    }

    function clean(s) { return s.replace(/\s+/g, " ").trim(); }

    function normMobile(v) {
        let d = String(v || "").replace(/\D/g, "");
        if (d.startsWith("63") && d.length > 10) d = d.slice(2);
        if (d.startsWith("0")) d = d.slice(1);
        return d.slice(0, 10);
    }

    // Find the profile of whoever is logged in
    function currentProfile() {
        let profiles = {};
        try { profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch (e) {}
        const emails = Object.keys(profiles);
        if (!emails.length) return null;

        // 1) the user chip in the navbar (email or full name)
        const chip = (document.getElementById("userChip")?.textContent || "").trim().toLowerCase();
        if (chip) {
            for (const e of emails) {
                const p = profiles[e];
                const full = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").toLowerCase();
                if (chip.includes(e) || chip === full || (full && chip.includes(full))) return p;
            }
        }
        // 2) a "current user / session" key saved at login
        for (const store of [sessionStorage, localStorage]) {
            for (let i = 0; i < store.length; i++) {
                const k = store.key(i);
                if (k === PROFILE_KEY || !/current|logged|session|active|auth/i.test(k)) continue;
                const v = (store.getItem(k) || "").toLowerCase();
                const hit = emails.filter((e) => v.includes(e));
                if (hit.length === 1) return profiles[hit[0]];
            }
        }
        return null;
    }

    function liveFilter(input, regex, max) {
        if (input.dataset.ordLive) return;
        input.dataset.ordLive = "1";
        if (max) input.maxLength = max;
        input.addEventListener("input", () => { input.value = input.value.replace(regex, ""); });
    }

    // ---------- recipient name → first / middle / last ----------
    function enhanceName(nf) {
        const orig = nf.input;
        if (!orig.dataset.ordDone) {
            orig.dataset.ordDone = "1";
            orig.style.display = "none";
            nf.wrap.style.gridColumn = "1 / -1";

            const grid = document.createElement("div");
            grid.className = "ord-name-grid";
            const mk = (ph, label) => {
                const i = document.createElement("input");
                i.type = "text";
                i.className = orig.className;
                i.placeholder = ph;
                i.maxLength = 40;
                i.dataset.ord = "1";
                i.setAttribute("aria-label", label);
                liveFilter(i, /[^\p{L}\s.'-]/gu);
                i.addEventListener("input", sync);
                grid.appendChild(i);
                return i;
            };
            const first = mk("First name", "First name");
            const mid   = mk("Middle name (optional)", "Middle name");
            const last  = mk("Last name", "Last name");
            orig.after(grid);
            orig._ord = { first, mid, last, grid };

            function sync() {
                orig.value = [first.value, mid.value, last.value]
                    .map(clean).filter(Boolean).join(" ");
                orig.dispatchEvent(new Event("input", { bubbles: true }));
            }
            orig._sync = sync;
        }

        const vis = nf.wrap.getClientRects().length > 0;
        if (vis && orig.dataset.ordVis !== "1") setTimeout(() => prefillName(orig), 0);
        orig.dataset.ordVis = vis ? "1" : "0";
    }

    function prefillName(orig) {
        const { first, mid, last } = orig._ord;
        const p = currentProfile();
        if (p) {
            first.value = p.firstName || "";
            mid.value   = p.middleName || "";
            last.value  = p.lastName || "";
        } else {
            // Older accounts: best-effort split of the full name
            const t = clean(orig.value).split(" ").filter(Boolean);
            first.value = t[0] || "";
            last.value  = t.length > 1 ? t[t.length - 1] : "";
            mid.value   = t.length > 2 ? t.slice(1, -1).join(" ") : "";
        }
        orig._sync();
    }

    // ---------- mobile → +63 ----------
    function enhanceMobile(mf) {
        const orig = mf.input;
        if (!orig.dataset.ordDone) {
            orig.dataset.ordDone = "1";
            orig.style.display = "none";

            const box = document.createElement("div");
            box.className = "ord-phone";
            const pre = document.createElement("span");
            pre.className = "ord-prefix";
            pre.textContent = "+63";
            const i = document.createElement("input");
            i.type = "tel";
            i.className = orig.className;
            i.placeholder = "9XXXXXXXXX";
            i.inputMode = "numeric";
            i.maxLength = 10;
            i.dataset.ord = "1";
            i.setAttribute("aria-label", "Mobile number");
            i.addEventListener("input", () => {
                i.value = normMobile(i.value);
                orig.value = i.value ? "+63" + i.value : "";
                orig.dispatchEvent(new Event("input", { bubbles: true }));
            });
            box.append(pre, i);
            orig.after(box);
            orig._ord = { i };
        }

        const vis = mf.wrap.getClientRects().length > 0;
        if (vis && orig.dataset.ordVis !== "1") {
            setTimeout(() => {
                const p = currentProfile();
                const i = orig._ord.i;
                i.value = normMobile(p && p.mobile ? p.mobile : orig.value);
                orig.value = i.value ? "+63" + i.value : "";
            }, 0);
        }
        orig.dataset.ordVis = vis ? "1" : "0";
    }

    // ---------- the rest of the fields ----------
    function enhanceOthers() {
        const city = field("city"), prov = field("province"), brgy = field("barangay");
        const zip = field("zip"), date = field("preferred delivery");
        if (city) liveFilter(city.input, /[^\p{L}\s.'-]/gu, 60);
        if (prov) liveFilter(prov.input, /[^\p{L}\s.'-]/gu, 60);
        if (brgy) liveFilter(brgy.input, /[^\p{L}\d\s.'#-]/gu, 60);
        if (zip) { liveFilter(zip.input, /\D/g, 4); zip.input.inputMode = "numeric"; }
        if (date) {
            const d = new Date();
            date.input.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                .toISOString().slice(0, 10);
        }
    }

    function scan() {
        const nf = field("recipient name");
        if (nf) enhanceName(nf);
        const mf = field("mobile number");
        if (mf) enhanceMobile(mf);
        enhanceOthers();
    }

    let queued = false;
    new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; scan(); });
    }).observe(document.body, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ["class", "style", "hidden", "open"]
    });
    scan();

    // ---------- validation ----------
    function validateOrder() {
        const nf = field("recipient name");
        if (!nf || !nf.input._ord || nf.wrap.getClientRects().length === 0) return true;

        let ok = true, firstBad = null;
        const mark = (res, ctrl) => { if (!res) { ok = false; if (!firstBad) firstBad = ctrl; } };

        // Names
        const { first, mid, last } = nf.input._ord;
        const nm = (inp, label, req) => {
            const v = clean(inp.value);
            if (!v) return req ? label + " is required." : "";
            if (v.length < 2) return label + " must be at least 2 letters.";
            if (!NAME_OK.test(v)) return label + " can only contain letters.";
            return "";
        };
        const nameMsg = nm(first, "First name", true) || nm(last, "Last name", true) || nm(mid, "Middle name", false);
        const badName = nm(first, "First name", true) ? first : nm(last, "Last name", true) ? last : nm(mid, "Middle name", false) ? mid : first;
        [first, mid, last].forEach((c) => c.classList.remove("ord-bad"));
        mark(setErr(nf.wrap, nameMsg, nameMsg ? badName : []), badName);

        // Mobile
        const mf = field("mobile number");
        if (mf && mf.input._ord) {
            const i = mf.input._ord.i;
            const msg = !i.value ? "Mobile number is required."
                : !/^9\d{9}$/.test(i.value) ? "Enter 10 digits starting with 9 (e.g. 9123456789)." : "";
            mark(setErr(mf.wrap, msg, i), i);
        }

        // Address + others
        const text = (key, label, min, re, reMsg) => {
            const f = field(key);
            if (!f) return;
            const v = clean(f.input.value);
            let msg = "";
            if (!v) msg = label + " is required.";
            else if (v.length < min) msg = label + " is too short.";
            else if (re && !re.test(v)) msg = reMsg;
            mark(setErr(f.wrap, msg, f.input), f.input);
        };
        text("street", "Street / building", 3);
        text("barangay", "Barangay", 2);
        text("city", "City / Municipality", 2, NAME_OK, "City can only contain letters.");
        text("province", "Province", 2, NAME_OK, "Province can only contain letters.");

        const zip = field("zip");
        if (zip) {
            const msg = !zip.input.value ? "ZIP code is required."
                : !/^\d{4}$/.test(zip.input.value) ? "ZIP code must be 4 digits." : "";
            mark(setErr(zip.wrap, msg, zip.input), zip.input);
        }

        const date = field("preferred delivery");
        if (date) {
            const msg = !date.input.value ? "Choose a delivery date."
                : (date.input.min && date.input.value < date.input.min) ? "Delivery date can't be in the past." : "";
            mark(setErr(date.wrap, msg, date.input), date.input);
        }

        const pay = field("payment");
        if (pay) {
            const msg = !pay.input.value ? "Select a payment method." : "";
            mark(setErr(pay.wrap, msg, pay.input), pay.input);
        }

        if (!ok && firstBad) firstBad.focus();
        return ok;
    }

    // Capture phase = runs before script.js's own Place Order handler
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button, input[type=submit]");
        if (!btn || !/place order/i.test(btn.textContent || btn.value || "")) return;
        if (!validateOrder()) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);

    document.addEventListener("submit", (e) => {
        if (!e.target.querySelector("[data-ord]")) return;
        if (!validateOrder()) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
})();