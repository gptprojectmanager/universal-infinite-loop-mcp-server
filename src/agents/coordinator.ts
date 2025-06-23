// Agent Coordination System - Sub-Agent Management and Execution

import {
  AgentAssignment,
  WaveResult,
  ContextMonitor,
  UniversalSpecification,
  GenerationWave
} from '../types/index.js';

export interface AgentExecutionContext {
  assignment: AgentAssignment;
  wave: GenerationWave;
  contextBudget: number;
  timeoutMs: number;
}

export interface AgentProgress {
  agentId: string;
  status: 'ASSIGNED' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  estimatedCompletion: number; // Timestamp
  lastUpdate: number; // Timestamp
  contextUsage: number;
  progressNotes: string[];
}

export class AgentCoordinator {
  private activeAgents: Map<string, AgentProgress> = new Map();
  private completedAgents: Map<string, WaveResult> = new Map();
  
  /**
   * Coordinate parallel agent execution with sophisticated assignment
   */
  async coordinateAgents(
    assignments: AgentAssignment[],
    wave: GenerationWave,
    contextMonitor: ContextMonitor
  ): Promise<WaveResult[]> {
    console.log(`Coordinating ${assignments.length} agents for wave ${wave.id}`);
    
    // Initialize agent tracking
    assignments.forEach(assignment => {
      this.activeAgents.set(assignment.agentId, {
        agentId: assignment.agentId,
        status: 'ASSIGNED',
        progress: 0,
        estimatedCompletion: Date.now() + 120000, // 2 minute default
        lastUpdate: Date.now(),
        contextUsage: 0,
        progressNotes: []
      });
    });
    
    try {
      // Execute agents in parallel with coordination
      const executionPromises = assignments.map(assignment => 
        this.executeCoordinatedAgent(assignment, wave, contextMonitor)
      );
      
      const results = await Promise.all(executionPromises);
      
      // Store completed results
      results.forEach(result => {
        this.completedAgents.set(result.agentId, result);
        this.activeAgents.delete(result.agentId);
      });
      
      return results;
      
    } catch (error) {
      console.error('Agent coordination failed:', error);
      throw error;
    }
  }
  
  /**
   * Execute a single agent with coordination and monitoring
   */
  private async executeCoordinatedAgent(
    assignment: AgentAssignment,
    wave: GenerationWave,
    contextMonitor: ContextMonitor
  ): Promise<WaveResult> {
    const startTime = Date.now();
    const agentProgress = this.activeAgents.get(assignment.agentId)!;
    
    try {
      // Update status to starting
      this.updateAgentProgress(assignment.agentId, {
        status: 'STARTING',
        progress: 5,
        progressNotes: ['Agent initialization started']
      });
      
      // Generate agent prompt based on assignment
      const agentPrompt = this.generateAgentPrompt(assignment, wave);
      
      // Update to in progress
      this.updateAgentProgress(assignment.agentId, {
        status: 'IN_PROGRESS',
        progress: 20,
        progressNotes: ['Prompt generated, beginning execution']
      });
      
      // Execute the agent (this would integrate with actual agent execution system)
      const result = await this.executeAgent(agentPrompt, assignment, wave);
      
      // Update to completing
      this.updateAgentProgress(assignment.agentId, {
        status: 'COMPLETING',
        progress: 90,
        progressNotes: ['Execution completed, finalizing output']
      });
      
      // Validate and finalize result
      const finalResult = await this.validateAndFinalizeResult(result, assignment, wave);
      
      // Mark as completed
      this.updateAgentProgress(assignment.agentId, {
        status: 'COMPLETED',
        progress: 100,
        progressNotes: ['Agent execution completed successfully']
      });
      
      return {
        agentId: assignment.agentId,
        iterationNumber: assignment.iterationNumber,
        success: true,
        outputPath: finalResult.outputPath,
        qualityScore: finalResult.qualityScore,
        uniquenessScore: finalResult.uniquenessScore,
        completionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`Agent ${assignment.agentId} failed:`, error);
      
      this.updateAgentProgress(assignment.agentId, {
        status: 'FAILED',
        progressNotes: [`Execution failed: ${error}`]
      });
      
      return {
        agentId: assignment.agentId,
        iterationNumber: assignment.iterationNumber,
        success: false,
        errorMessage: `Agent execution failed: ${error}`,
        completionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Generate sophisticated agent prompt based on assignment
   */
  private generateAgentPrompt(assignment: AgentAssignment, wave: GenerationWave): string {
    const { uniqueDirective, taskContext, qualityStandards } = assignment;
    const spec = wave.specification;
    
    return `# Agent Task Assignment - Iteration ${assignment.iterationNumber}

You are Sub-Agent ${assignment.agentId} generating iteration ${assignment.iterationNumber} for "${spec.name}".

## SPECIFICATION CONTEXT
- **Domain**: ${spec.domain.category} - ${spec.domain.subcategory}
- **Target Audience**: ${spec.domain.targetAudience}
- **Complexity Level**: ${spec.domain.complexity}
- **Output Format**: ${spec.outputRequirements.format}

## YOUR UNIQUE ASSIGNMENT
- **Innovation Focus**: ${uniqueDirective.innovationFocus}
- **Creative Boundary**: ${uniqueDirective.creativeBoundary}
- **Differentiation Strategy**: ${uniqueDirective.differentiationStrategy}
- **Target Audience**: ${uniqueDirective.targetAudience}

## TASK CONTEXT
**Specification Summary**: ${taskContext.specificationSummary}

**Domain Context**: ${taskContext.domainContext}

**Goal Statement**: ${taskContext.goalStatement}

**Existing Work Summary**:
${taskContext.existingWork.length > 0 ? taskContext.existingWork.map(work => `- ${work}`).join('\n') : '- No previous iterations (you are creating the first)'}

## QUALITY STANDARDS

### Functional Requirements
${qualityStandards.functionalRequirements.map(req => `- ${req}`).join('\n')}

### Design Requirements  
${qualityStandards.designRequirements.map(req => `- ${req}`).join('\n')}

### Performance Requirements
${qualityStandards.performanceRequirements.map(req => `- ${req}`).join('\n')}

### Uniqueness Requirements
${qualityStandards.uniquenessRequirements.map(req => `- ${req}`).join('\n')}

### Domain-Specific Requirements
${qualityStandards.domainSpecificRequirements.map(req => `- ${req}`).join('\n')}

## SPECIFICATION DETAILS

**Success Criteria**:
${spec.successCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Innovation Dimensions Available**:
${spec.innovationDimensions.map(dim => `- ${dim}`).join('\n')}

**Constraints**:
${spec.constraints.map(constraint => `- ${constraint}`).join('\n')}

**Evolution Pattern**: ${spec.evolutionPattern}
**Progression Strategy**: ${spec.progressionStrategy}

## OUTPUT REQUIREMENTS

**Format**: ${spec.outputRequirements.format}
**Structure**: ${spec.outputRequirements.structure}
**Naming Pattern**: ${spec.outputRequirements.namingPattern.replace('{number}', assignment.iterationNumber.toString())}

**Quality Standards**:
${spec.outputRequirements.qualityStandards.map(standard => `- ${standard}`).join('\n')}

## EXECUTION INSTRUCTIONS

1. **Analyze Requirements**: Understand the specification and your unique creative assignment
2. **Review Existing Work**: Study existing iterations to ensure your output is genuinely unique
3. **Design Solution**: Plan your approach focusing on your assigned innovation dimension
4. **Implement**: Create the output following all quality standards and requirements  
5. **Validate**: Ensure your output meets functional requirements and demonstrates clear innovation
6. **Document**: Provide clear explanation of your innovation and design decisions

## CRITICAL SUCCESS FACTORS

- **Uniqueness**: Your iteration must be distinctly different from existing work
- **Quality**: Must meet or exceed the sophistication level requirements
- **Compliance**: Must follow all specification requirements and constraints
- **Innovation**: Must genuinely explore and advance your assigned innovation dimension
- **Functionality**: Must be complete, working, and meet all functional requirements

## DELIVERABLE

Create a single ${spec.outputRequirements.format} file named according to the naming pattern, with complete implementation that demonstrates clear innovation in ${uniqueDirective.innovationFocus} while meeting all quality and functional requirements.

Begin execution immediately and focus on delivering exceptional results that advance the overall project goals.`;
  }
  
  /**
   * Execute agent with actual implementation (placeholder for integration)
   */
  private async executeAgent(
    prompt: string, 
    assignment: AgentAssignment, 
    wave: GenerationWave
  ): Promise<{
    outputPath: string;
    qualityScore: number;
    uniquenessScore: number;
  }> {
    // This is where we would integrate with the actual agent execution system
    // For now, simulate execution with realistic timing
    
    const executionTime = 2000 + Math.random() * 3000; // 2-5 seconds simulation
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Generate realistic output path
    const outputPath = `${wave.outputDirectory}/${wave.specification.outputRequirements.namingPattern.replace('{number}', assignment.iterationNumber.toString())}`;
    
    // Simulate quality scoring based on sophistication level
    const baseQuality = 70;
    const sophisticationBonus = wave.sophisticationLevel.level * 5;
    const randomVariation = Math.random() * 20;
    const qualityScore = Math.min(100, baseQuality + sophisticationBonus + randomVariation);
    
    // Simulate uniqueness scoring
    const baseUniqueness = 75;
    const iterationPenalty = Math.max(0, (assignment.iterationNumber - 1) * 2); // Later iterations harder to be unique
    const uniquenessScore = Math.max(50, baseUniqueness - iterationPenalty + (Math.random() * 20));
    
    return {
      outputPath,
      qualityScore: Math.round(qualityScore),
      uniquenessScore: Math.round(uniquenessScore)
    };
  }
  
  /**
   * Validate and finalize agent result
   */
  private async validateAndFinalizeResult(
    result: any,
    assignment: AgentAssignment,
    wave: GenerationWave
  ): Promise<any> {
    // Validate against specification requirements
    const validationResults = this.validateAgainstSpecification(result, wave.specification);
    
    // Apply any necessary post-processing
    if (validationResults.needsAdjustment) {
      // Apply adjustments
      result.qualityScore *= 0.95; // Slight penalty for needing adjustments
    }
    
    return result;
  }
  
  /**
   * Validate result against specification
   */
  private validateAgainstSpecification(result: any, spec: UniversalSpecification): {
    valid: boolean;
    needsAdjustment: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Basic validation logic
    if (result.qualityScore < 70) {
      issues.push('Quality score below acceptable threshold');
    }
    
    if (result.uniquenessScore < 60) {
      issues.push('Uniqueness score below acceptable threshold');
    }
    
    return {
      valid: issues.length === 0,
      needsAdjustment: issues.length > 0 && issues.length < 3,
      issues
    };
  }
  
  /**
   * Update agent progress tracking
   */
  private updateAgentProgress(agentId: string, updates: Partial<AgentProgress>): void {
    const current = this.activeAgents.get(agentId);
    if (current) {
      this.activeAgents.set(agentId, {
        ...current,
        ...updates,
        lastUpdate: Date.now()
      });
    }
  }
  
  /**
   * Get current status of all agents
   */
  getAgentStatuses(): Map<string, AgentProgress> {
    return new Map(this.activeAgents);
  }
  
  /**
   * Get completed agent results
   */
  getCompletedResults(): Map<string, WaveResult> {
    return new Map(this.completedAgents);
  }
  
  /**
   * Check if all agents have completed
   */
  areAllAgentsComplete(): boolean {
    return this.activeAgents.size === 0;
  }
  
  /**
   * Get overall coordination metrics
   */
  getCoordinationMetrics(): {
    totalAgents: number;
    activeAgents: number;
    completedAgents: number;
    failedAgents: number;
    averageProgress: number;
    averageCompletionTime: number;
  } {
    const completed = Array.from(this.completedAgents.values());
    const active = Array.from(this.activeAgents.values());
    
    const failedCount = completed.filter(r => !r.success).length;
    const avgProgress = active.length > 0 
      ? active.reduce((sum, a) => sum + a.progress, 0) / active.length 
      : 100;
    const avgCompletionTime = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.completionTime, 0) / completed.length
      : 0;
    
    return {
      totalAgents: this.activeAgents.size + this.completedAgents.size,
      activeAgents: this.activeAgents.size,
      completedAgents: completed.filter(r => r.success).length,
      failedAgents: failedCount,
      averageProgress: Math.round(avgProgress),
      averageCompletionTime: Math.round(avgCompletionTime)
    };
  }
}