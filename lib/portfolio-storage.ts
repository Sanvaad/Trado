"use client";

export interface Transaction {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  type: "buy" | "sell";
  timestamp: Date;
  userId: string;
}

export interface Portfolio {
  [coinId: string]: {
    symbol: string;
    name: string;
    totalAmount: number;
    averagePrice: number;
    transactions: Transaction[];
  };
}

const STORAGE_KEY = "crypto_portfolio";

export function getPortfolio(userId: string): Portfolio {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};

  const allPortfolios = JSON.parse(stored);
  return allPortfolios[userId] || {};
}

export function saveTransaction(transaction: Transaction) {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  const allPortfolios = stored ? JSON.parse(stored) : {};

  if (!allPortfolios[transaction.userId]) {
    allPortfolios[transaction.userId] = {};
  }

  const userPortfolio = allPortfolios[transaction.userId];

  if (!userPortfolio[transaction.coinId]) {
    userPortfolio[transaction.coinId] = {
      symbol: transaction.symbol,
      name: transaction.name,
      totalAmount: 0,
      averagePrice: 0,
      transactions: [],
    };
  }

  const coin = userPortfolio[transaction.coinId];
  coin.transactions.push(transaction);

  // Recalculate totals
  let totalAmount = 0;
  let totalValue = 0;

  coin.transactions.forEach(
    (tx: { type: string; amount: number; price: number }) => {
      if (tx.type === "buy") {
        totalAmount += tx.amount;
        totalValue += tx.amount * tx.price;
      } else {
        totalAmount -= tx.amount;
        totalValue -= tx.amount * tx.price;
      }
    }
  );

  coin.totalAmount = totalAmount;
  coin.averagePrice = totalAmount > 0 ? totalValue / totalAmount : 0;

  // Remove coin if no holdings
  if (totalAmount <= 0) {
    delete userPortfolio[transaction.coinId];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPortfolios));
}

export function getAllTransactions(userId: string): Transaction[] {
  const portfolio = getPortfolio(userId);
  const transactions: Transaction[] = [];

  Object.values(portfolio).forEach((coin) => {
    transactions.push(...coin.transactions);
  });

  return transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
