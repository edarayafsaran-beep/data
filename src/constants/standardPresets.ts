export interface StandardProcedure {
  id: string;
  category: 'فیلەر' | 'بۆتۆکس' | 'لەیزەر' | 'پێست و پاککردنەوە' | 'پلازما و مزۆتێراپی' | 'تەل و نەشتەرگەری بچووک';
  name: string;
  nameEn: string;
  suggestedPrice: number;
  durationMinutes: number;
  description: string;
}

export interface StandardInventoryPreset {
  id: string;
  category: 'فیلەر و بۆتۆکس' | 'کەرەستەی لەیزەر' | 'سیرۆم و سکین کێر' | 'مەوادی یەکجار بەکارهاتوو';
  itemName: string;
  unit: 'دانە' | 'پاکەت' | 'لیتر' | 'کیلۆ';
  supplierName: string;
  unitCost: number;
  minStockAlert: number;
  usageMonthlyForecast: number;
  shelfLifeMonths: number;
  description: string;
}

export interface StandardExpensePreset {
  id: string;
  category: 'کەلوپەلی پزیشکی' | 'کرێ و ئاو و بڕق' | 'سیانە و ئامێرەکان' | 'مەسروفاتی ڕۆژانە' | 'تەندروستی و پاککردنەوە' | 'مارکێتینگ و ڕێکلام';
  title: string;
  suggestedAmount: number;
  description: string;
}

export interface StandardPrescriptionPreset {
  id: string;
  category: 'دژە خۆر و پارێزەری پێست' | 'دژە هەوکردن و هێورکەرەوە' | 'سیرۆم و شێدارکەرەوە' | 'ئازارشکێن و دژە مۆربوون';
  medName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface StandardPackagePreset {
  id: string;
  name: string;
  procedures: string[];
  totalSessions: number;
  originalPrice: number;
  discountedPrice: number;
  description: string;
}

export const STANDARD_PROCEDURE_CATEGORIES = [
  'فیلەر',
  'بۆتۆکس',
  'لەیزەر',
  'پێست و پاککردنەوە',
  'پلازما و مزۆتێراپی',
  'تەل و نەشتەرگەری بچووک',
] as const;

export const STANDARD_AESTHETIC_PROCEDURES: StandardProcedure[] = [
  // فیلەر
  {
    id: 'filler-lip',
    category: 'فیلەر',
    name: 'فیلەری لێو (Lip Filler / Russian Lips)',
    nameEn: 'Lip Filler',
    suggestedPrice: 150000,
    durationMinutes: 30,
    description: 'شێوەدان و قەبارەدان بە لێو بە فیلەری هیالۆرۆنیک',
  },
  {
    id: 'filler-chin',
    category: 'فیلەر',
    name: 'فیلەری چەناکە و شەویلگە (Jawline & Chin)',
    nameEn: 'Jawline & Chin Filler',
    suggestedPrice: 180000,
    durationMinutes: 40,
    description: 'تەحیدکردنی هێڵی شەویلگە و پڕکردنەوەی چەناکە',
  },
  {
    id: 'filler-cheek',
    category: 'فیلەر',
    name: 'فیلەری گونه و دەموچاو (Cheek Filler)',
    nameEn: 'Cheek Filler',
    suggestedPrice: 170000,
    durationMinutes: 30,
    description: 'بەرزکردنەوە و گەشاوەکردنی گونه',
  },
  {
    id: 'filler-undereye',
    category: 'فیلەر',
    name: 'فیلەری ژێر چاو (Under-Eye Tear Trough)',
    nameEn: 'Under Eye Filler',
    suggestedPrice: 200000,
    durationMinutes: 35,
    description: 'پڕکردنەوەی قووڵی و ڕەشی ژێر چاو',
  },
  {
    id: 'filler-smile',
    category: 'فیلەر',
    name: 'فیلەری هێڵی پێکەنین (Nasolabial Folds)',
    nameEn: 'Nasolabial Folds Filler',
    suggestedPrice: 150000,
    durationMinutes: 30,
    description: 'ڕاستکردنەوە و پرکردنەوەی خەتی پێکەنین',
  },
  {
    id: 'filler-dissolve',
    category: 'فیلەر',
    name: 'ئەنزیمی توانەوەی فیلەر (Hyaluronidase Dissolving)',
    nameEn: 'Filler Dissolving',
    suggestedPrice: 75000,
    durationMinutes: 20,
    description: 'تواندنەوەی فیلەری پێشوو یان نەگونجاو',
  },

  // بۆتۆکس
  {
    id: 'botox-forehead',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی تەوێڵ و ناوچەوان (Forehead & Frown Lines)',
    nameEn: 'Forehead Botox',
    suggestedPrice: 120000,
    durationMinutes: 20,
    description: 'نەهێشتنی چرچیەکانی ناوچەوان و نێوان برۆکان',
  },
  {
    id: 'botox-crowfeet',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی دەوری چاو (Crow\'s Feet)',
    nameEn: 'Crow\'s Feet Botox',
    suggestedPrice: 85000,
    durationMinutes: 15,
    description: 'لابردنی هێڵ و چرچی کاتی پێکەنین لە دەوری چاو',
  },
  {
    id: 'botox-fullface',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی تەواوی دەموچاو (Full Face Botox)',
    nameEn: 'Full Face Botox',
    suggestedPrice: 180000,
    durationMinutes: 30,
    description: 'پاکێجی گشتی بۆتۆکس بۆ تەواوی هێڵەکانی دەموچاو',
  },
  {
    id: 'botox-browlift',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی بەرزکردنەوەی برۆ (Brow Lift)',
    nameEn: 'Botox Brow Lift',
    suggestedPrice: 70000,
    durationMinutes: 15,
    description: 'بەرزکردنەوەی سروشتیی سەرەبرۆکان بەبێ نەشتەرگەری',
  },
  {
    id: 'botox-masseter',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی ماسینکاری و شەویلگە (Masseter Slimming)',
    nameEn: 'Masseter Botox',
    suggestedPrice: 160000,
    durationMinutes: 25,
    description: 'باریککردنەوەی دەموچاو و چارەسەری کرۆشتنی ددان',
  },
  {
    id: 'botox-hyperhidrosis',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی دژە ئارەقکردنەوە (Underarm Sweating)',
    nameEn: 'Hyperhidrosis Botox',
    suggestedPrice: 220000,
    durationMinutes: 30,
    description: 'ڕاگرتنی ئارەقکردنەوەی زۆر لە بن باڵ یان دەست',
  },
  {
    id: 'botox-gummy',
    category: 'بۆتۆکس',
    name: 'بۆتۆکسی خەندەی پووک (Gummy Smile)',
    nameEn: 'Gummy Smile Botox',
    suggestedPrice: 60000,
    durationMinutes: 15,
    description: 'داپۆشینی پووک لە کاتی پێکەنیندا',
  },

  // لەیزەر
  {
    id: 'laser-fullbody',
    category: 'لەیزەر',
    name: 'لەیزەری تەواوی جەستە (Full Body Laser Hair Removal)',
    nameEn: 'Full Body Laser',
    suggestedPrice: 120000,
    durationMinutes: 60,
    description: 'لابردنی مووی هەموو جەستە بە ئامێری ئەلێکساندریت و دایۆد',
  },
  {
    id: 'laser-face',
    category: 'لەیزەر',
    name: 'لەیزەری دەموچاو و مل (Full Face & Neck Laser)',
    nameEn: 'Face Laser',
    suggestedPrice: 30000,
    durationMinutes: 20,
    description: 'پاککردنەوەی مووی زیادەی دەموچاو و ژێرچەناکە',
  },
  {
    id: 'laser-arms-legs',
    category: 'لەیزەر',
    name: 'لەیزەری دەست و قاچ (Full Arms & Legs)',
    nameEn: 'Arms & Legs Laser',
    suggestedPrice: 75000,
    durationMinutes: 45,
    description: 'لەیزەری قۆڵ، دەست، ڕان و قاچ',
  },
  {
    id: 'laser-bikini-underarm',
    category: 'لەیزەر',
    name: 'لەیزەری بیکینی و بن باڵ (Bikini & Underarm Laser)',
    nameEn: 'Bikini & Underarm',
    suggestedPrice: 45000,
    durationMinutes: 25,
    description: 'لەیزەری تایبەتی ناوچەی هەستیار و بن باڵ',
  },
  {
    id: 'laser-beard-contour',
    category: 'لەیزەر',
    name: 'تەحیدکردنی ڕیش و گەردنی پیاوان (Beard Line Laser)',
    nameEn: 'Beard Contour',
    suggestedPrice: 25000,
    durationMinutes: 15,
    description: 'دیاریکردنی هێڵی ڕیش و پاککردنەوەی مل بۆ پیاوان',
  },

  // پێست و پاککردنەوە
  {
    id: 'skin-hydrafacial',
    category: 'پێست و پاککردنەوە',
    name: 'هایدرۆفەیشیڵی قووڵ (Deep Hydrafacial & Glow)',
    nameEn: 'Deep Hydrafacial',
    suggestedPrice: 60000,
    durationMinutes: 45,
    description: 'پاککردنەوەی قووڵی پێست، لابردنی زیوان و شێدارکردنی چڕ',
  },
  {
    id: 'skin-carbonpeel',
    category: 'پێست و پاککردنەوە',
    name: 'تەقشیری کاربۆنی هۆلیوود (Hollywood Carbon Laser Peel)',
    nameEn: 'Carbon Laser Peel',
    suggestedPrice: 65000,
    durationMinutes: 30,
    description: 'بچووککردنەوەی کونیلەکان و ڕووناککردنەوەی پێست بە کاربۆن',
  },
  {
    id: 'skin-dermapen',
    category: 'پێست و پاککردنەوە',
    name: 'مایکرۆنیدڵینگ و دەرمابێن (Dermapen Microneedling)',
    nameEn: 'Dermapen Microneedling',
    suggestedPrice: 70000,
    durationMinutes: 40,
    description: 'چارەسەری شوێنەوار، چاڵ و هاندانی دروستبوونی کۆلاجین',
  },
  {
    id: 'skin-chemicalpeel',
    category: 'پێست و پاککردنەوە',
    name: 'تەقشیری کیمیایی و ترشەڵۆک (Chemical Peeling TCA/AHA)',
    nameEn: 'Chemical Peel',
    suggestedPrice: 55000,
    durationMinutes: 30,
    description: 'لابردنی پەڵە، زیوان و پێستی مردوو',
  },
  {
    id: 'skin-goldmask',
    category: 'پێست و پاککردنەوە',
    name: 'فەیشیڵی شاهانەی ئاڵتوونی 24K (Royal 24K Gold Facial)',
    nameEn: '24K Gold Facial',
    suggestedPrice: 85000,
    durationMinutes: 50,
    description: 'درەوشاوەیی و پاراستنی پێست بە پەڕەی ئاڵتوونی',
  },

  // پلازما و مزۆتێراپی
  {
    id: 'prp-hair',
    category: 'پلازما و مزۆتێراپی',
    name: 'پلازمای قژ (PRP Hair Regeneration)',
    nameEn: 'PRP Hair',
    suggestedPrice: 75000,
    durationMinutes: 35,
    description: 'بەرهەمهێنانی پلازمای دەوڵەمەند بە پەڕەکانی خوێن بۆ سەر',
  },
  {
    id: 'prp-face',
    category: 'پلازما و مزۆتێراپی',
    name: 'پلازمای دەموچاو (PRP Vampire Facial)',
    nameEn: 'PRP Face',
    suggestedPrice: 75000,
    durationMinutes: 35,
    description: 'نوێکردنەوەی خانەکانی پێست بە پلازمای سروشتی',
  },
  {
    id: 'profhilo',
    category: 'پلازما و مزۆتێراپی',
    name: 'پڕۆفایلۆ و سکن بووستەر (Profhilo Skin Booster)',
    nameEn: 'Profhilo Booster',
    suggestedPrice: 220000,
    durationMinutes: 20,
    description: 'شێدارکردنی قووڵ و گەنجکردنەوەی پێستی دەموچاو و مل',
  },
  {
    id: 'lipolysis',
    category: 'پلازما و مزۆتێراپی',
    name: 'دەرزی توانەوەی چەوری ژێرچەناکە (Double Chin Lipolysis)',
    nameEn: 'Fat Dissolving Injections',
    suggestedPrice: 90000,
    durationMinutes: 25,
    description: 'تاواندنەوەی چەوری ژێر چەناکە (غەبغەب)',
  },

  // تەل و نەشتەرگەری بچووک
  {
    id: 'threads-face',
    category: 'تەل و نەشتەرگەری بچووک',
    name: 'تەلی ڕاکێشانی دەموچاو (Face & Fox Eye Threads)',
    nameEn: 'Thread Lift',
    suggestedPrice: 350000,
    durationMinutes: 50,
    description: 'ڕاکێشان و گەنجکردنەوەی دەموچاو و چاو بە تەلی پزیشکی',
  },
  {
    id: 'mole-removal',
    category: 'تەل و نەشتەرگەری بچووک',
    name: 'لابردنی خاڵ و زیوان بە لەیزەر (Laser Mole & Skin Tag Removal)',
    nameEn: 'Mole Removal',
    suggestedPrice: 35000,
    durationMinutes: 20,
    description: 'لابردنی پاکژ و بێ ئازاری خاڵ بە لەیزەری CO2',
  },
];

export const STANDARD_INVENTORY_CATEGORIES = [
  'فیلەر و بۆتۆکس',
  'کەرەستەی لەیزەر',
  'سیرۆم و سکین کێر',
  'مەوادی یەکجار بەکارهاتوو',
] as const;

export const STANDARD_INVENTORY_PRESETS: StandardInventoryPreset[] = [
  // فیلەر و بۆتۆکس
  {
    id: 'inv-juvederm-voluma',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'فیلەری Juvederm Voluma 1ml (Allergan USA)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای ئەلێسار پزیشکی',
    unitCost: 110000,
    minStockAlert: 5,
    usageMonthlyForecast: 20,
    shelfLifeMonths: 24,
    description: 'فیلەری هیالۆرۆنیکی قورس بۆ چەناکە و گونه',
  },
  {
    id: 'inv-juvederm-ultra',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'فیلەری Juvederm Ultra 3/4 1ml (Allergan)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای ئەلێسار پزیشکی',
    unitCost: 100000,
    minStockAlert: 5,
    usageMonthlyForecast: 25,
    shelfLifeMonths: 24,
    description: 'فیلەری لێو و هێڵی پێکەنین',
  },
  {
    id: 'inv-restylane-kysse',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'فیلەری Restylane Kysse 1ml (Galderma)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 95000,
    minStockAlert: 4,
    usageMonthlyForecast: 15,
    shelfLifeMonths: 24,
    description: 'فیلەری نەرم و تایبەت بە لێو',
  },
  {
    id: 'inv-neuramis-deep',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'فیلەری Neuramis Deep with Lidocaine 1ml (Medytox Korea)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای هێلین بیووتی',
    unitCost: 45000,
    minStockAlert: 10,
    usageMonthlyForecast: 40,
    shelfLifeMonths: 24,
    description: 'فیلەری باوی کۆری بۆ هەموو ناوچەکان',
  },
  {
    id: 'inv-botox-allergan',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'بۆتۆکسی Botox Allergan 100 Unit (USA/Ireland)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای ئەلێسار پزیشکی',
    unitCost: 130000,
    minStockAlert: 6,
    usageMonthlyForecast: 25,
    shelfLifeMonths: 36,
    description: 'دەرزی بۆتۆکسی ئەسڵی ئەلێڕگان',
  },
  {
    id: 'inv-dysport-500',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'بۆتۆکسی Dysport 500 Unit (Ipsen UK)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 140000,
    minStockAlert: 4,
    usageMonthlyForecast: 18,
    shelfLifeMonths: 24,
    description: 'دیسپۆرتی بەریتانی بۆ نەهێشتنی چرچی',
  },
  {
    id: 'inv-profhilo',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'دەرزی سکن بووستەری Profhilo 2ml (IBSA Italy)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای ئیتاڵی مێد',
    unitCost: 135000,
    minStockAlert: 4,
    usageMonthlyForecast: 15,
    shelfLifeMonths: 24,
    description: 'سکن بووستەری هیالۆرۆنیکی پاکی ئیتاڵی',
  },
  {
    id: 'inv-hyaluronidase',
    category: 'فیلەر و بۆتۆکس',
    itemName: 'ئەنزیمی توانەوەی فیلەر Hyaluronidase 1500 IU (Liporase)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 20000,
    minStockAlert: 3,
    usageMonthlyForecast: 8,
    shelfLifeMonths: 24,
    description: 'بۆ هەڵوەشاندنەوە و توانەوەی فیلەر',
  },

  // کەرەستەی لەیزەر
  {
    id: 'inv-laser-gel',
    category: 'کەرەستەی لەیزەر',
    itemName: 'جێڵی ساردکەرەوەی لەیزەر (Laser Ultrasound Cooling Gel 5L)',
    unit: 'لیتر',
    supplierName: 'کۆمپانیای لەیزەر فۆکەس',
    unitCost: 15000,
    minStockAlert: 10,
    usageMonthlyForecast: 50,
    shelfLifeMonths: 36,
    description: 'دەبەی گەورەی ٥ لیتری جێڵی لەیزەر',
  },
  {
    id: 'inv-razor-box',
    category: 'کەرەستەی لەیزەر',
    itemName: 'تیغ و مووسی یەکجار بەکارهاتووی لەیزەر (Medical Razors Box 100pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای ئاراس مێد',
    unitCost: 12000,
    minStockAlert: 8,
    usageMonthlyForecast: 30,
    shelfLifeMonths: 60,
    description: 'پاکەتی ١٠٠ دانەیی مووسی نەشتەرگەری و لەیزەر',
  },
  {
    id: 'inv-laser-goggles',
    category: 'کەرەستەی لەیزەر',
    itemName: 'چاویلکەی پارێزەری چاو بۆ لەیزەر (Laser Safety Eyewear)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای لەیزەر فۆکەس',
    unitCost: 35000,
    minStockAlert: 3,
    usageMonthlyForecast: 2,
    shelfLifeMonths: 60,
    description: 'چاویلکەی پارێزەر بۆ چارەخواز و کارمەند',
  },
  {
    id: 'inv-wooden-spatula',
    category: 'کەرەستەی لەیزەر',
    itemName: 'سپاتیۆلای تەختەیی پزیشکی (Wooden Spatulas Box 100pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای کەرەستەی پزیشکی',
    unitCost: 5000,
    minStockAlert: 15,
    usageMonthlyForecast: 40,
    shelfLifeMonths: 60,
    description: 'تەختەی دانانی جێڵ لەسەر جەستە',
  },
  {
    id: 'inv-distilled-water',
    category: 'کەرەستەی لەیزەر',
    itemName: 'ئاوی مقەطەری ساردکەرەوەی ئامێر (Distilled Laser Water 5L)',
    unit: 'لیتر',
    supplierName: 'کۆمپانیای لەیزەر فۆکەس',
    unitCost: 8000,
    minStockAlert: 5,
    usageMonthlyForecast: 15,
    shelfLifeMonths: 36,
    description: 'بۆ پڕکردنەوەی تانکی ساردکەرەوەی ئامێری لەیزەر',
  },

  // سیرۆم و سکین کێر
  {
    id: 'inv-hydra-solutions',
    category: 'سیرۆم و سکین کێر',
    itemName: 'محلوول و سیرۆمی هایدرۆفەیشیڵ AS1 + SA2 + AO3 (Set of 3x500ml)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای بیووتی لۆجیکس',
    unitCost: 45000,
    minStockAlert: 4,
    usageMonthlyForecast: 12,
    shelfLifeMonths: 24,
    description: 'سێتی سێ محلوولی هایدرۆفەیشیڵ بۆ پاککردنەوە و ترشەکان',
  },
  {
    id: 'inv-filorga-nctf',
    category: 'سیرۆم و سکین کێر',
    itemName: 'کۆکتێلی مزۆتێراپی Filorga NCTF 135 HA (5 Vials Box)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 90000,
    minStockAlert: 3,
    usageMonthlyForecast: 10,
    shelfLifeMonths: 24,
    description: 'کۆکتێلی ٥٥ ماددەی زیندوو و ڤیتامین بۆ ڕوخسار',
  },
  {
    id: 'inv-toskani-hair',
    category: 'سیرۆم و سکین کێر',
    itemName: 'کۆکتێلی مزۆتێراپی قژ Toskani Hair Cocktail (5x5ml)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای مێدیکال دیپۆ',
    unitCost: 75000,
    minStockAlert: 4,
    usageMonthlyForecast: 15,
    shelfLifeMonths: 24,
    description: 'دەرزی خۆراکپێدەری ڕەگی قژ و دژە هەڵوەرین',
  },
  {
    id: 'inv-prp-tubes',
    category: 'سیرۆم و سکین کێر',
    itemName: 'تیوبی پلازمای جێڵدار PRP Gel Centrifuge Tubes (Box 50pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای ڤیکتۆریا مێد',
    unitCost: 65000,
    minStockAlert: 4,
    usageMonthlyForecast: 12,
    shelfLifeMonths: 36,
    description: 'تیوبی پاکژکراوی سێنتریفیوژ بۆ ڕاکێشانی پلازما',
  },
  {
    id: 'inv-dermapen-cartridges',
    category: 'سیرۆم و سکین کێر',
    itemName: 'کارتجی دەرزی مایکرۆنیدڵینگ Dermapen 12/36 Pin (Box 50pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای بیووتی لۆجیکس',
    unitCost: 35000,
    minStockAlert: 5,
    usageMonthlyForecast: 20,
    shelfLifeMonths: 48,
    description: 'سەری دەرزی یەکجار بەکارهاتووی ئامێری دەرمابێن',
  },
  {
    id: 'inv-collagen-mask',
    category: 'سیرۆم و سکین کێر',
    itemName: 'ماسکی کۆلاجین و ئارامکەرەوە پاش لەیزەر (Collagen Sheet Mask Box)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای کۆریا بیووتی',
    unitCost: 25000,
    minStockAlert: 8,
    usageMonthlyForecast: 30,
    shelfLifeMonths: 36,
    description: 'ماسکی ساردکەرەوە بۆ کەمکردنەوەی سووربوونەوە',
  },

  // مەوادی یەکجار بەکارهاتوو
  {
    id: 'inv-nitrile-gloves',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'دەستکێشی نایترۆلی پزیشکی بێ پۆدرە (Nitrile Medical Gloves Box 100pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای پاراستنی پزیشکی',
    unitCost: 10000,
    minStockAlert: 10,
    usageMonthlyForecast: 45,
    shelfLifeMonths: 60,
    description: 'دەستکێشی ڕەش / شین بۆ فیلەر و لەیزەر',
  },
  {
    id: 'inv-numbing-cream',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'کرێمی سڕکەری موضعی کەی کەی تابلێت (Lidocaine 10.56% J-Cain 500g)',
    unit: 'دانە',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 35000,
    minStockAlert: 3,
    usageMonthlyForecast: 10,
    shelfLifeMonths: 24,
    description: 'دەبەی سڕکەری خێرای پێست پێش دەرزی و لەیزەر',
  },
  {
    id: 'inv-cannula',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'کانۆلای فیلەری بێ سەر 25G / 27G Cannula (Box 20pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای ئەڵمانی پزیشکی',
    unitCost: 40000,
    minStockAlert: 4,
    usageMonthlyForecast: 15,
    shelfLifeMonths: 60,
    description: 'کانۆلای بێ ئازار بۆ لێدانی فیلەری گونه و ژێر چاو',
  },
  {
    id: 'inv-meso-needles',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'دەرزی وردی مزۆتێراپی 30G/32G 4mm Needles (Box 100pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای فارما كورد',
    unitCost: 20000,
    minStockAlert: 5,
    usageMonthlyForecast: 20,
    shelfLifeMonths: 60,
    description: 'دەرزی زۆر ورد بۆ بۆتۆکس و مزۆتێراپی',
  },
  {
    id: 'inv-bed-sheets',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'ڕۆڵی بەرگی قەرەوێڵەی پزیشکی (Disposable Medical Bed Roll 50m)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای کەرەستەی پزیشکی',
    unitCost: 14000,
    minStockAlert: 6,
    usageMonthlyForecast: 25,
    shelfLifeMonths: 60,
    description: 'کەڤەری یەکجار بەکارهاتووی قەرەوێڵەی نەخۆش',
  },
  {
    id: 'inv-sterile-gauze',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'شاش و لۆکەی پاکژکراو (Sterile Medical Gauze Box 100pcs)',
    unit: 'پاکەت',
    supplierName: 'کۆمپانیای ئاراس مێد',
    unitCost: 8000,
    minStockAlert: 10,
    usageMonthlyForecast: 30,
    shelfLifeMonths: 60,
    description: 'بۆ پاککردنەوە و سڕینی خوێن و جێڵ',
  },
  {
    id: 'inv-alcohol-spray',
    category: 'مەوادی یەکجار بەکارهاتوو',
    itemName: 'کهولی پاککەرەوەی پێست Medical Alcohol 70% Spray 1L',
    unit: 'لیتر',
    supplierName: 'کۆمپانیای ئاراس مێد',
    unitCost: 6000,
    minStockAlert: 6,
    usageMonthlyForecast: 20,
    shelfLifeMonths: 36,
    description: 'بۆ پاکژکردنی پێست پێش هەموو چارەسەرێک',
  },
];

export const STANDARD_EXPENSE_CATEGORIES = [
  'کەلوپەلی پزیشکی',
  'کرێ و ئاو و بڕق',
  'سیانە و ئامێرەکان',
  'مارکێتینگ و ڕێکلام',
  'تەندروستی و پاککردنەوە',
  'مەسروفاتی ڕۆژانە',
] as const;

export const STANDARD_EXPENSE_PRESETS: StandardExpensePreset[] = [
  // کرێ و ئاو و بڕق
  {
    id: 'exp-rent',
    category: 'کرێ و ئاو و بڕق',
    title: 'کرێی مانگانەی بینای سەنتەر',
    suggestedAmount: 1800000,
    description: 'کرێی جێگیری مانگانە بەپێی گرێبەست',
  },
  {
    id: 'exp-generator',
    category: 'کرێ و ئاو و بڕق',
    title: 'پارەی مۆلیدەی ئەهلی و گاز',
    suggestedAmount: 350000,
    description: 'تێچووی مانگانەی کارەبای مۆلیدە بۆ ئامێرەکانی لەیزەر',
  },
  {
    id: 'exp-electricity',
    category: 'کرێ و ئاو و بڕق',
    title: 'پسووڵەی کارەبای نیشتمانی و ئاو',
    suggestedAmount: 150000,
    description: 'پارەی فەرمی کارەبا و ئاوی سەنتەر',
  },
  {
    id: 'exp-internet',
    category: 'کرێ و ئاو و بڕق',
    title: 'ئینتەرنێتی فایبەر و هێڵەکانی پەیوەندی',
    suggestedAmount: 75000,
    description: 'خێرایی بەرز بۆ سیستەمی دیجیتاڵی و کامێراکان',
  },

  // کەلوپەلی پزیشکی
  {
    id: 'exp-fillers-buy',
    category: 'کەلوپەلی پزیشکی',
    title: 'کڕینی وەجبەی فیلەر و بۆتۆکس (Restylane / Juvederm / Dysport)',
    suggestedAmount: 1200000,
    description: 'پڕکردنەوەی عەمباری مەوادی دەرزی و جوانکاری',
  },
  {
    id: 'exp-laser-supplies',
    category: 'کەلوپەلی پزیشکی',
    title: 'کڕینی جێڵی لەیزەر، تیغ و چاویلکەی پارێزەر',
    suggestedAmount: 250000,
    description: 'کەرەستەی خاوی بەشی لەیزەری سەنتەر',
  },
  {
    id: 'exp-disposables',
    category: 'کەلوپەلی پزیشکی',
    title: 'کڕینی دەستکێش، کانۆلا، دەرزی مزۆتێراپی و ڕۆڵی قەرەوێڵە',
    suggestedAmount: 180000,
    description: 'مەوادی یەکجار بەکارهاتووی پزیشکی',
  },

  // مارکێتینگ و ڕێکلام
  {
    id: 'exp-meta-ads',
    category: 'مارکێتینگ و ڕێکلام',
    title: 'سپۆنسەر و ڕێکلامی ئینستاگرام و فەیسبووک (Meta Ads)',
    suggestedAmount: 400000,
    description: 'ڕاکێشانی چارەخوازی نوێ بۆ خزمەتگوزارییەکان',
  },
  {
    id: 'exp-tiktok-ads',
    category: 'مارکێتینگ و ڕێکلام',
    title: 'ڕێکلام و کامپەینی تیک تۆک (TikTok Ads)',
    suggestedAmount: 250000,
    description: 'ڤیدیۆی ڤایرۆڵ و ڕێکلامی فەیشیەڵ و لەیزەر',
  },
  {
    id: 'exp-design-print',
    category: 'مارکێتینگ و ڕێکلام',
    title: 'دیزاین، مۆنتاژ و چاپی برۆشوور و فلێکس',
    suggestedAmount: 120000,
    description: 'کەرەستەی چاپی ڕێکلامی ناوەندی سەنتەر',
  },

  // سیانە و ئامێرەکان
  {
    id: 'exp-laser-service',
    category: 'سیانە و ئامێرەکان',
    title: 'سێرڤس و پشکنینی دەورەیی ئامێرەکانی لەیزەر',
    suggestedAmount: 300000,
    description: 'کالیبرەیشن و گۆڕینی فلتەر و فلاش لیمپ',
  },
  {
    id: 'exp-ac-service',
    category: 'سیانە و ئامێرەکان',
    title: 'چاککردنەوە و گازی سپلێت و تەبریدی ژوورەکان',
    suggestedAmount: 100000,
    description: 'سیانەی فێنککەرەوەکان بۆ ئامێری لەیزەر',
  },

  // مەسروفاتی ڕۆژانە و پاککردنەوە
  {
    id: 'exp-hospitality',
    category: 'مەسروفاتی ڕۆژانە',
    title: 'چای، قاوە و میوانداری چارەخوازان لە پێشوازی',
    suggestedAmount: 60000,
    description: 'پێداویستیەکانی کافیتریای پێشوازی',
  },
  {
    id: 'exp-cleaning',
    category: 'تەندروستی و پاککردنەوە',
    title: 'کەرەستەی پاککەرەوە، کهول، دیتۆڵ و معقماتی ژوورەکان',
    suggestedAmount: 85000,
    description: 'ستەریڵ و پاکژکردنەوەی بەردەوامی کلینیک',
  },
];

export const STANDARD_PRESCRIPTION_CATEGORIES = [
  'دژە خۆر و پارێزەری پێست',
  'دژە هەوکردن و هێورکەرەوە',
  'سیرۆم و شێدارکەرەوە',
  'ئازارشکێن و دژە مۆربوون',
] as const;

export const STANDARD_PRESCRIPTION_PRESETS: StandardPrescriptionPreset[] = [
  // دژە خۆر و پارێزەری پێست
  {
    id: 'rx-sunscreen-spf50',
    category: 'دژە خۆر و پارێزەری پێست',
    medName: 'Sunscreen SPF 50+ Broad Spectrum Cream',
    dosage: 'بەشی پێویست',
    frequency: 'هەموو ۳ کاتژمێر جارێک لە کاتی دەرچوون',
    duration: '30 ڕۆژ',
    instructions: '۲۰ خولەک پێش چوونە بەر خۆر و دوای جلسەی لەیزەر',
  },
  {
    id: 'rx-mineral-sunscreen',
    category: 'دژە خۆر و پارێزەری پێست',
    medName: 'La Roche-Posay Anthelios Mineral Tinted SPF 50',
    dosage: '1 پەنجە',
    frequency: 'بەیانیان ڕۆژانە',
    duration: 'بەردەوام',
    instructions: 'تایبەت بە پێستی هەستیار و دوای تەقشیر',
  },

  // دژە هەوکردن و هێورکەرەوە
  {
    id: 'rx-fucidin',
    category: 'دژە هەوکردن و هێورکەرەوە',
    medName: 'Fucidin 2% Antibiotic Cream',
    dosage: 'چینێکی تەنک',
    frequency: '2 جار لە ڕۆژێکدا بۆ ۳ ڕۆژ',
    duration: '3 ڕۆژ',
    instructions: 'بۆ هێورکردنەوە و ڕێگری لە زیوان پاش لەیزەر و دەرزی',
  },
  {
    id: 'rx-mebo',
    category: 'دژە هەوکردن و هێورکەرەوە',
    medName: 'Mebo Herbal Ointment',
    dosage: 'چینێکی تەنک',
    frequency: '3 جار لە ڕۆژێکدا',
    duration: '5 ڕۆژ',
    instructions: 'بۆ چاکبوونەوەی خێرای سووربوونەوەی لەیزەری CO2',
  },
  {
    id: 'rx-panthenol',
    category: 'دژە هەوکردن و هێورکەرەوە',
    medName: 'Bepanthen / Panthenol 5% Soothing Cream',
    dosage: 'بڕی پێویست',
    frequency: '2 تا 3 جار ڕۆژانە',
    duration: '10 ڕۆژ',
    instructions: 'بۆ ئارامکردنەوە و شێدارکردنەوەی قووڵی پێست',
  },

  // سیرۆم و شێدارکەرەوە
  {
    id: 'rx-hyaluronic',
    category: 'سیرۆم و شێدارکەرەوە',
    medName: 'Hyaluronic Acid 2% + B5 Hydrating Serum',
    dosage: '3 تا 4 دڵۆپ',
    frequency: 'شەوانە پێش خەوتن',
    duration: 'بەردەوام',
    instructions: 'لە سەر پێستی کەمێک شێدار دابنرێت بۆ قووڵکردنەوەی شێداری',
  },
  {
    id: 'rx-vitaminc',
    category: 'سیرۆم و شێدارکەرەوە',
    medName: 'Vitamin C 20% Brightening Serum (Ascorbic Acid)',
    dosage: '4 دڵۆپ',
    frequency: 'بەیانیان پێش دژە خۆر',
    duration: '30 ڕۆژ',
    instructions: 'بۆ یەکدەستکردنی ڕەنگی پێست و نەهێشتنی پەڵە',
  },
  {
    id: 'rx-niacinamide',
    category: 'سیرۆم و شێدارکەرەوە',
    medName: 'Niacinamide 10% + Zinc 1% Pore Refining Serum',
    dosage: '3 دڵۆپ',
    frequency: '1 جار لە ڕۆژێکدا',
    duration: 'بەردەوام',
    instructions: 'بۆ کۆنترۆڵکردنی چەوری و تەسککردنەوەی کونیلەکان',
  },

  // ئازارشکێن و دژە مۆربوون
  {
    id: 'rx-paracetamol',
    category: 'ئازارشکێن و دژە مۆربوون',
    medName: 'Paracetamol 500mg Tablets',
    dosage: '1 حەب',
    frequency: 'هەموو ۸ کاتژمێر جارێک لە کاتی پێویست',
    duration: '2 ڕۆژ',
    instructions: 'بۆ کەمکردنەوەی ئازاری دوای دەرزی فیلەر یان بۆتۆکس',
  },
  {
    id: 'rx-reparil',
    category: 'ئازارشکێن و دژە مۆربوون',
    medName: 'Reparil-Gel N Anti-Bruising & Swelling',
    dosage: 'مەساجی نەرم',
    frequency: '3 جار لە ڕۆژێکدا',
    duration: '5 ڕۆژ',
    instructions: 'بۆ نەهێشتنی شینبوونەوە و هەڵئاوسانی دەوری چاو و لێو',
  },
  {
    id: 'rx-arnica',
    category: 'ئازارشکێن و دژە مۆربوون',
    medName: 'Arnica Montana Healing Gel',
    dosage: 'بڕی پێویست',
    frequency: '2 تا 3 جار لە ڕۆژێکدا',
    duration: '4 ڕۆژ',
    instructions: 'بۆ خێراکردنی نەمانی مۆربوونی ژێر پێست',
  },
];

export const STANDARD_PACKAGE_PRESETS: StandardPackagePreset[] = [
  {
    id: 'pkg-bridal',
    name: 'پاکێجی شاژنی بووکێن (VIP Royal Bridal Package)',
    procedures: ['لەیزەری تەواوی لەش', 'هایدرۆفەیشیڵی قووڵ', 'تەقشیری کاربۆنی هۆلیوود', 'فیلەری لێو'],
    totalSessions: 4,
    originalPrice: 395000,
    discountedPrice: 290000,
    description: 'تایبەت بە بووک پێش زەماوەند بۆ درەوشاوەیی و پێستێکی وەک ئاوریشم',
  },
  {
    id: 'pkg-laser-6',
    name: 'پاکێجی ٦ جلسەی لەیزەری تەواوی لەش (6x Full Body Laser)',
    procedures: ['لەیزەری تەواوی جەستە', 'لەیزەری دەموچاو و مل'],
    totalSessions: 6,
    originalPrice: 720000,
    discountedPrice: 540000,
    description: 'تەواوکردنی کۆرسی تەواوی لەیزەر بە داشکاندنی ٢٥٪',
  },
  {
    id: 'pkg-face-glow',
    name: 'پاکێجی گەنجکردنەوە و گەشاوەیی دەموچاو (Full Face Glow & Lift)',
    procedures: ['بۆتۆکسی تەواوی دەموچاو', 'فیلەری لێو', 'پڕۆفایلۆ و سکن بووستەر'],
    totalSessions: 2,
    originalPrice: 550000,
    discountedPrice: 420000,
    description: 'بۆتۆکس بۆ چرچی + فیلەر بۆ لێو + سکن بووستەر بۆ شێداری قووڵ',
  },
  {
    id: 'pkg-hair-restoration',
    name: 'پاکێجی چارەسەری قژ و دژە هەڵوەرین (Hair PRP & Meso Package)',
    procedures: ['پلازمای قژ', 'کۆکتێلی مزۆتێراپی Toskani'],
    totalSessions: 4,
    originalPrice: 300000,
    discountedPrice: 220000,
    description: '٤ جلسەی چڕی پلازما و مزۆتێراپی بۆ بەهێزکردنی ڕەگی قژ',
  },
];

export const WEEKDAYS = [
  'شەممە',
  'یەکشەممە',
  'دووشەممە',
  'سێشەممە',
  'چوارشەممە',
  'پێنجشەممە',
  'هەینی',
] as const;
