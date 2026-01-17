let vocabulary = JSON.parse(localStorage.getItem('ef_vocabulary')) || [];
let voices = [];
let currentText = "";
let currentLevel = "A1";

const topicsDB = {
    "A1": ["My Day", "Red Apple", "Small Cat", "Big House", "My Friend", "Family Dinner", "At School", "Pizza Time", "Morning Coffee", "Blue Sky", "My Dog", "Simple Math", "Green Tree", "Summer Sun", "Winter Snow", "My Room", "Shopping List", "Fast Car", "Little Bird", "Happy Birthday", "Water Bottle", "Bread and Milk", "Doctor Visit", "Park Walk", "Bus Stop", "In the Garden", "Cook Egg", "New Shoes", "Cold Rain", "Old Book", "Phone Call", "Sea Fish", "Farm Cow", "Yellow Sun", "Nice Song"],
    "B2": ["Modern Technology", "Climate Change", "Healthy Lifestyle", "Remote Work", "Space Exploration", "Artificial Intelligence", "World Economy", "Social Media", "Urban Life", "Mental Health", "Education System", "Global Travel", "Movie Industry", "Music Trends", "Future Cities", "Electric Vehicles", "Plastic Pollution", "Renewable Energy", "Genetic Engineering", "Deep Sea", "Volcanoes", "Ancient Rome", "History of Art", "Wildlife Safety", "Fast Fashion", "Internet Privacy", "Cryptocurrency", "Public Transport", "Olympics", "Psychology", "Space Tourism", "Nutrition", "Yoga Benefits", "Coffee Culture", "E-books"],
    "C1": ["Geopolitical Shifts", "Quantum Computing", "Philosophical Inquiry", "Macroeconomic Stability", "Sociological Phenomena", "Ethical Dilemmas", "Linguistic Diversity", "Neuroplasticity", "Sustainability Goals", "Diplomatic Relations", "Technological Singularity", "Architectural Evolution", "Existentialism", "Cultural Appropriation", "Cognitive Dissonance", "Quantum Mechanics", "Biotechnology Ethics", "Stellar Evolution", "Post-Modernism", "Global Governance", "Resource Scarcity", "Deep Learning", "Genetic Modification", "Space Colonization", "Demographic Shifts", "Paradigm Changes", "Artificial Consciousness", "Behavioral Economics", "Cyber Warfare", "Renewable Infrastructure", "Astrophysics", "Historical Revisionism", "Microbiology", "Epistemology", "Thermodynamics"]
};

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('ef_theme') === 'light') document.documentElement.classList.remove('dark');
    filterLibrary('A1');
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    updateUI();
});

function showPage(id) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    if(id === 'profile') renderAnalytics();
    if(id === 'practice') startVocabularyQuiz();
}

function filterLibrary(level) {
    currentLevel = level;
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + level).classList.add('active');
    
    const grid = document.getElementById('library-grid');
    grid.innerHTML = topicsDB[level].map(t => `
        <div class="topic-card" onclick="openTopic('${t}', '${level}')">
            <h4 class="font-bold">${t}</h4>
        </div>
    `).join('');
}

function openTopic(topic, level) {
    showPage('home');
    document.getElementById('home-placeholder').classList.add('hidden');
    document.getElementById('ai-result').classList.remove('hidden');
    document.getElementById('res-title').innerText = topic;
    
    let text = "";
    if(level === "A1") text = `This is a story about ${topic}. I like ${topic} very much. It is simple and good. Every day I see ${topic} and I feel happy. You can learn about ${topic} too.`;
    else if(level === "B2") text = `The importance of ${topic} in our modern society cannot be underestimated. Many people believe that ${topic} provides unique opportunities for development. However, we must consider the challenges associated with ${topic} in the long term.`;
    else text = `The conceptual framework of ${topic} necessitates a profound understanding of its underlying principles. Scholarly analysis indicates that ${topic} fundamentally alters our perception of contemporary reality, challenging established paradigms and fostering intellectual discourse.`;

    currentText = text;
    const container = document.getElementById('res-text');
    container.innerHTML = "";
    text.split(' ').forEach((word, i) => {
        const span = document.createElement('span');
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        span.className = "word-span";
        span.id = `word-${i}`;
        if(vocabulary.includes(clean)) span.classList.add('word-saved');
        span.innerText = word;
        span.onclick = () => { saveWord(clean); span.classList.add('word-saved'); };
        container.appendChild(span);
        container.appendChild(document.createTextNode(' '));
    });
}

function speakText() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = voices[document.getElementById('voice-select').value];
    
    utterance.onboundary = (event) => {
        if(event.name === 'word') {
            document.querySelectorAll('.word-reading').forEach(el => el.classList.remove('word-reading'));
            const wordIdx = currentText.substring(0, event.charIndex).split(' ').length - 1;
            const el = document.getElementById(`word-${wordIdx}`);
            if(el) el.classList.add('word-reading');
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

function addWordManually() {
    const input = document.getElementById('manual-word-input');
    const word = input.value.trim().toLowerCase().replace(/[^a-z]/g, '');
    if(word.length > 1 && !vocabulary.includes(word)) {
        vocabulary.push(word);
        localStorage.setItem('ef_vocabulary', JSON.stringify(vocabulary));
        updateUI(); renderAnalytics();
        input.value = "";
        showToast(`Added: ${word}`);
    }
}

function renderAnalytics() {
    const list = document.getElementById('dict-list');
    list.innerHTML = vocabulary.map(word => `
        <div class="card px-4 py-2 rounded-xl font-bold uppercase text-xs flex gap-3 items-center">
            ${word} <button onclick="speakWord('${word}')">🔊</button>
        </div>
    `).join('');
}

function startVocabularyQuiz() {
    if(!vocabulary.length) return;
    document.getElementById('quiz-word').innerText = vocabulary[Math.floor(Math.random()*vocabulary.length)];
    document.getElementById('quiz-input').value = "";
}

async function checkVocabularyWord() {
    const word = document.getElementById('quiz-word').innerText;
    const val = document.getElementById('quiz-input').value.trim().toLowerCase();
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${word}`);
    const d = await r.json();
    const correct = d[0][0][0].toLowerCase();
    if(val === correct || correct.includes(val)) { showToast("Correct!"); setTimeout(startVocabularyQuiz, 1000); }
    else showToast(`Wrong! It's: ${correct}`);
}

function loadVoices() {
    voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
    const s = document.getElementById('voice-select');
    if(s) s.innerHTML = voices.map((v, i) => `<option value="${i}">${v.name}</option>`).join('');
}

function toggleTheme() {
    const d = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ef_theme', d ? 'dark' : 'light');
}

function updateUI() {
    document.querySelectorAll('#dict-count-nav, #dict-count-main').forEach(e => e.innerText = vocabulary.length);
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
