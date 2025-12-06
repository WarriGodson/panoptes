import { useState } from 'react'
import type { SetupData } from './SetupWizard'
import { testDb } from '../../api/setupClient'

interface StepDbConfigProps {
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDbConfig({ data, onUpdate, onNext, onBack }: StepDbConfigProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await testDb({
        driver: data.dbDriver,
        host: data.dbHost,
        port: data.dbPort,
        database: data.dbDatabase || '',
        username: data.dbUsername,
        password: data.dbPassword,
      })
      
      setTestResult({ success: result.ok, message: result.message || 'Test completed' })
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
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
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Database Configuration</h2>
          <p className="text-sm text-slate-600">Configure your database connection</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Database Driver */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Database Driver</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="sqlite"
                checked={data.dbDriver === 'sqlite'}
                onChange={(e) => onUpdate({ dbDriver: e.target.value as 'sqlite' | 'mysql' })}
                className="w-4 h-4 text-slate-900"
              />
              <span className="text-sm">SQLite</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="mysql"
                checked={data.dbDriver === 'mysql'}
                onChange={(e) => onUpdate({ dbDriver: e.target.value as 'sqlite' | 'mysql' })}
                className="w-4 h-4 text-slate-900"
              />
              <span className="text-sm">MySQL</span>
            </label>
          </div>
        </div>

        {data.dbDriver === 'mysql' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                <input
                  type="text"
                  value={data.dbHost || ''}
                  onChange={(e) => onUpdate({ dbHost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="127.0.0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                <input
                  type="text"
                  value={data.dbPort || ''}
                  onChange={(e) => onUpdate({ dbPort: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="3306"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label>
              <input
                type="text"
                value={data.dbDatabase || ''}
                onChange={(e) => onUpdate({ dbDatabase: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="panoptes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={data.dbUsername || ''}
                onChange={(e) => onUpdate({ dbUsername: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="root"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={data.dbPassword || ''}
                onChange={(e) => onUpdate({ dbPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {/* Test button */}
        <button
          onClick={handleTest}
          disabled={testing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Testing connection...
            </>
          ) : (
            'Test Connection'
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
