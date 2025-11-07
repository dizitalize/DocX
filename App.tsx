import React, { useState } from 'react'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import JsonEditor from './components/JsonEditor'
import * as gh from './services/github'

const DEFAULT_PATH = 'data/default.json'
const DEFAULT_JSON = { hello: 'world', createdAt: new Date().toISOString() }

export default function App() {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [path, setPath] = useState(DEFAULT_PATH)
  // Prefill token from Vite env (VITE_GITHUB_TOKEN) if provided locally via a .env file.
  const defaultToken = (import.meta as any)?.env?.VITE_GITHUB_TOKEN || ''
  const [token, setToken] = useState(defaultToken)
  const [json, setJson] = useState<any>(null)
  const [sha, setSha] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLoad() {
    setMessage(null)
    setLoading(true)
    try {
      const result = await gh.getFileContent(owner, repo, path, token || undefined)
      if (!result.json) {
        setMessage('File exists but is empty or not JSON')
        setJson(null)
      } else {
        setJson(result.json)
        setSha(result.sha)
        setMessage('Loaded JSON from repository')
      }
    } catch (err: any) {
      // If github service includes .status and .body, show human-friendly info
      if (err.status === 404) {
        setMessage('File not found — creating default JSON')
        try {
          const created = await gh.createOrUpdateFile(owner, repo, path, token || undefined, DEFAULT_JSON, 'Create default JSON from web UI')
          // created content structure is different; re-fetch for sha
          const re = await gh.getFileContent(owner, repo, path, token || undefined)
          setJson(re.json)
          setSha(re.sha)
          setMessage('Default file created')
        } catch (ce: any) {
          setMessage(`Failed to create default file: ${ce?.message || JSON.stringify(ce?.body || ce)}`)
        }
      } else {
        setMessage(`Failed to load file: ${err?.message || JSON.stringify(err?.body || err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(newJson: any) {
    setMessage(null)
    setLoading(true)
    try {
      const resp = await gh.createOrUpdateFile(owner, repo, path, token || undefined, newJson, 'Updated JSON data from web interface', sha)
      // Update sha from response
      const newSha = resp.content?.sha
      setSha(newSha)
      setJson(newJson)
      setMessage('Saved changes to repository')
    } catch (err: any) {
      setMessage(`Save failed: ${err?.message || JSON.stringify(err?.body || err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <h1>GitHub JSON Editor</h1>
        <Alert severity="info" sx={{ mb: 2 }}>
          For write operations provide a token with repo scope. Do NOT paste long-lived tokens into public places.
        </Alert>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          <TextField label="Repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <TextField label="Path" value={path} onChange={(e) => setPath(e.target.value)} sx={{ minWidth: 260 }} />
        </Box>
        <TextField
          label="GitHub Token (or leave blank to use Vite env VITE_GITHUB_TOKEN)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          fullWidth
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleLoad} disabled={loading || !owner || !repo}>
            Load
          </Button>
        </Box>
        {message && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </Box>

      {json && (
        <JsonEditor value={json} onChange={(v) => handleSave(v)} />
      )}
    </Container>
  )
}
