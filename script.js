let vocabulary = JSON.parse(localStorage.getItem('ef_vocabulary')) || [];
let voices = [];
let currentArt = null;
let currentQuizWord = "";

document.addEventListener('DOMContentLoaded', () => {
    // Восстановление темы
    if(localStorage.getItem('ef_theme') === 'light') {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-toggle').innerText = '☀️';
    }
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateUI();
    checkImportedWords();
});

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ef_theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '🌙' : '☀️';
}

function showPage(id) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    if(id === 'profile') renderAnalytics();
    if(id === 'practice') startVocabularyQuiz();
}

function generateAIContent() {
    const input = document.getElementById('ai-prompt');
    let topic = input.value.trim();
    if(!topic) return;

    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('ai-result').classList.add('hidden');

    setTimeout(() => {
        currentArt = {
            title: topic,
            text: `Learning about ${topic.toLowerCase()} is an amazing experience. Many experts believe that ${topic.toLowerCase()} helps people develop new skills. When you study ${topic.toLowerCase()}, you open new doors for your future.`
        };
        renderArt();
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('ai-result').classList.remove('hidden');
        input.value = "";
    }, 800);
}

function renderArt() {
    document.getElementById('res-title').innerText = currentArt.title;
    const container = document.getElementById('res-text');
    container.innerHTML = "";
    
    currentArt.text.split(' ').forEach(word => {
        const span = document.createElement('span');
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        span.className = "word-span";
        if(vocabulary.includes(clean)) span.classList.add('word-saved');
        span.innerText = word;
        span.onclick = (e) => {
            saveWord(clean);
            e.target.classList.add('word-saved');
        };
        container.appendChild(span);
        container.appendChild(document.createTextNode(' '));
    });
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

function addWordManually() {
    const input = document.getElementById('manual-word-input');
    const word = input.value.trim().toLowerCase().replace(/[^a-z]/g, '');
    if(word.length < 2) return;
    
    if(!vocabulary.includes(word)) {
        vocabulary.push(word);
        localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
        updateUI();
        renderAnalytics();
        input.value = "";
        showToast(`Added: ${word}`);
    } else {
        showToast("Already exists");
    }
}

function renderAnalytics() {
    const list = document.getElementById('dict-list');
    list.innerHTML = "";
    vocabulary.forEach(word => {
        const div = document.createElement('div');
        div.className = "card px-5 py-3 rounded-2xl font-bold uppercase text-xs flex items-center gap-3";
        div.innerHTML = `<span>${word}</span><button onclick="speakWord('${word}')" class="opacity-30">🔊</button>`;
        list.appendChild(div);
    });
}

function startVocabularyQuiz() {
    const box = document.getElementById('quiz-box');
    const empty = document.getElementById('quiz-empty');
    if(!vocabulary.length) { box.classList.add('hidden'); empty.classList.remove('hidden'); return; }
    box.classList.remove('hidden'); empty.classList.add('hidden');
    currentQuizWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    document.getElementById('quiz-word').innerText = currentQuizWord;
    document.getElementById('quiz-input').value = "";
}

async function checkVocabularyWord() {
    const val = document.getElementById('quiz-input').value.trim().toLowerCase();
    if(!val) return;
    try {
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${currentQuizWord}`);
        const d = await r.json();
        const correct = d[0][0][0].toLowerCase();
        if(val === correct || correct.includes(val)) {
            showToast("Correct! 🎉");
            setTimeout(startVocabularyQuiz, 1000);
        } else {
            showToast(`Wrong! It is: ${correct}`);
            setTimeout(startVocabularyQuiz, 2000);
        }
    } catch { startVocabularyQuiz(); }
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const select = document.getElementById('voice-select');
    if(select) select.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function updateUI() {
    document.getElementById('dict-count-nav').innerText = vocabulary.length;
    document.getElementById('dict-count-main').innerText = vocabulary.length;
}

function shareVocabulary() {
    const code = btoa(encodeURIComponent(JSON.stringify(vocabulary)));
    const url = `${window.location.origin}${window.location.pathname}?import=${code}`;
    navigator.clipboard.writeText(url).then(() => showToast("Link copied!"));
}

function checkImportedWords() {
    const p = new URLSearchParams(window.location.search);
    const d = p.get('import');
    if(d) {
        try {
            const words = JSON.parse(decodeURIComponent(atob(d)));
            vocabulary = [...new Set([...vocabulary, ...words])];
            localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
            updateUI();
            window.history.replaceState({}, '', window.location.pathname);
        } catch(e) {}
    }
}

function speakText() {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentArt.text);
    u.voice = voices[document.getElementById('voice-select').value];
    window.speechSynthesis.speak(u);
}

function speakWord(w) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(w));
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.remove('opacity-0');
    setTimeout(() => t.classList.add('opacity-0'), 2000);
}
