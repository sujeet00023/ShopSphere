import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../utils/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      hydrated: false,

      setHydrated: (state) => set({ hydrated: state }),

      // ...your actions
       register: async (email, password, name, role = 'CUSTOMER') => {
        set({ loading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/register', {
            email,
            password,
            name,
            role,
          })
          set({ user: data.user, token: data.token, loading: false })
          localStorage.setItem('authToken', data.token)
          return data
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed'
          set({ error: message, loading: false })
          throw err
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/login', { email, password })
          set({ user: data.user, token: data.token, loading: false })
          localStorage.setItem('authToken', data.token)
          return data
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed'
          set({ error: message, loading: false })
          throw err
        }
      },

      logout: () => {
        set({ user: null, token: null })
        localStorage.removeItem('authToken')
      },

      clearError: () => set({ error: null }),
    }),
   {
  name: 'auth-store',

  partialize: (state) => ({
    user: state.user,
    token: state.token,
  }),

  onRehydrateStorage: () => (state, error) => {
    if (error) {
      console.log('Hydration failed', error)
    }

    if (state) {
      state.setHydrated(true)
    }
  },
}
  )
)