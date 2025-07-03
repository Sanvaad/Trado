// Crypto image utilities for tokens and blockchains

// Blockchain icon fallback mapping with reliable sources
export const BLOCKCHAIN_ICONS: Record<string, { fallback: string; color: string; reliable?: string }> = {
  solana: { fallback: 'SOL', color: '9945FF', reliable: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
  ethereum: { fallback: 'ETH', color: '627EEA', reliable: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
  base: { fallback: 'BASE', color: '0052FF' },
  bsc: { fallback: 'BSC', color: 'F3BA2F', reliable: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' },
  polygon: { fallback: 'MATIC', color: '8247E5', reliable: 'https://cryptologos.cc/logos/polygon-matic-logo.svg' },
  avalanche: { fallback: 'AVAX', color: 'E84142', reliable: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg' },
  pulsechain: { fallback: 'PLS', color: 'DC2626' },
  sui: { fallback: 'SUI', color: '4DA3E0' },
  ton: { fallback: 'TON', color: '0088CC' },
  abstract: { fallback: 'ABS', color: '10B981' },
  hyperevm: { fallback: 'HYPE', color: '6B7280' },
  xrpl: { fallback: 'XRP', color: '23292F' },
  sonic: { fallback: 'SONIC', color: '0EA5E9' }
}

// Removed unused CoinGecko URLs due to 403 errors
// All images now use generated SVG avatars for consistency

export function getBlockchainIcon(blockchainId: string): string {
  const config = BLOCKCHAIN_ICONS[blockchainId]
  if (!config) {
    return generateFallbackAvatar(blockchainId, getColorForSymbol(blockchainId))
  }
  
  // Try reliable source first, then fallback to generated avatar
  return config.reliable || generateFallbackAvatar(config.fallback, config.color)
}

export function getCoinIcon(symbol: string, blockchain?: string): string {
  // Check if we have a reliable source for this coin
  const blockchainConfig = blockchain ? BLOCKCHAIN_ICONS[blockchain] : null
  
  // Use generated avatar with appropriate color
  const color = blockchainConfig?.color || getColorForSymbol(symbol)
  return generateFallbackAvatar(symbol, color)
}


function getColorForSymbol(symbol: string): string {
  // Generate deterministic colors based on symbol
  const colors = [
    '6366f1', // indigo
    'ef4444', // red
    'f59e0b', // amber
    '10b981', // emerald
    '3b82f6', // blue
    '8b5cf6', // violet
    'f97316', // orange
    '06b6d4', // cyan
    'ec4899', // pink
    '84cc16', // lime
    '6b7280', // gray
    'dc2626', // red-600
  ]
  
  // Use symbol's character codes to generate consistent color
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export function generateFallbackAvatar(text: string, backgroundColor = '6366f1'): string {
  const letter = text.charAt(0).toUpperCase()
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="#${backgroundColor}" rx="50%"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${letter}</text>
    </svg>
  `)}`
}