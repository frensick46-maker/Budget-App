import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type SyncStatus = 'idle' | 'loading' | 'saving' | 'error'

type AuthProps = {
  session: Session | null
  loading: boolean
  isConfigured: boolean
  syncStatus: SyncStatus
  syncError: string | null
  isRecovery: boolean
  onRecoveryComplete: () => void
}

const statusLabel = (status: SyncStatus) => {
  if (status === 'loading') {
    return 'Loading cloud data...'
  }
  if (status === 'saving') {
    return 'Saving changes...'
  }
  if (status === 'error') {
    return 'Sync error'
  }
  return 'All changes saved'
}

function Auth({
  session,
  loading,
  isConfigured,
  syncStatus,
  syncError,
  isRecovery,
  onRecoveryComplete,
}: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [working, setWorking] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSignIn = async () => {
    setWorking(true)
    setMessage('')
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setAuthError(error.message)
    }
    setWorking(false)
  }

  const handleSignUp = async () => {
    setWorking(true)
    setMessage('')
    setAuthError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setMessage('Check your email to confirm the account.')
    }
    setWorking(false)
  }

  const handleSignOut = async () => {
    setWorking(true)
    setMessage('')
    setAuthError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError(error.message)
    }
    setWorking(false)
  }

  const handlePasswordUpdate = async () => {
    setWorking(true)
    setMessage('')
    setAuthError('')
    if (newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      setWorking(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.')
      setWorking(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setMessage('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
      onRecoveryComplete()
    }
    setWorking(false)
  }

  if (!isConfigured) {
    return (
      <div className="auth-panel">
        <p className="auth-title">Cloud sync disabled</p>
        <p className="auth-meta">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable
          sign-in.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="auth-panel">
        <p className="auth-title">Checking session...</p>
      </div>
    )
  }

  if (isRecovery) {
    return (
      <div className="auth-panel">
        <p className="auth-title">Set a new password</p>
        <div className="auth-form">
          <input
            className="auth-input"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
          <div className="auth-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handlePasswordUpdate}
              disabled={working || !newPassword || !confirmPassword}
            >
              Set password
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={handleSignOut}
              disabled={working}
            >
              Sign out
            </button>
          </div>
          {message ? <p className="auth-success">{message}</p> : null}
          {authError ? <p className="auth-error">{authError}</p> : null}
        </div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="auth-panel">
        <p className="auth-title">Signed in</p>
        <p className="auth-meta">{session.user.email}</p>
        <p className="auth-meta">{statusLabel(syncStatus)}</p>
        {syncStatus === 'error' && syncError ? (
          <p className="auth-error">{syncError}</p>
        ) : null}
        {authError ? <p className="auth-error">{authError}</p> : null}
        <button
          className="ghost-button small"
          type="button"
          onClick={handleSignOut}
          disabled={working}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-panel">
      <div className="auth-toggle-row">
        <p className="auth-title">Sign in to sync</p>
        <button
          className="ghost-button small"
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          disabled={working}
        >
          {showForm ? 'Hide' : 'Sign in'}
        </button>
      </div>
      {showForm ? (
        <div className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <div className="auth-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleSignIn}
              disabled={working || !email || !password}
            >
              Sign in
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={handleSignUp}
              disabled={working || !email || !password}
            >
              Create account
            </button>
          </div>
          {message ? <p className="auth-success">{message}</p> : null}
          {authError ? <p className="auth-error">{authError}</p> : null}
        </div>
      ) : (
        <p className="auth-meta">Sign in to keep your budget synced.</p>
      )}
    </div>
  )
}

export default Auth
