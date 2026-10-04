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

// Gehirn-Grafik: Mitte = Business, Ring = Bereiche, außen = Beispiele. Lichtpunkte bringen "neue Infos" zur Mitte.
(function brain() {
  const svg = document.getElementById("brain");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const C = { x: 320, y: 280 };
  const groups = [
    { name: "Kunden", leaves: ["Ahmed", "Autohaus Weber"] },
    { name: "Projekte", leaves: ["BMW X5", "Halle Köln"] },
    { name: "Angebote", leaves: ["A-2026-014"] },
    { name: "Termine", leaves: ["Besichtigung Do 14:00"] },
    { name: "Absprachen", leaves: ["34.500 € netto"] },
    { name: "Sprachnachrichten", leaves: ["„Passt dir 14 Uhr?“"] },
    { name: "Dokumente", leaves: ["Preisliste Q4.pdf", "8 Fotos"] },
    { name: "Lieferanten", leaves: ["Plock GmbH"] },
  ];
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  };
  const curve = (a, b, bend) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    return `M${a.x},${a.y} Q${mx - dy * bend},${my + dx * bend} ${b.x},${b.y}`;
  };
  const label = (parent, x, y, text, cls) => {
    const g = el("g", { class: `node ${cls}` }, parent);
    const inner = el("g", { class: "float", style: `animation-delay:${(-Math.random() * 6).toFixed(2)}s` }, g);
    const t = el("text", { x, y }, inner);
    t.textContent = text;
    const w = text.length * (cls === "cat" ? 8.6 : 7) + 26, h = cls === "cat" ? 34 : 28;
    const r = el("rect", { class: "pill", x: x - w / 2, y: y - h / 2, width: w, height: h, rx: h / 2 }, inner);
    inner.insertBefore(r, t);
    return g;
  };

  const edgesLayer = el("g", {}, svg);
  const nodesLayer = el("g", {}, svg);
  const sparkPaths = [];
  groups.forEach((grp, i) => {
    const ang = (i / groups.length) * Math.PI * 2 - Math.PI / 2;
    const p = { x: C.x + Math.cos(ang) * 165, y: C.y + Math.sin(ang) * 150 };
    const g = el("g", { class: "group" }, edgesLayer);
    const e = el("path", { class: "edge", d: curve(C, p, 0.12) }, g);
    e.style.setProperty("--len", Math.ceil(e.getTotalLength()));
    e.style.transitionDelay = `${i * 90}ms`;
    sparkPaths.push(e);
    grp.leaves.forEach((leaf, j) => {
      const spread = (j - (grp.leaves.length - 1) / 2) * 0.32;
      const q = { x: C.x + Math.cos(ang + spread) * 262, y: C.y + Math.sin(ang + spread) * 235 };
      const le = el("path", { class: "edge leaf", d: curve(p, q, 0.08) }, g);
      le.style.setProperty("--len", Math.ceil(le.getTotalLength()));
      le.style.transitionDelay = `${700 + i * 90 + j * 60}ms`;
      const n = label(nodesLayer, q.x, q.y, leaf, "leafnode");
      n.style.transitionDelay = le.style.transitionDelay;
    });
    const n = label(nodesLayer, p.x, p.y, grp.name, "cat");
    n.style.transitionDelay = `${300 + i * 90}ms`;
    n.addEventListener("mouseenter", () => g.classList.add("hot"));
    n.addEventListener("mouseleave", () => g.classList.remove("hot"));
  });
  const core = el("g", { class: "node core" }, nodesLayer);
  el("circle", { class: "halo", cx: C.x, cy: C.y, r: 46 }, core);
  el("circle", { class: "c1", cx: C.x, cy: C.y, r: 46 }, core);
  const ct = el("text", { x: C.x, y: C.y - 9 }, core); ct.textContent = "Dein";
  const ct2 = el("text", { x: C.x, y: C.y + 13 }, core); ct2.textContent = "Business";

  const box = svg.closest(".brain");
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    box.classList.add("drawn");
    obs.disconnect();
    if (reduced) return;
    // Lichtpunkte: von einem Bereich zur Mitte
    const spark = el("circle", { class: "spark", r: 4, opacity: 0 }, edgesLayer);
    const run = () => {
      const path = sparkPaths[Math.floor(Math.random() * sparkPaths.length)];
      const len = path.getTotalLength(), start = performance.now(), dur = 1400;
      path.parentNode.classList.add("hot");
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const pt = path.getPointAtLength(len * (1 - t)); // außen → Mitte
        spark.setAttribute("cx", pt.x); spark.setAttribute("cy", pt.y);
        spark.setAttribute("opacity", String(Math.sin(t * Math.PI)));
        if (t < 1) requestAnimationFrame(step);
        else { path.parentNode.classList.remove("hot"); setTimeout(run, 600); }
      };
      requestAnimationFrame(step);
    };
    setTimeout(run, 2200);
  }, { threshold: 0.3 }).observe(box);
})();
