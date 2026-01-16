const labels = Array.from(document.querySelectorAll(".stars label"));
const radios = Array.from(document.querySelectorAll(".stars input"));
const review = document.getElementById("review");
const sendBtn = document.getElementById("sendBtn");

function setRating(value) {
    const radio = document.querySelector(`.stars input[value="${value}"]`);
    if (radio) radio.checked = true;

    labels.forEach(lbl => {
        const v = Number(lbl.dataset.value);
        lbl.classList.toggle("active", v <= value);
    });

    updateButton();
}

function getRating() {
    const checked = radios.find(r => r.checked);
    return checked ? Number(checked.value) : 0;
}

function updateButton() {
    const rating = getRating();
    const ok = rating > 0;

    sendBtn.disabled = !ok;
}

labels.forEach(lbl => {
    lbl.addEventListener("click", () => setRating(Number(lbl.dataset.value)));
});

radios.forEach(r => {
    r.addEventListener("change", () => setRating(Number(r.value)));
});

sendBtn.addEventListener("click", () => {
    const rating = getRating();
    const text = review.value.trim();

    if (rating === 0) return;

    const reviewData = {
        rating: rating,
        ulasan: text,
        tanggal: new Date().toLocaleDateString('id-ID')
    };
    localStorage.setItem('lastReview', JSON.stringify(reviewData));

    console.log("Mengirim ke server:", reviewData);

    window.location.href = "info-rating.html";
});
setRating(0);