// Key must match the product name exactly as shown in the table
const PRODUCT_DETAILS = {
    "Laptop": {
        image: "images/laptop.jpg",
        description: "Reliable everyday laptop for office and school use.",
        specs: {
            "Processor": "Intel Core i5",
            "RAM": "16 GB",
            "Storage": "512 GB SSD",
            "Display": "15.6\" FHD",
            "Warranty": "1 year"
        }
    },
    "Wireless Mouse": {
        image: "images/mouse.jpg",
        description: "Compact 2.4 GHz wireless mouse.",
        specs: {
            "Connection": "USB receiver",
            "Battery": "1 x AA",
            "DPI": "1600",
            "Warranty": "6 months"
        }
    },
    "Keyboard": {
        image: "images/keyboard.jpg",
        description: "Full-size keyboard with number pad.",
        specs: {
            "Layout": "104-key",
            "Connection": "USB",
            "Warranty": "6 months"
        }
    }
};

const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320">' +
        '<rect width="100%" height="100%" fill="#e9e7e1"/>' +
        '<text x="50%" y="50%" fill="#999" font-size="22" font-family="sans-serif" ' +
        'text-anchor="middle">No image yet</text></svg>'
    );

(function () {
    const tbody = document.querySelector("#productsTable tbody");
    const modal = document.getElementById("productModal");
    const hover = document.getElementById("productHover");

    function getInfo(cell) {
        const row = cell.parentElement;
        const name = cell.textContent.trim();
        const d = PRODUCT_DETAILS[name] || {};
        return {
            name,
            category: row.cells[1]?.textContent.trim() || "",
            price: row.cells[2]?.textContent.trim() || "",
            status: row.cells[3]?.textContent.trim() || "",
            image: d.image || PLACEHOLDER_IMG,
            description: d.description || "No details added for this product yet.",
            specs: d.specs || {}
        };
    }

    function productCell(target) {
        const cell = target.closest("td");
        return cell && cell === cell.parentElement.cells[0] ? cell : null;
    }

    // CLICK → full details modal
    tbody.addEventListener("click", (e) => {
        const cell = productCell(e.target);
        if (!cell) return;
        const p = getInfo(cell);

        document.getElementById("pmName").textContent = p.name;
        document.getElementById("pmMeta").textContent =
            `${p.category} · ${p.price} · ${p.status}`;
        document.getElementById("pmDesc").textContent = p.description;

        const img = document.getElementById("pmImage");
        img.src = p.image;
        img.alt = p.name;
        img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER_IMG; };

        const specs = document.getElementById("pmSpecs");
        specs.innerHTML = "";
        Object.entries(p.specs).forEach(([k, v]) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            const td = document.createElement("td");
            th.textContent = k;
            td.textContent = v;
            tr.append(th, td);
            specs.appendChild(tr);
        });

        hover.hidden = true;
        modal.hidden = false;
    });

    // HOVER → small preview card
    tbody.addEventListener("mouseover", (e) => {
        const cell = productCell(e.target);
        if (!cell) return;
        const p = getInfo(cell);
        hover.innerHTML = "";
        const img = document.createElement("img");
        img.src = p.image;
        img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER_IMG; };
        const txt = document.createElement("div");
        const b = document.createElement("strong");
        b.textContent = p.name;
        const s = document.createElement("span");
        s.textContent = p.description;
        const hint = document.createElement("em");
        hint.textContent = "Click for full specs";
        txt.append(b, s, hint);
        hover.append(img, txt);
        hover.hidden = false;
    });
    tbody.addEventListener("mousemove", (e) => {
        if (hover.hidden) return;
        hover.style.left = Math.min(e.clientX + 16, window.innerWidth - 340) + "px";
        hover.style.top = Math.min(e.clientY + 16, window.innerHeight - 140) + "px";
    });
    tbody.addEventListener("mouseout", (e) => {
        if (productCell(e.target)) hover.hidden = true;
    });

    // Close modal
    const close = () => (modal.hidden = true);
    document.getElementById("pmClose").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();