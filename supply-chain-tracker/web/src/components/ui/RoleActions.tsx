import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { createToken, getTokenDetails, getUserTokens, type TokenDetails } from '../../lib/contract';
import { UserRole } from '../../lib/enums';
import TransferForm from '../TransferForm';
import ActionCard from './ActionCard';

// Role-specific quick actions
export function RoleActions({ role }: { role: UserRole }) {
  switch (role) {
    case UserRole.Producer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CreateRawMaterialCard />
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

function CreateRawMaterialCard() {
  const [showForm, setShowForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'none' | 'pending' | 'success' | 'error'>(
    'none'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalSupply: '',
    content: '',
  });

  const handleClick = () => {
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowFeedback('pending');
    setErrorMessage(null);
    try {
      await createToken({
        name: formData.name,
        totalSupply: Number(formData.totalSupply),
        features: JSON.stringify({
          type: 'raw',
          content: formData.content,
        }),
        parentId: 0,
      });
      setShowFeedback('success');
      setTimeout(() => {
        setShowFeedback('none');
        setShowForm(false);
        setFormData({ name: '', totalSupply: '', content: '' });
        setErrorMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error minting token:', error);
      setErrorMessage((error as any)?.message || 'Mint failed');
      setShowFeedback('error');
    }
  };

  return (
    <ActionCard
      title="Create Raw Material"
      description="Register new raw materials in the system"
      icon="🌾"
      onClick={showForm ? undefined : handleClick}
    >
      {showForm && showFeedback === 'none' && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="token-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="token-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Wheat"
            />
          </div>
          <div>
            <label htmlFor="token-supply" className="block text-sm font-medium text-gray-700 mb-1">
              Total Supply
            </label>
            <input
              id="token-supply"
              type="number"
              required
              min="1"
              value={formData.totalSupply}
              onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 500"
            />
          </div>
          <div>
            <label htmlFor="token-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="token-content"
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={3}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the raw material..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Mint
          </button>
        </form>
      )}
      {showFeedback === 'pending' && (
        <div data-testid="minting-feedback" className="mt-3 text-blue-600 text-sm">
          Minting raw material...
        </div>
      )}
      {showFeedback === 'success' && (
        <div data-testid="mint-success" className="mt-3 text-green-600 text-sm">
          Token created!
        </div>
      )}
      {showFeedback === 'error' && errorMessage && (
        <div
          data-testid="mint-error"
          className="mt-3 text-red-600 text-sm"
          role="status"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </ActionCard>
  );
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
