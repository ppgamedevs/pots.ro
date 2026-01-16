export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    } else if (response.status === 401) {
      // User not authenticated
      return null;
    } else {
      console.error('Error fetching user:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (response.ok) {
      // Use replace to avoid history entry and prevent middleware interception
      window.location.replace('/');
    } else {
      console.error('Logout failed:', response.statusText);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Server-side helper functions
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Import the actual session function instead of making a fetch request
    const { getCurrentUser: getSessionUser } = await import('@/lib/auth/session');
    return await getSessionUser();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}