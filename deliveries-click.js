// deliveries-select.js
// Load on deliveries.html AFTER script.js:  <script src="deliveries-select.js"></script>
// Click any delivery in the list and it appears in the "Latest Update" card
// (order number, product, destination, estimated arrival and the progress timeline).
(function () {
    "use strict";

    var list = document.getElementById("deliveryList");
    var panel = document.getElementById("latestUpdate");
    if (!list || !panel) return;

    var title = panel.querySelector("h2");
    var eyebrow = panel.querySelector(".eyebrow");
    var steps = Array.prototype.slice.call(panel.querySelectorAll(".timeline .step"));
    if (!title || !steps.length) return;

    var ORANGE = "#ff6a13";
    var DOT = "\u00b7";
    var CANDIDATES = ["active", "done", "completed", "complete", "current", "reached", "on", "filled", "passed"];

    /* ---------- Styles ---------- */
    var st = document.createElement("style");
    st.textContent =
        "#deliveryList>*{cursor:pointer;transition:box-shadow .2s ease}" +
        "#deliveryList>*:hover{box-shadow:0 6px 20px rgba(16,45,56,.12)}" +
        "#deliveryList>*.selected{outline:2px solid " + ORANGE + ";outline-offset:-2px}" +
        "#deliveryList>*:focus-visible{outline:2px solid " + ORANGE + ";outline-offset:2px}" +
        ".track-meta{margin:6px 0 0;font-size:14px;opacity:.7}";
    document.head.appendChild(st);

    /* ---------- Read a delivery card ---------- */
    function statusIndex(status) {
        if (/^delivered/i.test(status)) return 3;
        if (/shipped|in transit|out for/i.test(status)) return 2;
        if (/processing/i.test(status)) return 1;
        return 0;
    }

    // text of a card with a separator between elements, so "2026" and "25%" never merge
    function cardText(card) {
        var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null);
        var parts = [];
        var n;
        while ((n = walker.nextNode())) {
            var t = n.nodeValue.replace(/\s+/g, " ").trim();
            if (t) parts.push(t);
        }
        return parts.join(" | ");
    }

    function parse(card) {
        var text = cardText(card);
        var m = text.match(new RegExp("^(.*?)\\s*\\|?\\s*[\\u00b7\\u2022]\\s*\\|?\\s*#(\\d+)\\s*\\|?\\s*(.*)$"));
        if (!m) return null;
        var rest = m[3];
        var sm = rest.match(/(Order placed|Processing|Out for delivery|In Transit|Shipped|Delivered)/i);
        var status = sm ? sm[1] : "";
        var place = sm ? rest.slice(0, sm.index).replace(/[|\s]+$/, "").trim() : "";
        var eta = (rest.match(/Estimated arrival:\s*([^|]*)/i) || [])[1] || "";
        return {
            product: m[1].replace(/[|\s]+$/, ""),
            id: m[2],
            status: status,
            place: place,
            eta: eta.trim(),
            idx: statusIndex(status)
        };
    }

    /* ---------- Timeline (works with whatever class your CSS uses) ---------- */
    function dotOf(step) { return step.querySelector(".step-dot") || step; }

    // Find which class makes a step look "done" by testing the real CSS
    function learnOnClass() {
        var step = steps[steps.length - 1];
        var dot = dotOf(step);
        var label = step.querySelector("span") || step;
        var els = [step, dot, label];
        var savedClasses = [step.className, dot.className];

        els.forEach(function (el) { el.style.setProperty("transition", "none", "important"); });
        CANDIDATES.forEach(function (c) { step.classList.remove(c); dot.classList.remove(c); });

        function sig() {
            var d = getComputedStyle(dot);
            return [d.backgroundColor, d.borderColor, d.boxShadow, getComputedStyle(label).color].join("|");
        }

        var base = sig();
        var found = null;
        for (var i = 0; i < CANDIDATES.length && !found; i++) {
            var c = CANDIDATES[i];
            step.classList.add(c);
            if (sig() !== base) found = { target: "step", cls: c };
            step.classList.remove(c);
            if (found) break;
            dot.classList.add(c);
            if (sig() !== base) found = { target: "dot", cls: c };
            dot.classList.remove(c);
        }

        step.className = savedClasses[0];
        dot.className = savedClasses[1];
        els.forEach(function (el) { el.style.removeProperty("transition"); });
        return found;
    }

    var learned = learnOnClass();

    function setSteps(idx) {
        steps.forEach(function (step, i) {
            var dot = dotOf(step);
            var on = i <= idx;
            CANDIDATES.forEach(function (c) { step.classList.remove(c); dot.classList.remove(c); });

            if (learned) {
                (learned.target === "step" ? step : dot).classList.toggle(learned.cls, on);
            } else if (on) {
                // fallback if the stylesheet's class couldn't be detected
                dot.style.background = ORANGE;
                dot.style.borderColor = ORANGE;
                dot.style.boxShadow = "0 0 0 6px rgba(255,106,19,.15)";
            } else {
                dot.style.removeProperty("background");
                dot.style.removeProperty("border-color");
                dot.style.removeProperty("box-shadow");
            }
        });
    }

    /* ---------- Selecting ---------- */
    var selectedId = null;
    var current = title.textContent.match(/#(\d+)/);
    if (current) selectedId = current[1];

    var meta = document.createElement("p");
    meta.className = "track-meta";
    title.parentNode.insertBefore(meta, title.nextSibling);

    function cards() { return Array.prototype.slice.call(list.children); }

    function markSelected() {
        cards().forEach(function (card) {
            var info = parse(card);
            card.classList.toggle("selected", !!info && info.id === selectedId);
        });
    }

    function select(card, scroll) {
        var info = parse(card);
        if (!info) return;
        selectedId = info.id;

        title.textContent = "Order #" + info.id + " " + DOT + " " + info.product;
        meta.textContent = [info.place, info.status, info.eta ? "Estimated arrival: " + info.eta : ""]
            .filter(Boolean).join(" " + DOT + " ");
        if (eyebrow) eyebrow.textContent = "SELECTED DELIVERY";
        setSteps(info.idx);
        markSelected();

        if (scroll) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    list.addEventListener("click", function (e) {
        var card = e.target.closest("#deliveryList > *");
        if (card && list.contains(card)) select(card, true);
    });

    list.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var card = e.target.closest("#deliveryList > *");
        if (!card) return;
        e.preventDefault();
        select(card, true);
    });

    // cards are drawn by script.js, so prepare them now and whenever they are redrawn
    function prepare() {
        cards().forEach(function (card) {
            if (!card.hasAttribute("tabindex")) {
                card.tabIndex = 0;
                card.setAttribute("role", "button");
            }
        });
        markSelected();
    }

    new MutationObserver(prepare).observe(list, { childList: true });
    prepare();
})();