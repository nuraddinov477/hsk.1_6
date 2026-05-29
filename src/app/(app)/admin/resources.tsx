import { BookOpenText, Layers, FileText, GraduationCap, BookOpen } from "lucide-react";

// Django ModelAdmin-style registry. Each entry describes a content table from
// the operator's point of view: how to label it, which columns to show in the
// list view, which fields to render in the form, and how to extract a row's
// display string. Adding a new table is a matter of adding an entry here +
// matching toRow() in /api/admin/resource — no per-page UI needed.

export type FieldKind =
  | "text"        // plain string
  | "textarea"    // multi-line string
  | "number"      // integer
  | "select"      // pick one of options
  | "ml"          // { uz, ru, en } trio of strings
  | "markdown"    // multi-line markdown
  | "json"        // freeform JSON value (e.g. options[], choices[])
  | "tags"        // string[] entered comma-separated
  | "boolean"     // checkbox
  ;

export type FieldDef = {
  key: string;            // db column name (snake_case)
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string | number; label: string }[];
  // For 'ml': which langs to render. Default uz/ru/en.
  langs?: ("uz" | "ru" | "en")[];
};

export type ColumnDef = {
  key: string;
  label: string;
  // Renderer is given the whole row (we keep it loose so each resource can
  // pluck nested jsonb keys without TypeScript gymnastics).
  render?: (row: Record<string, unknown>) => React.ReactNode;
  width?: string;
};

export type Resource = {
  name: string;          // url slug + api type
  label: string;         // sidebar / header text
  group: string;         // sidebar group
  icon: React.ComponentType<{ className?: string }>;
  list: ColumnDef[];
  form: FieldDef[];
  // Show an HSK level filter on the list page.
  levelFilter: boolean;
  // Default sort column (must exist on the table; defaults to created_at).
  defaultSort?: string;
};

const ML_VALUE = (v: unknown): string => {
  if (!v || typeof v !== "object") return "—";
  const o = v as Record<string, string | undefined>;
  return o.uz || o.ru || o.en || "—";
};

const HSK_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `HSK ${n}` }));

export const RESOURCES: Resource[] = [
  {
    name: "lessons",
    label: "Darslar",
    group: "Kontent",
    icon: BookOpen,
    levelFilter: true,
    defaultSort: "hsk_level",
    list: [
      { key: "hsk_level", label: "HSK", width: "60px",
        render: (r) => `HSK ${r.hsk_level}` },
      { key: "lesson_no", label: "№", width: "50px" },
      { key: "title",     label: "Sarlavha", render: (r) => ML_VALUE(r.title) },
      { key: "vocab_words", label: "So'z",   width: "60px",
        render: (r) => (Array.isArray(r.vocab_words) ? r.vocab_words.length : 0) },
      { key: "est_minutes", label: "Daq.",   width: "60px" },
      { key: "published",   label: "Holat",  width: "80px",
        render: (r) => r.published ? "✓ ochiq" : "draft" },
    ],
    form: [
      { key: "hsk_level", label: "HSK darajasi", kind: "select", options: HSK_OPTIONS, required: true },
      { key: "lesson_no", label: "Dars raqami",  kind: "number",  required: true, placeholder: "1" },
      { key: "title",     label: "Sarlavha",     kind: "ml",      required: true },
      { key: "body",      label: "Matn (markdown)", kind: "markdown", required: true,
        help: "# / ## / **bold** / *italic* / lists qo'llab-quvvatlanadi" },
      { key: "vocab_words", label: "Bog'langan so'zlar", kind: "tags",
        placeholder: "你好, 再见", help: "Vergul bilan ajrating" },
      { key: "char_hanzis", label: "Bog'langan ierogliflar", kind: "tags",
        placeholder: "你, 好" },
      { key: "est_minutes", label: "Davomiyligi (daqiqa)", kind: "number" },
      { key: "audio_url",   label: "Audio URL", kind: "text", placeholder: "https://..." },
      { key: "published",   label: "Saytda ko'rinsin", kind: "boolean" },
    ],
  },
  {
    name: "vocabulary",
    label: "Lug'at",
    group: "Kontent",
    icon: BookOpenText,
    levelFilter: true,
    list: [
      { key: "word",   label: "So'z",   render: (r) => <span className="font-cn">{String(r.word ?? "")}</span> },
      { key: "pinyin", label: "Pinyin" },
      { key: "hsk_level", label: "HSK", width: "60px", render: (r) => `HSK ${r.hsk_level}` },
      { key: "meaning", label: "Ma'no", render: (r) => ML_VALUE(r.meaning) },
    ],
    form: [
      { key: "word",   label: "So'z (汉字)", kind: "text", required: true, placeholder: "经济" },
      { key: "pinyin", label: "Pinyin",      kind: "text", required: true, placeholder: "jīng jì" },
      { key: "hsk_level", label: "HSK darajasi", kind: "select", options: HSK_OPTIONS, required: true },
      { key: "meaning", label: "Ma'nosi",  kind: "ml", required: true },
      { key: "example_zh", label: "Misol (汉字)",  kind: "text", placeholder: "经济很好。" },
      { key: "example_pinyin", label: "Misol (pinyin)", kind: "text" },
      { key: "example", label: "Misol tarjimasi", kind: "ml" },
    ],
  },
  {
    name: "characters",
    label: "Ieroglif",
    group: "Kontent",
    icon: Layers,
    levelFilter: true,
    list: [
      { key: "hanzi",   label: "Ieroglif", render: (r) => <span className="font-cn text-lg">{String(r.hanzi ?? "")}</span> },
      { key: "pinyin",  label: "Pinyin" },
      { key: "hsk_level", label: "HSK", width: "60px", render: (r) => `HSK ${r.hsk_level}` },
      { key: "meaning", label: "Ma'no", render: (r) => ML_VALUE(r.meaning) },
    ],
    form: [
      { key: "hanzi",   label: "Ieroglif (汉字)", kind: "text", required: true, placeholder: "经" },
      { key: "pinyin",  label: "Pinyin", kind: "text", required: true, placeholder: "jīng" },
      { key: "hsk_level", label: "HSK darajasi", kind: "select", options: HSK_OPTIONS, required: true },
      { key: "meaning", label: "Ma'nosi", kind: "ml", required: true },
    ],
  },
  {
    name: "passages",
    label: "O'qish matni",
    group: "Kontent",
    icon: FileText,
    levelFilter: true,
    list: [
      { key: "title", label: "Sarlavha", render: (r) => ML_VALUE(r.title) },
      { key: "hsk_level", label: "HSK", width: "60px", render: (r) => `HSK ${r.hsk_level}` },
      { key: "text", label: "Matn", render: (r) => <span className="font-cn line-clamp-1">{String(r.text ?? "")}</span> },
    ],
    form: [
      { key: "hsk_level", label: "HSK darajasi", kind: "select", options: HSK_OPTIONS, required: true },
      { key: "title",       label: "Sarlavha", kind: "ml", required: true },
      { key: "text",        label: "Matn (汉字)", kind: "textarea", required: true },
      { key: "pinyin",      label: "Pinyin", kind: "textarea", required: true },
      { key: "translation", label: "Tarjima", kind: "ml" },
      { key: "question",    label: "Savol", kind: "ml", required: true },
      { key: "options",     label: "Variantlar (JSON)", kind: "json", required: true,
        help: '[{"label":{"uz":"…","ru":"…","en":"…"},"zh":"…","correct":true}, …]' },
    ],
  },
  {
    name: "exam_questions",
    label: "Imtihon savoli",
    group: "Kontent",
    icon: GraduationCap,
    levelFilter: true,
    list: [
      { key: "section", label: "Bo'lim", width: "100px",
        render: (r) => r.section === "listening" ? "🎧 Tinglash" : "📖 O'qish" },
      { key: "level",   label: "HSK",    width: "60px", render: (r) => `HSK ${r.level}` },
      { key: "prompt",  label: "Savol",  render: (r) => ML_VALUE(r.prompt) },
      { key: "term",    label: "Stimul", render: (r) =>
          (r.term as string) || (r.audio as string) || (r.passage as string) || "—" },
    ],
    form: [
      { key: "level", label: "HSK darajasi", kind: "select", options: HSK_OPTIONS, required: true },
      { key: "section", label: "Bo'lim", kind: "select", required: true,
        options: [{ value: "listening", label: "Tinglash" }, { value: "reading", label: "O'qish" }] },
      { key: "audio",   label: "Audio matni (xitoycha, TTS)", kind: "text", placeholder: "你好,老师" },
      { key: "term",    label: "So'z / ieroglif (o'qish uchun)", kind: "text" },
      { key: "term_pinyin", label: "So'z pinyin", kind: "text" },
      { key: "passage", label: "O'qish matni", kind: "textarea" },
      { key: "prompt",  label: "Savol matni", kind: "ml", required: true },
      { key: "choices", label: "Javoblar (JSON)", kind: "json", required: true,
        help: '[{"label":{"uz":"…","ru":"…","en":"…"},"correct":true}, …]' },
    ],
  },
];

export function findResource(name: string): Resource | null {
  return RESOURCES.find((r) => r.name === name) ?? null;
}
