import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getUserInfo, requestUserRole } from '../lib/contract';
import { ROLES, STATUS_LABELS } from '../lib/enums';

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const [userInfo, setUserInfo] = useState<{ role: string | null, status: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Producer');

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      getUserInfo(address)
        .then(setUserInfo)
        .catch(() => setError('Error loading user info'))
        .finally(() => setLoading(false));
    } else {
      setUserInfo(null);
      setError(null);
    }
  }, [isConnected, address]);

  const handleRequestRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      await requestUserRole(address, selectedRole);
      setUserInfo({ role: selectedRole, status: 'Pending' });
    } catch (err) {
      setError('Error requesting role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold">Home</h2>
      {!isConnected ? (
        <button onClick={connect} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Connect Wallet
        </button>
      ) : loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : userInfo && userInfo.role ? (
        <div>
          <p>Role: {userInfo.role}</p>
          <p>Status: {userInfo.status ? STATUS_LABELS[userInfo.status] || userInfo.status : 'Unknown'}</p>
        </div>
      ) : (
        <form onSubmit={handleRequestRole} className="mt-4">
          <label htmlFor="role" className="block mb-2">Select Role</label>
          <select
            id="role"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="border rounded px-2 py-1 mb-2"
            aria-label="Select Role"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button type="submit" className="ml-2 px-4 py-2 bg-green-600 text-white rounded">
            Request Role
          </button>
        </form>
      )}
    </div>
  );
}
