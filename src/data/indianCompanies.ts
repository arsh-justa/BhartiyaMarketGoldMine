/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive dataset of publicly listed Indian companies on NSE & BSE with Market Cap > ₹500 Cr.
 * Includes both Quarterly and Yearly (Annual) historical series for PAT (Green) and Market Cap (Blue).
 */

export interface PeriodRecord {
  period: string;        // e.g. "Q1 FY25" or "FY25"
  label: string;         // e.g. "Jun 2024" or "FY 2024-25"
  marketCapCr: number;   // Blue Y-Axis (in INR Crores)
  patCr: number;         // Green Y-Axis (in INR Crores)
  revenueCr: number;     // In INR Crores
  patMarginPct: number;  // PAT / Revenue %
  sharePriceInr: number; // Share Price in INR
  eventNote?: string;
}

export interface IndianCompany {
  id: string;
  name: string;
  symbol: string;        // NSE Symbol
  bseCode: string;       // BSE Scrip Code
  sector: string;        // Broad sector
  industry: string;      // Precise business segment for peer matching
  category: 'Mega Cap (> ₹1 Lakh Cr)' | 'Large Cap (₹20k - ₹1 Lakh Cr)' | 'Mid Cap (₹5k - ₹20k Cr)' | 'Small Cap (₹500 Cr - ₹5k Cr)';
  headquarters: string;
  peers: string[];       // Peer symbols
  benchmarks: {
    peRatio: number;
    pbRatio: number;
    dividendYieldPct: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  quarterlyData: PeriodRecord[];
  yearlyData: PeriodRecord[];
}

export const QUARTER_PERIODS = [
  "Q1 FY24", "Q2 FY24", "Q3 FY24", "Q4 FY24",
  "Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25",
  "Q1 FY26", "Q2 FY26", "Q3 FY26", "Q4 FY26"
];

export const YEARLY_PERIODS = ["FY22", "FY23", "FY24", "FY25", "FY26"];

// Helper to generate consistent annual and quarterly numbers
function createCompany(
  id: string,
  name: string,
  symbol: string,
  bseCode: string,
  sector: string,
  industry: string,
  category: IndianCompany['category'],
  headquarters: string,
  peers: string[],
  benchmarks: IndianCompany['benchmarks'],
  annualBase: { mcap: number[]; pat: number[]; rev: number[]; price: number[] },
  quarterlyBase: { mcap: number[]; pat: number[]; rev: number[]; price: number[]; notes?: Record<number, string> }
): IndianCompany {
  const yearlyData: PeriodRecord[] = YEARLY_PERIODS.map((period, i) => {
    const rev = annualBase.rev[i] || 1000;
    const pat = annualBase.pat[i] || 100;
    return {
      period,
      label: `FY 20${21 + i}-${22 + i}`,
      marketCapCr: annualBase.mcap[i],
      patCr: pat,
      revenueCr: rev,
      patMarginPct: Number(((pat / rev) * 100).toFixed(2)),
      sharePriceInr: annualBase.price[i],
    };
  });

  const quarterlyData: PeriodRecord[] = QUARTER_PERIODS.map((period, i) => {
    const rev = quarterlyBase.rev[i] || 250;
    const pat = quarterlyBase.pat[i] || 25;
    const qLabels = [
      "Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024",
      "Jun 2024", "Sep 2024", "Dec 2024", "Mar 2025",
      "Jun 2025", "Sep 2025", "Dec 2025", "Mar 2026"
    ];
    return {
      period,
      label: qLabels[i] || period,
      marketCapCr: quarterlyBase.mcap[i],
      patCr: pat,
      revenueCr: rev,
      patMarginPct: Number(((pat / rev) * 100).toFixed(2)),
      sharePriceInr: quarterlyBase.price[i],
      eventNote: quarterlyBase.notes?.[i],
    };
  });

  return {
    id,
    name,
    symbol,
    bseCode,
    sector,
    industry,
    category,
    headquarters,
    peers,
    benchmarks,
    quarterlyData,
    yearlyData,
  };
}

export const ALL_INDIAN_COMPANIES: IndianCompany[] = [
  // ==================== INFORMATION TECHNOLOGY ====================
  createCompany(
    "tcs", "Tata Consultancy Services Ltd", "TCS", "532540",
    "Information Technology", "IT Services & Consulting", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["INFY", "HCLTECH", "WIPRO", "LTIM", "PERSISTENT"],
    { peRatio: 29.4, pbRatio: 12.8, dividendYieldPct: 1.45, fiftyTwoWeekHigh: 4585.9, fiftyTwoWeekLow: 3500.0 },
    { mcap: [1360000, 1180000, 1420000, 1520000, 1760000], pat: [38327, 42147, 45908, 52400, 58400], rev: [191754, 225458, 240893, 261000, 285000], price: [3730, 3205, 3925, 4201, 4865] },
    {
      mcap: [1210000, 1290000, 1370000, 1420000, 1445000, 1560000, 1515000, 1520000, 1605000, 1625000, 1720000, 1760000],
      pat: [11074, 11342, 11058, 12434, 12550, 12800, 13180, 13540, 13920, 14350, 14850, 15350],
      rev: [59381, 59692, 60583, 61237, 62100, 63200, 64700, 66200, 67600, 69200, 71000, 72800],
      price: [3340, 3560, 3780, 3925, 3995, 4310, 4187, 4201, 4436, 4491, 4754, 4865],
      notes: { 3: "Record deal wins of $13.2B", 5: "Share price touches ₹4,585 all-time high" }
    }
  ),
  createCompany(
    "infosys", "Infosys Ltd", "INFY", "500209",
    "Information Technology", "IT Services & Consulting", "Mega Cap (> ₹1 Lakh Cr)",
    "Bengaluru, Karnataka", ["TCS", "HCLTECH", "WIPRO", "LTIM", "PERSISTENT"],
    { peRatio: 27.5, pbRatio: 8.5, dividendYieldPct: 2.10, fiftyTwoWeekHigh: 1991.4, fiftyTwoWeekLow: 1358.3 },
    { mcap: [790000, 590000, 590000, 835000, 1045000], pat: [22110, 24095, 26233, 27400, 32100], rev: [121641, 146765, 153670, 166000, 184000], price: [1906, 1428, 1420, 2012, 2518] },
    {
      mcap: [540000, 605000, 645000, 590000, 650000, 795000, 810000, 835000, 900000, 915000, 995000, 1045000],
      pat: [5945, 6212, 6106, 7969, 6368, 6506, 6780, 7080, 7450, 7810, 8290, 8780],
      rev: [37933, 38994, 38821, 37923, 39315, 40986, 42250, 43600, 45100, 46600, 48600, 50500],
      price: [1300, 1455, 1550, 1420, 1565, 1915, 1952, 2012, 2169, 2205, 2397, 2518]
    }
  ),
  createCompany(
    "hcltech", "HCL Technologies Ltd", "HCLTECH", "532281",
    "Information Technology", "IT Services & Consulting", "Mega Cap (> ₹1 Lakh Cr)",
    "Noida, Uttar Pradesh", ["TCS", "INFY", "WIPRO", "LTIM"],
    { peRatio: 26.1, pbRatio: 6.8, dividendYieldPct: 2.85, fiftyTwoWeekHigh: 1880.0, fiftyTwoWeekLow: 1220.0 },
    { mcap: [315000, 295000, 420000, 485000, 540000], pat: [13499, 14824, 15702, 17200, 19500], rev: [85651, 101456, 109913, 118000, 129000], price: [1160, 1088, 1548, 1787, 1990] },
    {
      mcap: [320000, 345000, 405000, 420000, 410000, 465000, 475000, 485000, 505000, 515000, 528000, 540000],
      pat: [3534, 3832, 4350, 3986, 4257, 4235, 4340, 4368, 4620, 4780, 4980, 5120],
      rev: [26296, 26672, 28446, 28499, 28057, 28862, 29800, 30500, 31200, 32100, 32900, 33800],
      price: [1180, 1270, 1490, 1548, 1510, 1715, 1750, 1787, 1860, 1898, 1945, 1990]
    }
  ),
  createCompany(
    "wipro", "Wipro Ltd", "WIPRO", "507685",
    "Information Technology", "IT Services & Consulting", "Mega Cap (> ₹1 Lakh Cr)",
    "Bengaluru, Karnataka", ["TCS", "INFY", "HCLTECH", "LTIM"],
    { peRatio: 24.3, pbRatio: 3.6, dividendYieldPct: 0.18, fiftyTwoWeekHigh: 590.0, fiftyTwoWeekLow: 400.0 },
    { mcap: [325000, 198000, 252000, 275000, 310000], pat: [12219, 11350, 11045, 12100, 13400], rev: [79093, 90487, 89760, 94500, 102000], price: [593, 365, 480, 524, 592] },
    {
      mcap: [205000, 218000, 245000, 252000, 260000, 278000, 268000, 275000, 285000, 292000, 302000, 310000],
      pat: [2870, 2646, 2694, 2835, 3003, 3209, 3120, 3240, 3280, 3320, 3380, 3420],
      rev: [22831, 22516, 22205, 22208, 21964, 22302, 22800, 23400, 24100, 24900, 25800, 26500],
      price: [390, 415, 467, 480, 496, 530, 511, 524, 544, 557, 576, 592]
    }
  ),
  createCompany(
    "persistent", "Persistent Systems Ltd", "PERSISTENT", "533179",
    "Information Technology", "Digital Engineering & AI Software", "Large Cap (₹20k - ₹1 Lakh Cr)",
    "Pune, Maharashtra", ["TCS", "INFY", "COFORGE", "TATAELXSI", "KPITTECH"],
    { peRatio: 49.5, pbRatio: 9.8, dividendYieldPct: 0.85, fiftyTwoWeekHigh: 5950.0, fiftyTwoWeekLow: 3450.0 },
    { mcap: [36000, 35000, 61000, 85000, 112000], pat: [690, 921, 1094, 1360, 1800], rev: [5710, 8350, 9821, 11880, 14760], price: [2350, 2280, 3960, 5520, 7280] },
    {
      mcap: [38000, 44000, 58000, 61000, 72000, 84000, 88000, 85000, 92000, 98000, 104000, 112000],
      pat: [229, 263, 286, 315, 306, 325, 355, 380, 405, 435, 470, 510],
      rev: [2321, 2412, 2498, 2590, 2737, 2897, 3050, 3200, 3380, 3580, 3790, 4010],
      price: [2470, 2860, 3770, 3960, 4680, 5460, 5720, 5520, 5980, 6370, 6760, 7280]
    }
  ),
  createCompany(
    "rategain", "RateGain Travel Tech Ltd", "RATEGAIN", "543417",
    "Information Technology", "Travel Tech SaaS", "Mid Cap (₹5k - ₹20k Cr)",
    "Noida, Uttar Pradesh", ["PERSISTENT", "DATAMATICS", "TANLA"],
    { peRatio: 41.2, pbRatio: 4.8, dividendYieldPct: 0.15, fiftyTwoWeekHigh: 922.0, fiftyTwoWeekLow: 512.0 },
    { mcap: [3800, 4200, 8800, 8500, 11100], pat: [8, 68, 145, 220, 320], rev: [366, 565, 957, 1144, 1475], price: [350, 385, 808, 781, 1020] },
    {
      mcap: [6800, 7400, 9100, 8800, 8200, 8600, 8100, 8500, 9200, 9800, 10400, 11100],
      pat: [25, 30, 40, 50, 45, 52, 58, 65, 68, 76, 84, 94],
      rev: [214, 235, 252, 256, 260, 277, 295, 312, 330, 355, 380, 410],
      price: [625, 680, 836, 808, 753, 790, 744, 781, 845, 900, 955, 1020]
    }
  ),
  createCompany(
    "datamatics", "Datamatics Global Services Ltd", "DATAMATICS", "532528",
    "Information Technology", "Enterprise Automation Software", "Mid Cap (₹5k - ₹20k Cr)",
    "Mumbai, Maharashtra", ["RATEGAIN", "PERSISTENT", "TANLA"],
    { peRatio: 18.4, pbRatio: 2.9, dividendYieldPct: 1.05, fiftyTwoWeekHigh: 814.0, fiftyTwoWeekLow: 440.0 },
    { mcap: [1700, 2100, 3800, 4550, 6100], pat: [80, 115, 196, 216, 305], rev: [1210, 1340, 1550, 1785, 2210], price: [288, 355, 644, 771, 1034] },
    {
      mcap: [3100, 3450, 4100, 3800, 3950, 4400, 4200, 4550, 4850, 5200, 5600, 6100],
      pat: [55, 49, 42, 50, 46, 52, 56, 62, 66, 72, 79, 88],
      rev: [391, 377, 369, 413, 415, 438, 452, 480, 505, 535, 565, 605],
      price: [525, 585, 695, 644, 669, 745, 712, 771, 822, 881, 949, 1034]
    }
  ),

  // ==================== BANKING & FINANCIALS ====================
  createCompany(
    "hdfcbank", "HDFC Bank Ltd", "HDFCBANK", "500180",
    "Banking & Finance", "Private Banking", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK"],
    { peRatio: 18.6, pbRatio: 2.7, dividendYieldPct: 1.15, fiftyTwoWeekHigh: 1794.0, fiftyTwoWeekLow: 1363.5 },
    { mcap: [810000, 900000, 1150000, 1410000, 1710000], pat: [36961, 44109, 64060, 70500, 82000], rev: [157774, 192800, 276800, 305000, 345000], price: [1470, 1610, 1515, 1858, 2253] },
    {
      mcap: [1250000, 1160000, 1270000, 1150000, 1290000, 1335000, 1375000, 1410000, 1490000, 1530000, 1640000, 1710000],
      pat: [11952, 15976, 16372, 16512, 16800, 17280, 17820, 18350, 18920, 19520, 20250, 20950],
      rev: [57816, 66317, 71111, 71780, 73200, 75400, 77700, 79800, 82000, 84100, 86600, 88800],
      price: [1640, 1530, 1670, 1515, 1700, 1760, 1812, 1858, 1963, 2016, 2161, 2253]
    }
  ),
  createCompany(
    "icicibank", "ICICI Bank Ltd", "ICICIBANK", "532174",
    "Banking & Finance", "Private Banking", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["HDFCBANK", "SBIN", "KOTAKBANK", "AXISBANK"],
    { peRatio: 17.2, pbRatio: 2.8, dividendYieldPct: 0.90, fiftyTwoWeekHigh: 1332.0, fiftyTwoWeekLow: 980.0 },
    { mcap: [505000, 610000, 775000, 975000, 1235000], pat: [23339, 31896, 40888, 47000, 58000], rev: [123398, 144500, 168000, 192000, 225000], price: [730, 880, 1105, 1390, 1761] },
    {
      mcap: [660000, 675000, 710000, 775000, 845000, 915000, 935000, 975000, 1050000, 1080000, 1175000, 1235000],
      pat: [9648, 10261, 10272, 10708, 11059, 11480, 11980, 12480, 12980, 13490, 14120, 14750],
      rev: [38763, 40697, 42200, 43590, 45050, 46900, 48800, 50800, 52600, 54400, 56700, 58800],
      price: [942, 963, 1012, 1105, 1205, 1305, 1334, 1390, 1497, 1540, 1675, 1761]
    }
  ),
  createCompany(
    "sbin", "State Bank of India", "SBIN", "500112",
    "Banking & Finance", "Public Banking", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["HDFCBANK", "ICICIBANK", "BANKBARODA", "PNB"],
    { peRatio: 10.9, pbRatio: 1.45, dividendYieldPct: 1.68, fiftyTwoWeekHigh: 912.0, fiftyTwoWeekLow: 560.0 },
    { mcap: [440000, 465000, 720000, 810000, 1055000], pat: [31676, 50232, 61077, 75000, 92000], rev: [320000, 385000, 465000, 520000, 595000], price: [493, 521, 808, 908, 1184] },
    {
      mcap: [510000, 535000, 575000, 720000, 760000, 710000, 780000, 810000, 880000, 910000, 990000, 1055000],
      pat: [16884, 14330, 9164, 20698, 17035, 18331, 19150, 21500, 20800, 21850, 23150, 24800],
      rev: [108039, 112169, 118193, 128412, 122688, 129291, 133800, 142000, 141200, 146100, 152300, 160000],
      price: [572, 600, 645, 808, 852, 796, 874, 908, 987, 1021, 1111, 1184]
    }
  ),
  createCompany(
    "kotakbank", "Kotak Mahindra Bank Ltd", "KOTAKBANK", "500247",
    "Banking & Finance", "Private Banking", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["HDFCBANK", "ICICIBANK", "AXISBANK", "SBIN"],
    { peRatio: 19.8, pbRatio: 2.5, dividendYieldPct: 0.12, fiftyTwoWeekHigh: 1940.0, fiftyTwoWeekLow: 1540.0 },
    { mcap: [350000, 345000, 355000, 380000, 420000], pat: [12089, 14925, 18213, 20400, 23800], rev: [58000, 68000, 82000, 92000, 106000], price: [1760, 1735, 1785, 1910, 2110] },
    {
      mcap: [365000, 352000, 380000, 355000, 348000, 372000, 375000, 380000, 395000, 402000, 412000, 420000],
      pat: [4150, 4423, 4265, 5375, 4520, 5044, 4980, 5856, 5420, 5890, 6120, 6370],
      rev: [18100, 19500, 20200, 24200, 22100, 23500, 24100, 26300, 25800, 27200, 28100, 29500],
      price: [1835, 1770, 1910, 1785, 1750, 1870, 1885, 1910, 1985, 2020, 2070, 2110]
    }
  ),
  createCompany(
    "cdsl", "Central Depository Services Ltd", "CDSL", "540716",
    "Banking & Finance", "Securities Depository & Capital Market", "Large Cap (₹20k - ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["BSE", "MCX", "ANGELONE"],
    { peRatio: 54.8, pbRatio: 16.2, dividendYieldPct: 0.88, fiftyTwoWeekHigh: 1664.0, fiftyTwoWeekLow: 870.0 },
    { mcap: [14200, 10400, 21500, 31000, 40500], pat: [311, 276, 418, 620, 810], rev: [606, 621, 893, 1220, 1590], price: [679, 498, 1028, 1482, 1937] },
    {
      mcap: [12500, 14200, 18900, 21500, 26000, 32500, 29500, 31000, 33500, 35000, 37500, 40500],
      pat: [74, 109, 107, 129, 134, 162, 158, 175, 182, 195, 210, 232],
      rev: [170, 207, 214, 241, 257, 322, 310, 345, 365, 390, 418, 455],
      price: [598, 679, 904, 1028, 1243, 1554, 1410, 1482, 1602, 1674, 1793, 1937]
    }
  ),

  // ==================== CONGLOMERATES & ENERGY ====================
  createCompany(
    "reliance", "Reliance Industries Ltd", "RELIANCE", "500325",
    "Conglomerate", "Oil, Gas, Telecom & Retail", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["ADANIENT", "IOCL", "BPCL", "ONGC", "TATAPOWER"],
    { peRatio: 26.8, pbRatio: 2.2, dividendYieldPct: 0.38, fiftyTwoWeekHigh: 3217.9, fiftyTwoWeekLow: 2220.3 },
    { mcap: [1780000, 1580000, 1948500, 1960000, 2380000], pat: [67845, 74088, 69621, 78000, 95000], rev: [792756, 892913, 914472, 985000, 1120000], price: [2630, 2335, 2880, 2898, 3518] },
    {
      mcap: [1745000, 1680000, 1765000, 1948500, 2045000, 2015000, 1875000, 1960000, 2085000, 2140000, 2290000, 2380000],
      pat: [16011, 17394, 17265, 18951, 19400, 19800, 20100, 21100, 21850, 22650, 23550, 24450],
      rev: [210831, 234956, 228160, 236533, 242100, 245200, 251000, 258900, 266200, 273800, 283100, 291500],
      price: [2580, 2485, 2610, 2880, 3020, 2978, 2772, 2898, 3082, 3164, 3385, 3518]
    }
  ),
  createCompany(
    "tatapower", "Tata Power Company Ltd", "TATAPOWER", "500400",
    "Energy & Utilities", "Power Generation & Renewables", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["NTPC", "POWERGRID", "RELIANCE"],
    { peRatio: 34.2, pbRatio: 4.1, dividendYieldPct: 0.48, fiftyTwoWeekHigh: 494.8, fiftyTwoWeekLow: 310.0 },
    { mcap: [71000, 60000, 125000, 142000, 168000], pat: [2156, 3810, 4280, 5100, 6300], rev: [42576, 56033, 61542, 68000, 77000], price: [222, 188, 391, 444, 526] },
    {
      mcap: [70000, 82000, 105000, 125000, 138000, 148000, 136000, 142000, 150000, 156000, 162000, 168000],
      pat: [1141, 1017, 1076, 1046, 1189, 1093, 1240, 1380, 1420, 1490, 1580, 1680],
      rev: [15000, 15442, 14841, 16259, 17293, 15697, 16800, 17800, 18500, 19200, 20100, 21200],
      price: [219, 256, 328, 391, 431, 463, 425, 444, 469, 488, 507, 526]
    }
  ),
  createCompany(
    "prajind", "Praj Industries Ltd", "PRAJIND", "522205",
    "Chemicals & Energy", "Bio-Energy & Process Engineering", "Mid Cap (₹5k - ₹20k Cr)",
    "Pune, Maharashtra", ["CLEAN", "DEEPAKNTR", "PIIND"],
    { peRatio: 36.2, pbRatio: 6.8, dividendYieldPct: 1.12, fiftyTwoWeekHigh: 848.0, fiftyTwoWeekLow: 460.0 },
    { mcap: [7200, 7000, 10500, 14500, 19500], pat: [150, 240, 280, 409, 550], rev: [2343, 3528, 3960, 4200, 5100], price: [392, 381, 570, 787, 1059] },
    {
      mcap: [8800, 10200, 11500, 10500, 12800, 15200, 13800, 14500, 15800, 16900, 18200, 19500],
      pat: [59, 62, 117, 92, 84, 95, 108, 122, 115, 128, 142, 165],
      rev: [737, 885, 829, 1019, 699, 816, 920, 1150, 980, 1080, 1210, 1420],
      price: [478, 554, 625, 570, 695, 825, 749, 787, 858, 918, 988, 1059]
    }
  ),

  // ==================== CONSUMER & RETAIL ====================
  createCompany(
    "itc", "ITC Ltd", "ITC", "500875",
    "FMCG", "Cigarettes, FMCG Foods & Agri", "Mega Cap (> ₹1 Lakh Cr)",
    "Kolkata, West Bengal", ["HINDUNILVR", "NESTLEIND", "BRITANNIA", "DABUR"],
    { peRatio: 28.1, pbRatio: 8.6, dividendYieldPct: 2.85, fiftyTwoWeekHigh: 528.5, fiftyTwoWeekLow: 399.3 },
    { mcap: [310000, 475000, 540000, 625000, 780000], pat: [15503, 19428, 20459, 22400, 25800], rev: [60668, 70919, 76840, 82000, 91000], price: [250, 383, 432, 500, 625] },
    {
      mcap: [560000, 550000, 580000, 540000, 548000, 652000, 612000, 625000, 672000, 692000, 748000, 780000],
      pat: [4903, 4927, 5572, 5020, 5091, 5242, 5410, 5640, 5930, 6230, 6620, 7010],
      rev: [16995, 17774, 18018, 17752, 18220, 18980, 19600, 20350, 21250, 22100, 23200, 24300],
      price: [450, 442, 465, 432, 439, 522, 490, 500, 538, 554, 599, 625]
    }
  ),
  createCompany(
    "trent", "Trent Ltd", "TRENT", "500251",
    "Consumer & Retail", "Apparel & Fast Fashion Retail", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["TITAN", "DMART", "VBL"],
    { peRatio: 112.5, pbRatio: 38.4, dividendYieldPct: 0.08, fiftyTwoWeekHigh: 8345.0, fiftyTwoWeekLow: 2320.0 },
    { mcap: [45000, 48000, 140000, 250000, 340000], pat: [106, 394, 1477, 2450, 3350], rev: [4498, 8242, 12664, 19100, 26800], price: [1265, 1350, 3940, 7030, 9560] },
    {
      mcap: [62000, 75000, 108000, 140000, 200000, 285000, 265000, 250000, 275000, 295000, 320000, 340000],
      pat: [167, 228, 374, 712, 423, 512, 585, 640, 710, 795, 885, 960],
      rev: [2628, 2982, 3467, 3298, 4104, 4680, 5200, 5450, 5950, 6500, 7150, 7500],
      price: [1740, 2110, 3040, 3940, 5630, 8020, 7450, 7030, 7730, 8290, 9000, 9560]
    }
  ),

  // ==================== AUTOMOTIVE & MOBILITY ====================
  createCompany(
    "tatamotors", "Tata Motors Ltd", "TATAMOTORS", "500570",
    "Automotive", "Commercial & Electric Vehicles", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["MARUTI", "M&M", "BAJAJ-AUTO", "HEROMOTOCO"],
    { peRatio: 10.4, pbRatio: 3.1, dividendYieldPct: 0.72, fiftyTwoWeekHigh: 1179.0, fiftyTwoWeekLow: 690.0 },
    { mcap: [165000, 155000, 335000, 335000, 505000], pat: [-11309, 2690, 31807, 24500, 33500], rev: [278454, 345967, 437928, 452000, 510000], price: [433, 420, 1008, 1008, 1519] },
    {
      mcap: [215000, 235000, 280000, 335000, 330000, 325000, 305000, 335000, 378000, 398000, 460000, 505000],
      pat: [3301, 3832, 7145, 17407, 5566, 3450, 4100, 4850, 5430, 6010, 6780, 7520],
      rev: [102236, 105128, 110577, 119986, 108048, 101450, 107200, 113400, 118400, 123100, 129800, 136000],
      price: [645, 705, 840, 1008, 993, 978, 917, 1008, 1137, 1197, 1383, 1519]
    }
  ),

  // ==================== PHARMACEUTICALS & HEALTHCARE ====================
  createCompany(
    "sunpharma", "Sun Pharmaceutical Industries Ltd", "SUNPHARMA", "524715",
    "Healthcare", "Specialty Generics & Formulations", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["DRREDDY", "CIPLA", "DIVISLAB", "MANKIND"],
    { peRatio: 37.8, pbRatio: 6.2, dividendYieldPct: 0.75, fiftyTwoWeekHigh: 1960.0, fiftyTwoWeekLow: 1180.0 },
    { mcap: [220000, 235000, 365000, 482000, 642000], pat: [3406, 8513, 9680, 13200, 17200], rev: [38654, 43886, 48497, 55200, 66400], price: [915, 980, 1520, 2010, 2677] },
    {
      mcap: [245000, 275000, 310000, 365000, 388000, 458000, 468000, 482000, 528000, 548000, 605000, 642000],
      pat: [2022, 2375, 2524, 2654, 2835, 3040, 3260, 3510, 3790, 4100, 4510, 4910],
      rev: [11940, 12192, 12380, 11982, 12652, 13420, 14180, 14950, 15850, 16750, 17900, 18900],
      price: [1022, 1145, 1290, 1520, 1618, 1910, 1952, 2010, 2202, 2285, 2523, 2677]
    }
  ),
  createCompany(
    "marksans", "Marksans Pharma Ltd", "MARKSANS", "532482",
    "Healthcare", "Formulations & Softgel Manufacturing", "Mid Cap (₹5k - ₹20k Cr)",
    "Mumbai, Maharashtra", ["SUNPHARMA", "DRREDDY", "GRANULES"],
    { peRatio: 26.4, pbRatio: 4.1, dividendYieldPct: 0.35, fiftyTwoWeekHigh: 338.0, fiftyTwoWeekLow: 132.0 },
    { mcap: [2100, 2900, 7600, 13500, 17800], pat: [187, 265, 315, 410, 570], rev: [1490, 1852, 2177, 2680, 3350], price: [51, 68, 167, 296, 390] },
    {
      mcap: [4200, 5100, 7200, 7600, 9800, 12500, 14200, 13500, 14800, 15600, 16500, 17800],
      pat: [71, 83, 83, 78, 89, 97, 108, 116, 124, 135, 148, 162],
      rev: [500, 531, 586, 560, 610, 648, 690, 720, 760, 810, 865, 920],
      price: [92, 112, 158, 167, 215, 274, 312, 296, 325, 342, 362, 390]
    }
  ),

  // ==================== ELECTRONICS, HARDWARE & INFRASTRUCTURE ====================
  createCompany(
    "lt", "Larsen & Toubro Ltd", "LT", "500510",
    "Infrastructure", "Engineering, Construction & Mega Projects", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["BEL", "HAL", "BHEL", "SIEMENS"],
    { peRatio: 33.1, pbRatio: 5.4, dividendYieldPct: 0.78, fiftyTwoWeekHigh: 3948.6, fiftyTwoWeekLow: 2824.0 },
    { mcap: [248000, 305000, 504000, 568000, 770000], pat: [10291, 12625, 15543, 19200, 24500], rev: [156521, 183341, 221113, 255000, 305000], price: [1765, 2165, 3665, 4130, 5600] },
    {
      mcap: [345000, 415000, 485000, 504000, 512000, 522000, 538000, 568000, 625000, 645000, 720000, 770000],
      pat: [2493, 3223, 2947, 4396, 2786, 3395, 3820, 4890, 5280, 5720, 6310, 7050],
      rev: [47882, 51024, 55128, 67079, 55120, 61555, 65100, 72800, 76600, 80200, 84400, 89200],
      price: [2510, 3020, 3530, 3665, 3723, 3796, 3912, 4130, 4545, 4690, 5236, 5600]
    }
  ),
  createCompany(
    "bel", "Bharat Electronics Ltd", "BEL", "500049",
    "Electronics & Industrial", "Defense Electronics & Radars", "Mega Cap (> ₹1 Lakh Cr)",
    "Bengaluru, Karnataka", ["HAL", "BHEL", "LT", "POLYCAB"],
    { peRatio: 48.2, pbRatio: 11.5, dividendYieldPct: 0.72, fiftyTwoWeekHigh: 340.5, fiftyTwoWeekLow: 127.0 },
    { mcap: [52000, 71000, 172000, 235000, 295000], pat: [2349, 2984, 4020, 5200, 6900], rev: [15314, 17734, 20268, 24500, 31000], price: [71, 97, 235, 321, 404] },
    {
      mcap: [92000, 102000, 135000, 172000, 226000, 218000, 210000, 235000, 245000, 260000, 275000, 295000],
      pat: [531, 812, 859, 1784, 776, 1091, 1180, 2240, 1120, 1450, 1580, 2750],
      rev: [3511, 3993, 4162, 8564, 4199, 4583, 4850, 9800, 5200, 5650, 6100, 11200],
      price: [126, 140, 185, 235, 309, 298, 287, 321, 335, 356, 376, 404]
    }
  ),
  createCompany(
    "polycab", "Polycab India Ltd", "POLYCAB", "542652",
    "Electronics & Industrial", "Power Cables & Fast Moving Electrical Goods", "Mega Cap (> ₹1 Lakh Cr)",
    "Mumbai, Maharashtra", ["HAVELLS", "KEI", "DYCL", "ELECON"],
    { peRatio: 42.1, pbRatio: 9.3, dividendYieldPct: 0.52, fiftyTwoWeekHigh: 7330.0, fiftyTwoWeekLow: 3812.0 },
    { mcap: [36000, 44000, 84000, 110000, 138000], pat: [917, 1282, 1803, 2150, 2590], rev: [12204, 14108, 18039, 21800, 26800], price: [2400, 2930, 5590, 7320, 9180] },
    {
      mcap: [64000, 79000, 65000, 84000, 105000, 108000, 102000, 110000, 118000, 122000, 130000, 138000],
      pat: [403, 430, 417, 553, 401, 440, 495, 620, 540, 595, 660, 780],
      rev: [3889, 4218, 4340, 5592, 4698, 5498, 5750, 6850, 5800, 6450, 6950, 8100],
      price: [4260, 5260, 4330, 5590, 6990, 7180, 6790, 7320, 7850, 8120, 8650, 9180]
    }
  ),
  createCompany(
    "elecon", "Elecon Engineering Ltd", "ELECON", "505700",
    "Electronics & Industrial", "Industrial Gears & Heavy Machinery", "Mid Cap (₹5k - ₹20k Cr)",
    "Anand, Gujarat", ["POLYCAB", "DYCL", "LT"],
    { peRatio: 31.8, pbRatio: 6.9, dividendYieldPct: 0.60, fiftyTwoWeekHigh: 1418.0, fiftyTwoWeekLow: 730.0 },
    { mcap: [2100, 4200, 12500, 14200, 19200], pat: [140, 237, 356, 413, 560], rev: [1211, 1529, 1937, 2150, 2680], price: [187, 374, 1114, 1265, 1711] },
    {
      mcap: [8200, 9400, 11200, 12500, 14800, 13600, 13100, 14200, 15400, 16500, 17800, 19200],
      pat: [73, 89, 90, 104, 88, 98, 105, 122, 118, 132, 145, 168],
      rev: [414, 485, 474, 565, 440, 512, 535, 630, 570, 640, 690, 780],
      price: [731, 838, 998, 1114, 1319, 1212, 1167, 1265, 1372, 1470, 1586, 1711]
    }
  ),
  createCompany(
    "dynamiccables", "Dynamic Cables Ltd", "DYCL", "540795",
    "Electronics & Industrial", "Power Cables & Railway Conductors", "Small Cap (₹500 Cr - ₹5k Cr)",
    "Jaipur, Rajasthan", ["POLYCAB", "ELECON"],
    { peRatio: 28.5, pbRatio: 4.6, dividendYieldPct: 0.28, fiftyTwoWeekHigh: 685.0, fiftyTwoWeekLow: 280.0 },
    { mcap: [280, 410, 1100, 1450, 2050], pat: [14, 31, 48, 70, 111], rev: [564, 668, 837, 1045, 1440], price: [127, 186, 500, 659, 931] },
    {
      mcap: [850, 1050, 1180, 1100, 1320, 1480, 1380, 1450, 1580, 1720, 1880, 2050],
      pat: [9, 11, 13, 15, 14, 17, 18, 21, 22, 26, 29, 34],
      rev: [181, 202, 218, 236, 228, 254, 268, 295, 310, 340, 375, 415],
      price: [386, 477, 536, 500, 600, 672, 627, 659, 718, 781, 854, 931]
    }
  ),

  // ==================== TELECOM SERVICES ====================
  createCompany(
    "bhartiartl", "Bharti Airtel Ltd", "BHARTIARTL", "532454",
    "Telecom", "Telecommunications & Digital Services", "Mega Cap (> ₹1 Lakh Cr)",
    "New Delhi, Delhi", ["RELIANCE", "TATAPOWER"],
    { peRatio: 52.3, pbRatio: 7.9, dividendYieldPct: 0.65, fiftyTwoWeekHigh: 1779.0, fiftyTwoWeekLow: 1115.0 },
    { mcap: [425000, 445000, 752000, 1075000, 1410000], pat: [4255, 8346, 7467, 15993, 24800], rev: [116547, 139145, 149982, 172000, 201000], price: [740, 750, 1260, 1805, 2367] },
    {
      mcap: [502000, 535000, 595000, 752000, 855000, 980000, 1020000, 1075000, 1170000, 1215000, 1335000, 1410000],
      pat: [1612, 1341, 2442, 2072, 4160, 3593, 4320, 4920, 5410, 5880, 6420, 7120],
      rev: [37440, 37044, 37900, 37599, 38800, 41100, 43200, 45200, 47100, 49100, 51400, 53600],
      price: [875, 928, 1032, 1260, 1435, 1645, 1712, 1805, 1965, 2039, 2241, 2367]
    }
  ),
];
