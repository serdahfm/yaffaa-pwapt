// Prompt Engineer Application
class PromptEngineer {
    constructor() {
        this.currentMode = 'default';
        this.sabiIteration = 1;
        this.maxIterations = 3;
        this.initializeEventListeners();
        this.updateModeDisplay();
    }

    initializeEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Main prompt engineering
        document.getElementById('send-btn').addEventListener('click', () => this.engineerPrompt());
        document.getElementById('prompt-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.engineerPrompt();
            }
        });

        // Context toggle
        document.getElementById('context-toggle').addEventListener('click', () => this.toggleContext());

        // SABI functionality
        document.getElementById('sabi-generate').addEventListener('click', () => this.generateSABI());
        document.getElementById('add-iteration').addEventListener('click', () => this.addIteration());
        document.getElementById('clear-sabi').addEventListener('click', () => this.clearSABI());

        // Score modal
        document.getElementById('close-score').addEventListener('click', () => this.closeScoreModal());
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update body class for theme
        document.body.className = '';
        if (mode === 'yafa') {
            document.body.classList.add('yafa-mode');
        } else if (mode === 'ms') {
            document.body.classList.add('ms-mode');
        }
        
        this.updateModeDisplay();
        
        // Update welcome message based on mode
        this.updateWelcomeMessage(mode);
    }

    updateModeDisplay() {
        document.getElementById('current-mode').textContent = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1);
    }

    updateWelcomeMessage(mode) {
        const welcomeTitle = document.querySelector('.welcome-message h1');
        const welcomeDesc = document.querySelector('.welcome-message p');
        
        switch(mode) {
            case 'yafa':
                welcomeTitle.textContent = 'YAFA Mode: Strict Precision';
                welcomeDesc.textContent = 'Technical, guaranteed results. No assumptions, no placeholders.';
                break;
            case 'ms':
                welcomeTitle.textContent = 'MS Mode: Multi-Space Thinking';
                welcomeDesc.textContent = 'Explore ideas, get creative suggestions, unlock AI\'s full potential.';
                break;
            default:
                welcomeTitle.textContent = 'How can I help you today?';
                welcomeDesc.textContent = 'Type your prompt below and I\'ll transform it into an engineered, copy-paste ready prompt for any AI platform.';
        }
    }

    toggleContext() {
        const contextInput = document.getElementById('context-input');
        const toggle = document.getElementById('context-toggle');
        
        if (contextInput.classList.contains('hidden')) {
            contextInput.classList.remove('hidden');
            toggle.textContent = '- Hide Context';
        } else {
            contextInput.classList.add('hidden');
            toggle.textContent = '+ Add Context';
        }
    }

    async engineerPrompt() {
        const promptInput = document.getElementById('prompt-input');
        const contextInput = document.getElementById('context-text');
        const sendBtn = document.getElementById('send-btn');
        
        const userPrompt = promptInput.value.trim();
        if (!userPrompt) return;
        
        const context = contextInput.value.trim() || null;
        
        // Show loading
        this.showLoading(true);
        sendBtn.disabled = true;
        
        try {
            const response = await fetch('/api/engineer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_prompt: userPrompt,
                    mode: this.currentMode,
                    context: context
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.displayEngineeredPrompt(userPrompt, result);
            
            // Clear inputs
            promptInput.value = '';
            if (contextInput.value) {
                contextInput.value = '';
                this.toggleContext();
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.displayError('Failed to engineer prompt. Please try again.');
        } finally {
            this.showLoading(false);
            sendBtn.disabled = false;
        }
    }

    displayEngineeredPrompt(userPrompt, result) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Add user message
        const userMessage = this.createMessage('user', userPrompt);
        chatMessages.appendChild(userMessage);
        
        // Add assistant message with engineered prompt
        const assistantMessage = this.createMessage('assistant', result.engineered_prompt);
        
        // Add score display
        const scoreDisplay = this.createScoreDisplay(result.score, result.suggestions, result.guarantees);
        assistantMessage.appendChild(scoreDisplay);
        
        chatMessages.appendChild(assistantMessage);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    createMessage(role, content) {
        const message = document.createElement('div');
        message.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        message.appendChild(contentDiv);
        return message;
    }

    createScoreDisplay(score, suggestions, guarantees) {
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'message-score';
        scoreContainer.innerHTML = `
            <span class="score-number">${score}</span>
            <span>/100</span>
        `;
        
        // Add click handler to show detailed score
        scoreContainer.addEventListener('click', () => {
            this.showScoreModal(score, suggestions, guarantees);
        });
        
        return scoreContainer;
    }

    showScoreModal(score, suggestions, guarantees) {
        document.getElementById('modal-score').textContent = score;
        
        // Display suggestions
        const suggestionsContainer = document.getElementById('modal-suggestions');
        suggestionsContainer.innerHTML = '<h4>Improvement Suggestions</h4><ul></ul>';
        const suggestionsList = suggestionsContainer.querySelector('ul');
        
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
        
        // Display guarantees
        const guaranteesContainer = document.getElementById('modal-guarantees');
        guaranteesContainer.innerHTML = '<h4>Guarantees</h4><ul></ul>';
        const guaranteesList = guaranteesContainer.querySelector('ul');
        
        guarantees.forEach(guarantee => {
            const li = document.createElement('li');
            li.textContent = guarantee;
            guaranteesList.appendChild(li);
        });
        
        document.getElementById('score-modal').classList.remove('hidden');
    }

    closeScoreModal() {
        document.getElementById('score-modal').classList.add('hidden');
    }

    async generateSABI() {
        const originalPrompt = document.getElementById('original-prompt').value.trim();
        const aiResponse = document.getElementById('ai-response').value.trim();
        const userFeedback = document.getElementById('user-feedback').value.trim();
        
        if (!originalPrompt || !aiResponse || !userFeedback) {
            this.showError('Please fill in all SABI fields.');
            return;
        }
        
        try {
            const response = await fetch('/api/sabi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_prompt: originalPrompt,
                    ai_response: aiResponse,
                    user_feedback: userFeedback,
                    iteration: this.sabiIteration
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.displaySABIResult(result);
            
        } catch (error) {
            console.error('Error:', error);
            this.showError('Failed to generate SABI follow-up. Please try again.');
        }
    }

    displaySABIResult(result) {
        document.getElementById('follow-up-prompt').textContent = result.follow_up_prompt;
        document.getElementById('sabi-score').textContent = result.score;
        
        // Display suggestions
        const suggestionsContainer = document.getElementById('sabi-suggestions');
        suggestionsContainer.innerHTML = '<h5>Suggestions</h5><ul></ul>';
        const suggestionsList = suggestionsContainer.querySelector('ul');
        
        result.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
        
        // Show results
        document.getElementById('sabi-results').classList.remove('hidden');
        
        // Update iteration controls
        this.updateIterationControls();
    }

    addIteration() {
        if (this.sabiIteration < this.maxIterations) {
            this.sabiIteration++;
            
            // Add new iteration fields
            const sabiContainer = document.querySelector('.sabi-container');
            const iterationDiv = document.createElement('div');
            iterationDiv.className = 'sabi-step';
            iterationDiv.innerHTML = `
                <h4>AI Response (Iteration ${this.sabiIteration})</h4>
                <textarea id="ai-response-${this.sabiIteration}" placeholder="Paste the AI's response here..." rows="4"></textarea>
                <h4>Your Feedback (Iteration ${this.sabiIteration})</h4>
                <textarea id="user-feedback-${this.sabiIteration}" placeholder="What do you want to achieve with this follow-up?" rows="3"></textarea>
            `;
            
            // Insert before the generate button
            const generateBtn = document.getElementById('sabi-generate');
            sabiContainer.insertBefore(iterationDiv, generateBtn);
            
            this.updateIterationControls();
        }
    }

    updateIterationControls() {
        const addBtn = document.getElementById('add-iteration');
        if (this.sabiIteration >= this.maxIterations) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'block';
        }
    }

    clearSABI() {
        // Clear all textareas
        document.querySelectorAll('.sabi-step textarea').forEach(textarea => {
            textarea.value = '';
        });
        
        // Hide results
        document.getElementById('sabi-results').classList.add('hidden');
        
        // Remove additional iterations
        const sabiContainer = document.querySelector('.sabi-container');
        const steps = sabiContainer.querySelectorAll('.sabi-step');
        for (let i = 3; i < steps.length; i++) {
            steps[i].remove();
        }
        
        // Reset iteration
        this.sabiIteration = 1;
        this.updateIterationControls();
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showError(message) {
        // Simple error display - you could enhance this with a toast notification
        alert(message);
    }

    displayError(message) {
        const chatMessages = document.getElementById('chat-messages');
        const errorMessage = this.createMessage('assistant', `Error: ${message}`);
        errorMessage.style.borderColor = '#ef4444';
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PromptEngineer();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('score-modal');
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});
