const API_BASE = window.API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("error-msg");
  const usernameInput = document.getElementById("username");

  // Change label to "Email" instead of "Username"
  const labels = document.querySelectorAll("label");
  labels.forEach(label => {
    if (label.textContent.includes("Username")) {
      label.textContent = "Email";
    }
  });
  
  // Change placeholder to "Email"
  usernameInput.placeholder = "Email";
  usernameInput.type = "email";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent default form submission

    errorMsg.textContent = "";
    errorMsg.style.color = "red";

    // Now using email instead of username
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorMsg.textContent = "Enter both email and password";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Successful login → save JWT token and user info
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("loggedInUser", data.user.username);
        localStorage.setItem("className", data.user.className || "");
        localStorage.setItem("schoolName", data.user.schoolName || "");
        localStorage.setItem("role", data.user.role || "student");
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("email", data.user.email);

        console.log("✅ Login successful:", data.user);

        // Redirect to index/dashboard
        window.location.href = "index.html"; 
      } else {
        errorMsg.textContent = data.error || "Invalid email or password";
        console.error("Login error:", data.error);
      }
    } catch (err) {
      console.error("Network error:", err);
      errorMsg.textContent = "Server error. Is backend running?";
    }
  });
});

