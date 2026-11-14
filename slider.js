// slider.js - auto-sliding supply chain slider for the Overview image card on index.html
// Load AFTER script.js:  <script src="slider.js"></script>
(function () {
    "use strict";

    var card = document.querySelector(".image-card");
    if (!card) return;

    var INTERVAL = 5000; // ms between slides

    /* ---------- Small SVG helpers ---------- */
    function r(x, y, w, h, fill, rx) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (rx ? ' rx="' + rx + '"' : "") + "/>";
    }
    function c(cx, cy, rad, fill, extra) {
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="' + fill + '" ' + (extra || "") + "/>";
    }
    function poly(points, fill, extra) {
        return '<polygon points="' + points + '" fill="' + fill + '" ' + (extra || "") + "/>";
    }
    function line(x1, y1, x2, y2, stroke, w) {
        return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    }
    function svg(inner) {
        return '<svg viewBox="0 0 520 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g transform="translate(0,-28)">' + inner + "</g></svg>";
    }
    function shadow(cx, cy, rx) {
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="9" fill="rgba(0,0,0,.28)"/>';
    }

    var ORANGE = "#ff6a13";
    var BOX_COLORS = ["#ffcc80", "#ffb74d", "#eceff1", "#ffe0b2"];
    var CONTAINER_COLORS = [ORANGE, "#29b6f6", "#ffb74d", "#66bb6a", "#ef5350"];

    /* ---------- Illustrations (one per slide) ---------- */
    var SCENES = {

        // steel coils, drums of resin / chemicals, aluminum ingots
        raw: function () {
            var s = shadow(260, 258, 235);
            [70, 165].forEach(function (cx) {
                s += c(cx, 210, 44, "#90a4ae") + c(cx, 210, 31, "#cfd8dc") + c(cx, 210, 14, "#0f2b3a");
            });
            [232, 282].forEach(function (x) {
                s += r(x, 170, 42, 84, ORANGE, 6) + r(x, 190, 42, 6, "rgba(0,0,0,.25)") + r(x, 228, 42, 6, "rgba(0,0,0,.25)");
            });
            function ingot(x, y) {
                return poly((x + 7) + "," + y + " " + (x + 43) + "," + y + " " + (x + 50) + "," + (y + 22) + " " + x + "," + (y + 22), "#eceff1", 'stroke="#90a4ae" stroke-width="1.5"');
            }
            [350, 404, 458].forEach(function (x) { s += ingot(x, 232); });
            [377, 431].forEach(function (x) { s += ingot(x, 210); });
            s += ingot(404, 188);
            return svg(s);
        },

        // factory with conveyor belt and robot arm
        production: function () {
            var s = shadow(260, 258, 235);
            s += r(40, 150, 210, 104, "#1d4457");
            [40, 90, 140, 190].forEach(function (x) { s += poly(x + ",150 " + x + ",120 " + (x + 50) + ",150", "#24566e"); });
            s += r(226, 86, 24, 64, "#2a6079");
            s += c(238, 72, 10, "rgba(255,255,255,.28)") + c(252, 54, 13, "rgba(255,255,255,.22)") + c(268, 34, 16, "rgba(255,255,255,.16)");
            [58, 98, 138, 178].forEach(function (x) { s += r(x, 176, 24, 18, "#ffd180", 2); });
            s += r(214, 214, 26, 40, "#0f2b3a");
            s += r(280, 232, 200, 12, "#455a64", 6);
            [296, 340, 384, 428, 468].forEach(function (x) { s += c(x, 238, 5, "#90a4ae"); });
            s += r(296, 206, 26, 26, ORANGE, 2) + r(346, 206, 26, 26, "#ffb74d", 2);
            s += r(460, 214, 22, 18, "#37474f", 3);
            s += line(471, 214, 471, 176, ORANGE, 8) + line(471, 176, 430, 150, ORANGE, 8) + c(471, 176, 7, "#ffcc80");
            s += r(418, 146, 24, 8, "#cfd8dc", 2) + r(420, 154, 20, 18, "#ffb74d", 2);
            return svg(s);
        },

        // warehouse racks full of boxes
        inventory: function () {
            var s = r(30, 60, 460, 194, "#1d4457", 10);
            [128, 176, 224].forEach(function (shelfY, row) {
                for (var bay = 0; bay < 3; bay++) {
                    var x = 62 + bay * 146;
                    for (var k = 0; k < 3; k++) {
                        var w = 34 + ((bay + k + row) % 3) * 6;
                        var h = 26 + ((bay * 2 + k + row) % 3) * 6;
                        s += r(x + k * 42, shelfY - h, w, h, BOX_COLORS[(bay + k + row) % BOX_COLORS.length], 2);
                    }
                }
                s += r(50, shelfY, 444, 6, ORANGE);
            });
            [50, 196, 342, 488].forEach(function (x) { s += r(x, 80, 6, 174, "#37474f"); });
            s += r(30, 254, 460, 6, "#263238");
            return svg(s);
        },

        // truck, van and motorcycle courier on the road
        land: function () {
            var s = r(0, 252, 520, 44, "#263238");
            for (var x = 10; x < 520; x += 60) s += r(x, 272, 30, 4, "#90a4ae");

            // cargo truck
            s += r(40, 150, 150, 92, "#eceff1", 6) + r(40, 190, 150, 10, ORANGE);
            s += poly("190,176 232,176 252,206 252,242 190,242", ORANGE);
            s += poly("198,184 228,184 242,206 198,206", "#b3e5fc");
            [80, 130, 218].forEach(function (cx) { s += c(cx, 244, 14, "#1b2a33") + c(cx, 244, 6, "#90a4ae"); });

            // delivery van
            s += r(292, 196, 100, 46, "#eceff1", 8) + poly("392,206 420,206 436,226 436,242 392,242", "#eceff1");
            s += poly("398,212 418,212 428,226 398,226", "#b3e5fc") + r(292, 220, 100, 6, ORANGE);
            [318, 410].forEach(function (cx) { s += c(cx, 244, 12, "#1b2a33") + c(cx, 244, 5, "#90a4ae"); });

            // motorcycle courier
            s += '<circle cx="462" cy="246" r="12" fill="none" stroke="#cfd8dc" stroke-width="3"/>';
            s += '<circle cx="500" cy="246" r="12" fill="none" stroke="#cfd8dc" stroke-width="3"/>';
            s += '<path d="M462 246 L478 224 L496 224 L500 246" stroke="' + ORANGE + '" stroke-width="4" fill="none" stroke-linejoin="round"/>';
            s += r(474, 218, 18, 6, "#cfd8dc", 2) + r(446, 214, 20, 18, "#ffb74d", 2) + line(496, 224, 502, 212, "#cfd8dc", 3);
            return svg(s);
        },

        // container ship and cargo plane
        seaair: function () {
            var s = r(0, 236, 520, 100, "#0b4f6c");
            for (var x = 0; x < 520; x += 40) {
                s += '<path d="M' + x + ' 242 q10 -8 20 0 t20 0" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>';
            }
            // ship hull + containers + bridge
            s += poly("70,214 330,214 308,252 98,252", "#263238") + poly("80,226 320,226 314,234 86,234", ORANGE);
            for (var i = 0; i < 6; i++) s += r(90 + i * 34, 190, 32, 24, CONTAINER_COLORS[i % CONTAINER_COLORS.length], 2);
            for (var j = 0; j < 4; j++) s += r(108 + j * 34, 166, 32, 24, CONTAINER_COLORS[(j + 2) % CONTAINER_COLORS.length], 2);
            s += r(298, 160, 28, 54, "#eceff1", 2) + r(302, 168, 20, 6, "#29506a");
            // cargo plane
            s += '<g transform="translate(300,40)">' +
                line(-60, 52, 60, 52, "rgba(255,255,255,.35)", 3) +
                poly("70,44 112,44 62,94 40,94", "#cfd8dc") +
                poly("76,34 108,34 74,0 54,0", "#b0bec5") +
                '<ellipse cx="100" cy="40" rx="72" ry="13" fill="#eceff1"/>' +
                poly("10,38 -2,10 18,10 38,34", ORANGE) +
                c(158, 38, 6, "#29b6f6") + c(130, 38, 3, "#90a4ae") + c(116, 38, 3, "#90a4ae") + c(102, 38, 3, "#90a4ae") +
                "</g>";
            return svg(s);
        }
    };

    /* ---------- Slides (steps match the "Supply Chain Flow" section; times match the order form) ---------- */
    var SLIDES = [
        {
            scene: "raw", bg: ["#143b52", "#0a1f2b"],
            step: "01 \u00b7 RAW MATERIALS",
            title: "Sourced from verified suppliers",
            text: "Steel, aluminum, resins and chemicals arrive from our Raw Materials partners and are logged on receipt.",
            chips: ["BASF", "ArcelorMittal", "Alcoa", "Dow"]
        },
        {
            scene: "production", bg: ["#1b4a63", "#0a1f2b"],
            step: "02 \u00b7 PRODUCTION",
            title: "From materials to finished goods",
            text: "Materials move through production, and each product is tracked until it is ready for storage.",
            chips: ["Assembly", "Quality check", "Packing"]
        },
        {
            scene: "inventory", bg: ["#16384a", "#08181f"],
            step: "03 \u00b7 INVENTORY",
            title: "Know what is in stock",
            text: "Stock levels are checked for every product, and low-stock items are flagged so you can order early.",
            chips: ["In Stock", "Low Stock", "Out of Stock"]
        },
        {
            scene: "land", bg: ["#2b5f7a", "#102d38"],
            step: "04 \u00b7 DELIVERY BY ROAD",
            title: "Trucks, vans and couriers",
            text: "Metro Manila and Luzon orders go by road, and you can only book dates that still have open slots.",
            chips: ["Motorcycle \u00b7 same day (Metro Manila)", "Van \u00b7 1\u20132 days", "Truck \u00b7 1\u20133 days"]
        },
        {
            scene: "seaair", bg: ["#4a90b0", "#0a3a52"],
            step: "05 \u00b7 SEA AND AIR FREIGHT",
            title: "Reaching the Visayas and Mindanao",
            text: "Air cargo and sea freight cover inter-island orders. Ships sail Tuesday, Thursday and Saturday; air cargo does not fly on Sundays.",
            chips: ["Air \u00b7 1\u20133 days", "Sea \u00b7 4\u20138 days"]
        }
        // To use a real photo on any slide, add:  photo: "images/warehouse.jpg"
        // (if the file can't load, the illustration is shown instead)
    ];

    /* ---------- Styles ---------- */
    if (!document.getElementById("sliderStyles")) {
        var st = document.createElement("style");
        st.id = "sliderStyles";
        st.textContent =
            ".image-card.slider{position:relative;overflow:hidden;min-height:360px;background:#0f2b3a}" +
            ".sl-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .8s ease,visibility .8s}" +
            ".sl-slide.active{opacity:1;visibility:visible}" +
            ".sl-art,.sl-art svg,.sl-photo{position:absolute;inset:0;width:100%;height:100%}" +
            ".sl-photo{object-fit:cover}" +
            ".sl-cap{position:absolute;left:0;right:0;bottom:0;padding:64px 22px 22px;color:#fff;" +
                "background:linear-gradient(to top,rgba(8,24,31,.94) 45%,rgba(8,24,31,0))}" +
            ".sl-step{font-size:11px;font-weight:700;letter-spacing:.12em;color:" + ORANGE + "}" +
            ".sl-cap h3{margin:4px 0 6px;font-size:20px;line-height:1.25;color:#fff}" +
            ".sl-cap p{margin:0 0 10px;font-size:13px;line-height:1.5;color:rgba(255,255,255,.85)}" +
            ".sl-chips{display:flex;flex-wrap:wrap;gap:6px}" +
            ".sl-chip{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,.16);color:#fff}" +
            ".sl-btn{position:absolute;top:38%;z-index:3;width:34px;height:34px;border:0;border-radius:50%;" +
                "background:rgba(255,255,255,.2);color:#fff;font-size:18px;line-height:1;cursor:pointer;backdrop-filter:blur(4px)}" +
            ".sl-btn:hover{background:rgba(255,255,255,.35)}" +
            ".sl-prev{left:12px}.sl-next{right:12px}" +
            ".sl-dots{position:absolute;top:14px;right:16px;z-index:3;display:flex;gap:6px}" +
            ".sl-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.45);cursor:pointer}" +
            ".sl-dot.active{width:22px;border-radius:8px;background:" + ORANGE + "}" +
            "@media (prefers-reduced-motion:reduce){.sl-slide{transition:none}}";
        document.head.appendChild(st);
    }

    /* ---------- Build ---------- */
    card.innerHTML = "";
    card.classList.add("slider");
    card.setAttribute("role", "region");
    card.setAttribute("aria-roledescription", "carousel");
    card.setAttribute("aria-label", "Supply chain overview");

    var slideEls = [];
    var dotEls = [];

    SLIDES.forEach(function (s, i) {
        var el = document.createElement("div");
        el.className = "sl-slide" + (i === 0 ? " active" : "");
        el.style.background = "linear-gradient(160deg," + s.bg[0] + "," + s.bg[1] + ")";
        el.setAttribute("role", "group");
        el.setAttribute("aria-label", (i + 1) + " of " + SLIDES.length + ": " + s.title);

        var art = document.createElement("div");
        art.className = "sl-art";
        art.innerHTML = SCENES[s.scene]();
        el.appendChild(art);

        if (s.photo) {
            var img = new Image();
            img.className = "sl-photo";
            img.alt = s.title;
            img.style.display = "none";
            img.onload = function () { art.style.display = "none"; img.style.display = "block"; };
            img.src = s.photo;
            el.appendChild(img);
        }

        var cap = document.createElement("div");
        cap.className = "sl-cap";
        var step = document.createElement("div");
        step.className = "sl-step";
        step.textContent = s.step;
        var h3 = document.createElement("h3");
        h3.textContent = s.title;
        var p = document.createElement("p");
        p.textContent = s.text;
        var chips = document.createElement("div");
        chips.className = "sl-chips";
        s.chips.forEach(function (t) {
            var chip = document.createElement("span");
            chip.className = "sl-chip";
            chip.textContent = t;
            chips.appendChild(chip);
        });
        cap.appendChild(step);
        cap.appendChild(h3);
        cap.appendChild(p);
        cap.appendChild(chips);
        el.appendChild(cap);

        card.appendChild(el);
        slideEls.push(el);
    });

    function button(cls, label, text) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.setAttribute("aria-label", label);
        if (text) b.textContent = text;
        return b;
    }

    var prevBtn = button("sl-btn sl-prev", "Previous slide", "\u2039");
    var nextBtn = button("sl-btn sl-next", "Next slide", "\u203a");
    var dots = document.createElement("div");
    dots.className = "sl-dots";
    SLIDES.forEach(function (s, i) {
        var d = button("sl-dot" + (i === 0 ? " active" : ""), "Go to slide " + (i + 1));
        d.addEventListener("click", function () { go(i); restart(); });
        dots.appendChild(d);
        dotEls.push(d);
    });
    card.appendChild(prevBtn);
    card.appendChild(nextBtn);
    card.appendChild(dots);

    /* ---------- Behaviour ---------- */
    var index = 0;
    var timer = null;
    var held = false; // hovering or focused
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(n) {
        slideEls[index].classList.remove("active");
        dotEls[index].classList.remove("active");
        index = (n + SLIDES.length) % SLIDES.length;
        slideEls[index].classList.add("active");
        dotEls[index].classList.add("active");
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() {
        stop();
        if (reduced || held || document.hidden) return;
        timer = setInterval(function () { go(index + 1); }, INTERVAL);
    }
    function restart() { start(); }

    prevBtn.addEventListener("click", function () { go(index - 1); restart(); });
    nextBtn.addEventListener("click", function () { go(index + 1); restart(); });

    card.addEventListener("mouseenter", function () { held = true; stop(); });
    card.addEventListener("mouseleave", function () { held = false; start(); });
    card.addEventListener("focusin", function () { held = true; stop(); });
    card.addEventListener("focusout", function () { held = false; start(); });
    document.addEventListener("visibilitychange", start);

    // swipe on touch screens
    var touchX = null;
    card.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    card.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });

    start();
})();