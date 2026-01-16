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

        btnContinue.onclick = () => {
          const name = inputName.value.trim();
          const phone = inputPhone.value.trim();
          const email = inputEmail.value.trim();
          const pass = inputPassword.value.trim();

          if (!name || !phone || !email || !pass || !selectedGender) {
            alert("Mohon lengkapi semua data dan pilih gender.");
            return;
          }

          console.log("REGISTER SUCCESS");
          console.log({ role, name, phone, email, gender: selectedGender });

          alert(`Akun berhasil dibuat untuk ${name}!\nSilakan login.`);
          window.location.href = "login.html";
        };
      });
