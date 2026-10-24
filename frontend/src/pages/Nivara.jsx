
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { health } from '../api.js'

const TOOLS = [
  { label: 'Evidence vault', path: '/nivara/vault' },
  { label: "Prove it's fake", path: null },
  { label: 'Send alert', path: '/nivara/alert' },
  { label: 'Report & takedown', path: null },
  { label: 'Get help', path: null },
]

export default function Nivara() {
  const [status, setStatus] = useState('checking...')
  const navigate = useNavigate()

  useEffect(() => {
    health()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('backend not reachable'))
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f3ed',
        color: '#30244b',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '672px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', margin: '0 0 8px' }}>
          Nivara
        </h1>

        <p style={{ fontSize: '14px', marginBottom: '24px' }}>
          Server: {status}
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => {
                if (tool.path) navigate(tool.path)
              }}
              disabled={!tool.path}
              style={{
                width: '100%',
                minHeight: '66px',
                padding: '20px',
                textAlign: 'left',
                fontSize: '16px',
                color: '#30244b',
                background: '#ffffff',
                border: '1px solid #ded9e8',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                cursor: tool.path ? 'pointer' : 'default',
                opacity: 1,
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

