let slideIndex = 1;
let autoSlideInterval;

function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
        plusSlides(1);
    }, 5000);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");

    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

// 👉 Add click-to-next on the image
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.getElementsByClassName("mySlides");
    for (let i = 0; i < slides.length; i++) {
        slides[i].addEventListener("click", () => {
            plusSlides(1);
        });
        slides[i].addEventListener("mouseenter", stopAutoSlide);
        slides[i].addEventListener("mouseleave", startAutoSlide);
    }
    startAutoSlide();
});