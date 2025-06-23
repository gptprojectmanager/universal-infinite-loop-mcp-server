// Universal Specification Parser - Goal-Agnostic Specification Processing

import { z } from 'zod';
import {
  UniversalSpecification,
  SpecificationDomain,
  SophisticationLevel,
  ValidationRule,
  ValidationResult
} from '../types/index.js';

// Zod schemas for validation
const SpecificationDomainSchema = z.object({
  category: z.enum(['UI', 'DOCUMENTATION', 'CODE', 'RESEARCH', 'CONTENT', 'ANALYSIS', 'DESIGN', 'OTHER']),
  subcategory: z.string().min(1),
  targetAudience: z.string().min(1),
  complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX', 'EXPERT'])
});

const SophisticationLevelSchema = z.object({
  level: z.number().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  innovationTargets: z.array(z.string()),
  qualityExpectations: z.array(z.string())
});

const ValidationRuleSchema = z.object({
  type: z.enum(['SYNTAX', 'SEMANTIC', 'FUNCTIONAL', 'QUALITY', 'UNIQUENESS']),
  description: z.string().min(1),
  validator: z.string().min(1),
  severity: z.enum(['WARNING', 'ERROR', 'CRITICAL'])
});

const UniversalSpecificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(10),
  domain: SpecificationDomainSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  outputRequirements: z.object({
    format: z.string().min(1),
    structure: z.string().min(1),
    namingPattern: z.string().min(1),
    qualityStandards: z.array(z.string())
  }),
  innovationDimensions: z.array(z.string()),
  sophisticationLevels: z.array(SophisticationLevelSchema),
  constraints: z.array(z.string()),
  evolutionPattern: z.enum(['LINEAR', 'EXPONENTIAL', 'ADAPTIVE', 'CREATIVE_BURST']),
  progressionStrategy: z.string().min(1),
  successCriteria: z.array(z.string()),
  validationRules: z.array(ValidationRuleSchema)
});

export class SpecificationParser {
  /**
   * Parse and validate a user-provided specification
   */
  static parseSpecification(input: any): ValidationResult {
    try {
      // Validate using Zod schema
      const validatedSpec = UniversalSpecificationSchema.parse(input);
      
      // Additional semantic validation
      const warnings: string[] = [];
      const errors: string[] = [];
      const suggestions: string[] = [];
      
      // Validate sophistication levels progression
      const levels = validatedSpec.sophisticationLevels.sort((a, b) => a.level - b.level);
      for (let i = 0; i < levels.length - 1; i++) {
        if (levels[i + 1].level !== levels[i].level + 1) {
          warnings.push(`Sophistication levels should be sequential. Gap found between level ${levels[i].level} and ${levels[i + 1].level}`);
        }
      }
      
      // Validate innovation dimensions
      if (validatedSpec.innovationDimensions.length < 3) {
        warnings.push('Consider adding more innovation dimensions for better creative diversity');
      }
      
      // Validate domain-specific requirements
      const domainValidation = this.validateDomainSpecificRequirements(validatedSpec);
      warnings.push(...domainValidation.warnings);
      suggestions.push(...domainValidation.suggestions);
      
      return {
        valid: errors.length === 0,
        specification: validatedSpec,
        warnings,
        errors,
        suggestions
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          specification: {} as UniversalSpecification,
          warnings: [],
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          suggestions: ['Review the specification format and ensure all required fields are provided']
        };
      }
      
      return {
        valid: false,
        specification: {} as UniversalSpecification,
        warnings: [],
        errors: [`Unexpected error: ${error}`],
        suggestions: ['Check specification format and try again']
      };
    }
  }
  
  /**
   * Create specification from minimal user input with intelligent defaults
   */
  static createFromMinimalInput(input: {
    name: string;
    description: string;
    domain: SpecificationDomain;
    outputFormat: string;
    goals: string[];
  }): UniversalSpecification {
    const id = crypto.randomUUID();
    
    // Generate default sophistication levels based on domain
    const sophisticationLevels = this.generateDefaultSophisticationLevels(input.domain);
    
    // Generate default innovation dimensions based on domain
    const innovationDimensions = this.generateDefaultInnovationDimensions(input.domain);
    
    // Generate validation rules based on domain
    const validationRules = this.generateDefaultValidationRules(input.domain);
    
    return {
      id,
      name: input.name,
      description: input.description,
      domain: input.domain,
      version: '1.0.0',
      outputRequirements: {
        format: input.outputFormat,
        structure: this.generateDefaultStructure(input.domain, input.outputFormat),
        namingPattern: this.generateDefaultNamingPattern(input.domain, input.outputFormat),
        qualityStandards: this.generateDefaultQualityStandards(input.domain)
      },
      innovationDimensions,
      sophisticationLevels,
      constraints: this.generateDefaultConstraints(input.domain),
      evolutionPattern: this.selectDefaultEvolutionPattern(input.domain),
      progressionStrategy: this.generateDefaultProgressionStrategy(input.domain),
      successCriteria: input.goals,
      validationRules
    };
  }
  
  /**
   * Generate domain-specific default sophistication levels
   */
  private static generateDefaultSophisticationLevels(domain: SpecificationDomain): SophisticationLevel[] {
    const baseLevels = [
      {
        level: 1,
        name: 'Basic',
        description: 'Fundamental functionality with core features',
        innovationTargets: ['core_functionality', 'basic_structure'],
        qualityExpectations: ['functional', 'readable', 'maintainable']
      },
      {
        level: 2,
        name: 'Intermediate',
        description: 'Enhanced features with improved user experience',
        innovationTargets: ['user_experience', 'performance', 'accessibility'],
        qualityExpectations: ['optimized', 'user_friendly', 'robust']
      },
      {
        level: 3,
        name: 'Advanced',
        description: 'Sophisticated implementation with innovative approaches',
        innovationTargets: ['innovation', 'scalability', 'integration'],
        qualityExpectations: ['scalable', 'innovative', 'production_ready']
      },
      {
        level: 4,
        name: 'Revolutionary',
        description: 'Cutting-edge concepts pushing domain boundaries',
        innovationTargets: ['paradigm_shift', 'future_concepts', 'disruptive_innovation'],
        qualityExpectations: ['groundbreaking', 'paradigm_defining', 'industry_leading']
      }
    ];
    
    // Customize based on domain
    switch (domain.category) {
      case 'UI':
        baseLevels[1].innovationTargets.push('responsive_design', 'interactive_elements');
        baseLevels[2].innovationTargets.push('animations', 'micro_interactions');
        baseLevels[3].innovationTargets.push('ai_integration', 'adaptive_interfaces');
        break;
      case 'CODE':
        baseLevels[1].innovationTargets.push('clean_architecture', 'error_handling');
        baseLevels[2].innovationTargets.push('design_patterns', 'testing');
        baseLevels[3].innovationTargets.push('meta_programming', 'domain_specific_languages');
        break;
      case 'DOCUMENTATION':
        baseLevels[1].innovationTargets.push('clear_structure', 'examples');
        baseLevels[2].innovationTargets.push('interactive_elements', 'multimedia');
        baseLevels[3].innovationTargets.push('adaptive_content', 'ai_assistance');
        break;
    }
    
    return baseLevels;
  }
  
  /**
   * Generate domain-specific innovation dimensions
   */
  private static generateDefaultInnovationDimensions(domain: SpecificationDomain): string[] {
    const commonDimensions = ['functionality', 'usability', 'aesthetics', 'performance'];
    
    const domainSpecific: Record<string, string[]> = {
      'UI': ['responsive_design', 'accessibility', 'user_experience', 'visual_design', 'interactions'],
      'CODE': ['architecture', 'maintainability', 'testing', 'documentation', 'security'],
      'DOCUMENTATION': ['clarity', 'completeness', 'searchability', 'multimedia', 'interactivity'],
      'RESEARCH': ['methodology', 'data_analysis', 'visualization', 'conclusions', 'reproducibility'],
      'CONTENT': ['engagement', 'readability', 'seo', 'multimedia', 'shareability'],
      'ANALYSIS': ['depth', 'accuracy', 'visualization', 'actionable_insights', 'methodology'],
      'DESIGN': ['visual_hierarchy', 'color_theory', 'typography', 'user_flow', 'brand_consistency']
    };
    
    return [...commonDimensions, ...(domainSpecific[domain.category] || [])];
  }
  
  private static generateDefaultValidationRules(domain: SpecificationDomain): ValidationRule[] {
    return [
      {
        type: 'FUNCTIONAL',
        description: 'Output meets functional requirements',
        validator: 'Check against success criteria and quality standards',
        severity: 'ERROR'
      },
      {
        type: 'QUALITY',
        description: 'Output meets quality expectations for sophistication level',
        validator: 'Evaluate against quality expectations for current sophistication level',
        severity: 'WARNING'
      },
      {
        type: 'UNIQUENESS',
        description: 'Output is sufficiently different from existing iterations',
        validator: 'Compare innovation dimensions and creative approaches',
        severity: 'WARNING'
      }
    ];
  }
  
  private static validateDomainSpecificRequirements(spec: UniversalSpecification): {
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Domain-specific validation logic
    switch (spec.domain.category) {
      case 'UI':
        if (!spec.innovationDimensions.includes('accessibility')) {
          suggestions.push('Consider adding accessibility as an innovation dimension for UI components');
        }
        break;
      case 'CODE':
        if (!spec.innovationDimensions.includes('testing')) {
          suggestions.push('Consider adding testing as an innovation dimension for code generation');
        }
        break;
    }
    
    return { warnings, suggestions };
  }
  
  private static generateDefaultStructure(domain: SpecificationDomain, format: string): string {
    return `Standard ${domain.category.toLowerCase()} ${format} structure with clear organization`;
  }
  
  private static generateDefaultNamingPattern(domain: SpecificationDomain, format: string): string {
    const category = domain.category.toLowerCase();
    return `${category}_iteration_{number}.${format}`;
  }
  
  private static generateDefaultQualityStandards(domain: SpecificationDomain): string[] {
    return [
      'Meets functional requirements',
      'Follows domain best practices',
      'Demonstrates clear innovation',
      'Maintains consistency with specification'
    ];
  }
  
  private static generateDefaultConstraints(domain: SpecificationDomain): string[] {
    return [
      'Must be functional and working',
      'Must follow domain conventions',
      'Must be sufficiently unique from existing iterations'
    ];
  }
  
  private static selectDefaultEvolutionPattern(domain: SpecificationDomain): 'LINEAR' | 'EXPONENTIAL' | 'ADAPTIVE' | 'CREATIVE_BURST' {
    switch (domain.category) {
      case 'UI':
      case 'DESIGN':
        return 'CREATIVE_BURST';
      case 'CODE':
        return 'LINEAR';
      case 'RESEARCH':
      case 'ANALYSIS':
        return 'ADAPTIVE';
      default:
        return 'EXPONENTIAL';
    }
  }
  
  private static generateDefaultProgressionStrategy(domain: SpecificationDomain): string {
    return `Each iteration should build upon previous work while exploring new ${domain.category.toLowerCase()} concepts and approaches`;
  }
}