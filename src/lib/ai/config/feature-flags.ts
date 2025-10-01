import { prisma } from '@/lib/db';
import { ai } from '@/lib/config/env';

export interface AIFeatureFlags {
  // Core AI Features
  useVercelForStreaming: boolean;
  useVercelForChat: boolean;
  useVercelForNewFeatures: boolean;
  fallbackToVercel: boolean;
  
  // Advanced Features
  enableDocumentChat: boolean;
  enableContentGeneration: boolean;
  enableAdvancedAnalytics: boolean;
  enableA11Testing: boolean;
  
  // Performance & Cost
  enableCostOptimization: boolean;
  enablePerformanceAnalytics: boolean;
  maxCostPerRequest: number;
  maxDailyCost: number;
  
  // Experimental Features
  enableExperimentalFeatures: boolean;
  enableBetaFeatures: boolean;
}

export interface FeatureFlagConfig {
  organizationId: string;
  flags: Partial<AIFeatureFlags>;
  enabledBy?: string; // User ID who enabled
  enabledAt?: Date;
  expiresAt?: Date;
}

export class AIFeatureFlagManager {
  constructor(private organizationId: string) {}

  private getDefaultFlags(): AIFeatureFlags {
    return {
      // Conservative defaults for production stability
      useVercelForStreaming: false,
      useVercelForChat: false,
      useVercelForNewFeatures: false,
      fallbackToVercel: true,
      
      // Feature enablement
      enableDocumentChat: true,
      enableContentGeneration: true,
      enableAdvancedAnalytics: false,
      enableA11Testing: false,
      
      // Cost controls
      enableCostOptimization: true,
      enablePerformanceAnalytics: true,
      maxCostPerRequest: ai.perRequestCostLimit,
      maxDailyCost: ai.dailyCostLimit,
      
      // Experimental features
      enableExperimentalFeatures: false,
      enableBetaFeatures: false
    };
  }

  async getFlags(): Promise<AIFeatureFlags> {
    try {
      // Check if organization has custom feature flags
      const orgFeatureFlags = await prisma.organizationSettings.findFirst({
        where: {
          organizationId: this.organizationId,
          category: 'AI_FEATURES'
        }
      });

      if (orgFeatureFlags && orgFeatureFlags.settings) {
        const savedFlags = orgFeatureFlags.settings as Partial<AIFeatureFlags>;
        return {
          ...this.getDefaultFlags(),
          ...savedFlags
        };
      }

      // Return defaults if no custom flags found
      return this.getDefaultFlags();
    } catch (error) {
      console.error('Error loading feature flags:', error);
      return this.getDefaultFlags();
    }
  }

  async updateFlags(
    updates: Partial<AIFeatureFlags>, 
    updatedBy: string
  ): Promise<void> {
    try {
      const currentFlags = await this.getFlags();
      const newFlags = { ...currentFlags, ...updates };

      await prisma.organizationSettings.upsert({
        where: {
          organizationId_category: {
            organizationId: this.organizationId,
            category: 'AI_FEATURES'
          }
        },
        update: {
          settings: newFlags,
          updatedBy,
          updatedAt: new Date()
        },
        create: {
          organizationId: this.organizationId,
          category: 'AI_FEATURES',
          settings: newFlags,
          createdBy: updatedBy,
          updatedBy
        }
      });

      // Log the feature flag change for audit purposes
      await this.logFeatureFlagChange(updates, updatedBy);
    } catch (error) {
      console.error('Error updating feature flags:', error);
      throw new Error('Failed to update feature flags');
    }
  }

  async isEnabled(flagName: keyof AIFeatureFlags): Promise<boolean> {
    const flags = await this.getFlags();
    return Boolean(flags[flagName]);
  }

  async canUseVercelAI(): Promise<boolean> {
    const flags = await this.getFlags();
    return flags.useVercelForStreaming || 
           flags.useVercelForChat || 
           flags.useVercelForNewFeatures ||
           flags.fallbackToVercel;
  }

  async getCostLimits(): Promise<{ maxPerRequest: number; maxDaily: number }> {
    const flags = await this.getFlags();
    return {
      maxPerRequest: flags.maxCostPerRequest,
      maxDaily: flags.maxDailyCost
    };
  }

  private async logFeatureFlagChange(
    changes: Partial<AIFeatureFlags>,
    changedBy: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: this.organizationId,
          userId: changedBy,
          action: 'FEATURE_FLAG_UPDATE',
          entityType: 'AI_FEATURES',
          entityId: this.organizationId,
          details: {
            changes,
            timestamp: new Date().toISOString(),
            category: 'AI_FEATURES'
          }
        }
      });
    } catch (error) {
      console.error('Error logging feature flag change:', error);
      // Don't throw here to avoid blocking the main operation
    }
  }

  // Utility methods for common flag combinations
  async shouldUseVercelForOperation(operation: string): Promise<boolean> {
    const flags = await this.getFlags();
    
    switch (operation) {
      case 'streaming':
      case 'stream':
        return flags.useVercelForStreaming;
        
      case 'chat':
      case 'document_chat':
        return flags.useVercelForChat;
        
      case 'content_generation':
      case 'email_generation':
        return flags.useVercelForNewFeatures;
        
      default:
        return flags.fallbackToVercel;
    }
  }

  async getRoutingPreferences(): Promise<{
    preferVercel: boolean;
    allowFallback: boolean;
    costPriority: 'cost' | 'speed' | 'balanced';
  }> {
    const flags = await this.getFlags();
    
    return {
      preferVercel: flags.useVercelForStreaming || flags.useVercelForChat,
      allowFallback: flags.fallbackToVercel,
      costPriority: flags.enableCostOptimization ? 'cost' : 'balanced'
    };
  }
}

// Global feature flag utilities
export class GlobalFeatureFlagManager {
  static async getOrganizationFlags(organizationId: string): Promise<AIFeatureFlags> {
    const manager = new AIFeatureFlagManager(organizationId);
    return manager.getFlags();
  }

  static async isFeatureEnabledForOrganization(
    organizationId: string,
    feature: keyof AIFeatureFlags
  ): Promise<boolean> {
    const manager = new AIFeatureFlagManager(organizationId);
    return manager.isEnabled(feature);
  }

  static async getEnabledOrganizations(feature: keyof AIFeatureFlags): Promise<string[]> {
    try {
      const settings = await prisma.organizationSettings.findMany({
        where: {
          category: 'AI_FEATURES'
        },
        select: {
          organizationId: true,
          settings: true
        }
      });

      return settings
        .filter(setting => {
          const flags = setting.settings as AIFeatureFlags;
          return flags[feature] === true;
        })
        .map(setting => setting.organizationId);
    } catch (error) {
      console.error('Error getting enabled organizations:', error);
      return [];
    }
  }
}

// A/B Testing Support
export interface ABTestConfig {
  name: string;
  description: string;
  variants: {
    control: Partial<AIFeatureFlags>;
    treatment: Partial<AIFeatureFlags>;
  };
  targetPercentage: number; // Percentage of organizations to include
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export class ABTestManager {
  static async createABTest(config: ABTestConfig): Promise<void> {
    // Implementation for creating A/B tests
    // This would involve storing test configuration and assigning organizations
    await prisma.organizationSettings.create({
      data: {
        organizationId: 'GLOBAL',
        category: 'AB_TEST',
        settings: config,
        createdBy: 'SYSTEM'
      }
    });
  }

  static async getActiveTests(): Promise<ABTestConfig[]> {
    const tests = await prisma.organizationSettings.findMany({
      where: {
        category: 'AB_TEST',
        organizationId: 'GLOBAL'
      }
    });

    return tests
      .map(test => test.settings as ABTestConfig)
      .filter(test => test.isActive && new Date() < test.endDate);
  }

  static async getTestVariantForOrganization(
    organizationId: string,
    testName: string
  ): Promise<'control' | 'treatment' | null> {
    // Simple hash-based assignment for consistent results
    const hash = this.hashString(organizationId + testName);
    const percentage = hash % 100;
    
    const tests = await this.getActiveTests();
    const test = tests.find(t => t.name === testName);
    
    if (!test) return null;
    
    return percentage < test.targetPercentage ? 'treatment' : 'control';
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export default AIFeatureFlagManager;