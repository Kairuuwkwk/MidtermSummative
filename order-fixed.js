// order-enhance.js
// Load on inventory.html AFTER script.js, product-details.js and order-autofill.js:
//   <script src="order-enhance.js"></script>
//
// What it does to the order form:
//  1. Province -> City/Municipality -> Barangay become dependent dropdowns
//     (data from the free PSGC API, so it needs an internet connection).
//  2. Adds a Courier dropdown (same options as Find Shipments), filtered by the
//     product's category and by what can actually reach the chosen province.
//  3. Preferred delivery date becomes a dropdown that lists ONLY dates where the
//     chosen courier has open slots and the lead time has passed.
(function () {
    "use strict";

    var API = "https://psgc.gitlab.io/api";
    var NCR = { code: "NCR", name: "Metro Manila (NCR)", regionCode: "130000000" };

    /* ---------- Delivery rules (same availability logic as index.html) ---------- */

    var CATEGORY_MODES = {
        "All Categories": ["truck", "van", "air", "sea", "moto"],
        "Raw Materials": ["truck", "sea", "air"],
        "Electronics": ["van", "air", "truck", "moto"],
        "Packaging": ["van", "truck", "moto"]
    };

    // lead = days needed from our Metro Manila warehouse, per zone.
    // A zone that is missing means the courier cannot serve that area.
    var COURIERS = [
        { id: "moto",  name: "Motorcycle Courier", icon: "🛵", lead: { ncr: 0 } },
        { id: "van",   name: "Delivery Van",       icon: "🚐", lead: { ncr: 1, luzon: 2 } },
        { id: "truck", name: "Cargo Truck",        icon: "🚚", lead: { ncr: 1, luzon: 3 } },
        { id: "air",   name: "Air Cargo",          icon: "✈️", lead: { ncr: 1, luzon: 2, visayas: 2, mindanao: 3 } },
        { id: "sea",   name: "Sea Freight",        icon: "🚢", lead: { luzon: 4, visayas: 6, mindanao: 8 } }
    ];

    var ZONE_LABEL = { ncr: "Metro Manila", luzon: "Luzon", visayas: "the Visayas", mindanao: "Mindanao" };
    var VISAYAS = ["06", "07", "08", "18"];
    var MINDANAO = ["09", "10", "11", "12", "15", "16"];

    function islandGroup(regionCode) {
        var p = String(regionCode || "").slice(0, 2);
        if (p === "13") return "ncr";
        if (VISAYAS.indexOf(p) !== -1) return "visayas";
        if (MINDANAO.indexOf(p) !== -1) return "mindanao";
        return "luzon";
    }

    function pad(n) { return String(n).padStart(2, "0"); }
    function toIso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function fromIso(s) {
        var p = s.split("-");
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }
    function shortDate(d) { return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }); }
    function longDate(d) {
        return d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }

    var MAX_ISO = (new Date().getFullYear() + 1) + "-12-31";

    function hash(text) {
        var h = 0;
        for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
        return h;
    }

    // identical to the function in index.html, so both pages agree
    function availability(dateStr, modeId) {
        var day = fromIso(dateStr).getDay();
        if (modeId === "air" && day === 0) return { slots: 0, kind: "none" };
        if (modeId === "sea" && day !== 2 && day !== 4 && day !== 6) return { slots: 0, kind: "none" };
        var slots = hash(dateStr + "|" + modeId) % 9;
        if (slots === 0) return { slots: 0, kind: "full" };
        if (slots <= 3) return { slots: slots, kind: "low" };
        return { slots: slots, kind: "open" };
    }

    function availableDates(courierId, leadDays, limit) {
        var out = [];
        var now = new Date();
        for (var i = leadDays; i <= leadDays + 120 && out.length < limit; i++) {
            var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            var iso = toIso(d);
            if (iso > MAX_ISO) break;
            var a = availability(iso, courierId);
            if (a.slots > 0) out.push({ iso: iso, date: d, slots: a.slots, kind: a.kind });
        }
        return out;
    }

    /* ---------- Philippine address data (PSGC API) ---------- */

    var cache = {};
    function getJson(path) {
        if (!cache[path]) {
            cache[path] = fetch(API + path).then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            }).catch(function (err) {
                delete cache[path];
                throw err;
            });
        }
        return cache[path];
    }

    function byName(a, b) { return a.name.localeCompare(b.name, "en", { numeric: true }); }

    /* ---------- DOM helpers ---------- */

    var category = "All Categories";
    var current = null; // the form controls currently enhanced

    // remember which product category was clicked (read from the Category column)
    document.addEventListener("click", function (e) {
        var row = e.target.closest ? e.target.closest("#productsTable tr") : null;
        if (!row || !row.cells || row.cells.length < 2) return;
        var text = row.cells[1].textContent.trim();
        category = CATEGORY_MODES[text] ? text : "All Categories";
    }, true);

    function findField(re) {
        var labels = document.querySelectorAll("label");
        for (var i = 0; i < labels.length; i++) {
            var l = labels[i];
            if (!re.test(l.textContent.trim())) continue;
            var ctl = l.htmlFor ? document.getElementById(l.htmlFor) : null;
            if (!ctl) ctl = l.querySelector("input,select,textarea");
            if (!ctl && l.nextElementSibling && l.nextElementSibling.matches("input,select,textarea")) ctl = l.nextElementSibling;
            if (!ctl && l.parentElement) ctl = l.parentElement.querySelector("input,select,textarea");
            if (ctl) return { label: l, control: ctl };
        }
        return null;
    }

    // the element that holds one label + one control (used for moving / inserting)
    function wrapperOf(f) {
        var a = f.label;
        while (a && !a.contains(f.control)) a = a.parentElement;
        if (!a || a.querySelectorAll("input,select,textarea").length > 1) return null;
        return a;
    }

    function swapNodes(a, b) {
        var marker = document.createComment("");
        a.parentNode.insertBefore(marker, a);
        b.parentNode.insertBefore(a, b);
        marker.parentNode.insertBefore(b, marker);
        marker.remove();
    }

    function setOptions(sel, placeholder, items) {
        sel.innerHTML = "";
        var first = document.createElement("option");
        first.value = "";
        first.textContent = placeholder;
        sel.appendChild(first);
        items.forEach(function (it) {
            var op = document.createElement("option");
            op.value = it.value;
            op.textContent = it.label;
            if (it.code) op.dataset.code = it.code;
            if (it.region) op.dataset.region = it.region;
            if (it.disabled) op.disabled = true;
            sel.appendChild(op);
        });
        sel.disabled = items.length === 0;
    }

    function toSelect(f, placeholder) {
        var old = f.control;
        if (old.tagName === "SELECT") return old;
        var s = document.createElement("select");
        s.id = old.id;
        s.name = old.name;
        s.className = old.className;
        s.required = old.required;
        setOptions(s, placeholder, []);
        old.parentNode.replaceChild(s, old);
        return s;
    }

    function makeHint(parent) {
        var h = document.createElement("small");
        h.className = "order-hint";
        parent.appendChild(h);
        return h;
    }

    function setHint(h, text, warn) {
        h.textContent = text || "";
        h.classList.toggle("warn", !!warn);
    }

    (function addStyles() {
        var st = document.createElement("style");
        st.textContent =
            ".order-hint{display:block;margin-top:5px;font-size:12px;color:#666;line-height:1.4}" +
            ".order-hint.warn{color:#b53b3b}";
        document.head.appendChild(st);
    })();

    /* ---------- Main ---------- */

    function enhance() {
        if (document.getElementById("orderCourier")) return;

        var fProv = findField(/^province/i);
        var fCity = findField(/^city/i);
        var fBrgy = findField(/^barangay/i);
        var fDate = findField(/delivery date/i);
        if (!fProv || !fCity || !fBrgy || !fDate) return;

        var wProv = wrapperOf(fProv);
        var wBrgy = wrapperOf(fBrgy);
        var wDate = wrapperOf(fDate);
        if (!wDate) return;

        var fZip = findField(/^zip/i);
        var fNotes = findField(/^notes/i);

        var provSel = toSelect(fProv, "Select province");
        var citySel = toSelect(fCity, "Select province first");
        var brgySel = toSelect(fBrgy, "Select city first");
        var dateSel = toSelect(fDate, "Select courier first");
        dateSel.disabled = true;

        // Province first, then City, then Barangay
        if (wProv && wBrgy && wProv.parentNode === wBrgy.parentNode) swapNodes(wBrgy, wProv);

        // ZIP: digits only
        if (fZip && fZip.control.tagName === "INPUT") {
            fZip.control.maxLength = 4;
            fZip.control.inputMode = "numeric";
            fZip.control.addEventListener("input", function () {
                fZip.control.value = fZip.control.value.replace(/\D/g, "").slice(0, 4);
            });
        }

        // Courier field (full width, above the delivery date)
        var cWrap = document.createElement("div");
        cWrap.className = wDate.className;
        cWrap.style.gridColumn = "1 / -1";
        var cLabel = document.createElement("label");
        cLabel.className = fDate.label.className;
        cLabel.htmlFor = "orderCourier";
        cLabel.textContent = "Courier / delivery type";
        var cSel = document.createElement("select");
        cSel.id = "orderCourier";
        cSel.name = "courier";
        cSel.className = dateSel.className;
        cSel.required = true;
        setOptions(cSel, "Select province first", []);
        cWrap.appendChild(cLabel);
        cWrap.appendChild(cSel);
        var cHint = makeHint(cWrap);
        wDate.parentNode.insertBefore(cWrap, wDate);

        var dHint = makeHint(wDate);

        current = { prov: provSel, city: citySel, brgy: brgySel, courier: cSel, date: dateSel, notes: fNotes && fNotes.control, hint: cHint };

        function zone() {
            if (!provSel.value) return null;
            return islandGroup(provSel.options[provSel.selectedIndex].dataset.region);
        }

        function refreshDates() {
            var id = cSel.value;
            var z = zone();
            if (!id || !z) {
                setOptions(dateSel, "Select courier first", []);
                setHint(dHint, "");
                return;
            }
            var c = COURIERS.filter(function (x) { return x.id === id; })[0];
            var lead = c.lead[z];
            var dates = availableDates(id, lead, 30);
            var items = dates.map(function (d) {
                return { value: d.iso, label: longDate(d.date) + " — " + (d.kind === "low" ? d.slots + " left" : d.slots + " slots") };
            });
            setOptions(dateSel, items.length ? "Select delivery date" : "No dates available", items);
            if (items.length) {
                setHint(dHint, "Only dates with open " + c.name + " capacity are listed. Lead time: " + (lead === 0 ? "same day" : lead + (lead === 1 ? " day" : " days")) + ".");
            } else {
                setHint(dHint, "No open " + c.name + " slots in the booking window. Try another courier.", true);
            }
        }

        function refreshCouriers() {
            var z = zone();
            var prev = cSel.value;
            if (!z) {
                setOptions(cSel, "Select province first", []);
                setHint(cHint, "");
                refreshDates();
                return;
            }
            var ids = CATEGORY_MODES[category] || CATEGORY_MODES["All Categories"];
            var items = COURIERS.filter(function (c) { return ids.indexOf(c.id) !== -1; }).map(function (c) {
                var lead = c.lead[z];
                if (lead === undefined) {
                    return { value: c.id, label: c.icon + " " + c.name + " — not available for this area", disabled: true };
                }
                var first = availableDates(c.id, lead, 1)[0];
                return {
                    value: c.id,
                    label: c.icon + " " + c.name + (first ? " — earliest " + shortDate(first.date) : " — fully booked"),
                    disabled: !first
                };
            });
            setOptions(cSel, "Select courier", items);
            Array.prototype.forEach.call(cSel.options, function (o) {
                if (o.value === prev && !o.disabled) cSel.value = prev;
            });
            setHint(cHint, "Ships from our Metro Manila warehouse to " + ZONE_LABEL[z] + ". Options depend on the product category and destination.");
            refreshDates();
        }

        cSel.addEventListener("change", refreshDates);

        provSel.addEventListener("change", function () {
            setOptions(citySel, "Select province first", []);
            setOptions(brgySel, "Select city first", []);
            var opt = provSel.options[provSel.selectedIndex];
            if (provSel.value) {
                var code = opt.dataset.code;
                var path = code === NCR.code
                    ? "/regions/" + NCR.regionCode + "/cities-municipalities.json"
                    : "/provinces/" + code + "/cities-municipalities.json";
                setOptions(citySel, "Loading…", []);
                getJson(path).then(function (list) {
                    if (provSel.value !== opt.value) return;
                    var items = list.slice().sort(byName).map(function (c) {
                        return { value: c.name, label: c.name, code: c.code };
                    });
                    setOptions(citySel, "Select city / municipality", items);
                }).catch(function () {
                    setOptions(citySel, "Could not load — check internet", []);
                });
            }
            refreshCouriers();
        });

        citySel.addEventListener("change", function () {
            setOptions(brgySel, "Select city first", []);
            if (!citySel.value) return;
            var opt = citySel.options[citySel.selectedIndex];
            setOptions(brgySel, "Loading…", []);
            getJson("/cities-municipalities/" + opt.dataset.code + "/barangays.json").then(function (list) {
                if (citySel.value !== opt.value) return;
                var items = list.slice().sort(byName).map(function (b) {
                    return { value: b.name, label: b.name, code: b.code };
                });
                setOptions(brgySel, "Select barangay", items);
            }).catch(function () {
                setOptions(brgySel, "Could not load — check internet", []);
            });
        });

        getJson("/provinces.json").then(function (list) {
            var items = list.slice().sort(byName).map(function (p) {
                return { value: p.name, label: p.name, code: p.code, region: p.regionCode };
            });
            items.unshift({ value: NCR.name, label: NCR.name, code: NCR.code, region: NCR.regionCode });
            setOptions(provSel, "Select province", items);
        }).catch(function () {
            setOptions(provSel, "Could not load — check internet", []);
            setHint(cHint, "The Philippine address list could not be loaded. Check your internet connection and refresh.", true);
        });
    }

    // Block the order if the new fields are incomplete, and save the courier with the order notes
    document.addEventListener("submit", function (e) {
        if (!current || !current.courier.isConnected || !e.target.contains || !e.target.contains(current.courier)) return;

        var missing = [];
        if (!current.prov.value) missing.push("province");
        if (!current.city.value) missing.push("city / municipality");
        if (!current.brgy.value) missing.push("barangay");
        if (!current.courier.value) missing.push("courier");
        if (!current.date.value) missing.push("delivery date");

        if (missing.length) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setHint(current.hint, "Please choose: " + missing.join(", ") + ".", true);
            current.courier.scrollIntoView({ block: "center" });
            return;
        }

        if (current.notes) {
            var name = current.courier.options[current.courier.selectedIndex].textContent.split(" — ")[0];
            if (!/^Courier:/.test(current.notes.value)) {
                current.notes.value = "Courier: " + name + (current.notes.value ? "\n" + current.notes.value : "");
            }
        }
    }, true);

    // The order form is built by JavaScript, so watch for it to appear
    var queued = false;
    new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
            queued = false;
            try { enhance(); } catch (err) { console.error("order-enhance:", err); }
        });
    }).observe(document.body, { childList: true, subtree: true });

    enhance();
})();