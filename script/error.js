(function () {
	const getElement = (id) => document.getElementById(id);
	const overlay = getElement("notification-popup-overlay");

	function displayErrorPopup(errorType, message, stackTrace) {
		getElement("popup-err-type").textContent = errorType || "Runtime Error";
		getElement("popup-err-message").textContent = message || "Unknown error.";
		getElement("popup-err-stack").value = stackTrace || "No call stack trace records.";
		getElement("popup-err-stack").style.display = "none";
		getElement("btn-toggle-log").textContent = "Show Full Log ▼";
		if (overlay) {
			overlay.style.display = "block";
		}
	}

	function toggleErrorLog() {
		const stackTextarea = getElement("popup-err-stack");
		const isCurrentlyHidden =
			stackTextarea.style.display === "none" || !stackTextarea.style.display;
		stackTextarea.style.display = isCurrentlyHidden ? "block" : "none";
		getElement("btn-toggle-log").textContent = isCurrentlyHidden
			? "Hide Full Log ▲"
			: "Show Full Log ▼";
	}

	function closeErrorPopup() {
		if (overlay) {
			overlay.style.display = "none";
		}
	}

	// Expose to global scope for use by the rest of the application
	window.displayErrorPopup = displayErrorPopup;
	window.toggleErrorLog = toggleErrorLog;
	window.closeErrorPopup = closeErrorPopup;

	getElement("popup-close-btn")?.addEventListener("click", closeErrorPopup);
	getElement("btn-toggle-log")?.addEventListener("click", toggleErrorLog);

	window.addEventListener("error", (event) => {
		displayErrorPopup(
			"Uncaught Runtime Exception",
			event.message,
			event.error?.stack
		);
	});

	window.addEventListener("unhandledrejection", (event) => {
		const reason =
			event.reason instanceof Error
				? event.reason
				: new Error(String(event.reason));
		displayErrorPopup(
			"Unhandled Promise Rejection",
			reason.message,
			reason.stack
		);
	});
})();
