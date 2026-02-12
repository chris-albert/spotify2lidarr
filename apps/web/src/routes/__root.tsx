import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Header from '@/components/layout/Header'

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-white py-6">
        <div className="container-custom text-center text-sm">
          <p>&copy; 2026 Spotify2Lidarr &bull; Built with React, TypeScript, and Tailwind CSS</p>
        </div>
      </footer>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
