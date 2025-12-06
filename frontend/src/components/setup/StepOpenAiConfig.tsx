import { useState } from 'react'
import type { SetupData } from './SetupWizard'
import { testOpenAi as testOpenAiApi } from '../../api/setupClient';

interface StepOpenAiConfigProps {
  data: SetupData
  onUpdate: (data: Partial<SetupData>) => void
  onNext: () => void
  onBack: () => void
}

export default function StepOpenAiConfig({ data, onUpdate, onNext, onBack }: StepOpenAiConfigProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await testOpenAiApi({
        api_key: data.openaiApiKey,
        model: data.openaiModel,
      })
      
      setTestResult({ success: result.ok, message: result.message || 'Test completed' })
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'OpenAI test failed' 
      })
    } finally {
      setTesting(false)
    }
  }

  const canProceed = testResult?.success === true

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">OpenAI Configuration</h2>
          <p className="text-sm text-slate-600">Configure AI analysis with OpenAI</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={data.openaiApiKey}
            onChange={(e) => onUpdate({ openaiApiKey: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
            placeholder="sk-proj-..."
          />
          <p className="text-xs text-slate-500 mt-1">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Dashboard</a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
          <select
            value={data.openaiModel}
            onChange={(e) => onUpdate({ openaiModel: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Organization ID <span className="text-slate-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.openaiOrganization || ''}
            onChange={(e) => onUpdate({ openaiOrganization: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
            placeholder="org-..."
          />
        </div>

        {/* Test button */}
        <button
          onClick={handleTest}
          disabled={testing || !data.openaiApiKey}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Contacting OpenAI...
            </>
          ) : (
            'Test OpenAI Connection'
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
