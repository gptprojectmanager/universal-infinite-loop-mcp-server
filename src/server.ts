#!/usr/bin/env node

// Universal Infinite Loop MCP Server - Main Server Implementation

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { SpecificationParser } from './specifications/parser.js';
import { WaveManager } from './orchestration/waveManager.js';
import { AgentCoordinator } from './agents/coordinator.js';
import {
  UniversalSpecification,
  OrchestrationMode,
  OrchestrationConfig,
  InfiniteOrchestrateParams,
  WavePlanParams,
  AgentCoordinateParams,
  ContextMonitorParams,
  SpecValidateParams,
  OrchestrationResult,
  WavePlanResult,
  ValidationResult
} from './types/index.js';

// Zod schemas for parameter validation
const OrchestrationModeSchema = z.object({
  type: z.enum(['SINGLE', 'BATCH', 'INFINITE']),
  count: z.union([z.number().min(1), z.literal('INFINITE')]),
  batchSize: z.number().min(1).max(20).optional(),
  maxWaves: z.number().min(1).optional()
});

const InfiniteOrchestrateSchema = z.object({
  specification: z.any(), // Will be validated by SpecificationParser
  outputDirectory: z.string().min(1),
  mode: OrchestrationModeSchema,
  config: z.object({
    contextThreshold: z.number().min(0.1).max(1.0).optional(),
    gracefulShutdown: z.boolean().optional(),
    progressiveSophistication: z.boolean().optional(),
    failureHandling: z.object({
      maxRetries: z.number().min(0).optional(),
      timeoutMs: z.number().min(1000).optional(),
      gracefulDegradation: z.boolean().optional()
    }).optional()
  }).optional()
});

const WavePlanSchema = z.object({
  existingWork: z.array(z.any()),
  sophisticationLevel: z.any(),
  targetCount: z.number().min(1),
  contextBudget: z.number().min(1000)
});

const AgentCoordinateSchema = z.object({
  assignments: z.array(z.any()),
  innovationDimensions: z.array(z.string()),
  contextMonitor: z.any()
});

const ContextMonitorSchema = z.object({
  waveId: z.string().uuid(),
  capacityThreshold: z.number().min(0.1).max(1.0),
  gracefulShutdown: z.boolean()
});

const SpecValidateSchema = z.object({
  userSpec: z.any(),
  domain: z.any(),
  outputRequirements: z.any()
});

class InfiniteLoopMCPServer {
  private server: Server;
  private waveManager: WaveManager;
  private agentCoordinator: AgentCoordinator;
  
  constructor() {
    this.server = new Server(
      {
        name: 'infinite-loop-mcp-server',
        version: '1.0.0',
        description: 'Universal Infinite Agentic Loop MCP Server - Goal-agnostic parallel orchestration framework'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.waveManager = new WaveManager();
    this.agentCoordinator = new AgentCoordinator();
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }
  
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'infinite_orchestrate',
            description: 'Orchestrate infinite agentic loop generation with universal specifications',
            inputSchema: {
              type: 'object',
              properties: {
                specification: {
                  type: 'object',
                  description: 'Universal specification defining generation parameters'
                },
                outputDirectory: {
                  type: 'string',
                  description: 'Directory where iterations will be generated'
                },
                mode: {
                  type: 'object',
                  description: 'Orchestration mode configuration',
                  properties: {
                    type: { type: 'string', enum: ['SINGLE', 'BATCH', 'INFINITE'] },
                    count: { oneOf: [{ type: 'number' }, { type: 'string', enum: ['INFINITE'] }] },
                    batchSize: { type: 'number' },
                    maxWaves: { type: 'number' }
                  },
                  required: ['type', 'count']
                },
                config: {
                  type: 'object',
                  description: 'Optional orchestration configuration',
                  properties: {
                    contextThreshold: { type: 'number' },
                    gracefulShutdown: { type: 'boolean' },
                    progressiveSophistication: { type: 'boolean' }
                  }
                }
              },
              required: ['specification', 'outputDirectory', 'mode']
            }
          },
          {
            name: 'wave_plan',
            description: 'Plan a generation wave based on existing work and sophistication level',
            inputSchema: {
              type: 'object',
              properties: {
                existingWork: {
                  type: 'array',
                  description: 'Array of existing iteration information'
                },
                sophisticationLevel: {
                  type: 'object',
                  description: 'Target sophistication level for the wave'
                },
                targetCount: {
                  type: 'number',
                  description: 'Number of iterations to plan for'
                },
                contextBudget: {
                  type: 'number',
                  description: 'Available context budget for the wave'
                }
              },
              required: ['existingWork', 'sophisticationLevel', 'targetCount', 'contextBudget']
            }
          },
          {
            name: 'agent_coordinate',
            description: 'Coordinate parallel agent execution with sophisticated assignment',
            inputSchema: {
              type: 'object',
              properties: {
                assignments: {
                  type: 'array',
                  description: 'Array of agent assignments'
                },
                innovationDimensions: {
                  type: 'array',
                  description: 'Available innovation dimensions'
                },
                contextMonitor: {
                  type: 'object',
                  description: 'Context monitoring configuration'
                }
              },
              required: ['assignments', 'innovationDimensions', 'contextMonitor']
            }
          },
          {
            name: 'context_monitor',
            description: 'Monitor context capacity and manage graceful shutdown',
            inputSchema: {
              type: 'object',
              properties: {
                waveId: {
                  type: 'string',
                  description: 'Wave ID to monitor'
                },
                capacityThreshold: {
                  type: 'number',
                  description: 'Threshold for triggering graceful shutdown (0.0-1.0)'
                },
                gracefulShutdown: {
                  type: 'boolean',
                  description: 'Whether to enable graceful shutdown'
                }
              },
              required: ['waveId', 'capacityThreshold', 'gracefulShutdown']
            }
          },
          {
            name: 'spec_validate',
            description: 'Validate and enhance user specifications for goal-agnostic generation',
            inputSchema: {
              type: 'object',
              properties: {
                userSpec: {
                  type: 'object',
                  description: 'User-provided specification'
                },
                domain: {
                  type: 'object',
                  description: 'Domain information'
                },
                outputRequirements: {
                  type: 'object',
                  description: 'Output requirements'
                }
              },
              required: ['userSpec', 'domain', 'outputRequirements']
            }
          }
        ] as Tool[]
      };
    });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'infinite_orchestrate':
            return await this.handleInfiniteOrchestrate(args);
          case 'wave_plan':
            return await this.handleWavePlan(args);
          case 'agent_coordinate':
            return await this.handleAgentCoordinate(args);
          case 'context_monitor':
            return await this.handleContextMonitor(args);
          case 'spec_validate':
            return await this.handleSpecValidate(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`
        );
      }
    });
  }
  
  private async handleInfiniteOrchestrate(args: any): Promise<{ content: any[] }> {
    const params = InfiniteOrchestrateSchema.parse(args);
    
    // Validate specification
    const specValidation = SpecificationParser.parseSpecification(params.specification);
    if (!specValidation.valid) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid specification: ${specValidation.errors.join(', ')}`
      );
    }
    
    const specification = specValidation.specification;
    const config: OrchestrationConfig = {
      mode: params.mode,
      contextThreshold: params.config?.contextThreshold || 0.9,
      gracefulShutdown: params.config?.gracefulShutdown || true,
      progressiveSophistication: params.config?.progressiveSophistication || true,
      failureHandling: {
        maxRetries: params.config?.failureHandling?.maxRetries || 3,
        timeoutMs: params.config?.failureHandling?.timeoutMs || 300000,
        gracefulDegradation: params.config?.failureHandling?.gracefulDegradation || true
      }
    };
    
    const result = await this.orchestrateInfiniteLoop(
      specification,
      params.outputDirectory,
      config
    );
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
  
  private async handleWavePlan(args: any): Promise<{ content: any[] }> {
    const params = WavePlanSchema.parse(args);
    
    // This would integrate with the actual wave planning logic
    const planResult: WavePlanResult = {
      waveConfiguration: {
        id: crypto.randomUUID(),
        waveNumber: 1,
        specification: {} as UniversalSpecification,
        sophisticationLevel: params.sophisticationLevel,
        agentAssignments: [],
        maxConcurrency: 5,
        contextBudget: params.contextBudget,
        estimatedDuration: 300,
        outputDirectory: '',
        existingIterations: params.existingWork,
        targetIterations: params.targetCount,
        status: 'PLANNED'
      },
      agentAssignments: [],
      estimatedDuration: 300,
      contextRequirement: params.contextBudget
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(planResult, null, 2)
      }]
    };
  }
  
  private async handleAgentCoordinate(args: any): Promise<{ content: any[] }> {
    const params = AgentCoordinateSchema.parse(args);
    
    const coordinationMetrics = this.agentCoordinator.getCoordinationMetrics();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: 'Agent coordination initiated',
          metrics: coordinationMetrics,
          assignmentCount: params.assignments.length,
          innovationDimensions: params.innovationDimensions
        }, null, 2)
      }]
    };
  }
  
  private async handleContextMonitor(args: any): Promise<{ content: any[] }> {
    const params = ContextMonitorSchema.parse(args);
    
    const contextStatus = this.waveManager.getContextMonitor();
    const shouldShutdown = this.waveManager.shouldTriggerGracefulShutdown(params.capacityThreshold);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          waveId: params.waveId,
          contextStatus,
          shouldTriggerGracefulShutdown: shouldShutdown,
          thresholdUsed: params.capacityThreshold
        }, null, 2)
      }]
    };
  }
  
  private async handleSpecValidate(args: any): Promise<{ content: any[] }> {
    const params = SpecValidateSchema.parse(args);
    
    let result: ValidationResult;
    
    if (this.isMinimalSpec(params.userSpec)) {
      // Create from minimal input
      const specification = SpecificationParser.createFromMinimalInput({
        name: params.userSpec.name || 'Generated Specification',
        description: params.userSpec.description || 'Auto-generated specification',
        domain: params.domain,
        outputFormat: params.outputRequirements.format || 'file',
        goals: params.userSpec.goals || ['Generate functional output']
      });
      
      result = {
        valid: true,
        specification,
        warnings: ['Specification was enhanced with default values'],
        errors: [],
        suggestions: ['Review generated specification and customize as needed']
      };
    } else {
      // Validate full specification
      result = SpecificationParser.parseSpecification(params.userSpec);
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
  
  private isMinimalSpec(spec: any): boolean {
    const requiredFields = ['id', 'version', 'sophisticationLevels', 'innovationDimensions'];
    return !requiredFields.every(field => field in spec);
  }
  
  private async orchestrateInfiniteLoop(
    specification: UniversalSpecification,
    outputDirectory: string,
    config: OrchestrationConfig
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    let totalIterations = 0;
    let completedWaves = 0;
    const allResults: any[] = [];
    
    try {
      // For demonstration, simulate a single wave execution
      const sophisticationLevel = specification.sophisticationLevels[0];
      const existingIterations: any[] = [];
      
      const wavePlan = this.waveManager.planWave(
        specification,
        config.mode,
        existingIterations,
        sophisticationLevel,
        outputDirectory
      );
      
      const waveResults = await this.waveManager.executeWave(wavePlan.waveConfiguration);
      
      totalIterations = waveResults.length;
      completedWaves = 1;
      allResults.push(...waveResults);
      
      return {
        success: true,
        totalIterations,
        completedWaves,
        outputDirectory,
        results: allResults,
        contextUsage: this.waveManager.getContextMonitor(),
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        totalIterations,
        completedWaves,
        outputDirectory,
        results: allResults,
        contextUsage: this.waveManager.getContextMonitor(),
        duration: Date.now() - startTime,
        errorMessage: `Orchestration failed: ${error}`
      };
    }
  }
  
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
    
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      await this.server.close();
      process.exit(0);
    });
  }
  
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Infinite Loop MCP Server running on stdio');
  }
}

// Start the server
const server = new InfiniteLoopMCPServer();
server.run().catch(console.error);