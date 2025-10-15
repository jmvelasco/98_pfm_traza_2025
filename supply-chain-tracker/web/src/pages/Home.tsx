
import { useState } from 'react';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { requestUserRole } from '../lib/contract';
import { ROLES, STATUS_LABELS } from '../lib/enums';


export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const { userInfo, loading, error } = useUserInfo(isConnected ? address : null);
  const [selectedRole, setSelectedRole] = useState('Producer');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleRequestRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await requestUserRole(address, selectedRole);
      // No actualizamos userInfo aquí, el hook lo recargará automáticamente si se implementa polling/refetch
    } catch (err) {
      setSubmitError('Error requesting role');
    } finally {
      setSubmitLoading(false);
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
          <button type="submit" className="ml-2 px-4 py-2 bg-green-600 text-white rounded" disabled={submitLoading}>
            {submitLoading ? 'Requesting...' : 'Request Role'}
          </button>
          {submitError && <p className="text-red-600 mt-2">{submitError}</p>}
        </form>
      )}
    </div>
  );
}
