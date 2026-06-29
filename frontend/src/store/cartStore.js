import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      // ✅ mark hydration complete
      setHydrated: () => set({ hydrated: true }),

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id)

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }

          return {
            items: [...state.items, { ...product, quantity }],
          }
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotals: () => {
        const items = get().items

        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )

        const tax = subtotal * 0.1
        const total = subtotal + tax

        return {
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0), // ✅ FIXED
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(total.toFixed(2)),
        }
      },
    }),
    {
      name: 'cart-store',

      // ✅ safe localStorage handling
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      },
    }
  )
)