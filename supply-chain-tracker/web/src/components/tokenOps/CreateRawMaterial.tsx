import { useState } from 'react';
import { createToken } from '../../lib/contract';
import ActionCard from '../ui/ActionCard';

export default function CreateRawMaterial() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
    setLoading(true);
    setMessage('Minting raw material...');
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
      setMessage('Token created!');
      // Reset form after success
      setTimeout(() => {
        setMessage(null);
        setFormData({ name: '', totalSupply: '', content: '' });
      }, 2000);
    } catch (error) {
      console.error('Error minting token:', error);
      setMessage((error as any)?.message || 'Mint failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = message
    ? message === 'Token created!'
      ? 'text-green-600'
      : message === 'Minting raw material...'
        ? 'text-blue-600'
        : 'text-red-600'
    : '';

  return (
    <ActionCard
      title="Create Raw Material"
      description="Mint a new raw material token to your address"
      icon="🌾"
      onClick={showForm ? undefined : handleClick}
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4" noValidate>
          <div>
            <label htmlFor="token-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="token-name"
              type="text"
              value={formData.name}
              disabled={loading}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (message) setMessage(null);
              }}
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
              min="1"
              value={formData.totalSupply}
              disabled={loading}
              onChange={(e) => {
                setFormData({ ...formData, totalSupply: e.target.value });
                if (message) setMessage(null);
              }}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 500"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={formData.content}
              disabled={loading}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value });
                if (message) setMessage(null);
              }}
              rows={3}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Organic wheat from local farm"
            />
          </div>
          {message && (
            <div
              data-testid={
                message === 'Token created!'
                  ? 'mint-success'
                  : message === 'Minting raw material...'
                    ? 'minting-feedback'
                    : 'mint-error'
              }
              className={`text-sm ${statusColor}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={
              loading ||
              !formData.name ||
              !formData.totalSupply ||
              Number(formData.totalSupply) <= 0 ||
              !formData.content
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Minting…' : 'Mint'}
          </button>
        </form>
      )}
    </ActionCard>
  );
}
