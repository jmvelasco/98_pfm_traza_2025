import { useState } from 'react';
import { GoToDashboard } from '../components/ui/GoToDashboard';
import Spinner from '../components/ui/Spiner';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { requestUserRole } from '../lib/contract';
import { ROLES, STATUS_LABELS, UserRole, UserStatus } from '../lib/enums';

function isValidStatus(status: unknown): status is UserStatus {
  return Object.values(UserStatus).includes(status as UserStatus);
}

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const { userInfo, loading, error, refetch } = useUserInfo(isConnected ? address : null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(ROLES[0].value);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleRequestRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await requestUserRole(address, selectedRole);
      await refetch();
    } catch (error) {
      console.error(error);
      setSubmitError('Error requesting role');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <button onClick={connect} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Connect Wallet
      </button>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Home</h2>
      {userInfo && userInfo.role ? (
        <div>
          <p>Role: {userInfo.role}</p>
          <p>
            Status: {isValidStatus(userInfo.status) ? STATUS_LABELS[userInfo.status] : 'Unknown'}
          </p>
          <GoToDashboard />
        </div>
      ) : (
        <form onSubmit={handleRequestRole} className="mt-4">
          <label htmlFor="role" className="block mb-2 text-gray-700">
            Select Role
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="border border-gray-300 rounded px-3 py-2 mb-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select Role"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-white text-gray-900">
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            disabled={submitLoading}
          >
            {submitLoading ? 'Requesting...' : 'Request Role'}
          </button>
          {submitError && <p className="text-red-600 mt-2">{submitError}</p>}
        </form>
      )}
    </div>
  );
}
