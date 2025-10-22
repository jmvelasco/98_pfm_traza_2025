import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserInfo } from '../../hooks/useUserInfo';
import { useWallet } from '../../hooks/useWallet';
import { changeStatusUser, getUsers, type Users } from '../../lib/contract';
import { UserRole, UserStatus } from '../../lib/enums';

export default function Users() {
  const { address } = useWallet();
  const { userInfo: myInfo } = useUserInfo(address);
  const isAdmin = myInfo?.role === 'Admin';

  const [users, setUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch (e) {
      setError('Error cargando usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (targetAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      await changeStatusUser(targetAddress, UserStatus.Approved);
      await fetchRows();
    } catch (e) {
      setError('Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (targetAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      await changeStatusUser(targetAddress, UserStatus.Rejected);
      await fetchRows();
    } catch (e) {
      setError('Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section>
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="mt-2 text-gray-600">Acceso restringido a administradores.</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </section>
    );
  }

  const nonAdminUsers = users.filter((u) => u.role !== UserRole.Admin);
  return (
    <section>
      <h2 className="text-2xl font-semibold">Users</h2>
      <p className="mt-2 text-gray-600">Gestión de usuarios y sus estados.</p>

      <div className="mt-4">
        <button
          className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
          onClick={fetchRows}
          disabled={loading}
        >
          Refrescar
        </button>
      </div>

      <div className="mt-6 max-w-4xl">
        {loading && <p className="text-gray-500">Cargando…</p>}
        {!loading && users.length === 0 && <p className="text-gray-500">No hay usuarios.</p>}
        {!loading && users.length > 0 && (
          <>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-900 text-left">
                  <th className="p-2 border">Address</th>
                  <th className="p-2 border">Rol</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {nonAdminUsers.map((r) => (
                  <tr key={r.address} className="border-b">
                    <td className="p-2 font-mono text-xs break-all">{r.address}</td>
                    <td className="p-2">{r.role ?? '—'}</td>
                    <td className="p-2">{r.status ?? '—'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-50"
                          onClick={() => handleApprove(r.address)}
                          disabled={loading || r.status === UserStatus.Approved}
                        >
                          Aprobar
                        </button>
                        <button
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                          onClick={() => handleReject(r.address)}
                          disabled={loading || r.status === UserStatus.Rejected}
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link
              to="/dashboard"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
