// admin.js - load on admin.html AFTER script.js
function adminInit() {
    "use strict";

    /* ---------- Settings ---------- */
    var LOW_STOCK_LEVEL = 5; // "Low Stock" means 1 to this many units. Keep in step with the inventory page.
    var STATUSES = ["Processing", "In Transit", "Delivered"];

    // Suggested supplier per product (same suppliers and lead times as suppliers.html)
    var SUPPLIER_HINTS = [
        { re: /laptop|notebook|tablet|desktop/i, name: "Lenovo", lead: 5 },
        { re: /mouse|keyboard|webcam/i, name: "Logitech", lead: 3 },
        { re: /hub|charger|power ?bank|cable|usb/i, name: "Anker", lead: 3 },
        { re: /ssd|drive|monitor|memory/i, name: "Samsung Electronics", lead: 4 },
        { re: /alumin/i, name: "Alcoa", lead: 6 },
        { re: /iron|steel|coil|wire/i, name: "ArcelorMittal", lead: 8 },
        { re: /wrap|foam|mailer/i, name: "Sealed Air", lead: 3 },
        { re: /box|carton|tape|bag/i, name: "Uline", lead: 2 }
    ];
    var CATEGORY_SUPPLIER = {
        "Electronics": { name: "Samsung Electronics", lead: 4 },
        "Accessories": { name: "Logitech", lead: 3 },
        "Packaging": { name: "Uline", lead: 2 },
        "Raw Materials": { name: "BASF", lead: 7 }
    };

    /* ---------- Helpers ---------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function money(n) { return "\u20b1" + Number(n || 0).toLocaleString("en-PH"); }
    function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
    function toast(msg, type) { if (typeof showToast === "function") showToast(msg, type); }
    function log(action, details) { if (typeof logActivity === "function") logActivity(action, details); }

    function download(name, mime, text) {
        var blob = new Blob([text], { type: mime });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    }

    function stockInfo(stock) {
        stock = Number(stock) || 0;
        if (stock <= 0) return { cls: "out", label: "Out of Stock" };
        if (stock <= LOW_STOCK_LEVEL) return { cls: "low", label: "Low Stock" };
        return { cls: "in", label: "In Stock" };
    }

    function statusClass(status) {
        if (status === "Delivered") return "in";
        if (status === "In Transit") return "info";
        return "low";
    }

    function supplierFor(product) {
        for (var i = 0; i < SUPPLIER_HINTS.length; i++) {
            if (SUPPLIER_HINTS[i].re.test(product.name)) return SUPPLIER_HINTS[i];
        }
        return CATEGORY_SUPPLIER[product.category] || null;
    }

    /* ---------- Tabs (remembers the tab in the address, e.g. admin.html#orders) ---------- */
    var tabs = $all(".admin-tab");
    var panels = $all(".admin-panel");

    function showTab(name) {
        var id = String(name || "").indexOf("panel-") === 0 ? name : "panel-" + name;
        if (!document.getElementById(id)) id = "panel-overview";
        tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.tab === id); });
        panels.forEach(function (p) { p.classList.toggle("active", p.id === id); });
        try { history.replaceState(null, "", "#" + id.replace("panel-", "")); } catch (e) { /* ignore */ }
    }

    tabs.forEach(function (t) { t.addEventListener("click", function () { showTab(t.dataset.tab); }); });
    showTab(location.hash ? location.hash.slice(1) : "overview");

    var data = window.SynchroData;
    var knownOrderIds = data ? (data.getOrders() || []).map(function (o) { return String(o.id); }) : [];

    /* =========================================================
       PRODUCTS, ORDERS AND OVERVIEW (need window.SynchroData)
    ========================================================= */
    var renderProducts = function () {};
    var renderOrders = function () {};
    var renderOverview = function () {};

    if (data) {

        /* ---------- Overview ---------- */
        renderOverview = function () {
            var products = data.getProducts() || [];
            var orders = data.getOrders() || [];

            var sales = 0;
            var counts = { "Processing": 0, "In Transit": 0, "Delivered": 0 };
            orders.forEach(function (o) {
                sales += Number(o.amount) || 0;
                counts[o.status] = (counts[o.status] || 0) + 1;
            });

            var low = products.filter(function (p) { return p.stock > 0 && p.stock <= LOW_STOCK_LEVEL; });
            var out = products.filter(function (p) { return !(p.stock > 0); });

            setText("ovSales", money(sales));
            setText("ovOrders", orders.length);
            setText("ovOrdersSub", counts["Delivered"] + " delivered");
            setText("ovProcessing", counts["Processing"]);
            setText("ovTransit", counts["In Transit"]);
            setText("ovLow", low.length);
            setText("ovOut", out.length);

            var oc = document.getElementById("tabOrdersCount");
            if (oc) { oc.textContent = counts["Processing"]; oc.hidden = !counts["Processing"]; }
            var pc = document.getElementById("tabProductsCount");
            if (pc) { pc.textContent = low.length + out.length; pc.hidden = !(low.length + out.length); }

            // Orders waiting to ship
            var waiting = orders.filter(function (o) { return o.status === "Processing"; });
            var waitEl = document.getElementById("ovWaiting");
            if (waitEl) {
                waitEl.innerHTML = waiting.length ? "" : "<div class='attn-empty'>No orders are waiting to ship.</div>";
                waiting.slice(0, 5).forEach(function (o) {
                    var row = document.createElement("div");
                    row.className = "attn-item";
                    row.innerHTML =
                        "<div><strong>" + esc(o.id) + " &middot; " + esc(o.item) + "</strong>" +
                        "<small>" + esc(o.userName) + " &middot; " + money(o.amount) + "</small></div>";
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "btn admin-small-btn";
                    btn.textContent = "Mark in transit";
                    btn.addEventListener("click", function () { setOrderStatus(o.id, "In Transit"); });
                    row.appendChild(btn);
                    waitEl.appendChild(row);
                });
                if (waiting.length > 5) {
                    var more = document.createElement("div");
                    more.className = "attn-item";
                    more.innerHTML = "<small>+ " + (waiting.length - 5) + " more in the Orders tab</small>";
                    waitEl.appendChild(more);
                }
            }

            // Stock alerts
            var alerts = low.concat(out).sort(function (a, b) { return (a.stock || 0) - (b.stock || 0); });
            var stockEl = document.getElementById("ovStock");
            if (stockEl) {
                stockEl.innerHTML = alerts.length ? "" : "<div class='attn-empty'>All products are well stocked.</div>";
                alerts.slice(0, 6).forEach(function (p) {
                    var info = stockInfo(p.stock);
                    var hint = supplierFor(p);
                    var row = document.createElement("div");
                    row.className = "attn-item";
                    row.innerHTML =
                        "<div><strong>" + esc(p.name) + "</strong> <span class='stk " + info.cls + "'>" + info.label + " (" + (p.stock || 0) + ")</span>" +
                        (hint ? "<small>Suggested supplier: <a href='suppliers.html'>" + esc(hint.name) + "</a> &middot; " + hint.lead + "-day lead time</small>" : "") +
                        "</div>";
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "btn admin-small-btn btn-ghost";
                    btn.textContent = "Restock";
                    btn.addEventListener("click", function () {
                        var s = document.getElementById("prodSearch");
                        var f = document.getElementById("prodFilter");
                        if (s) s.value = p.name;
                        if (f) f.value = "";
                        renderProducts();
                        showTab("products");
                    });
                    row.appendChild(btn);
                    stockEl.appendChild(row);
                });
            }

            // Orders by status
            var statusEl = document.getElementById("ovStatusChart");
            if (statusEl) {
                var maxCount = Math.max(1, counts["Processing"], counts["In Transit"], counts["Delivered"]);
                statusEl.innerHTML = STATUSES.map(function (s) {
                    return "<div class='bar-row'><span>" + s + "</span><div class='bar'><i style='width:" + Math.round((counts[s] || 0) / maxCount * 100) + "%'></i></div><b>" + (counts[s] || 0) + "</b></div>";
                }).join("");
            }

            // Sales by category (category looked up from the product list)
            var byCat = {};
            orders.forEach(function (o) {
                var match = products.filter(function (p) { return String(p.name).toLowerCase() === String(o.item).toLowerCase(); })[0];
                var cat = match ? match.category : "Other";
                byCat[cat] = (byCat[cat] || 0) + (Number(o.amount) || 0);
            });
            var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
            var catEl = document.getElementById("ovCategoryChart");
            if (catEl) {
                var maxSales = Math.max(1, byCat[cats[0]] || 1);
                catEl.innerHTML = cats.length ? cats.map(function (c) {
                    return "<div class='bar-row'><span>" + esc(c) + "</span><div class='bar'><i style='width:" + Math.round(byCat[c] / maxSales * 100) + "%'></i></div><b>" + money(byCat[c]) + "</b></div>";
                }).join("") : "<div class='attn-empty'>No sales yet.</div>";
            }

            // Recent orders
            var recent = $("#ovRecentTable tbody");
            if (recent) {
                recent.innerHTML = orders.length ? "" : "<tr class='empty-row'><td colspan='5'>No orders placed yet.</td></tr>";
                orders.slice(0, 5).forEach(function (o) {
                    var tr = document.createElement("tr");
                    tr.innerHTML =
                        "<td>" + esc(o.id) + "</td><td>" + esc(o.userName) + "</td><td>" + esc(o.item) + "</td>" +
                        "<td>" + money(o.amount) + "</td><td><span class='stk " + statusClass(o.status) + "'>" + esc(o.status) + "</span></td>";
                    recent.appendChild(tr);
                });
            }
        };

        /* ---------- Products ---------- */
        var productsBody = $("#adminProductsTable tbody");
        var addProductForm = $("#addProductForm");

        renderProducts = function () {
            if (!productsBody) return;

            var q = (($("#prodSearch") || {}).value || "").trim().toLowerCase();
            var f = ($("#prodFilter") || {}).value || "";
            var products = data.getProducts() || [];

            var list = products.filter(function (p) {
                if (f && stockInfo(p.stock).label !== f) return false;
                return !q || (p.name + " " + p.category).toLowerCase().indexOf(q) !== -1;
            });

            productsBody.innerHTML = "";

            if (!products.length) {
                productsBody.innerHTML = "<tr class='empty-row'><td colspan='6'>No products yet. Add one above.</td></tr>";
                return;
            }
            if (!list.length) {
                productsBody.innerHTML = "<tr class='empty-row'><td colspan='6'>No products match your search.</td></tr>";
                return;
            }

            list.forEach(function (product) {
                var info = stockInfo(product.stock);
                var row = document.createElement("tr");
                row.innerHTML =
                    "<td>" + esc(product.name) + "</td>" +
                    "<td>" + esc(product.category) + "</td>" +
                    "<td><input type='number' min='0' step='1' class='admin-inline-input' data-field='price' value='" + esc(product.price) + "'></td>" +
                    "<td><input type='number' min='0' step='1' class='admin-inline-input' data-field='stock' value='" + esc(product.stock) + "'></td>" +
                    "<td><span class='stk " + info.cls + "'>" + info.label + "</span></td>" +
                    "<td><div class='admin-actions'></div></td>";

                var badge = row.querySelector(".stk");
                var priceInput = row.querySelector("[data-field='price']");
                var stockInput = row.querySelector("[data-field='stock']");

                stockInput.addEventListener("input", function () {
                    var i = stockInfo(stockInput.value);
                    badge.className = "stk " + i.cls;
                    badge.textContent = i.label;
                });

                var saveBtn = document.createElement("button");
                saveBtn.type = "button";
                saveBtn.className = "btn admin-small-btn";
                saveBtn.textContent = "Save";
                saveBtn.addEventListener("click", function () {
                    var fresh = data.getProducts();
                    var target = fresh.find(function (p) { return p.id === product.id; });
                    if (!target) return;

                    target.price = Math.max(0, parseFloat(priceInput.value) || 0);
                    target.stock = Math.max(0, parseInt(stockInput.value, 10) || 0);
                    data.saveProducts(fresh);

                    log("Product Updated", target.name + " set to " + money(target.price) + ", stock " + target.stock);
                    toast("Product updated.");
                    renderProducts();
                    renderOverview();
                });

                var deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "btn admin-small-btn btn-ghost";
                deleteBtn.textContent = "Delete";
                deleteBtn.addEventListener("click", function () {
                    if (!confirm("Delete " + product.name + "?")) return;
                    data.saveProducts(data.getProducts().filter(function (p) { return p.id !== product.id; }));
                    log("Product Deleted", product.name + " was removed.");
                    toast("Product deleted.");
                    renderProducts();
                    renderOverview();
                });

                var actions = row.querySelector(".admin-actions");
                actions.appendChild(saveBtn);
                actions.appendChild(deleteBtn);
                productsBody.appendChild(row);
            });
        };

        if (addProductForm) {
            addProductForm.addEventListener("submit", function (event) {
                event.preventDefault();

                var name = $("#newProductName").value.trim();
                var category = $("#newProductCategory").value.trim();
                var price = parseFloat($("#newProductPrice").value) || 0;
                var stock = parseInt($("#newProductStock").value, 10) || 0;

                if (!name || !category) {
                    toast("Enter a product name and choose a category.", "error");
                    return;
                }

                var products = data.getProducts();
                if (products.some(function (p) { return String(p.name).toLowerCase() === name.toLowerCase(); })) {
                    toast("A product with that name already exists.", "error");
                    return;
                }

                var newId = products.length ? Math.max.apply(null, products.map(function (p) { return p.id; })) + 1 : 1;
                products.push({ id: newId, name: name, category: category, price: price, stock: stock });
                data.saveProducts(products);

                addProductForm.reset();
                log("Product Added", name + " (" + category + ") added with " + stock + " in stock.");
                toast("Product added.");
                renderProducts();
                renderOverview();
            });
        }

        var prodSearch = $("#prodSearch");
        var prodFilter = $("#prodFilter");
        if (prodSearch) prodSearch.addEventListener("input", renderProducts);
        if (prodFilter) prodFilter.addEventListener("change", renderProducts);

        /* ---------- Orders ---------- */
        var ordersBody = $("#adminOrdersTable tbody");

        function orderDate(o) {
            var raw = o.date || o.createdAt || o.orderedAt || o.placedAt || "";
            if (!raw) return "-";
            var d = new Date(raw);
            return isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
        }

        function orderDestination(o) {
            var place = o.destination || o.address || [o.barangay, o.city, o.province].filter(Boolean).join(", ");
            return place || "-";
        }

        function setOrderStatus(id, status) {
            var fresh = data.getOrders();
            var target = fresh.find(function (o) { return String(o.id) === String(id); });
            if (!target) return;

            target.status = status;
            data.saveOrders(fresh);

            log("Order Status Updated", target.id + " (" + target.item + ") set to " + status);
            toast("Order " + target.id + " updated to " + status + ".");
            renderOrders();
            renderOverview();
            refreshUserStats();
        }
        window.adminSetOrderStatus = setOrderStatus;

        renderOrders = function () {
            if (!ordersBody) return;

            var q = (($("#ordSearch") || {}).value || "").trim().toLowerCase();
            var f = ($("#ordFilter") || {}).value || "";
            var orders = data.getOrders() || [];

            var list = orders.filter(function (o) {
                if (f && o.status !== f) return false;
                return !q || [o.id, o.userName, o.userEmail, o.item].join(" ").toLowerCase().indexOf(q) !== -1;
            });

            ordersBody.innerHTML = "";

            if (!orders.length) {
                ordersBody.innerHTML = "<tr class='empty-row'><td colspan='8'>No orders placed yet.</td></tr>";
                return;
            }
            if (!list.length) {
                ordersBody.innerHTML = "<tr class='empty-row'><td colspan='8'>No orders match your search.</td></tr>";
                return;
            }

            list.forEach(function (order) {
                var row = document.createElement("tr");
                row.innerHTML =
                    "<td>" + esc(order.id) + "</td>" +
                    "<td>" + esc(order.userName) + "<br><small>" + esc(order.userEmail) + "</small></td>" +
                    "<td>" + esc(order.item) + "</td>" +
                    "<td>" + esc(orderDate(order)) + "</td>" +
                    "<td>" + money(order.amount) + "</td>" +
                    "<td>" + esc(order.courier || "-") + "</td>" +
                    "<td>" + esc(orderDestination(order)) + "</td>" +
                    "<td></td>";

                var select = document.createElement("select");
                select.className = "admin-inline-select";
                var options = STATUSES.slice();
                if (options.indexOf(order.status) === -1 && order.status) options.push(order.status);
                options.forEach(function (s) {
                    var option = document.createElement("option");
                    option.value = s;
                    option.textContent = s;
                    if (s === order.status) option.selected = true;
                    select.appendChild(option);
                });
                select.addEventListener("change", function () { setOrderStatus(order.id, select.value); });
                row.lastElementChild.appendChild(select);

                row.addEventListener("click", function (e) {
                    if (e.target.closest("select")) return;
                    openOrder(order);
                });

                ordersBody.appendChild(row);
            });
        };

        var ordSearch = $("#ordSearch");
        var ordFilter = $("#ordFilter");
        if (ordSearch) ordSearch.addEventListener("input", renderOrders);
        if (ordFilter) ordFilter.addEventListener("change", renderOrders);

        /* ---------- Order details popup (shows every field the order has) ---------- */
        var modal = document.getElementById("orderModal");
        var modalBody = document.getElementById("orderModalBody");

        function label(key) {
            var text = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
            return text.charAt(0).toUpperCase() + text.slice(1);
        }

        function openOrder(order) {
            if (!modal || !modalBody) return;
            setText("orderModalTitle", "Order " + order.id);
            modalBody.innerHTML = "";

            Object.keys(order).forEach(function (key) {
                var value = order[key];
                if (value === null || value === undefined || value === "") return;
                if (key === "amount") value = money(value);
                else if (typeof value === "object") value = JSON.stringify(value);
                var div = document.createElement("div");
                div.innerHTML = "<dt>" + esc(label(key)) + "</dt><dd>" + esc(value) + "</dd>";
                modalBody.appendChild(div);
            });

            modal.classList.add("open");
        }

        function closeOrder() { if (modal) modal.classList.remove("open"); }

        var closeBtn = document.getElementById("orderModalClose");
        if (closeBtn) closeBtn.addEventListener("click", closeOrder);
        if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) closeOrder(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeOrder(); });

        renderOverview();
        renderProducts();
        renderOrders();
    }

    /* =========================================================
       USERS (table is filled by script.js; this adds columns and search)
    ========================================================= */
    var usersBody = $("#usersTable tbody");
    var userSearch = $("#userSearch");

    function applyUserSearch() {
        if (!usersBody) return;
        var q = ((userSearch || {}).value || "").trim().toLowerCase();
        $all("tr", usersBody).forEach(function (tr) {
            tr.style.display = !q || tr.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
        });
    }

    function enhanceUsers() {
        if (!usersBody) return;
        var orders = data ? (data.getOrders() || []) : [];

        $all("tr", usersBody).forEach(function (tr) {
            if (tr.dataset.enh) return;
            var cells = tr.cells;
            if (cells.length < 2 || cells[0].hasAttribute("colspan")) return;

            var email = (cells[1].textContent || "").trim().toLowerCase();
            var mine = orders.filter(function (o) { return String(o.userEmail || "").toLowerCase() === email; });
            var spent = mine.reduce(function (sum, o) { return sum + (Number(o.amount) || 0); }, 0);

            var c1 = tr.insertCell(-1);
            c1.className = "ext";
            c1.textContent = mine.length;
            var c2 = tr.insertCell(-1);
            c2.className = "ext";
            c2.textContent = money(spent);
            tr.dataset.enh = "1";
        });

        applyUserSearch();
    }

    function refreshUserStats() {
        if (!usersBody) return;
        $all("tr", usersBody).forEach(function (tr) {
            $all(".ext", tr).forEach(function (c) { c.remove(); });
            delete tr.dataset.enh;
        });
        enhanceUsers();
    }

    if (usersBody) {
        new MutationObserver(enhanceUsers).observe(usersBody, { childList: true });
        enhanceUsers();
        if (userSearch) userSearch.addEventListener("input", applyUserSearch);
    }

    /* =========================================================
       ACTIVITY (table is filled by script.js; this adds badges, filters and export)
    ========================================================= */
    var actBody = $("#activityTable tbody");
    var actSearch = $("#actSearch");
    var actFilter = $("#actFilter");

    function actKind(text) {
        var t = text.toLowerCase();
        if (/logout/.test(t)) return "logout";
        if (/login/.test(t)) return "login";
        if (/regist/.test(t)) return "register";
        if (/order/.test(t)) return "order";
        if (/product/.test(t)) return "product";
        return "other";
    }

    function applyActivityFilter() {
        if (!actBody) return;
        var q = ((actSearch || {}).value || "").trim().toLowerCase();
        var kind = (actFilter || {}).value || "";
        var rows = $all("tr", actBody).filter(function (tr) { return tr.dataset.kind; });
        var shown = 0;

        rows.forEach(function (tr) {
            var ok = (!kind || tr.dataset.kind === kind) && (!q || tr.textContent.toLowerCase().indexOf(q) !== -1);
            tr.style.display = ok ? "" : "none";
            if (ok) shown++;
        });

        setText("actCount", rows.length ? "Showing " + shown + " of " + rows.length + " records." : "");
    }

    function decorateActivity() {
        if (!actBody) return;
        $all("tr", actBody).forEach(function (tr) {
            if (tr.dataset.kind || tr.cells.length < 2 || tr.cells[0].hasAttribute("colspan")) return;
            var cell = tr.cells[0];
            var text = cell.textContent.trim();
            var kind = actKind(text);
            cell.innerHTML = "<span class='act " + kind + "'>" + esc(text) + "</span>";
            tr.dataset.kind = kind;
        });
        applyActivityFilter();
    }

    if (actBody) {
        new MutationObserver(decorateActivity).observe(actBody, { childList: true });
        decorateActivity();
        if (actSearch) actSearch.addEventListener("input", applyActivityFilter);
        if (actFilter) actFilter.addEventListener("change", applyActivityFilter);

        var exportBtn = document.getElementById("exportActivity");
        if (exportBtn) {
            exportBtn.addEventListener("click", function () {
                var rows = $all("tr", actBody).filter(function (tr) { return tr.dataset.kind && tr.style.display !== "none"; });
                if (!rows.length) { toast("There is no activity to export.", "error"); return; }

                function csv(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }
                var lines = [["Action", "Details", "Time"].map(csv).join(",")];
                rows.forEach(function (tr) {
                    lines.push([tr.cells[0].textContent, tr.cells[1].textContent, tr.cells[2] ? tr.cells[2].textContent : ""].map(function (t) { return csv(t.trim()); }).join(","));
                });
                download("synchrochain-activity-" + new Date().toISOString().slice(0, 10) + ".csv", "text/csv;charset=utf-8", lines.join("\r\n"));
            });
        }
    }

    /* =========================================================
       SYSTEM: storage info, backup / restore, delete-all-users safety
    ========================================================= */
    function updateStorageInfo() {
        var chars = 0;
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                chars += k.length + (localStorage.getItem(k) || "").length;
            }
            setText("sysStorage", localStorage.length + " items, about " + Math.max(1, Math.round(chars / 1024)) + " KB");
        } catch (e) {
            setText("sysStorage", "Unavailable");
        }
    }
    updateStorageInfo();

    var backupBtn = document.getElementById("backupBtn");
    var restoreBtn = document.getElementById("restoreBtn");
    var restoreFile = document.getElementById("restoreFile");

    if (backupBtn) {
        backupBtn.addEventListener("click", function () {
            var all = {};
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                all[k] = localStorage.getItem(k);
            }
            var payload = { app: "SynchroChain", exportedAt: new Date().toISOString(), data: all };
            download("synchrochain-backup-" + new Date().toISOString().slice(0, 10) + ".json", "application/json", JSON.stringify(payload, null, 2));
            log("Backup Downloaded", "A data backup was downloaded.");
            toast("Backup downloaded.");
        });
    }

    if (restoreBtn && restoreFile) {
        restoreBtn.addEventListener("click", function () { restoreFile.click(); });
        restoreFile.addEventListener("change", function () {
            var file = restoreFile.files && restoreFile.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function () {
                var parsed;
                try { parsed = JSON.parse(reader.result); } catch (e) { parsed = null; }

                if (!parsed || parsed.app !== "SynchroChain" || !parsed.data || typeof parsed.data !== "object") {
                    toast("That file is not a SynchroChain backup.", "error");
                    restoreFile.value = "";
                    return;
                }
                if (!confirm("Replace ALL current data with this backup?")) {
                    restoreFile.value = "";
                    return;
                }

                localStorage.clear();
                Object.keys(parsed.data).forEach(function (k) { localStorage.setItem(k, parsed.data[k]); });
                toast("Backup restored. Reloading...");
                setTimeout(function () { location.reload(); }, 600);
            };
            reader.readAsText(file);
        });
    }

    // Extra safety: the user must type DELETE before "Delete All Users" goes through
    window.addEventListener("click", function (e) {
        if (!e.target.closest || !e.target.closest("#clearUsers")) return;
        var answer = prompt("This permanently deletes every registered user account.\n\nType DELETE to confirm.");
        if (answer !== "DELETE") {
            e.stopImmediatePropagation();
            e.preventDefault();
            toast("Cancelled. No users were deleted.");
        }
    }, true);

    // keep the page current when an order is placed in another tab
    window.addEventListener("storage", function () {
        if (data) {
            var current = data.getOrders() || [];
            current.forEach(function (o) {
                if (knownOrderIds.indexOf(String(o.id)) === -1) {
                    toast("New order " + o.id + ": " + o.item + " from " + o.userName);
                }
            });
            knownOrderIds = current.map(function (o) { return String(o.id); });
        }
        renderOverview();
        renderProducts();
        renderOrders();
        refreshUserStats();
        updateStorageInfo();
    });
}

// script.js creates window.SynchroData when the page loads, so wait for that first
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", adminInit);
} else {
    adminInit();
}