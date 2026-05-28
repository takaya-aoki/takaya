import { Sidebar } from '@/components/sidebar/Sidebar'

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Gmail-style left sidebar */}
      <nav className="w-64 flex-shrink-0 flex flex-col p-2 pt-4 overflow-y-auto bg-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <span className="text-2xl">✉️</span>
          <h1 className="text-lg font-semibold text-gray-800">Claude Mail</h1>
        </div>
        <Sidebar />
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-white border-l border-gray-200">
        {children}
      </main>
    </div>
  )
}
