// Minimal contract helpers for Home page registration logic
// These will be mocked in tests and expanded as needed


export type UserInfo = { role: string | null, status: string | null };
export async function getUserInfo(address: string): Promise<UserInfo> {
  // Placeholder: should call contract to get user info
  return { role: null, status: null };
}

export async function requestUserRole(address: string, role: string) {
  // Placeholder: should call contract to request role
  return { success: true };
}
