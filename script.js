/* =========================================================
   SYNCHROCHAIN - MAIN JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SETTINGS
       ===================================================== */

    const currentPage =
        window.location.pathname.split("/").pop().toLowerCase() ||
        "index.html";

    const USERS_KEY = "synchrochain_users";
    const SESSION_KEY = "synchrochain_session";
    const ACTIVITY_KEY = "synchrochain_activity";


    /* =====================================================
       STORAGE FUNCTIONS
       ===================================================== */

    function getUsers() {
        try {
            const data = localStorage.getItem(USERS_KEY);

            if (!data) {
                return [];
            }

            const users = JSON.parse(data);

            return Array.isArray(users) ? users : [];

        } catch (error) {
            console.error("Could not read users:", error);
            return [];
        }
    }


    function saveUsers(users) {
        try {
            localStorage.setItem(
                USERS_KEY,
                JSON.stringify(users)
            );

            return true;

        } catch (error) {
            console.error("Could not save users:", error);
            return false;
        }
    }


    function getSession() {
        try {
            const data = localStorage.getItem(SESSION_KEY);

            if (!data) {
                return null;
            }

            return JSON.parse(data);

        } catch (error) {
            console.error("Could not read session:", error);
            return null;
        }
    }


    function saveSession(session) {
        try {
            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

            return true;

        } catch (error) {
            console.error("Could not save session:", error);
            return false;
        }
    }


    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }


    function getActivity() {
        try {
            const data = localStorage.getItem(ACTIVITY_KEY);

            if (!data) {
                return [];
            }

            const activity = JSON.parse(data);

            return Array.isArray(activity) ? activity : [];

        } catch (error) {
            console.error("Could not read activity:", error);
            return [];
        }
    }


    function saveActivity(activity) {
        localStorage.setItem(
            ACTIVITY_KEY,
            JSON.stringify(activity)
        );
    }


    /* =====================================================
       ACTIVITY LOG
       ===================================================== */

    function logActivity(action, details) {

        const activity = getActivity();

        activity.unshift({
            id: Date.now(),
            action: action,
            details: details || "",
            time: new Date().toLocaleString()
        });

        if (activity.length > 100) {
            activity.length = 100;
        }

        saveActivity(activity);
    }


    /* =====================================================
       TOAST MESSAGE
       ===================================================== */

    function showToast(message, type) {

        type = type || "success";

        let toast = document.querySelector(".toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;

        toast.className =
            "toast " + type + " show";

        setTimeout(function () {
            toast.classList.remove("show");
        }, 3000);
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    function logout() {

        const session = getSession();

        if (session) {

            logActivity(
                "User Logout",
                session.name ||
                session.username ||
                session.email ||
                "Unknown user"
            );
        }

        clearSession();

        sessionStorage.removeItem(
            "synchrochain_welcome_shown"
        );

        window.location.href = "login.html";
    }


    /* =====================================================
       PAGE PROTECTION
       ===================================================== */

    const session = getSession();

    const publicPages = [
        "login.html",
        "register.html",
        "admin-login.html"
    ];

    const adminPages = [
        "admin.html"
    ];


    /* Normal pages require login */

    if (
        !publicPages.includes(currentPage) &&
        !adminPages.includes(currentPage) &&
        !session
    ) {
        window.location.href = "login.html";
        return;
    }


    /* Admin pages require admin account */

    if (
        adminPages.includes(currentPage) &&
        (!session || session.role !== "admin")
    ) {
        window.location.href = "admin-login.html";
        return;
    }


    /* =====================================================
       USER REGISTRATION
       ===================================================== */

    const registerForm =
        document.querySelector("#registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const nameInput =
                    document.querySelector("#registerName");

                const emailInput =
                    document.querySelector("#registerEmail");

                const passwordInput =
                    document.querySelector("#registerPassword");

                const confirmInput =
                    document.querySelector("#registerConfirm");

                const message =
                    document.querySelector("#registerMessage");


                if (
                    !nameInput ||
                    !emailInput ||
                    !passwordInput ||
                    !confirmInput ||
                    !message
                ) {

                    console.error(
                        "Registration form is missing required fields."
                    );

                    return;
                }


                const name =
                    nameInput.value.trim();

                const email =
                    emailInput.value.trim().toLowerCase();

                const password =
                    passwordInput.value;

                const confirmPassword =
                    confirmInput.value;


                /* Validation */

                if (!name || !email || !password) {

                    message.textContent =
                        "Please complete all required fields.";

                    message.className =
                        "auth-message error";

                    return;
                }


                if (password.length < 6) {

                    message.textContent =
                        "Password must contain at least 6 characters.";

                    message.className =
                        "auth-message error";

                    return;
                }


                if (password !== confirmPassword) {

                    message.textContent =
                        "Passwords do not match.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Get existing users */

                const users = getUsers();


                /* Check duplicate email */

                const existingUser =
                    users.find(function (user) {

                        return (
                            user.email &&
                            user.email.toLowerCase() === email
                        );

                    });


                if (existingUser) {

                    message.textContent =
                        "An account with this email already exists.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Create account */

                const newUser = {

                    id: Date.now(),

                    name: name,

                    email: email,

                    password: password,

                    role: "user",

                    createdAt:
                        new Date().toLocaleString()

                };


                users.push(newUser);


                /* Save account */

                if (!saveUsers(users)) {

                    message.textContent =
                        "Could not save your account.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Activity */

                logActivity(
                    "User Registration",
                    name +
                    " (" +
                    email +
                    ") created an account."
                );


                /* Success */

                message.textContent =
                    "Account created successfully! Redirecting to login...";

                message.className =
                    "auth-message success";


                registerForm.reset();


                setTimeout(function () {

                    window.location.href =
                        "login.html";

                }, 1200);

            }
        );
    }


    /* =====================================================
       USER LOGIN
       ===================================================== */

    const loginForm =
        document.querySelector("#loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const emailInput =
                    document.querySelector("#loginEmail");

                const passwordInput =
                    document.querySelector("#loginPassword");

                const message =
                    document.querySelector("#loginMessage");


                if (
                    !emailInput ||
                    !passwordInput ||
                    !message
                ) {

                    console.error(
                        "Login form is missing required fields."
                    );

                    return;
                }


                const email =
                    emailInput.value
                        .trim()
                        .toLowerCase();

                const password =
                    passwordInput.value;


                /* Get users */

                const users = getUsers();


                /* Find matching account */

                const user =
                    users.find(function (account) {

                        return (
                            account.email &&
                            account.email.toLowerCase() === email &&
                            account.password === password
                        );

                    });


                /* Invalid login */

                if (!user) {

                    message.textContent =
                        "Invalid email or password.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Normal users should use normal login */

                if (user.role === "admin") {

                    message.textContent =
                        "Please use Administrator Login.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Create session */

                const userSession = {

                    id: user.id,

                    name: user.name,

                    email: user.email,

                    role: "user",

                    loginTime:
                        new Date().toLocaleString()

                };


                if (!saveSession(userSession)) {

                    message.textContent =
                        "Could not create your login session.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Activity */

                logActivity(
                    "User Login",
                    user.name +
                    " (" +
                    user.email +
                    ") logged in."
                );


                /* Success */

                message.textContent =
                    "Login successful! Opening dashboard...";

                message.className =
                    "auth-message success";


                setTimeout(function () {

                    window.location.href =
                        "index.html";

                }, 700);

            }
        );
    }


    /* =====================================================
       ADMIN LOGIN
       ===================================================== */

    const adminLoginForm =
        document.querySelector("#adminLoginForm");

    if (adminLoginForm) {

        adminLoginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const usernameInput =
                    document.querySelector("#adminUsername");

                const passwordInput =
                    document.querySelector("#adminPassword");

                const message =
                    document.querySelector(
                        "#adminLoginMessage"
                    );


                if (
                    !usernameInput ||
                    !passwordInput ||
                    !message
                ) {

                    console.error(
                        "Admin login form is missing required fields."
                    );

                    return;
                }


                const username =
                    usernameInput.value.trim();

                const password =
                    passwordInput.value;


                /*
                    ADMIN LOGIN

                    Username: Eric
                    Password: 12345678
                */

                if (
                    username.toLowerCase() !== "eric" ||
                    password !== "12345678"
                ) {

                    message.textContent =
                        "Invalid administrator credentials.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Create admin session */

                const adminSession = {

                    id: "ADMIN",

                    name: "Eric",

                    username: "Eric",

                    role: "admin",

                    loginTime:
                        new Date().toLocaleString()

                };


                if (!saveSession(adminSession)) {

                    message.textContent =
                        "Could not create administrator session.";

                    message.className =
                        "auth-message error";

                    return;
                }


                /* Activity */

                logActivity(
                    "Administrator Login",
                    "Eric logged in as administrator."
                );


                /* Success */

                message.textContent =
                    "Administrator login successful! Opening admin dashboard...";

                message.className =
                    "auth-message success";


                setTimeout(function () {

                    window.location.href =
                        "admin.html";

                }, 700);

            }
        );
    }


    /* =====================================================
       LOGOUT BUTTONS
       ===================================================== */

    const logoutButtons =
        document.querySelectorAll(
            "#logoutBtn, .logout-btn"
        );


    logoutButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();

            }
        );

    });


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const mobileMenu =
        document.querySelector(".mobile-menu");

    const navLinks =
        document.querySelector(".nav-links");


    if (mobileMenu && navLinks) {

        mobileMenu.addEventListener(
            "click",
            function () {

                navLinks.classList.toggle("open");

            }
        );


        const navItems =
            navLinks.querySelectorAll("a");


        navItems.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    navLinks.classList.remove("open");

                }
            );

        });

    }


    /* =====================================================
       HERO SEARCH - SHIPMENT FINDER
       (now searches the logged-in user's own orders)
       ===================================================== */

    const searchForm = document.querySelector(".search-form");

    if (searchForm) {

        searchForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const category =
                document.querySelector("#shipmentCategory") ||
                searchForm.querySelector("select");

            const dateInput =
                document.querySelector("#shipmentDate") ||
                searchForm.querySelector("input[type='date']");

            const result =
                document.querySelector("#searchResult");

            const resultsContainer =
                document.querySelector("#shipmentResults");

            const selectedCategory = category
                ? category.value
                : "All Categories";

            const selectedDate = dateInput
                ? dateInput.value
                : "";

            /* CHECK LOGIN */

            if (!session) {

                if (result) {
                    result.textContent = "Please log in to search your shipments.";
                    result.style.color = "#b53b3b";
                }

                return;
            }

            /* CHECK DATE */

            if (!selectedDate) {

                if (result) {
                    result.textContent = "Please select a shipment date.";
                    result.style.color = "#b53b3b";
                }

                return;
            }

            /* GET THIS USER'S ORDERS AS SHIPMENTS */

            let allOrders = [];

            try {
                const raw = localStorage.getItem("synchrochain_orders");
                allOrders = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(allOrders)) {
                    allOrders = [];
                }
            } catch (e) {
                allOrders = [];
            }

            const userKey = session.email || session.username;

            const myShipments = allOrders.filter(function (order) {

                const belongsToUser = order.userEmail === userKey;

                const categoryMatches =
                    selectedCategory === "All Categories" ||
                    order.category === selectedCategory;

                const orderDateOnly =
                    order.date ? order.date.slice(0, 10) : "";

                const dateMatches = orderDateOnly === selectedDate;

                return belongsToUser && categoryMatches && dateMatches;

            });

            /* CLEAR OLD RESULTS */

            if (resultsContainer) {
                resultsContainer.innerHTML = "";
            }

            /* NO RESULTS */

            if (myShipments.length === 0) {

                if (result) {
                    result.textContent = "No shipments found for that category and date.";
                    result.style.color = "#b53b3b";
                }

                if (resultsContainer) {

                    resultsContainer.innerHTML = `
                        <div class="shipment-no-results">

                            <h3>No Shipments Found</h3>

                            <p>
                                You have no orders matching that category
                                and date. Orders you place from the
                                Inventory page will show up here.
                            </p>

                        </div>
                    `;
                }

                return;
            }

            /* RESULTS FOUND */

            if (result) {

                result.textContent =
                    myShipments.length +
                    " shipment(s) found.";

                result.style.color = "#28764a";
            }

            /* DISPLAY EACH SHIPMENT */

            myShipments.forEach(function (order) {

                const orderDate = order.date
                    ? new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                    })
                    : "—";

                const card = document.createElement("div");

                card.className = "shipment-result-card";

                card.innerHTML = `

                    <div class="shipment-result-header">

                        <div>

                            <span class="shipment-label">
                                SHIPMENT
                            </span>

                            <h3>
                                ${order.id}
                            </h3>

                        </div>

                        <span class="shipment-status">
                            ${order.status}
                        </span>

                    </div>


                    <div class="shipment-details">

                        <div>
                            <strong>Item</strong>
                            <span>${order.item}</span>
                        </div>

                        <div>
                            <strong>Category</strong>
                            <span>${order.category}</span>
                        </div>

                        <div>
                            <strong>Amount</strong>
                            <span>₱${Number(order.amount).toLocaleString("en-PH")}</span>
                        </div>

                        <div>
                            <strong>Destination</strong>
                            <span>${order.location}</span>
                        </div>

                        <div>
                            <strong>Order Date</strong>
                            <span>${orderDate}</span>
                        </div>

                    </div>

                `;

                if (resultsContainer) {
                    resultsContainer.appendChild(card);
                }

            });

            /* EXISTING FUNCTIONS FROM YOUR SCRIPT */

            if (typeof logActivity === "function") {

                logActivity(
                    "Shipment Search",
                    selectedCategory + " - " + selectedDate
                );

            }

            if (typeof showToast === "function") {

                showToast(
                    myShipments.length +
                    " shipment(s) found."
                );

            }

            /* SCROLL TO RESULTS */

            if (resultsContainer) {

                setTimeout(function () {

                    resultsContainer.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }, 100);

            }

        });

    }


    /* =====================================================
       TABLE SEARCH
       ===================================================== */

    const tableSearchInputs =
        document.querySelectorAll(
            ".table-search, #tableSearch"
        );


    tableSearchInputs.forEach(
        function (searchInput) {

            searchInput.addEventListener(
                "input",
                function () {

                    const searchValue =
                        this.value
                            .toLowerCase()
                            .trim();


                    const table =
                        document.querySelector("table");


                    if (!table) {
                        return;
                    }


                    const rows =
                        table.querySelectorAll(
                            "tbody tr"
                        );


                    rows.forEach(function (row) {

                        const text =
                            row.textContent.toLowerCase();


                        if (
                            text.includes(searchValue)
                        ) {

                            row.style.display = "";

                        } else {

                            row.style.display = "none";

                        }

                    });

                }
            );

        }
    );


    /* =====================================================
       TABLE ROW MODAL
       
       IMPORTANT:
       This version creates the modal using DOM methods.
       It does NOT put HTML directly inside JavaScript.
       ===================================================== */

    let activeModal = null;


    function createModal() {

        let modal =
            document.querySelector("#detailsModal");


        if (modal) {
            return modal;
        }


        /* Create modal */

        modal =
            document.createElement("div");

        modal.id = "detailsModal";

        modal.className = "interactive-modal";


        /* Create modal content */

        const modalContent =
            document.createElement("div");

        modalContent.className =
            "modal-box";


        /* Create close button */

        const closeButton =
            document.createElement("button");

        closeButton.className =
            "modal-close";

        closeButton.type =
            "button";

        closeButton.setAttribute(
            "aria-label",
            "Close"
        );

        closeButton.textContent = "×";


        /* Create body */

        const modalBody =
            document.createElement("div");

        modalBody.className =
            "modal-body";


        /* Put everything together */

        modalContent.appendChild(
            closeButton
        );

        modalContent.appendChild(
            modalBody
        );

        modal.appendChild(
            modalContent
        );

        document.body.appendChild(
            modal
        );


        /* Close button */

        closeButton.addEventListener(
            "click",
            closeModal
        );


        /* Click outside */

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {
                    closeModal();
                }

            }
        );


        return modal;
    }


    function openModal(title, content) {

        const modal =
            createModal();


        const body =
            modal.querySelector(
                ".modal-body"
            );


        body.innerHTML = "";


        const heading =
            document.createElement("h3");

        heading.textContent =
            title;


        body.appendChild(
            heading
        );


        content.forEach(function (item) {

            const paragraph =
                document.createElement("p");

            const strong =
                document.createElement("strong");


            strong.textContent =
                item.label + ": ";


            paragraph.appendChild(
                strong
            );


            paragraph.appendChild(
                document.createTextNode(
                    item.value
                )
            );


            body.appendChild(
                paragraph
            );

        });


        modal.classList.add("show");

        activeModal = modal;
    }


    function closeModal() {

        if (activeModal) {

            activeModal.classList.remove(
                "show"
            );

            activeModal = null;
        }
    }


    /* =====================================================
       TABLE ROW CLICK
       ===================================================== */

    const tableRows =
        document.querySelectorAll(
            "table tbody tr"
        );


    tableRows.forEach(function (row) {

        row.addEventListener(
            "click",
            function () {

                const cells =
                    row.querySelectorAll("td");


                if (!cells.length) {
                    return;
                }


                const details = [];


                cells.forEach(function (cell, index) {

                    details.push({

                        label:
                            "Field " +
                            (index + 1),

                        value:
                            cell.textContent.trim()

                    });

                });


                openModal(
                    "Record Details",
                    details
                );

            }
        );

    });


    /* =====================================================
       ESCAPE CLOSE MODAL
       ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeModal();
            }

        }
    );


    /* =====================================================
       PROGRESS BARS
       ===================================================== */

    const progressBars =
        document.querySelectorAll(
            ".progress-bar, .bar"
        );


    progressBars.forEach(function (bar) {

        const progress =
            bar.dataset.progress ||
            bar.getAttribute("data-progress");


        if (progress) {

            setTimeout(function () {

                bar.style.width =
                    progress + "%";

            }, 300);

        }

    });


    /* =====================================================
       DELIVERY CLICK
       ===================================================== */

    const deliveryItems =
        document.querySelectorAll(
            ".delivery-card, .delivery-item"
        );


    deliveryItems.forEach(function (item) {

        item.addEventListener(
            "click",
            function () {

                showToast(
                    "Delivery information selected."
                );

            }
        );

    });


    /* =====================================================
       FINANCE BAR
       ===================================================== */

    const financeBars =
        document.querySelectorAll(
            ".finance-bar"
        );


    financeBars.forEach(function (bar) {

        bar.addEventListener(
            "click",
            function () {

                const value =
                    bar.dataset.value ||
                    bar.getAttribute("data-value");


                if (value) {

                    showToast(
                        "Financial value: " + value
                    );

                }

            }
        );

    });


    /* =====================================================
       STAT CARDS
       ===================================================== */

    const statCards =
        document.querySelectorAll(".stat");


    statCards.forEach(function (stat) {

        stat.addEventListener(
            "click",
            function () {

                const number =
                    stat.querySelector("strong");

                const label =
                    stat.querySelector("span");


                if (number && label) {

                    showToast(
                        label.textContent.trim() +
                        ": " +
                        number.textContent.trim()
                    );

                }

            }
        );

    });


    /* =====================================================
       SCROLL REVEAL
       ===================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");


    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(
                        function (entry) {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "show"
                                );

                                observer.unobserve(
                                    entry.target
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.12
                }
            );


        revealElements.forEach(
            function (element) {

                observer.observe(element);

            }
        );

    } else {

        revealElements.forEach(
            function (element) {

                element.classList.add(
                    "show"
                );

            }
        );

    }


    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    const yearElements =
        document.querySelectorAll(
            "#currentYear, .current-year"
        );


    yearElements.forEach(function (element) {

        element.textContent =
            new Date().getFullYear();

    });


    /* =====================================================
       CURRENT USER
       ===================================================== */

    const currentUserElements =
        document.querySelectorAll(
            ".current-user, #currentUser"
        );


    if (session) {

        currentUserElements.forEach(
            function (element) {

                element.textContent =
                    session.name ||
                    session.username ||
                    session.email ||
                    "User";

            }
        );

    }


    /* =====================================================
       ADMIN NAVIGATION
       ===================================================== */

    const adminNavLinks =
        document.querySelectorAll(
            ".admin-only"
        );


    adminNavLinks.forEach(function (link) {

        if (
            !session ||
            session.role !== "admin"
        ) {

            link.style.display =
                "none";
        }

    });


    /* =====================================================
       WELCOME MESSAGE
       ===================================================== */

    if (
        currentPage === "index.html" &&
        session &&
        !sessionStorage.getItem(
            "synchrochain_welcome_shown"
        )
    ) {

        setTimeout(function () {

            showToast(
                "Welcome, " +
                (
                    session.name ||
                    session.username ||
                    "User"
                ) +
                "!"
            );

        }, 600);


        sessionStorage.setItem(
            "synchrochain_welcome_shown",
            "true"
        );

    }


    /* =====================================================
       ADMIN DASHBOARD
       ===================================================== */

    if (currentPage === "admin.html") {

        const users =
            getUsers();

        const activity =
            getActivity();


        /* User count */

        const userCount =
            document.querySelector(
                "#adminUserCount"
            );


        if (userCount) {

            userCount.textContent =
                users.length;

        }


        /* Activity count */

        const activityCount =
            document.querySelector(
                "#adminActivityCount"
            );


        if (activityCount) {

            activityCount.textContent =
                activity.length;

        }


        /* Admin name */

        const adminName =
            document.querySelector(
                "#adminName"
            );


        if (adminName && session) {

            adminName.textContent =
                session.name ||
                "System Administrator";

        }


        /* Activity table */

        const activityTable =
            document.querySelector(
                "#activityTable tbody"
            );


        if (activityTable) {

            activityTable.innerHTML = "";


            if (activity.length === 0) {

                const row =
                    document.createElement("tr");

                const cell =
                    document.createElement("td");

                cell.colSpan = 3;

                cell.textContent =
                    "No activity recorded yet.";

                row.appendChild(cell);

                activityTable.appendChild(row);

            } else {

                activity
                    .slice(0, 20)
                    .forEach(function (item) {

                        const row =
                            document.createElement("tr");


                        const actionCell =
                            document.createElement("td");

                        const detailsCell =
                            document.createElement("td");

                        const timeCell =
                            document.createElement("td");


                        actionCell.textContent =
                            item.action;

                        detailsCell.textContent =
                            item.details;

                        timeCell.textContent =
                            item.time;


                        row.appendChild(
                            actionCell
                        );

                        row.appendChild(
                            detailsCell
                        );

                        row.appendChild(
                            timeCell
                        );


                        activityTable.appendChild(
                            row
                        );

                    });

            }

        }


        /* Users table */

        const usersTable =
            document.querySelector(
                "#usersTable tbody"
            );


        if (usersTable) {

            usersTable.innerHTML = "";


            if (users.length === 0) {

                const row =
                    document.createElement("tr");

                const cell =
                    document.createElement("td");

                cell.colSpan = 4;

                cell.textContent =
                    "No registered users.";

                row.appendChild(cell);

                usersTable.appendChild(row);

            } else {

                users.forEach(function (user) {

                    const row =
                        document.createElement("tr");


                    const nameCell =
                        document.createElement("td");

                    const emailCell =
                        document.createElement("td");

                    const roleCell =
                        document.createElement("td");

                    const dateCell =
                        document.createElement("td");


                    nameCell.textContent =
                        user.name;

                    emailCell.textContent =
                        user.email;

                    roleCell.textContent =
                        user.role;

                    dateCell.textContent =
                        user.createdAt;


                    row.appendChild(
                        nameCell
                    );

                    row.appendChild(
                        emailCell
                    );

                    row.appendChild(
                        roleCell
                    );

                    row.appendChild(
                        dateCell
                    );


                    usersTable.appendChild(
                        row
                    );

                });

            }

        }

    }


    /* =====================================================
       CLEAR ACTIVITY
       ===================================================== */

    const clearActivityButton =
        document.querySelector(
            "#clearActivity"
        );


    if (clearActivityButton) {

        clearActivityButton.addEventListener(
            "click",
            function () {

                if (
                    !confirm(
                        "Clear all activity records?"
                    )
                ) {
                    return;
                }


                localStorage.removeItem(
                    ACTIVITY_KEY
                );


                showToast(
                    "Activity records cleared."
                );


                setTimeout(function () {

                    window.location.reload();

                }, 500);

            }
        );

    }


    /* =====================================================
       CLEAR USERS
       ===================================================== */

    const clearUsersButton =
        document.querySelector(
            "#clearUsers"
        );


    if (clearUsersButton) {

        clearUsersButton.addEventListener(
            "click",
            function () {

                if (
                    !confirm(
                        "Delete all registered users?"
                    )
                ) {
                    return;
                }


                localStorage.removeItem(
                    USERS_KEY
                );


                logActivity(
                    "Admin Action",
                    "All registered users were removed."
                );


                showToast(
                    "Registered users cleared."
                );


                setTimeout(function () {

                    window.location.reload();

                }, 500);

            }
        );

    }


    /* =====================================================
       CONSOLE
       ===================================================== */

    console.log(
        "SynchroChain JavaScript loaded successfully."
    );

    console.log(
        "Current page:",
        currentPage
    );


    if (session) {

        console.log(
            "Logged in as:",
            session.name ||
            session.username ||
            session.email
        );

        console.log(
            "Role:",
            session.role
        );

    }

});


/* =========================================================
   SYNCHROCHAIN - USER PAGES
   (products, my orders, deliveries, my spending)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const PRODUCTS_KEY = "synchrochain_products";
    const ORDERS_KEY = "synchrochain_orders";
    const ORDER_SEQ_KEY = "synchrochain_order_seq";
    const SESSION_KEY = "synchrochain_session";

    const currentPage =
        window.location.pathname.split("/").pop().toLowerCase() || "index.html";


    /* ---------- HELPERS ---------- */

    function getSession() {
        try {
            const data = localStorage.getItem(SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    const session = getSession();

    function userKey() {
        return session ? (session.email || session.username) : null;
    }

    function formatMoney(amount) {
        return "₱" + Number(amount).toLocaleString("en-PH");
    }

    function formatDate(isoString) {
        const d = new Date(isoString);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function toast(message, type) {
        type = type || "success";
        let el = document.querySelector(".toast");
        if (!el) {
            el = document.createElement("div");
            el.className = "toast";
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.className = "toast " + type + " show";
        setTimeout(function () { el.classList.remove("show"); }, 3000);
    }


    /* ---------- PRODUCTS ---------- */

    const SEED_PRODUCTS = [
        { id: 1, name: "Laptop", category: "Electronics", price: 45000, stock: 20 },
        { id: 2, name: "Wireless Mouse", category: "Accessories", price: 850, stock: 40 },
        { id: 3, name: "Keyboard", category: "Accessories", price: 2500, stock: 3 },
        { id: 4, name: "USB-C Hub", category: "Accessories", price: 1800, stock: 0 }
    ];

    function getProducts() {
        try {
            const data = localStorage.getItem(PRODUCTS_KEY);
            if (!data) {
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
                return SEED_PRODUCTS.slice();
            }
            const products = JSON.parse(data);
            return Array.isArray(products) ? products : [];
        } catch (e) {
            return [];
        }
    }

    function saveProducts(products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    function productStatusLabel(stock) {
        if (stock <= 0) {
            return { text: "Out of Stock", badge: "red" };
        }
        if (stock <= 5) {
            return { text: "Only a few left", badge: "orange" };
        }
        return { text: "In Stock", badge: "green" };
    }


    /* ---------- ORDERS ---------- */

    function getOrders() {
        try {
            const data = localStorage.getItem(ORDERS_KEY);
            if (!data) {
                return [];
            }
            const orders = JSON.parse(data);
            return Array.isArray(orders) ? orders : [];
        } catch (e) {
            return [];
        }
    }

    function saveOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    function nextOrderId() {
        let seq = parseInt(localStorage.getItem(ORDER_SEQ_KEY), 10);
        if (isNaN(seq)) {
            seq = 1000;
        }
        seq = seq + 1;
        localStorage.setItem(ORDER_SEQ_KEY, String(seq));
        return "#" + seq;
    }

    const LOCATIONS = [
        "Metro Manila",
        "Cavite",
        "Laguna",
        "Batangas",
        "Quezon City",
        "Cebu"
    ];

    function createOrder(product, details) {

        if (!session) {
            return null;
        }

        details = details || {};

        const qty = details.quantity || 1;

        const order = {
            id: nextOrderId(),
            userEmail: userKey(),
            userName: session.name || session.username || "User",
            productId: product.id,
            item: product.name,
            category: product.category,
            quantity: qty,
            amount: product.price * qty,
            date: new Date().toISOString(),
            status: "Processing",
            location: details.city
                ? details.city + ", " + details.province
                : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            recipient: details.recipient || "",
            phone: details.phone || "",
            address: details.address || "",
            zip: details.zip || "",
            deliveryDate: details.deliveryDate || "",
            payment: details.payment || "",
            notes: details.notes || ""
        };

        const orders = getOrders();
        orders.unshift(order);
        saveOrders(orders);

        if (typeof logActivity === "function") {
            logActivity(
                "New Order",
                order.userName + " ordered " + order.item + " (" + order.id + ")"
            );
        }

        return order;
    }

    function statusProgress(status) {
        if (status === "Delivered") {
            return 100;
        }
        if (status === "In Transit") {
            return 70;
        }
        return 25;
    }

    function statusBadgeClass(status) {
        return status === "Delivered" ? "green" : "orange";
    }


    /* ---------- ORDER POPUP ---------- */

    function openOrderModal(product, onDone) {

        const old = document.querySelector("#orderOverlay");
        if (old) {
            old.remove();
        }

        const overlay = document.createElement("div");
        overlay.id = "orderOverlay";
        overlay.className = "order-overlay";

        overlay.innerHTML = `
            <div class="order-modal">
                <div class="order-head">
                    <h2>Order Details</h2>
                    <button type="button" class="order-close" aria-label="Close">×</button>
                </div>

                <form id="orderForm" novalidate>

                    <div class="order-product">
                        <div><strong id="oName"></strong><small id="oMeta"></small></div>
                        <strong id="oPrice"></strong>
                    </div>

                    <div class="order-field">
                        <label>Quantity (pcs)</label>
                        <div class="qty-row">
                            <div class="qty-box">
                                <button type="button" id="qtyMinus">−</button>
                                <input type="number" id="oQty" value="1" min="1">
                                <button type="button" id="qtyPlus">+</button>
                            </div>
                            <small id="oStock"></small>
                        </div>
                    </div>

                    <div class="order-grid">
                        <div class="order-field"><label>Recipient name</label><input type="text" id="oRecipient"></div>
                        <div class="order-field"><label>Mobile number</label><input type="tel" id="oPhone" placeholder="09XXXXXXXXX"></div>
                        <div class="order-field full"><label>Street / building</label><input type="text" id="oStreet"></div>
                        <div class="order-field"><label>Barangay</label><input type="text" id="oBarangay"></div>
                        <div class="order-field"><label>City / Municipality</label><input type="text" id="oCity"></div>
                        <div class="order-field"><label>Province</label><input type="text" id="oProvince"></div>
                        <div class="order-field"><label>ZIP code</label><input type="text" id="oZip" maxlength="4"></div>
                        <div class="order-field"><label>Preferred delivery date</label><input type="date" id="oDate"></div>
                        <div class="order-field">
                            <label>Payment method</label>
                            <select id="oPayment">
                                <option value="">Select payment</option>
                                <option>Cash on Delivery</option>
                                <option>GCash</option>
                                <option>Bank Transfer</option>
                            </select>
                        </div>
                        <div class="order-field full"><label>Notes (optional)</label><textarea id="oNotes" placeholder="e.g. Call before delivery"></textarea></div>
                    </div>

                    <div class="order-total"><span id="oTotalLabel"></span><strong id="oTotal"></strong></div>

                    <p class="order-error" id="oError"></p>

                    <div class="order-actions">
                        <button type="button" class="btn order-cancel">Cancel</button>
                        <button type="submit" class="btn">Place Order</button>
                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.classList.add("modal-open");
        setTimeout(function () { overlay.classList.add("show"); }, 10);

        const $ = function (sel) { return overlay.querySelector(sel); };

        $("#oName").textContent = product.name;
        $("#oMeta").textContent = " · " + product.category;
        $("#oPrice").textContent = formatMoney(product.price) + " / pc";
        $("#oStock").textContent = product.stock + " pcs available";
        $("#oRecipient").value = (session && (session.name || session.username)) || "";

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toLocaleDateString("en-CA");
        $("#oDate").min = minDate;

        const qtyInput = $("#oQty");
        qtyInput.max = product.stock;

        function qty() {
            let q = parseInt(qtyInput.value, 10);
            if (isNaN(q) || q < 1) { q = 1; }
            return Math.min(q, product.stock);
        }

        function updateTotal() {
            $("#oTotalLabel").textContent = qty() + " × " + formatMoney(product.price);
            $("#oTotal").textContent = formatMoney(product.price * qty());
        }

        $("#qtyMinus").addEventListener("click", function () { qtyInput.value = Math.max(1, qty() - 1); updateTotal(); });
        $("#qtyPlus").addEventListener("click", function () { qtyInput.value = qty() + 1; updateTotal(); });
        qtyInput.addEventListener("input", updateTotal);
        qtyInput.addEventListener("blur", function () { qtyInput.value = qty(); updateTotal(); });
        updateTotal();

        function onKey(e) {
            if (e.key === "Escape") { close(); }
        }

        function close() {
            document.removeEventListener("keydown", onKey);
            document.body.classList.remove("modal-open");
            overlay.classList.remove("show");
            setTimeout(function () { overlay.remove(); }, 250);
        }

        document.addEventListener("keydown", onKey);
        $(".order-close").addEventListener("click", close);
        $(".order-cancel").addEventListener("click", close);
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) { close(); }
        });

        function clean(v) {
            return v.replace(/[<>]/g, "").trim();
        }

        $("#orderForm").addEventListener("submit", function (e) {

            e.preventDefault();

            const d = {
                quantity: qty(),
                recipient: clean($("#oRecipient").value),
                phone: $("#oPhone").value.replace(/[\s-]/g, ""),
                street: clean($("#oStreet").value),
                barangay: clean($("#oBarangay").value),
                city: clean($("#oCity").value),
                province: clean($("#oProvince").value),
                zip: $("#oZip").value.trim(),
                deliveryDate: $("#oDate").value,
                payment: $("#oPayment").value,
                notes: clean($("#oNotes").value)
            };

            const checks = [
                ["#oRecipient", !d.recipient, "Please enter the recipient's name."],
                ["#oPhone", !/^(\+?63|0)9\d{9}$/.test(d.phone), "Enter a valid mobile number (e.g. 09171234567)."],
                ["#oStreet", !d.street, "Please enter the street or building."],
                ["#oBarangay", !d.barangay, "Please enter the barangay."],
                ["#oCity", !d.city, "Please enter the city or municipality."],
                ["#oProvince", !d.province, "Please enter the province."],
                ["#oZip", !/^\d{4}$/.test(d.zip), "ZIP code must be 4 digits."],
                ["#oDate", !d.deliveryDate || d.deliveryDate < minDate, "Choose a delivery date from tomorrow onwards."],
                ["#oPayment", !d.payment, "Please select a payment method."]
            ];

            overlay.querySelectorAll(".invalid").forEach(function (f) { f.classList.remove("invalid"); });
            $("#oError").textContent = "";

            for (let i = 0; i < checks.length; i++) {
                if (checks[i][1]) {
                    $("#oError").textContent = checks[i][2];
                    $(checks[i][0]).classList.add("invalid");
                    $(checks[i][0]).focus();
                    return;
                }
            }

            /* Re-check stock, then save */

            const fresh = getProducts();
            const target = fresh.find(function (p) { return p.id === product.id; });

            if (!target || target.stock < d.quantity) {
                $("#oError").textContent = "Sorry, only " + (target ? target.stock : 0) + " pcs left.";
                return;
            }

            d.address = d.street + ", Brgy. " + d.barangay + ", " + d.city + ", " + d.province;

            target.stock -= d.quantity;
            saveProducts(fresh);

            const order = createOrder(target, d);

            close();
            toast(d.quantity + " × " + product.name + " ordered (" + order.id + "). Check My Orders.");

            if (typeof onDone === "function") {
                onDone();
            }

        });

    }


    /* ---------- PRODUCTS PAGE (inventory.html) ---------- */

    if (currentPage === "inventory.html") {

        const tbody = document.querySelector("#productsTable tbody");
        const statAvailable = document.querySelector("#statAvailable");
        const statLow = document.querySelector("#statLow");
        const statOut = document.querySelector("#statOut");
        const filterSelect = document.querySelector(".filter");

        function renderProducts() {

            const products = getProducts();

            if (statAvailable) {
                statAvailable.textContent = products.filter(function (p) {
                    return p.stock > 5;
                }).length;
            }

            if (statLow) {
                statLow.textContent = products.filter(function (p) {
                    return p.stock > 0 && p.stock <= 5;
                }).length;
            }

            if (statOut) {
                statOut.textContent = products.filter(function (p) {
                    return p.stock <= 0;
                }).length;
            }

            if (!tbody) {
                return;
            }

            tbody.innerHTML = "";

            if (products.length === 0) {
                tbody.innerHTML = "<tr class='empty-row'><td colspan='5'>No products available yet.</td></tr>";
                return;
            }

            products.forEach(function (product) {

                const status = productStatusLabel(product.stock);

                const row = document.createElement("tr");
                row.dataset.status = status.text;

                row.innerHTML =
                    "<td>" + product.name + "</td>" +
                    "<td>" + product.category + "</td>" +
                    "<td>" + formatMoney(product.price) + "</td>" +
                    "<td><span class='badge " + status.badge + "'>" + status.text + "</span></td>" +
                    "<td></td>";

                const actionCell = row.querySelector("td:last-child");
                const button = document.createElement("button");
                button.type = "button";

                if (product.stock <= 0) {

                    button.className = "btn btn-sm btn-ghost";
                    button.textContent = "Notify me";

                    button.addEventListener("click", function () {
                        toast("We'll notify you when " + product.name + " is back.", "info");
                    });

                } else {

                    button.className = "btn btn-sm";
                    button.textContent = "Order";

                    button.addEventListener("click", function () {

                        if (!session) {
                            toast("Please log in to place an order.", "error");
                            return;
                        }

                        openOrderModal(product, renderProducts);

                    });

                }

                actionCell.appendChild(button);
                tbody.appendChild(row);

            });

        }

        renderProducts();

        if (filterSelect) {

            filterSelect.addEventListener("change", function () {

                const value = filterSelect.value.toLowerCase();

                document.querySelectorAll("#productsTable tbody tr").forEach(function (row) {

                    const status = (row.dataset.status || "").toLowerCase();

                    const matches =
                        !value ||
                        status === value ||
                        (value === "low stock" && status === "only a few left");

                    row.style.display = matches ? "" : "none";

                });

            });

        }

    }


    /* ---------- MY ORDERS PAGE (orders.html) ---------- */

    if (currentPage === "orders.html") {

        const tbody = document.querySelector("#ordersTable tbody");
        const statAll = document.querySelector("#statAllOrders");
        const statProgress = document.querySelector("#statInProgress");
        const statDelivered = document.querySelector("#statDelivered");

        function renderOrders() {

            const myOrders = getOrders().filter(function (o) {
                return session && o.userEmail === userKey();
            });

            if (statAll) {
                statAll.textContent = myOrders.length;
            }

            if (statProgress) {
                statProgress.textContent = myOrders.filter(function (o) {
                    return o.status !== "Delivered";
                }).length;
            }

            if (statDelivered) {
                statDelivered.textContent = myOrders.filter(function (o) {
                    return o.status === "Delivered";
                }).length;
            }

            if (!tbody) {
                return;
            }

            tbody.innerHTML = "";

            if (myOrders.length === 0) {
                tbody.innerHTML = "<tr class='empty-row'><td colspan='6'>You haven't placed any orders yet.</td></tr>";
                return;
            }

            myOrders.forEach(function (order) {

                const row = document.createElement("tr");

                row.innerHTML =
                    "<td>" + order.id + "</td>" +
                    "<td>" + order.item + (order.quantity > 1 ? " × " + order.quantity : "") + "</td>" +
                    "<td>" + formatDate(order.date) + "</td>" +
                    "<td>" + formatMoney(order.amount) + "</td>" +
                    "<td><span class='badge " + statusBadgeClass(order.status) + "'>" + order.status + "</span></td>" +
                    "<td><a href='deliveries.html' class='panel-link'>" +
                    (order.status === "Delivered" ? "View" : "Track") + " →</a></td>";

                tbody.appendChild(row);

            });

        }

        renderOrders();

    }


    /* ---------- MY DELIVERIES PAGE (deliveries.html) ---------- */

    if (currentPage === "deliveries.html") {

        const list = document.querySelector("#deliveryList");
        const latestSection = document.querySelector("#latestUpdate");

        function renderDeliveries() {

            const myOrders = getOrders().filter(function (o) {
                return session && o.userEmail === userKey();
            });

            if (list) {

                list.innerHTML = "";

                if (myOrders.length === 0) {

                    list.innerHTML = "<div class='card'>You don't have any deliveries yet.</div>";

                } else {

                    myOrders.forEach(function (order) {

                        const progress = statusProgress(order.status);

                        const arrivalText =
                            order.status === "Delivered"
                                ? "Delivered " + formatDate(order.date)
                                : "Estimated arrival: pending";

                        const card = document.createElement("div");
                        card.className = "delivery";

                        card.innerHTML =
                            "<div><strong>" + order.item + " · " + order.id + "</strong><br>" +
                            "<small>" + order.location + "</small></div>" +
                            "<div><strong>" + order.status + "</strong>" +
                            "<div class='progress'><span style='width:" + progress + "%'></span></div>" +
                            "<small>" + arrivalText + "</small></div>" +
                            "<span class='badge " + statusBadgeClass(order.status) + "'>" + progress + "%</span>";

                        list.appendChild(card);

                    });

                }

            }

            if (latestSection) {

                if (myOrders.length === 0) {

                    latestSection.style.display = "none";

                } else {

                    latestSection.style.display = "";

                    const latest = myOrders[0];
                    const heading = latestSection.querySelector("h2");

                    if (heading) {
                        heading.textContent = "Order " + latest.id + " · " + latest.item;
                    }

                    const steps = latestSection.querySelectorAll(".step");

                    let stepIndex = 2;
                    if (latest.status === "In Transit") {
                        stepIndex = 3;
                    }
                    if (latest.status === "Delivered") {
                        stepIndex = 4;
                    }

                    steps.forEach(function (step, index) {
                        if (index < stepIndex) {
                            step.classList.add("done");
                        } else {
                            step.classList.remove("done");
                        }
                    });

                }

            }

        }

        renderDeliveries();

    }


    /* ---------- MY SPENDING PAGE (finance.html) ---------- */

    if (currentPage === "finance.html") {

        const statTotal = document.querySelector("#statTotalSpent");
        const statDue = document.querySelector("#statAmountDue");
        const statLast = document.querySelector("#statLastPayment");
        const history = document.querySelector("#paymentHistory");

        function renderFinance() {

            const myOrders = getOrders().filter(function (o) {
                return session && o.userEmail === userKey();
            });

            let totalSpent = 0;
            myOrders.forEach(function (o) {
                totalSpent += Number(o.amount);
            });

            let amountDue = 0;
            myOrders.forEach(function (o) {
                if (o.status !== "Delivered") {
                    amountDue += Number(o.amount);
                }
            });

            const delivered = myOrders.filter(function (o) {
                return o.status === "Delivered";
            });

            const lastPayment = delivered.length > 0 ? delivered[0].amount : 0;

            if (statTotal) {
                statTotal.textContent = formatMoney(totalSpent);
            }

            if (statDue) {
                statDue.textContent = formatMoney(amountDue);
            }

            if (statLast) {
                statLast.textContent = formatMoney(lastPayment);
            }

            window.__financeOrders = myOrders;

            if (history) {

                history.innerHTML = "";

                if (myOrders.length === 0) {

                    history.innerHTML = "<p>No orders yet.</p>";

                } else {

                    myOrders.forEach(function (order) {

                        const row = document.createElement("div");
                        row.className = "pay-item";

                        const badgeClass = order.status === "Delivered" ? "green" : "orange";
                        const badgeText = order.status === "Delivered" ? "Paid" : "Due";

                        row.innerHTML =
                            "<div>" + order.item + "<small>Order " + order.id + "</small></div>" +
                            "<div>" + formatMoney(order.amount) + " " +
                            "<span class='badge " + badgeClass + "'>" + badgeText + "</span></div>";

                        history.appendChild(row);

                    });

                }

            }

        }

        renderFinance();

        /* ---------- REPORT GENERATION (monthly / yearly) ---------- */

        const reportTabs = document.querySelectorAll(".report-tab");
        const reportMonth = document.querySelector("#reportMonth");
        const reportYear = document.querySelector("#reportYear");
        const reportOutput = document.querySelector("#reportOutput");
        const reportActions = document.querySelector("#reportActions");
        const generateBtn = document.querySelector("#generateReport");
        const printBtn = document.querySelector("#printReport");
        const downloadBtn = document.querySelector("#downloadReport");

        let reportType = "monthly";
        let currentReport = null;

        function escapeHtml(text) {
            return String(text == null ? "" : text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }

        function setupReportControls() {

            if (!reportMonth || !reportYear) {
                return;
            }

            const now = new Date();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            reportMonth.value = now.getFullYear() + "-" + mm;

            const years = [now.getFullYear()];
            (window.__financeOrders || []).forEach(function (o) {
                const y = new Date(o.date).getFullYear();
                if (years.indexOf(y) === -1) {
                    years.push(y);
                }
            });
            years.sort(function (x, y) { return y - x; });

            reportYear.innerHTML = "";
            years.forEach(function (y) {
                const opt = document.createElement("option");
                opt.value = y;
                opt.textContent = y;
                reportYear.appendChild(opt);
            });

        }

        function buildReport() {

            const orders = window.__financeOrders || [];
            let title = "";
            let filtered = [];
            let breakdown = [];

            if (reportType === "monthly") {

                const parts = (reportMonth.value || "").split("-");
                if (parts.length !== 2) {
                    return null;
                }

                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;

                title = new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

                filtered = orders.filter(function (o) {
                    const d = new Date(o.date);
                    return d.getFullYear() === y && d.getMonth() === m;
                });

            } else {

                const y = parseInt(reportYear.value, 10);
                title = String(y);

                filtered = orders.filter(function (o) {
                    return new Date(o.date).getFullYear() === y;
                });

                for (let i = 0; i < 12; i++) {
                    breakdown.push({
                        label: new Date(y, i, 1).toLocaleDateString("en-US", { month: "long" }),
                        count: 0,
                        total: 0
                    });
                }

                filtered.forEach(function (o) {
                    const idx = new Date(o.date).getMonth();
                    breakdown[idx].count += 1;
                    breakdown[idx].total += Number(o.amount);
                });

            }

            let total = 0;
            let paid = 0;
            let due = 0;

            filtered.forEach(function (o) {
                const amt = Number(o.amount);
                total += amt;
                if (o.status === "Delivered") {
                    paid += amt;
                } else {
                    due += amt;
                }
            });

            let series = [];

            if (reportType === "yearly") {

                series = breakdown.map(function (row) {
                    return { label: row.label.slice(0, 3), total: row.total };
                });

            } else {

                const parts2 = reportMonth.value.split("-");
                const daysInMonth = new Date(parseInt(parts2[0], 10), parseInt(parts2[1], 10), 0).getDate();
                const weekRanges = [[1, 7], [8, 14], [15, 21], [22, 28]];

                if (daysInMonth > 28) {
                    weekRanges.push([29, daysInMonth]);
                }

                series = weekRanges.map(function (r, i) {
                    return {
                        label: "Wk " + (i + 1) + " (" + r[0] + "-" + r[1] + ")",
                        total: 0
                    };
                });

                filtered.forEach(function (o) {
                    const day = new Date(o.date).getDate();
                    const idx = Math.min(Math.floor((day - 1) / 7), series.length - 1);
                    series[idx].total += Number(o.amount);
                });

            }

            return {
                type: reportType,
                title: title,
                series: series,
                orders: filtered,
                breakdown: breakdown,
                total: total,
                paid: paid,
                due: due
            };

        }

        function compactMoney(n) {
            n = Number(n);
            if (n >= 1000000) { return "₱" + (n / 1000000).toFixed(1) + "M"; }
            if (n >= 1000) { return "₱" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k"; }
            return "₱" + n;
        }

        function buildChartHtml(report) {

            let max = 1;
            report.series.forEach(function (p) {
                if (p.total > max) { max = p.total; }
            });

            const heading = report.type === "yearly" ? "Spending per month" : "Spending per week";

            let html = "<div class='report-chart'><div class='rc-heading'>" + heading + "</div><div class='rc-plot'>";

            report.series.forEach(function (p) {

                const pct = p.total > 0 ? Math.max(4, Math.round((p.total / max) * 100)) : 0;

                html += "<div class='rc-col' title='" + escapeHtml(p.label) + ": " + formatMoney(p.total) + "'>" +
                    "<span class='rc-val'>" + (p.total > 0 ? compactMoney(p.total) : "") + "</span>" +
                    "<div class='rc-bar' style='height:" + pct + "%'></div></div>";

            });

            html += "</div><div class='rc-labels'>";

            report.series.forEach(function (p) {
                html += "<span>" + escapeHtml(p.label) + "</span>";
            });

            html += "</div></div>";

            return html;

        }

        function renderReport(report) {

            if (!report) {
                reportOutput.innerHTML = "<p class='report-empty'>Please choose a valid period.</p>";
                reportActions.style.display = "none";
                return;
            }

            const heading = (report.type === "monthly" ? "Monthly Report — " : "Yearly Report — ") + report.title;

            let html =
                "<div class='report-title'>" + escapeHtml(heading) + "</div>" +
                "<div class='report-summary'>" +
                    "<div><small>Orders</small><strong>" + report.orders.length + "</strong></div>" +
                    "<div><small>Total Spent</small><strong>" + formatMoney(report.total) + "</strong></div>" +
                    "<div><small>Paid</small><strong>" + formatMoney(report.paid) + "</strong></div>" +
                    "<div><small>Due</small><strong>" + formatMoney(report.due) + "</strong></div>" +
                "</div>";

            if (report.orders.length === 0) {
                html += "<p class='report-empty'>No orders found for this period.</p>";
                reportOutput.innerHTML = html;
                reportActions.style.display = "none";
                currentReport = null;
                return;
            }

            html += buildChartHtml(report);

            if (report.type === "yearly") {

                html += "<div class='table-wrap'><table class='report-table'><thead><tr>" +
                    "<th>Month</th><th>Orders</th><th>Amount</th></tr></thead><tbody>";

                report.breakdown.forEach(function (row) {
                    html += "<tr><td>" + row.label + "</td><td>" + row.count + "</td><td>" +
                        formatMoney(row.total) + "</td></tr>";
                });

                html += "</tbody><tfoot><tr><td>Total</td><td>" + report.orders.length + "</td><td>" +
                    formatMoney(report.total) + "</td></tr></tfoot></table></div>";

            } else {

                html += "<div class='table-wrap'><table class='report-table'><thead><tr>" +
                    "<th>Order</th><th>Item</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>";

                report.orders.forEach(function (o) {
                    html += "<tr><td>" + escapeHtml(o.id) + "</td><td>" + escapeHtml(o.item) + "</td><td>" +
                        formatDate(o.date) + "</td><td>" + formatMoney(o.amount) + "</td><td>" +
                        escapeHtml(o.status) + "</td></tr>";
                });

                html += "</tbody><tfoot><tr><td colspan='3'>Total</td><td colspan='2'>" +
                    formatMoney(report.total) + "</td></tr></tfoot></table></div>";

            }

            reportOutput.innerHTML = html;
            reportActions.style.display = "flex";
            currentReport = report;

        }

        function downloadCsv() {

            if (!currentReport) {
                return;
            }

            const rows = [];

            if (currentReport.type === "yearly") {
                rows.push(["Month", "Orders", "Amount"]);
                currentReport.breakdown.forEach(function (r) {
                    rows.push([r.label, r.count, r.total]);
                });
            } else {
                rows.push(["Order", "Item", "Date", "Amount", "Status"]);
                currentReport.orders.forEach(function (o) {
                    rows.push([o.id, o.item, formatDate(o.date), o.amount, o.status]);
                });
            }

            rows.push([]);
            rows.push(["Total Spent", currentReport.total]);
            rows.push(["Paid", currentReport.paid]);
            rows.push(["Due", currentReport.due]);

            const csv = rows.map(function (r) {
                return r.map(function (cell) {
                    return '"' + String(cell).replace(/"/g, '""') + '"';
                }).join(",");
            }).join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "synchrochain-" + currentReport.type + "-report-" +
                currentReport.title.replace(/\s+/g, "-").toLowerCase() + ".csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        }

        function printReport() {

            if (!currentReport) {
                return;
            }

            const win = window.open("", "_blank");
            if (!win) {
                toast("Allow pop-ups to print the report.", "error");
                return;
            }

            win.document.write(
                "<html><head><title>SynchroChain Report</title>" +
                "<style>body{font-family:Arial,sans-serif;padding:30px;color:#17252b}" +
                "table{width:100%;border-collapse:collapse;margin-top:15px}" +
                "th,td{border:1px solid #ccc;padding:8px;text-align:left}" +
                ".report-summary{display:flex;gap:30px;margin:15px 0}" +
                ".report-summary small{display:block;color:#777}" +
                ".rc-plot{display:flex;align-items:flex-end;gap:8px;height:200px;border-bottom:1px solid #ccc}" +
                ".rc-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}" +
                ".rc-bar{width:100%;background:#102d38;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
                ".rc-val{font-size:11px}.rc-labels{display:flex;gap:8px}.rc-labels span{flex:1;text-align:center;font-size:11px}" +
                ".rc-heading{font-weight:700;margin-top:15px}</style></head><body>" +
                "<h2>SynchroChain®</h2>" + reportOutput.innerHTML + "</body></html>"
            );
            win.document.close();
            win.focus();
            win.print();

        }

        reportTabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                reportTabs.forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                reportType = tab.dataset.type;
                reportMonth.style.display = reportType === "monthly" ? "" : "none";
                reportYear.style.display = reportType === "yearly" ? "" : "none";
            });
        });

        if (generateBtn) {
            generateBtn.addEventListener("click", function () {
                renderReport(buildReport());
            });
        }

        if (downloadBtn) { downloadBtn.addEventListener("click", downloadCsv); }
        if (printBtn) { printBtn.addEventListener("click", printReport); }

        setupReportControls();

    }


    /* Shared functions admin.html reuses */

    window.SynchroData = {
        getProducts: getProducts,
        saveProducts: saveProducts,
        getOrders: getOrders,
        saveOrders: saveOrders
    };

});