const stories = [
    { title: "The Sahara Desert", cat: "Geography", lvl: "Medium", text: "The Sahara is the world's largest hot desert. It covers most of North Africa. The landscape features massive sand dunes and rocky plateaus. Temperatures can be extreme, reaching over fifty degrees during the day." },
    { title: "Pacific Islands", cat: "Geography", lvl: "Medium", text: "There are thousands of islands in the Pacific Ocean. Many were formed by volcanoes. They have tropical climates and unique wildlife that cannot be found anywhere else on Earth." },
    { title: "Grand Canyon", cat: "Geography", lvl: "Easy", text: "The Grand Canyon is in Arizona, USA. It was carved by the Colorado River over millions of years. It is famous for its colorful rock layers and incredible size." },
    { title: "Icelandic Glaciers", cat: "Geography", lvl: "Medium", text: "Iceland is known as the land of fire and ice. It has many glaciers and active volcanoes. Scientists visit Iceland to study how ice moves and how it affects our planet's climate." },
    { title: "African Savanna", cat: "Geography", lvl: "Easy", text: "The savanna is a large grassland in Africa. It is home to many famous animals like lions, elephants, and zebras. There are two seasons: the dry season and the rainy season." },
    { title: "The Alps", cat: "Geography", lvl: "Medium", text: "The Alps are the highest mountain range in Europe. They stretch across eight countries. People love to visit the Alps for skiing in winter and hiking in the summer." },
    { title: "Rivers of Europe", cat: "Geography", lvl: "Easy", text: "Europe has many important rivers like the Danube and the Rhine. These rivers are used for transport and provide water to many large cities across the continent." },
    { title: "Lion King", cat: "Animals", lvl: "Easy", text: "The lion is known as the king of the jungle. They live in groups called prides. Male lions have beautiful manes, while females do most of the hunting for the family." },
    { title: "Cooking Pasta", cat: "Cooking", lvl: "Easy", text: "Italian pasta is easy to cook. You need boiling water and salt. Boil the pasta for ten minutes until it is soft. Serve it with tomato sauce and fresh cheese." }
];

let vocab = JSON.parse(localStorage.getItem('ef_v20')) || [];
let currentCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
    renderCategoryNav();
    renderLibrary();
    updateCount();
});

// НАВИГАЦИЯ КАТЕГОРИЙ
function renderCategoryNav() {
    const cats = ['All', ...new Set(stories.map(s => s.cat))];
    const nav = document.getElementById('cat-nav');
    nav.innerHTML = cats.map(c => `
        <button onclick="filterCat('${c}')" class="cat-btn ${currentCategory === c ? 'active' : ''}">${c}</button>
    `).join('');
}

function filterCat(c) {
    currentCategory = c;
    renderCategoryNav();
    renderLibrary();
}

// РЕНДЕР БИБЛИОТЕКИ (ВИД КАК НА СКРИНШОТЕ)
function renderLibrary() {
    const grid = document.getElementById('lib-grid');
    const filtered = currentCategory === 'All' ? stories : stories.filter(s => s.cat === currentCategory);
    
    grid.innerHTML = filtered.map(s => `
        <div class="story-card" onclick='openStory(${JSON.stringify(s)})'>
            <div class="card-meta">${s.cat} • ${s.lvl}</div>
            <h4 class="card-title">${s.title}</h4>
        </div>
    `).join('');
}

function openStory(s) {
    // Сначала переключаемся на страницу Home
    showPage('home');
    
    // Скрываем приветствие и показываем ридер
    document.getElementById('home-welcome').classList.add('hidden');
    document.getElementById('reader-ui').classList.remove('hidden');
    
    // Наполняем данными
    document.getElementById('story-title').innerText = s.title;
    document.getElementById('story-meta').innerText = `${s.cat} • ${s.lvl}`;
    
    const box = document.getElementById('story-text');
    box.innerHTML = "";
    
    let pos = 0;
    // Разбиваем текст на слова для кликабельности
    s.text.split(/(\s+)/).forEach(part => {
        if (part.trim().length > 0) {
            const span = document.createElement('span');
            span.className = "word-span";
            span.innerText = part;
            span.onclick = () => saveWord(part.toLowerCase().replace(/[^a-z]/g, ''));
            box.appendChild(span);
        } else {
            box.appendChild(document.createTextNode(part));
        }
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
            localStorage.setItem('ef_v20', JSON.stringify(vocab));
            updateCount();
            showToast(`Saved: ${w}`);
        }
    } catch(e) {}
}

// ПРАКТИКА (ИСПРАВЛЕННАЯ)
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
        let randomTr = vocab[Math.floor(Math.random() * vocab.length)].tr;
        if (!options.includes(randomTr)) options.push(randomTr);
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
        setTimeout(runQuiz, 800);
    } else {
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#ef4444';
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function showPage(id) {
    // Остановить озвучку при переходе на любую страницу
    stop();
    
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${id}`).classList.remove('hidden');

    // Если переходим на Home вручную (через меню), показываем приветствие и скрываем ридер
    if (id === 'home') {
        document.getElementById('home-welcome').classList.remove('hidden');
        document.getElementById('reader-ui').classList.add('hidden');
    }
    
    if (id === 'practice') runQuiz();
    if (id === 'profile') renderVocab();
    
    // Скролл в начало страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stop() { window.speechSynthesis.cancel(); }

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}

function updateCount() { document.getElementById('v-count').innerText = vocab.length; }

function showToast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
}

function renderVocab() {
    document.getElementById('vocab-list').innerHTML = vocab.map(v => `
        <div class="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm text-center border border-slate-50 dark:border-white/5">
            <div class="font-bold text-[#5d5fef]">${v.w}</div>
            <div class="text-[10px] uppercase opacity-40 font-bold mt-1">${v.tr}</div>
        </div>
    `).join('');
}

