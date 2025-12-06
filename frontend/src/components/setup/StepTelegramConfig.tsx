import { useState } from 'react'
import type { SetupData } from './SetupWizard'
import { testTelegram } from '../../api/setupClient'

interface StepTelegramConfigProps {
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepTelegramConfig({ data, onUpdate, onNext, onBack }: StepTelegramConfigProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await testTelegram({
        bot_token: data.telegramBotToken,
        chat_id: data.telegramChatId || '',
      })
      
      setTestResult({ success: result.ok, message: result.message || 'Test completed' })
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Telegram test failed' 
      })
    } finally {
      setTesting(false)
    }
  }

  const canProceed = testResult?.success === true

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.52l-2.906-.907c-.632-.196-.643-.632.132-.936l11.36-4.38c.528-.197.99.124.816.924z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Telegram Configuration</h2>
          <p className="text-sm text-slate-600">Configure your Telegram bot for alerts</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">How to create a Telegram Bot:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Open Telegram and search for <code className="bg-blue-100 px-1 rounded">@BotFather</code></li>
            <li>Send <code className="bg-blue-100 px-1 rounded">/newbot</code> and follow the instructions</li>
            <li>Copy the API token you receive</li>
            <li>Start a chat with your bot to get your Chat ID</li>
          </ol>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bot Token <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={data.telegramBotToken}
            onChange={(e) => onUpdate({ telegramBotToken: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
          />
          <p className="text-xs text-slate-500 mt-1">
            Format: <code>123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Chat ID <span className="text-slate-400 text-xs">(Optional - for testing)</span>
          </label>
          <input
            type="text"
            value={data.telegramChatId || ''}
            onChange={(e) => onUpdate({ telegramChatId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
            placeholder="123456789"
          />
          <p className="text-xs text-slate-500 mt-1">
            Get your Chat ID by messaging your bot, then use <code>/start</code>
          </p>
        </div>

        {/* Test button */}
        <button
          onClick={handleTest}
          disabled={testing || !data.telegramBotToken}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Talking to Telegram...
            </>
          ) : (
            data.telegramChatId ? 'Test Telegram & Send Message' : 'Test Telegram Bot'
          )}
        </button>

        {/* Test result */}
        {testResult && (
          <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
