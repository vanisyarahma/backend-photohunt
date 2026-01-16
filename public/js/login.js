document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("phluEmail");
    const passwordInput = document.getElementById("phluPassword");

    const loginBtn = document.getElementById("phluLoginBtn");
    const signupBtn = document.querySelector(".phlu-signup-btn");
    const googleBtn = document.querySelector(".phlu-google");

    const roleUser = document.getElementById("phluRoleUser");
    const roleMitra = document.getElementById("phluRoleMitra");

    let currentRole = "pengguna";

    roleUser.addEventListener("click", () => {
        currentRole = "pengguna";
        roleUser.style.border = "2px solid #000";
        roleMitra.style.border = "none";
        console.log("Role aktif: Pengguna");
    });

    roleMitra.addEventListener("click", () => {
        currentRole = "mitra";
        roleMitra.style.border = "2px solid #000";
        roleUser.style.border = "none";
        console.log("Role aktif: Mitra");
    });

    loginBtn.addEventListener("click", () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Email dan Password wajib diisi untuk Login.");
            return;
        }

        console.log("Melakukan Login...");
        console.log("Role:", currentRole);

        alert(`Login berhasil sebagai ${currentRole.toUpperCase()}`);

        if (currentRole === "mitra") {
            window.location.href = "mitra/mitra-dashboard.html";
        } else {
            window.location.href = "customer-app.html";
        }
    });

    signupBtn.addEventListener("click", () => {
        console.log("Tombol Sign Up diklik");
        
        if (currentRole === "mitra") {
            window.location.href = "daftar-studio.html";
        } else {
            window.location.href = "signup.html";
        }
    });

    googleBtn.addEventListener("click", () => {
        console.log("Google Auth clicked");
        window.location.href = `google-auth.html?role=${currentRole}`;
    });
});