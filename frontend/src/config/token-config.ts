// Token Configuration File
// Update this file when the token is launched

export const tokenConfig = {
  // Contract Address - Update this when token is deployed
  contractAddress: 'FWo1Uf63592N6LwfngytUFaaM5n1ZYs1afi9cwmRpump', // Leave empty until launch, then add: '0x...'
  
  // Token Details
  tokenSymbol: 'KRYPT',
  tokenName: 'Krypt Terminal',
  decimals: 18,
  
  // Network Configuration
  chainId: 1, // 1 for Ethereum mainnet
  chainName: 'Ethereum',
  
  // Display Settings
  showContractAddress: True, // Set to true when token launches
  explorerUrl: 'https://etherscan.io/token/', // Will append contract address
  
  // Launch Date (for countdown)
  launchDate: '', // Format: 'YYYY-MM-DD HH:MM:SS' (UTC)
  
  // DEX Links (update when available)
  dexLinks: {
    pumpfun: 'https://pump.fun/coin/FWo1Uf63592N6LwfngytUFaaM5n1ZYs1afi9cwmRpump', // Pump.fun token URL - add this first
    uniswap: '',
    sushiswap: '',
    pancakeswap: '',
  },
  
  // Social Links for Token
  socialLinks: {
    dextools: '',
    dexscreener: '',
    coingecko: '',
    coinmarketcap: '',
  }
}

// Helper function to get formatted contract address
export const getContractAddress = () => {
  if (!tokenConfig.contractAddress || !tokenConfig.showContractAddress) {
    return null
  }
  return tokenConfig.contractAddress
}

// Helper function to get explorer URL
export const getExplorerUrl = () => {
  if (!tokenConfig.contractAddress) return null
  return `${tokenConfig.explorerUrl}${tokenConfig.contractAddress}`
}
