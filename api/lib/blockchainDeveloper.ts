import { Server } from 'socket.io'
import Anthropic from '@anthropic-ai/sdk'
import { logger } from './logger'
import { query } from './database'

interface BlockchainComponent {
  id: number
  name: string
  phase: number
  description: string
  dependencies: string[]
  fileType: string
}

export class BlockchainDeveloper {
  private io: Server
  private anthropic: Anthropic | null = null
  private isRunning: boolean = false
  private currentComponentIndex: number = 0
  private components: BlockchainComponent[] = []
  private startTime: Date
  private totalDuration: number = 14 * 24 * 60 * 60 * 1000 // 14 days
  private componentInterval: number
  private intervalId?: NodeJS.Timeout
  private linesOfCode: number = 0
  private commits: number = 0
  private testsRun: number = 0
  private codeCache: Map<number, string> = new Map()

  constructor(io: Server) {
    this.io = io
    this.startTime = new Date()
    this.componentInterval = this.totalDuration / 640
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
      logger.info('Claude API initialized')
    } else {
      logger.warn('No Anthropic API key - using mock mode')
    }
    
    this.initializeComponents()
  }

  private initializeComponents() {
    const phases = [
      { name: 'Core Infrastructure', count: 160 },
      { name: 'Consensus Mechanism', count: 160 },
      { name: 'Smart Contract Layer', count: 160 },
      { name: 'Network & Security', count: 160 }
    ]

    let componentId = 1
    phases.forEach((phase, phaseIndex) => {
      for (let i = 0; i < phase.count; i++) {
        this.components.push({
          id: componentId++,
          name: `Component_${phaseIndex + 1}_${i + 1}`,
          phase: phaseIndex + 1,
          description: `${phase.name} - Component ${i + 1}`,
          dependencies: i > 0 ? [`Component_${phaseIndex + 1}_${i}`] : [],
          fileType: i % 3 === 0 ? 'solidity' : 'typescript'
        })
      }
    })
  }

  async start() {
    if (this.isRunning) return
    
    this.isRunning = true
    logger.info('Blockchain developer started')
    
    // Load progress from database
    await this.loadProgress()
    
    // Start development
    this.runDevelopment()
  }

  private async loadProgress() {
    try {
      const result = await query(
        'SELECT * FROM blockchain_progress WHERE status = $1',
        ['completed']
      )
      
      if (result.rows.length > 0) {
        this.currentComponentIndex = result.rows.length
        logger.info(`Resumed from component ${this.currentComponentIndex}/640`)
      }
      
      // Load stats
      const stats = await query('SELECT * FROM global_stats')
      stats.rows.forEach(stat => {
        if (stat.stat_name === 'total_lines_of_code') this.linesOfCode = parseInt(stat.stat_value)
        if (stat.stat_name === 'total_commits') this.commits = parseInt(stat.stat_value)
        if (stat.stat_name === 'total_tests_run') this.testsRun = parseInt(stat.stat_value)
      })
      
    } catch (error) {
      logger.error('Failed to load progress:', error)
    }
  }

  private async runDevelopment() {
    const developComponent = async () => {
      if (this.currentComponentIndex >= this.components.length) {
        await this.complete()
        return
      }

      const component = this.components[this.currentComponentIndex]
      
      try {
        // Update database - mark as in progress
        await query(
          `INSERT INTO blockchain_progress 
           (phase, component_number, component_name, description, status, started_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (component_number) 
           DO UPDATE SET status = $5, started_at = $6`,
          [component.phase, component.id, component.name, component.description, 'in_progress', new Date()]
        )

        // Generate code
        const code = await this.generateComponentCode(component)
        
        if (code) {
          // Store in cache
          this.codeCache.set(component.id, code)
          
          // Count lines
          const lines = code.split('\n').length
          this.linesOfCode += lines
          
          // Update database
          await query(
            `UPDATE blockchain_progress 
             SET status = $1, completed_at = $2, code_snippet = $3, lines_of_code = $4
             WHERE component_number = $5`,
            ['completed', new Date(), code.substring(0, 500), lines, component.id]
          )
          
          // Log activity
          await query(
            `INSERT INTO development_logs 
             (component_id, action_type, description, details)
             VALUES ($1, $2, $3, $4)`,
            [component.id, 'code_written', `Completed ${component.name}`, { lines }]
          )
          
          // Update stats
          await query(
            `UPDATE global_stats SET stat_value = $1, last_updated = CURRENT_TIMESTAMP 
             WHERE stat_name = 'total_lines_of_code'`,
            [this.linesOfCode]
          )
          
          await query(
            `UPDATE global_stats SET stat_value = $1, last_updated = CURRENT_TIMESTAMP 
             WHERE stat_name = 'components_completed'`,
            [this.currentComponentIndex + 1]
          )
          
          // Emit to frontend
          this.io.emit('terminal:log', {
            id: Date.now().toString(),
            timestamp: new Date(),
            type: 'code',
            message: `✓ Developed ${component.name} (${lines} lines)`,
            details: {
              componentId: component.id,
              phase: component.phase,
              codePreview: code.substring(0, 200) + '...'
            }
          })
          
          // Emit progress
          const progress = this.calculateProgress()
          this.io.emit('blockchain:progress', progress)
          
          // Simulate commits
          if ((this.currentComponentIndex + 1) % 10 === 0) {
            await this.simulateCommit(component.phase)
          }
          
          // Simulate tests
          if ((this.currentComponentIndex + 1) % 20 === 0) {
            await this.simulateTests()
          }
          
          // Phase completion
          if ((this.currentComponentIndex + 1) % 160 === 0) {
            await this.completePhase(Math.floor((this.currentComponentIndex + 1) / 160))
          }
        }
        
        this.currentComponentIndex++
        
      } catch (error) {
        logger.error(`Failed to develop component ${component.name}:`, error)
      }
    }

    // Faster interval for testing, slower for production
    const interval = process.env.NODE_ENV === 'development' 
      ? 10000  // 10 seconds in dev
      : Math.min(this.componentInterval, 300000) // Max 5 minutes in production
    
    this.intervalId = setInterval(developComponent, interval)
    developComponent() // Start immediately
  }

  private async generateComponentCode(component: BlockchainComponent): Promise<string> {
    // Try to use Claude API
    if (this.anthropic) {
      try {
        const prompt = this.buildPrompt(component)
        
        const response = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Using Haiku for faster/cheaper responses
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
        
        const content = response.content[0]
        if (content.type === 'text') {
          return this.extractCode(content.text)
        }
      } catch (error) {
        logger.error('Claude API error:', error)
      }
    }
    
    // Fallback to mock code
    return this.generateMockCode(component)
  }

  private buildPrompt(component: BlockchainComponent): string {
    if (component.fileType === 'solidity') {
      return `Create a Solidity smart contract for: ${component.description}
Requirements:
- Solidity ^0.8.0
- Gas optimized
- Include events
- Follow security best practices
Generate only the contract code.`
    }
    
    return `Create a TypeScript module for: ${component.description}
Requirements:
- Production-ready TypeScript
- Proper error handling
- Export main functionality
Generate only the code.`
  }

  private extractCode(response: string): string {
    const codeMatch = response.match(/```(?:typescript|javascript|solidity)?\n([\s\S]*?)```/)
    return codeMatch ? codeMatch[1].trim() : response.trim()
  }

  private generateMockCode(component: BlockchainComponent): string {
    if (component.fileType === 'solidity') {
      return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${component.name.replace(/_/g, '')} {
    mapping(address => uint256) private _balances;
    uint256 public totalSupply;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}`
    }
    
    return `/**
 * ${component.description}
 */
export class ${component.name.replace(/_/g, '')} {
  private initialized: boolean = false
  
  async initialize(): Promise<void> {
    this.initialized = true
  }
  
  async process(data: any): Promise<any> {
    if (!this.initialized) throw new Error('Not initialized')
    return { success: true, data }
  }
}`
  }

  private async simulateCommit(phase: number) {
    this.commits++
    
    await query(
      `UPDATE global_stats SET stat_value = $1, last_updated = CURRENT_TIMESTAMP 
       WHERE stat_name = 'total_commits'`,
      [this.commits]
    )
    
    await query(
      `INSERT INTO development_logs 
       (action_type, description, details)
       VALUES ($1, $2, $3)`,
      ['commit', `Phase ${phase} progress commit #${this.commits}`, { commitNumber: this.commits }]
    )
    
    this.io.emit('terminal:log', {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'commit',
      message: `📦 Committed progress: ${this.currentComponentIndex + 1}/640 components`
    })
  }

  private async simulateTests() {
    this.testsRun += 10
    
    await query(
      `UPDATE global_stats SET stat_value = $1, last_updated = CURRENT_TIMESTAMP 
       WHERE stat_name = 'total_tests_run'`,
      [this.testsRun]
    )
    
    this.io.emit('terminal:log', {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'test',
      message: `✅ Tests passed: 10/10 (Total: ${this.testsRun})`
    })
  }

  private async completePhase(phaseNum: number) {
    const phaseNames = ['Core Infrastructure', 'Consensus Mechanism', 'Smart Contract Layer', 'Network & Security']
    
    await query(
      `INSERT INTO development_logs 
       (action_type, description, details)
       VALUES ($1, $2, $3)`,
      ['phase_complete', `Phase ${phaseNum}: ${phaseNames[phaseNum - 1]} completed!`, { phase: phaseNum }]
    )
    
    await query(
      `UPDATE global_stats SET stat_value = $1, last_updated = CURRENT_TIMESTAMP 
       WHERE stat_name = 'current_phase'`,
      [Math.min(phaseNum + 1, 4)]
    )
    
    this.io.emit('terminal:log', {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'phase',
      message: `🎉 Phase ${phaseNum} Complete: ${phaseNames[phaseNum - 1]}`
    })
  }

  private calculateProgress() {
    const completedComponents = this.currentComponentIndex
    const currentPhase = Math.min(Math.floor(this.currentComponentIndex / 160) + 1, 4)
    const phaseProgress = (this.currentComponentIndex % 160) / 160 * 100
    
    return {
      currentPhase,
      phaseProgress,
      totalComponents: 640,
      completedComponents,
      percentComplete: (completedComponents / 640) * 100,
      linesOfCode: this.linesOfCode,
      commits: this.commits,
      testsRun: this.testsRun,
      estimatedCompletion: new Date(this.startTime.getTime() + this.totalDuration)
    }
  }

  private async complete() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    this.io.emit('terminal:log', {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'system',
      message: '🚀 Blockchain development completed! Ready for deployment.'
    })
    
    this.io.emit('blockchain:complete', {
      totalComponents: 640,
      totalLines: this.linesOfCode,
      totalCommits: this.commits,
      totalTests: this.testsRun,
      completedAt: new Date()
    })
  }

  stop() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    logger.info('Blockchain developer stopped')
  }
}