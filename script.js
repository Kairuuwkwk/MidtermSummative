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

    function createOrder(product) {

        if (!session) {
            return null;
        }

        const order = {
            id: nextOrderId(),
            userEmail: userKey(),
            userName: session.name || session.username || "User",
            productId: product.id,
            item: product.name,
            category: product.category,
            amount: product.price,
            date: new Date().toISOString(),
            status: "Processing",
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
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

                        const fresh = getProducts();

                        const target = fresh.find(function (p) {
                            return p.id === product.id;
                        });

                        if (!target || target.stock <= 0) {
                            toast(product.name + " is no longer available.", "error");
                            renderProducts();
                            return;
                        }

                        target.stock -= 1;
                        saveProducts(fresh);
                        createOrder(target);

                        toast(product.name + " ordered! Check My Orders for status.");
                        renderProducts();

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
                    "<td>" + order.item + "</td>" +
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
        const chart = document.querySelector("#spendingChart");
        const chartLabels = document.querySelector("#spendingChartLabels");
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

            if (chart && chartLabels) {

                const months = [];
                const now = new Date();

                for (let i = 5; i >= 0; i--) {

                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

                    months.push({
                        label: d.toLocaleDateString("en-US", { month: "short" }),
                        year: d.getFullYear(),
                        month: d.getMonth(),
                        total: 0
                    });

                }

                myOrders.forEach(function (order) {

                    const d = new Date(order.date);

                    const match = months.find(function (m) {
                        return m.year === d.getFullYear() && m.month === d.getMonth();
                    });

                    if (match) {
                        match.total += Number(order.amount);
                    }

                });

                let maxTotal = 1;
                months.forEach(function (m) {
                    if (m.total > maxTotal) {
                        maxTotal = m.total;
                    }
                });

                chart.innerHTML = "";
                chartLabels.innerHTML = "";

                months.forEach(function (m) {

                    const bar = document.createElement("div");
                    bar.className = "bar";
                    bar.title = m.label;

                    const heightPercent =
                        m.total > 0
                            ? Math.max(8, Math.round((m.total / maxTotal) * 100))
                            : 4;

                    bar.style.height = heightPercent + "%";

                    chart.appendChild(bar);

                    const label = document.createElement("span");
                    label.textContent = m.label;
                    chartLabels.appendChild(label);

                });

            }

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

    }


    /* Shared functions admin.html reuses */

    window.SynchroData = {
        getProducts: getProducts,
        saveProducts: saveProducts,
        getOrders: getOrders,
        saveOrders: saveOrders
    };

});