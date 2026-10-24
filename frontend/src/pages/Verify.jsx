
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getVerification } from '../api.js'

export default function Verify() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getVerification(id)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [id])

  return (
    <main className="min-h-screen bg-white p-4 font-sans">
      {error && <p className="text-danger">{error}</p>}

      {!error && !data && <p>Checking...</p>}

      {data && (
        <div className="rounded-card border border-danger p-4">
          <h1 className="text-xl font-semibold text-danger">
            This image has been verified as MANIPULATED
          </h1>

          <p className="mt-2 text-sm">
            Similarity to the original: {data.similarity}%
          </p>

          <p className="mt-1 break-all text-xs text-gray-500">
            Fingerprint (SHA-256): {data.fake_sha256}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Checked: {data.checked_at}
          </p>
        </div>
      )}
    </main>
  )
}
