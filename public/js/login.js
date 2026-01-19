document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil Element HTML
    const emailInput = document.getElementById("phluEmail");
    const passwordInput = document.getElementById("phluPassword");
    const loginBtn = document.getElementById("phluLoginBtn");
    const signupBtn = document.querySelector(".phlu-signup-btn");
    
    const roleUserBtn = document.getElementById("phluRoleUser");
    const roleMitraBtn = document.getElementById("phluRoleMitra");
  
    // 2. LOGIKA PILIH ROLE (WAJIB DIPILIH)
    let selectedRole = null; 
  
    function resetButtons() {
        if(roleUserBtn) roleUserBtn.classList.remove("role-active");
        if(roleMitraBtn) roleMitraBtn.classList.remove("role-active");
    }
  
    // === A. Klik Tombol PENGGUNA ===
    if (roleUserBtn) {
        roleUserBtn.addEventListener("click", () => {
            selectedRole = "customer"; 
            resetButtons();
            roleUserBtn.classList.add("role-active"); 
            console.log("Role dipilih: CUSTOMER");
        });
    }
  
    // === B. Klik Tombol MITRA ===
    if (roleMitraBtn) {
        roleMitraBtn.addEventListener("click", () => {
            selectedRole = "mitra"; 
            resetButtons();
            roleMitraBtn.classList.add("role-active"); 
            console.log("Role dipilih: MITRA");
        });
    }
  
    // === C. Klik Tombol SIGN UP ===
    if(signupBtn) {
        signupBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // CEK 1: Apakah user sudah pilih role?
            if (!selectedRole) {
                alert("Wajib pilih salah satu: Apakah kamu 'Pengguna' atau 'Mitra'?");
                return; 
            }
  
            console.log("Mengarahkan ke signup sebagai:", selectedRole);
            window.location.href = `signup.html?role=${selectedRole}`;
        });
    }
  
    // === D. Klik Tombol LOGIN ===
    if(loginBtn) {
        loginBtn.addEventListener("click", async (e) => { 
            e.preventDefault(); 
            
            // CEK 1: User udah pilih role belum?
            if (!selectedRole) {
                alert("Kamu mau login sebagai apa? Silakan klik tombol 'Pengguna' atau 'Mitra' di atas.");
                return;
            }
  
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
                    const errorData = await res.json().catch(() => ({})); 
                    throw new Error(errorData.message || "Login gagal! Periksa email/password.");
                }
  
                const user = await res.json();
                
                // CEK 2: APAKAH DATABASE KOSONG? (Pencegahan Error)
                if (!user.role) {
                    alert("Akun ini datanya tidak lengkap (Role Kosong). Hubungi admin.");
                    return;
                }
                
                // CEK 3: VALIDASI ROLE (Penting!)
                if (user.role !== selectedRole) {
                    alert(`Gagal Masuk! Akun ini terdaftar sebagai "${user.role.toUpperCase()}", tapi kamu menekan tombol "${selectedRole.toUpperCase()}".`);
                    return; 
                }
  
                
                localStorage.setItem("currentUser", JSON.stringify(user));
                localStorage.setItem("authToken", user.id); 
  
                alert(`Login Berhasil sebagai ${selectedRole}!`);
  
                if (selectedRole === "mitra") {
                    try {
                        const check = await fetch(`http://localhost:3000/mitra/${user.id}/has-studio`);
                        const { hasStudio } = await check.json();
                        window.location.href = hasStudio ? "mitra/mitra-dashboard.html" : "mitra/daftar-studio.html";
                    } catch (innerErr) {
                        window.location.href = "mitra/mitra-dashboard.html";
                    }
                } else {
                    window.location.href = "customer-app.html";
                }
  
            } catch (err) {
                console.error("Error:", err);
                alert(err.message || "Gagal terhubung ke server");
            }
        });
    }
});