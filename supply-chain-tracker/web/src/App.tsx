import './App.css'
import { useWeb3 } from './contexts/Web3Provider'

function App() {
  const { provider, signer, contract, address, connect } = useWeb3()

  return (
    <>
      <h1>Supply Chain Tracker</h1>
      {/* Sección de prueba visual Tailwind */}
      <div className="mt-8 p-6 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">TailwindCSS está funcionando 🎉</h2>
        <p className="text-lg">
          Si ves este bloque con fondo degradado y texto blanco, Tailwind está correctamente
          integrado.
        </p>
        <button className="mt-4 px-4 py-2 bg-white text-blue-600 font-semibold rounded shadow hover:bg-blue-100 transition">
          Botón Tailwind
        </button>
      </div>

      {/* Sección de prueba Web3 */}
      <div className="mt-8 p-6 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-teal-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Web3 Context Test 🔗</h2>
        {!address ? (
          <div>
            <p className="mb-4">Conecta tu wallet para probar la integración Web3</p>
            <button
              onClick={connect}
              className="px-6 py-2 bg-white text-green-600 font-semibold rounded shadow hover:bg-green-100 transition"
            >
              Conectar MetaMask
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2">✅ Wallet conectada:</p>
            <p className="font-mono text-sm mb-2">{address}</p>
            <p className="mb-2">Provider: {provider ? '✅' : '❌'}</p>
            <p className="mb-2">Signer: {signer ? '✅' : '❌'}</p>
            <p className="mb-2">Contract: {contract ? '✅' : '❌'}</p>
            {contract && <p className="text-sm">Contract Address: {String(contract.target)}</p>}
          </div>
        )}
      </div>
    </>
  )
}

export default App
