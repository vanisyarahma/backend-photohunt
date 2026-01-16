document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role") || "pengguna";

  const btnBack = document.getElementById("btnBack");
  const btnContinue = document.getElementById("btnContinue");

  const inputName = document.getElementById("inputName");
  const inputPhone = document.getElementById("inputPhone");
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");

  const genderFemale = document.getElementById("genderFemale");
  const genderMale = document.getElementById("genderMale");

  let selectedGender = null;

  btnBack.onclick = () => {
    window.location.href = "login.html";
  };

  genderFemale.onclick = () => {
    selectedGender = "female";
    genderFemale.classList.add("gender-active");
    genderMale.classList.remove("gender-active");
  };

  genderMale.onclick = () => {
    selectedGender = "male";
    genderMale.classList.add("gender-active");
    genderFemale.classList.remove("gender-active");
  };

  btnContinue.onclick = async () => {
    const name = inputName.value.trim();
    const phone = inputPhone.value.trim();
    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!name || !phone || !email || !password || !selectedGender) {
      alert("Mohon lengkapi semua data dan pilih gender.");
      return;
    }

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role // 🔥 mitra / pengguna
        })
      });

      if (!res.ok) {
        alert("Gagal membuat akun (email mungkin sudah terdaftar)");
        return;
      }

      alert("Akun berhasil dibuat. Silakan login.");
      window.location.href = "login.html";

    } catch (err) {
      console.error(err);
      alert("Terjadi error saat signup");
    }
  };
});
