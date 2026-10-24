const ENGINES = [
  { name: 'Google Images', url: 'https://images.google.com/' },
  { name: 'Bing Visual Search', url: 'https://www.bing.com/visualsearch' },
  { name: 'TinEye', url: 'https://tineye.com/' },
]

export default function SpreadFinder() {
  return (
    <div className="mt-4 rounded-card bg-nivara-50 p-4">
      <h3 className="font-medium text-nivara-900">Find where it's been posted</h3>
      <p className="mt-1 text-sm text-nivara-700">
        Each button opens a search site in a new tab. Tap its camera or upload icon and choose the fake image to see
        pages where it appears. Nivara never uploads it anywhere for you.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ENGINES.map((e) => (
          <a key={e.name} href={e.url} target="_blank" rel="noreferrer" className="rounded-lg bg-white p-2 text-center text-xs text-nivara-900 shadow-sm">
            {e.name} ↗
          </a>
        ))}
      </div>
    </div>
  )
}