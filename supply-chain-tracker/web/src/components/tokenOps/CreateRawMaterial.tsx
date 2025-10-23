import { useState } from 'react';
import { createToken } from '../../lib/contract';
import ActionCard from '../ui/ActionCard';

export default function CreateRawMaterial() {
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
