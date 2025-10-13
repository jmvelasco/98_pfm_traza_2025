import { ethers } from 'ethers'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { CONTRACT_CONFIG } from '../config/contracts'
import type { SupplyChain } from '../types/SupplyChain' // TypeChain types

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any
  }
}

type Web3ContextType = {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  contract: SupplyChain | null
  address: string | null
  connect: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<SupplyChain | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  // Conectar a MetaMask
  const connect = async () => {
    if (!window.ethereum) {
      alert('MetaMask no está instalado')
      return
    }
    const browserProvider = new ethers.BrowserProvider(window.ethereum)
    setProvider(browserProvider)
    const signer = await browserProvider.getSigner()
    setSigner(signer)
    setAddress(await signer.getAddress())

    // Instanciar el contrato con TypeChain
    const contractInstance = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_CONFIG.abi,
      signer
    ) as unknown as SupplyChain
    setContract(contractInstance)
  }

  // Conectar automáticamente si MetaMask ya está autorizado
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) connect()
      })
    }
    // eslint-disable-next-line
  }, [])

  return (
    <Web3Context.Provider value={{ provider, signer, contract, address, connect }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 debe usarse dentro de Web3Provider')
  return ctx
}
