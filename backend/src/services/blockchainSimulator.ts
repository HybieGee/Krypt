import { Server } from 'socket.io'
import { logger } from '../utils/logger'

interface Component {
  id: number
  name: string
  phase: number
  completed: boolean
  code?: string
}

export class BlockchainSimulator {
  private io: Server
  private isRunning: boolean = false
  private components: Component[] = []
  private currentComponentIndex: number = 0
  private startTime: Date
  private totalDuration: number = 14 * 24 * 60 * 60 * 1000 // 14 days in ms
  private componentInterval: number
  private intervalId?: NodeJS.Timeout

  constructor(io: Server) {
    this.io = io
    this.startTime = new Date()
    this.initializeComponents()
    this.componentInterval = this.totalDuration / 640 // Time per component
  }

  private initializeComponents() {
    const componentsPerPhase = 160
    const phaseNames = [
      'Core Infrastructure',
      'Consensus Mechanism',
      'Smart Contract Layer',
      'Network & Security'
    ]

    for (let phase = 1; phase <= 4; phase++) {
      for (let i = 0; i < componentsPerPhase; i++) {
        this.components.push({
          id: (phase - 1) * componentsPerPhase + i + 1,
          name: `${phaseNames[phase - 1]} Component ${i + 1}`,
          phase,
          completed: false,
        })
      }
    }
  }

  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    logger.info('Blockchain simulator started')

    if (process.env.USE_MOCK_BLOCKCHAIN === 'true') {
      this.runSimulation()
    }
  }

  private runSimulation() {
    const processComponent = () => {
      if (this.currentComponentIndex >= this.components.length) {
        this.complete()
        return
      }

      const component = this.components[this.currentComponentIndex]
      component.completed = true
      component.code = this.generateMockCode(component)

      const progress = this.calculateProgress()
      
      this.io.emit('terminal:log', {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'code',
        message: `Developing ${component.name}`,
        details: {
          componentId: component.id,
          phase: component.phase,
          code: component.code,
        },
      })

      this.io.emit('blockchain:progress', progress)

      if (this.currentComponentIndex % 10 === 0) {
        this.io.emit('terminal:log', {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'commit',
          message: `Committing progress: ${this.currentComponentIndex} components completed`,
        })
      }

      if (this.currentComponentIndex % 160 === 0 && this.currentComponentIndex > 0) {
        const phase = Math.floor(this.currentComponentIndex / 160)
        this.io.emit('terminal:log', {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'phase',
          message: `Phase ${phase} completed!`,
        })
      }

      this.currentComponentIndex++
    }

    const interval = process.env.NODE_ENV === 'development' ? 5000 : this.componentInterval
    this.intervalId = setInterval(processComponent, interval)
    processComponent()
  }

  private generateMockCode(component: Component): string {
    const codeTemplates = [
      `contract ${component.name.replace(/\s+/g, '')} {\n  mapping(address => uint256) balances;\n  function transfer(address to, uint256 amount) public {\n    // Implementation\n  }\n}`,
      `class ${component.name.replace(/\s+/g, '')} {\n  constructor() {\n    this.initialized = true;\n  }\n  async process() {\n    // Processing logic\n  }\n}`,
      `function validate${component.name.replace(/\s+/g, '')}(data) {\n  if (!data || !data.valid) {\n    throw new Error('Invalid data');\n  }\n  return true;\n}`,
    ]
    
    return codeTemplates[component.id % codeTemplates.length]
  }

  private calculateProgress() {
    const completedComponents = this.components.filter(c => c.completed).length
    const currentPhase = Math.floor(this.currentComponentIndex / 160) + 1
    const phaseProgress = (this.currentComponentIndex % 160) / 160 * 100

    return {
      currentPhase: Math.min(currentPhase, 4),
      phaseProgress,
      totalComponents: 640,
      completedComponents,
      percentComplete: (completedComponents / 640) * 100,
      estimatedCompletion: new Date(this.startTime.getTime() + this.totalDuration),
    }
  }

  private complete() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    logger.info('Blockchain development completed!')
    
    this.io.emit('terminal:log', {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'system',
      message: 'Blockchain development completed! Ready for deployment.',
    })
  }

  stop() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    logger.info('Blockchain simulator stopped')
  }
}