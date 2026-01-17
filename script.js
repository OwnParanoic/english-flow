

let vocab = JSON.parse(localStorage.getItem('ef_v20')) || [];
let currentCategory = 'All';
let voices = [];
let isReading = false;

document.addEventListener('DOMContentLoaded', () => {
    renderCategoryNav();
    renderLibrary();
    updateCount();
    
    // Инициализация голосов
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
});

function loadVoices() {
    setTimeout(() => {
        voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
        const voiceSelect = document.getElementById('voice-select');
        if (voiceSelect) {
            voiceSelect.innerHTML = voices.map((v, i) => 
                `<option value="${i}">${v.name.replace(/Microsoft|Google|Apple|Desktop/g, '').trim()}</option>`
            ).join('');
        }
    }, 100);
}

function renderCategoryNav() {
    const cats = ['All', ...new Set(stories.map(s => s.cat))];
    const nav = document.getElementById('cat-nav');
    if (!nav) return;
    nav.innerHTML = cats.map(c => `
        <button onclick="filterCat('${c}')" class="cat-btn ${currentCategory === c ? 'active' : ''}">${c}</button>
    `).join('');
}

function filterCat(c) {
    currentCategory = c;
    renderCategoryNav();
    renderLibrary();
}

function renderLibrary() {
    const grid = document.getElementById('lib-grid');
    if (!grid) return;
    const filtered = currentCategory === 'All' ? stories : stories.filter(s => s.cat === currentCategory);
    
    grid.innerHTML = filtered.map(s => {
        const lvlColor = s.lvl === 'Easy' ? 'text-green-500' : s.lvl === 'Medium' ? 'text-orange-500' : 'text-red-500';
        const globalIndex = stories.indexOf(s);
        return `
            <div class="story-card" onclick="openStoryByIndex(${globalIndex})">
                <div class="card-meta">${s.cat} • <span class="${lvlColor}">${s.lvl}</span></div>
                <h4 class="card-title">${s.title}</h4>
            </div>
        `;
    }).join('');
}

function openStoryByIndex(index) {
    const s = stories[index];
    if (!s) return;

    showPage('home');
    document.getElementById('home-welcome').classList.add('hidden');
    document.getElementById('reader-ui').classList.remove('hidden');

    document.getElementById('story-title').innerText = s.title;
    document.getElementById('story-meta').innerText = `${s.cat} • ${s.lvl}`;
    
    const box = document.getElementById('story-text');
    box.innerHTML = "";
    
    // Разделяем текст на абзацы
    const paragraphs = s.text.split('\n\n');
    
    paragraphs.forEach(pText => {
        const pElement = document.createElement('p');
        pElement.style.marginBottom = "1.5rem"; // Отступ между абзацами
        pElement.style.textAlign = "left";
        
        // Разбиваем абзац на слова
        const words = pText.split(/(\s+)/);
        words.forEach(part => {
            if (part.trim().length > 0) {
                const span = document.createElement('span');
                span.className = "word-span hover:text-indigo-600 transition cursor-pointer";
                span.innerText = part;
                span.onclick = (e) => {
                    e.stopPropagation();
                    saveWord(part.toLowerCase().replace(/[^a-z]/g, ''));
                };
                pElement.appendChild(span);
            } else {
                pElement.appendChild(document.createTextNode(part));
            }
        });
        box.appendChild(pElement);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showPage(id) {
    stop();
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`page-${id}`);
    if (target) target.classList.remove('hidden');

    if (id === 'home') {
        document.getElementById('home-welcome').classList.remove('hidden');
        document.getElementById('reader-ui').classList.add('hidden');
    }
    if (id === 'practice') runQuiz();
    if (id === 'profile') renderVocab();
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
            localStorage.setItem('ef_v20', JSON.stringify(vocab));
            updateCount();
            showToast(`Saved: ${w}`);
        }
    } catch(e) {}
}

function speak() {
    stop();
    const textElement = document.getElementById('story-text');
    const wordSpans = textElement.querySelectorAll('.word-span');
    if (wordSpans.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(textElement.innerText);
    const voiceIndex = document.getElementById('voice-select').value;
    
    if (voices[voiceIndex]) utterance.voice = voices[voiceIndex];
    utterance.rate = 0.85;
    isReading = true;

    utterance.onboundary = (event) => {
        if (!isReading || event.name !== 'word') return;
        
        // Надежный расчет индекса слова для Chrome/Edge
        const charIndex = event.charIndex;
        const textUpToChar = textElement.innerText.substring(0, charIndex);
        const currentWordIndex = textUpToChar.split(/\s+/).filter(x => x.length > 0).length;

        wordSpans.forEach(s => s.classList.remove('reading-now'));
        if (wordSpans[currentWordIndex]) {
            wordSpans[currentWordIndex].classList.add('reading-now');
            wordSpans[currentWordIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    utterance.onend = stop;
    utterance.onerror = stop;
    window.speechSynthesis.speak(utterance);
}

function stop() {
    isReading = false;
    window.speechSynthesis.cancel();
    document.querySelectorAll('.reading-now').forEach(el => el.classList.remove('reading-now'));
}

function runQuiz() {
    const active = document.getElementById('quiz-active');
    const none = document.getElementById('quiz-none');
    if (vocab.length < 4) {
        active.classList.add('hidden');
        none.classList.remove('hidden');
        return;
    }
    active.classList.remove('hidden');
    none.classList.add('hidden');

    const correct = vocab[Math.floor(Math.random() * vocab.length)];
    document.getElementById('quiz-word').innerText = correct.w;

    let options = [correct.tr];
    while(options.length < 4) {
        let r = vocab[Math.floor(Math.random() * vocab.length)].tr;
        if (!options.includes(r)) options.push(r);
    }
    options.sort(() => Math.random() - 0.5);

    document.getElementById('quiz-options').innerHTML = options.map(o => `
        <button class="opt-btn" onclick="checkAnswer(this, '${o}', '${correct.tr}')">${o}</button>
    `).join('');
}

function checkAnswer(btn, selected, correct) {
    if (selected === correct) {
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
        setTimeout(runQuiz, 700);
    } else {
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#ef4444';
    }
}

function renderVocab() {
    const list = document.getElementById('vocab-list');
    if (!list) return;
    list.innerHTML = vocab.map(v => `
        <div class="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm text-center border border-slate-50 dark:border-white/5">
            <div class="font-bold text-[#5d5fef]">${v.w}</div>
            <div class="text-[10px] uppercase opacity-40 font-bold mt-1">${v.tr}</div>
        </div>
    `).join('');
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}

function updateCount() {
    const el = document.getElementById('v-count');
    if (el) el.innerText = vocab.length;
}

function showToast(m) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = m; t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
}


