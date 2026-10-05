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

// Chat-Vorführung: mehrere Alltags-Szenarien nacheinander (oder per Klick auswählbar)
const wave = '<div class="voice"><i></i><span class="wave"></span>1:42</div>';
const yesNo = (t) => `${t}<div class="btns"><span>✅ Ja</span><span>❌ Nein</span></div>`;
const scenes = [
  { name: "Sprachnachricht", steps: [
    { who: "me", html: `<span class="fwd">Weitergeleitet · Max</span>${wave}` },
    { who: "me", html: "Fass zusammen und trag den Termin ein" },
    { who: "bot", html: "Max bietet den X5 für 34.500 € netto an, 68 tkm. Besichtigung Do 14:00 in Stuttgart, Rückmeldung bis Freitag." },
    { who: "bot", html: yesNo("Termin eintragen?<br><b>Besichtigung X5</b> · Do 14:00") },
    { who: "me", html: "Ja" },
    { who: "bot", html: "Steht im Kalender ✅" },
  ] },
  { name: "Nachfassen", steps: [
    { who: "me", html: "Erinner mich Freitag 10 Uhr, bei Max wegen dem Angebot nachzuhaken" },
    { who: "bot", html: "Mach ich ⏰ Freitag, 10:00 – Nachfassen bei Max (Angebot A-2026-014)." },
    { who: "bot", html: "<b>⏰ Erinnerung</b><br>Bei Max wegen dem Angebot nachhaken. Soll ich dir eine kurze Nachricht vorformulieren?" },
    { who: "me", html: "Ja bitte, locker" },
    { who: "bot", html: "Hi Max, kurz nachgefragt: Konntest du dir das Angebot schon anschauen? Bei Fragen meld dich gern 🙂" },
  ] },
  { name: "PDF prüfen", steps: [
    { who: "me", html: '<span class="fwd">Weitergeleitet · Großhandel Nord</span><div class="file">Preisliste_Q4.pdf</div>' },
    { who: "me", html: "Was hat sich gegenüber letztem Mal geändert?" },
    { who: "bot", html: "3 Änderungen: Versiegelung +8 %, Polsterreiniger −5 %, Mindestbestellwert jetzt 250 €. Alles andere gleich." },
    { who: "bot", html: "Soll ich die neuen Preise in deine Lieferanten-Tabelle übernehmen?" },
    { who: "me", html: "Ja" },
    { who: "bot", html: "Erledigt ✅ Tabelle aktualisiert." },
  ] },
  { name: "E-Mail", steps: [
    { who: "me", html: '<span class="fwd">Weitergeleitet · Gruppe Projekt Halle</span>„Brauchen die Freigabe vom Vermieter bis Mittwoch“' },
    { who: "me", html: "Mach eine Mail an Frau Schneider draus, freundlich" },
    { who: "bot", html: "Entwurf liegt in Gmail ✉️<br><b>Betreff:</b> Freigabe Halle bis Mittwoch<br>Sehr geehrte Frau Schneider, …" },
    { who: "me", html: "Perfekt, ich schick sie ab" },
  ] },
  { name: "Angebot", steps: [
    { who: "me", html: "Mach Max ein Angebot: 3 Aufbereitungen à 289 € und eine Keramikversiegelung" },
    { who: "bot", html: '<div class="file">Angebot_A-2026-015.pdf</div>' },
    { who: "bot", html: "Netto 1.516,50 €, brutto 1.804,64 € – in deinem Briefkopf. Soll ich dich in 5 Tagen ans Nachfassen erinnern?" },
  ] },
];

const chat = document.getElementById("chat");
const tabs = document.getElementById("scenes");
let current = 0, run = 0;
const wait = (ms, id) => new Promise((r, x) => setTimeout(() => (id === run ? r() : x()), reduced ? 0 : ms));

scenes.forEach((sc, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = sc.name; b.setAttribute("role", "tab");
  b.addEventListener("click", () => play(i));
  tabs.appendChild(b);
});

function bubble(who, html) {
  const el = document.createElement("div");
  el.className = `msg ${who}`;
  el.innerHTML = html;
  chat.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  return el;
}

async function play(index) {
  const id = ++run;
  current = index;
  [...tabs.children].forEach((b, i) => b.setAttribute("aria-selected", String(i === index)));
  chat.innerHTML = "";
  try {
    for (const step of scenes[index].steps) {
      if (step.who === "bot") {
        const t = bubble("bot", '<span class="typing"><b></b><b></b><b></b></span>');
        await wait(900, id);
        t.remove();
      } else await wait(650, id);
      bubble(step.who, step.html);
      await wait(1400, id);
    }
    if (reduced) return;
    await wait(2800, id);
    play((current + 1) % scenes.length);
  } catch { /* durch Klick auf ein anderes Szenario abgelöst */ }
}

new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { play(0); obs.disconnect(); } }, { threshold: 0.3 })
  .observe(chat);

// Gehirn-Grafik: Mitte = Business, Ring = Bereiche, außen = Beispiele. Lichtpunkte bringen "neue Infos" zur Mitte.
(function brain() {
  const svg = document.getElementById("brain");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const C = { x: 320, y: 280 };
  const groups = [
    { name: "Kunden", leaves: ["Max", "Autohaus Muster"] },
    { name: "Projekte", leaves: ["BMW X5", "Halle Köln"] },
    { name: "Angebote", leaves: ["A-2026-014"] },
    { name: "Termine", leaves: ["Besichtigung Do 14:00"] },
    { name: "Absprachen", leaves: ["34.500 € netto"] },
    { name: "Sprachnachrichten", leaves: ["„Passt dir 14 Uhr?“"] },
    { name: "Dokumente", leaves: ["Preisliste Q4.pdf", "8 Fotos"] },
    { name: "Lieferanten", leaves: ["Großhandel Nord"] },
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

// "Ein Chat statt zehn Apps": verstreute Apps fliegen zusammen, der eine Chat füllt sich
(function merge() {
  const box = document.getElementById("merge");
  if (!box) return;
  box.querySelectorAll(".one-chat li").forEach((li, i) => { li.style.transitionDelay = `${0.9 + i * 0.09}s`; });
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    if (reduced) { box.classList.add("merged"); return; }
    // Schleife: 2,5 s verstreut → zusammenfliegen → 5 s stehen lassen → von vorn
    const cycle = () => {
      box.classList.remove("merged");
      setTimeout(() => box.classList.add("merged"), 2500);
      setTimeout(cycle, 2500 + 5500);
    };
    setTimeout(cycle, 400);
  }, { threshold: 0.45 }).observe(box);
})();
