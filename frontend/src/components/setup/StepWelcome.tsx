interface StepWelcomeProps {
  onNext: () => void
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center">
        {/* Shield icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Welcome to Panoptes
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Your AI-Powered CVE Alert Bot
        </p>

        <div className="max-w-md mx-auto space-y-4 text-left mb-8">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Real-time CVE Monitoring</h3>
              <p className="text-sm text-slate-600">Stay updated with the latest security vulnerabilities from NVD</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI-Powered Analysis</h3>
              <p className="text-sm text-slate-600">OpenAI analyzes each CVE for severity and mitigation strategies</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Telegram Alerts</h3>
              <p className="text-sm text-slate-600">Get instant notifications on critical vulnerabilities</p>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full max-w-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Setup
        </button>

        <p className="text-xs text-slate-500 mt-6">
          This wizard will guide you through configuring your database, OpenAI API, and Telegram bot.
        </p>
      </div>
    </div>
  )
}
