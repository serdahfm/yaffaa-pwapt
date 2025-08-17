import { PromptContractType } from '@yafa/types';
export declare function createCompiler(): {
    compile(contract: PromptContractType): Promise<PromptContractType>;
    sovereign(previousContract: PromptContractType, downstreamResponse: string, userFeedback: string): Promise<PromptContractType>;
};
//# sourceMappingURL=index.d.ts.map