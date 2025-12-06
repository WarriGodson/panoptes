import { useState } from 'react'
import StepWelcome from './StepWelcome'
import StepDbConfig from './StepDbConfig'
import StepOpenAiConfig from './StepOpenAiConfig'
import StepTelegramConfig from './StepTelegramConfig'
import StepSummary from './StepSummary'

export interface SetupData {
  dbDriver: 'sqlite' | 'mysql'
  dbHost?: string
  dbPort?: string
  dbDatabase?: string
  dbUsername?: string
  dbPassword?: string
  openaiApiKey: string
  openaiModel: string
  openaiOrganization?: string
  telegramBotToken: string
  telegramChatId?: string
}

interface SetupWizardProps {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState<SetupData>({
    dbDriver: 'mysql',
    dbHost: '127.0.0.1',
    dbPort: '3306',
    dbDatabase: 'panoptes',
    dbUsername: 'root',
    dbPassword: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiOrganization: '',
    telegramBotToken: '',
    telegramChatId: '',
  })

  const updateSetupData = (data: Partial<SetupData>) => {
    setSetupData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep(prev => prev + 1)
  const prevStep = () => setCurrentStep(prev => prev - 1)

  const steps = [
    <StepWelcome key="welcome" onNext={nextStep} />,
    <StepDbConfig 
      key="db" 
      data={setupData} 
      onUpdate={updateSetupData}
      onNext={nextStep} 
      onBack={prevStep}
    />,
    <StepOpenAiConfig 
      key="openai" 
      data={setupData} 
      onUpdate={updateSetupData}
      onNext={nextStep} 
      onBack={prevStep}
    />,
    <StepTelegramConfig 
      key="telegram" 
      data={setupData} 
      onUpdate={updateSetupData}
      onNext={nextStep} 
      onBack={prevStep}
    />,
    <StepSummary 
      key="summary" 
      data={setupData}
      onBack={prevStep}
      onComplete={onComplete}
    />,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['Welcome', 'Database', 'OpenAI', 'Telegram', 'Summary'].map((label, index) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep 
                    ? 'bg-slate-900 text-white' 
                    : index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className="text-xs mt-1 text-slate-600">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Current step */}
        {steps[currentStep]}
      </div>
    </div>
  )
}
