interface BlockchainProgress {
  currentPhase: number
  phaseProgress: number
  totalComponents: number
  completedComponents: number
  linesOfCode?: number
  commits?: number
  testsRun?: number
}

interface Props {
  progress: BlockchainProgress
}

export default function ProgressBar({ progress }: Props) {
  const overallProgress = (progress.completedComponents / progress.totalComponents) * 100
  const phases = ['Core Infrastructure', 'Consensus', 'Smart Contracts', 'Network']

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex justify-between text-xs text-terminal-green/60 mb-1">
          <span>Overall Progress</span>
          <span>{overallProgress.toFixed(1)}%</span>
        </div>
        <div className="h-4 bg-terminal-gray border border-terminal-green/30 rounded overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-terminal-green to-terminal-dark-green transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {phases.map((phase, index) => {
          const phaseNumber = index + 1
          const isActive = progress.currentPhase === phaseNumber
          const isCompleted = progress.currentPhase > phaseNumber
          const phasePercent = isActive ? progress.phaseProgress : isCompleted ? 100 : 0

          return (
            <div key={phase} className="text-center">
              <div className={`text-[10px] mb-1 ${
                isActive ? 'text-terminal-green' : 
                isCompleted ? 'text-terminal-dark-green' : 
                'text-terminal-green/30'
              }`}>
                {phase}
              </div>
              <div className="h-2 bg-terminal-gray border border-terminal-green/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isActive ? 'bg-terminal-green animate-pulse' :
                    isCompleted ? 'bg-terminal-dark-green' :
                    'bg-transparent'
                  }`}
                  style={{ width: `${phasePercent}%` }}
                />
              </div>
              <div className={`text-[10px] mt-1 ${
                isActive || isCompleted ? 'text-terminal-green/80' : 'text-terminal-green/30'
              }`}>
                {phasePercent.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Development Statistics */}
      <div className="mt-4 pt-3 border-t border-terminal-green/20">
        <div className="flex justify-between items-center text-xs">
          <div className="text-terminal-green/60 font-semibold">Development Stats</div>
          <div className="text-terminal-green/40 text-[10px]">
            {progress.completedComponents}/{progress.totalComponents} components
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="text-center">
            <div className="text-terminal-green text-sm font-bold">
              {(progress.linesOfCode || 0).toLocaleString()}
            </div>
            <div className="text-terminal-green/60 text-[10px]">Lines of Code</div>
          </div>
          <div className="text-center">
            <div className="text-terminal-green text-sm font-bold">
              {(progress.commits || 0).toLocaleString()}
            </div>
            <div className="text-terminal-green/60 text-[10px]">Commits</div>
          </div>
          <div className="text-center">
            <div className="text-terminal-green text-sm font-bold">
              {(progress.testsRun || 0).toLocaleString()}
            </div>
            <div className="text-terminal-green/60 text-[10px]">Tests Run</div>
          </div>
        </div>
      </div>
    </div>
  )
}