export function App() {
  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-sm font-semibold">QuietInbox</h1>
        <p className="text-xs text-slate-500">Senders you never read</p>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500">Not connected yet.</p>
      </main>
    </div>
  )
}
