import { useState } from 'react'
import type { SetupData } from './SetupWizard'
import { saveSetup } from '../../api/setupClient'

interface StepSummaryProps {
  data: SetupData
  onBack: () => void
  onComplete: () => void
}

export default function StepSummary({ data, onBack, onComplete }: StepSummaryProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maskSecret = (value: string) => {
    if (!value) return ''
    if (value.length <= 8) return '••••••••'
    return value.substring(0, 8) + '••••••••'
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const result = await saveSetup({
        db: {
          driver: data.dbDriver,
          host: data.dbHost,
          port: data.dbPort,
          database: data.dbDatabase || '',
          username: data.dbUsername,
          password: data.dbPassword,
        },
        openai: {
          api_key: data.openaiApiKey,
          model: data.openaiModel,
        },
        telegram: {
          bot_token: data.telegramBotToken,
          chat_id: data.telegramChatId || '',
        },
      })
      
      if (result.ok) {
        // Show building animation for 3 seconds before completing
        setTimeout(() => {
          onComplete()
        }, 3000)
      } else {
        setError(result.message || 'Failed to save configuration')
        setSaving(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
      setSaving(false)
    }
  }

  // Show building database animation
  if (saving) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-8">
            {/* Animated cog and hammer */}
            <svg className="w-24 h-24 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg className="w-16 h-16 text-amber-600 absolute -bottom-2 -right-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Building Database...</h3>
          <p className="text-slate-600 mb-6">Setting up your Panoptes CVE Security Bot</p>
          <div className="w-64 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review & Save</h2>
          <p className="text-sm text-slate-600">Confirm your configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Database Configuration */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <h3 className="font-semibold text-slate-900">Database</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Driver:</span>
              <span className="font-medium text-slate-900 uppercase">{data.dbDriver}</span>
            </div>
            {data.dbDriver === 'mysql' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Host:</span>
                  <span className="font-medium text-slate-900">{data.dbHost}:{data.dbPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Database:</span>
                  <span className="font-medium text-slate-900">{data.dbDatabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Username:</span>
                  <span className="font-medium text-slate-900">{data.dbUsername}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* OpenAI Configuration */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-semibold text-slate-900">OpenAI</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">API Key:</span>
              <span className="font-mono text-slate-900">{maskSecret(data.openaiApiKey)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Model:</span>
              <span className="font-medium text-slate-900">{data.openaiModel}</span>
            </div>
            {data.openaiOrganization && (
              <div className="flex justify-between">
                <span className="text-slate-600">Organization:</span>
                <span className="font-mono text-slate-900">{data.openaiOrganization}</span>
              </div>
            )}
          </div>
        </div>

        {/* Telegram Configuration */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.52l-2.906-.907c-.632-.196-.643-.632.132-.936l11.36-4.38c.528-.197.99.124.816.924z"/>
            </svg>
            <h3 className="font-semibold text-slate-900">Telegram</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Bot Token:</span>
              <span className="font-mono text-slate-900">{maskSecret(data.telegramBotToken)}</span>
            </div>
            {data.telegramChatId && (
              <div className="flex justify-between">
                <span className="text-slate-600">Chat ID:</span>
                <span className="font-mono text-slate-900">{data.telegramChatId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important:</p>
              <p>This will save your configuration to the <code className="bg-yellow-100 px-1 rounded">.env</code> file and automatically set up your database.</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Finalizing setup...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Finish & Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-start mt-6">
        <button
          onClick={onBack}
          disabled={saving}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  )
}
