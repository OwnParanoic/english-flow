let vocabulary = JSON.parse(localStorage.getItem('ef_vocabulary')) || [];
let voices = [];
let currentText = "";
let isPaused = false;

// БАЗА ДАННЫХ И ТЕМЫ
const libraryDB = [
    { cat: 'Geography', title: 'The Sahara Desert', level: 'Medium', text: 'The Sahara is the largest hot desert in the world. It covers much of North Africa. The climate is extremely dry and hot.' },
    { cat: 'Animals', title: 'Mountain Gorillas', level: 'Hard', text: 'Mountain gorillas live in high-altitude forests. They are highly social and intelligent creatures living in family groups.' },
    { cat: 'Science', title: 'Quantum Computers', level: 'Hard', text: 'Quantum computers use qubits to perform calculations. They can process information much faster than traditional supercomputers.' }
];

const topics = {
    'Geography': ['Pacific Islands', 'Grand Canyon', 'Icelandic Glaciers', 'African Savanna', 'The Alps', 'Rivers of Europe'],
    'Animals': ['Giant Pandas', 'Blue Whales', 'Desert Foxes', 'Arctic Wolves', 'Monarch Butterflies', 'Golden Eagles'],
    'Cooking': ['French Pastry', 'Mexican Tacos', 'Greek Salad', 'Indian Spices', 'Brewing Coffee', 'Healthy Smoothies'],
    'Work': ['Freelance Life', 'Job Efficiency', 'Leadership Skills', 'Global Economy', 'Networking Tips', 'Business Growth'],
    'Science': ['Genetic Code', 'Climate Change', 'Neural Networks', 'Space Travel', 'Atomic Structure', 'Robotics Future']
};

Object.keys(topics).forEach(cat => {
    topics[cat].forEach((name, i) => {
        libraryDB.push({
            cat: cat,
            title: name,
            level: i % 2 === 0 ? 'Medium' : 'Easy',
            text: `Learning about ${name} is a great way to improve your ${cat.toLowerCase()} knowledge. This topic is essential for modern education. Understanding the details of ${name} will help you expand your vocabulary and speak more fluently. We recommend practicing this text several times until you feel confident with every word.`
        });
    });
});

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
    const filtered = cat === 'all' ? libraryDB : libraryDB.filter(i => i.cat === cat);
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = "topic-card";
        div.onclick = () => openTopic(item);
        div.innerHTML = `<div class="text-[9px] opacity-30 mb-2 uppercase font-black">${item.cat} • ${item.level}</div><h4 class="font-bold text-sm">${item.title}</h4>`;
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
    item.text.split(' ').forEach((word, i) => {
        const span = document.createElement('span');
        span.className = "word-span";
        span.id = `word-${i}`;
        span.innerText = word;
        span.onclick = () => saveWord(word.toLowerCase().replace(/[^a-z]/g, ''));
        container.appendChild(span);
        container.appendChild(document.createTextNode(' '));
    });
}

// ПЛЕЕР
function speakText() {
    window.speechSynthesis.cancel();
    isPaused = false;
    updateVoiceButtons('playing');
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = voices[document.getElementById('voice-select').value];
    utterance.rate = 0.9;
    utterance.onboundary = (e) => {
        if (e.name === 'word') {
            const idx = currentText.substring(0, e.charIndex).trim().split(/\s+/).length - 1;
            document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading'));
            const target = document.getElementById(`word-${idx < 0 ? 0 : idx}`);
            if (target) { target.classList.add('word-reading'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
    };
    utterance.onend = () => stopText();
    window.speechSynthesis.speak(utterance);
}

function pauseText() { if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); updateVoiceButtons('paused'); } }
function resumeText() { if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); updateVoiceButtons('playing'); } }
function stopText() { window.speechSynthesis.cancel(); document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading')); updateVoiceButtons('stopped'); }

function updateVoiceButtons(state) {
    const play = document.getElementById('btn-play');
    const pause = document.getElementById('btn-pause');
    const resume = document.getElementById('btn-resume');
    if (state === 'playing') { play.classList.add('hidden'); pause.classList.remove('hidden'); resume.classList.add('hidden'); }
    else if (state === 'paused') { play.classList.add('hidden'); pause.classList.add('hidden'); resume.classList.remove('hidden'); }
    else { play.classList.remove('hidden'); pause.classList.add('hidden'); resume.classList.add('hidden'); }
}

// ПРАКТИКА
function startVocabularyQuiz() {
    const content = document.getElementById('quiz-content');
    const empty = document.getElementById('quiz-empty');
    if(!vocabulary.length) { content.classList.add('hidden'); empty.classList.remove('hidden'); return; }
    content.classList.remove('hidden'); empty.classList.add('hidden');
    document.getElementById('quiz-word').innerText = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    document.getElementById('quiz-input').value = ""; document.getElementById('quiz-input').focus();
}

async function checkVocabularyWord() {
    const word = document.getElementById('quiz-word').innerText;
    const val = document.getElementById('quiz-input').value.trim().toLowerCase();
    if(!val) return;
    try {
        const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${word}`);
        const d = await r.json();
        const correct = d[0][0][0].toLowerCase();
        if(val === correct || correct.includes(val)) { showToast("Correct! 🎉"); setTimeout(startVocabularyQuiz, 1000); }
        else { showToast(`Wrong. It's: ${correct}`); }
    } catch(e) { showToast("Error"); }
}

function saveWord(w) {
    if(!w || w.length < 2) return;
    if(!vocabulary.includes(w)) { vocabulary.push(w); localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary)); updateUI(); showToast(`Saved: ${w}`); }
}

function addWordManually() {
    const val = document.getElementById('manual-word-input').value.trim().toLowerCase().replace(/[^a-z]/g, '');
    if(val.length > 1) { vocabulary.push(val); localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary)); updateUI(); renderAnalytics(); document.getElementById('manual-word-input').value = ""; }
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const s = document.getElementById('voice-select');
    if(s) s.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function updateUI() { document.querySelectorAll('#dict-count-nav, #dict-count-main').forEach(el => el.innerText = vocabulary.length); }
function showToast(m) { const t = document.getElementById('toast'); t.innerText = m; t.classList.remove('opacity-0'); setTimeout(() => t.classList.add('opacity-0'), 2000); }
function toggleTheme() { const d = document.documentElement.classList.toggle('dark'); localStorage.setItem('ef_theme', d ? 'dark' : 'light'); }
function renderAnalytics() {
    document.getElementById('dict-list').innerHTML = vocabulary.map(word => `<div class="card p-4 rounded-xl font-bold uppercase text-xs flex justify-between items-center">${word} <button onclick="window.speechSynthesis.speak(new SpeechSynthesisUtterance('${word}'))">🔊</button></div>`).join('');
}
