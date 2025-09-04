document.addEventListener("DOMContentLoaded", () => {
  const floatingMessage = document.getElementById("floating-message");
  const messageText = document.getElementById("message-text");
  const closeBtn = document.getElementById("close-btn");

  // Load message from server or local file
  async function loadMessage() {
    try {
      const res = await fetch("/message.json?cache=" + Date.now());
      const data = await res.json();
      messageText.textContent = data.message || "No message available.";
    } catch (err) {
      messageText.textContent = "Unable to load message.";
    }

    // Show message after loading
    floatingMessage.classList.add("show");
  }

  // Close button functionality
  closeBtn.addEventListener("click", () => {
    floatingMessage.classList.remove("show");
  });

  // Load message on page load
  loadMessage();
});
