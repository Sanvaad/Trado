/* eslint-disable @typescript-eslint/no-unused-vars */
// Define CoinData type locally since @/types/trading doesn't exist
interface CoinData {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number;
  age: string;
  txns: number;
  volume: number;
  makers: number;
  changes: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: number;
  mcap: number;
  blockchain: string;
  iconUrl: string;
  isTopGainer?: boolean;
  isNewPair?: boolean;
}

// Blockchain mapping for DexScreener API (using correct chain IDs)
const BLOCKCHAIN_MAPPING: Record<string, string> = {
  solana: "solana",
  ethereum: "ethereum",
  base: "base",
  bsc: "bsc",
  pulsechain: "pulsechain",
  avalanche: "avalanche",
  sui: "sui",
  polygon: "polygon",
  abstract: "abstract",
  ton: "ton",
  hyperevm: "hyperevm",
  xrpl: "xrpl",
  sonic: "sonic",
};

// Blockchain-specific popular meme tokens
const BLOCKCHAIN_MEME_TOKENS: Record<
  string,
  Array<{ symbol: string; name: string; basePrice: number; contract?: string }>
> = {
  solana: [
    { symbol: "BONK", name: "Bonk", basePrice: 0.000015 },
    { symbol: "WIF", name: "dogwifhat", basePrice: 1.8 },
    { symbol: "POPCAT", name: "Popcat", basePrice: 0.9 },
    { symbol: "MEW", name: "cat in a dogs world", basePrice: 0.007 },
    { symbol: "BOME", name: "BOOK OF MEME", basePrice: 0.008 },
    { symbol: "SLERF", name: "Slerf", basePrice: 0.15 },
    { symbol: "WEN", name: "Wen", basePrice: 0.00008 },
    { symbol: "MYRO", name: "Myro", basePrice: 0.12 },
    { symbol: "PONKE", name: "Ponke", basePrice: 0.45 },
    { symbol: "MICHI", name: "Michi", basePrice: 0.15 },
    { symbol: "MOTHER", name: "MOTHER", basePrice: 0.06 },
    { symbol: "GOAT", name: "Goatseus Maximus", basePrice: 0.8 },
    { symbol: "PNUT", name: "Peanut the Squirrel", basePrice: 1.2 },
    { symbol: "ACT", name: "Act I : The AI Prophecy", basePrice: 0.35 },
    { symbol: "FWOG", name: "FWOG", basePrice: 0.25 },
    { symbol: "CHILLGUY", name: "Just a chill guy", basePrice: 0.18 },
    { symbol: "MOODENG", name: "Moo Deng", basePrice: 0.32 },
    { symbol: "PUMP", name: "Pump", basePrice: 0.08 },
    { symbol: "RETARDIO", name: "Retardio", basePrice: 0.45 },
    { symbol: "DOGGO", name: "Doggo", basePrice: 0.002 },
  ],
  ethereum: [
    { symbol: "PEPE", name: "Pepe", basePrice: 0.000018 },
    { symbol: "SHIB", name: "Shiba Inu", basePrice: 0.000024 },
    { symbol: "FLOKI", name: "FLOKI", basePrice: 0.00018 },
    { symbol: "DOGE", name: "Dogecoin", basePrice: 0.38 },
    { symbol: "TURBO", name: "Turbo", basePrice: 0.006 },
    { symbol: "MEME", name: "Memecoin", basePrice: 0.015 },
    { symbol: "WOJAK", name: "Wojak", basePrice: 0.00001 },
    { symbol: "BABYDOGE", name: "Baby Doge Coin", basePrice: 0.000000003 },
    { symbol: "KISHU", name: "Kishu Inu", basePrice: 0.0000000004 },
    { symbol: "ELON", name: "Dogelon Mars", basePrice: 0.0000002 },
    { symbol: "AKITA", name: "Akita Inu", basePrice: 0.0000001 },
    { symbol: "HOKK", name: "Hokkaidu Inu", basePrice: 0.000000000001 },
    { symbol: "LEASH", name: "Doge Killer", basePrice: 350 },
    { symbol: "BONE", name: "Bone ShibaSwap", basePrice: 0.8 },
    { symbol: "RYOSHI", name: "Ryoshi Token", basePrice: 0.00000001 },
    { symbol: "DOGEZILLA", name: "DogeZilla", basePrice: 0.0000001 },
    { symbol: "HOGE", name: "Hoge Finance", basePrice: 0.00004 },
    { symbol: "PITBULL", name: "Pitbull", basePrice: 0.0000000003 },
    { symbol: "SAFEMOON", name: "SafeMoon", basePrice: 0.00003 },
  ],
  base: [
    { symbol: "BRETT", name: "Brett", basePrice: 0.15 },
    { symbol: "DEGEN", name: "Degen", basePrice: 0.012 },
    { symbol: "TOSHI", name: "Toshi", basePrice: 0.00018 },
    { symbol: "KEYCAT", name: "Keyboard Cat", basePrice: 0.008 },
    { symbol: "NORMIE", name: "Normie", basePrice: 0.025 },
    { symbol: "DOGINME", name: "DOG•IN•ME", basePrice: 0.004 },
    { symbol: "HIGHER", name: "Higher", basePrice: 0.002 },
    { symbol: "MOCHI", name: "Mochi", basePrice: 0.001 },
    { symbol: "CRASH", name: "Crash", basePrice: 0.00003 },
    { symbol: "HONK", name: "Honk", basePrice: 0.000008 },
    { symbol: "BENJI", name: "Benji Bananas", basePrice: 0.0015 },
    { symbol: "MIGGLES", name: "Miggles", basePrice: 0.00045 },
    { symbol: "BALD", name: "Bald", basePrice: 0.00000008 },
    { symbol: "BASED", name: "Based", basePrice: 0.000012 },
    { symbol: "TOBY", name: "Toby", basePrice: 0.00025 },
    { symbol: "MFER", name: "mfer", basePrice: 0.0018 },
    { symbol: "ROCKY", name: "Rocky", basePrice: 0.000035 },
    { symbol: "SPEPE", name: "Super Pepe", basePrice: 0.000002 },
    { symbol: "FOMO", name: "FOMO", basePrice: 0.00008 },
    { symbol: "BANANA", name: "Banana", basePrice: 0.045 },
  ],
  bsc: [
    { symbol: "SAFEMOON", name: "SafeMoon", basePrice: 0.00003 },
    { symbol: "BABYDOGE", name: "Baby Doge Coin", basePrice: 0.000000002 },
    { symbol: "FLOKI", name: "FLOKI", basePrice: 0.00018 },
    { symbol: "KISHU", name: "Kishu Inu", basePrice: 0.0000000005 },
    { symbol: "ELONGATE", name: "ElonGate", basePrice: 0.00000001 },
    { symbol: "REFINABLE", name: "Refinable", basePrice: 0.12 },
    { symbol: "CATGIRL", name: "Catgirl", basePrice: 0.00000008 },
    { symbol: "MOONPIRATE", name: "MoonPirate", basePrice: 0.0000001 },
    { symbol: "CUMROCKET", name: "CumRocket", basePrice: 0.008 },
    { symbol: "SHIBAINU", name: "Shiba Inu BSC", basePrice: 0.000025 },
    { symbol: "DOGEFATHER", name: "The DogeFather", basePrice: 0.0000000008 },
    { symbol: "ULTRASAFE", name: "UltraSafe", basePrice: 0.00000000008 },
    { symbol: "BONFIRE", name: "Bonfire", basePrice: 0.00000001 },
    { symbol: "PORNROCKET", name: "PornRocket", basePrice: 0.00000008 },
    { symbol: "ECLIPSE", name: "Eclipse", basePrice: 0.00000003 },
    { symbol: "MINIDOGE", name: "Mini Doge", basePrice: 0.0000000001 },
    { symbol: "MOONSHOT", name: "MoonShot", basePrice: 0.000000005 },
    { symbol: "SAFEGALAXY", name: "SafeGalaxy", basePrice: 0.00000000002 },
    { symbol: "FAIRMOON", name: "FairMoon", basePrice: 0.000000001 },
    { symbol: "MOONTOKEN", name: "MoonToken", basePrice: 0.0000008 },
  ],
  polygon: [
    { symbol: "WMATIC", name: "Wrapped Matic", basePrice: 0.45 },
    { symbol: "QUICK", name: "QuickSwap", basePrice: 0.08 },
    { symbol: "GHST", name: "Aavegotchi", basePrice: 1.2 },
    { symbol: "POLYDOGE", name: "PolyDoge", basePrice: 0.0000000008 },
    { symbol: "POLYSHIB", name: "PolyShib", basePrice: 0.000000001 },
    { symbol: "PMOON", name: "PolyMoon", basePrice: 0.00000002 },
    { symbol: "PINU", name: "Polygon Inu", basePrice: 0.0000008 },
    { symbol: "PDOGE", name: "Polygon Doge", basePrice: 0.000000005 },
    { symbol: "PSHIB", name: "Polygon Shib", basePrice: 0.0000000008 },
    { symbol: "PPEPE", name: "Polygon Pepe", basePrice: 0.000000002 },
    { symbol: "PCAT", name: "Polygon Cat", basePrice: 0.00000001 },
    { symbol: "PWOLF", name: "Polygon Wolf", basePrice: 0.000000008 },
    { symbol: "PBIRD", name: "Polygon Bird", basePrice: 0.0000000005 },
    { symbol: "PFISH", name: "Polygon Fish", basePrice: 0.00000003 },
    { symbol: "PTIGER", name: "Polygon Tiger", basePrice: 0.000000001 },
    { symbol: "PLION", name: "Polygon Lion", basePrice: 0.0000000008 },
    { symbol: "PBEАР", name: "Polygon Bear", basePrice: 0.000000002 },
    { symbol: "PPANDA", name: "Polygon Panda", basePrice: 0.0000000003 },
    { symbol: "PMONKEY", name: "Polygon Monkey", basePrice: 0.000000001 },
    { symbol: "PELEPHANT", name: "Polygon Elephant", basePrice: 0.0000000005 },
  ],
  avalanche: [
    { symbol: "HUSKY", name: "Husky", basePrice: 0.000002 },
    { symbol: "SNOWDOG", name: "SnowDog", basePrice: 0.00000008 },
    { symbol: "AVAXDOGE", name: "AVAX Doge", basePrice: 0.0000001 },
    { symbol: "BLIZZ", name: "Blizzard", basePrice: 0.000008 },
    { symbol: "YETI", name: "Yeti", basePrice: 0.00003 },
    { symbol: "FLAKE", name: "Snowflake", basePrice: 0.000001 },
    { symbol: "POWDER", name: "Powder", basePrice: 0.000005 },
    { symbol: "FROST", name: "Frost", basePrice: 0.00001 },
    { symbol: "CHILL", name: "Chill", basePrice: 0.000003 },
    { symbol: "GLACIER", name: "Glacier", basePrice: 0.000007 },
    { symbol: "AVALANCHE", name: "Avalanche Meme", basePrice: 0.00002 },
    { symbol: "STORM", name: "Storm", basePrice: 0.000004 },
    { symbol: "WINTER", name: "Winter", basePrice: 0.000006 },
    { symbol: "PEAK", name: "Peak", basePrice: 0.00001 },
    { symbol: "SLOPE", name: "Slope", basePrice: 0.000002 },
    { symbol: "SUMMIT", name: "Summit", basePrice: 0.000009 },
    { symbol: "RIDGE", name: "Ridge", basePrice: 0.000001 },
    { symbol: "ALPINE", name: "Alpine", basePrice: 0.000005 },
    { symbol: "TUNDRA", name: "Tundra", basePrice: 0.000003 },
    { symbol: "ARCTIC", name: "Arctic", basePrice: 0.000008 },
  ],
  sui: [
    { symbol: "SUI-DOGE", name: "Sui Doge", basePrice: 0.000001 },
    { symbol: "WAVE", name: "Wave", basePrice: 0.00002 },
    { symbol: "FLOW", name: "Flow", basePrice: 0.000005 },
    { symbol: "STREAM", name: "Stream", basePrice: 0.000003 },
    { symbol: "RIVER", name: "River", basePrice: 0.000007 },
    { symbol: "OCEAN", name: "Ocean", basePrice: 0.00001 },
    { symbol: "TIDE", name: "Tide", basePrice: 0.000004 },
    { symbol: "CURRENT", name: "Current", basePrice: 0.000006 },
    { symbol: "SPLASH", name: "Splash", basePrice: 0.000002 },
    { symbol: "BUBBLE", name: "Bubble", basePrice: 0.000008 },
    { symbol: "PEARL", name: "Pearl", basePrice: 0.00003 },
    { symbol: "CORAL", name: "Coral", basePrice: 0.00001 },
    { symbol: "SHELL", name: "Shell", basePrice: 0.000005 },
    { symbol: "FISH", name: "Fish", basePrice: 0.000003 },
    { symbol: "WHALE", name: "Whale", basePrice: 0.00002 },
    { symbol: "DOLPHIN", name: "Dolphin", basePrice: 0.000007 },
    { symbol: "SHARK", name: "Shark", basePrice: 0.000009 },
    { symbol: "CRAB", name: "Crab", basePrice: 0.000001 },
    { symbol: "SQUID", name: "Squid", basePrice: 0.000004 },
    { symbol: "OCTOPUS", name: "Octopus", basePrice: 0.000006 },
  ],
  pulsechain: [
    { symbol: "HEX", name: "HEX", basePrice: 0.008 },
    { symbol: "PULSE", name: "Pulse", basePrice: 0.00001 },
    { symbol: "PLSX", name: "PulseX", basePrice: 0.000003 },
    { symbol: "INC", name: "Incentive", basePrice: 0.000001 },
    { symbol: "HEART", name: "Heart", basePrice: 0.000005 },
    { symbol: "BEAT", name: "Beat", basePrice: 0.000002 },
    { symbol: "RHYTHM", name: "Rhythm", basePrice: 0.000007 },
    { symbol: "TEMPO", name: "Tempo", basePrice: 0.000004 },
    { symbol: "VIBE", name: "Vibe", basePrice: 0.000006 },
    { symbol: "ENERGY", name: "Energy", basePrice: 0.000003 },
    { symbol: "POWER", name: "Power", basePrice: 0.000008 },
    { symbol: "FORCE", name: "Force", basePrice: 0.000001 },
    { symbol: "STRENGTH", name: "Strength", basePrice: 0.000009 },
    { symbol: "MIGHT", name: "Might", basePrice: 0.000002 },
    { symbol: "VIGOR", name: "Vigor", basePrice: 0.000005 },
    { symbol: "SPIRIT", name: "Spirit", basePrice: 0.000007 },
    { symbol: "SOUL", name: "Soul", basePrice: 0.000004 },
    { symbol: "MIND", name: "Mind", basePrice: 0.000006 },
    { symbol: "BODY", name: "Body", basePrice: 0.000003 },
    { symbol: "LIFE", name: "Life", basePrice: 0.00001 },
  ],
  ton: [
    { symbol: "DOGS", name: "Dogs", basePrice: 0.000008 },
    { symbol: "NOT", name: "Notcoin", basePrice: 0.008 },
    { symbol: "HMSTR", name: "Hamster", basePrice: 0.003 },
    { symbol: "CAT", name: "Cat", basePrice: 0.000005 },
    { symbol: "FISH", name: "Fish", basePrice: 0.000002 },
    { symbol: "BIRD", name: "Bird", basePrice: 0.000007 },
    { symbol: "MOUSE", name: "Mouse", basePrice: 0.000001 },
    { symbol: "RABBIT", name: "Rabbit", basePrice: 0.000004 },
    { symbol: "BEAR", name: "Bear", basePrice: 0.000009 },
    { symbol: "WOLF", name: "Wolf", basePrice: 0.000006 },
    { symbol: "FOX", name: "Fox", basePrice: 0.000003 },
    { symbol: "TIGER", name: "Tiger", basePrice: 0.00001 },
    { symbol: "LION", name: "Lion", basePrice: 0.000008 },
    { symbol: "ELEPHANT", name: "Elephant", basePrice: 0.000002 },
    { symbol: "MONKEY", name: "Monkey", basePrice: 0.000005 },
    { symbol: "PANDA", name: "Panda", basePrice: 0.000007 },
    { symbol: "KOALA", name: "Koala", basePrice: 0.000004 },
    { symbol: "SLOTH", name: "Sloth", basePrice: 0.000001 },
    { symbol: "PENGUIN", name: "Penguin", basePrice: 0.000006 },
    { symbol: "WHALE", name: "Whale", basePrice: 0.000009 },
  ],
};

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export class MemeCoinAPI {
  private baseUrl = "https://api.dexscreener.com/latest/dex";

  async getTopPairsByChain(
    chainId: string,
    limit: number = 20
  ): Promise<CoinData[]> {
    try {
      const mappedChain = BLOCKCHAIN_MAPPING[chainId] || chainId;

      // Use DexScreener API directly for accurate pricing
      const response = await fetch(
        `${this.baseUrl}/pairs/${mappedChain}?limit=${limit}`,
        {
          headers: {
            "User-Agent": "Trado/1.0",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`DexScreener API failed: ${response.statusText}`);
      }

      const data: DexScreenerResponse = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        const filteredPairs = data.pairs
          .filter((pair) => pair.chainId === mappedChain && pair.priceUsd)
          .slice(0, limit);

        if (filteredPairs.length > 0) {
          console.log(`📊 Using DexScreener data for ${chainId}`);
          return this.transformPairsToCoins(filteredPairs, chainId);
        }
      }

      throw new Error("No valid pairs found");
    } catch (error) {
      console.error(`Error fetching ${chainId} data:`, error);
      console.log(`⚠️ Falling back to mock data for ${chainId}`);
      return this.getFallbackData(chainId, limit);
    }
  }

  async searchPairs(query: string, chainId?: string): Promise<CoinData[]> {
    try {
      const url = chainId
        ? `${this.baseUrl}/search/?q=${encodeURIComponent(query)}&chain=${BLOCKCHAIN_MAPPING[chainId] || chainId}`
        : `${this.baseUrl}/search/?q=${encodeURIComponent(query)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: DexScreenerResponse = await response.json();

      return this.transformPairsToCoins(
        data.pairs.slice(0, 20),
        chainId || "solana"
      );
    } catch (error) {
      console.error("Error searching pairs:", error);
      return [];
    }
  }

  private transformPairsToCoins(
    pairs: DexScreenerPair[],
    blockchain: string
  ): CoinData[] {
    return pairs.map((pair, index) => ({
      id: pair.pairAddress,
      rank: index + 1,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: parseFloat(pair.priceUsd || "0"), // Use only USD price for consistency
      age: this.calculateAge(pair.pairCreatedAt),
      txns: (pair.txns.h24?.buys || 0) + (pair.txns.h24?.sells || 0),
      volume: pair.volume.h24 / 1000000, // Convert to millions
      makers: Math.floor(
        ((pair.txns.h24?.buys || 0) + (pair.txns.h24?.sells || 0)) * 0.3
      ), // Estimate makers
      changes: {
        m5: pair.priceChange.m5 || 0,
        h1: pair.priceChange.h1 || 0,
        h6: pair.priceChange.h6 || 0,
        h24: pair.priceChange.h24 || 0,
      },
      liquidity: (pair.liquidity?.usd || 0) / 1000, // Convert to thousands
      mcap: (pair.marketCap || pair.fdv || 0) / 1000000, // Convert to millions
      blockchain,
      iconUrl: "",
      isTopGainer: pair.priceChange.h24 > 50,
      isNewPair: this.isNewPair(pair.pairCreatedAt),
    }));
  }

  private calculateAge(createdAt?: number): string {
    if (!createdAt) return "Unknown";

    const now = Date.now();
    const created = createdAt * 1000; // Convert to milliseconds
    const diffMs = now - created;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  private isNewPair(createdAt?: number): boolean {
    if (!createdAt) return false;
    const now = Date.now();
    const created = createdAt * 1000;
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours <= 24; // Consider pairs created in last 24h as new
  }

  private getRealTimeData(_blockchain: string, _limit: number): CoinData[] {
    try {
      // Get real-time price data from our blockchain price feeds
      // Return empty array since blockchain price feeds are not available
      return [];
    } catch (error) {
      console.error("Error getting real-time data:", error);
      return [];
    }
  }

  private getFallbackData(blockchain: string, limit: number): CoinData[] {
    // Get blockchain-specific tokens or fall back to Solana tokens
    const blockchainTokens =
      BLOCKCHAIN_MEME_TOKENS[blockchain] || BLOCKCHAIN_MEME_TOKENS.solana;

    return blockchainTokens.slice(0, limit).map((coin, index) => ({
      id: `${blockchain}-${coin.symbol}-${index}`,
      rank: index + 1,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.basePrice * (1 + (Math.random() - 0.5) * 0.1),
      age: `${Math.floor(Math.random() * 30) + 1}d`,
      txns: Math.floor(Math.random() * 50000) + 1000,
      volume: Math.random() * 10 + 0.1,
      makers: Math.floor(Math.random() * 5000) + 100,
      changes: {
        m5: (Math.random() - 0.5) * 20,
        h1: (Math.random() - 0.5) * 40,
        h6: (Math.random() - 0.5) * 80,
        h24: (Math.random() - 0.5) * 200,
      },
      liquidity: Math.random() * 500 + 50,
      mcap: Math.random() * 100 + 1,
      blockchain,
      iconUrl: "",
      isTopGainer: Math.random() > 0.8,
      isNewPair: Math.random() > 0.9,
    }));
  }
}

export const memeCoinAPI = new MemeCoinAPI();
