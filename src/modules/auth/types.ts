export interface AuthUser {
  id: string
  email: string
  full_name: string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  access_token: string
  expires_at: string
  user: AuthUser
}
