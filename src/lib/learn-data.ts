export type Translations = { uz: string; ru: string; en: string };

export type Vocab = {
  id: string;
  word: string;       // 你好
  pinyin: string;     // nǐ hǎo
  meaning: Translations;
  hskLevel: number;
  exampleZh?: string;
  examplePinyin?: string;
  example?: Translations;
};

export type CharacterEntry = {
  hanzi: string;
  pinyin: string;
  meaning: Translations;
  hskLevel: number;
};

/** Distinct HSK levels present in a dataset, ascending. */
export function levelsIn<T extends { hskLevel: number }>(items: T[]): number[] {
  return Array.from(new Set(items.map((i) => i.hskLevel))).sort((a, b) => a - b);
}

export const CHARACTERS: CharacterEntry[] = [
  { hanzi: "你", pinyin: "nǐ",   meaning: { uz: "sen",     ru: "ты",        en: "you" }, hskLevel: 1 },
  { hanzi: "好", pinyin: "hǎo",  meaning: { uz: "yaxshi",  ru: "хорошо",    en: "good" }, hskLevel: 1 },
  { hanzi: "我", pinyin: "wǒ",   meaning: { uz: "men",     ru: "я",         en: "I" }, hskLevel: 1 },
  { hanzi: "是", pinyin: "shì",  meaning: { uz: "—dir",    ru: "являться",  en: "to be" }, hskLevel: 1 },
  { hanzi: "不", pinyin: "bù",   meaning: { uz: "yo'q",    ru: "не",        en: "not" }, hskLevel: 1 },
  { hanzi: "了", pinyin: "le",   meaning: { uz: "—di",     ru: "уже",       en: "(past)" }, hskLevel: 1 },
  { hanzi: "人", pinyin: "rén",  meaning: { uz: "odam",    ru: "человек",   en: "person" }, hskLevel: 1 },
  { hanzi: "中", pinyin: "zhōng", meaning: { uz: "o'rta / Xitoy", ru: "середина / Китай", en: "middle / China" }, hskLevel: 1 },
  { hanzi: "国", pinyin: "guó",  meaning: { uz: "davlat",  ru: "страна",    en: "country" }, hskLevel: 1 },
  { hanzi: "学", pinyin: "xué",  meaning: { uz: "o'qish",  ru: "учить",     en: "to learn" }, hskLevel: 1 },
  { hanzi: "生", pinyin: "shēng", meaning: { uz: "tug'ilish", ru: "родиться", en: "born" }, hskLevel: 1 },
  { hanzi: "爱", pinyin: "ài",   meaning: { uz: "sevgi",   ru: "любить",    en: "love" }, hskLevel: 1 },
  { hanzi: "大", pinyin: "dà",   meaning: { uz: "katta",   ru: "большой",   en: "big" }, hskLevel: 1 },
  { hanzi: "小", pinyin: "xiǎo", meaning: { uz: "kichik",  ru: "маленький", en: "small" }, hskLevel: 1 },
  { hanzi: "上", pinyin: "shàng", meaning: { uz: "yuqori", ru: "вверх",     en: "up" }, hskLevel: 1 },
  { hanzi: "下", pinyin: "xià",  meaning: { uz: "past",    ru: "вниз",      en: "down" }, hskLevel: 1 },
  { hanzi: "水", pinyin: "shuǐ", meaning: { uz: "suv",     ru: "вода",      en: "water" }, hskLevel: 1 },
  { hanzi: "火", pinyin: "huǒ",  meaning: { uz: "olov",    ru: "огонь",     en: "fire" }, hskLevel: 1 },
  { hanzi: "山", pinyin: "shān", meaning: { uz: "tog'",    ru: "гора",      en: "mountain" }, hskLevel: 1 },
  { hanzi: "日", pinyin: "rì",   meaning: { uz: "kun / quyosh", ru: "день / солнце", en: "sun / day" }, hskLevel: 1 },
  { hanzi: "月", pinyin: "yuè",  meaning: { uz: "oy",      ru: "луна / месяц", en: "moon / month" }, hskLevel: 1 },
  { hanzi: "年", pinyin: "nián", meaning: { uz: "yil",     ru: "год",       en: "year" }, hskLevel: 1 },
  { hanzi: "看", pinyin: "kàn",  meaning: { uz: "ko'rmoq", ru: "смотреть",  en: "to look" }, hskLevel: 1 },
  { hanzi: "去", pinyin: "qù",   meaning: { uz: "bormoq",  ru: "идти",      en: "to go" }, hskLevel: 1 },
  { hanzi: "来", pinyin: "lái",  meaning: { uz: "kelmoq",  ru: "приходить", en: "to come" }, hskLevel: 1 },

  // HSK 2
  { hanzi: "时", pinyin: "shí",  meaning: { uz: "vaqt",      ru: "время",      en: "time" }, hskLevel: 2 },
  { hanzi: "间", pinyin: "jiān", meaning: { uz: "oraliq",    ru: "промежуток", en: "interval" }, hskLevel: 2 },
  { hanzi: "白", pinyin: "bái",  meaning: { uz: "oq",        ru: "белый",      en: "white" }, hskLevel: 2 },
  { hanzi: "黑", pinyin: "hēi",  meaning: { uz: "qora",      ru: "чёрный",     en: "black" }, hskLevel: 2 },
  { hanzi: "红", pinyin: "hóng", meaning: { uz: "qizil",     ru: "красный",    en: "red" }, hskLevel: 2 },
  { hanzi: "快", pinyin: "kuài", meaning: { uz: "tez",       ru: "быстрый",    en: "fast" }, hskLevel: 2 },
  { hanzi: "慢", pinyin: "màn",  meaning: { uz: "sekin",     ru: "медленный",  en: "slow" }, hskLevel: 2 },
  { hanzi: "新", pinyin: "xīn",  meaning: { uz: "yangi",     ru: "новый",      en: "new" }, hskLevel: 2 },
  { hanzi: "旧", pinyin: "jiù",  meaning: { uz: "eski",      ru: "старый",     en: "old (thing)" }, hskLevel: 2 },
  { hanzi: "高", pinyin: "gāo",  meaning: { uz: "baland",    ru: "высокий",    en: "tall / high" }, hskLevel: 2 },
  { hanzi: "长", pinyin: "cháng", meaning: { uz: "uzun",     ru: "длинный",    en: "long" }, hskLevel: 2 },
  { hanzi: "走", pinyin: "zǒu",  meaning: { uz: "yurmoq",    ru: "идти",       en: "to walk" }, hskLevel: 2 },
  { hanzi: "跑", pinyin: "pǎo",  meaning: { uz: "yugurmoq",  ru: "бежать",     en: "to run" }, hskLevel: 2 },
  { hanzi: "门", pinyin: "mén",  meaning: { uz: "eshik",     ru: "дверь",      en: "door" }, hskLevel: 2 },
  { hanzi: "车", pinyin: "chē",  meaning: { uz: "mashina",   ru: "машина",     en: "vehicle" }, hskLevel: 2 },

  // HSK 3
  { hanzi: "图", pinyin: "tú",   meaning: { uz: "rasm",      ru: "картина",    en: "picture" }, hskLevel: 3 },
  { hanzi: "书", pinyin: "shū",  meaning: { uz: "kitob",     ru: "книга",      en: "book" }, hskLevel: 3 },
  { hanzi: "馆", pinyin: "guǎn", meaning: { uz: "bino / shoxoba", ru: "учреждение", en: "building / hall" }, hskLevel: 3 },
  { hanzi: "城", pinyin: "chéng", meaning: { uz: "shahar",   ru: "город",      en: "city" }, hskLevel: 3 },
  { hanzi: "市", pinyin: "shì",  meaning: { uz: "bozor",     ru: "рынок",      en: "market" }, hskLevel: 3 },
  { hanzi: "夏", pinyin: "xià",  meaning: { uz: "yoz",       ru: "лето",       en: "summer" }, hskLevel: 3 },
  { hanzi: "冬", pinyin: "dōng", meaning: { uz: "qish",      ru: "зима",       en: "winter" }, hskLevel: 3 },
  { hanzi: "春", pinyin: "chūn", meaning: { uz: "bahor",     ru: "весна",      en: "spring" }, hskLevel: 3 },
  { hanzi: "秋", pinyin: "qiū",  meaning: { uz: "kuz",       ru: "осень",      en: "autumn" }, hskLevel: 3 },
  { hanzi: "雪", pinyin: "xuě",  meaning: { uz: "qor",       ru: "снег",       en: "snow" }, hskLevel: 3 },
  { hanzi: "雨", pinyin: "yǔ",   meaning: { uz: "yomg'ir",   ru: "дождь",      en: "rain" }, hskLevel: 3 },
  { hanzi: "风", pinyin: "fēng", meaning: { uz: "shamol",    ru: "ветер",      en: "wind" }, hskLevel: 3 },
  { hanzi: "笔", pinyin: "bǐ",   meaning: { uz: "qalam",     ru: "ручка",      en: "pen" }, hskLevel: 3 },
  { hanzi: "纸", pinyin: "zhǐ",  meaning: { uz: "qog'oz",    ru: "бумага",     en: "paper" }, hskLevel: 3 },
  { hanzi: "声", pinyin: "shēng", meaning: { uz: "ovoz",     ru: "звук",       en: "sound" }, hskLevel: 3 },
];

export const VOCAB: Vocab[] = [
  { id: "v1", word: "你好", pinyin: "nǐ hǎo", meaning: { uz: "salom", ru: "привет", en: "hello" }, hskLevel: 1,
    exampleZh: "你好,老师!", examplePinyin: "nǐ hǎo, lǎo shī!",
    example: { uz: "Salom, o'qituvchi!", ru: "Здравствуйте, учитель!", en: "Hello, teacher!" } },
  { id: "v2", word: "谢谢", pinyin: "xiè xie", meaning: { uz: "rahmat", ru: "спасибо", en: "thanks" }, hskLevel: 1 },
  { id: "v3", word: "再见", pinyin: "zài jiàn", meaning: { uz: "xayr", ru: "до свидания", en: "goodbye" }, hskLevel: 1 },
  { id: "v4", word: "我", pinyin: "wǒ", meaning: { uz: "men", ru: "я", en: "I" }, hskLevel: 1 },
  { id: "v5", word: "你", pinyin: "nǐ", meaning: { uz: "sen", ru: "ты", en: "you" }, hskLevel: 1 },
  { id: "v6", word: "他", pinyin: "tā", meaning: { uz: "u (erkak)", ru: "он", en: "he" }, hskLevel: 1 },
  { id: "v7", word: "她", pinyin: "tā", meaning: { uz: "u (ayol)", ru: "она", en: "she" }, hskLevel: 1 },
  { id: "v8", word: "是", pinyin: "shì", meaning: { uz: "—dir / bo'lmoq", ru: "являться", en: "to be" }, hskLevel: 1 },
  { id: "v9", word: "不", pinyin: "bù", meaning: { uz: "yo'q", ru: "не", en: "no / not" }, hskLevel: 1 },
  { id: "v10", word: "学生", pinyin: "xué sheng", meaning: { uz: "talaba", ru: "студент", en: "student" }, hskLevel: 1 },
  { id: "v11", word: "老师", pinyin: "lǎo shī", meaning: { uz: "o'qituvchi", ru: "учитель", en: "teacher" }, hskLevel: 1 },
  { id: "v12", word: "朋友", pinyin: "péng you", meaning: { uz: "do'st", ru: "друг", en: "friend" }, hskLevel: 1 },
  { id: "v13", word: "中国", pinyin: "zhōng guó", meaning: { uz: "Xitoy", ru: "Китай", en: "China" }, hskLevel: 1 },
  { id: "v14", word: "爱", pinyin: "ài", meaning: { uz: "sevmoq", ru: "любить", en: "to love" }, hskLevel: 1 },
  { id: "v15", word: "好", pinyin: "hǎo", meaning: { uz: "yaxshi", ru: "хороший", en: "good" }, hskLevel: 1 },
  { id: "v16", word: "大", pinyin: "dà", meaning: { uz: "katta", ru: "большой", en: "big" }, hskLevel: 1 },
  { id: "v17", word: "小", pinyin: "xiǎo", meaning: { uz: "kichik", ru: "маленький", en: "small" }, hskLevel: 1 },
  { id: "v18", word: "水", pinyin: "shuǐ", meaning: { uz: "suv", ru: "вода", en: "water" }, hskLevel: 1 },
  { id: "v19", word: "茶", pinyin: "chá", meaning: { uz: "choy", ru: "чай", en: "tea" }, hskLevel: 1 },
  { id: "v20", word: "饭", pinyin: "fàn", meaning: { uz: "ovqat", ru: "еда", en: "food / rice" }, hskLevel: 1 },
  { id: "v21", word: "吃", pinyin: "chī", meaning: { uz: "yemoq", ru: "есть", en: "to eat" }, hskLevel: 1 },
  { id: "v22", word: "喝", pinyin: "hē", meaning: { uz: "ichmoq", ru: "пить", en: "to drink" }, hskLevel: 1 },
  { id: "v23", word: "看", pinyin: "kàn", meaning: { uz: "ko'rmoq", ru: "смотреть", en: "to see / watch" }, hskLevel: 1 },
  { id: "v24", word: "去", pinyin: "qù", meaning: { uz: "bormoq", ru: "идти", en: "to go" }, hskLevel: 1 },
  { id: "v25", word: "来", pinyin: "lái", meaning: { uz: "kelmoq", ru: "приходить", en: "to come" }, hskLevel: 1 },
  { id: "v26", word: "说", pinyin: "shuō", meaning: { uz: "aytmoq", ru: "говорить", en: "to say" }, hskLevel: 1 },
  { id: "v27", word: "学习", pinyin: "xué xí", meaning: { uz: "o'qish, o'rganish", ru: "учиться", en: "to study" }, hskLevel: 1 },
  { id: "v28", word: "工作", pinyin: "gōng zuò", meaning: { uz: "ish", ru: "работа", en: "work" }, hskLevel: 1 },
  { id: "v29", word: "家", pinyin: "jiā", meaning: { uz: "uy / oila", ru: "дом / семья", en: "home / family" }, hskLevel: 1 },
  { id: "v30", word: "今天", pinyin: "jīn tiān", meaning: { uz: "bugun", ru: "сегодня", en: "today" }, hskLevel: 1 },
  { id: "v31", word: "明天", pinyin: "míng tiān", meaning: { uz: "ertaga", ru: "завтра", en: "tomorrow" }, hskLevel: 1 },
  { id: "v32", word: "昨天", pinyin: "zuó tiān", meaning: { uz: "kecha", ru: "вчера", en: "yesterday" }, hskLevel: 1 },

  // HSK 2
  { id: "v33", word: "时间",   pinyin: "shí jiān",  meaning: { uz: "vaqt",         ru: "время",       en: "time" }, hskLevel: 2 },
  { id: "v34", word: "颜色",   pinyin: "yán sè",    meaning: { uz: "rang",         ru: "цвет",        en: "color" }, hskLevel: 2 },
  { id: "v35", word: "白色",   pinyin: "bái sè",    meaning: { uz: "oq rang",      ru: "белый",       en: "white" }, hskLevel: 2 },
  { id: "v36", word: "红色",   pinyin: "hóng sè",   meaning: { uz: "qizil rang",   ru: "красный",     en: "red" }, hskLevel: 2 },
  { id: "v37", word: "快",     pinyin: "kuài",      meaning: { uz: "tez",          ru: "быстро",      en: "fast" }, hskLevel: 2 },
  { id: "v38", word: "慢",     pinyin: "màn",       meaning: { uz: "sekin",        ru: "медленно",    en: "slow" }, hskLevel: 2 },
  { id: "v39", word: "新",     pinyin: "xīn",       meaning: { uz: "yangi",        ru: "новый",       en: "new" }, hskLevel: 2 },
  { id: "v40", word: "高",     pinyin: "gāo",       meaning: { uz: "baland",       ru: "высокий",     en: "tall" }, hskLevel: 2 },
  { id: "v41", word: "长",     pinyin: "cháng",     meaning: { uz: "uzun",         ru: "длинный",     en: "long" }, hskLevel: 2 },
  { id: "v42", word: "走",     pinyin: "zǒu",       meaning: { uz: "yurmoq",       ru: "идти",        en: "to walk" }, hskLevel: 2 },
  { id: "v43", word: "跑步",   pinyin: "pǎo bù",    meaning: { uz: "yugurmoq",     ru: "бегать",      en: "to jog" }, hskLevel: 2 },
  { id: "v44", word: "汽车",   pinyin: "qì chē",    meaning: { uz: "avtomobil",    ru: "автомобиль",  en: "car" }, hskLevel: 2 },
  { id: "v45", word: "学校",   pinyin: "xué xiào",  meaning: { uz: "maktab",       ru: "школа",       en: "school" }, hskLevel: 2 },
  { id: "v46", word: "医院",   pinyin: "yī yuàn",   meaning: { uz: "shifoxona",    ru: "больница",    en: "hospital" }, hskLevel: 2 },
  { id: "v47", word: "因为",   pinyin: "yīn wèi",   meaning: { uz: "chunki",       ru: "потому что",  en: "because" }, hskLevel: 2 },
  { id: "v48", word: "可以",   pinyin: "kě yǐ",     meaning: { uz: "mumkin",       ru: "можно",       en: "can / may" }, hskLevel: 2 },
  { id: "v49", word: "知道",   pinyin: "zhī dào",   meaning: { uz: "bilmoq",       ru: "знать",       en: "to know" }, hskLevel: 2 },
  { id: "v50", word: "希望",   pinyin: "xī wàng",   meaning: { uz: "umid qilmoq",  ru: "надеяться",   en: "to hope" }, hskLevel: 2 },

  // HSK 3
  { id: "v51", word: "图书馆", pinyin: "tú shū guǎn", meaning: { uz: "kutubxona",     ru: "библиотека",   en: "library" }, hskLevel: 3 },
  { id: "v52", word: "城市",   pinyin: "chéng shì",   meaning: { uz: "shahar",        ru: "город",        en: "city" }, hskLevel: 3 },
  { id: "v53", word: "夏天",   pinyin: "xià tiān",    meaning: { uz: "yoz",           ru: "лето",         en: "summer" }, hskLevel: 3 },
  { id: "v54", word: "冬天",   pinyin: "dōng tiān",   meaning: { uz: "qish",          ru: "зима",         en: "winter" }, hskLevel: 3 },
  { id: "v55", word: "春天",   pinyin: "chūn tiān",   meaning: { uz: "bahor",         ru: "весна",        en: "spring" }, hskLevel: 3 },
  { id: "v56", word: "秋天",   pinyin: "qiū tiān",    meaning: { uz: "kuz",           ru: "осень",        en: "autumn" }, hskLevel: 3 },
  { id: "v57", word: "下雪",   pinyin: "xià xuě",     meaning: { uz: "qor yog'moq",   ru: "идёт снег",    en: "to snow" }, hskLevel: 3 },
  { id: "v58", word: "下雨",   pinyin: "xià yǔ",      meaning: { uz: "yomg'ir",       ru: "идёт дождь",   en: "to rain" }, hskLevel: 3 },
  { id: "v59", word: "刮风",   pinyin: "guā fēng",    meaning: { uz: "shamol",        ru: "ветер дует",   en: "wind blows" }, hskLevel: 3 },
  { id: "v60", word: "铅笔",   pinyin: "qiān bǐ",     meaning: { uz: "qalam",         ru: "карандаш",     en: "pencil" }, hskLevel: 3 },
  { id: "v61", word: "声音",   pinyin: "shēng yīn",   meaning: { uz: "ovoz",          ru: "звук",         en: "voice / sound" }, hskLevel: 3 },
  { id: "v62", word: "音乐",   pinyin: "yīn yuè",     meaning: { uz: "musiqa",        ru: "музыка",       en: "music" }, hskLevel: 3 },
  { id: "v63", word: "比较",   pinyin: "bǐ jiào",     meaning: { uz: "solishtirish",  ru: "сравнение",    en: "to compare" }, hskLevel: 3 },
  { id: "v64", word: "重要",   pinyin: "zhòng yào",   meaning: { uz: "muhim",         ru: "важный",       en: "important" }, hskLevel: 3 },
  { id: "v65", word: "经常",   pinyin: "jīng cháng",  meaning: { uz: "tez-tez",       ru: "часто",        en: "often" }, hskLevel: 3 },
  { id: "v66", word: "已经",   pinyin: "yǐ jīng",     meaning: { uz: "allaqachon",    ru: "уже",          en: "already" }, hskLevel: 3 },
  { id: "v67", word: "应该",   pinyin: "yīng gāi",    meaning: { uz: "kerak",         ru: "должен",       en: "should" }, hskLevel: 3 },
  { id: "v68", word: "终于",   pinyin: "zhōng yú",    meaning: { uz: "nihoyat",       ru: "наконец",      en: "finally" }, hskLevel: 3 },
];

export type Passage = {
  id: string;
  hskLevel: number;
  title: Translations;
  text: string;
  pinyin: string;
  translation: Translations;
  question: Translations;
  options: { zh: string; correct?: boolean; label: Translations }[];
};

export const PASSAGES: Passage[] = [
  {
    id: "p1",
    hskLevel: 1,
    title: { uz: "Salomlashish", ru: "Приветствие", en: "Greetings" },
    text: "你好!我是李明。我是学生。",
    pinyin: "nǐ hǎo! wǒ shì lǐ míng. wǒ shì xué sheng.",
    translation: {
      uz: "Salom! Men Li Min. Men talabaman.",
      ru: "Здравствуйте! Я Ли Мин. Я студент.",
      en: "Hello! I am Li Ming. I am a student.",
    },
    question: { uz: "Li Min kim?", ru: "Кто Ли Мин?", en: "Who is Li Ming?" },
    options: [
      { zh: "老师",   label: { uz: "O'qituvchi", ru: "Учитель", en: "Teacher" } },
      { zh: "学生", correct: true, label: { uz: "Talaba",  ru: "Студент", en: "Student" } },
      { zh: "朋友",   label: { uz: "Do'st",      ru: "Друг",    en: "Friend" } },
    ],
  },
  {
    id: "p2",
    hskLevel: 1,
    title: { uz: "Choy", ru: "Чай", en: "Tea" },
    text: "我爱喝茶。今天我喝中国茶。",
    pinyin: "wǒ ài hē chá. jīn tiān wǒ hē zhōng guó chá.",
    translation: {
      uz: "Men choy ichishni yaxshi ko'raman. Bugun xitoy choyini ichdim.",
      ru: "Я люблю пить чай. Сегодня я пью китайский чай.",
      en: "I love drinking tea. Today I'm drinking Chinese tea.",
    },
    question: { uz: "Bugun nima ichaman?", ru: "Что я пью сегодня?", en: "What am I drinking today?" },
    options: [
      { zh: "水",                       label: { uz: "Suv",         ru: "Воду",        en: "Water" } },
      { zh: "中国茶", correct: true,   label: { uz: "Xitoy choyi", ru: "Китайский чай", en: "Chinese tea" } },
      { zh: "饭",                       label: { uz: "Ovqat",       ru: "Еду",          en: "Food" } },
    ],
  },
  {
    id: "p3",
    hskLevel: 1,
    title: { uz: "Oilam", ru: "Моя семья", en: "My family" },
    text: "我家有四个人:爸爸、妈妈、我和弟弟。",
    pinyin: "wǒ jiā yǒu sì gè rén: bà ba, mā ma, wǒ hé dì di.",
    translation: {
      uz: "Oilamda 4 kishi bor: dadam, oyim, men va ukam.",
      ru: "В моей семье четыре человека: папа, мама, я и младший брат.",
      en: "There are four people in my family: dad, mom, me and my younger brother.",
    },
    question: { uz: "Oilamda nechta odam bor?", ru: "Сколько человек в моей семье?", en: "How many people are in my family?" },
    options: [
      { zh: "三 (3)",                       label: { uz: "3 ta", ru: "3", en: "3" } },
      { zh: "四 (4)", correct: true,       label: { uz: "4 ta", ru: "4", en: "4" } },
      { zh: "五 (5)",                       label: { uz: "5 ta", ru: "5", en: "5" } },
    ],
  },
];
