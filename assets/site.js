// Kleine Animationen: Einblenden beim Scrollen, sortierende Nachrichten, Chat-Vorführung.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const nav = document.getElementById("nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  io.observe(el);
});

// Chaos → Ordnung: Karten sortieren sich, sobald sie sichtbar sind
const threads = document.getElementById("threads");
new IntersectionObserver(([e], obs) => {
  if (e.isIntersecting) { setTimeout(() => threads.classList.add("sorted"), reduced ? 0 : 700); obs.disconnect(); }
}, { threshold: 0.4 }).observe(threads);

// Chat-Vorführung
const script = [
  { who: "me", html: '<span class="fwd">Weitergeleitet · Ahmed</span><div class="voice"><i></i><span class="wave"></span>1:42</div>' },
  { who: "me", html: "Fass zusammen und trag den Termin ein" },
  { who: "bot", html: "Ahmed bietet den X5 für 34.500 € netto an, 68 tkm, Besichtigung Do 14:00 in Stuttgart. Er braucht bis Freitag eine Rückmeldung." },
  { who: "bot", html: "Termin eintragen?<br><b>Besichtigung X5</b> · Do 14:00<div class=\"btns\"><span>✅ Ja</span><span>❌ Nein</span></div>" },
  { who: "me", html: "Ja. Und mach Ahmed ein Angebot für die Aufbereitung" },
  { who: "bot", html: '<div class="file">Angebot_A-2026-014.pdf</div>' },
  { who: "bot", html: "Erledigt ✅ Soll ich dich Freitag 9 Uhr ans Nachfassen erinnern?" },
];

const chat = document.getElementById("chat");
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

function bubble(who, html) {
  const el = document.createElement("div");
  el.className = `msg ${who}`;
  el.innerHTML = html;
  chat.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  return el;
}

async function play() {
  for (;;) {
    chat.innerHTML = "";
    for (const step of script) {
      if (step.who === "bot") {
        const t = bubble("bot", '<span class="typing"><b></b><b></b><b></b></span>');
        await wait(900);
        t.remove();
      } else await wait(700);
      bubble(step.who, step.html);
      await wait(1300);
    }
    if (reduced) return;
    await wait(3500);
  }
}

new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { play(); obs.disconnect(); } }, { threshold: 0.3 })
  .observe(chat);
