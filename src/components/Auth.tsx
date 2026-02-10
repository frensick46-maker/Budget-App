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
  t: (key: string) => string
}

const statusLabel = (status: SyncStatus, t: (key: string) => string) => {
  if (status === 'loading') {
    return t('statusLoading')
  }
  if (status === 'saving') {
    return t('statusSaving')
  }
  if (status === 'error') {
    return t('statusError')
  }
  return t('statusSaved')
}

function Auth({
  session,
  loading,
  isConfigured,
  syncStatus,
  syncError,
  isRecovery,
  onRecoveryComplete,
  t,
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
      setMessage(t('checkEmailConfirm'))
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
      setAuthError(t('passwordTooShort'))
      setWorking(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setAuthError(t('passwordMismatch'))
      setWorking(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setMessage(t('passwordUpdated'))
      setNewPassword('')
      setConfirmPassword('')
      onRecoveryComplete()
    }
    setWorking(false)
  }

  if (!isConfigured) {
    return (
      <div className="auth-panel">
        <p className="auth-title">{t('cloudSyncDisabled')}</p>
        <p className="auth-meta">{t('cloudSyncDisabledHint')}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="auth-panel">
        <p className="auth-title">{t('checkingSession')}</p>
      </div>
    )
  }

  if (isRecovery) {
    return (
      <div className="auth-panel">
        <p className="auth-title">{t('setNewPassword')}</p>
        <div className="auth-form">
          <input
            className="auth-input"
            type="password"
            placeholder={t('newPassword')}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <input
            className="auth-input"
            type="password"
            placeholder={t('confirmNewPassword')}
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
              {t('setPassword')}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={handleSignOut}
              disabled={working}
            >
              {t('signOut')}
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
        <p className="auth-title">{t('signedIn')}</p>
        <p className="auth-meta">{session.user.email}</p>
        <p className="auth-meta">{statusLabel(syncStatus, t)}</p>
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
          {t('signOut')}
        </button>
      </div>
    )
  }

  return (
    <div className="auth-panel">
      <div className="auth-toggle-row">
        <p className="auth-title">{t('signInToSync')}</p>
        <button
          className="ghost-button small"
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          disabled={working}
        >
          {showForm ? t('hide') : t('signIn')}
        </button>
      </div>
      {showForm ? (
        <div className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
          <input
            className="auth-input"
            type="password"
            placeholder={t('password')}
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
              {t('signIn')}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={handleSignUp}
              disabled={working || !email || !password}
            >
              {t('createAccount')}
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
