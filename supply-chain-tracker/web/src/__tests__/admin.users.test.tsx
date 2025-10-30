import { render, screen, waitFor } from '@testing-library/react';import { render, screen, waitFor } from '@testing-library/react';import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { MemoryRouter } from 'react-router-dom';import userEvent from '@testing-library/user-event';import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserManagement } from '../components/admin/UserManagement';import { MemoryRouter } from 'react-router-dom';import { MemoryRouter } from 'react-router-dom';



vi.mock('../hooks/useWallet', () => ({import { beforeEach, describe, expect, it, vi } from 'vitest';import { beforeEach, describe, expect, it, vi } from 'vitest';

  useWallet: vi.fn(),

}));import { UserManagement } from '../components/admin/UserManagement';import { UserManagement } from '../components/admin/UserManagement';



vi.mock('../hooks/useUserInfo', () => ({

  useUserInfo: vi.fn(),

}));vi.mock('../hooks/useWallet', () => ({vi.mock('../hooks/useWallet', () => ({



vi.mock('../lib/contract', () => ({  useWallet: vi.fn(),  useWallet: vi.fn(),

  changeStatusUser: vi.fn(),

  getUserInfo: vi.fn(),}));}));

  getUsers: vi.fn(),

}));



import { useUserInfo } from '../hooks/useUserInfo';vi.mock('../hooks/useUserInfo', () => ({vi.mock('../hooks/useUserInfo', () => ({

import { useWallet } from '../hooks/useWallet';

import { changeStatusUser, getUsers } from '../lib/contract';  useUserInfo: vi.fn(),  useUserInfo: vi.fn(),

import { UserStatus } from '../lib/enums';

}));}));

describe('Admin Users Page', () => {

  beforeEach(() => {

    vi.clearAllMocks();

  });vi.mock('../lib/contract', () => ({vi.mock('../lib/contract', () => ({



  it('denies access to non-admin users', () => {  changeStatusUser: vi.fn(),  changeStatusUser: vi.fn(),

    vi.mocked(useWallet).mockReturnValue({

      address: '0xUser',  getUserInfo: vi.fn(),  getUserInfo: vi.fn(),

      isConnected: true,

      chainId: 31337,  getUsers: vi.fn(),  getUsers: vi.fn(),

      networkName: 'Anvil',

      connect: vi.fn(),}));}));

      getBalance: vi.fn(),

      switchNetwork: vi.fn(),

      getCurrentNetwork: vi.fn(),

    } as any);import { useUserInfo } from '../hooks/useUserInfo';import { useUserInfo } from '../hooks/useUserInfo';



    // Non-admin user infoimport { useWallet } from '../hooks/useWallet';import { useWallet } from '../hooks/useWallet';

    vi.mocked(useUserInfo).mockReturnValue({

      userInfo: { role: 'Producer', status: UserStatus.Approved },import { changeStatusUser, getUsers, type Users } from '../lib/contract';import { changeStatusUser, getUsers } from '../lib/contract';

      loading: false,

      error: null,import { UserStatus } from '../lib/enums';import { UserStatus } from '../lib/enums';

      refetch: vi.fn(),

    });



    render(describe('Admin Users Page', () => {describe('Admin Users Page', () => {

      <MemoryRouter>

        <UserManagement />  beforeEach(() => {  beforeEach(() => {

      </MemoryRouter>

    );    vi.clearAllMocks();    vi.clearAllMocks();



    expect(screen.getByText(/Acceso restringido a administradores/i)).toBeInTheDocument();  });  });

    expect(screen.queryByLabelText(/Dirección de usuario/i)).not.toBeInTheDocument();

  });



  it('lists users with different statuses (pending and approved)', async () => {  it('denies access to non-admin users', () => {  it('denies access to non-admin users', () => {

    vi.mocked(useWallet).mockReturnValue({

      address: '0xAdmin',    vi.mocked(useWallet).mockReturnValue({    vi.mocked(useWallet).mockReturnValue({

      isConnected: true,

      chainId: 31337,      address: '0xUser',      address: '0xUser',

      networkName: 'Anvil',

      connect: vi.fn(),      isConnected: true,      isConnected: true,

      getBalance: vi.fn(),

      switchNetwork: vi.fn(),      chainId: 31337,      chainId: 31337,

      getCurrentNetwork: vi.fn(),

    } as any);      networkName: 'Anvil',      networkName: 'Anvil',



    // Current user is Admin      connect: vi.fn(),      connect: vi.fn(),

    vi.mocked(useUserInfo).mockReturnValue({

      userInfo: { role: 'Admin', status: UserStatus.Approved },      getBalance: vi.fn(),      getBalance: vi.fn(),

      loading: false,

      error: null,      switchNetwork: vi.fn(),      switchNetwork: vi.fn(),

      refetch: vi.fn(),

    });      getCurrentNetwork: vi.fn(),      getCurrentNetwork: vi.fn(),



    const users = [    });    } as any);

      {

        address: '0x1111111111111111111111111111111111111111',

        role: 'Producer',

        status: UserStatus.Pending,    // Non-admin user info    // Non-admin user info

      },

      {    vi.mocked(useUserInfo).mockReturnValue({    vi.mocked(useUserInfo).mockReturnValue({

        address: '0x2222222222222222222222222222222222222222',

        role: 'Factory',      userInfo: { role: 'Producer', status: UserStatus.Approved },      userInfo: { role: 'Producer', status: UserStatus.Approved },

        status: UserStatus.Approved,

      },      loading: false,      loading: false,

      {

        address: '0x3333333333333333333333333333333333333333',      error: null,      error: null,

        role: 'Retailer',

        status: UserStatus.Rejected,      refetch: vi.fn(),      refetch: vi.fn(),

      },

    ];    });    });

    vi.mocked(getUsers).mockResolvedValue(users as any);

    vi.mocked(changeStatusUser).mockResolvedValue(undefined);



    render(    render(    render(

      <MemoryRouter>

        <UserManagement />      <MemoryRouter>      <MemoryRouter>

      </MemoryRouter>

    );        <UserManagement />        <Users />



    // Should list all users with different statuses      </MemoryRouter>      </MemoryRouter>

    expect(

      await screen.findByText('0x1111111111111111111111111111111111111111')    );    );

    ).toBeInTheDocument();

    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument();

    expect(screen.getByText('0x3333333333333333333333333333333333333333')).toBeInTheDocument();

    expect(screen.getByText(/Acceso restringido a administradores/i)).toBeInTheDocument();    expect(screen.getByText(/Acceso restringido a administradores/i)).toBeInTheDocument();

    // Should show all statuses

    expect(screen.getByText('Pending')).toBeInTheDocument();    expect(screen.queryByLabelText(/Dirección de usuario/i)).not.toBeInTheDocument();    expect(screen.queryByLabelText(/Dirección de usuario/i)).not.toBeInTheDocument();

    expect(screen.getByText('Approved')).toBeInTheDocument();

    expect(screen.getByText('Rejected')).toBeInTheDocument();  });  });



    // Approve button should be disabled for already approved user

    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i });

    expect(approveButtons[1]).toBeDisabled(); // The approved user's button  it('lists users with different statuses (pending and approved)', async () => {  it('lists users with different statuses (pending and approved)', async () => {

    expect(approveButtons[0]).not.toBeDisabled(); // The pending user's button

    vi.mocked(useWallet).mockReturnValue({    vi.mocked(useWallet).mockReturnValue({

    // Reject button should be disabled for already rejected user

    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });      address: '0xAdmin',      address: '0xAdmin',

    expect(rejectButtons[2]).toBeDisabled(); // The rejected user's button

    expect(rejectButtons[0]).not.toBeDisabled(); // The pending user's button      isConnected: true,      isConnected: true,

  });

      chainId: 31337,      chainId: 31337,

  it('allows approving a pending user and refetches list', async () => {

    vi.mocked(useWallet).mockReturnValue({      networkName: 'Anvil',      networkName: 'Anvil',

      address: '0xAdmin',

      isConnected: true,      connect: vi.fn(),      connect: vi.fn(),

      chainId: 31337,

      networkName: 'Anvil',      getBalance: vi.fn(),      getBalance: vi.fn(),

      connect: vi.fn(),

      getBalance: vi.fn(),      switchNetwork: vi.fn(),      switchNetwork: vi.fn(),

      switchNetwork: vi.fn(),

      getCurrentNetwork: vi.fn(),      getCurrentNetwork: vi.fn(),      getCurrentNetwork: vi.fn(),

    } as any);

    });    } as any);

    vi.mocked(useUserInfo).mockReturnValue({

      userInfo: { role: 'Admin', status: UserStatus.Approved },

      loading: false,

      error: null,    // Current user is Admin    // Current user is Admin

      refetch: vi.fn(),

    });    vi.mocked(useUserInfo).mockReturnValue({    vi.mocked(useUserInfo).mockReturnValue({



    const initialUsers = [      userInfo: { role: 'Admin', status: UserStatus.Approved },      userInfo: { role: 'Admin', status: UserStatus.Approved },

      {

        address: '0x1111111111111111111111111111111111111111',      loading: false,      loading: false,

        role: 'Producer',

        status: UserStatus.Pending,      error: null,      error: null,

      },

    ];      refetch: vi.fn(),      refetch: vi.fn(),

    const updatedUsers = [

      {    });    });

        address: '0x1111111111111111111111111111111111111111',

        role: 'Producer',

        status: UserStatus.Approved,

      },    const users: Users[] = [    const users = [

    ];

      {      {

    vi.mocked(getUsers)

      .mockResolvedValueOnce(initialUsers as any)        address: '0x1111111111111111111111111111111111111111',        address: '0x1111111111111111111111111111111111111111',

      .mockResolvedValueOnce(updatedUsers as any);

    vi.mocked(changeStatusUser).mockResolvedValue(undefined);        role: 'Producer',        role: 'Producer',



    render(        status: UserStatus.Pending,        status: UserStatus.Pending,

      <MemoryRouter>

        <UserManagement />      },      },

      </MemoryRouter>

    );      {      {



    // Initially shows pending user        address: '0x2222222222222222222222222222222222222222',        address: '0x2222222222222222222222222222222222222222',

    expect(await screen.findByText('Pending')).toBeInTheDocument();

        role: 'Factory',        role: 'Factory',

    // Approve the user

    const approveButton = screen.getByRole('button', { name: /Aprobar/i });        status: UserStatus.Approved,        status: UserStatus.Approved,

    const user = userEvent.setup();

    await user.click(approveButton);      },      },



    await waitFor(() => {      {      {

      expect(changeStatusUser).toHaveBeenCalledWith(initialUsers[0].address, UserStatus.Approved);

    });        address: '0x3333333333333333333333333333333333333333',        address: '0x3333333333333333333333333333333333333333',



    // After refetch, should show approved status        role: 'Retailer',        role: 'Retailer',

    await waitFor(() => {

      expect(screen.getByText('Approved')).toBeInTheDocument();        status: UserStatus.Rejected,        status: UserStatus.Rejected,

    });

  });      },      },



  it('shows an error if reject action fails', async () => {    ];    ];

    vi.mocked(useWallet).mockReturnValue({

      address: '0xAdmin',    vi.mocked(getUsers).mockResolvedValue(users);    vi.mocked(getUsers).mockResolvedValue(users as any);

      isConnected: true,

      chainId: 31337,    vi.mocked(changeStatusUser).mockResolvedValue(undefined);    vi.mocked(changeStatusUser).mockResolvedValue(undefined);

      networkName: 'Anvil',

      connect: vi.fn(),

      getBalance: vi.fn(),

      switchNetwork: vi.fn(),    render(    render(

      getCurrentNetwork: vi.fn(),

    } as any);      <MemoryRouter>      <MemoryRouter>



    vi.mocked(useUserInfo).mockReturnValue({        <UserManagement />        <Users />

      userInfo: { role: 'Admin', status: UserStatus.Approved },

      loading: false,      </MemoryRouter>      </MemoryRouter>

      error: null,

      refetch: vi.fn(),    );    );

    });

    const pending = [

      {

        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',    // Should list all users with different statuses    // Should list all users with different statuses

        role: 'Retailer',

        status: UserStatus.Pending,    expect(    expect(

      },

    ];      await screen.findByText('0x1111111111111111111111111111111111111111')      await screen.findByText('0x1111111111111111111111111111111111111111')

    vi.mocked(getUsers).mockResolvedValue(pending as any);

    vi.mocked(changeStatusUser).mockRejectedValue(new Error('tx failed'));    ).toBeInTheDocument();    ).toBeInTheDocument();



    render(    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument();    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument();

      <MemoryRouter>

        <UserManagement />    expect(screen.getByText('0x3333333333333333333333333333333333333333')).toBeInTheDocument();    expect(screen.getByText('0x3333333333333333333333333333333333333333')).toBeInTheDocument();

      </MemoryRouter>

    );



    // Click Reject on the only row    // Should show all statuses    // Should show all statuses

    const user = userEvent.setup();

    const rejectBtn = await screen.findByRole('button', { name: /Rechazar/i });    expect(screen.getByText('Pending')).toBeInTheDocument();    expect(screen.getByText('Pending')).toBeInTheDocument();

    await user.click(rejectBtn);

    expect(await screen.findByText(/Error al actualizar estado/i)).toBeInTheDocument();    expect(screen.getByText('Approved')).toBeInTheDocument();    expect(screen.getByText('Approved')).toBeInTheDocument();

  });

});    expect(screen.getByText('Rejected')).toBeInTheDocument();    expect(screen.getByText('Rejected')).toBeInTheDocument();



    // Approve button should be disabled for already approved user    // Approve button should be disabled for already approved user

    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i });    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i });

    expect(approveButtons[1]).toBeDisabled(); // The approved user's button    expect(approveButtons[1]).toBeDisabled(); // The approved user's button

    expect(approveButtons[0]).not.toBeDisabled(); // The pending user's button    expect(approveButtons[0]).not.toBeDisabled(); // The pending user's button



    // Reject button should be disabled for already rejected user    // Reject button should be disabled for already rejected user

    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });

    expect(rejectButtons[2]).toBeDisabled(); // The rejected user's button    expect(rejectButtons[2]).toBeDisabled(); // The rejected user's button

    expect(rejectButtons[0]).not.toBeDisabled(); // The pending user's button    expect(rejectButtons[0]).not.toBeDisabled(); // The pending user's button

  });  });



  it('allows approving a pending user and refetches list', async () => {  it('allows approving a pending user and refetches list', async () => {

    vi.mocked(useWallet).mockReturnValue({    vi.mocked(useWallet).mockReturnValue({

      address: '0xAdmin',      address: '0xAdmin',

      isConnected: true,      isConnected: true,

      chainId: 31337,      chainId: 31337,

      networkName: 'Anvil',      networkName: 'Anvil',

      connect: vi.fn(),      connect: vi.fn(),

      getBalance: vi.fn(),      getBalance: vi.fn(),

      switchNetwork: vi.fn(),      switchNetwork: vi.fn(),

      getCurrentNetwork: vi.fn(),      getCurrentNetwork: vi.fn(),

    });    } as any);



    vi.mocked(useUserInfo).mockReturnValue({    vi.mocked(useUserInfo).mockReturnValue({

      userInfo: { role: 'Admin', status: UserStatus.Approved },      userInfo: { role: 'Admin', status: UserStatus.Approved },

      loading: false,      loading: false,

      error: null,      error: null,

      refetch: vi.fn(),      refetch: vi.fn(),

    });    });



    const initialUsers: Users[] = [    const initialUsers = [

      {      {

        address: '0x1111111111111111111111111111111111111111',        address: '0x1111111111111111111111111111111111111111',

        role: 'Producer',        role: 'Producer',

        status: UserStatus.Pending,        status: UserStatus.Pending,

      },      },

    ];    ];

    const updatedUsers: Users[] = [    const updatedUsers = [

      {      {

        address: '0x1111111111111111111111111111111111111111',        address: '0x1111111111111111111111111111111111111111',

        role: 'Producer',        role: 'Producer',

        status: UserStatus.Approved,        status: UserStatus.Approved,

      },      },

    ];    ];



    vi.mocked(getUsers)    vi.mocked(getUsers)

      .mockResolvedValueOnce(initialUsers)      .mockResolvedValueOnce(initialUsers as any)

      .mockResolvedValueOnce(updatedUsers);      .mockResolvedValueOnce(updatedUsers as any);

    vi.mocked(changeStatusUser).mockResolvedValue(undefined);    vi.mocked(changeStatusUser).mockResolvedValue(undefined);



    render(    render(

      <MemoryRouter>      <MemoryRouter>

        <UserManagement />        <Users />

      </MemoryRouter>      </MemoryRouter>

    );    );



    // Initially shows pending user    // Initially shows pending user

    expect(await screen.findByText('Pending')).toBeInTheDocument();    expect(await screen.findByText('Pending')).toBeInTheDocument();



    // Approve the user    // Approve the user

    const approveButton = screen.getByRole('button', { name: /Aprobar/i });    const approveButton = screen.getByRole('button', { name: /Aprobar/i });

    const user = userEvent.setup();    const user = userEvent.setup();

    await user.click(approveButton);    await user.click(approveButton);



    await waitFor(() => {    await waitFor(() => {

      expect(changeStatusUser).toHaveBeenCalledWith(initialUsers[0].address, UserStatus.Approved);      expect(changeStatusUser).toHaveBeenCalledWith(initialUsers[0].address, UserStatus.Approved);

    });    });



    // After refetch, should show approved status    // After refetch, should show approved status

    await waitFor(() => {    await waitFor(() => {

      expect(screen.getByText('Approved')).toBeInTheDocument();      expect(screen.getByText('Approved')).toBeInTheDocument();

    });    });

  });  });



  it('shows an error if reject action fails', async () => {  it('shows an error if reject action fails', async () => {

    vi.mocked(useWallet).mockReturnValue({    vi.mocked(useWallet).mockReturnValue({

      address: '0xAdmin',      address: '0xAdmin',

      isConnected: true,      isConnected: true,

      chainId: 31337,      chainId: 31337,

      networkName: 'Anvil',      networkName: 'Anvil',

      connect: vi.fn(),      connect: vi.fn(),

      getBalance: vi.fn(),      getBalance: vi.fn(),

      switchNetwork: vi.fn(),      switchNetwork: vi.fn(),

      getCurrentNetwork: vi.fn(),      getCurrentNetwork: vi.fn(),

    });    } as any);



    vi.mocked(useUserInfo).mockReturnValue({    vi.mocked(useUserInfo).mockReturnValue({

      userInfo: { role: 'Admin', status: UserStatus.Approved },      userInfo: { role: 'Admin', status: UserStatus.Approved },

      loading: false,      loading: false,

      error: null,      error: null,

      refetch: vi.fn(),      refetch: vi.fn(),

    });    });

    const pending: Users[] = [    const pending = [

      {      {

        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',

        role: 'Retailer',        role: 'Retailer',

        status: UserStatus.Pending,        status: UserStatus.Pending,

      },      },

    ];    ];

    vi.mocked(getUsers).mockResolvedValue(pending);    vi.mocked(getUsers).mockResolvedValue(pending as any);

    vi.mocked(changeStatusUser).mockRejectedValue(new Error('tx failed'));    vi.mocked(changeStatusUser).mockRejectedValue(new Error('tx failed'));



    render(    render(

      <MemoryRouter>      <MemoryRouter>

        <UserManagement />        <Users />

      </MemoryRouter>      </MemoryRouter>

    );    );



    // Click Reject on the only row    // Click Reject on the only row

    const user = userEvent.setup();    const user = userEvent.setup();

    const rejectBtn = await screen.findByRole('button', { name: /Rechazar/i });    const rejectBtn = await screen.findByRole('button', { name: /Rechazar/i });

    await user.click(rejectBtn);    await user.click(rejectBtn);

    expect(await screen.findByText(/Error al actualizar estado/i)).toBeInTheDocument();    expect(await screen.findByText(/Error al actualizar estado/i)).toBeInTheDocument();

  });  });

});});
