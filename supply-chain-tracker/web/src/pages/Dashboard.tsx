import { useEffect } from 'react';
import Spinner from '../components/ui/Spiner';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWallet } from '../hooks/useWallet';
import { UserRole } from '../lib/enums';

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const { userInfo, loading, error } = useUserInfo(isConnected ? address : null);

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

  // Role-specific quick actions
  const getRoleActions = () => {
    switch (role) {
      case UserRole.Producer:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Create Raw Material"
              description="Register new raw materials in the system"
              icon="🌾"
              disabled
            />
            <ActionCard
              title="Transfer to Factory"
              description="Send materials to processing facilities"
              icon="🏭"
              disabled
            />
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        {role} Dashboard
      </h1>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
        {getRoleActions()}
      </section>

      {/* My Tokens Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">My Tokens</h2>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No tokens yet. Create or receive tokens to see them here.</p>
        </div>
      </section>

      {/* Pending Transfers Section */}
      {role !== UserRole.Consumer && (
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending Transfers</h2>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No pending transfers at the moment.</p>
          </div>
        </section>
      )}
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  link?: string;
  disabled?: boolean;
}

function ActionCard({ title, description, icon, link, disabled }: ActionCardProps) {
  const baseClasses = "bg-white rounded-lg shadow p-6 transition-all";
  const enabledClasses = "hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500";
  const disabledClasses = "opacity-60 cursor-not-allowed bg-gray-50";

  const content = (
    <>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {disabled && (
        <span className="inline-block mt-3 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
          Coming soon
        </span>
      )}
    </>
  );

  if (link && !disabled) {
    return (
      <a href={link} className={`${baseClasses} ${enabledClasses} block`}>
        {content}
      </a>
    );
  }

  return (
    <div className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}>
      {content}
    </div>
  );
}
