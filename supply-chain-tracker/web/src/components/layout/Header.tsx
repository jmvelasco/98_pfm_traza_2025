import { Link } from 'react-router-dom';
import { WalletConnect } from '../wallet/WalletConnect';
import { SupplyChainWidget } from '../supplyChain/SupplyChainWidget';

export default function Header() {
  // Header shows app title and wallet connect; role-based nav removed.

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          <Link to="/" className="text-gray-900">
            Supply Chain Tracker
          </Link>
        </h1>
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-4 justify-end">
            <WalletConnect />
          </nav>
          <div className="flex justify-end">
            <SupplyChainWidget />
          </div>
        </div>
      </div>
    </header>
  );
}
