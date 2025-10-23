import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { getTokenDetails, getUserTokens, type TokenDetails } from '../../lib/contract';
import { UserRole } from '../../lib/enums';
import ActionCard from '../ui/ActionCard';
import CreateRawMaterial from './CreateRawMaterial';
import TransferForm from './TransferForm';

// Role-specific quick actions
export function RoleActions({ role }: { role: UserRole }) {
  switch (role) {
    case UserRole.Producer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CreateRawMaterial />
          <TransferToFactoryCard />
        </div>
      );
    case UserRole.Factory:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Process Materials"
            description="Transform raw materials into products"
            icon="⚙️"
            disabled
          />
          <ActionCard
            title="Transfer to Retailer"
            description="Send processed products to retailers"
            icon="🏪"
            disabled
          />
        </div>
      );
    case UserRole.Retailer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Package Products"
            description="Create retail packages from received products"
            icon="📦"
            disabled
          />
          <ActionCard
            title="Transfer to Consumer"
            description="Sell products to end consumers"
            icon="🛒"
            disabled
          />
        </div>
      );
    case UserRole.Consumer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="View My Products"
            description="See all products you own"
            icon="📋"
            disabled
          />
          <ActionCard
            title="Check Traceability"
            description="View complete product history"
            icon="🔍"
            disabled
          />
        </div>
      );
    case UserRole.Admin:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Manage Users"
            description="Approve or reject user role requests"
            icon="👥"
            link="/admin/users"
          />
          <ActionCard
            title="System Statistics"
            description="View overall system metrics"
            icon="📊"
            disabled
          />
        </div>
      );
    default:
      return null;
  }
}

function TransferToFactoryCard() {
  const { address } = useWallet();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eligible, setEligible] = useState<TokenDetails[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function loadTokens() {
    if (!address) return;
    setLoading(true);
    try {
      const ids = await getUserTokens(address);
      const details = await Promise.all(ids.map((id) => getTokenDetails(id, address)));
      const filtered = (details.filter(Boolean) as TokenDetails[]).filter(
        (t) => t.parentId === 0 && t.balance > 0
      );
      setEligible(filtered);
      setSelectedId(filtered.length ? filtered[0].id : null);
    } finally {
      setLoading(false);
    }
  }

  const handleOpen = () => {
    setOpen(true);
    // fire and forget
    void loadTokens();
  };

  return (
    <ActionCard
      title="Transfer to Factory"
      description="Send materials to processing facilities"
      icon="🏭"
      onClick={open ? undefined : handleOpen}
    >
      {open && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-blue-600">Loading tokens…</div>
          ) : eligible.length === 0 ? (
            <div className="text-sm text-gray-600">No raw tokens with balance available.</div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="transfer-token"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Token
                </label>
                <select
                  id="transfer-token"
                  aria-label="Token"
                  className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedId ?? ''}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                >
                  {eligible.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedId !== null &&
                (() => {
                  const token = eligible.find((t) => t.id === selectedId);
                  return token ? (
                    <TransferForm
                      tokenId={token.id}
                      parentId={token.parentId}
                      balance={token.balance}
                    />
                  ) : null;
                })()}
            </>
          )}
        </div>
      )}
    </ActionCard>
  );
}
