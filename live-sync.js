// live-sync.js - add to orders.html, deliveries.html and finance.html AFTER script.js:
//   <script src="live-sync.js"></script>
// When the admin (or another tab of the same browser) changes saved data, this page
// refreshes itself so the customer sees the new order status without pressing reload.
(function () {
    "use strict";

    var KEY = "synchrochain_last_sync";
    var timer = null;

    window.addEventListener("storage", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            // never refresh more than once every 5 seconds
            var last = Number(sessionStorage.getItem(KEY)) || 0;
            if (Date.now() - last < 5000) return;
            sessionStorage.setItem(KEY, String(Date.now()));
            location.reload();
        }, 400);
    });
})();