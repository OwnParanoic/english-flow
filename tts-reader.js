/* =========================================================
   Cross-Browser TTS Reader (EnglishFlow)
   Chrome / Edge  → word highlight
   Safari/Yandex → sentence highlight
   Firefox       → read only
========================================================= */

/* ---------- Browser detect ---------- */

const TTS_BROWSER = (() => {
    const ua = navigator.userAgent;
    if (/YaBrowser/.test(ua)) return 'yandex';
    if (/Edg\//.test(ua)) return 'edge';
    if (/Chrome\//.test(ua)) return 'chrome';
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'safari';
    if (/Firefox\//.test(ua)) return 'firefox';
    return 'unknown';
})();

const TTS_FEATURES = {
    word: TTS_BROWSER === 'chrome' || TTS_BROWSER === 'edge',
    sentence: TTS_BROWSER === 'safari' || TTS_BROWSER === 'yandex'
};

/* ---------- State ---------- */

let ttsVoices = [];
let ttsActive = false;
let ttsUtterance = null;

/* ---------- Load voices ---------- */

function ttsLoadVoices() {
    const synth = window.speechSynthesis;

    const tryLoad = () => {
        const voices = synth.getVoices();
        if (!voices.length) return false;

        ttsVoices = voices.filter(v => v.lang && v.lang.startsWith('en'));

        const select = document.getElementById('voice-select');
        if (select) {
            select.innerHTML = ttsVoices
                .map((v, i) => `<option value="${i}">${v.name}</option>`)
                .join('');
        }
        return true;
    };

    if (!tryLoad()) {
        synth.onvoiceschanged = tryLoad;
    }
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', () => {
    if ('speechSynthesis' in window) {
        ttsLoadVoices();
    }

    if (TTS_BROWSER === 'yandex') {
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('В Яндекс.Браузере ограничена синхронизация озвучки');
            }
        }, 1200);
    }
});

/* ---------- Speak ---------- */

function speak() {
    ttsStop();

    const box = document.getElementById('story-text');
    if (!box) return;

    const fullText = box.innerText.trim();
    if (!fullText) return;

    const sentences = fullText.match(/[^.!?]+[.!?]*/g);
    if (!sentences) return;

    const wordSpans = box.querySelectorAll('.word-span');
    let sentenceIndex = 0;
    ttsActive = true;

    const speakSentence = () => {
        if (!ttsActive || sentenceIndex >= sentences.length) {
            ttsStop();
            return;
        }

        const sentence = sentences[sentenceIndex];
        const utter = new SpeechSynthesisUtterance(sentence);
        ttsUtterance = utter;

        const voiceIndex = document.getElementById('voice-select')?.value;
        if (ttsVoices[voiceIndex]) utter.voice = ttsVoices[voiceIndex];
        utter.rate = 0.85;

        /* ---- Word highlight (Chrome / Edge) ---- */
        utter.onboundary = e => {
            if (!TTS_FEATURES.word) return;
            if (e.name !== 'word') return;

            const charIndex = e.charIndex;
            const before = fullText.slice(0, charIndex);
            const wordIndex = before.split(/\s+/).filter(Boolean).length;

            wordSpans.forEach(w => w.classList.remove('reading-now'));
            if (wordSpans[wordIndex]) {
                wordSpans[wordIndex].classList.add('reading-now');
                wordSpans[wordIndex].scrollIntoView({ block: 'center' });
            }
        };

        /* ---- Sentence highlight (Safari / Yandex) ---- */
        utter.onstart = () => {
            if (TTS_FEATURES.sentence) {
                highlightSentence(sentence);
            }
        };

        utter.onend = () => {
            sentenceIndex++;
            speakSentence();
        };

        utter.onerror = ttsStop;

        speechSynthesis.speak(utter);
    };

    speakSentence();
}

/* ---------- Stop ---------- */

function ttsStop() {
    ttsActive = false;
    speechSynthesis.cancel();
    ttsUtterance = null;

    document.querySelectorAll('.reading-now')
        .forEach(el => el.classList.remove('reading-now'));

    document.querySelectorAll('.sentence-now')
        .forEach(el => el.classList.remove('sentence-now'));
}

/* ---------- Sentence highlight helper ---------- */

function highlightSentence(sentence) {
    const box = document.getElementById('story-text');
    if (!box) return;

    box.querySelectorAll('.sentence-now')
        .forEach(el => el.classList.remove('sentence-now'));

    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
        const idx = node.nodeValue.indexOf(sentence.trim());
        if (idx !== -1) {
            const span = document.createElement('span');
            span.className = 'sentence-now';
            span.textContent = sentence;

            const after = node.splitText(idx);
            after.nodeValue = after.nodeValue.replace(sentence, '');
            node.parentNode.insertBefore(span, after);

            span.scrollIntoView({ block: 'center' });
            break;
        }
    }
}
