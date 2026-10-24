export default function Notes() {
  return (
    <main className="min-h-screen bg-[#1c1c1e] p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-semibold">Notes</h1>
        <p className="mb-6 text-sm text-gray-400">
          Your notes
        </p>

        <textarea
          className="min-h-64 w-full rounded-xl border border-gray-700 bg-[#29292c] p-4 text-white outline-none focus:border-gray-400"
          placeholder="Write a note..."
          aria-label="Notes"
        />
      </div>
    </main>
  )
}
