import type { AuthErrorCode } from "../auth-types";

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

type AppSection = {
  sidebar: {
    dashboard: string; characters: string; vocabulary: string; listening: string;
    reading: string; writing: string; speaking: string; exam: string;
    logout: string; back: string;
  };
  dashboard: {
    hello: string; goodMorning: string; goodAfternoon: string; goodEvening: string;
    xp: string; streakDays: string; charactersLearned: string; vocabLearned: string;
    continueLearning: string; dailyMission: string; dailyMissionDesc: string;
    levelProgress: string; modules: string; resetData: string; resetConfirm: string;
  };
  characters: {
    title: string; subtitle: string; learned: string; tracePractice: string;
    showAnimation: string; reset: string; markLearned: string; next: string;
    pickToStart: string; alreadyLearned: string;
  };
  vocab: {
    title: string; subtitle: string; due: string; noDue: string;
    startReview: string; showAnswer: string; again: string; hard: string;
    good: string; easy: string; sessionDone: string; reviewed: string;
  };
  listening: {
    title: string; play: string; slow: string; chooseTranslation: string;
    correct: string; wrong: string; next: string; finish: string;
    score: string; ttsUnsupported: string;
  };
  reading: {
    title: string; comprehension: string; viewTranslation: string;
    hideTranslation: string; correct: string; wrong: string; finish: string;
    nextPassage: string;
  };
  writing: {
    title: string; prompt: string; placeholder: string; submit: string;
    correct: string; wrong: string; answerWas: string; next: string;
    finish: string;
  };
  speaking: {
    title: string; prompt: string; start: string; stop: string;
    playback: string; recordAgain: string; markDone: string;
    micDenied: string; unsupported: string; recording: string;
  };
  exam: {
    title: string; intro: string; start: string; question: string;
    of: string; finish: string; finalScore: string; retry: string;
    backToDashboard: string;
  };
  levelFilter: { label: string; all: string };
  common: { back: string; next: string; finish: string; continue: string; points: string };
};

type Dict = {
  nav: { modules: string; levels: string; try: string; pricing: string; login: string; startFree: string };
  hero: { badge: string; title1: string; title2: string; subtitle: string; startFree: string; tryDemo: string; words: string; chars: string; levels: string };
  modules: {
    title: string;
    subtitle: string;
    items: Record<"listening" | "reading" | "writing" | "speaking" | "characters" | "vocabulary", { title: string; description: string }>;
  };
  levels: {
    title: string;
    subtitle: string;
    words: string;
    chars: string;
    descriptions: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string>;
    cefr: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string>;
  };
  demo: { title: string; subtitle: string; points: string[] };
  hanzi: { label: string; replay: string; next: string; meanings: Record<string, string> };
  pricing: {
    title: string;
    subtitle: string;
    mostPopular: string;
    forever: string;
    perMonth: string;
    plans: {
      free: { name: string; description: string; cta: string; features: string[] };
      pro: { name: string; description: string; cta: string; features: string[] };
      premium: { name: string; description: string; cta: string; features: string[] };
    };
  };
  cta: { title: string; subtitle: string; button: string };
  footer: { tagline: string; product: string; about: string; app: string; appText: string; privacy: string; terms: string; contact: string; rights: string };
  auth: {
    login: { title: string; subtitle: string; email: string; password: string; submit: string; or: string; google: string; noAccount: string; register: string; forgot: string };
    register: { title: string; subtitle: string; name: string; email: string; password: string; passwordHint: string; submit: string; haveAccount: string; login: string; terms: string; termsPrefix: string; and: string };
    forgot: { title: string; subtitle: string; email: string; submit: string; sent: string; backToLogin: string };
    reset: { title: string; subtitle: string; password: string; passwordHint: string; submit: string; success: string };
    errors: Record<AuthErrorCode, string>;
    confirmEmail: string;
  };
  legal: {
    backHome: string;
    updated: string;
    terms: { title: string; body: string[] };
    privacy: { title: string; body: string[] };
  };
  app: AppSection;
};

export const dictionaries: Record<Locale, Dict> = {
  uz: {
    nav: { modules: "Modullar", levels: "HSK darajalari", try: "Sinab ko'ring", pricing: "Narxlar", login: "Kirish", startFree: "Bepul boshlash" },
    hero: {
      badge: "HSK 1 – 9 uchun darslar",
      title1: "Xitoy tilini o'rganing.",
      title2: "HSK ni topshiring.",
      subtitle: "Ieroglif yozish, talaffuz va kunlik mashqlar. Noldan HSK 9 ga yetish uchun zarur bo'lgan hammasi bitta joyda.",
      startFree: "Bepul boshlash", tryDemo: "Sinab ko'ring",
      words: "so'z", chars: "ieroglif", levels: "daraja",
    },
    modules: {
      title: "HSK ning barcha qismlari — bitta joyda",
      subtitle: "Oltita oddiy modul: birinchi ierogliftan tortib to'liq inshogacha.",
      items: {
        listening: { title: "Tinglash", description: "Xitoyliklar gapirgan audiolar. Sekin rejim va matn ko'rinishi bor." },
        reading:   { title: "O'qish",   description: "HSK 1 dan 9 gacha matnlar. So'zni bosib tarjimasini ko'rasiz." },
        writing:   { title: "Yozish",   description: "Ieroglifni chiziq tartibida yozasiz. Insholarni dastur tekshiradi." },
        speaking:  { title: "Gapirish", description: "Ovozingizni yozasiz — dastur talaffuzingizni baholaydi." },
        characters: { title: "Ieroglif", description: "3000 dan ortiq ieroglif. Chiziq tartibi va takrorlash mashqlari." },
        vocabulary: { title: "So'z va qoida", description: "HSK darajalari bo'yicha so'zlar, qoidalar va misollar." },
      },
    },
    levels: {
      title: "HSK 1 dan HSK 9 gacha",
      subtitle: "11 000 dan ortiq so'z va 3 000 dan ortiq ieroglif — barcha darajalar.",
      words: "so'z", chars: "ieroglif",
      descriptions: {
        1: "Salomlashish va oddiy so'zlar.",
        2: "Oddiy mavzularda gaplashish.",
        3: "Kundalik hayot va sayohat uchun.",
        4: "Ko'p mavzuda erkin suhbat.",
        5: "Gazeta o'qish, film tomosha qilish.",
        6: "Deyarli xitoylik darajasida.",
        7: "Ish va o'qish uchun mukammal til.",
      },
      cefr: { 1: "Boshlovchi", 2: "Boshlovchi+", 3: "O'rta", 4: "O'rta+", 5: "Yuqori", 6: "Yuqori+", 7: "Mutaxassis" },
    },
    demo: {
      title: "Ierogliflarni xitoyliklardek o'rganing",
      subtitle: "Boshqa ilovalar faqat tarjimasini ko'rsatadi. HSKGo esa har bir ierogliflni yozdiradi — xuddi xitoylik bola maktabda o'rganganidek.",
      points: [
        "Har bir ieroglif uchun chiziq animatsiyasi",
        "Avtomatik o'qilish va ton belgilari",
        "Telefon ekranida barmoq bilan yozish mashqi",
        "Takrorlash tizimi — ierogliflarni unutmaysiz",
      ],
    },
    hanzi: { label: "Chiziq tartibi", replay: "Qayta", next: "Keyingisi",
      meanings: { "你": "sen", "好": "yaxshi", "学": "o'qish", "中": "o'rta / Xitoy", "国": "davlat", "爱": "sevgi" } },
    pricing: {
      title: "Oddiy va tushunarli narxlar",
      subtitle: "Istalgan vaqtda bekor qilish mumkin. To'lov Click, Payme yoki karta orqali.",
      mostPopular: "Eng mashhur", forever: "abadiy", perMonth: "oyiga",
      plans: {
        free:    { name: "Bepul",   description: "Karta kerak emas — bugun boshlang.", cta: "Boshlash",
          features: ["HSK 1 va HSK 2 to'liq ochiq", "Kuniga 10 ta mashq", "Ieroglif yozish mashqi", "Oddiy so'z kartochkalari"] },
        pro:     { name: "Pro",     description: "HSK 1–6 ni topshirish uchun zarur hammasi.", cta: "7 kun bepul sinash",
          features: ["Barcha HSK darajalari (1–9)", "Cheksiz dastur baholashi", "Talaffuz tekshirish", "Inshoni baholash", "To'liq sinov imtihonlar", "Ball, kunlik ketma-ketlik va reyting"] },
        premium: { name: "Premium", description: "Pro + jonli o'qituvchi va sertifikat.", cta: "Bog'lanish",
          features: ["Pro tarifining hammasi", "Haftalik jonli o'qituvchi darslari", "Shaxsiy o'qish rejasi", "Sinov imtihon sertifikati", "Birinchi navbatda yordam"] },
      },
    },
    cta: { title: "Birinchi ieroglifgacha bir bosish qoldi.",
      subtitle: "Minglab o'zbek talabalar bilan birga xitoy tilini o'rganishni boshlang. Bepul — to'lash faqat imtihonga tayyorlanganda kerak.",
      button: "Bepul boshlash" },
    footer: { tagline: "HSK ga eng tez tayyorlanish — kunlik mashqlar bilan.",
      product: "Mahsulot", about: "Biz haqimizda", app: "Ilovani yuklab oling",
      appText: "iOS va Android — tez orada. Hozircha veb-sayt har qanday telefonda ishlaydi.",
      privacy: "Maxfiylik", terms: "Foydalanish shartlari", contact: "Bog'lanish",
      rights: "Barcha huquqlar himoyalangan." },
    auth: {
      login: { title: "Xush kelibsiz!", subtitle: "Hisobingizga kiring va o'qishni davom ettiring.",
        email: "Pochta", password: "Parol", submit: "Kirish", or: "yoki",
        google: "Google orqali davom etish", noAccount: "Hisobingiz yo'qmi?", register: "Ro'yxatdan o'ting",
        forgot: "Parolni unutdingizmi?" },
      register: { title: "Xitoy tilini o'rganishni boshlang", subtitle: "Bepul, abadiy. Bank kartasi shart emas.",
        name: "Ism", email: "Pochta", password: "Parol", passwordHint: "Kamida 8 ta belgi",
        submit: "Bepul hisob yaratish", haveAccount: "Allaqachon hisobingiz bormi?", login: "Kirish",
        termsPrefix: "Ro'yxatdan o'tish bilan", terms: "Foydalanish shartlari", and: "va" },
      forgot: { title: "Parolni tiklash", subtitle: "Pochtangizni kiriting — tiklash havolasini yuboramiz.",
        email: "Pochta", submit: "Havola yuborish",
        sent: "Tiklash havolasini pochtangizga yubordik. Uni bosib, yangi parol o'rnating.",
        backToLogin: "Kirishga qaytish" },
      reset: { title: "Yangi parol", subtitle: "Hisobingiz uchun yangi parol o'rnating.",
        password: "Yangi parol", passwordHint: "Kamida 8 ta belgi", submit: "Parolni saqlash",
        success: "Parol yangilandi. Yo'naltirilmoqda…" },
      errors: {
        missing_fields: "Pochta va parolni kiriting.",
        weak_password: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.",
        email_taken: "Bu pochta allaqachon ro'yxatdan o'tgan.",
        invalid_credentials: "Pochta yoki parol noto'g'ri.",
        generic: "Xatolik yuz berdi. Qayta urinib ko'ring.",
      },
      confirmEmail: "Tasdiqlash havolasini pochtangizga yubordik. Davom etish uchun uni bosing.",
    },
    legal: {
      backHome: "Bosh sahifaga qaytish",
      updated: "Oxirgi yangilanish: 2026-yil 26-may",
      terms: {
        title: "Foydalanish shartlari",
        body: [
          "HSKGo — xitoy tilini (HSK) o'rganish uchun ta'limiy ilova. Undan foydalanish orqali ushbu shartlarga rozilik bildirasiz.",
          "Hisobingiz va parolingiz xavfsizligi siz zimmangizda. Ilovadan qonuniy va shaxsiy o'quv maqsadlarida foydalaning.",
          "Xizmat \"borligicha\" taqdim etiladi. Bu loyiha ishlab chiqilmoqda, shuning uchun imkoniyatlar o'zgarishi mumkin.",
        ],
      },
      privacy: {
        title: "Maxfiylik siyosati",
        body: [
          "Ro'yxatdan o'tishda biz faqat ismingiz va pochta manzilingizni saqlaymiz — hisobingizni yaratish va unga kirish uchun.",
          "Autentifikatsiya Supabase orqali amalga oshiriladi. O'quv progressingiz hozircha brauzeringizda (localStorage) saqlanadi.",
          "Ma'lumotlaringizni uchinchi tomonlarga sotmaymiz. Hisobingizni o'chirishni istasangiz, biz bilan bog'laning.",
        ],
      },
    },
    app: {
      sidebar: {
        dashboard: "Bosh sahifa", characters: "Ieroglifar", vocabulary: "So'zlar",
        listening: "Tinglash", reading: "O'qish", writing: "Yozish",
        speaking: "Gapirish", exam: "Sinov imtihon",
        logout: "Chiqish", back: "Orqaga",
      },
      dashboard: {
        hello: "Salom", goodMorning: "Xayrli tong", goodAfternoon: "Xayrli kun", goodEvening: "Xayrli kech",
        xp: "Ball", streakDays: "Kunlik ketma-ketlik",
        charactersLearned: "O'rganilgan ieroglif", vocabLearned: "O'rganilgan so'z",
        continueLearning: "O'qishni davom ettirish",
        dailyMission: "Bugungi vazifa",
        dailyMissionDesc: "10 ta so'z yoki 5 ta ieroglif takrorlang.",
        levelProgress: "HSK 1 daraja",
        modules: "Modullar",
        resetData: "Ma'lumotlarni tozalash",
        resetConfirm: "Barcha progressingizni tozalashni xohlaysizmi?",
      },
      characters: {
        title: "Ieroglif o'rganish", subtitle: "Bossangiz, ieroglifni chizib ko'rasiz.",
        learned: "O'rganilgan", tracePractice: "Yozish mashqi",
        showAnimation: "Animatsiya", reset: "Tozalash",
        markLearned: "O'rgandim", next: "Keyingi ieroglif",
        pickToStart: "Boshlash uchun ieroglifni tanlang.",
        alreadyLearned: "✓ O'rganilgan",
      },
      vocab: {
        title: "So'z kartochkalari", subtitle: "Takrorlash vaqti kelganlarini ko'ramiz.",
        due: "Bugungi", noDue: "Bugun takrorlash uchun kartochkalar yo'q. Yaxshi ish!",
        startReview: "Boshlash",
        showAnswer: "Javobni ko'rsat",
        again: "Yana", hard: "Qiyin", good: "Yaxshi", easy: "Oson",
        sessionDone: "Yakunlandi!",
        reviewed: "ta kartochka takrorlandi",
      },
      listening: {
        title: "Tinglash", play: "Eshitish", slow: "Sekin",
        chooseTranslation: "Tarjimasini tanlang:",
        correct: "To'g'ri!", wrong: "Noto'g'ri", next: "Keyingi",
        finish: "Yakunlash", score: "Natija",
        ttsUnsupported: "Brauzeringizda ovoz qo'llab-quvvatlanmaydi.",
      },
      reading: {
        title: "O'qish", comprehension: "Matnni tushunish",
        viewTranslation: "Tarjimani ko'rish", hideTranslation: "Yashirish",
        correct: "To'g'ri!", wrong: "Noto'g'ri",
        finish: "Yakunlash", nextPassage: "Keyingi matn",
      },
      writing: {
        title: "Yozish", prompt: "Quyidagi ieroglifning o'qilishi (pinyin) ni yozing:",
        placeholder: "pinyin (masalan: ni hao)",
        submit: "Tekshirish", correct: "To'g'ri!", wrong: "Noto'g'ri",
        answerWas: "To'g'ri javob:", next: "Keyingi", finish: "Yakunlash",
      },
      speaking: {
        title: "Gapirish", prompt: "Quyidagi jumlani o'qing:",
        start: "Yozishni boshlash", stop: "To'xtatish",
        playback: "Eshitish", recordAgain: "Qayta yozish",
        markDone: "Bajardim",
        micDenied: "Mikrofonga ruxsat berilmadi.",
        unsupported: "Brauzeringizda yozish qo'llab-quvvatlanmaydi.",
        recording: "Yozilmoqda...",
      },
      exam: {
        title: "Sinov imtihon", intro: "10 ta savol, tasodifiy. Tayyormisiz?",
        start: "Boshlash", question: "Savol", of: "/", finish: "Yakunlash",
        finalScore: "Sizning natijangiz:", retry: "Qayta urinish",
        backToDashboard: "Bosh sahifaga",
      },
      levelFilter: { label: "Daraja:", all: "Hammasi" },
      common: { back: "Orqaga", next: "Keyingi", finish: "Yakunlash", continue: "Davom etish", points: "ball" },
    },
  },
  ru: {
    nav: { modules: "Модули", levels: "Уровни HSK", try: "Попробовать", pricing: "Цены", login: "Войти", startFree: "Начать бесплатно" },
    hero: {
      badge: "Подготовка к HSK 1 – 9",
      title1: "Учите китайский.", title2: "Сдайте HSK.",
      subtitle: "Написание иероглифов, произношение и ежедневные упражнения. Всё, что нужно от нуля до HSK 9 — в одном месте.",
      startFree: "Начать бесплатно", tryDemo: "Попробовать",
      words: "слов", chars: "иероглифов", levels: "уровней",
    },
    modules: {
      title: "Все навыки HSK — в одном приложении",
      subtitle: "Шесть простых модулей: от первого иероглифа до полноценного сочинения.",
      items: {
        listening: { title: "Аудирование", description: "Аудио от носителей. Замедленный режим и текст диалога." },
        reading:   { title: "Чтение",      description: "Тексты от HSK 1 до 9. Нажмите на слово — увидите перевод." },
        writing:   { title: "Письмо",      description: "Пишите иероглифы по правильному порядку черт. Проверка сочинений." },
        speaking:  { title: "Говорение",   description: "Записывайте свой голос — система оценит ваше произношение." },
        characters: { title: "Иероглифы",  description: "Более 3000 иероглифов. Анимация черт и повторение." },
        vocabulary: { title: "Слова и грамматика", description: "Слова и правила по уровням HSK с примерами." },
      },
    },
    levels: {
      title: "От HSK 1 до HSK 9",
      subtitle: "Более 11 000 слов и 3 000 иероглифов — все уровни.",
      words: "слов", chars: "иероглифов",
      descriptions: {
        1: "Приветствия и простые слова.",
        2: "Беседа на простые темы.",
        3: "Повседневная жизнь и путешествия.",
        4: "Свободное общение на разные темы.",
        5: "Чтение газет, просмотр фильмов.",
        6: "Почти как у носителя.",
        7: "Безупречный язык для работы и учёбы.",
      },
      cefr: { 1: "Начальный", 2: "Начальный+", 3: "Средний", 4: "Средний+", 5: "Продвинутый", 6: "Продвинутый+", 7: "Эксперт" },
    },
    demo: {
      title: "Учите иероглифы как китайцы",
      subtitle: "Другие приложения показывают только перевод. HSKGo заставляет вас писать каждый иероглиф — как учат китайские школьники.",
      points: [
        "Анимация черт для каждого иероглифа",
        "Автоматическая транскрипция и тоны",
        "Письмо пальцем на экране телефона",
        "Система повторений — иероглифы не забываются",
      ],
    },
    hanzi: { label: "Порядок черт", replay: "Заново", next: "Следующий",
      meanings: { "你": "ты", "好": "хорошо", "学": "учить", "中": "середина / Китай", "国": "страна", "爱": "любовь" } },
    pricing: {
      title: "Простые и понятные цены",
      subtitle: "Можно отменить в любой момент. Оплата через Click, Payme или карту.",
      mostPopular: "Популярный", forever: "навсегда", perMonth: "в месяц",
      plans: {
        free:    { name: "Бесплатно", description: "Карта не нужна — начните сегодня.", cta: "Начать",
          features: ["HSK 1 и HSK 2 открыты полностью", "10 упражнений в день", "Тренажёр иероглифов", "Базовые карточки слов"] },
        pro:     { name: "Pro", description: "Всё для сдачи HSK 1–6.", cta: "7 дней бесплатно",
          features: ["Все уровни HSK (1–9)", "Безлимитная проверка", "Проверка произношения", "Проверка сочинений", "Полные пробные экзамены", "Баллы, серии и рейтинг"] },
        premium: { name: "Premium", description: "Pro + живой учитель и сертификат.", cta: "Связаться",
          features: ["Всё из Pro", "Еженедельные уроки с учителем", "Личный план обучения", "Сертификат пробного экзамена", "Приоритетная поддержка"] },
      },
    },
    cta: { title: "До первого иероглифа — один клик.",
      subtitle: "Начните учить китайский вместе с тысячами учеников. Бесплатно — платите только когда готовы к экзамену.",
      button: "Начать бесплатно" },
    footer: { tagline: "Самая быстрая подготовка к HSK — с ежедневными упражнениями.",
      product: "Продукт", about: "О нас", app: "Скачайте приложение",
      appText: "iOS и Android — скоро. А пока сайт работает на любом телефоне.",
      privacy: "Конфиденциальность", terms: "Условия использования", contact: "Связаться",
      rights: "Все права защищены." },
    auth: {
      login: { title: "С возвращением!", subtitle: "Войдите и продолжайте обучение.",
        email: "Почта", password: "Пароль", submit: "Войти", or: "или",
        google: "Продолжить через Google", noAccount: "Нет аккаунта?", register: "Зарегистрируйтесь",
        forgot: "Забыли пароль?" },
      register: { title: "Начните учить китайский", subtitle: "Бесплатно, навсегда. Карта не нужна.",
        name: "Имя", email: "Почта", password: "Пароль", passwordHint: "Минимум 8 символов",
        submit: "Создать бесплатный аккаунт", haveAccount: "Уже есть аккаунт?", login: "Войти",
        termsPrefix: "Регистрируясь, вы соглашаетесь с", terms: "Условиями использования", and: "и" },
      forgot: { title: "Сброс пароля", subtitle: "Введите почту — мы отправим ссылку для сброса.",
        email: "Почта", submit: "Отправить ссылку",
        sent: "Мы отправили ссылку для сброса на вашу почту. Перейдите по ней и задайте новый пароль.",
        backToLogin: "Вернуться ко входу" },
      reset: { title: "Новый пароль", subtitle: "Задайте новый пароль для аккаунта.",
        password: "Новый пароль", passwordHint: "Минимум 8 символов", submit: "Сохранить пароль",
        success: "Пароль обновлён. Перенаправляем…" },
      errors: {
        missing_fields: "Введите почту и пароль.",
        weak_password: "Пароль должен содержать не менее 8 символов.",
        email_taken: "Эта почта уже зарегистрирована.",
        invalid_credentials: "Неверная почта или пароль.",
        generic: "Произошла ошибка. Попробуйте снова.",
      },
      confirmEmail: "Мы отправили ссылку для подтверждения на вашу почту. Перейдите по ней, чтобы продолжить.",
    },
    legal: {
      backHome: "Вернуться на главную",
      updated: "Последнее обновление: 26 мая 2026 г.",
      terms: {
        title: "Условия использования",
        body: [
          "HSKGo — образовательное приложение для изучения китайского языка (HSK). Используя его, вы соглашаетесь с настоящими условиями.",
          "Вы несёте ответственность за безопасность своего аккаунта и пароля. Используйте приложение в законных и личных учебных целях.",
          "Сервис предоставляется «как есть». Это развивающийся проект, поэтому функции могут меняться.",
        ],
      },
      privacy: {
        title: "Политика конфиденциальности",
        body: [
          "При регистрации мы храним только ваше имя и адрес электронной почты — чтобы создать аккаунт и обеспечить вход.",
          "Аутентификация выполняется через Supabase. Ваш учебный прогресс пока хранится в браузере (localStorage).",
          "Мы не продаём ваши данные третьим лицам. Если хотите удалить аккаунт — свяжитесь с нами.",
        ],
      },
    },
    app: {
      sidebar: {
        dashboard: "Главная", characters: "Иероглифы", vocabulary: "Слова",
        listening: "Аудирование", reading: "Чтение", writing: "Письмо",
        speaking: "Говорение", exam: "Пробный экзамен",
        logout: "Выйти", back: "Назад",
      },
      dashboard: {
        hello: "Привет", goodMorning: "Доброе утро", goodAfternoon: "Добрый день", goodEvening: "Добрый вечер",
        xp: "Баллы", streakDays: "Дней подряд",
        charactersLearned: "Изучено иероглифов", vocabLearned: "Изучено слов",
        continueLearning: "Продолжить обучение",
        dailyMission: "Задание дня",
        dailyMissionDesc: "Повторите 10 слов или 5 иероглифов.",
        levelProgress: "Уровень HSK 1",
        modules: "Модули",
        resetData: "Сбросить данные",
        resetConfirm: "Удалить весь прогресс?",
      },
      characters: {
        title: "Иероглифы", subtitle: "Нажмите, чтобы потренироваться писать.",
        learned: "Изучено", tracePractice: "Тренировка письма",
        showAnimation: "Анимация", reset: "Сброс",
        markLearned: "Изучил", next: "Следующий иероглиф",
        pickToStart: "Выберите иероглиф, чтобы начать.",
        alreadyLearned: "✓ Изучено",
      },
      vocab: {
        title: "Карточки слов", subtitle: "Повторяем те, которые пора повторить.",
        due: "К повторению", noDue: "Сегодня повторять нечего. Отлично!",
        startReview: "Начать",
        showAnswer: "Показать ответ",
        again: "Снова", hard: "Сложно", good: "Хорошо", easy: "Легко",
        sessionDone: "Готово!",
        reviewed: "карточек повторено",
      },
      listening: {
        title: "Аудирование", play: "Слушать", slow: "Медленно",
        chooseTranslation: "Выберите перевод:",
        correct: "Правильно!", wrong: "Неверно", next: "Дальше",
        finish: "Закончить", score: "Результат",
        ttsUnsupported: "Ваш браузер не поддерживает озвучку.",
      },
      reading: {
        title: "Чтение", comprehension: "Понимание текста",
        viewTranslation: "Показать перевод", hideTranslation: "Скрыть",
        correct: "Правильно!", wrong: "Неверно",
        finish: "Закончить", nextPassage: "Следующий текст",
      },
      writing: {
        title: "Письмо", prompt: "Напишите чтение (пиньинь) этого иероглифа:",
        placeholder: "пиньинь (например: ni hao)",
        submit: "Проверить", correct: "Правильно!", wrong: "Неверно",
        answerWas: "Правильный ответ:", next: "Следующий", finish: "Закончить",
      },
      speaking: {
        title: "Говорение", prompt: "Произнесите фразу:",
        start: "Начать запись", stop: "Остановить",
        playback: "Прослушать", recordAgain: "Записать снова",
        markDone: "Готово",
        micDenied: "Доступ к микрофону запрещён.",
        unsupported: "Ваш браузер не поддерживает запись.",
        recording: "Запись...",
      },
      exam: {
        title: "Пробный экзамен", intro: "10 случайных вопросов. Готовы?",
        start: "Начать", question: "Вопрос", of: "/", finish: "Закончить",
        finalScore: "Ваш результат:", retry: "Попробовать снова",
        backToDashboard: "На главную",
      },
      levelFilter: { label: "Уровень:", all: "Все" },
      common: { back: "Назад", next: "Дальше", finish: "Закончить", continue: "Продолжить", points: "баллов" },
    },
  },
  en: {
    nav: { modules: "Modules", levels: "HSK Levels", try: "Try it", pricing: "Pricing", login: "Sign in", startFree: "Start free" },
    hero: {
      badge: "HSK 1 – 9 preparation",
      title1: "Learn Mandarin.", title2: "Pass the HSK.",
      subtitle: "Character writing, pronunciation and daily practice. Everything you need from zero to HSK 9 — in one place.",
      startFree: "Start free", tryDemo: "Try it",
      words: "words", chars: "characters", levels: "levels",
    },
    modules: {
      title: "Every HSK skill — in one app",
      subtitle: "Six simple modules: from your first character to a full essay.",
      items: {
        listening: { title: "Listening", description: "Native-speaker audio with slow-mode playback and transcripts." },
        reading:   { title: "Reading",   description: "Texts from HSK 1 to 9. Tap a word for instant translation." },
        writing:   { title: "Writing",   description: "Write characters in correct stroke order. Essay grading included." },
        speaking:  { title: "Speaking",  description: "Record your voice — the app scores your pronunciation." },
        characters: { title: "Characters", description: "3,000+ characters with stroke animation and review drills." },
        vocabulary: { title: "Words & grammar", description: "HSK-aligned vocabulary, grammar rules and examples." },
      },
    },
    levels: {
      title: "From HSK 1 to HSK 9",
      subtitle: "Over 11,000 words and 3,000 characters — all levels covered.",
      words: "words", chars: "chars",
      descriptions: {
        1: "Greetings and basic vocabulary.",
        2: "Simple conversations.",
        3: "Daily life and travel.",
        4: "Fluent talk on many topics.",
        5: "Read newspapers and watch films.",
        6: "Near-native fluency.",
        7: "Mastery for work and academia.",
      },
      cefr: { 1: "Beginner", 2: "Beginner+", 3: "Intermediate", 4: "Intermediate+", 5: "Advanced", 6: "Advanced+", 7: "Expert" },
    },
    demo: {
      title: "Learn characters like the Chinese do",
      subtitle: "Other apps just show the meaning. HSKGo makes you write each character — exactly the way Chinese students learn in school.",
      points: [
        "Stroke animation for every character",
        "Automatic pinyin with tone marks",
        "Finger-tracing practice on touchscreens",
        "Spaced repetition — never forget a character",
      ],
    },
    hanzi: { label: "Stroke order", replay: "Replay", next: "Next",
      meanings: { "你": "you", "好": "good", "学": "study", "中": "middle / China", "国": "country", "爱": "love" } },
    pricing: {
      title: "Simple, transparent pricing",
      subtitle: "Cancel anytime. Pay with Click, Payme or any card.",
      mostPopular: "Most popular", forever: "forever", perMonth: "per month",
      plans: {
        free:    { name: "Free", description: "No credit card — start today.", cta: "Get started",
          features: ["HSK 1 & HSK 2 fully unlocked", "10 daily practice items", "Character writer", "Basic vocabulary cards"] },
        pro:     { name: "Pro", description: "Everything you need to pass HSK 1–6.", cta: "7-day free trial",
          features: ["All HSK levels (1–9)", "Unlimited grading", "Pronunciation feedback", "Essay scoring", "Full mock exams", "Points, streaks and leaderboard"] },
        premium: { name: "Premium", description: "Pro + live tutor and certificate.", cta: "Contact us",
          features: ["Everything in Pro", "Weekly live tutor sessions", "Personalised study plan", "Mock exam certificate", "Priority support"] },
      },
    },
    cta: { title: "Your first character is one tap away.",
      subtitle: "Join thousands of learners starting their Mandarin journey. Free — only pay when you're ready for the exam.",
      button: "Start free" },
    footer: { tagline: "The fastest way to prep for HSK — with daily practice.",
      product: "Product", about: "Company", app: "Get the app",
      appText: "iOS and Android — coming soon. The web app works on any device.",
      privacy: "Privacy", terms: "Terms", contact: "Contact",
      rights: "All rights reserved." },
    auth: {
      login: { title: "Welcome back", subtitle: "Sign in to continue your studies.",
        email: "Email", password: "Password", submit: "Sign in", or: "or",
        google: "Continue with Google", noAccount: "No account yet?", register: "Create one",
        forgot: "Forgot password?" },
      register: { title: "Start learning Mandarin", subtitle: "Free, forever. No credit card required.",
        name: "Name", email: "Email", password: "Password", passwordHint: "At least 8 characters",
        submit: "Create free account", haveAccount: "Already have an account?", login: "Sign in",
        termsPrefix: "By signing up you agree to our", terms: "Terms", and: "and" },
      forgot: { title: "Reset password", subtitle: "Enter your email and we'll send you a reset link.",
        email: "Email", submit: "Send link",
        sent: "We sent a reset link to your email. Click it to set a new password.",
        backToLogin: "Back to sign in" },
      reset: { title: "New password", subtitle: "Set a new password for your account.",
        password: "New password", passwordHint: "At least 8 characters", submit: "Save password",
        success: "Password updated. Redirecting…" },
      errors: {
        missing_fields: "Enter your email and password.",
        weak_password: "Password must be at least 8 characters.",
        email_taken: "This email is already registered.",
        invalid_credentials: "Incorrect email or password.",
        generic: "Something went wrong. Please try again.",
      },
      confirmEmail: "We sent a confirmation link to your email. Click it to continue.",
    },
    legal: {
      backHome: "Back to home",
      updated: "Last updated: May 26, 2026",
      terms: {
        title: "Terms of Use",
        body: [
          "HSKGo is an educational app for learning Chinese (HSK). By using it, you agree to these terms.",
          "You are responsible for the security of your account and password. Use the app for lawful, personal study purposes.",
          "The service is provided \"as is\". This is an evolving project, so features may change.",
        ],
      },
      privacy: {
        title: "Privacy Policy",
        body: [
          "When you sign up we store only your name and email address — to create your account and let you sign in.",
          "Authentication is handled by Supabase. Your learning progress is currently stored in your browser (localStorage).",
          "We do not sell your data to third parties. If you'd like your account deleted, contact us.",
        ],
      },
    },
    app: {
      sidebar: {
        dashboard: "Home", characters: "Characters", vocabulary: "Vocabulary",
        listening: "Listening", reading: "Reading", writing: "Writing",
        speaking: "Speaking", exam: "Mock exam",
        logout: "Sign out", back: "Back",
      },
      dashboard: {
        hello: "Hi", goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening",
        xp: "Points", streakDays: "Day streak",
        charactersLearned: "Characters learned", vocabLearned: "Words learned",
        continueLearning: "Continue learning",
        dailyMission: "Daily mission",
        dailyMissionDesc: "Review 10 words or 5 characters.",
        levelProgress: "HSK 1 progress",
        modules: "Modules",
        resetData: "Reset progress",
        resetConfirm: "Delete all your progress?",
      },
      characters: {
        title: "Characters", subtitle: "Tap a character to practice writing it.",
        learned: "Learned", tracePractice: "Trace practice",
        showAnimation: "Show animation", reset: "Reset",
        markLearned: "Mark learned", next: "Next character",
        pickToStart: "Pick a character to start.",
        alreadyLearned: "✓ Learned",
      },
      vocab: {
        title: "Vocabulary cards", subtitle: "Review the cards that are due today.",
        due: "Due today", noDue: "No cards to review today. Nice work!",
        startReview: "Start",
        showAnswer: "Show answer",
        again: "Again", hard: "Hard", good: "Good", easy: "Easy",
        sessionDone: "All done!",
        reviewed: "cards reviewed",
      },
      listening: {
        title: "Listening", play: "Play", slow: "Slow",
        chooseTranslation: "Choose the translation:",
        correct: "Correct!", wrong: "Wrong", next: "Next",
        finish: "Finish", score: "Score",
        ttsUnsupported: "Your browser does not support speech.",
      },
      reading: {
        title: "Reading", comprehension: "Comprehension",
        viewTranslation: "View translation", hideTranslation: "Hide",
        correct: "Correct!", wrong: "Wrong",
        finish: "Finish", nextPassage: "Next passage",
      },
      writing: {
        title: "Writing", prompt: "Type the pinyin reading of this character:",
        placeholder: "pinyin (e.g. ni hao)",
        submit: "Check", correct: "Correct!", wrong: "Wrong",
        answerWas: "Correct answer:", next: "Next", finish: "Finish",
      },
      speaking: {
        title: "Speaking", prompt: "Read this sentence aloud:",
        start: "Start recording", stop: "Stop",
        playback: "Play back", recordAgain: "Record again",
        markDone: "Done",
        micDenied: "Microphone permission denied.",
        unsupported: "Your browser does not support recording.",
        recording: "Recording...",
      },
      exam: {
        title: "Mock exam", intro: "10 random questions. Ready?",
        start: "Start", question: "Question", of: "of", finish: "Finish",
        finalScore: "Your score:", retry: "Try again",
        backToDashboard: "Back to home",
      },
      levelFilter: { label: "Level:", all: "All" },
      common: { back: "Back", next: "Next", finish: "Finish", continue: "Continue", points: "points" },
    },
  },
};

export type AppDict = typeof dictionaries.uz;
