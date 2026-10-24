// İçerik modeli: sitedeki tüm kişisel anlatım bu tiplerden geçer.
// Kurallar (bkz. docs/story-architecture.md §6) tiplerle olabildiğince zorlanır:
//  - Hedefler `tense: "goal"` taşır; arayüz bunları başarı gibi değil hedef olarak gösterir.
//  - Çalışmalar yalnızca açık izinle görünür (work.ts -> publicWork, fail-closed).

export type PillarId = "merak" | "uretim" | "sorumluluk";

export interface Pillar {
  id: PillarId;
  numeral: "I" | "II" | "III";
  title: string;
  /** Kullanıcının kendi tanımı; yeniden yazılmaz. */
  definition: string;
}

/** 3D sahnenin bir bölümde aldığı biçim. choreography.ts bu anahtarlarla çalışır. */
export type SceneKey =
  | "hero"
  | "act"
  | "discovery"
  | "beyond"
  | "creation"
  | "layers"
  | "inquiry"
  | "approach"
  | "vision"
  | "work"
  | "contact";

export type TraitId =
  | "interdisciplinary"
  | "holistic"
  | "inquiry"
  | "sharing"
  | "independent"
  | "values";

/** Altı kişisel özellik. Her biri ana sayfada bir bölüme ve Hakkımda'da bir bölüme bağlanır. */
export interface Trait {
  id: TraitId;
  title: string;
  pillar: PillarId;
  /** "present": bugün yaptığım/olduğum; "goal": gelecek hedefi (başarı gibi yazılmaz). */
  tense: "present" | "goal";
  homeSection: string; // home.ts bölüm id'si
  aboutSection: string; // about.ts bölüm id'si
}

export interface TextLink {
  label: string;
  href: string;
}

export interface Chapter {
  id: string;
  scene: SceneKey;
  pillar: PillarId;
  index: string; // "01"
  eyebrow: string;
  title: string;
  body: string[];
  /** İsteğe bağlı vurgu satırı (ör. hedef notu). */
  note?: string;
  link?: TextLink;
}

export interface Domain {
  id: string;
  label: string;
  /** Uzmanlık iddiası değil: alanı neden merak ettiğimi gösteren bir soru. */
  question: string;
  /** 3D'de bu alanı temsil eden katman (rengi o katmanın tonu). */
  layer: number;
}

export interface Value {
  id: string;
  label: string;
}

export interface WorkItem {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  /**
   * Yayın izni. Yalnızca "verified" (müşterinin açık yazılı izni) ve "own-demo"
   * (müşteriyle ilişkilendirilemeyen özgün demo) public olur. Varsayılan "unverified".
   */
  permission: "verified" | "own-demo" | "unverified";
  status: "draft" | "published";
}

export interface AboutSection {
  id: string;
  pillar: PillarId;
  title: string;
  paragraphs: string[];
  list?: string[];
  note?: string;
  link?: TextLink;
}
