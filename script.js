const stories = [
    // GEOGRAPHY
    { title: "The Sahara Desert", cat: "Geography", lvl: "Medium", text: "The Sahara is the world's largest hot desert. It covers most of North Africa. The landscape features massive sand dunes and rocky plateaus." },
    { title: "Pacific Islands", cat: "Geography", lvl: "Medium", text: "There are thousands of islands in the Pacific Ocean. Many were formed by volcanoes. They have tropical climates and unique wildlife." },
    { title: "Grand Canyon", cat: "Geography", lvl: "Easy", text: "The Grand Canyon is in Arizona, USA. It was carved by the Colorado River over millions of years. It is famous for its colorful rock layers." },
    { title: "Icelandic Glaciers", cat: "Geography", lvl: "Medium", text: "Iceland is known as the land of fire and ice. It has many glaciers and active volcanoes. Scientists visit it to study climate change." },
    { title: "African Savanna", cat: "Geography", lvl: "Easy", text: "The savanna is a large grassland in Africa. It is home to many famous animals like lions, elephants, and zebras. It has two main seasons." },
    { title: "The Alps", cat: "Geography", lvl: "Medium", text: "The Alps are the highest mountain range in Europe. They stretch across eight countries. People visit for skiing and hiking." },
    { title: "Rivers of Europe", cat: "Geography", lvl: "Easy", text: "Europe has many important rivers like the Danube and the Rhine. They are used for transport and provide water to large cities." },
    { title: "Amazon Rainforest", cat: "Geography", lvl: "Hard", text: "The Amazon is the largest tropical rainforest in the world. It plays a vital role in regulating the Earth's oxygen and carbon cycles." },

    // ANIMALS
    { title: "The Lion King", cat: "Animals", lvl: "Easy", text: "The lion is known as the king of the jungle. They live in groups called prides. Males have manes, while females do the hunting." },
    { title: "Giant Pandas", cat: "Animals", lvl: "Easy", text: "Pandas live in the mountains of China. They eat almost nothing but bamboo. They are famous for their black and white fur." },
    { title: "Great White Shark", cat: "Animals", lvl: "Medium", text: "The Great White is a large predator found in coastal waters. They have hundreds of sharp teeth and a powerful sense of smell." },
    { title: "The Blue Whale", cat: "Animals", lvl: "Hard", text: "The blue whale is the largest animal ever known to have lived on Earth. Despite their size, they feed mainly on tiny shrimp-called krill." },
    { title: "Honey Bees", cat: "Animals", lvl: "Medium", text: "Bees are essential for pollinating flowers and crops. They live in highly organized colonies led by a single queen bee." },

    // SCIENCE
    { title: "Solar System", cat: "Science", lvl: "Easy", text: "Our solar system has eight planets. The Sun is at the center. Earth is the only planet known to support life." },
    { title: "Black Holes", cat: "Science", lvl: "Hard", text: "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape from its pull." },
    { title: "DNA Structure", cat: "Science", lvl: "Hard", text: "DNA is the molecule that carries genetic instructions for all living things. It has a unique double helix shape discovered in 1953." },
    { title: "Renewable Energy", cat: "Science", lvl: "Medium", text: "Solar and wind power are types of renewable energy. They are cleaner for the planet than burning coal or oil." },

    // WORK & BUSINESS
    { title: "Job Interview", cat: "Work", lvl: "Medium", text: "During an interview, you should talk about your skills and experience. It is important to arrive on time and dress professionally." },
    { title: "Remote Work", cat: "Work", lvl: "Medium", text: "Many people now work from home using the internet. This offers flexibility but requires good time management skills." },
    { title: "Startup Culture", cat: "Work", lvl: "Hard", text: "Startups are small companies designed to grow fast. They often have informal offices but require long hours and hard work." },

    // COOKING
    { title: "Cooking Pasta", cat: "Cooking", lvl: "Easy", text: "To cook pasta, boil water with a little salt. Add the pasta and cook for ten minutes. Serve with your favorite sauce." },
    { title: "Baking Bread", cat: "Cooking", lvl: "Medium", text: "Making bread requires flour, water, yeast, and salt. You must knead the dough and let it rise before baking in a hot oven." }
];

let vocab = JSON.parse(localStorage.getItem('ef_v20')) || [];
let currentCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
    renderCategoryNav();
    renderLibrary();
    updateCount();
});

// Функция рендера теперь будет автоматически создавать кнопки для ВСЕХ категорий, которые есть в списке
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


