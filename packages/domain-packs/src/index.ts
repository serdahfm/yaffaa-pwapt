// 🚀 DOMAIN EMPIRE - Main Export File
export * from './domain-library';

// 🚀 Quick access to popular domains
export { 
  BUSINESS_PACKS, 
  TECH_PACKS, 
  CREATIVE_PACKS, 
  SCIENCE_PACKS,
  FINANCE_PACKS,
  LEGAL_PACKS,
  HEALTHCARE_PACKS,
  EDUCATION_PACKS,
  OPERATIONS_PACKS,
  MARKETING_PACKS,
  ALL_DOMAIN_PACKS 
} from './domain-library';

// 🚀 Core functions
export { 
  detectDomainPack, 
  getMissingSlots, 
  getQuestionsFor, 
  extractBuilderPlan,
  getDomainStats 
} from './domain-library';

// 🚀 Types
export type { DomainPack } from './domain-library';
