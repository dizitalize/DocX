import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'

type Props = {
  value: any
  onChange: (newVal: any) => void
}

export default function JsonEditor({ value, onChange }: Props) {
  const [text, setText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    try {
      setText(JSON.stringify(value, null, 2))
    } catch (e) {
      setText('')
    }
    setDirty(false)
    setMessage(null)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setText(e.target.value)
    setDirty(true)
    setMessage(null)
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(text)
      setText(JSON.stringify(parsed, null, 2))
      setMessage('Formatted JSON')
    } catch (e: any) {
      setMessage('Invalid JSON: ' + e.message)
    }
  }

  function handleValidate() {
    try {
      JSON.parse(text)
      setMessage('Valid JSON')
    } catch (e: any) {
      setMessage('Invalid JSON: ' + e.message)
    }
  }

  function handleApply() {
    try {
      const parsed = JSON.parse(text)
      onChange(parsed)
      setDirty(false)
      setMessage('Applied changes')
    } catch (e: any) {
      setMessage('Cannot apply: invalid JSON - ' + e.message)
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        JSON Editor
      </Typography>

      {message && (
        <Alert severity={message.startsWith('Invalid') ? 'error' : 'info'} sx={{ mb: 1 }}>
          {message}
        </Alert>
      )}

      <TextField
        value={text}
        onChange={handleChange}
        multiline
        minRows={16}
        fullWidth
        variant="outlined"
      />

      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button variant="outlined" onClick={handleFormat}>
          Format
        </Button>
        <Button variant="outlined" onClick={handleValidate}>
          Validate
        </Button>
        <Button variant="contained" onClick={handleApply} disabled={!dirty}>
          Apply changes
        </Button>
      </Box>
    </Box>
  )
}
