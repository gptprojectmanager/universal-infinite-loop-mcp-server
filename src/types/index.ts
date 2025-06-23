// Universal Infinite Loop MCP Server - Type Definitions

export interface UniversalSpecification {
  // Basic specification metadata
  id: string;
  name: string;
  description: string;
  domain: SpecificationDomain;
  version: string;
  
  // Goal-agnostic generation parameters
  outputRequirements: {
    format: string; // "file" | "directory" | "code" | "document" | "data"
    structure: string; // Expected output structure description
    namingPattern: string; // File/output naming convention
    qualityStandards: string[]; // Domain-specific quality criteria
  };
  
  // Innovation and creativity parameters
  innovationDimensions: string[]; // Creativity focus areas
  sophisticationLevels: SophisticationLevel[];
  constraints: string[]; // Domain-specific constraints
  
  // Evolution and progression settings
  evolutionPattern: 'LINEAR' | 'EXPONENTIAL' | 'ADAPTIVE' | 'CREATIVE_BURST';
  progressionStrategy: string; // How iterations should evolve
  
  // Validation and success criteria
  successCriteria: string[];
  validationRules: ValidationRule[];
}

export interface SpecificationDomain {
  category: 'UI' | 'DOCUMENTATION' | 'CODE' | 'RESEARCH' | 'CONTENT' | 'ANALYSIS' | 'DESIGN' | 'OTHER';
  subcategory: string; // React components, API docs, Python functions, etc.
  targetAudience: string; // Developers, users, researchers, etc.
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT';
}

export interface SophisticationLevel {
  level: number; // 1-N progression
  name: string; // "Basic", "Intermediate", "Advanced", "Revolutionary"
  description: string;
  innovationTargets: string[]; // What to focus on at this level
  qualityExpectations: string[];
}

export interface ValidationRule {
  type: 'SYNTAX' | 'SEMANTIC' | 'FUNCTIONAL' | 'QUALITY' | 'UNIQUENESS';
  description: string;
  validator: string; // Validation logic description
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
}

// Wave-based generation interfaces
export interface GenerationWave {
  id: string;
  waveNumber: number;
  specification: UniversalSpecification;
  sophisticationLevel: SophisticationLevel;
  
  // Agent coordination
  agentAssignments: AgentAssignment[];
  maxConcurrency: number;
  
  // Context and resource management
  contextBudget: number;
  estimatedDuration: number;
  
  // Output management
  outputDirectory: string;
  existingIterations: IterationInfo[];
  targetIterations: number;
  
  // Status tracking
  status: WaveStatus;
  startTime?: Date;
  endTime?: Date;
  results?: WaveResult[];
}

export interface AgentAssignment {
  agentId: string;
  iterationNumber: number;
  uniqueDirective: UniqueDirective;
  taskContext: TaskContext;
  qualityStandards: QualityStandards;
}

export interface UniqueDirective {
  innovationFocus: string; // Primary innovation dimension for this agent
  creativeBoundary: string; // Unique creative constraint/direction
  differentiationStrategy: string; // How to be different from existing iterations
  targetAudience?: string; // Specific audience focus if applicable
}

export interface TaskContext {
  specificationSummary: string; // Condensed spec for agent context
  existingWork: string[]; // Summary of existing iterations
  domainContext: string; // Domain-specific context and best practices
  goalStatement: string; // Clear goal for this specific iteration
}

export interface QualityStandards {
  functionalRequirements: string[];
  designRequirements: string[];
  performanceRequirements: string[];
  uniquenessRequirements: string[];
  domainSpecificRequirements: string[];
}

export interface IterationInfo {
  number: number;
  filePath: string;
  summary: string;
  innovationDimensions: string[];
  qualityScore: number;
  uniquenessScore: number;
}

export type WaveStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WaveResult {
  agentId: string;
  iterationNumber: number;
  success: boolean;
  outputPath?: string;
  qualityScore?: number;
  uniquenessScore?: number;
  errorMessage?: string;
  completionTime: number;
}

// Orchestration control interfaces
export interface OrchestrationMode {
  type: 'SINGLE' | 'BATCH' | 'INFINITE';
  count: number | 'INFINITE';
  batchSize?: number;
  maxWaves?: number;
}

export interface ContextMonitor {
  totalCapacity: number;
  usedCapacity: number;
  reservedCapacity: number;
  waveUsage: Map<string, number>;
  agentUsage: Map<string, number>;
  utilizationPercentage: number;
  remainingCapacity: number;
}

export interface OrchestrationConfig {
  mode: OrchestrationMode;
  contextThreshold: number; // When to trigger graceful shutdown
  gracefulShutdown: boolean;
  progressiveSophistication: boolean;
  failureHandling: {
    maxRetries: number;
    timeoutMs: number;
    gracefulDegradation: boolean;
  };
}

// MCP Tool interfaces
export interface InfiniteOrchestrateParams {
  specification: UniversalSpecification;
  outputDirectory: string;
  mode: OrchestrationMode;
  config?: Partial<OrchestrationConfig>;
}

export interface WavePlanParams {
  existingWork: IterationInfo[];
  sophisticationLevel: SophisticationLevel;
  targetCount: number;
  contextBudget: number;
}

export interface AgentCoordinateParams {
  assignments: AgentAssignment[];
  innovationDimensions: string[];
  contextMonitor: ContextMonitor;
}

export interface ContextMonitorParams {
  waveId: string;
  capacityThreshold: number;
  gracefulShutdown: boolean;
}

export interface SpecValidateParams {
  userSpec: Partial<UniversalSpecification>;
  domain: SpecificationDomain;
  outputRequirements: any;
}

// Result interfaces
export interface OrchestrationResult {
  success: boolean;
  totalIterations: number;
  completedWaves: number;
  outputDirectory: string;
  results: WaveResult[];
  contextUsage: ContextMonitor;
  duration: number;
  errorMessage?: string;
}

export interface WavePlanResult {
  waveConfiguration: GenerationWave;
  agentAssignments: AgentAssignment[];
  estimatedDuration: number;
  contextRequirement: number;
}

export interface ValidationResult {
  valid: boolean;
  specification: UniversalSpecification;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}