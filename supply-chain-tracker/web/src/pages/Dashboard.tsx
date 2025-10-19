import { useEffect } from 'react'
import MyTokens from '../components/MyTokens'
import { RoleActions } from '../components/ui/RoleActions'
import Spinner from '../components/ui/Spiner'
import { useUserInfo } from '../hooks/useUserInfo'
import { useWallet } from '../hooks/useWallet'
import { UserRole } from '../lib/enums'

export default function Dashboard() {
  const { address, isConnected } = useWallet()
  const { userInfo, loading, error } = useUserInfo(isConnected ? address : null)

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      window.location.href = '/'
    }
  }, [isConnected])

  if (!isConnected) {
    return null // Will redirect, so render nothing
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    )
  }

  // No role assigned
  if (!userInfo || !userInfo.role) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No role assigned. Please request a role from the home page.</p>
      </div>
    )
  }

  const role = userInfo.role

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-200">{role} Dashboard</h1>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold text-blue-400 mb-4">Quick Actions</h2>
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
      {role !== UserRole.Consumer && (
        <section>
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Pending Transfers</h2>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No pending transfers at the moment.</p>
          </div>
        </section>
      )}
    </div>
  )
}
