import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'

export interface MyRouterContext {
  queryClient: QueryClient
}

export function createRouter() {
  const queryClient = new QueryClient()

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    context: {
      queryClient,
    },
  })

  return router
}

export function getRouter() {
  return createRouter()
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}