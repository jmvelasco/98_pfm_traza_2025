import { Link } from 'react-router-dom'
import { WalletConnect } from '../wallet/WalletConnect'

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          <Link to="/">Supply Chain Tracker</Link>
        </h1>
        <nav className="flex items-center gap-4">
          <Link to="/admin/users" className="text-sm text-gray-700 hover:underline">
            Admin Users
          </Link>
          <WalletConnect />
        </nav>
      </div>
    </header>
  )
}
