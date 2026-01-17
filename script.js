let vocabulary = JSON.parse(localStorage.getItem('ef_vocabulary')) || [];
let voices = [];
let currentText = "";
let currentLevel = "A1";

// Мощная база данных (100+ тем распределены по категориям)
const libraryDB = [];
const categories = ['Geography', 'Animals', 'Cooking', 'Work', 'Study'];
const levels = ['Easy', 'Medium', 'Hard'];

// Генерируем качественную базу на 105 элементов
categories.forEach(cat => {
    levels.forEach(lvl => {
        for(let i = 1; i <= 7; i++) {
            libraryDB.push({
                id: `${cat}-${lvl}-${i}`,
                cat: cat,
                level: lvl,
                title: `${cat} Lesson ${i}`,
                text: generateContent(cat, lvl, i)
            });
        }
    });
});

function generateContent(cat, lvl, i) {
    if(lvl === 'Easy') return `In this lesson about ${cat.toLowerCase()}, we learn simple things. Lesson ${i} is very good for beginners. You can read this text and understand every word. People like ${cat.toLowerCase()} because it is interesting and very fun to study every day.`;
    if(lvl === 'Medium') return `The study of ${cat.toLowerCase()} has become increasingly important in our modern world. In this section, lesson ${i} explores the intermediate concepts that define the field. Many professionals suggest that understanding ${cat.toLowerCase()} requires consistent practice and attention to detail.`;
    return `Advanced analysis of ${cat.toLowerCase()} reveals a complex intersection of theoretical principles and practical applications. In lesson ${i}, we examine the paradigm shifts that have influenced the evolution of ${cat.toLowerCase()} throughout history. Scholars argue that a comprehensive mastery of this subject is essential for intellectual growth.`;
}

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('ef_theme') === 'light') document.documentElement.classList.remove('dark');
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateUI();
    filterLib('all');
});

function showPage(id) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    if(id === 'profile') renderAnalytics();
    if(id === 'practice') startVocabularyQuiz();
}

function filterLib(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText.toLowerCase() === cat.toLowerCase() || (cat === 'all' && b.innerText === 'All')) b.classList.add('active');
    });

    const grid = document.getElementById('library-grid');
    grid.innerHTML = "";
    
    const filtered = cat === 'all' ? libraryDB : libraryDB.filter(item => item.cat === cat);
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = "topic-card";
        div.onclick = () => openTopic(item);
        div.innerHTML = `
            <div class="text-[9px] font-black uppercase opacity-30 mb-2">${item.cat} • ${item.level}</div>
            <h4 class="font-bold text-lg">${item.title}</h4>
        `;
        grid.appendChild(div);
    });
}

function openTopic(item) {
    showPage('home');
    document.getElementById('home-placeholder').classList.add('hidden');
    document.getElementById('ai-result').classList.remove('hidden');
    document.getElementById('res-title').innerText = item.title;
    document.getElementById('res-level').innerText = item.level;
    
    currentText = item.text;
    const container = document.getElementById('res-text');
    container.innerHTML = "";
    
    item.text.split(' ').forEach((word, i) => {
        const span = document.createElement('span');
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        span.className = "word-span";
        span.id = `word-${i}`;
        if(vocabulary.includes(clean)) span.classList.add('word-saved');
        span.innerText = word;
        span.onclick = (e) => { saveWord(clean); span.classList.add('word-saved'); };
        container.appendChild(span);
        container.appendChild(document.createTextNode(' '));
    });
}

function speakText() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentText);
    const select = document.getElementById('voice-select');
    if(voices[select.value]) utterance.voice = voices[select.value];
    
    utterance.onboundary = (event) => {
        if(event.name === 'word') {
            document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading'));
            const idx = currentText.substring(0, event.charIndex).trim().split(' ').length - 1;
            const target = document.getElementById(`word-${idx >= 0 ? idx : 0}`);
            if(target) {
                target.classList.add('word-reading');
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };
    
    utterance.onend = () => document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading'));
    window.speechSynthesis.speak(utterance);
}

function saveWord(w) {
    if(!w || w.length < 2) return;
    if(!vocabulary.includes(w)) {
        vocabulary.push(w);
        localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
        updateUI();
        showToast(`Saved: ${w}`);
    }
    window.open(`https://context.reverso.net/translation/english-russian/${w}`, '_blank');
}

function renderAnalytics() {
    const list = document.getElementById('dict-list');
    list.innerHTML = vocabulary.map(word => `
        <div class="card p-4 rounded-2xl font-bold flex justify-between items-center group hover:border-indigo-500 transition">
            <span class="uppercase text-xs tracking-tight">${word}</span>
            <button onclick="speakWord('${word}')" class="opacity-20 group-hover:opacity-100">🔊</button>
        </div>
    `).join('');
}

function startVocabularyQuiz() {
    if(!vocabulary.length) return;
    document.getElementById('quiz-word').innerText = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    document.getElementById('quiz-input').value = "";
}

async function checkVocabularyWord() {
    const word = document.getElementById('quiz-word').innerText;
    const val = document.getElementById('quiz-input').value.trim().toLowerCase();
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${word}`);
    const d = await r.json();
    const correct = d[0][0][0].toLowerCase();
    if(val === correct || correct.includes(val)) {
        showToast("Brilliant! 🎉");
        setTimeout(startVocabularyQuiz, 800);
    } else showToast(`Actually, it is: ${correct}`);
}

function addWordManually() {
    const input = document.getElementById('manual-word-input');
    const word = input.value.trim().toLowerCase().replace(/[^a-z]/g, '');
    if(word.length > 1 && !vocabulary.includes(word)) {
        vocabulary.push(word);
        localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
        updateUI(); renderAnalytics();
        input.value = "";
        showToast("Word added!");
    }
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const s = document.getElementById('voice-select');
    if(s) s.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function toggleTheme() {
    const d = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ef_theme', d ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = d ? '🌙' : '☀️';
}

function updateUI() {
    document.querySelectorAll('#dict-count-nav, #dict-count-main').forEach(el => el.innerText = vocabulary.length);
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.remove('opacity-0');
    setTimeout(() => t.classList.add('opacity-0'), 2000);
}

function speakWord(w) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(w));
}
