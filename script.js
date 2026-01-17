let vocabulary = JSON.parse(localStorage.getItem('ef_v10')) || [];
let voices = [];
let isReading = false;
let currentText = "";

const libraryDB = [
    { title: "The Red Planet", cat: "Science", text: "Mars is often called the Red Planet because of the iron oxide on its surface. Humans are planning to build cities there in the next fifty years. It will be a difficult but exciting challenge for explorers." },
    { title: "Ocean Giants", cat: "Nature", text: "Blue whales are the largest animals to ever exist on Earth. They eat tiny shrimp called krill. Despite their massive size, they are gentle creatures that sing beautiful songs under the water." },
    { title: "Electric Dreams", cat: "Tech", text: "Electric cars are replacing traditional vehicles to help save the environment. Modern batteries allow drivers to travel long distances without using gasoline. This technology is improving every year." },
    { title: "Secret Gardens", cat: "Lifestyle", text: "Gardening is a great way to reduce stress and enjoy nature. Growing your own vegetables ensures that your food is healthy and fresh. Many people find peace while working with the soil." },
    { title: "Coffee Culture", cat: "Culture", text: "Coffee is one of the most popular drinks in the world. From Italian espresso to Turkish coffee, every country has its own traditions. It brings people together in cafes and homes." }
];

document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки голосов
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
    renderLibrary();
    updateVocabCount();
});

// 1. ИСПРАВЛЕНИЕ СМЕНЫ ТЕМЫ
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const s = document.getElementById('voice-select');
    if(s && voices.length > 0) {
        s.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
    }
}

function showPage(id) {
    stopText();
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    if(id === 'practice') startQuiz();
    if(id === 'profile') renderVocabList();
}

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    grid.innerHTML = libraryDB.map(item => `
        <div class="topic-card p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" 
             onclick='openTopic(${JSON.stringify(item)})'>
            <div class="text-[10px] font-black uppercase text-indigo-500 mb-3 tracking-widest">${item.cat}</div>
            <h4 class="font-bold text-xl leading-tight">${item.title}</h4>
        </div>
    `).join('');
}

function openTopic(item) {
    showPage('home');
    document.getElementById('home-placeholder').classList.add('hidden');
    document.getElementById('ai-result').classList.remove('hidden');
    document.getElementById('res-title').innerText = item.title;
    currentText = item.text;
    
    const container = document.getElementById('res-text');
    container.innerHTML = "";
    
    let charAcc = 0;
    // Разбиваем на слова, сохраняя пробелы
    item.text.split(/(\s+)/).forEach(part => {
        if(part.trim().length > 0) {
            const span = document.createElement('span');
            span.className = "word-span";
            span.innerText = part;
            span.dataset.start = charAcc;
            span.dataset.end = charAcc + part.length;
            span.onclick = () => saveAndOpen(part.toLowerCase().replace(/[^a-z]/g, ''));
            container.appendChild(span);
        } else {
            container.appendChild(document.createTextNode(part));
        }
        charAcc += part.length;
    });
}

// 2. REVERSO + СОХРАНЕНИЕ
async function saveAndOpen(word) {
    if(word.length < 2) return;
    
    // ПРЯМАЯ ССЫЛКА НА REVERSO
    window.open(`https://context.reverso.net/translation/english-russian/${word}`, '_blank');

    try {
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${word}`);
        const d = await r.json();
        const translation = d[0][0][0].toLowerCase();

        if(!vocabulary.some(v => v.word === word)) {
            vocabulary.push({ word, translation });
            localStorage.setItem('ef_v10', JSON.stringify(vocabulary));
            updateVocabCount();
            showToast(`Added: ${word}`);
        }
    } catch(e) {}
}

// 3. СТАБИЛЬНАЯ ПОДСВЕТКА (EDGE + CHROME)
function speakText() {
    stopText();
    if (!currentText) return;
    isReading = true;

    const ut = new SpeechSynthesisUtterance(currentText);
    const voiceIdx = document.getElementById('voice-select').value;
    if(voices[voiceIdx]) ut.voice = voices[voiceIdx];
    ut.rate = 0.85;

    ut.onboundary = (e) => {
        if(!isReading || e.name !== 'word') return;
        
        const charIdx = e.charIndex;
        const spans = document.querySelectorAll('.word-span');
        
        spans.forEach(span => {
            const start = parseInt(span.dataset.start);
            const end = parseInt(span.dataset.end);
            
            if(charIdx >= start && charIdx < end) {
                span.classList.add('word-reading');
                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                span.classList.remove('word-reading');
            }
        });
    };

    ut.onend = () => { isReading = false; clearHL(); };
    window.speechSynthesis.speak(ut);
}

function stopText() {
    window.speechSynthesis.cancel();
    isReading = false;
    clearHL();
}

function clearHL() {
    document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading'));
}

// 4. ТЕСТЫ
function startQuiz() {
    const content = document.getElementById('quiz-content'), empty = document.getElementById('quiz-empty');
    if(vocabulary.length < 4) { content.classList.add('hidden'); empty.classList.remove('hidden'); return; }
    
    content.classList.remove('hidden'); empty.classList.add('hidden');

    const current = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    document.getElementById('quiz-word').innerText = current.word;
    
    let options = [current.translation];
    while(options.length < 4) {
        let rand = vocabulary[Math.floor(Math.random() * vocabulary.length)].translation;
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);

    document.getElementById('quiz-options').innerHTML = options.map(opt => `
        <button class="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 font-bold hover:border-indigo-500 transition-all" 
                onclick="checkAns(this, '${opt}', '${current.translation}')">${opt}</button>
    `).join('');
}

function checkAns(btn, val, correct) {
    if(val === correct) {
        btn.classList.add('bg-emerald-500', 'text-white', 'border-emerald-500');
        showToast("Correct! 🎉");
        setTimeout(startQuiz, 1000);
    } else {
        btn.classList.add('bg-rose-500', 'text-white', 'border-rose-500');
    }
}

function renderVocabList() {
    document.getElementById('dict-list').innerHTML = vocabulary.map(v => `
        <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <div class="font-black uppercase text-indigo-500 text-sm tracking-tighter">${v.word}</div>
            <div class="text-[10px] opacity-50 font-bold uppercase">${v.translation}</div>
        </div>
    `).join('');
}

function updateVocabCount() {
    document.getElementById('dict-count-nav').innerText = vocabulary.length;
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.remove('opacity-0');
    setTimeout(() => t.classList.add('opacity-0'), 2000);
}
