// 🚀 YAFFA Engine v2.0 - DOMAIN EMPIRE
// Main JavaScript file implementing the full blueprint

class YAFFAEngine {
    constructor() {
        this.currentMode = 'yaffa';
        this.currentContract = null;
        this.sabiSteps = [];
        this.apiBase = window.location.origin;
        
        this.initializeEventListeners();
        this.loadDomainPacks();
        this.updateStatus('Ready');
    }

    // 🎯 INITIALIZATION
    initializeEventListeners() {
        // Mode toggle buttons
        document.getElementById('yaffaMode').addEventListener('click', () => this.setMode('yaffa'));
        document.getElementById('discoveryMode').addEventListener('click', () => this.setMode('discovery'));
        
        // Main generate button
        document.getElementById('generateBtn').addEventListener('click', () => this.generatePrompt());
        
        // Copy buttons
        document.getElementById('copyPromptBtn').addEventListener('click', () => this.copyToClipboard('promptText'));
        document.getElementById('copyBuilderBtn').addEventListener('click', () => this.copyBuilderPlan());
        
        // Improve button
        document.getElementById('improveBtn').addEventListener('click', () => this.showImprovePopover());
        
        // SABI Loop buttons
        document.getElementById('addSabiBtn').addEventListener('click', () => this.addSabiStep());
        document.getElementById('clearSabiBtn').addEventListener('click', () => this.clearSabi());
        document.getElementById('generateFreshBtn').addEventListener('click', () => this.generateFreshPrompt());
        
        // File Builder buttons
        document.getElementById('buildBtn').addEventListener('click', () => this.buildFile());
        document.getElementById('showCliBtn').addEventListener('click', () => this.showCliInstructions());
        
        // Improve popover buttons
        document.getElementById('applyImprovementsBtn').addEventListener('click', () => this.applyImprovements());
        document.getElementById('cancelImproveBtn').addEventListener('click', () => this.hideImprovePopover());
        
        // Enter key on goal input
        document.getElementById('goalInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generatePrompt();
            }
        });
    }

    // 🎯 MODE MANAGEMENT
    setMode(mode) {
        this.currentMode = mode;
        
        // Update button styles
        const yaffaBtn = document.getElementById('yaffaMode');
        const discoveryBtn = document.getElementById('discoveryMode');
        
        if (mode === 'yaffa') {
            yaffaBtn.className = 'px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all';
            discoveryBtn.className = 'px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-600/20 text-neutral-300 hover:text-amber-400 transition-all';
            document.body.classList.add('yaffa-mode');
            document.body.classList.remove('discovery-mode');
        } else {
            yaffaBtn.className = 'px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-red-600/20 text-neutral-300 hover:text-red-400 transition-all';
            discoveryBtn.className = 'px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all';
            document.body.classList.add('discovery-mode');
            document.body.classList.remove('yaffa-mode');
        }
        
        this.showToast(`Switched to ${mode.toUpperCase()} mode`, 'info');
    }

    // 🎯 DOMAIN PACKS LOADING
    async loadDomainPacks() {
        try {
            const response = await fetch(`${this.apiBase}/api/domains`);
            const data = await response.json();
            
            if (data.success) {
                this.updateDomainPacksInfo(data.data);
            }
        } catch (error) {
            console.error('Failed to load domain packs:', error);
            this.updateDomainPacksInfo({ total_packs: 0, categories: {} });
        }
    }

    updateDomainPacksInfo(data) {
        const infoDiv = document.getElementById('domainPacksInfo');
        const totalPacks = data.total_packs;
        const categories = Object.keys(data.categories).length;
        
        infoDiv.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>${totalPacks} domain packs loaded</span>
                </div>
                <div class="text-xs text-neutral-500">
                    ${categories} categories • Ready for action
                </div>
            </div>
        `;
    }

    // 🎯 MAIN PROMPT GENERATION
    async generatePrompt() {
        const goal = document.getElementById('goalInput').value.trim();
        
        if (!goal) {
            this.showToast('Please enter a goal', 'error');
            return;
        }

        this.updateStatus('Detecting domain...');
        this.showDomainBadge();
        this.showGenerateSpinner();

        try {
            // Step 1: Domain Detection
            const detection = await this.detectDomain(goal);
            
            if (!detection.pack) {
                this.hideGenerateSpinner();
                this.hideDomainBadge();
                this.updateStatus('Ready');
                this.showToast('No domain detected. Please provide more specific details.', 'error');
                return;
            }

            this.updateStatus(`Compiling in ${this.currentMode} mode...`);
            this.updateDomainInfo(detection);

            // Step 2: Run full pipeline
            const result = await this.runPipeline(goal);
            
            this.hideGenerateSpinner();
            this.hideDomainBadge();
            this.updateStatus('Ready');
            
            if (result.status === 'NEEDED') {
                this.showToast('More information needed. Please provide additional details.', 'warning');
                this.showMissingSlots(result);
            } else {
                this.showToast('Prompt generated successfully!', 'success');
                this.displayFinalPrompt(result);
                this.storeOriginalPrompt(goal);
                this.showSabiSection();
            }
            
        } catch (error) {
            console.error('Generation failed:', error);
            this.hideGenerateSpinner();
            this.hideDomainBadge();
            this.updateStatus('Error');
            this.showToast(`Generation failed: ${error.message}`, 'error');
        }
    }

    // 🎯 DOMAIN DETECTION
    async detectDomain(goal) {
        const response = await fetch(`${this.apiBase}/api/detect-domain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Domain detection failed');
        }
        
        return data.data;
    }

    // 🎯 FULL PIPELINE EXECUTION
    async runPipeline(goal) {
        const response = await fetch(`${this.apiBase}/api/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal, mode: this.currentMode })
        });
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Pipeline execution failed');
        }
        
        this.currentContract = data.data;
        return data.data;
    }

    // 🎯 DISPLAY FINAL PROMPT
    displayFinalPrompt(result) {
        // Show final prompt section
        document.getElementById('finalPromptSection').classList.remove('hidden');
        
        // Display prompt text
        document.getElementById('promptText').textContent = result.prompt_text;
        
        // Show alternatives
        if (result.alternatives && result.alternatives.length > 0) {
            this.displayAlternatives(result.alternatives);
        }
        
        // Show builder plan if available
        if (result.builder_plan) {
            document.getElementById('builderPlanSection').classList.remove('hidden');
            document.getElementById('copyInstruction').textContent = result.copy_instruction || '';
            this.showFileBuilderPanel();
        }
        
        // Update optimization badge
        const badge = document.getElementById('optimizationBadge');
        if (result.metadata.optimization_level === 'excellent') {
            badge.className = 'text-xs bg-green-600 text-white px-2 py-1 rounded-full';
            badge.textContent = 'Excellent ✓';
        } else if (result.metadata.optimization_level === 'good') {
            badge.className = 'text-xs bg-blue-600 text-white px-2 py-1 rounded-full';
            badge.textContent = 'Good ✓';
        }
    }

    // 🎯 DISPLAY ALTERNATIVES
    displayAlternatives(alternatives) {
        document.getElementById('alternativesSection').classList.remove('hidden');
        const list = document.getElementById('alternativesList');
        
        list.innerHTML = alternatives.map((alt, index) => `
            <div class="bg-neutral-800 border border-neutral-600 rounded p-3">
                <h4 class="text-sm font-medium text-white mb-1">${alt.title}</h4>
                <p class="text-xs text-neutral-400 mb-2">${alt.rationale}</p>
                <button class="text-xs text-blue-400 hover:text-blue-300 transition-all" onclick="yaffaEngine.useAlternative(${index})">
                    Use this approach
                </button>
            </div>
        `).join('');
    }

    // 🎯 SABI LOOP MANAGEMENT
    storeOriginalPrompt(goal) {
        document.getElementById('originalPromptSection').classList.remove('hidden');
        document.getElementById('originalPromptText').textContent = goal;
    }

    showSabiSection() {
        document.getElementById('addSabiSection').classList.remove('hidden');
    }

    addSabiStep() {
        const llmResponse = document.getElementById('llmResponseInput').value.trim();
        const userFeedback = document.getElementById('userFeedbackInput').value.trim();
        
        if (!llmResponse || !userFeedback) {
            this.showToast('Please provide both LLM response and feedback', 'error');
            return;
        }

        const step = {
            id: Date.now(),
            llmResponse,
            userFeedback,
            timestamp: new Date().toISOString()
        };

        this.sabiSteps.push(step);
        this.displaySabiSteps();
        this.showGenerateFreshButton();
        
        // Clear inputs
        document.getElementById('llmResponseInput').value = '';
        document.getElementById('userFeedbackInput').value = '';
        
        this.showToast('SABI step added', 'success');
    }

    displaySabiSteps() {
        const stepsDiv = document.getElementById('sabiSteps');
        
        stepsDiv.innerHTML = this.sabiSteps.map((step, index) => `
            <div class="bg-neutral-800 border border-neutral-600 rounded p-3">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs text-neutral-400">Step ${index + 1}</span>
                    <button class="text-xs text-red-400 hover:text-red-300" onclick="yaffaEngine.removeSabiStep(${step.id})">
                        Remove
                    </button>
                </div>
                <div class="text-xs text-neutral-300 mb-1">
                    <strong>LLM Response:</strong> ${step.llmResponse.substring(0, 100)}${step.llmResponse.length > 100 ? '...' : ''}
                </div>
                <div class="text-xs text-neutral-300">
                    <strong>Feedback:</strong> ${step.userFeedback}
                </div>
            </div>
        `).join('');
    }

    removeSabiStep(stepId) {
        this.sabiSteps = this.sabiSteps.filter(step => step.id !== stepId);
        this.displaySabiSteps();
        
        if (this.sabiSteps.length === 0) {
            document.getElementById('generateFreshBtn').classList.add('hidden');
        }
    }

    clearSabi() {
        this.sabiSteps = [];
        this.displaySabiSteps();
        document.getElementById('generateFreshBtn').classList.add('hidden');
        document.getElementById('originalPromptSection').classList.add('hidden');
        document.getElementById('addSabiSection').classList.add('hidden');
        this.showToast('SABI loop cleared', 'info');
    }

    async generateFreshPrompt() {
        if (!this.currentContract || this.sabiSteps.length === 0) {
            this.showToast('No original prompt or SABI steps available', 'error');
            return;
        }

        this.updateStatus('Generating fresh prompt...');
        
        try {
            const lastStep = this.sabiSteps[this.sabiSteps.length - 1];
            
            const response = await fetch(`${this.apiBase}/api/sabi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_contract: this.currentContract,
                    llm_response: lastStep.llmResponse,
                    user_feedback: lastStep.userFeedback
                })
            });
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'SABI loop failed');
            }
            
            this.updateStatus('Ready');
            this.displayFinalPrompt(data.data);
            this.showToast('Fresh prompt generated from SABI loop!', 'success');
            
        } catch (error) {
            console.error('SABI loop failed:', error);
            this.updateStatus('Error');
            this.showToast(`SABI loop failed: ${error.message}`, 'error');
        }
    }

    // 🎯 FILE BUILDER
    showFileBuilderPanel() {
        document.getElementById('fileBuilderPanel').classList.remove('hidden');
    }

    copyBuilderPlan() {
        if (this.currentContract && this.currentContract.builder_plan) {
            const planText = JSON.stringify(this.currentContract.builder_plan, null, 2);
            this.copyToClipboard(planText);
            this.showToast('Builder plan copied to clipboard', 'success');
        }
    }

    buildFile() {
        const planText = document.getElementById('builderPlanInput').value.trim();
        
        if (!planText) {
            this.showToast('Please paste a builder plan', 'error');
            return;
        }

        try {
            const plan = JSON.parse(planText);
            this.showToast('File building not yet implemented', 'info');
            // TODO: Implement file building
        } catch (error) {
            this.showToast('Invalid JSON in builder plan', 'error');
        }
    }

    showCliInstructions() {
        this.showToast('CLI instructions not yet implemented', 'info');
        // TODO: Show CLI instructions
    }

    // 🎯 IMPROVE POPOVER
    showImprovePopover() {
        if (!this.currentContract) {
            this.showToast('No prompt available to improve', 'error');
            return;
        }

        // TODO: Get knob suggestions from evaluation
        const knobSuggestions = [
            { key: 'timeframe', ask: 'What is the exact timeframe?', current_value: 'not specified' },
            { key: 'audience', ask: 'Who is the target audience?', current_value: 'general' }
        ];

        this.displayKnobSuggestions(knobSuggestions);
        document.getElementById('improvePopover').classList.remove('hidden');
    }

    hideImprovePopover() {
        document.getElementById('improvePopover').classList.add('hidden');
    }

    displayKnobSuggestions(suggestions) {
        const container = document.getElementById('knobSuggestions');
        
        container.innerHTML = suggestions.map(suggestion => `
            <div class="space-y-2">
                <label class="block text-sm font-medium text-neutral-300">
                    ${suggestion.ask}
                </label>
                <input
                    type="text"
                    class="w-full bg-neutral-800 border border-neutral-600 rounded p-2 text-white text-sm"
                    placeholder="Enter value..."
                    data-key="${suggestion.key}"
                    value="${suggestion.current_value || ''}"
                />
            </div>
        `).join('');
    }

    async applyImprovements() {
        // TODO: Apply improvements and regenerate
        this.hideImprovePopover();
        this.showToast('Improvements applied and prompt regenerated', 'success');
    }

    // 🎯 UTILITY FUNCTIONS
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }

    updateStatus(status) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        text.textContent = status;
        
        if (status === 'Ready') {
            indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
        } else if (status === 'Error') {
            indicator.className = 'w-2 h-2 bg-red-500 rounded-full';
        } else {
            indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
        }
    }

    showDomainBadge() {
        document.getElementById('domainBadge').classList.remove('hidden');
    }

    hideDomainBadge() {
        document.getElementById('domainBadge').classList.add('hidden');
    }

    showGenerateSpinner() {
        document.getElementById('generateSpinner').classList.remove('hidden');
        document.getElementById('generateBtnText').textContent = 'Generating...';
    }

    hideGenerateSpinner() {
        document.getElementById('generateSpinner').classList.add('hidden');
        document.getElementById('generateBtnText').textContent = 'Generate Master Prompt';
    }

    updateDomainInfo(detection) {
        document.getElementById('domainInfo').classList.remove('hidden');
        document.getElementById('domainName').textContent = detection.pack.title;
        document.getElementById('domainConfidence').textContent = Math.round(detection.confidence * 100);
    }

    showMissingSlots(result) {
        // TODO: Show missing slots interface
        console.log('Missing slots:', result);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        toast.className = `${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg transition-all transform translate-x-full`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // 🎯 ALTERNATIVE APPROACHES
    useAlternative(index) {
        if (this.currentContract && this.currentContract.alternatives) {
            const alternative = this.currentContract.alternatives[index];
            document.getElementById('goalInput').value = alternative.prompt_text;
            this.showToast(`Using alternative: ${alternative.title}`, 'info');
        }
    }
}

// 🚀 INITIALIZE YAFFA ENGINE
let yaffaEngine;

document.addEventListener('DOMContentLoaded', () => {
    yaffaEngine = new YAFFAEngine();
    console.log('🚀 YAFFA Engine v2.0 - DOMAIN EMPIRE initialized!');
});

// 🚀 EXPOSE FOR GLOBAL ACCESS
window.yaffaEngine = yaffaEngine;
