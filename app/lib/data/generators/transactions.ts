import type { Transaction } from "../types";

// Transaction categories with typical merchants (Indonesia - IDR amounts)
const CATEGORIES = {
  salary: {
    merchants: [
      "PT Tech Indonesia Payroll",
      "Digital Agency Jakarta",
      "Startup Indonesia",
      "Konsultan IT Jakarta",
      "Software House Bandung",
      "Tech Company Surabaya",
    ],
    amountRange: [8_000_000, 25_000_000], // IDR 8-25 juta (mid to senior professional)
    isIncome: true,
    frequency: 0.02, // Monthly
  },
  groceries: {
    merchants: [
      "Indomaret",
      "Alfamart",
      "Superindo",
      "Ranch Market",
      "Lotte Mart",
      "Hypermart",
      "Transmart",
      "Giant",
      "Farmer's Market BSD",
      "Papaya Fresh Gallery",
      "Pasar Tradisional",
      "Toko Sayur Keliling",
      "Warung Sayur",
    ],
    amountRange: [50_000, 800_000], // IDR 50rb - 800rb
    isIncome: false,
    frequency: 0.15, // Multiple times per week
  },
  utilities: {
    merchants: [
      "PLN (Listrik)",
      "PDAM (Air)",
      "Indihome",
      "Telkomsel",
      "XL Axiata",
      "First Media",
      "Biznet Home",
    ],
    amountRange: [100_000, 1_500_000], // IDR 100rb - 1.5jt
    isIncome: false,
    frequency: 0.03, // Monthly bills
  },
  rent: {
    merchants: [
      "Kost Jakarta Selatan",
      "Apartemen Jakarta",
      "Sewa Rumah Bekasi",
      "Kontrakan Depok",
    ],
    amountRange: [2_000_000, 15_000_000], // IDR 2jt - 15jt
    isIncome: false,
    frequency: 0.03, // Monthly
  },
  entertainment: {
    merchants: [
      "Netflix Indonesia",
      "Spotify Premium",
      "Disney+ Hotstar",
      "Vidio Premier",
      "CGV Cinemas",
      "XXI Cineplex",
      "Timezone",
      "PlayStation Store",
      "Steam",
      "Dufan",
      "Trans Studio",
      "Karaoke Inul Vizta",
      "Museum MACAN",
      "Ancol",
    ],
    amountRange: [50_000, 1_500_000], // IDR 50rb - 1.5jt
    isIncome: false,
    frequency: 0.1,
  },
  transportation: {
    merchants: [
      "Pertamina",
      "Shell",
      "Gojek",
      "Grab",
      "TransJakarta",
      "MRT Jakarta",
      "Tol Jakarta-Cikampek",
      "Parkir Mall",
      "Blue Bird Taxi",
      "Bengkel Motor",
      "Cuci Mobil",
    ],
    amountRange: [15_000, 500_000], // IDR 15rb - 500rb
    isIncome: false,
    frequency: 0.2, // Frequent
  },
  dining: {
    merchants: [
      "Warteg",
      "Nasi Padang Sederhana",
      "Bakso Malang",
      "Ayam Geprek Bensu",
      "McDonald's",
      "KFC",
      "Starbucks",
      "Janji Jiwa",
      "Kopi Kenangan",
      "Solaria",
      "Hoka Hoka Bento",
      "Yoshinoya",
      "Sushi Tei",
      "Warung Makan",
      "Depot Bu Rudy",
      "Bebek Bengil",
      "Sate Khas Senayan",
      "Bakmi GM",
      "Es Teler 77",
    ],
    amountRange: [15_000, 1_000_000], // IDR 15rb - 1jt
    isIncome: false,
    frequency: 0.25, // Very frequent
  },
  shopping: {
    merchants: [
      "Tokopedia",
      "Shopee",
      "Lazada",
      "Blibli",
      "Grand Indonesia",
      "Plaza Senayan",
      "Mall Taman Anggrek",
      "Pacific Place",
      "Erafone",
      "iBox",
      "Uniqlo",
      "H&M",
      "Zara",
      "Ace Hardware",
      "IKEA Alam Sutera",
      "Gramedia",
      "Pet Shop",
      "Courts",
      "Electronic City",
    ],
    amountRange: [100_000, 10_000_000], // IDR 100rb - 10jt
    isIncome: false,
    frequency: 0.12,
  },
  healthcare: {
    merchants: [
      "RS Siloam",
      "RS Pondok Indah",
      "Klinik Kimia Farma",
      "Apotek Guardian",
      "Apotek Century",
      "Halodoc",
      "Alodokter",
      "Klinik Gigi Joy Dental",
      "Lab Prodia",
    ],
    amountRange: [50_000, 5_000_000], // IDR 50rb - 5jt
    isIncome: false,
    frequency: 0.05,
  },
  freelance: {
    merchants: [
      "Proyek Klien Jakarta",
      "Konsultasi IT",
      "Freelance Design",
      "Upwork Payment",
      "Fiverr Income",
      "Content Creator",
      "Jasa Programming",
    ],
    amountRange: [2_000_000, 50_000_000], // IDR 2jt - 50jt
    isIncome: true,
    frequency: 0.04,
  },
  subscriptions: {
    merchants: [
      "Adobe Creative Cloud",
      "Microsoft 365",
      "iCloud Storage",
      "Google One",
      "GitHub Pro",
      "Fitness First",
      "Celebrity Fitness",
      "Kompas Digital",
      "Tempo Digital",
    ],
    amountRange: [50_000, 1_000_000], // IDR 50rb - 1jt
    isIncome: false,
    frequency: 0.02, // Monthly
  },
  travel: {
    merchants: [
      "Garuda Indonesia",
      "Lion Air",
      "AirAsia",
      "Citilink",
      "Traveloka",
      "Tiket.com",
      "Agoda",
      "RedDoorz",
      "OYO",
      "Hotel Santika",
      "Rental Mobil Jogja",
      "Travel Agent",
    ],
    amountRange: [500_000, 20_000_000], // IDR 500rb - 20jt
    isIncome: false,
    frequency: 0.02,
  },
};

interface GenerateOptions {
  startDate?: Date;
  endDate?: Date;
  initialBalance?: number;
  numTransactions?: number;
  seed?: number;
}

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

export function generateTransactions(
  options: GenerateOptions = {}
): Transaction[] {
  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    endDate = new Date(),
    initialBalance = 5000,
    numTransactions = 300,
    seed = 42,
  } = options;

  const rng = new SeededRandom(seed);
  const transactions: Transaction[] = [];
  let currentBalance = initialBalance;

  // Generate dates spread across the time range
  const dates: Date[] = [];
  const timeRange = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < numTransactions; i++) {
    const randomTime = startDate.getTime() + rng.next() * timeRange;
    dates.push(new Date(randomTime));
  }

  // Sort dates chronologically
  dates.sort((a, b) => a.getTime() - b.getTime());

  // Generate transactions
  for (let i = 0; i < numTransactions; i++) {
    const categoryNames = Object.keys(CATEGORIES) as Array<
      keyof typeof CATEGORIES
    >;
    const category = rng.choice(categoryNames);
    const categoryData = CATEGORIES[category];

    const merchant = rng.choice(categoryData.merchants);
    const [minAmount, maxAmount] = categoryData.amountRange;
    const rawAmount = rng.nextFloat(minAmount, maxAmount);

    // Round to 2 decimal places
    const absoluteAmount = Math.round(rawAmount * 100) / 100;
    const amount = categoryData.isIncome ? absoluteAmount : -absoluteAmount;

    currentBalance += amount;

    const transaction: Transaction = {
      id: `txn_${i.toString().padStart(6, "0")}`,
      date: dates[i].toISOString().split("T")[0], // YYYY-MM-DD format
      description: generateDescription(category, merchant),
      category,
      amount,
      balance: Math.round(currentBalance * 100) / 100,
      merchant,
      type: categoryData.isIncome ? "credit" : "debit",
    };

    transactions.push(transaction);
  }

  return transactions;
}

function generateDescription(category: string, merchant: string): string {
  const descriptions: Record<string, string[]> = {
    salary: ["Monthly Salary", "Bi-weekly Paycheck", "Salary Deposit"],
    groceries: ["Grocery Shopping", "Weekly Groceries", "Food & Supplies"],
    utilities: ["Utility Bill Payment", "Monthly Service", "Utility Charge"],
    rent: ["Monthly Rent", "Rent Payment", "Housing Payment"],
    entertainment: [
      "Subscription Service",
      "Entertainment Purchase",
      "Recreation",
    ],
    transportation: ["Gas Purchase", "Ride Service", "Transit Fare", "Parking"],
    dining: ["Restaurant", "Food Purchase", "Dining Out", "Takeout"],
    shopping: ["Purchase", "Online Order", "Retail Purchase", "Shopping"],
    healthcare: ["Medical Payment", "Healthcare Service", "Prescription"],
    freelance: ["Freelance Payment", "Consulting Invoice", "Project Payment"],
  };

  const options = descriptions[category] || ["Transaction"];
  const baseDescription = options[Math.floor(Math.random() * options.length)];

  return `${baseDescription} - ${merchant}`;
}

// Helper function to generate transactions for specific months
export function generateMonthlyTransactions(
  year: number,
  month: number,
  count: number = 50,
  seed?: number
): Transaction[] {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  return generateTransactions({
    startDate,
    endDate,
    numTransactions: count,
    seed: seed || year * 100 + month,
  });
}

// Generate sample data and save to file
export function generateSampleTransactionData(): Transaction[] {
  return generateTransactions({
    numTransactions: 10000,
    initialBalance: 25_000_000, // IDR 25 juta
    seed: 12345,
  });
}
