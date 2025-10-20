import React, { useState } from 'react'
import { createToken } from '../../lib/contract'
import { UserRole } from '../../lib/enums'

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
  const [showForm, setShowForm] = useState(false)
  const [showFeedback, setShowFeedback] = useState<'none' | 'pending' | 'success'>('none')
  const [formData, setFormData] = useState({
    name: '',
    totalSupply: '',
    content: '',
  })
  const { title, description, icon, link, disabled } = props
  const baseClasses = 'bg-white rounded-lg shadow p-6 transition-all'
  const enabledClasses =
    'hover:shadow-lg cursor-pointer border-2 border-transparent hover:border-blue-500'
  const disabledClasses = 'opacity-60 cursor-not-allowed bg-gray-50'

  const handleClick = () => {
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowFeedback('pending')
    try {
      await createToken({
        name: formData.name,
        totalSupply: Number(formData.totalSupply),
        features: JSON.stringify({
          type: 'raw',
          content: formData.content,
        }),
        parentId: 0,
      })
      setShowFeedback('success')
      setTimeout(() => {
        setShowFeedback('none')
        setShowForm(false)
        setFormData({ name: '', totalSupply: '', content: '' })
      }, 2000)
    } catch (error) {
      console.error('Error minting token:', error)
      setShowFeedback('none')
    }
    if (props.onClick) props.onClick()
  }

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
        <div data-testid="minting-feedback" className="mt-3 text-blue-600">
          Minting raw material...
        </div>
      )}
      {showFeedback === 'success' && (
        <div data-testid="mint-success" className="mt-3 text-green-600">
          Token created!
        </div>
      )}
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
      onClick={disabled || showForm ? undefined : handleClick}
      role={!disabled && !showForm ? 'button' : undefined}
      tabIndex={!disabled && !showForm ? 0 : undefined}
      aria-disabled={disabled}
    >
      {content}
    </div>
  )
}

function ActionCard({
  title,
  description,
  icon,
  link,
  disabled,
  onClick,
  children,
}: ActionCardProps & { children?: React.ReactNode }) {
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
