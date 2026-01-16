document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("phluEmail");
  const passwordInput = document.getElementById("phluPassword");

  const loginBtn = document.getElementById("phluLoginBtn");
  const signupBtn = document.querySelector(".phlu-signup-btn");

  const roleUser = document.getElementById("phluRoleUser");
  const roleMitra = document.getElementById("phluRoleMitra");

  let currentRole = "pengguna";

  // ===== ROLE TOGGLE =====
  roleUser.addEventListener("click", () => {
    currentRole = "pengguna";
    roleUser.classList.add("role-active");
    roleMitra.classList.remove("role-active");
  });

  roleMitra.addEventListener("click", () => {
    currentRole = "mitra";
    roleMitra.classList.add("role-active");
    roleUser.classList.remove("role-active");
  });

  // ===== LOGIN =====
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Email dan password wajib diisi");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});


      if (!res.ok) {
        alert("Login gagal");
        return;
      }

    const user = await res.json();


    localStorage.setItem("currentUser", JSON.stringify(user));

    if (user.role === "mitra") {
        localStorage.setItem("mitra_id", user.id); 
    }


      // 🔥 FLOW CERDAS MITRA
      if (user.role === "mitra") {
        const check = await fetch(`http://localhost:3000/mitra/${user.id}/has-studio`);

        const { hasStudio } = await check.json();

        if (hasStudio) {
          window.location.href = "/mitra/mitra-dashboard.html";
        } else {
          window.location.href = "/mitra/daftar-studio.html";
        }
      } else {
        window.location.href = "/customer-app.html";
      }

    } catch (err) {
      console.error(err);
      alert("Terjadi error saat login");
    }
  });

  // ===== SIGNUP =====
  signupBtn.addEventListener("click", () => {
    // 🔥 SIGNUP = BUAT AKUN, BUKAN DAFTAR STUDIO
    window.location.href = `/signup.html?role=${currentRole}`;
  });
});
