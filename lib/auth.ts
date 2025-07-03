import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  portfolio: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  purchasePrice: number;
  blockchain: string;
  purchaseDate: string;
  iconUrl: string;
}

class AuthService {
  private storageKey = 'trado_auth_user';
  private balanceKey = 'trado_user_balance';
  private portfolioKey = 'trado_user_portfolio';

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.storageKey);
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    const balance = this.getBalance();
    const portfolio = this.getPortfolio();
    
    return {
      ...user,
      balance,
      portfolio
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Create user
    const user: User = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      balance: 10000, // Start with 10,000 test tokens
      portfolio: []
    };
    
    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    localStorage.setItem(this.balanceKey, user.balance.toString());
    localStorage.setItem(this.portfolioKey, JSON.stringify(user.portfolio));
    
    return { success: true, user };
  }

  async signup(email: string, password: string, name: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password || !name) {
      return { success: false, error: 'All fields are required' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Create user
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      balance: 10000, // Start with 10,000 test tokens
      portfolio: []
    };
    
    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    localStorage.setItem(this.balanceKey, user.balance.toString());
    localStorage.setItem(this.portfolioKey, JSON.stringify(user.portfolio));
    
    return { success: true, user };
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    // Keep balance and portfolio for when user logs back in
  }

  getBalance(): number {
    if (typeof window === 'undefined') return 0;
    const balance = localStorage.getItem(this.balanceKey);
    return balance ? parseFloat(balance) : 10000;
  }

  updateBalance(newBalance: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.balanceKey, newBalance.toString());
  }

  getPortfolio(): PortfolioItem[] {
    if (typeof window === 'undefined') return [];
    const portfolio = localStorage.getItem(this.portfolioKey);
    return portfolio ? JSON.parse(portfolio) : [];
  }

  updatePortfolio(portfolio: PortfolioItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.portfolioKey, JSON.stringify(portfolio));
  }

  addToPortfolio(item: PortfolioItem): void {
    const portfolio = this.getPortfolio();
    const existingItem = portfolio.find(p => p.id === item.id);
    
    if (existingItem) {
      existingItem.amount += item.amount;
    } else {
      portfolio.push(item);
    }
    
    this.updatePortfolio(portfolio);
  }

  sellFromPortfolio(coinId: string, amountToSell: number): { success: boolean; saleValue?: number; error?: string } {
    const portfolio = this.getPortfolio();
    const coinIndex = portfolio.findIndex(item => item.id === coinId);
    
    if (coinIndex === -1) {
      return { success: false, error: 'Coin not found in portfolio' };
    }
    
    const coin = portfolio[coinIndex];
    
    if (amountToSell > coin.amount) {
      return { success: false, error: 'Insufficient amount to sell' };
    }
    
    const saleValue = amountToSell * coin.price;
    
    // Update user balance
    const currentBalance = this.getBalance();
    this.updateBalance(currentBalance + saleValue);
    
    // Update portfolio
    if (amountToSell === coin.amount) {
      // Remove the coin entirely
      portfolio.splice(coinIndex, 1);
    } else {
      // Reduce the amount
      coin.amount -= amountToSell;
    }
    
    this.updatePortfolio(portfolio);
    
    return { success: true, saleValue };
  }
}

export const authService = new AuthService();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth updates
    const handleAuthUpdate = () => {
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener('auth-update', handleAuthUpdate);
    return () => window.removeEventListener('auth-update', handleAuthUpdate);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      // Force a re-render to update all components
      window.dispatchEvent(new Event('auth-update'));
    }
    return result;
  };

  const signup = async (email: string, password: string, name: string) => {
    const result = await authService.signup(email, password, name);
    if (result.success && result.user) {
      setUser(result.user);
      // Force a re-render to update all components
      window.dispatchEvent(new Event('auth-update'));
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  const sellCoin = (coinId: string, amountToSell: number) => {
    const result = authService.sellFromPortfolio(coinId, amountToSell);
    if (result.success) {
      refreshUser();
    }
    return result;
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
    sellCoin
  };
}