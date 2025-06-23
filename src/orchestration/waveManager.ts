// Wave-Based Generation Manager - Universal Parallel Orchestration

import {
  GenerationWave,
  AgentAssignment,
  UniqueDirective,
  TaskContext,
  QualityStandards,
  WaveResult,
  OrchestrationMode,
  ContextMonitor,
  UniversalSpecification,
  IterationInfo,
  SophisticationLevel,
  WavePlanResult
} from '../types/index.js';

export class WaveManager {
  private contextMonitor: ContextMonitor;
  private activeWaves: Map<string, GenerationWave> = new Map();
  
  constructor(initialCapacity: number = 100000) {
    this.contextMonitor = {
      totalCapacity: initialCapacity,
      usedCapacity: 0,
      reservedCapacity: 0,
      waveUsage: new Map(),
      agentUsage: new Map(),
      utilizationPercentage: 0,
      remainingCapacity: initialCapacity
    };
  }
  
  /**
   * Plan a generation wave based on specifications and existing work
   */
  planWave(
    specification: UniversalSpecification,
    mode: OrchestrationMode,
    existingIterations: IterationInfo[],
    sophisticationLevel: SophisticationLevel,
    outputDirectory: string
  ): WavePlanResult {
    const waveId = crypto.randomUUID();
    const waveNumber = this.getNextWaveNumber();
    
    // Determine wave size based on mode
    const waveSize = this.calculateWaveSize(mode, existingIterations.length);
    
    // Calculate context requirements
    const contextRequirement = this.estimateContextRequirement(waveSize, sophisticationLevel);
    
    // Generate agent assignments
    const agentAssignments = this.generateAgentAssignments(
      specification,
      waveSize,
      existingIterations,
      sophisticationLevel,
      outputDirectory
    );
    
    // Create wave configuration
    const waveConfiguration: GenerationWave = {
      id: waveId,
      waveNumber,
      specification,
      sophisticationLevel,
      agentAssignments,
      maxConcurrency: Math.min(waveSize, 5), // Limit concurrent agents
      contextBudget: contextRequirement,
      estimatedDuration: this.estimateWaveDuration(waveSize, sophisticationLevel),
      outputDirectory,
      existingIterations,
      targetIterations: waveSize,
      status: 'PLANNED'
    };
    
    return {
      waveConfiguration,
      agentAssignments,
      estimatedDuration: waveConfiguration.estimatedDuration,
      contextRequirement
    };
  }
  
  /**
   * Execute a planned generation wave
   */
  async executeWave(wave: GenerationWave): Promise<WaveResult[]> {
    wave.status = 'IN_PROGRESS';
    wave.startTime = new Date();
    
    this.activeWaves.set(wave.id, wave);
    this.updateContextUsage(wave.id, wave.contextBudget);
    
    try {
      const results: WaveResult[] = [];
      
      // Execute agents in batches to manage concurrency
      const batches = this.createAgentBatches(wave.agentAssignments, wave.maxConcurrency);
      
      for (const batch of batches) {
        const batchResults = await this.executeBatch(batch, wave);
        results.push(...batchResults);
      }
      
      wave.status = 'COMPLETED';
      wave.endTime = new Date();
      wave.results = results;
      
      return results;
      
    } catch (error) {
      wave.status = 'FAILED';
      wave.endTime = new Date();
      throw new Error(`Wave execution failed: ${error}`);
    } finally {
      this.releaseContextUsage(wave.id);
    }
  }
  
  /**
   * Monitor context usage and determine if graceful shutdown is needed
   */
  shouldTriggerGracefulShutdown(threshold: number = 0.9): boolean {
    return this.contextMonitor.utilizationPercentage >= threshold;
  }
  
  /**
   * Get current context monitor state
   */
  getContextMonitor(): ContextMonitor {
    return { ...this.contextMonitor };
  }
  
  /**
   * Generate sophisticated agent assignments with unique directives
   */
  private generateAgentAssignments(
    specification: UniversalSpecification,
    waveSize: number,
    existingIterations: IterationInfo[],
    sophisticationLevel: SophisticationLevel,
    outputDirectory: string
  ): AgentAssignment[] {
    const assignments: AgentAssignment[] = [];
    const usedDimensions = new Set<string>();
    
    // Get existing innovation dimensions to avoid duplication
    existingIterations.forEach(iteration => {
      iteration.innovationDimensions.forEach(dim => usedDimensions.add(dim));
    });
    
    // Generate assignments for each agent
    for (let i = 0; i < waveSize; i++) {
      const agentId = `agent_${crypto.randomUUID().substring(0, 8)}`;
      const iterationNumber = existingIterations.length + i + 1;
      
      // Select unique innovation focus
      const availableDimensions = specification.innovationDimensions.filter(
        dim => !usedDimensions.has(dim) || usedDimensions.size >= specification.innovationDimensions.length
      );
      const innovationFocus = availableDimensions[i % availableDimensions.length];
      usedDimensions.add(innovationFocus);
      
      // Generate unique directive
      const uniqueDirective: UniqueDirective = {
        innovationFocus,
        creativeBoundary: this.generateCreativeBoundary(specification, innovationFocus, sophisticationLevel),
        differentiationStrategy: this.generateDifferentiationStrategy(existingIterations, sophisticationLevel),
        targetAudience: specification.domain.targetAudience
      };
      
      // Generate task context
      const taskContext: TaskContext = {
        specificationSummary: this.generateSpecificationSummary(specification),
        existingWork: existingIterations.map(iter => `${iter.number}: ${iter.summary}`),
        domainContext: this.generateDomainContext(specification.domain),
        goalStatement: this.generateGoalStatement(specification, innovationFocus, iterationNumber)
      };
      
      // Generate quality standards
      const qualityStandards: QualityStandards = {
        functionalRequirements: specification.outputRequirements.qualityStandards,
        designRequirements: sophisticationLevel.qualityExpectations,
        performanceRequirements: this.generatePerformanceRequirements(specification.domain),
        uniquenessRequirements: [
          `Must differentiate from existing iterations`,
          `Must explore ${innovationFocus} dimension`,
          `Must achieve ${sophisticationLevel.name} level quality`
        ],
        domainSpecificRequirements: this.generateDomainSpecificRequirements(specification.domain)
      };
      
      assignments.push({
        agentId,
        iterationNumber,
        uniqueDirective,
        taskContext,
        qualityStandards
      });
    }
    
    return assignments;
  }
  
  private calculateWaveSize(mode: OrchestrationMode, existingCount: number): number {
    switch (mode.type) {
      case 'SINGLE':
        return 1;
      case 'BATCH':
        if (mode.count === 'INFINITE') return 5;
        const remaining = typeof mode.count === 'number' ? mode.count - existingCount : 5;
        return Math.min(remaining, mode.batchSize || 5);
      case 'INFINITE':
        return 5; // Default wave size for infinite mode
      default:
        return 1;
    }
  }
  
  private estimateContextRequirement(waveSize: number, sophisticationLevel: SophisticationLevel): number {
    const baseRequirement = 5000; // Base context per agent
    const sophisticationMultiplier = sophisticationLevel.level * 1.5;
    return Math.round(waveSize * baseRequirement * sophisticationMultiplier);
  }
  
  private estimateWaveDuration(waveSize: number, sophisticationLevel: SophisticationLevel): number {
    const baseTime = 120; // Base seconds per agent
    const sophisticationMultiplier = sophisticationLevel.level * 1.3;
    return Math.round(baseTime * sophisticationMultiplier);
  }
  
  private createAgentBatches(assignments: AgentAssignment[], maxConcurrency: number): AgentAssignment[][] {
    const batches: AgentAssignment[][] = [];
    for (let i = 0; i < assignments.length; i += maxConcurrency) {
      batches.push(assignments.slice(i, i + maxConcurrency));
    }
    return batches;
  }
  
  private async executeBatch(batch: AgentAssignment[], wave: GenerationWave): Promise<WaveResult[]> {
    const promises = batch.map(assignment => this.executeAgent(assignment, wave));
    return Promise.all(promises);
  }
  
  private async executeAgent(assignment: AgentAssignment, wave: GenerationWave): Promise<WaveResult> {
    const startTime = Date.now();
    
    try {
      // This would integrate with the Task tool or similar agent execution system
      // For now, we simulate the execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const outputPath = `${wave.outputDirectory}/${wave.specification.outputRequirements.namingPattern.replace('{number}', assignment.iterationNumber.toString())}`;
      
      return {
        agentId: assignment.agentId,
        iterationNumber: assignment.iterationNumber,
        success: true,
        outputPath,
        qualityScore: 85 + Math.random() * 15, // Simulated quality score
        uniquenessScore: 80 + Math.random() * 20, // Simulated uniqueness score
        completionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        agentId: assignment.agentId,
        iterationNumber: assignment.iterationNumber,
        success: false,
        errorMessage: `Agent execution failed: ${error}`,
        completionTime: Date.now() - startTime
      };
    }
  }
  
  private getNextWaveNumber(): number {
    const maxWaveNumber = Math.max(...Array.from(this.activeWaves.values()).map(w => w.waveNumber), 0);
    return maxWaveNumber + 1;
  }
  
  private updateContextUsage(waveId: string, usage: number): void {
    this.contextMonitor.waveUsage.set(waveId, usage);
    this.contextMonitor.usedCapacity += usage;
    this.contextMonitor.remainingCapacity = this.contextMonitor.totalCapacity - this.contextMonitor.usedCapacity;
    this.contextMonitor.utilizationPercentage = (this.contextMonitor.usedCapacity / this.contextMonitor.totalCapacity) * 100;
  }
  
  private releaseContextUsage(waveId: string): void {
    const usage = this.contextMonitor.waveUsage.get(waveId) || 0;
    this.contextMonitor.usedCapacity -= usage;
    this.contextMonitor.waveUsage.delete(waveId);
    this.contextMonitor.remainingCapacity = this.contextMonitor.totalCapacity - this.contextMonitor.usedCapacity;
    this.contextMonitor.utilizationPercentage = (this.contextMonitor.usedCapacity / this.contextMonitor.totalCapacity) * 100;
    this.activeWaves.delete(waveId);
  }
  
  // Helper methods for generating context and directives
  private generateCreativeBoundary(spec: UniversalSpecification, focus: string, level: SophisticationLevel): string {
    return `Explore ${focus} with ${level.name} level innovation while maintaining ${spec.domain.category} best practices`;
  }
  
  private generateDifferentiationStrategy(existing: IterationInfo[], level: SophisticationLevel): string {
    if (existing.length === 0) {
      return `Establish foundational approach for ${level.name} level implementation`;
    }
    return `Build upon existing approaches while introducing novel ${level.name} level concepts`;
  }
  
  private generateSpecificationSummary(spec: UniversalSpecification): string {
    return `${spec.name}: ${spec.description} | Domain: ${spec.domain.category} | Output: ${spec.outputRequirements.format}`;
  }
  
  private generateDomainContext(domain: any): string {
    return `${domain.category} development for ${domain.targetAudience} with ${domain.complexity} complexity`;
  }
  
  private generateGoalStatement(spec: UniversalSpecification, focus: string, iteration: number): string {
    return `Create iteration ${iteration} focusing on ${focus} while meeting: ${spec.successCriteria.join(', ')}`;
  }
  
  private generatePerformanceRequirements(domain: any): string[] {
    const baseRequirements = ['Efficient execution', 'Reasonable resource usage'];
    
    switch (domain.category) {
      case 'UI':
        return [...baseRequirements, 'Fast rendering', 'Responsive interactions'];
      case 'CODE':
        return [...baseRequirements, 'Optimal time complexity', 'Memory efficiency'];
      default:
        return baseRequirements;
    }
  }
  
  private generateDomainSpecificRequirements(domain: any): string[] {
    switch (domain.category) {
      case 'UI':
        return ['Accessibility compliance', 'Cross-browser compatibility', 'Mobile responsiveness'];
      case 'CODE':
        return ['Code maintainability', 'Documentation', 'Test coverage'];
      case 'DOCUMENTATION':
        return ['Clear structure', 'Comprehensive examples', 'Search optimization'];
      default:
        return ['Domain best practices', 'Industry standards compliance'];
    }
  }
}