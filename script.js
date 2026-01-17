let vocabulary = JSON.parse(localStorage.getItem('ef_v6')) || [];
let voices = [];
let currentText = "";
let isReading = false;

// База данных
const libraryDB = [
    { cat: 'Geography', title: 'The Amazon River', level: 'Medium', text: 'The Amazon River in South America is the largest river by discharge volume of water in the world. It flows through the tropical rainforest.' },
    { cat: 'Animals', title: 'Ocean Giants', level: 'Hard', text: 'Blue whales are the largest animals ever known to have lived on Earth. These magnificent marine mammals rule the oceans.' },
    { cat: 'Science', title: 'Mars Future', level: 'Hard', text: 'Mars is the fourth planet from the Sun. NASA is currently exploring its surface to find signs of ancient life.' }
];

const categories = ['Geography', 'Animals', 'Science', 'Cooking', 'Work'];
categories.forEach(c => {
    for(let i=1; i<=5; i++) {
        libraryDB.push({ cat: c, title: `${c} Topic ${i}`, level: 'Easy', text: `This text explores the interesting aspects of ${c.toLowerCase()}. It is designed to help you practice English and build your core vocabulary.` });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateUI();
    filterLib('all');
});

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    // Приоритет на Google голоса для качества
    voices.sort((a,b) => b.name.includes('Google') - a.name.includes('Google'));
    const s = document.getElementById('voice-select');
    if(s) s.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function showPage(id) {
    stopText();
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    if(id === 'practice') startVocabularyQuiz();
    if(id === 'profile') renderAnalytics();
}

function filterLib(cat) {
    const grid = document.getElementById('library-grid');
    grid.innerHTML = "";
    const filtered = cat === 'all' ? libraryDB : libraryDB.filter(i => i.cat === cat);
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = "topic-card";
        div.onclick = () => openTopic(item);
        div.innerHTML = `<div class="text-[9px] opacity-40 uppercase font-black mb-1">${item.cat}</div><h4 class="font-bold text-sm">${item.title}</h4>`;
        grid.appendChild(div);
    });
}

function openTopic(item) {
    showPage('home');
    document.getElementById('home-placeholder').classList.add('hidden');
    document.getElementById('ai-result').classList.remove('hidden');
    document.getElementById('res-title').innerText = item.title;
    currentText = item.text;
    const container = document.getElementById('res-text');
    container.innerHTML = "";
    
    // Каждое слово оборачиваем в span с уникальным char-индексом начала слова
    let charAcc = 0;
    item.text.split(/(\s+)/).forEach((part) => {
        if (part.trim().length > 0) {
            const span = document.createElement('span');
            span.className = "word-span";
            span.dataset.start = charAcc;
            span.dataset.end = charAcc + part.length;
            span.innerText = part;
            
            const sentence = item.text.split(/[.!?]/).find(s => s.includes(part)) || item.text;
            span.onclick = () => saveWord(part.toLowerCase().replace(/[^a-z]/g, ''), sentence);
            
            container.appendChild(span);
        } else {
            container.appendChild(document.createTextNode(part));
        }
        charAcc += part.length;
    });
}

// УЛЬТИМАТИВНАЯ ПОДСВЕТКА ДЛЯ CHROME
function speakText() {
    stopText();
    isReading = true;
    const ut = new SpeechSynthesisUtterance(currentText);
    ut.voice = voices[document.getElementById('voice-select').value];
    ut.rate = 0.85;

    ut.onboundary = (e) => {
        if (!isReading || e.name !== 'word') return;
        
        const charIdx = e.charIndex;
        // Находим span, чей dataset.start наиболее близок к charIdx
        const spans = document.querySelectorAll('.word-span');
        let currentSpan = null;

        spans.forEach(span => {
            span.classList.remove('word-reading');
            const start = parseInt(span.dataset.start);
            const end = parseInt(span.dataset.end);
            // Chrome может давать charIndex с небольшой погрешностью из-за знаков препинания
            if (charIdx >= start && charIdx < end) {
                currentSpan = span;
            }
        });

        if (currentSpan) {
            currentSpan.classList.add('word-reading');
            currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    ut.onend = () => { isReading = false; highlightNone(); };
    window.speechSynthesis.speak(ut);
}

function highlightNone() { document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading')); }

function stopText() {
    window.speechSynthesis.cancel();
    isReading = false;
    highlightNone();
}

async function saveWord(w, context) {
    if(w.length < 2) return;
    try {
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(w)}`);
        const d = await r.json();
        const translation = d[0][0][0].toLowerCase();
        
        if(!vocabulary.find(v => v.word === w)) {
            vocabulary.push({ word: w, translation, context: context.trim() });
            localStorage.setItem('ef_v6', JSON.stringify(vocabulary));
            updateUI();
            showToast(`Saved: ${w}`);
        }
    } catch(e) { showToast("Error"); }
}

function startVocabularyQuiz() {
    const content = document.getElementById('quiz-content'), empty = document.getElementById('quiz-empty');
    if(vocabulary.length < 4) { content.classList.add('hidden'); empty.classList.remove('hidden'); return; }
    content.classList.remove('hidden'); empty.classList.add('hidden');
    
    const current = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    document.getElementById('quiz-word').innerText = current.word;
    document.getElementById('quiz-hint').innerText = `"${current.context.replace(new RegExp(current.word, 'gi'), '____')}"`;
    
    let opts = [current.translation];
    while(opts.length < 4) {
        let r = vocabulary[Math.floor(Math.random() * vocabulary.length)].translation;
        if(!opts.includes(r)) opts.push(r);
    }
    opts.sort(() => Math.random() - 0.5);
    
    const container = document.getElementById('quiz-options');
    container.innerHTML = "";
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if(opt === current.translation) {
                btn.classList.add('correct');
                showToast("Excellent!");
                setTimeout(startVocabularyQuiz, 1000);
            } else {
                btn.classList.add('wrong');
            }
        };
        container.appendChild(btn);
    });
}

function renderAnalytics() {
    document.getElementById('dict-list').innerHTML = vocabulary.map(v => `
        <div class="card p-5 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div class="flex justify-between items-center mb-2">
                <span class="font-black uppercase text-indigo-600 dark:text-indigo-400">${v.word}</span>
                <button onclick="speakWord('${v.word}')" class="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 rounded-full">🔊</button>
            </div>
            <div class="text-xs font-bold mb-1">${v.translation}</div>
            <div class="text-[10px] opacity-40 italic line-clamp-2">${v.context}</div>
        </div>
    `).join('');
}

function speakWord(w) {
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(w);
    ut.voice = voices[document.getElementById('voice-select').value];
    ut.rate = 0.8;
    window.speechSynthesis.speak(ut);
}

function updateUI() { document.querySelectorAll('#dict-count-nav, #dict-count-main').forEach(el => el.innerText = vocabulary.length); }
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.remove('opacity-0'); setTimeout(() => t.classList.add('opacity-0'), 2000); }
function toggleTheme() { document.documentElement.classList.toggle('dark'); }
function addWordManually() { const val = document.getElementById('manual-word-input').value.trim(); if(val) saveWord(val.toLowerCase(), "Manual add"); }
