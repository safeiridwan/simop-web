export interface User {
  id: string
  email: string
  full_name: string
  status: string
  roles: string[]
  created_at: string
  updated_at: string
}

export interface PageMeta {
  page: number
  page_size: number
  total: number
}

export interface CreateUserInput {
  email: string
  password: string
  full_name: string
  role_codes: string[]
}
