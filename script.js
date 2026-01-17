const storyDatabase = [
    // --- HISTORY ---
    { id: "hist-a-1", cat: "History", level: "A", title: "The Great Wall", text: "The Great Wall of China is very long. It was built many years ago to protect the country. Thousands of people worked on it. Today, many tourists visit this place to walk on the stones." },
    { id: "hist-b-1", cat: "History", level: "B", title: "Industrial Revolution", text: "The Industrial Revolution began in Great Britain in the late 1700s. It was a time when goods started being made by machines. This change led to the growth of cities and transformed the global economy." },
    { id: "hist-c-1", cat: "History", level: "C", title: "The Fall of Rome", text: "Historians debate the primary causes of the Roman Empire's decline. Factors included military overexpansion, political instability, and economic disruption. The complex interplay eventually led to total collapse." },
    
    // --- BUSINESS ---
    { id: "biz-a-1", cat: "Business", level: "A", title: "Small Shop", text: "John has a small shop. He sells coffee and tea. Many people come to his shop in the morning. He is happy because his business is good and customers are friendly." },
    { id: "biz-c-1", cat: "Business", level: "C", title: "Market Disruption", text: "Market disruption occurs when a smaller company with fewer resources is able to challenge established businesses. By focusing on overlooked segments, they redefine industry standards." },

    // --- PSYCHOLOGY ---
    { id: "psy-b-1", cat: "Psychology", level: "B", title: "Power of Habit", text: "Habits are small actions we do every day. It takes about 66 days to form a new habit. If you want to change your life, start with a small goal like exercising for ten minutes." },
    { id: "psy-c-1", cat: "Psychology", level: "C", title: "Cognitive Dissonance", text: "Cognitive dissonance is the mental discomfort experienced by a person who holds contradictory beliefs. To reduce tension, individuals often change their attitudes or justify behaviors." },

    // --- SLANG ---
    { id: "sla-a-1", cat: "Slang", level: "A", title: "Fun Idioms", text: "When something is very easy, we say it is a piece of cake. If you are happy, you are on cloud nine. These expressions make your English sound natural." },
    { id: "sla-c-1", cat: "Slang", level: "C", title: "Modern Slang", text: "Digital communication has birthed terms like ghosting. When something is excellent, Gen Z might call it fire or slay. Understanding these nuances is vital for modern social media." },

    // --- SPACE ---
    { id: "spa-b-1", cat: "Space", level: "B", title: "Solar System", text: "Our solar system has eight planets. Mars is the Red Planet, while Jupiter is the largest. Saturn has rings made of ice. Scientists use telescopes to explore distant worlds." }
];

const CATEGORIES = [
    { name: "History", icon: "🏛️" }, { name: "Technology", icon: "💻" },
    { name: "Science", icon: "🧪" }, { name: "Nature", icon: "🌿" },
    { name: "Business", icon: "📈" }, { name: "Culture", icon: "🎨" },
    { name: "Psychology", icon: "🧠" }, { name: "Space", icon: "🚀" },
    { name: "Health", icon: "🍎" }, { name: "Slang", icon: "💬" }
];

const LEVELS = [
    { id: "A", label: "Level A", desc: "Beginner" },
    { id: "B", label: "Level B", desc: "Intermediate" },
    { id: "C", label: "Level C", desc: "Advanced" }
];

let vocab = JSON.parse(localStorage.getItem('ef_final')) || [];
let currentCat = null;
let currentLvl = null;
let voices = [];

document.addEventListener('DOMContentLoaded', () => {
    window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
        const sel = document.getElementById('voice-select');
        if (sel) sel.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
    };
    renderCats();
    updateCount();
});

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}

function showPage(id) {
    stop();
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${id}`).classList.remove('hidden');
    if (id === 'practice') runQuiz();
    if (id === 'profile') renderVocab();
}

function renderCats() {
    hideSteps();
    updateBreadcrumb("All Categories");
    const grid = document.getElementById('cat-grid');
    grid.classList.remove('hidden');
    grid.innerHTML = CATEGORIES.map(c => `
        <div class="story-card !text-left group" onclick="chooseCat('${c.name}')">
            <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">${c.icon}</div>
            <h4 class="text-2xl font-black uppercase italic">${c.name}</h4>
        </div>
    `).join('');
}

function chooseCat(cat) {
    currentCat = cat;
    hideSteps();
    updateBreadcrumb(`All Categories > ${cat}`);
    const sel = document.getElementById('level-selection');
    sel.classList.remove('hidden');
    document.getElementById('level-grid').innerHTML = LEVELS.map(l => `
        <div class="story-card !p-12 border-b-4 border-b-transparent hover:border-b-indigo-500" onclick="chooseLvl('${l.id}')">
            <div class="text-3xl font-black text-indigo-500 mb-2">${l.id}</div>
            <h4 class="text-lg font-bold uppercase">${l.label}</h4>
        </div>
    `).join('');
}

function chooseLvl(lvl) {
    currentLvl = lvl;
    hideSteps();
    updateBreadcrumb(`All Categories > ${currentCat} > ${lvl}`);
    const sel = document.getElementById('stories-selection');
    sel.classList.remove('hidden');
    const filtered = storyDatabase.filter(s => s.cat === currentCat && s.level === lvl);
    document.getElementById('final-stories-grid').innerHTML = filtered.length ? filtered.map(s => `
        <div class="story-card !p-6 flex flex-col justify-between min-h-[160px]" onclick='openStory(${JSON.stringify(s)})'>
            <h5 class="font-bold text-sm">${s.title}</h5>
            <div class="text-[9px] font-black text-indigo-500 uppercase mt-4">Read Now →</div>
        </div>
    `).join('') : `<div class="col-span-full py-20 opacity-30 font-bold text-center">No texts yet. Try another level!</div>`;
}

function openStory(s) {
    showPage('home');
    document.getElementById('home-empty').classList.add('hidden');
    document.getElementById('reader-ui').classList.remove('hidden');
    document.getElementById('story-title').innerText = s.title;
    document.getElementById('story-meta').innerText = `${s.cat} | ${s.level}`;
    window.currentTxt = s.text;
    const box = document.getElementById('story-text');
    box.innerHTML = "";
    let pos = 0;
    s.text.split(/(\s+)/).forEach(part => {
        if (part.trim().length > 0) {
            const span = document.createElement('span');
            span.className = "word-span";
            span.innerText = part;
            span.dataset.start = pos;
            span.dataset.end = pos + part.length;
            span.onclick = () => saveWord(part.toLowerCase().replace(/[^a-z]/g, ''));
            box.appendChild(span);
        } else { box.appendChild(document.createTextNode(part)); }
        pos += part.length;
    });
}

async function saveWord(w) {
    if (w.length < 2) return;
    window.open(`https://context.reverso.net/translation/english-russian/${w}`, '_blank');
    try {
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${w}`);
        const d = await r.json();
        const tr = d[0][0][0].toLowerCase();
        if (!vocab.find(v => v.w === w)) {
            vocab.push({ w, tr });
            localStorage.setItem('ef_final', JSON.stringify(vocab));
            updateCount();
            toast(`Saved: ${w}`);
        }
    } catch(e) {}
}

function speak() {
    stop();
    window.isReading = true;
    const ut = new SpeechSynthesisUtterance(window.currentTxt);
    const sel = document.getElementById('voice-select');
    if (voices[sel.value]) ut.voice = voices[sel.value];
    ut.rate = 0.85;
    ut.onboundary = (e) => {
        if (!window.isReading || e.name !== 'word') return;
        const char = e.charIndex;
        document.querySelectorAll('.word-span').forEach(s => {
            const start = parseInt(s.dataset.start), end = parseInt(s.dataset.end);
            if (char >= start && char < end) {
                s.classList.add('reading-now');
                s.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else { s.classList.remove('reading-now'); }
        });
    };
    ut.onend = () => { window.isReading = false; clearH(); };
    window.speechSynthesis.speak(ut);
}

function stop() { window.speechSynthesis.cancel(); window.isReading = false; clearH(); }
function clearH() { document.querySelectorAll('.reading-now').forEach(e => e.classList.remove('reading-now')); }

function searchStories() {
    const q = document.getElementById('lib-search').value.toLowerCase();
    const res = document.getElementById('search-results');
    if (q.length < 2) { res.classList.add('hidden'); return; }
    const matches = storyDatabase.filter(s => s.title.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q)).slice(0, 5);
    res.classList.remove('hidden');
    res.innerHTML = matches.map(s => `<div class="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onclick='openStory(${JSON.stringify(s)})'>
        <div class="text-[8px] font-black text-indigo-500 uppercase">${s.cat}</div><div class="font-bold">${s.title}</div></div>`).join('');
}

function updateBreadcrumb(path) { document.getElementById('breadcrumb').innerText = path; }
function hideSteps() { document.getElementById('cat-grid').classList.add('hidden'); document.getElementById('level-selection').classList.add('hidden'); document.getElementById('stories-selection').classList.add('hidden'); }
function updateCount() { document.getElementById('v-count').innerText = vocab.length; }
function toast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.remove('opacity-0'); setTimeout(() => t.classList.add('opacity-0'), 2000); }
function runQuiz() {
    const act = document.getElementById('quiz-active'), none = document.getElementById('quiz-none');
    if (vocab.length < 4) { act.classList.add('hidden'); none.classList.remove('hidden'); return; }
    act.classList.remove('hidden'); none.classList.add('hidden');
    const cur = vocab[Math.floor(Math.random() * vocab.length)];
    document.getElementById('quiz-word').innerText = cur.w;
    let ops = [cur.tr];
    while(ops.length < 4) { let r = vocab[Math.floor(Math.random() * vocab.length)].tr; if (!ops.includes(r)) ops.push(r); }
    ops.sort(() => Math.random() - 0.5);
    document.getElementById('quiz-options').innerHTML = ops.map(o => `<button class="opt-btn" onclick="check(this, '${o}', '${cur.tr}')">${o}</button>`).join('');
}
function check(btn, val, cor) { if (val === cor) { btn.style.background = '#10b981'; btn.style.color = 'white'; setTimeout(runQuiz, 1000); } else { btn.style.background = '#ef4444'; btn.style.color = 'white'; } }
function renderVocab() { document.getElementById('vocab-list').innerHTML = vocab.map(v => `<div class="bg-white dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5 text-center"><div class="font-black text-[#5d5fef] uppercase text-xs">${v.w}</div><div class="text-[10px] opacity-40 uppercase">${v.tr}</div></div>`).join(''); }
