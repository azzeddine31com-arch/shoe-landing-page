/**
 * Cinematic story map.
 *
 * Chapters reference source-clip indices (1..11); concrete time ranges are
 * computed at runtime from media-manifest.json so copy can never drift from
 * the encoded timeline. Each chapter may contain several text "beats" that
 * cross-fade inside the same window.
 *
 * Claims are limited to what the supplied footage visibly depicts
 * (reinforced toe, anti-puncture woven layer, tread/grip, cushioning).
 * No standards, certifications or injury-prevention guarantees are made.
 */
export const CHAPTERS = Object.freeze([
  {
    id: 'craft',
    kicker: 'الفصل 01 — صناعة محكمة',
    clips: [1],
    beats: [
      {
        headline: 'التفاصيل تصنع الفرق.',
        sub: 'قرص ربط سريع، خيوط إحكام، وخامات متحمّلة في حذاء واحد.',
        callout: 'قرص ربط سريع بدل الرباط التقليدي',
        calloutAt: 0.55,
      },
    ],
  },
  {
    id: 'toe',
    kicker: 'الفصل 02 — حماية المقدمة',
    clips: [2, 3],
    beats: [
      {
        headline: 'الصدمات الخطيرة تبدأ من هنا.',
        sub: 'مقدمة معزّزة تحمي أصابعك من الاصطدامات والأجسام الساقطة.',
        callout: 'غطاء واقٍ داخل المقدمة',
        calloutAt: 0.35,
      },
    ],
  },
  {
    id: 'puncture-grip',
    kicker: 'الفصل 03 — حماية من تحت',
    clips: [4, 5],
    beats: [
      {
        headline: 'امشي فوق المسامير بأمان.',
        sub: 'طبقة نسجية مقاومة للثقب تفعل قدمك عن الأجسام الحادة.',
        callout: 'طبقة مضادة للثقب داخل النعل',
        calloutAt: 0.25,
      },
      {
        headline: 'ثبات أكثر في ظروف العمل.',
        sub: 'نعل خارجي بنقشة تلامس عميقة على الأسطح الزلقة والمبللة.',
        callout: 'نقشة تلامس متعددة الاتجاهات',
        calloutAt: 0.72,
      },
    ],
  },
  {
    id: 'comfort',
    kicker: 'الفصل 04 — راحة طوال اليوم',
    clips: [6, 7],
    beats: [
      {
        headline: 'حماية وراحة في كل خطوة.',
        sub: 'بطانة ناعمة وطبقات توسيد تمتص الصدمات خلال ساعات الوقوف الطويلة.',
        callout: 'بطانة داخلة مريحة وطبقات توسيد',
        calloutAt: 0.45,
      },
    ],
  },
  {
    id: 'construction',
    kicker: 'الفصل 05 — جاهز للعمل',
    clips: [8, 9, 10, 11],
    beats: [
      {
        headline: 'كل جزء يخدم مع الآخر.',
        sub: 'من النعل الخارجي إلى الوجه العلوي، كل طبقة مبنية لمكان عملك.',
        callout: null,
        calloutAt: 0,
      },
      {
        headline: 'جاهز لمكان عملك.',
        sub: 'اختر لونك المفضّل واطلب حذاءك بخطوات بسيطة.',
        callout: null,
        calloutAt: 0.78,
      },
    ],
  },
]);

/** Hero (progress = 0) copy — fades out before chapter 1 appears. */
export const HERO_COPY = Object.freeze({
  headline: 'رجليك تخدم معاك. حافظ عليهم.',
  sub: 'صباط خدمة يجمع بين الحماية والراحة.',
  cta: 'اطلب صباطك الآن',
});
