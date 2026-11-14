// suppliers.js - load on suppliers.html AFTER script.js and user.js
(function () {
    "use strict";

    /* ---------- Supplier data (edit this list to add or change suppliers) ----------
       Each supplier has exactly three supplies. "lead" = average delivery time in days.
       Logos are loaded from the supplier's domain; if one can't load, initials are shown. */
    var SUPPLIERS = [
        { name: "Samsung Electronics", domain: "samsung.com",       category: "Electronics",   country: "South Korea",   lead: 4, supplies: ["Solid State Drives", "Monitors", "Memory Cards"] },
        { name: "Logitech",            domain: "logitech.com",      category: "Electronics",   country: "Switzerland",   lead: 3, supplies: ["Wireless Mice", "Keyboards", "Webcams"] },
        { name: "Lenovo",              domain: "lenovo.com",        category: "Electronics",   country: "China",         lead: 5, supplies: ["Laptops", "Desktop PCs", "Tablets"] },
        { name: "Anker",               domain: "anker.com",         category: "Electronics",   country: "China",         lead: 3, supplies: ["USB-C Hubs", "Chargers", "Power Banks"] },

        { name: "Smurfit Westrock",    domain: "smurfitwestrock.com", category: "Packaging",   country: "Ireland",       lead: 4, supplies: ["Corrugated Boxes", "Folding Cartons", "Paper Packaging"] },
        { name: "Sealed Air",          domain: "sealedair.com",     category: "Packaging",     country: "United States", lead: 3, supplies: ["Bubble Wrap", "Protective Mailers", "Foam Packaging"] },
        { name: "Amcor",               domain: "amcor.com",         category: "Packaging",     country: "Switzerland",   lead: 5, supplies: ["Plastic Films", "Flexible Pouches", "Rigid Containers"] },
        { name: "Uline",               domain: "uline.com",         category: "Packaging",     country: "United States", lead: 2, supplies: ["Shipping Boxes", "Packing Tape", "Poly Bags"] },

        { name: "BASF",                domain: "basf.com",          category: "Raw Materials", country: "Germany",       lead: 7, supplies: ["Industrial Chemicals", "Plastic Resins", "Coatings"] },
        { name: "ArcelorMittal",       domain: "arcelormittal.com", category: "Raw Materials", country: "Luxembourg",    lead: 8, supplies: ["Steel Sheets", "Steel Coils", "Wire Rod"] },
        { name: "Alcoa",               domain: "alcoa.com",         category: "Raw Materials", country: "United States", lead: 6, supplies: ["Aluminum Ingots", "Aluminum Sheets", "Alumina"] },
        { name: "Dow",                 domain: "dow.com",           category: "Raw Materials", country: "United States", lead: 6, supplies: ["Polyethylene Resin", "Polypropylene Resin", "Silicones"] }
    ];

    var tbody = document.querySelector("#suppliersTable tbody");
    var pop = document.getElementById("supPop");
    var modal = document.getElementById("supModal");
    var modalBody = document.getElementById("supModalBody");
    var byDomain = {};
    SUPPLIERS.forEach(function (s) { byDomain[s.domain] = s; });

    function siteUrl(s) { return "https://" + s.domain; }
    function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }

    function initials(name) {
        return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
    }

    function logo(s, large) {
        var box = document.createElement("span");
        box.className = "sup-logo" + (large ? " lg" : "");
        var img = document.createElement("img");
        img.alt = s.name + " logo";
        img.loading = "lazy";
        img.src = "https://www.google.com/s2/favicons?sz=128&domain_url=" + encodeURIComponent(siteUrl(s));
        img.addEventListener("error", function () { box.textContent = initials(s.name); });
        box.appendChild(img);
        return box;
    }

    function cell(content) {
        var td = document.createElement("td");
        if (typeof content === "string") td.textContent = content;
        else if (content) td.appendChild(content);
        return td;
    }

    /* ---------- Stat cards (calculated, so they always match the list) ---------- */
    function updateStats() {
        var cats = {};
        var total = 0;
        SUPPLIERS.forEach(function (s) { cats[s.category] = true; total += s.lead; });
        var catNames = Object.keys(cats).sort();
        var avg = SUPPLIERS.length ? total / SUPPLIERS.length : 0;
        var avgText = (Math.round(avg * 10) / 10).toString();

        document.getElementById("statSuppliers").textContent = SUPPLIERS.length;
        document.getElementById("statSuppliersNote").textContent = "All verified";
        document.getElementById("statCategories").textContent = catNames.length;
        document.getElementById("statCategoriesNote").textContent = catNames.join(" · ");
        document.getElementById("statLead").textContent = avgText + " days";
        document.getElementById("statLeadNote").textContent = "Average across " + SUPPLIERS.length + " suppliers";
    }

    /* ---------- Table ---------- */
    function render(list) {
        tbody.innerHTML = "";

        if (!list.length) {
            var empty = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = 5;
            td.className = "sup-empty";
            td.textContent = "No suppliers match your search.";
            empty.appendChild(td);
            tbody.appendChild(empty);
            return;
        }

        list.forEach(function (s) {
            var tr = document.createElement("tr");
            tr.dataset.id = s.domain;

            var nameWrap = document.createElement("div");
            nameWrap.className = "sup-cell";
            nameWrap.appendChild(logo(s, false));
            var a = document.createElement("a");
            a.className = "sup-link";
            a.href = siteUrl(s);
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = s.name;
            nameWrap.appendChild(a);

            var tags = document.createElement("div");
            tags.className = "sup-tags";
            s.supplies.forEach(function (item) {
                var t = document.createElement("span");
                t.className = "sup-tag";
                t.textContent = item;
                tags.appendChild(t);
            });

            var badge = document.createElement("span");
            badge.className = "badge green";
            badge.textContent = "Verified";

            tr.appendChild(cell(nameWrap));
            tr.appendChild(cell(tags));
            tr.appendChild(cell(s.country));
            tr.appendChild(cell(plural(s.lead, "day")));
            tr.appendChild(cell(badge));
            tbody.appendChild(tr);
        });
    }

    /* ---------- Search (replaces the generic one from script.js on this page) ---------- */
    var oldSearch = document.getElementById("tableSearch");
    var search = oldSearch.cloneNode(true); // a clone has none of script.js's listeners
    oldSearch.parentNode.replaceChild(search, oldSearch);

    function applySearch() {
        var q = search.value.trim().toLowerCase();
        if (!q) { render(SUPPLIERS); return; }
        render(SUPPLIERS.filter(function (s) {
            var text = [s.name, s.category, s.country, s.supplies.join(" ")].join(" ").toLowerCase();
            return text.indexOf(q) !== -1;
        }));
    }
    search.addEventListener("input", applySearch);

    /* ---------- Hover card with the logo ---------- */
    function showPop(link) {
        var tr = link.closest("tr");
        var s = tr && byDomain[tr.dataset.id];
        if (!s) return;

        pop.innerHTML = "";
        var row = document.createElement("div");
        row.className = "row";
        row.appendChild(logo(s, true));
        var info = document.createElement("div");
        var strong = document.createElement("strong");
        strong.textContent = s.name;
        var small = document.createElement("small");
        small.textContent = s.category + " · " + s.country;
        info.appendChild(strong);
        info.appendChild(small);
        row.appendChild(info);
        pop.appendChild(row);

        var site = document.createElement("div");
        site.className = "site";
        site.textContent = "Visit " + s.domain + " ↗";
        pop.appendChild(site);

        pop.classList.add("show");
        var r = link.getBoundingClientRect();
        var h = pop.offsetHeight;
        var top = r.bottom + 8;
        if (top + h > window.innerHeight - 8) top = r.top - h - 8;
        var left = Math.min(r.left, window.innerWidth - pop.offsetWidth - 12);
        pop.style.top = Math.max(8, top) + "px";
        pop.style.left = Math.max(8, left) + "px";
    }

    function hidePop() { pop.classList.remove("show"); }

    tbody.addEventListener("mouseover", function (e) {
        var link = e.target.closest(".sup-link");
        if (link) showPop(link);
    });
    tbody.addEventListener("mouseout", function (e) {
        if (e.target.closest(".sup-link")) hidePop();
    });
    document.querySelector(".suppliers-scroll").addEventListener("scroll", hidePop);

    /* ---------- Details popup ---------- */
    function openModal(s) {
        modalBody.innerHTML = "";

        var head = document.createElement("div");
        head.className = "sup-head";
        head.appendChild(logo(s, true));
        var text = document.createElement("div");
        var h2 = document.createElement("h2");
        h2.id = "supModalName";
        var link = document.createElement("a");
        link.href = siteUrl(s);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = s.name;
        h2.appendChild(link);
        var p = document.createElement("p");
        p.textContent = s.category + " supplier · " + s.country;
        text.appendChild(h2);
        text.appendChild(p);
        head.appendChild(text);
        modalBody.appendChild(head);

        var facts = document.createElement("div");
        facts.className = "sup-facts";
        [["Lead time", plural(s.lead, "day")], ["Status", "Verified"], ["Items supplied", String(s.supplies.length)]].forEach(function (f) {
            var d = document.createElement("div");
            d.className = "sup-fact";
            d.textContent = f[0];
            var strong = document.createElement("strong");
            strong.textContent = f[1];
            d.appendChild(strong);
            facts.appendChild(d);
        });
        modalBody.appendChild(facts);

        var h4 = document.createElement("h4");
        h4.textContent = "Supplies";
        modalBody.appendChild(h4);
        var ul = document.createElement("ul");
        ul.className = "sup-supplies";
        s.supplies.forEach(function (item) {
            var li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });
        modalBody.appendChild(ul);

        var actions = document.createElement("div");
        actions.className = "sup-actions";
        var visit = document.createElement("a");
        visit.className = "primary";
        visit.href = siteUrl(s);
        visit.target = "_blank";
        visit.rel = "noopener noreferrer";
        visit.textContent = "Visit website ↗";
        var browse = document.createElement("a");
        browse.className = "secondary";
        browse.href = "inventory.html";
        browse.textContent = "Browse products";
        actions.appendChild(visit);
        actions.appendChild(browse);
        modalBody.appendChild(actions);

        hidePop();
        modal.classList.add("open");
    }

    function closeModal() { modal.classList.remove("open"); }

    document.getElementById("supClose").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

    // Runs first (window, capture phase) so script.js's generic "Record Details" popup never opens
    window.addEventListener("click", function (e) {
        var tr = e.target.closest ? e.target.closest("#suppliersTable tbody tr") : null;
        if (!tr) return;
        e.stopImmediatePropagation();
        if (e.target.closest("a")) return; // let the company link open normally
        var s = byDomain[tr.dataset.id];
        if (s) openModal(s);
    }, true);

    updateStats();
    render(SUPPLIERS);
})();