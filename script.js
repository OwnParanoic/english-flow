let vocabulary = JSON.parse(localStorage.getItem('ef_vocabulary')) || [];
let voices = [];
let currentArt = null;
let selectedAns = [];
let isTranslated = false;
let currentQuizWord = "";

const translator = {"космос": "space", "музыка": "music", "еда": "cooking", "спорт": "sports", "история": "history"};

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('ef_theme') === 'light') document.documentElement.classList.remove('dark');
    document.getElementById('theme-toggle').onclick = toggleTheme;
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateUI();
    checkImportedWords();
});

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const select = document.getElementById('voice-select');
    if(select && voices.length) {
        select.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
    }
}

function showPage(id) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-'+id).classList.remove('hidden');
    if(id === 'profile') renderAnalytics();
    if(id === 'practice') startVocabularyQuiz();
}

function generateAIContent() {
    const promptEl = document.getElementById('ai-prompt');
    const level = document.getElementById('diff-select').value;
    let raw = promptEl.value.trim().toLowerCase();
    if(!raw) return;

    let topic = translator[raw] || (/[а-яё]/i.test(raw) ? "topic" : raw);
    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('ai-result').classList.add('hidden');

    setTimeout(() => {
        let content = "";
        if(level === 'A1') content = `Learning about ${topic} is fun. Many people like ${topic}. You can study ${topic} with your friends. It is very simple and cool.`;
        else if(level === 'C1') content = `The complex nature of ${topic} requires a sophisticated approach to mastery. Scholars argue that ${topic} fundamentally reshapes our cognitive perception of reality.`;
        else content = `Exploring ${topic} is a great way to improve your skills. This lesson focuses on the practical application of ${topic} in everyday life.`;

        currentArt = {
            title: topic.charAt(0).toUpperCase() + topic.slice(1),
            text: content,
            quiz: [
                { q: `What is this text about?`, qRu: `О чем этот текст?`, o: [topic, "Nothing", "Travel"], a: 0 }
            ]
        };
        renderArt();
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('ai-result').classList.remove('hidden');
        promptEl.value = "";
    }, 600);
}

function renderArt() {
    document.getElementById('res-title').innerText = currentArt.title;
    document.getElementById('res-text').innerHTML = currentArt.text.split(' ').map(w => 
        `<span class="word-span" onclick="saveWord('${w.replace(/[^\w]/g, '')}')">${w}</span>`
    ).join(' ');
    document.getElementById('res-quiz').innerHTML = currentArt.quiz.map((q, i) => `
        <div class="space-y-4">
            <p class="font-bold text-lg">"${q.q}" <span class="quiz-translation ${isTranslated?'reveal':''}">/ ${q.qRu}</span></p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                ${q.o.map((opt, oi) => `<button onclick="selectAns(this, ${i}, ${oi})" class="opt-btn p-4 rounded-2xl text-left bg-white/5">${opt}</button>`).join('')}
            </div>
        </div>
    `).join('');
    selectedAns = [];
    document.getElementById('check-btn').disabled = false;
    document.getElementById('quiz-score').innerText = "";
}

function saveWord(w) {
    if(!w || w.length < 2) return;
    const low = w.toLowerCase();
    if(!vocabulary.includes(low)) {
        vocabulary.push(low);
        localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
        updateUI();
        showToast(`Saved: ${low}`);
    }
    window.open(`https://context.reverso.net/translation/english-russian/${low}`, '_blank');
}

function renderAnalytics() {
    const list = document.getElementById('dict-list');
    list.innerHTML = "";
    if(!vocabulary.length) list.innerHTML = `<p class="opacity-40 italic">Dictionary is empty...</p>`;
    vocabulary.forEach(w => {
        const d = document.createElement('div');
        d.className = "flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border dark:border-indigo-800 transition hover:scale-105";
        d.innerHTML = `<span class="font-bold text-xs uppercase">${w}</span><button onclick="speakWord('${w}')" class="opacity-50 hover:opacity-100">🔊</button>`;
        list.appendChild(d);
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
    document.getElementById('quiz-input').focus();
}

async function checkVocabularyWord() {
    const input = document.getElementById('quiz-input');
    const userVal = input.value.trim().toLowerCase();
    if(!userVal) return;
    
    try {
        const resp = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${currentQuizWord}`);
        const data = await resp.json();
        const correct = data[0][0][0].toLowerCase();
        if(userVal === correct || correct.includes(userVal)) {
            showToast("Correct! 🎉");
            setTimeout(startVocabularyQuiz, 1200);
        } else {
            showToast(`Wrong! Correct: ${correct}`);
            input.classList.add('border-red-500');
            setTimeout(() => { input.classList.remove('border-red-500'); startVocabularyQuiz(); }, 2000);
        }
    } catch { startVocabularyQuiz(); }
}

function shareVocabulary() {
    if(!vocabulary.length) return;
    const code = btoa(encodeURIComponent(JSON.stringify(vocabulary)));
    const url = `${window.location.origin}${window.location.pathname}?import=${code}`;
    navigator.clipboard.writeText(url).then(() => showToast("Link copied to clipboard!"));
}

function checkImportedWords() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('import');
    if(data) {
        try {
            const words = JSON.parse(decodeURIComponent(atob(data)));
            if(confirm(`Import ${words.length} words from friend?`)) {
                vocabulary = [...new Set([...vocabulary, ...words])];
                localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
                updateUI();
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch(e) {}
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ef_theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '🌙' : '☀️';
}

function selectAns(btn, qi, oi) {
    btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAns[qi] = oi;
}

function checkQuiz() {
    if(selectedAns.length < currentArt.quiz.length) return;
    const blocks = document.getElementById('res-quiz').children;
    let score = 0;
    currentArt.quiz.forEach((q, i) => {
        const btns = blocks[i].querySelectorAll('.opt-btn');
        btns.forEach((b, bi) => {
            if(bi === q.a) b.classList.add('correct');
            else if(bi === selectedAns[i]) b.classList.add('wrong');
        });
        if(selectedAns[i] === q.a) score++;
    });
    document.getElementById('quiz-score').innerText = `Score: ${score}/${currentArt.quiz.length}`;
    document.getElementById('check-btn').disabled = true;
}

function updateUI() {
    document.getElementById('dict-count-nav').innerText = vocabulary.length;
    document.getElementById('dict-count-main').innerText = vocabulary.length;
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

function toggleQuizTranslation() {
    isTranslated = !isTranslated;
    document.querySelectorAll('.quiz-translation').forEach(el => el.classList.toggle('reveal', isTranslated));
}

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.remove('opacity-0');
    setTimeout(() => t.classList.add('opacity-0'), 2000);
}