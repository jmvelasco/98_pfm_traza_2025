import { useState } from 'react';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { requestUserRole } from '../lib/contract';
import { ROLES, STATUS_LABELS, UserRole, UserStatus } from '../lib/enums';


function isValidStatus(status: any): status is UserStatus {
  return Object.values(UserStatus).includes(status);
}

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto my-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
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
      await refetch(); // Refresca el estado tras la transacción
    } catch (err) {
      setSubmitError('Error requesting role');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isAdmin = userInfo?.role === 'Admin';

  return (
    <div>
      <h2 className="text-2xl font-semibold">Home</h2>
      {!isConnected ? (
        <button onClick={connect} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Connect Wallet
        </button>
      ) : loading ? (
        <Spinner />
      ) : error ? (
        <p>Error: {error}</p>
      ) : userInfo && userInfo.role ? (
        <div>
          <p>Role: {userInfo.role}</p>
          <p>Status: {isValidStatus(userInfo.status) ? STATUS_LABELS[userInfo.status] : 'Unknown'}</p>
          {isAdmin && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 font-semibold">👑 Administrator Access</p>
              <p className="text-sm text-blue-600 mt-1">You have full administrative privileges.</p>
              <a href="/admin/users" className="inline-block mt-2 px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 transition-colors font-medium">
                Go to Admin Panel
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleRequestRole} className="mt-4">
          <label htmlFor="role" className="block mb-2 text-gray-700">Select Role</label>
          <select
            id="role"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value as UserRole)}
            className="border border-gray-300 rounded px-3 py-2 mb-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select Role"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value} className="bg-white text-gray-900">{r.label}</option>
            ))}
          </select>
          <button type="submit" className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" disabled={submitLoading}>
            {submitLoading ? 'Requesting...' : 'Request Role'}
          </button>
          {submitError && <p className="text-red-600 mt-2">{submitError}</p>}
        </form>
      )}
    </div>
  );
}
