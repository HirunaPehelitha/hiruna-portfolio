// Initialize Lenis for Smooth Scrolling
const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// GSAP Setup
gsap.registerPlugin(ScrollTrigger);

// Custom Cursor
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
const links = document.querySelectorAll('a, .pill-btn, img');

gsap.set(cursor, {xPercent: -50, yPercent: -50});
gsap.set(cursorFollower, {xPercent: -50, yPercent: -50});

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
    gsap.to(cursorFollower, { x: e.clientX, y: e.clientY, duration: 0.5, ease: "power2.out" });
});

links.forEach(link => {
    link.addEventListener('mouseenter', () => document.body.classList.add('hovered'));
    link.addEventListener('mouseleave', () => document.body.classList.remove('hovered'));
});

// Animations on Load (Hero)
window.addEventListener('load', () => {
    const tl = gsap.timeline();
    
    tl.fromTo('.hero-title', 
        { y: 50, autoAlpha: 0, scale: 0.95 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: "power3.out" }
    )
    .fromTo('.hero-date', 
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
        "-=1"
    )
    .fromTo('.pill-btn',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" },
        "-=0.5"
    );
});

// Scroll Reveal - Fade Up Elements
gsap.utils.toArray('.gsap-fade-up').forEach(elem => {
    gsap.fromTo(elem, 
        { y: 50, autoAlpha: 0 },
        {
            y: 0, autoAlpha: 1, duration: 1, ease: "power2.out",
            scrollTrigger: {
                trigger: elem,
                start: "top 85%",
            }
        }
    );
});

// Delay 1 elements
gsap.utils.toArray('.delay-1').forEach(elem => {
    gsap.fromTo(elem, 
        { y: 30, autoAlpha: 0 },
        {
            y: 0, autoAlpha: 1, duration: 1, delay: 0.3, ease: "power2.out",
            scrollTrigger: {
                trigger: elem,
                start: "top 90%",
            }
        }
    );
});



// Footer Reveal
gsap.fromTo('.thank-you', 
    { scale: 0.9, autoAlpha: 0 },
    {
        scale: 1, autoAlpha: 1, duration: 1.5, ease: "power2.out",
        scrollTrigger: { trigger: '.footer-slide', start: "top 60%" }
    }
);
