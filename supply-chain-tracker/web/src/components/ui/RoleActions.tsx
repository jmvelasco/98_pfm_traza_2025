import React, { useState } from 'react';
import { UserRole } from '../../lib/enums';


// Role-specific quick actions
export function RoleActions({ role }: { role: UserRole }) {
  switch (role) {
    case UserRole.Producer:
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCardWithFeedback
            title="Create Raw Material"
            description="Register new raw materials in the system"
            icon="🌾"
          />
          <ActionCard
            title="Transfer to Factory"
            description="Send materials to processing facilities"
            icon="🏭"
            disabled
          />
        </div>
      )
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
      )
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
      )
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
      )
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
      )
    default:
      return null
  }
}


// ActionCard with local feedback for Producer mint action
function ActionCardWithFeedback(props: ActionCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const { title, description, icon, link, disabled } = props;
  const baseClasses = 'bg-white rounded-lg shadow p-6 transition-all';
  const enabledClasses = 'hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500';
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50';

  const handleClick = () => {
    setShowFeedback(true);
    if (props.onClick) props.onClick();
  };

  const content = (
    <>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      {disabled && (
        <span className="inline-block mt-3 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Coming soon</span>
      )}
      {showFeedback && (
        <div data-testid="minting-feedback" className="mt-3 text-blue-600">Minting raw material...</div>
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
    <div
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      onClick={disabled ? undefined : handleClick}
      role={!disabled ? 'button' : undefined}
      tabIndex={!disabled ? 0 : undefined}
      aria-disabled={disabled}
    >
      {content}
    </div>
  );
}

function ActionCard({ title, description, icon, link, disabled, onClick, children }: ActionCardProps & { children?: React.ReactNode }) {
  const baseClasses = 'bg-white rounded-lg shadow p-6 transition-all'
  const enabledClasses =
    'hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500'
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50'

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
      {children}
    </>
  )

  if (link && !disabled) {
    return (
      <a href={link} className={`${baseClasses} ${enabledClasses} block`}>
        {content}
      </a>
    )
  }

  return (
    <div
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
      onClick={disabled ? undefined : onClick}
      role={onClick && !disabled ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-disabled={disabled}
    >
      {content}
    </div>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: string
  link?: string
  disabled?: boolean
  onClick?: () => void
}
