import axios from 'axios'

export type GetFileResult = {
  json: any
  sha?: string
}

const apiBase = 'https://api.github.com'

function buildHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json'
  }
  if (token) headers['Authorization'] = `token ${token}`
  return headers
}

export async function getFileContent(owner: string, repo: string, path: string, token?: string): Promise<GetFileResult> {
  const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
  try {
    const res = await axios.get(url, { headers: buildHeaders(token) })
    const data = res.data
    const encoded = data.content || ''
    const decoded = typeof encoded === 'string' ? atob(encoded.replace(/\n/g, '')) : ''
    const parsed = decoded ? JSON.parse(decoded) : null
    return { json: parsed, sha: data.sha }
  } catch (err: any) {
    // Normalize axios errors to include status and response body for the caller
    if (err.response) {
      const e: any = new Error(err.response.data?.message || 'GitHub API error')
      e.status = err.response.status
      e.body = err.response.data
      throw e
    }
    throw err
  }
}

export async function createOrUpdateFile(owner: string, repo: string, path: string, token: string | undefined, contentObj: any, message: string, sha?: string) {
  const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(contentObj, null, 2))))
  const body: any = {
    message,
    content
  }
  if (sha) body.sha = sha

  try {
    const res = await axios.put(url, body, { headers: buildHeaders(token) })
    return res.data
  } catch (err: any) {
    if (err.response) {
      const e: any = new Error(err.response.data?.message || 'GitHub API error')
      e.status = err.response.status
      e.body = err.response.data
      throw e
    }
    throw err
  }
}

export async function createDefaultIfMissing(owner: string, repo: string, path: string, token: string | undefined, defaultJson: any) {
  try {
    const existing = await getFileContent(owner, repo, path, token)
    return { existed: true, result: existing }
  } catch (err: any) {
    if (err.status === 404) {
      const created = await createOrUpdateFile(owner, repo, path, token, defaultJson, 'Create default JSON from web editor')
      return { existed: false, result: created }
    }
    throw err
  }
}
