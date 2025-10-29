import { UserRole } from '../../lib/enums';
import ActionCard from '../ui/ActionCard';
import CreateRawMaterial from './CreateRawMaterial';
import PackageProducts from './PackageProducts';
import ProcessMaterials from './ProcessMaterials';
import TransferToConsumer from './TransferToConsumer';
import TransferToFactoryCard from './TransferToFactory';
import TransferToRetailerCard from './TransferToRetailer';

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
          <ProcessMaterials />
          <TransferToRetailerCard />
        </div>
      );
    case UserRole.Retailer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PackageProducts />
          <TransferToConsumer />
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
