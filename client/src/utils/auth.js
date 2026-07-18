export const getDefaultRoute = (role) => ({
  admin: '/admin',
  teacher: '/teacher',
  student: '/dashboard',
}[role] || '/login')
