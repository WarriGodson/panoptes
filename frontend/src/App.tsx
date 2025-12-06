import { useEffect, useState } from 'react'
import './App.css'
import SetupWizard from './components/setup/SetupWizard'
import Dashboard from './components/Dashboard'
import { getSetupStatus } from './api/setupClient'

function App() {
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const status = await getSetupStatus()
      setInstalled(status.installed)
    } catch (error) {
      console.error('Failed to check setup status:', error)
      setInstalled(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (installed) {
    return <Dashboard />
  }

  return <SetupWizard onComplete={() => setInstalled(true)} />
}

export default App
