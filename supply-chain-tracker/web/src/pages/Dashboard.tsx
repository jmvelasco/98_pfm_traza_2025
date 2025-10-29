import { useEffect, useState } from 'react';
import IncomingTransfers from '../components/tokenOps/IncomingTransfers';
import MyTokens from '../components/tokenOps/MyTokens';
import OutgoingTransfers from '../components/tokenOps/OutgoingTransfers';
import { RoleActions } from '../components/tokenOps/RoleActions';
import { TraceabilityModal } from '../components/traceability/TraceabilityModal';
import Spinner from '../components/ui/Spiner';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { UserRole } from '../lib/enums';

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const { userInfo, loading, error } = useUserInfo(isConnected ? address : null);
  
  // State for TraceabilityModal (Consumer-only)
  const [isTraceabilityModalOpen, setIsTraceabilityModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Handler for opening traceability modal (Consumer-only)
  const handleOpenTraceability = (tokenId: number) => {
    if (role === UserRole.Consumer) {
      setSelectedTokenId(tokenId);
      setIsTraceabilityModalOpen(true);
    }
  };

  // Handler for closing traceability modal
  const handleCloseTraceability = () => {
    setIsTraceabilityModalOpen(false);
    setSelectedTokenId(null);
  };

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      window.location.href = '/';
    }
  }, [isConnected]);

  if (!isConnected) {
    return null; // Will redirect, so render nothing
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    );
  }

  // No role assigned
  if (!userInfo || !userInfo.role) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No role assigned. Please request a role from the home page.</p>
      </div>
    );
  }

  const role = userInfo.role;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-200">{role} Dashboard</h1>

      {role !== UserRole.Consumer && (
        <>
          {/* Quick Actions */}
          <section>
            <RoleActions role={role} />
          </section>

          {/* My Tokens Section */}
          <section>
            <h2 className="text-xl font-semibold text-blue-400 mb-4">My Tokens</h2>
            {address ? (
              <MyTokens userAddress={address} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Connect your wallet to see your tokens.</p>
              </div>
            )}
          </section>

          {/* Pending Transfers Section */}
          <section className="space-y-6">
            {role === UserRole.Producer ? (
              <>
                <OutgoingTransfers showAllStatuses={true} />
              </>
            ) : (
              <>
                <IncomingTransfers />
                <OutgoingTransfers showAllStatuses={true} />
              </>
            )}
          </section>
        </>
      )}

      {role === UserRole.Consumer && (
        <>
          <section>
            <IncomingTransfers />
          </section>
          <section>
            <h2 className="text-xl font-semibold text-blue-400 mb-4">My Products</h2>
            <p className="text-sm text-gray-600 mb-3">Click on any product to view its complete traceability history.</p>
            {address ? (
              <MyTokens userAddress={address} onTokenClick={handleOpenTraceability} isClickable={true} />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Connect your wallet to see your products.</p>
              </div>
            )}
          </section>

          {/* TraceabilityModal for Consumer */}
          {selectedTokenId && (
            <TraceabilityModal
              isOpen={isTraceabilityModalOpen}
              onClose={handleCloseTraceability}
              tokenId={selectedTokenId}
            />
          )}
        </>
      )}
    </div>
  );
}
