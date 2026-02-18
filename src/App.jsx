import { useState, useEffect, useCallback, useRef } from "react";

// ─── TTS via Netlify Function (API key hidden server-side) ──────────────────
const audioCache = new Map();

const VOICE_OPTIONS = [
  { label: "Standard Female", name: "gu-IN-Standard-A", tier: "standard", desc: "4M chars/mo free" },
  { label: "Standard Male", name: "gu-IN-Standard-B", tier: "standard", desc: "4M chars/mo free" },
  { label: "WaveNet Female", name: "gu-IN-Wavenet-A", tier: "wavenet", desc: "1M chars/mo free · Better quality" },
  { label: "WaveNet Male", name: "gu-IN-Wavenet-B", tier: "wavenet", desc: "1M chars/mo free · Better quality" },
];

async function speakGujarati(text, voiceName = "gu-IN-Standard-A", rate = 0.8) {
  const cacheKey = `${text}|${voiceName}|${rate}`;
  if (audioCache.has(cacheKey)) {
    const audio = new Audio(audioCache.get(cacheKey));
    audio.play();
    return { success: true };
  }
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { name: voiceName },
        audioConfig: { speakingRate: rate },
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { error: err.error || "TTS request failed" };
    }
    const data = await res.json();
    const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
    audioCache.set(cacheKey, audioSrc);
    const audio = new Audio(audioSrc);
    audio.play();
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Persistence ────────────────────────────────────────────────────────────
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function load(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }

// ─── Speaker Button ─────────────────────────────────────────────────────────
function SpeakButton({ text, voiceName, rate = 0.8, size = "md", color = "#E8734A" }) {
  const [state, setState] = useState("idle");
  const handle = async (e) => {
    e.stopPropagation();
    setState("loading");
    const r = await speakGujarati(text, voiceName, rate);
    if (r.error) { setState("error"); setTimeout(() => setState("idle"), 2000); }
    else { setState("playing"); setTimeout(() => setState("idle"), 1500); }
  };
  const s = { sm: 32, md: 42, lg: 52 }[size] || 42;
  const icon = { sm: 15, md: 19, lg: 23 }[size] || 19;
  return (
    <button onClick={handle} style={{
      width: s, height: s, borderRadius: s / 2, border: "none",
      background: state === "error" ? "#F4433622" : state === "playing" ? `${color}33` : `${color}18`,
      color: state === "error" ? "#F44336" : color, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: icon, flexShrink: 0,
      animation: state === "loading" ? "pulse 1s infinite" : state === "playing" ? "speakPulse 1.2s ease infinite" : "none",
      transition: "transform 0.1s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    }}>
      {state === "loading" ? "⏳" : state === "playing" ? "🔊" : state === "error" ? "⚠️" : "🔈"}
    </button>
  );
}

// ─── Learning Data ──────────────────────────────────────────────────────────
const CATEGORIES = {
  greetings: {
    label: "Greetings", emoji: "🙏", color: "#E8734A",
    words: [
      { gujarati: "નમસ્તે", roman: "Namaste", english: "Hello", pronunciation: "nuh-muh-STAY", tip: "Emphasis on the last syllable. 'Na' as in 'nut', 'ma' as in 'must', 'ste' rhymes with 'stay'." },
      { gujarati: "કેમ છો", roman: "Kem Chho", english: "How are you?", pronunciation: "KEM choh", tip: "'Kem' rhymes with 'gem'. 'Chho' — the 'chh' is an aspirated 'ch', like 'ch' with a puff of air." },
      { gujarati: "મજામાં", roman: "Majamaan", english: "I'm fine", pronunciation: "muh-jaa-MAAN", tip: "'Ma' as in 'must', 'ja' as in 'jar', 'maan' rhymes with 'on' but longer." },
      { gujarati: "આવજો", roman: "Aavjo", english: "Goodbye", pronunciation: "AAV-joh", tip: "'Aav' rhymes with 'cov' in 'cove'. 'Jo' as in 'Joe'. Stress the first syllable." },
      { gujarati: "ધન્યવાદ", roman: "Dhanyavaad", english: "Thank you", pronunciation: "dhun-yuh-VAAD", tip: "'Dh' is a breathy 'd' — say 'd' with air. 'Vaad' rhymes with 'rod' but longer." },
      { gujarati: "માફ કરો", roman: "Maaf Karo", english: "Sorry / Excuse me", pronunciation: "MAAF kuh-ROH", tip: "'Maaf' rhymes with 'cough'. 'Karo' — 'ka' as in 'cut', 'ro' as in 'row'." },
      { gujarati: "હા", roman: "Haa", english: "Yes", pronunciation: "HAA", tip: "Like 'ha' in 'hall' but drawn out slightly." },
      { gujarati: "ના", roman: "Naa", english: "No", pronunciation: "NAA", tip: "Like 'nah' but slightly longer." },
    ]
  },
  family: {
    label: "Family", emoji: "👨‍👩‍👧‍👦", color: "#6B8E4E",
    words: [
      { gujarati: "મમ્મી", roman: "Mummy", english: "Mom", pronunciation: "MUM-mee", tip: "Just like the English 'mummy'!" },
      { gujarati: "પપ્પા", roman: "Pappa", english: "Dad", pronunciation: "PUP-paa", tip: "Like 'papa' but with a shorter first 'a'." },
      { gujarati: "ભાઈ", roman: "Bhai", english: "Brother", pronunciation: "BHAI", tip: "'Bh' is a breathy 'b'. The 'ai' sounds like 'eye'. Together: 'b-HIGH'." },
      { gujarati: "બહેન", roman: "Bahen", english: "Sister", pronunciation: "buh-HEN", tip: "'Ba' as in 'but', 'hen' as in the bird. Stress on 'hen'." },
      { gujarati: "દાદા", roman: "Dada", english: "Grandfather (paternal)", pronunciation: "DAA-daa", tip: "Both syllables sound like 'da' in 'dark'. Even stress." },
      { gujarati: "દાદી", roman: "Dadi", english: "Grandmother (paternal)", pronunciation: "DAA-dee", tip: "'Daa' as in 'dark', 'dee' as in the letter D." },
      { gujarati: "નાના", roman: "Nana", english: "Grandfather (maternal)", pronunciation: "NAA-naa", tip: "Like 'nah-nah'. Even, gentle stress." },
      { gujarati: "નાની", roman: "Nani", english: "Grandmother (maternal)", pronunciation: "NAA-nee", tip: "'Naa' as in 'nah', 'nee' as in 'knee'." },
    ]
  },
  numbers: {
    label: "Numbers", emoji: "🔢", color: "#4A90D9",
    words: [
      { gujarati: "એક", roman: "Ek", english: "One (1)", pronunciation: "EK", tip: "Rhymes with 'check' without the 'ch'." },
      { gujarati: "બે", roman: "Be", english: "Two (2)", pronunciation: "BAY", tip: "Sounds exactly like the English word 'bay'." },
      { gujarati: "ત્રણ", roman: "Tran", english: "Three (3)", pronunciation: "TRUHN", tip: "The 'tr' blends together. Rhymes with 'fun' but starts with 'tr'." },
      { gujarati: "ચાર", roman: "Chaar", english: "Four (4)", pronunciation: "CHAAR", tip: "Like 'char' (as in charcoal) but the 'aa' is held longer." },
      { gujarati: "પાંચ", roman: "Paanch", english: "Five (5)", pronunciation: "PAANCH", tip: "'Paan' rhymes with 'on', 'ch' is soft at the end." },
      { gujarati: "છ", roman: "Chha", english: "Six (6)", pronunciation: "CHHUH", tip: "'Chh' is an aspirated 'ch' — say 'ch' with a puff of air, then a short 'uh'." },
      { gujarati: "સાત", roman: "Saat", english: "Seven (7)", pronunciation: "SAAT", tip: "Like 'sought' but with a clean 'aa' sound, no 'w'." },
      { gujarati: "આઠ", roman: "Aath", english: "Eight (8)", pronunciation: "AATH", tip: "'Aa' like 'aah' at the dentist, 'th' is a soft dental 't'." },
      { gujarati: "નવ", roman: "Nav", english: "Nine (9)", pronunciation: "NUV", tip: "Rhymes with 'love' but starts with 'n'." },
      { gujarati: "દસ", roman: "Das", english: "Ten (10)", pronunciation: "DUS", tip: "Like 'thus' without the 'th'. Short and quick." },
    ]
  },
  colors: {
    label: "Colors", emoji: "🎨", color: "#C24B8B",
    words: [
      { gujarati: "લાલ", roman: "Laal", english: "Red", pronunciation: "LAAL", color: "#E53935", tip: "Like 'lull' but with an open 'aa' sound." },
      { gujarati: "વાદળી", roman: "Vaadli", english: "Blue", pronunciation: "VAAD-lee", color: "#1E88E5", tip: "'Vaad' rhymes with 'rod', 'lee' as in the name Lee." },
      { gujarati: "લીલો", roman: "Leelo", english: "Green", pronunciation: "LEE-loh", color: "#43A047", tip: "'Lee' as in the name, 'lo' as in 'low'." },
      { gujarati: "પીળો", roman: "Peelo", english: "Yellow", pronunciation: "PEE-loh", color: "#F9A825", tip: "'Pee' as in the letter P, 'lo' as in 'low'." },
      { gujarati: "સફેદ", roman: "Safed", english: "White", pronunciation: "suh-FED", color: "#90A4AE", tip: "'Sa' is quick, 'fed' as in the English word. Stress on 'fed'." },
      { gujarati: "કાળો", roman: "Kaalo", english: "Black", pronunciation: "KAA-loh", color: "#37474F", tip: "'Kaa' as in 'car', 'lo' as in 'low'." },
      { gujarati: "નારંગી", roman: "Naarangi", english: "Orange", pronunciation: "naa-RUN-gee", color: "#FB8C00", tip: "'Naa' as in 'nah', 'run' as in running, 'gee' as in 'geese'." },
      { gujarati: "ગુલાબી", roman: "Gulaabi", english: "Pink", pronunciation: "goo-LAA-bee", color: "#E91E8C", tip: "'Goo' as in 'good', 'laa' as in 'la la la', 'bee' as the insect." },
    ]
  },
  animals: {
    label: "Animals", emoji: "🐾", color: "#D4A843",
    words: [
      { gujarati: "કૂતરો", roman: "Kutro", english: "Dog", pronunciation: "KOO-troh", tip: "'Koo' as in 'cool', 'tro' — 'tr' blended, 'o' as in 'go'." },
      { gujarati: "બિલાડી", roman: "Bilaadi", english: "Cat", pronunciation: "bi-LAA-dee", tip: "'Bi' as in 'bit', 'laa' as in 'la', 'dee' as in the letter D." },
      { gujarati: "ગાય", roman: "Gaay", english: "Cow", pronunciation: "GAAY", tip: "Like 'guy' but with a longer 'aa' sound." },
      { gujarati: "ઘોડો", roman: "Ghodo", english: "Horse", pronunciation: "GHO-doh", tip: "'Gho' — 'gh' is a breathy 'g', 'o' as in 'go'. 'Do' as in 'dough'." },
      { gujarati: "પક્ષી", roman: "Pakshi", english: "Bird", pronunciation: "PUK-shee", tip: "'Puk' rhymes with 'book', 'shi' as in 'she'." },
      { gujarati: "માછલી", roman: "Maachli", english: "Fish", pronunciation: "MAACH-lee", tip: "'Maach' — 'aa' is long, 'ch' is soft. 'Lee' as in the name." },
      { gujarati: "હાથી", roman: "Haathi", english: "Elephant", pronunciation: "HAA-thee", tip: "'Haa' as in 'ha!', 'thee' as in 'the' with a long 'ee'." },
      { gujarati: "વાંદરો", roman: "Vaandro", english: "Monkey", pronunciation: "VAAN-droh", tip: "'Vaan' — 'v' is soft, 'aan' rhymes with 'on'. 'Dro' like 'throw'." },
    ]
  },
  food: {
    label: "Food & Drink", emoji: "🍛", color: "#9B59B6",
    words: [
      { gujarati: "પાણી", roman: "Paani", english: "Water", pronunciation: "PAA-nee", tip: "'Paa' as in 'pa', 'nee' as in 'knee'." },
      { gujarati: "દૂધ", roman: "Doodh", english: "Milk", pronunciation: "DOODH", tip: "'Doo' as in 'do', 'dh' is a breathy 'd' at the end." },
      { gujarati: "રોટલી", roman: "Rotli", english: "Flatbread / Roti", pronunciation: "ROHT-lee", tip: "'Roht' — 'o' as in 'row', soft 't'. 'Lee' as in the name." },
      { gujarati: "ભાત", roman: "Bhaat", english: "Rice", pronunciation: "BHAAT", tip: "'Bh' is a breathy 'b', 'aat' like 'art' without the 'r'." },
      { gujarati: "શાક", roman: "Shaak", english: "Vegetable curry", pronunciation: "SHAAK", tip: "'Sh' as in 'shop', 'aak' like 'arc' without the 'r'." },
      { gujarati: "દાળ", roman: "Daal", english: "Lentil soup", pronunciation: "DAAL", tip: "Like the English word 'doll' but with a long 'aa'." },
      { gujarati: "ફળ", roman: "Fal", english: "Fruit", pronunciation: "FUL", tip: "Like 'full' but shorter. Quick and crisp." },
      { gujarati: "મીઠું", roman: "Meethun", english: "Salt", pronunciation: "MEE-thoon", tip: "'Mee' as in 'me', 'thoon' — soft 'th', 'oon' as in 'moon'." },
    ]
  },
  bodyParts: {
    label: "My Body", emoji: "🧒", color: "#2EAF7D",
    words: [
      { gujarati: "માથું", roman: "Maathun", english: "Head", pronunciation: "MAA-thoon", tip: "'Maa' as in 'ma', 'thoon' — soft dental 'th', rhymes with 'moon'." },
      { gujarati: "આંખ", roman: "Aankh", english: "Eye", pronunciation: "AANKH", tip: "'Aan' rhymes with 'on', 'kh' is a rough 'k' from the throat." },
      { gujarati: "નાક", roman: "Naak", english: "Nose", pronunciation: "NAAK", tip: "Like 'knock' but with a long 'aa' and no 'ck'." },
      { gujarati: "કાન", roman: "Kaan", english: "Ear", pronunciation: "KAAN", tip: "Like 'con' but with a long 'aa'. Rhymes with 'on'." },
      { gujarati: "મોઢું", roman: "Modhun", english: "Mouth", pronunciation: "MOH-dhoon", tip: "'Mo' as in 'more', 'dhoon' — breathy 'd', rhymes with 'moon'." },
      { gujarati: "હાથ", roman: "Haath", english: "Hand", pronunciation: "HAATH", tip: "'Haa' as in 'ha!', 'th' is a soft dental 't'." },
      { gujarati: "પગ", roman: "Pag", english: "Foot / Leg", pronunciation: "PUG", tip: "Rhymes with 'bug' but starts with 'p'. Short and quick." },
      { gujarati: "પેટ", roman: "Pet", english: "Stomach", pronunciation: "PET", tip: "Like the English word 'pet'. Simple!" },
    ]
  },
  actions: {
    label: "Actions", emoji: "🏃", color: "#E07B39",
    words: [
      { gujarati: "ખાવું", roman: "Khaavun", english: "To eat", pronunciation: "KHAA-voon", tip: "'Kh' is a rough 'k' from the throat. 'Aa' is long. 'Voon' rhymes with 'moon'." },
      { gujarati: "પીવું", roman: "Peevun", english: "To drink", pronunciation: "PEE-voon", tip: "'Pee' as in the letter P, 'voon' rhymes with 'moon'." },
      { gujarati: "રમવું", roman: "Ramvun", english: "To play", pronunciation: "RUM-voon", tip: "'Rum' as in the drink, 'voon' rhymes with 'moon'." },
      { gujarati: "સૂવું", roman: "Soovun", english: "To sleep", pronunciation: "SOO-voon", tip: "'Soo' as in 'soon', 'voon' rhymes with 'moon'." },
      { gujarati: "જોવું", roman: "Jovun", english: "To see / look", pronunciation: "JOH-voon", tip: "'Jo' as in 'Joe', 'voon' rhymes with 'moon'." },
      { gujarati: "બોલવું", roman: "Bolvun", english: "To speak", pronunciation: "BOHL-voon", tip: "'Bol' as in 'bowl', 'voon' rhymes with 'moon'." },
      { gujarati: "ચાલવું", roman: "Chaalvun", english: "To walk", pronunciation: "CHAAL-voon", tip: "'Chaal' — 'ch' as in 'chair', 'aal' like 'all'. 'Voon' rhymes with 'moon'." },
      { gujarati: "હસવું", roman: "Hasvun", english: "To laugh", pronunciation: "HUS-voon", tip: "'Hus' rhymes with 'bus', 'voon' rhymes with 'moon'." },
    ]
  },
};

const SENTENCES = [
  { gujarati: "મારું નામ ___ છે.", roman: "Maarun naam ___ chhe.", english: "My name is ___.", pronunciation: "MAA-roon NAAM ___ CHHEH", tip: "'Maarun' — possessive 'my'. 'Chhe' — aspirated 'ch', rhymes with 'hay'.", ttsText: "મારું નામ છે." },
  { gujarati: "મને ભૂખ લાગી છે.", roman: "Mane bhookh laagi chhe.", english: "I am hungry.", pronunciation: "muh-NEH BHOOKH LAA-gee CHHEH", tip: "'Bhookh' — breathy 'bh', 'ookh' like 'book'. 'Laagi' — 'laa' + 'gee'." },
  { gujarati: "મને તરસ લાગી છે.", roman: "Mane taras laagi chhe.", english: "I am thirsty.", pronunciation: "muh-NEH tuh-RUS LAA-gee CHHEH", tip: "'Taras' — stress on 'rus', like 'bus' with a 't'." },
  { gujarati: "હું ખુશ છું.", roman: "Hun khush chhun.", english: "I am happy.", pronunciation: "HOON KHOOSH CHHOON", tip: "'Hun' like 'hoon'. 'Khush' — rough 'kh', 'ush' like 'push'. 'Chhun' — aspirated 'ch' + 'oon'." },
  { gujarati: "આ શું છે?", roman: "Aa shun chhe?", english: "What is this?", pronunciation: "AA SHOON CHHEH", tip: "'Aa' points to 'this'. 'Shun' like 'shoon'. Very useful question!" },
  { gujarati: "મને રમવું છે.", roman: "Mane ramvun chhe.", english: "I want to play.", pronunciation: "muh-NEH RUM-voon CHHEH", tip: "Literal: 'To me playing is'. Gujarati structures desire differently than English." },
  { gujarati: "કૃપા કરીને.", roman: "Krupa karine.", english: "Please.", pronunciation: "KROO-paa kuh-REE-neh", tip: "'Kru' blended, 'pa' as in 'pa'. 'Karine' — 'ka' + 'ree' + 'ne'." },
  { gujarati: "મને મદદ જોઈએ છે.", roman: "Mane madad joiye chhe.", english: "I need help.", pronunciation: "muh-NEH muh-DUD JOY-yeh CHHEH", tip: "'Madad' — same as Hindi/Urdu. 'Joiye' — 'joy' + 'yeh'." },
  { gujarati: "હું ગુજરાતી શીખી રહ્યો છું.", roman: "Hun Gujarati shikhi rahyo chhun.", english: "I am learning Gujarati.", pronunciation: "HOON goo-juh-RAA-tee SHEE-khee ruh-HYOH CHHOON", tip: "'Shikhi' — learning. 'Rahyo' — ongoing action (like '-ing')." },
  { gujarati: "તમે ક્યાંથી છો?", roman: "Tame kyaanthi chho?", english: "Where are you from?", pronunciation: "tuh-MEH KYAAN-thee CHHOH", tip: "'Tame' — formal 'you'. 'Kyaanthi' — 'from where'." },
];

const CONVERSATIONS = [
  {
    title: "Meeting Someone", emoji: "👋",
    lines: [
      { speaker: "A", gujarati: "નમસ્તે! કેમ છો?", roman: "Namaste! Kem chho?", english: "Hello! How are you?", pronunciation: "nuh-muh-STAY! KEM choh?" },
      { speaker: "B", gujarati: "નમસ્તે! હું મજામાં છું. તમે?", roman: "Namaste! Hun majamaan chhun. Tame?", english: "Hello! I'm fine. You?", pronunciation: "nuh-muh-STAY! HOON muh-jaa-MAAN CHHOON. tuh-MEH?" },
      { speaker: "A", gujarati: "હું પણ મજામાં. તમારું નામ શું છે?", roman: "Hun pan majamaan. Tamaarun naam shun chhe?", english: "I'm fine too. What is your name?", pronunciation: "HOON PUN muh-jaa-MAAN. tuh-MAA-roon NAAM SHOON CHHEH?" },
      { speaker: "B", gujarati: "મારું નામ રાહુલ છે. તમારું?", roman: "Maarun naam Rahul chhe. Tamaarun?", english: "My name is Rahul. Yours?", pronunciation: "MAA-roon NAAM RAA-hool CHHEH. tuh-MAA-roon?" },
      { speaker: "A", gujarati: "મારું નામ પ્રિયા છે. મળીને આનંદ થયો!", roman: "Maarun naam Priya chhe. Maline aanand thayo!", english: "My name is Priya. Nice to meet you!", pronunciation: "MAA-roon NAAM PREE-yaa CHHEH. MUL-ee-neh AA-nund THUH-yoh!" },
    ]
  },
  {
    title: "Dinner Table", emoji: "🍽️",
    lines: [
      { speaker: "Child", gujarati: "મમ્મી, મને ભૂખ લાગી છે!", roman: "Mummy, mane bhookh laagi chhe!", english: "Mom, I'm hungry!", pronunciation: "MUM-mee, muh-NEH BHOOKH LAA-gee CHHEH!" },
      { speaker: "Mom", gujarati: "બેસો, જમવાનું તૈયાર છે.", roman: "Beso, jamvaanun taiyaar chhe.", english: "Sit down, food is ready.", pronunciation: "BEH-soh, jum-VAA-noon tay-YAAR CHHEH." },
      { speaker: "Child", gujarati: "આજે શું બનાવ્યું છે?", roman: "Aaje shun banaavyun chhe?", english: "What did you make today?", pronunciation: "AA-jeh SHOON buh-NAAV-yoon CHHEH?" },
      { speaker: "Mom", gujarati: "રોટલી, દાળ, ભાત અને શાક.", roman: "Rotli, daal, bhaat ane shaak.", english: "Roti, lentils, rice, and curry.", pronunciation: "ROHT-lee, DAAL, BHAAT UH-neh SHAAK." },
      { speaker: "Child", gujarati: "વાહ! મને દાળ-ભાત બહુ ભાવે છે!", roman: "Vaah! Mane daal-bhaat bahu bhaave chhe!", english: "Wow! I love dal-rice!", pronunciation: "VAAH! muh-NEH DAAL-BHAAT buh-HOO BHAA-veh CHHEH!" },
    ]
  },
  {
    title: "Playing Outside", emoji: "⚽",
    lines: [
      { speaker: "A", gujarati: "ચાલ, રમવા જઈએ!", roman: "Chaal, ramvaa jaiye!", english: "Let's go play!", pronunciation: "CHAAL, rum-VAA JAI-yeh!" },
      { speaker: "B", gujarati: "હા! શું રમીશું?", roman: "Haa! Shun ramishun?", english: "Yes! What shall we play?", pronunciation: "HAA! SHOON ruh-MEE-shoon?" },
      { speaker: "A", gujarati: "ક્રિકેટ રમીએ?", roman: "Cricket ramiye?", english: "Shall we play cricket?", pronunciation: "CRICKET ruh-MEE-yeh?" },
      { speaker: "B", gujarati: "ના, ફૂટબોલ રમીએ!", roman: "Naa, football ramiye!", english: "No, let's play football!", pronunciation: "NAA, FOOTBALL ruh-MEE-yeh!" },
      { speaker: "A", gujarati: "ઠીક છે, ચાલ!", roman: "Theek chhe, chaal!", english: "Okay, let's go!", pronunciation: "THEEK CHHEH, CHAAL!" },
    ]
  },
];

const PRONUNCIATION_GUIDE = [
  { letter: "અ", roman: "a", sound: "uh", example: "like 'u' in 'but'" },
  { letter: "આ", roman: "aa", sound: "aa", example: "like 'a' in 'father'" },
  { letter: "ઇ", roman: "i", sound: "i", example: "like 'i' in 'bit'" },
  { letter: "ઈ", roman: "ee", sound: "ee", example: "like 'ee' in 'feet'" },
  { letter: "ઉ", roman: "u", sound: "u", example: "like 'u' in 'put'" },
  { letter: "ઊ", roman: "oo", sound: "oo", example: "like 'oo' in 'food'" },
  { letter: "એ", roman: "e", sound: "eh", example: "like 'a' in 'late'" },
  { letter: "ઐ", roman: "ai", sound: "ai", example: "like 'ai' in 'aisle'" },
  { letter: "ઓ", roman: "o", sound: "oh", example: "like 'o' in 'go'" },
  { letter: "ઔ", roman: "au", sound: "ow", example: "like 'ow' in 'cow'" },
  { letter: "ક", roman: "ka", sound: "k", example: "like 'k' in 'kite'" },
  { letter: "ખ", roman: "kha", sound: "kh", example: "'k' with a puff of air" },
  { letter: "ગ", roman: "ga", sound: "g", example: "like 'g' in 'go'" },
  { letter: "ઘ", roman: "gha", sound: "gh", example: "'g' with a puff of air" },
  { letter: "ચ", roman: "cha", sound: "ch", example: "like 'ch' in 'chair'" },
  { letter: "છ", roman: "chha", sound: "chh", example: "'ch' with strong air puff" },
  { letter: "જ", roman: "ja", sound: "j", example: "like 'j' in 'jump'" },
  { letter: "ઝ", roman: "jha/za", sound: "jh/z", example: "'j' with breath OR 'z'" },
  { letter: "ટ", roman: "ṭa", sound: "ṭ", example: "tongue curled back (retroflex)" },
  { letter: "ઠ", roman: "ṭha", sound: "ṭh", example: "retroflex 't' with air puff" },
  { letter: "ડ", roman: "ḍa", sound: "ḍ", example: "retroflex 'd' — tongue curled" },
  { letter: "ઢ", roman: "ḍha", sound: "ḍh", example: "retroflex 'd' with air puff" },
  { letter: "ત", roman: "ta", sound: "t", example: "dental — tongue touches teeth" },
  { letter: "થ", roman: "tha", sound: "th", example: "dental 't' with air puff" },
  { letter: "દ", roman: "da", sound: "d", example: "dental 'd' — tongue on teeth" },
  { letter: "ધ", roman: "dha", sound: "dh", example: "dental 'd' with air puff" },
  { letter: "ન", roman: "na", sound: "n", example: "like 'n' in 'name'" },
  { letter: "પ", roman: "pa", sound: "p", example: "like 'p' in 'pen'" },
  { letter: "ફ", roman: "fa/pha", sound: "f/ph", example: "like 'f' in 'fun'" },
  { letter: "બ", roman: "ba", sound: "b", example: "like 'b' in 'bat'" },
  { letter: "ભ", roman: "bha", sound: "bh", example: "'b' with a puff of air" },
  { letter: "મ", roman: "ma", sound: "m", example: "like 'm' in 'man'" },
  { letter: "ય", roman: "ya", sound: "y", example: "like 'y' in 'yes'" },
  { letter: "ર", roman: "ra", sound: "r", example: "a light tongue tap/flick" },
  { letter: "લ", roman: "la", sound: "l", example: "like 'l' in 'love'" },
  { letter: "વ", roman: "va", sound: "v/w", example: "between 'v' and 'w'" },
  { letter: "શ", roman: "sha", sound: "sh", example: "like 'sh' in 'shop'" },
  { letter: "ષ", roman: "ṣha", sound: "ṣh", example: "retroflex 'sh'" },
  { letter: "સ", roman: "sa", sound: "s", example: "like 's' in 'sun'" },
  { letter: "હ", roman: "ha", sound: "h", example: "like 'h' in 'hat'" },
];

// ─── Shared UI ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total, color = "#E8734A" }) {
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(0,0,0,0.07)", borderRadius: 4, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{
        width: `${total > 0 ? (current / total) * 100 : 0}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: 4, transition: "width 0.5s ease",
        boxShadow: `0 1px 4px ${color}60`,
      }} />
    </div>
  );
}

function StarRating({ score, max = 3 }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 32, filter: i < score ? "none" : "grayscale(1) opacity(0.25)", transition: "filter 0.3s ease" }}>⭐</span>
      ))}
    </div>
  );
}

function FlashCard({ word, flipped, onFlip, color, voiceName, speakRate }) {
  return (
    <div onClick={onFlip} style={{ cursor: "pointer", width: "100%", maxWidth: 400, minHeight: 240, margin: "0 auto", perspective: 1000 }}>
      <div style={{ width: "100%", minHeight: 240, position: "relative", transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}>
        {/* Front */}
        <div style={{
          position: "absolute", width: "100%", minHeight: 240, backfaceVisibility: "hidden",
          background: `linear-gradient(145deg, ${color}, ${color}cc)`,
          borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 28, boxShadow: `0 12px 40px ${color}50, 0 4px 12px rgba(0,0,0,0.10)`,
          color: "white", boxSizing: "border-box",
        }}>
          <div style={{ fontSize: 52, fontFamily: "'Baloo 2'", fontWeight: 700, lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>{word.gujarati}</div>
          <div style={{ fontSize: 18, fontFamily: "'Nunito'", fontWeight: 700, marginTop: 10, opacity: 0.9, letterSpacing: 0.5 }}>{word.roman}</div>
          <div style={{ marginTop: 14 }}><SpeakButton text={word.gujarati} voiceName={voiceName} rate={speakRate} size="lg" color="white" /></div>
          <div style={{ fontSize: 11, marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "4px 12px", opacity: 0.85 }}>tap to flip</div>
        </div>
        {/* Back */}
        <div style={{
          position: "absolute", width: "100%", minHeight: 240, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "linear-gradient(145deg, #FAFAF8, #F5F0EB)",
          borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 28,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
        }}>
          <div style={{ fontSize: 26, fontFamily: "'Baloo 2'", fontWeight: 800, color }}>{word.english}</div>
          <div style={{ marginTop: 12, padding: "8px 16px", background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 12, fontWeight: 700, fontSize: 15, color, display: "flex", alignItems: "center", gap: 8 }}>
            <SpeakButton text={word.gujarati} voiceName={voiceName} rate={speakRate} size="sm" color={color} />
            {word.pronunciation}
          </div>
          <div style={{ marginTop: 14, padding: "12px 16px", background: "#FFF9F2", border: "1px solid #EDE0D4", borderRadius: 14, fontSize: 13, color: "#6b5e54", textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>💡 {word.tip}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ───────────────────────────────────────────────────────────────
function SettingsPanel({ voiceName, setVoiceName, speakRate, setSpeakRate, onClose, ttsOk }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "28px 28px 0 0", padding: "20px 20px 36px", width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto", boxShadow: "0 -16px 60px rgba(0,0,0,0.20)", animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ width: 48, height: 5, background: "#C8B8A8", borderRadius: 3, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Baloo 2'", fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>🔊 Audio Settings</div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 12, fontSize: 20, cursor: "pointer", color: "#8b7d74", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 14, marginBottom: 18, background: ttsOk ? "#E8F5E9" : "#FFF3E6", fontSize: 13, fontWeight: 600, color: ttsOk ? "#2E7D32" : "#E8734A", border: `1px solid ${ttsOk ? "#C8E6C9" : "rgba(232,115,74,0.20)"}` }}>
          {ttsOk ? "✅ Audio is working! Powered by Google Cloud TTS." : "⏳ Audio not tested yet — tap a speaker button to try."}
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8, color: "#8b7d74" }}>Voice</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {VOICE_OPTIONS.map(v => (
              <button key={v.name} onClick={() => { setVoiceName(v.name); save("gs_voice", v.name); }} style={{
                padding: "12px 14px", borderRadius: 14,
                border: voiceName === v.name ? "2px solid #E8734A" : "1.5px solid #e8e0d8",
                background: voiceName === v.name ? "#E8734A0D" : "white",
                cursor: "pointer", fontSize: 13, textAlign: "left",
                boxShadow: voiceName === v.name ? "0 0 0 3px rgba(232,115,74,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700 }}>{v.label}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: v.tier === "wavenet" ? "#4A90D922" : "#e8e0d8", color: v.tier === "wavenet" ? "#4A90D9" : "#8b7d74", fontWeight: 800 }}>{v.tier}</span>
                </div>
                <div style={{ fontSize: 11, color: "#8b7d74", marginTop: 2 }}>{v.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontWeight: 800, fontSize: 13, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8, color: "#8b7d74" }}>Speed: {speakRate}x {speakRate <= 0.7 ? "🐢" : speakRate <= 0.9 ? "🚶" : "🏃"}</label>
          <div style={{ fontSize: 12, color: "#8b7d74", marginBottom: 8 }}>Slower = easier for kids to follow along</div>
          <input type="range" min="0.5" max="1.2" step="0.05" value={speakRate} onChange={e => { const v = parseFloat(e.target.value); setSpeakRate(v); save("gs_rate", v); }} style={{ width: "100%", accentColor: "#E8734A", height: 24 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b7d74" }}><span>🐢 Very Slow</span><span>Normal 🏃</span></div>
        </div>
        <div style={{ padding: 18, background: "linear-gradient(135deg, #FFF3E6, #FFE8D6)", borderRadius: 16, border: "1px solid rgba(232,115,74,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Test audio</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["નમસ્તે", "કેમ છો", "ધન્યવાદ"].map(w => (
              <button key={w} onClick={() => speakGujarati(w, voiceName, speakRate)} style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: "#E8734A", color: "white", cursor: "pointer", fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 12px rgba(232,115,74,0.40)", transition: "transform 0.1s ease" }}>🔊 {w}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: "#8b7d74", textAlign: "center", lineHeight: 1.5 }}>
          Free tier: 4M Standard chars + 1M WaveNet chars per month<br />
          Netlify: 125K function calls per month
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedCat, setSelectedCat] = useState(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizState, setQuizState] = useState(null);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [convoIdx, setConvoIdx] = useState(0);
  const [convoLine, setConvoLine] = useState(0);
  const [convoRevealed, setConvoRevealed] = useState(false);
  const [progress, setProgress] = useState(() => load("gs_progress", {}));
  const [alphabetPage, setAlphabetPage] = useState(0);
  const [streak, setStreak] = useState(() => load("gs_streak", 0));
  const [showSettings, setShowSettings] = useState(false);
  const [voiceName, setVoiceName] = useState(() => load("gs_voice", "gu-IN-Standard-A"));
  const [speakRate, setSpeakRate] = useState(() => load("gs_rate", 0.8));
  const [ttsOk, setTtsOk] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { save("gs_progress", progress); }, [progress]);
  useEffect(() => { save("gs_streak", streak); }, [streak]);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [screen, cardIdx, sentenceIdx, convoLine, alphabetPage]);

  useEffect(() => {
    const interval = setInterval(() => { if (audioCache.size > 0) { setTtsOk(true); clearInterval(interval); } }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalWordsLearned = Object.values(progress).reduce((s, v) => s + (v?.learned || 0), 0);
  const totalWords = Object.values(CATEGORIES).reduce((s, c) => s + c.words.length, 0);

  const startQuiz = useCallback((catKey) => {
    const words = CATEGORIES[catKey].words;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(5, words.length)).map(w => {
      const wrong = words.filter(x => x.english !== w.english).sort(() => Math.random() - 0.5).slice(0, 3);
      return { word: w, options: [...wrong.map(x => x.english), w.english].sort(() => Math.random() - 0.5), correct: w.english };
    });
    setQuizState({ catKey, questions, current: 0, score: 0, answered: null, finished: false });
    setScreen("quiz");
  }, []);

  const answerQuiz = (ans) => {
    if (quizState.answered !== null) return;
    const ok = ans === quizState.questions[quizState.current].correct;
    if (ok) setStreak(s => s + 1); else setStreak(0);
    setQuizState(p => ({ ...p, answered: ans, score: p.score + (ok ? 1 : 0) }));
  };

  const nextQ = () => {
    if (quizState.current + 1 >= quizState.questions.length) {
      setQuizState(p => ({ ...p, finished: true }));
      setProgress(p => ({ ...p, [quizState.catKey]: { ...p[quizState.catKey], quizBest: Math.max(p[quizState.catKey]?.quizBest || 0, quizState.score) } }));
    } else setQuizState(p => ({ ...p, current: p.current + 1, answered: null }));
  };

  const markLearned = (k) => setProgress(p => ({ ...p, [k]: { ...p[k], learned: (p[k]?.learned || 0) + 1 } }));

  const ALPHA_PP = 10, alphaPages = Math.ceil(PRONUNCIATION_GUIDE.length / ALPHA_PP);

  const navBtn = (label, emoji, target) => (
    <button key={target} onClick={() => setScreen(target)} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      padding: "8px 4px",
      background: "transparent",
      color: screen === target ? "#E8734A" : "#8b7d74",
      border: "none", borderRadius: 14, cursor: "pointer",
      fontFamily: "'Nunito'", fontWeight: screen === target ? 800 : 700, fontSize: 11,
      transition: "color 0.2s ease",
    }}>
      <span style={{
        fontSize: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 44, height: 30, borderRadius: 12,
        background: screen === target ? "rgba(232,115,74,0.12)" : "transparent",
        transition: "background 0.2s ease",
      }}>{emoji}</span>
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#FFF9F4", height: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@400;500;600;700;800&display=swap');
        * { -webkit-tap-highlight-color: transparent; -webkit-font-smoothing: antialiased; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes speakPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes correctFlash { 0%{background:#A5D6A7} 100%{background:#E8F5E9} }
        @keyframes wrongShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .tap-scale { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1); }
        .tap-scale:active { transform: scale(0.95) !important; }
        input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:#e8e0d8;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#E8734A;cursor:pointer;box-shadow:0 2px 6px rgba(232,115,74,0.40)}
        ::-webkit-scrollbar{width:0}
      `}</style>

      {showSettings && <SettingsPanel voiceName={voiceName} setVoiceName={setVoiceName} speakRate={speakRate} setSpeakRate={setSpeakRate} onClose={() => setShowSettings(false)} ttsOk={ttsOk} />}

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #F0845C 0%, #E8734A 45%, #C85A30 100%)",
        padding: "18px 20px 16px", color: "white",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        boxShadow: "0 4px 20px rgba(200,90,48,0.35)",
      }}>
        <div>
          <div style={{ fontFamily: "'Baloo 2'", fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: -0.5, textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>ગુજરાતી શીખો</div>
          <div style={{ display: "inline-block", fontSize: 11, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", borderRadius: 999, padding: "2px 10px", marginTop: 4, fontWeight: 700 }}>Learn Gujarati</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "6px 12px", textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>🔥 {streak}</div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>{totalWordsLearned}/{totalWords}</div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ width: 40, height: 40, borderRadius: 13, border: "2px solid rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", color: "white", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>🔊</button>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "16px 16px 90px", WebkitOverflowScrolling: "touch" }}>

        {/* ── Home ── */}
        {screen === "home" && (
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            {/* Welcome banner */}
            <div style={{
              background: "linear-gradient(160deg, #E8734A 0%, #D4543A 100%)",
              borderRadius: 24, padding: "22px 20px 20px",
              marginBottom: 16, color: "white",
              position: "relative", overflow: "hidden",
              boxShadow: "0 8px 32px rgba(232,115,74,0.40)",
            }}>
              <div style={{ position: "absolute", right: -20, bottom: -24, fontSize: 130, opacity: 0.08, fontFamily: "'Baloo 2'", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>ગ</div>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 21, fontWeight: 800, lineHeight: 1.2 }}>Welcome, little learner! 🌟</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6, lineHeight: 1.5 }}>Tap a category to start learning Gujarati with real audio!</div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>{totalWordsLearned} of {totalWords} words explored</span>
                  <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>{totalWords > 0 ? Math.round((totalWordsLearned / totalWords) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "white", borderRadius: 4, width: `${totalWords > 0 ? (totalWordsLearned / totalWords) * 100 : 0}%`, transition: "width 0.5s ease" }} />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <button className="tap-scale" onClick={() => setScreen("sentences")} style={{
                padding: "18px 16px", background: "linear-gradient(135deg, #7B3FA0, #9B59B6)",
                border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left",
                boxShadow: "0 6px 24px rgba(155,89,182,0.40)", color: "white",
              }}>
                <div style={{ fontSize: 32 }}>📝</div>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, marginTop: 8 }}>Sentences</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2, fontWeight: 600 }}>{SENTENCES.length} phrases</div>
              </button>
              <button className="tap-scale" onClick={() => setScreen("conversations")} style={{
                padding: "18px 16px", background: "linear-gradient(135deg, #1A8C5E, #2EAF7D)",
                border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left",
                boxShadow: "0 6px 24px rgba(46,175,125,0.40)", color: "white",
              }}>
                <div style={{ fontSize: 32 }}>💬</div>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, marginTop: 8 }}>Conversations</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2, fontWeight: 600 }}>{CONVERSATIONS.length} scenarios</div>
              </button>
            </div>

            {/* Category grid */}
            <div style={{ fontFamily: "'Baloo 2'", fontSize: 17, fontWeight: 800, marginBottom: 12, color: "#1A110C" }}>Word Categories</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Object.entries(CATEGORIES).map(([k, c]) => {
                const learned = progress[k]?.learned || 0;
                const done = learned >= c.words.length;
                return (
                  <button key={k} className="tap-scale" onClick={() => { setSelectedCat(k); setCardIdx(0); setFlipped(false); setScreen("learn"); }} style={{
                    padding: "18px 16px",
                    background: `linear-gradient(145deg, ${c.color}ee, ${c.color}aa)`,
                    border: "none", borderRadius: 20, cursor: "pointer", textAlign: "left",
                    position: "relative", overflow: "hidden",
                    boxShadow: `0 6px 24px ${c.color}44`,
                    minHeight: 120,
                  }}>
                    <div style={{ position: "absolute", bottom: -12, right: -8, fontSize: 72, opacity: 0.15, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{c.emoji}</div>
                    {done && <div style={{ position: "absolute", top: 10, right: 10, fontSize: 13, background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "2px 6px" }}>✅</div>}
                    <div style={{ fontSize: 30 }}>{c.emoji}</div>
                    <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, color: "white", marginTop: 8, lineHeight: 1.2 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 3, fontWeight: 600 }}>{c.words.length} words</div>
                    {learned > 0 && (
                      <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: "rgba(255,255,255,0.90)", width: `${Math.min((learned / c.words.length) * 100, 100)}%`, transition: "width 0.5s ease" }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Learn ── */}
        {screen === "learn" && selectedCat && (() => {
          const c = CATEGORIES[selectedCat], w = c.words[cardIdx];
          return (
            <div>
              <button onClick={() => setScreen("home")} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, cursor: "pointer", fontWeight: 700, color: "#6b5e54", fontSize: 13, marginBottom: 16, padding: "6px 14px" }}>← Back</button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 32 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Baloo 2'", fontSize: 20, fontWeight: 800 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "#8b7d74", fontWeight: 600 }}>Card {cardIdx + 1} of {c.words.length}</div>
                  </div>
                </div>
                <div style={{ background: `${c.color}18`, border: `1px solid ${c.color}30`, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: c.color }}>{cardIdx + 1}/{c.words.length}</div>
              </div>
              <ProgressBar current={cardIdx + 1} total={c.words.length} color={c.color} />
              <div style={{ marginTop: 22 }}><FlashCard word={w} flipped={flipped} onFlip={() => setFlipped(!flipped)} color={w.color || c.color} voiceName={voiceName} speakRate={speakRate} /></div>
              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "center" }}>
                <button disabled={cardIdx === 0} onClick={() => { setCardIdx(i => i - 1); setFlipped(false); }} className="tap-scale" style={{ padding: "14px 28px", borderRadius: 16, border: "1.5px solid #e8e0d8", background: "white", cursor: cardIdx === 0 ? "default" : "pointer", fontWeight: 700, fontSize: 14, color: "#6b5e54", opacity: cardIdx === 0 ? 0.4 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>← Prev</button>
                <button onClick={() => { markLearned(selectedCat); if (cardIdx < c.words.length - 1) { setCardIdx(i => i + 1); setFlipped(false); } }} disabled={cardIdx === c.words.length - 1} className="tap-scale" style={{ padding: "14px 28px", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`, color: "white", cursor: cardIdx === c.words.length - 1 ? "default" : "pointer", fontWeight: 800, fontSize: 14, opacity: cardIdx === c.words.length - 1 ? 0.5 : 1, boxShadow: `0 4px 16px ${c.color}50` }}>Next →</button>
              </div>
              {cardIdx === c.words.length - 1 && (
                <div style={{ textAlign: "center", marginTop: 24, padding: "20px", background: "linear-gradient(135deg, #FFF8F2, #FFF0E4)", borderRadius: 20, border: "1px solid rgba(232,115,74,0.15)" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>🎉 All cards done!</div>
                  <button className="tap-scale" onClick={() => startQuiz(selectedCat)} style={{ padding: "14px 28px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #4A90D9, #357ABD)", color: "white", cursor: "pointer", fontWeight: 800, fontSize: 15, boxShadow: "0 6px 20px rgba(74,144,217,0.45)" }}>🧠 Take the Quiz!</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Quiz ── */}
        {screen === "quiz" && quizState && (() => {
          if (quizState.finished) {
            const { score } = quizState, t = quizState.questions.length, st = score === t ? 3 : score >= t * 0.6 ? 2 : score > 0 ? 1 : 0;
            return (
              <div style={{ textAlign: "center", paddingTop: 32 }}>
                <div style={{ width: 120, height: 120, borderRadius: 60, background: "radial-gradient(circle, #FFF3E6, #FFE0C0)", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, margin: "0 auto" }}>{st === 3 ? "🏆" : st >= 2 ? "🌟" : "💪"}</div>
                <div style={{ fontFamily: "'Baloo 2'", fontSize: 28, fontWeight: 800, marginTop: 16 }}>{st === 3 ? "Perfect!" : st >= 2 ? "Great job!" : "Keep practicing!"}</div>
                <div style={{ display: "inline-block", marginTop: 10, background: "linear-gradient(135deg, #F0F8FF, #E0EFFF)", borderRadius: 20, padding: "10px 28px", fontSize: 28, fontWeight: 800, color: "#4A90D9", boxShadow: "0 2px 12px rgba(74,144,217,0.15)" }}>{score}/{t}</div>
                <div style={{ marginTop: 16 }}><StarRating score={st} /></div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
                  <button className="tap-scale" onClick={() => startQuiz(quizState.catKey)} style={{ padding: "14px 24px", borderRadius: 16, border: "2px solid #E8734A", background: "white", color: "#E8734A", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>Try Again</button>
                  <button className="tap-scale" onClick={() => setScreen("home")} style={{ padding: "14px 24px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #E8734A, #C85A30)", color: "white", cursor: "pointer", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 16px rgba(232,115,74,0.45)" }}>Home</button>
                </div>
              </div>
            );
          }
          const q = quizState.questions[quizState.current], c = CATEGORIES[quizState.catKey];
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Baloo 2'", fontSize: 18, fontWeight: 800 }}>Quiz: {c.label} {c.emoji}</div>
                <div style={{ background: `${c.color}18`, border: `1px solid ${c.color}30`, borderRadius: 999, padding: "4px 12px", fontSize: 13, color: c.color, fontWeight: 800 }}>{quizState.current + 1}/{quizState.questions.length}</div>
              </div>
              <ProgressBar current={quizState.current + 1} total={quizState.questions.length} color={c.color} />
              <div style={{ background: "linear-gradient(160deg, #FAFAF8, #F5F0EB)", borderRadius: 22, padding: 28, marginTop: 18, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: `1.5px solid ${c.color}18` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#9B8070", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>What does this mean?</div>
                <div style={{ fontFamily: "'Baloo 2'", fontSize: 44, fontWeight: 700, color: c.color, letterSpacing: 0.5 }}>{q.word.gujarati}</div>
                <div style={{ fontSize: 16, color: "#6b5e54", fontWeight: 600, marginTop: 4 }}>{q.word.roman}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
                  <SpeakButton text={q.word.gujarati} voiceName={voiceName} rate={speakRate} size="md" color={c.color} />
                  <span style={{ fontSize: 12, color: "#8b7d74", fontWeight: 600 }}>{q.word.pronunciation}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
                {q.options.map(o => {
                  let bg = "white", bd = "#e8e0d8", tc = "#2d2420", anim = "none";
                  if (quizState.answered !== null) {
                    if (o === q.correct) { bg = "#E8F5E9"; bd = "#4CAF50"; tc = "#2E7D32"; anim = "correctFlash 0.3s ease"; }
                    else if (o === quizState.answered) { bg = "#FFEBEE"; bd = "#F44336"; tc = "#C62828"; anim = "wrongShake 0.3s ease"; }
                  }
                  return (
                    <button key={o} className="tap-scale" onClick={() => answerQuiz(o)} style={{ padding: 16, borderRadius: 16, border: `2px solid ${bd}`, background: bg, cursor: quizState.answered ? "default" : "pointer", fontWeight: 700, fontSize: 15, color: tc, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", animation: anim, transition: "background 0.2s, border-color 0.2s" }}>{o}</button>
                  );
                })}
              </div>
              {quizState.answered !== null && (
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: quizState.answered === q.correct ? "#2E7D32" : "#C62828" }}>{quizState.answered === q.correct ? "✅ Correct!" : `❌ Answer: "${q.correct}"`}</div>
                  <button className="tap-scale" onClick={nextQ} style={{ padding: "14px 32px", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`, color: "white", cursor: "pointer", fontWeight: 800, fontSize: 14, boxShadow: `0 4px 16px ${c.color}50` }}>{quizState.current + 1 < quizState.questions.length ? "Next →" : "Results 🎉"}</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Sentences ── */}
        {screen === "sentences" && (() => {
          const s = SENTENCES[sentenceIdx], tt = s.ttsText || s.gujarati;
          return (
            <div>
              <button onClick={() => setScreen("home")} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, cursor: "pointer", fontWeight: 700, color: "#6b5e54", fontSize: 13, marginBottom: 16, padding: "6px 14px" }}>← Back</button>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>📝 Sentences</div>
              <ProgressBar current={sentenceIdx + 1} total={SENTENCES.length} color="#9B59B6" />
              <div style={{ fontSize: 11, color: "#8b7d74", marginTop: 6, marginBottom: 16, display: "inline-block", background: "rgba(155,89,182,0.08)", borderRadius: 999, padding: "3px 12px", fontWeight: 700 }}>Sentence {sentenceIdx + 1} of {SENTENCES.length}</div>
              <div style={{ background: "white", borderRadius: 22, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid rgba(155,89,182,0.12)" }}>
                <div style={{ height: 5, background: "linear-gradient(90deg, #9B59B6, #C471ED)" }} />
                <div style={{ padding: "22px 20px 20px" }}>
                  <div style={{ fontFamily: "'Baloo 2'", fontSize: 28, fontWeight: 700, color: "#9B59B6", textAlign: "center", lineHeight: 1.3 }}>{s.gujarati}</div>
                  <div style={{ textAlign: "center", fontSize: 15, color: "#6b5e54", fontWeight: 600, marginTop: 6 }}>{s.roman}</div>
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><SpeakButton text={tt} voiceName={voiceName} rate={speakRate} size="lg" color="#9B59B6" /></div>
                  <div style={{ textAlign: "center", marginTop: 14, padding: "12px 16px", background: "#F3E5F5", borderRadius: 14, border: "1px solid #CE93D8" }}><div style={{ fontSize: 18, fontWeight: 800 }}>{s.english}</div></div>
                  <div style={{ marginTop: 12, padding: "12px 14px", background: "#FFF9F2", borderRadius: 14, border: "1px solid #EDE0D4" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#E8734A" }}>{s.pronunciation}</div>
                    <div style={{ fontSize: 12, color: "#6b5e54", marginTop: 5, lineHeight: 1.5 }}>💡 {s.tip}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
                <button disabled={sentenceIdx === 0} className="tap-scale" onClick={() => setSentenceIdx(i => i - 1)} style={{ padding: "14px 28px", borderRadius: 16, border: "1.5px solid #e8e0d8", background: "white", cursor: sentenceIdx === 0 ? "default" : "pointer", fontWeight: 700, fontSize: 14, opacity: sentenceIdx === 0 ? 0.4 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>← Prev</button>
                <button disabled={sentenceIdx === SENTENCES.length - 1} className="tap-scale" onClick={() => setSentenceIdx(i => i + 1)} style={{ padding: "14px 28px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #9B59B6, #7D3C98)", color: "white", cursor: sentenceIdx === SENTENCES.length - 1 ? "default" : "pointer", fontWeight: 800, fontSize: 14, opacity: sentenceIdx === SENTENCES.length - 1 ? 0.5 : 1, boxShadow: "0 4px 16px rgba(155,89,182,0.45)" }}>Next →</button>
              </div>
            </div>
          );
        })()}

        {/* ── Conversations ── */}
        {screen === "conversations" && (() => {
          const c = CONVERSATIONS[convoIdx], ln = c.lines[convoLine];
          return (
            <div>
              <button onClick={() => setScreen("home")} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, cursor: "pointer", fontWeight: 700, color: "#6b5e54", fontSize: 13, marginBottom: 16, padding: "6px 14px" }}>← Back</button>
              <div style={{ fontFamily: "'Baloo 2'", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>💬 Conversations</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4, background: "rgba(0,0,0,0.03)", borderRadius: 14, padding: "6px" }}>
                {CONVERSATIONS.map((cv, i) => (
                  <button key={i} className="tap-scale" onClick={() => { setConvoIdx(i); setConvoLine(0); setConvoRevealed(false); }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: i === convoIdx ? "#E8734A" : "transparent", color: i === convoIdx ? "white" : "#6b5e54", cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", boxShadow: i === convoIdx ? "0 2px 8px rgba(232,115,74,0.40)" : "none", transition: "all 0.2s ease" }}>{cv.emoji} {cv.title}</button>
                ))}
              </div>
              <ProgressBar current={convoLine + 1} total={c.lines.length} color="#E8734A" />
              <div style={{ fontSize: 11, color: "#8b7d74", marginTop: 6, marginBottom: 16, display: "inline-block", background: "rgba(232,115,74,0.08)", borderRadius: 999, padding: "3px 12px", fontWeight: 700 }}>Line {convoLine + 1} of {c.lines.length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {c.lines.slice(0, convoLine).map((l, i) => {
                  const left = i % 2 === 0;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: left ? "flex-start" : "flex-end", alignItems: "flex-start", gap: 6 }}>
                      {left && <SpeakButton text={l.gujarati} voiceName={voiceName} rate={speakRate} size="sm" color="#8b7d74" />}
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 18, background: left ? "#F0EAE4" : "linear-gradient(135deg, #E8734A18, #E8734A08)", border: left ? "none" : "1px solid rgba(232,115,74,0.18)", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderBottomLeftRadius: left ? 4 : 18, borderBottomRightRadius: left ? 18 : 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#8b7d74", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>{l.speaker}</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.gujarati}</div>
                        <div style={{ fontSize: 11, color: "#8b7d74", marginTop: 2 }}>{l.english}</div>
                      </div>
                      {!left && <SpeakButton text={l.gujarati} voiceName={voiceName} rate={speakRate} size="sm" color="#8b7d74" />}
                    </div>
                  );
                })}
                <div style={{ background: "linear-gradient(160deg, #FFFCFA, #FFF8F4)", borderRadius: 22, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.08)", borderLeft: "4px solid #E8734A", border: "1.5px solid rgba(232,115,74,0.22)", borderLeftWidth: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#E8734A", textTransform: "uppercase", letterSpacing: 0.8 }}>{ln.speaker} says:</div>
                    <SpeakButton text={ln.gujarati} voiceName={voiceName} rate={speakRate} size="md" color="#E8734A" />
                  </div>
                  <div style={{ fontFamily: "'Baloo 2'", fontSize: 22, fontWeight: 700, marginTop: 6 }}>{ln.gujarati}</div>
                  <div style={{ fontSize: 14, color: "#6b5e54", fontWeight: 600, marginTop: 4 }}>{ln.roman}</div>
                  {!convoRevealed
                    ? <button className="tap-scale" onClick={() => setConvoRevealed(true)} style={{ marginTop: 14, padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(232,115,74,0.35)", background: "rgba(232,115,74,0.06)", color: "#E8734A", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🤔 Show meaning</button>
                    : <div style={{ marginTop: 14 }}>
                        <div style={{ padding: "10px 12px", background: "#FFF3E6", borderRadius: 12, marginBottom: 8, border: "1px solid rgba(232,115,74,0.15)" }}><div style={{ fontSize: 15, fontWeight: 800 }}>{ln.english}</div></div>
                        <div style={{ padding: "10px 12px", background: "#FFF9F2", borderRadius: 12, border: "1px solid #EDE0D4" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#E8734A" }}>💡 {ln.pronunciation}</div></div>
                      </div>
                  }
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
                <button disabled={convoLine === 0} className="tap-scale" onClick={() => { setConvoLine(i => i - 1); setConvoRevealed(false); }} style={{ padding: "14px 28px", borderRadius: 16, border: "1.5px solid #e8e0d8", background: "white", cursor: convoLine === 0 ? "default" : "pointer", fontWeight: 700, fontSize: 14, opacity: convoLine === 0 ? 0.4 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>← Prev</button>
                <button disabled={convoLine === c.lines.length - 1} className="tap-scale" onClick={() => { setConvoLine(i => i + 1); setConvoRevealed(false); }} style={{ padding: "14px 28px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #E8734A, #C85A30)", color: "white", cursor: convoLine === c.lines.length - 1 ? "default" : "pointer", fontWeight: 800, fontSize: 14, opacity: convoLine === c.lines.length - 1 ? 0.5 : 1, boxShadow: "0 4px 16px rgba(232,115,74,0.45)" }}>Next →</button>
              </div>
            </div>
          );
        })()}

        {/* ── Alphabet ── */}
        {screen === "alphabet" && (
          <div>
            <div style={{ fontFamily: "'Baloo 2'", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>🔤 Gujarati Sounds</div>
            <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, #FFF8E8, #FFF3E0)", borderRadius: 16, border: "1px solid rgba(232,115,74,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 10, fontSize: 12, color: "#6b5e54", lineHeight: 1.5 }}>
              Aspirated consonants (ખ, ઘ, છ) use a <strong>puff of air</strong>. Hold your hand near your mouth to feel it!
            </div>
            <div style={{ padding: "10px 16px", background: "white", borderRadius: 14, border: "1px solid #EDE0D4", marginBottom: 14, fontSize: 11, color: "#6b5e54", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <strong>Dental</strong> = tongue on teeth (ત, દ) · <strong>Retroflex</strong> = tongue curled back (ટ, ડ)
            </div>
            <ProgressBar current={alphabetPage + 1} total={alphaPages} color="#4A90D9" />
            <div style={{ fontSize: 11, color: "#8b7d74", marginTop: 6, marginBottom: 14, display: "inline-block", background: "rgba(74,144,217,0.08)", borderRadius: 999, padding: "3px 12px", fontWeight: 700 }}>Page {alphabetPage + 1} of {alphaPages}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PRONUNCIATION_GUIDE.slice(alphabetPage * ALPHA_PP, (alphabetPage + 1) * ALPHA_PP).map((it, i) => (
                <div key={i} style={{ background: "linear-gradient(145deg, #FFFFFF, #FAFAF8)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: "3px solid rgba(74,144,217,0.20)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #4A90D9, #357ABD)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Baloo 2'", fontSize: 26, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(74,144,217,0.40)" }}>{it.letter}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{it.roman}</span>
                      <span style={{ fontSize: 12, background: "rgba(232,115,74,0.10)", borderRadius: 6, padding: "1px 8px", fontWeight: 800, color: "#E8734A" }}>/{it.sound}/</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b5e54", marginTop: 3 }}>{it.example}</div>
                  </div>
                  <SpeakButton text={it.letter} voiceName={voiceName} rate={0.6} size="sm" color="#4A90D9" />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
              <button disabled={alphabetPage === 0} className="tap-scale" onClick={() => setAlphabetPage(p => p - 1)} style={{ padding: "14px 28px", borderRadius: 16, border: "1.5px solid #e8e0d8", background: "white", cursor: alphabetPage === 0 ? "default" : "pointer", fontWeight: 700, fontSize: 14, opacity: alphabetPage === 0 ? 0.4 : 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>← Prev</button>
              <button disabled={alphabetPage === alphaPages - 1} className="tap-scale" onClick={() => setAlphabetPage(p => p + 1)} style={{ padding: "14px 28px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #4A90D9, #357ABD)", color: "white", cursor: alphabetPage === alphaPages - 1 ? "default" : "pointer", fontWeight: 800, fontSize: 14, opacity: alphabetPage === alphaPages - 1 ? 0.5 : 1, boxShadow: "0 4px 16px rgba(74,144,217,0.45)" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.07)",
        display: "flex", padding: "6px 8px",
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
        gap: 4, boxSizing: "border-box", zIndex: 100,
      }}>
        {navBtn("Home", "🏠", "home")}
        {navBtn("Sentences", "📝", "sentences")}
        {navBtn("Talk", "💬", "conversations")}
        {navBtn("Sounds", "🔤", "alphabet")}
      </div>
    </div>
  );
}
