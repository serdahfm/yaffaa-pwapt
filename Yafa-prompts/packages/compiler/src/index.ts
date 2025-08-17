import { PromptContractType } from '@yafa/types';

export function createCompiler() {
  return {
    async compile(contract: PromptContractType): Promise<PromptContractType> {
      // For now, return enhanced contract with better determinism settings
      const enhanced = { ...contract };
      
      if (contract.meta.mode === 'yaffa') {
        // YAFFA mode: precision engineering
        enhanced.determinism = {
          temperature: 0.2,
          top_p: 0.95,
          seed: 42,
          stop: ['<END_JSON>', 'END_RESPONSE'],
          max_tokens: 1000
        };
        enhanced.self_checks = [
          'Output follows exact schema',
          'All required fields present',
          'No hallucinated information',
          'Deterministic response achieved'
        ];
      } else {
        // Discovery mode: creative exploration
        enhanced.determinism = {
          temperature: 0.8,
          top_p: 1.0,
          max_tokens: 1500
        };
        enhanced.self_checks = [
          'Multiple alternatives provided',
          'Self-critique included',
          'Creative exploration achieved',
          'Precedents and examples given'
        ];
      }
      
      // Add system prompts based on mode
      enhanced.assumptions = [
        `Mode: ${contract.meta.mode} - ${contract.meta.mode === 'yaffa' ? 'Precision engineering for deterministic outputs' : 'Creative exploration with alternatives'}`,
        'Generate functional, downloadable artifacts when appropriate',
        'Include proper citations and sources',
        'Follow all safety and constraint requirements'
      ];
      
      return enhanced;
    },

    async sovereign(
      previousContract: PromptContractType,
      downstreamResponse: string,
      userFeedback: string
    ): Promise<PromptContractType> {
      // Analyze feedback and improve contract
      const improved = { ...previousContract };
      
      // Parse feedback for common improvement patterns
      const needsMoreDetail = userFeedback.toLowerCase().includes('more detail') || userFeedback.toLowerCase().includes('expand');
      const needsSimplification = userFeedback.toLowerCase().includes('simpler') || userFeedback.toLowerCase().includes('concise');
      const needsDifferentTone = userFeedback.toLowerCase().includes('tone') || userFeedback.toLowerCase().includes('style');
      
      // Adjust based on feedback
      if (needsMoreDetail) {
        improved.constraints.length = 'detailed';
        improved.objective.success_criteria.push('Comprehensive detail provided');
      }
      
      if (needsSimplification) {
        improved.constraints.length = 'concise';
        improved.constraints.tone = 'simple';
      }
      
      if (needsDifferentTone) {
        improved.constraints.tone = 'professional';
      }
      
      // Add iteration context
      improved.assumptions.push(
        `Iteration based on feedback: "${userFeedback}"`,
        `Previous response quality assessment completed`,
        'Improvements applied based on user requirements'
      );
      
      return improved;
    }
  };
}
