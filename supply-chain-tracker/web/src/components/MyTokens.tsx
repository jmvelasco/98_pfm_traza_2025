import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { CONTRACT_CONFIG } from '../config/contracts'
import { getTokenDetails, getUserTokens, type TokenDetails } from '../lib/contract'
import { SupplyChain__factory } from '../types/factories/SupplyChain__factory'

interface MyTokensProps {
  userAddress: string
}

export default function MyTokens({ userAddress }: MyTokensProps) {
  const [tokens, setTokens] = useState<TokenDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch owned tokens on mount
  useEffect(() => {
    if (!userAddress) {
      setLoading(false)
      return
    }

    async function fetchTokens() {
      try {
        setLoading(true)
        setError(null)

        // Get token IDs owned by user
        const tokenIds = await getUserTokens(userAddress)

        // Fetch details for each token
        const details = await Promise.all(
          tokenIds.map((id) => getTokenDetails(id, userAddress))
        )

        // Filter out nulls and set state
        setTokens(details.filter((t): t is TokenDetails => t !== null))
      } catch (e) {
        console.error('Error fetching tokens:', e)
        setError('Failed to load tokens')
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()
  }, [userAddress])

  // Listen to TokenCreated events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || !userAddress) {
      return
    }

    let provider: ethers.BrowserProvider
    let contract: any

    async function setupEventListener() {
      try {
        provider = new ethers.BrowserProvider(window.ethereum)
        contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider)

        // Listen for TokenCreated events
        const filter = contract.filters.TokenCreated()
        
        contract.on(filter, async (tokenId: any, creator: string) => {
          // Only update if this user created the token
          if (creator.toLowerCase() === userAddress.toLowerCase()) {
            const details = await getTokenDetails(Number(tokenId), userAddress)
            if (details) {
              setTokens((prev) => [...prev, details])
            }
          }
        })
      } catch (e) {
        console.error('Error setting up event listener:', e)
      }
    }

    setupEventListener()

    // Cleanup listener on unmount
    return () => {
      if (contract) {
        contract.removeAllListeners()
      }
    }
  }, [userAddress])

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading tokens...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tokens found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => {
        let parsedFeatures: any = {}
        try {
          parsedFeatures = JSON.parse(token.features)
        } catch {
          // ignore parse errors
        }

        return (
          <div key={token.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-2">{token.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Token ID:</span> {token.id}
              </p>
              <p>
                <span className="font-medium">Balance:</span> {token.balance}
              </p>
              <p>
                <span className="font-medium">Total Supply:</span> {token.totalSupply}
              </p>
              <p>
                <span className="font-medium">Parent ID:</span>{' '}
                {token.parentId === 0 ? 'Raw Material' : token.parentId}
              </p>
              {parsedFeatures.country && (
                <p>
                  <span className="font-medium">Country:</span> {parsedFeatures.country}
                </p>
              )}
              {parsedFeatures.type && (
                <p>
                  <span className="font-medium">Type:</span> {parsedFeatures.type}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
