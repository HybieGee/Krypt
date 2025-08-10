import { useStore } from '@/store/useStore'

export default function Footer() {
  const { statistics } = useStore()

  return (
    <footer className="border-t border-terminal-green/30 bg-black/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-terminal-green/60">Lines of Code:</span>
              <span className="text-terminal-green font-mono">
                {statistics.linesOfCode.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-terminal-green/60">Commits:</span>
              <span className="text-terminal-green font-mono">
                {statistics.githubCommits.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-terminal-green/60">Tests:</span>
              <span className="text-terminal-green font-mono">
                {statistics.testsRun.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-terminal-green/40">
            Building the future of Web3
          </div>
        </div>
      </div>
    </footer>
  )
}