// UPE Web Interface JavaScript
class UPEInterface {
    constructor() {
        this.currentRunId = null;
        this.apiBase = '/upe';
        this.init();
    }

    init() {
        this.checkHealth();
        this.bindEvents();
        this.setupFormDefaults();
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            if (response.ok) {
                this.updateStatus('online', 'System Online');
            } else {
                this.updateStatus('offline', 'System Offline');
            }
        } catch (error) {
            this.updateStatus('offline', 'Connection Error');
        }
    }

    updateStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    bindEvents() {
        // Compile form submission
        const compileForm = document.getElementById('compileForm');
        compileForm.addEventListener('submit', (e) => this.handleCompile(e));

        // Download all button
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => this.downloadAllArtifacts());
        }

        // View manifest button
        const viewManifestBtn = document.getElementById('viewManifestBtn');
        if (viewManifestBtn) {
            viewManifestBtn.addEventListener('click', () => this.viewManifest());
        }

        // Feedback form submission
        const feedbackForm = document.getElementById('feedbackForm');
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', (e) => this.handleFeedback(e));
        }
    }

    setupFormDefaults() {
        // Set default values for better UX
        document.getElementById('goal').value = 'Generate a comprehensive report about artificial intelligence trends in 2024';
        document.getElementById('audience').value = 'Business Professionals';
        document.getElementById('tone').value = 'professional';
    }

    async handleCompile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const compileData = {
            v: "1.0.0",
            goal: formData.get('goal'),
            yafaOn: true,
            mode: formData.get('mode'),
            seed: Math.floor(Math.random() * 1000000),
            artifact: {
                primary: formData.get('primary'),
                secondaries: this.getSelectedSecondaries()
            },
            slots: {
                audience: formData.get('audience'),
                timeframe: "2024",
                tone: formData.get('tone'),
                explore: "MS"
            }
        };

        this.showLoading(true);
        this.showToast('Starting document generation...', 'info');

        try {
            const response = await fetch(`${this.apiBase}/compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(compileData)
            });

            if (response.ok) {
                const result = await response.json();
                this.handleCompileSuccess(result);
            } else {
                const error = await response.json();
                this.handleCompileError(error);
            }
        } catch (error) {
            this.handleCompileError({ detail: 'Network error: ' + error.message });
        } finally {
            this.showLoading(false);
        }
    }

    getSelectedSecondaries() {
        const checkboxes = document.querySelectorAll('input[name="secondaries"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    handleCompileSuccess(result) {
        this.currentRunId = result.manifestId || result.runId;
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultTitle').textContent = result.title || 'Generated Document';
        document.getElementById('resultStatus').textContent = 'Status: Completed successfully';
        
        // Populate artifact links
        this.populateArtifactLinks(result);
        
        // Show follow-up suggestions
        this.loadFollowUpSuggestions();
        
        // Show feedback section
        document.getElementById('feedbackSection').style.display = 'block';
        
        this.showToast('Document generated successfully!', 'success');
    }

    handleCompileError(error) {
        const errorMessage = error.detail || 'Unknown error occurred';
        this.showToast(`Generation failed: ${errorMessage}`, 'error');
        
        // Still show results section with error
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultTitle').textContent = 'Generation Failed';
        document.getElementById('resultStatus').textContent = `Error: ${errorMessage}`;
    }

    async populateArtifactLinks(result) {
        const artifactLinks = document.getElementById('artifactLinks');
        artifactLinks.innerHTML = '';

        if (this.currentRunId) {
            const primary = result.artifact?.primary || 'md';
            const secondaries = result.artifact?.secondaries || [];
            
            // Add primary artifact
            this.addArtifactLink(primary, this.currentRunId, true);
            
            // Add secondary artifacts
            secondaries.forEach(format => {
                this.addArtifactLink(format, this.currentRunId, false);
            });
        }
    }

    addArtifactLink(format, runId, isPrimary) {
        const artifactLinks = document.getElementById('artifactLinks');
        
        const linkDiv = document.createElement('div');
        linkDiv.className = 'artifact-link';
        
        const formatInfo = this.getFormatInfo(format);
        
        linkDiv.innerHTML = `
            <div class="artifact-info">
                <div class="artifact-icon">${formatInfo.icon}</div>
                <div class="artifact-details">
                    <h4>${formatInfo.name} ${isPrimary ? '(Primary)' : ''}</h4>
                    <p>${formatInfo.description}</p>
                </div>
            </div>
            <button class="download-btn" onclick="upeInterface.downloadArtifact('${runId}', '${format}')">
                Download
            </button>
        `;
        
        artifactLinks.appendChild(linkDiv);
    }

    getFormatInfo(format) {
        const formats = {
            'md': { icon: 'MD', name: 'Markdown', description: 'Plain text with formatting' },
            'docx': { icon: 'W', name: 'Word Document', description: 'Microsoft Word format' },
            'pptx': { icon: 'P', name: 'PowerPoint', description: 'Microsoft PowerPoint format' },
            'pdf': { icon: 'PDF', name: 'PDF Document', description: 'Portable Document Format' },
            'html': { icon: 'H', name: 'HTML', description: 'Web page format' },
            'xlsx': { icon: 'X', name: 'Excel', description: 'Microsoft Excel format' }
        };
        
        return formats[format] || { icon: '?', name: format.toUpperCase(), description: 'Unknown format' };
    }

    async downloadArtifact(runId, format) {
        try {
            const response = await fetch(`${this.apiBase}/runs/${runId}/artifact/${format}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${runId}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showToast(`${format.toUpperCase()} file downloaded successfully!`, 'success');
            } else {
                this.showToast(`Failed to download ${format} file`, 'error');
            }
        } catch (error) {
            this.showToast(`Download error: ${error.message}`, 'error');
        }
    }

    async downloadAllArtifacts() {
        if (!this.currentRunId) return;
        
        this.showToast('Starting bulk download...', 'info');
        
        // Get all available formats and download them
        const artifactLinks = document.querySelectorAll('.artifact-link');
        const downloadPromises = [];
        
        artifactLinks.forEach(link => {
            const downloadBtn = link.querySelector('.download-btn');
            if (downloadBtn) {
                const format = downloadBtn.getAttribute('onclick').match(/'([^']+)'/)[1];
                downloadPromises.push(this.downloadArtifact(this.currentRunId, format));
            }
        });
        
        try {
            await Promise.all(downloadPromises);
            this.showToast('All files downloaded successfully!', 'success');
        } catch (error) {
            this.showToast('Some downloads failed', 'warning');
        }
    }

    async viewManifest() {
        if (!this.currentRunId) return;
        
        try {
            const response = await fetch(`${this.apiBase}/runs/${this.currentRunId}`);
            if (response.ok) {
                const manifest = await response.json();
                this.showManifestModal(manifest);
            } else {
                this.showToast('Failed to load manifest', 'error');
            }
        } catch (error) {
            this.showToast(`Error loading manifest: ${error.message}`, 'error');
        }
    }

    showManifestModal(manifest) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Run Manifest</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <pre>${JSON.stringify(manifest, null, 2)}</pre>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 20px;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow: auto;
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                }
                .modal-close:hover {
                    color: #374151;
                }
                pre {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    overflow: auto;
                    max-height: 60vh;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async loadFollowUpSuggestions() {
        if (!this.currentRunId) return;
        
        try {
            const response = await fetch(`${this.apiBase}/runs/${this.currentRunId}/suggestions`);
            if (response.ok) {
                const suggestions = await response.json();
                this.displayFollowUpSuggestions(suggestions);
            }
        } catch (error) {
            console.log('No follow-up suggestions available');
        }
    }

    displayFollowUpSuggestions(suggestions) {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        const followupSection = document.getElementById('followupSection');
        
        if (suggestions && suggestions.length > 0) {
            suggestionsGrid.innerHTML = '';
            
            suggestions.forEach(suggestion => {
                const card = document.createElement('div');
                card.className = 'suggestion-card';
                card.innerHTML = `
                    <h4>${suggestion.title || 'Suggestion'}</h4>
                    <p>${suggestion.description || suggestion.content || 'No description available'}</p>
                `;
                card.addEventListener('click', () => this.applySuggestion(suggestion));
                suggestionsGrid.appendChild(card);
            });
            
            followupSection.style.display = 'block';
        }
    }

    applySuggestion(suggestion) {
        // Auto-fill the feedback form with the suggestion
        if (suggestion.operation) {
            document.getElementById('editOperation').value = suggestion.operation;
        }
        if (suggestion.target) {
            document.getElementById('targetSection').value = suggestion.target;
        }
        if (suggestion.details) {
            document.getElementById('editDetails').value = suggestion.details;
        }
        
        this.showToast('Suggestion applied to feedback form', 'info');
    }

    async handleFeedback(e) {
        e.preventDefault();
        
        if (!this.currentRunId) {
            this.showToast('No active run to apply feedback to', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const feedbackData = {
            runId: this.currentRunId,
            ops: [{
                op: formData.get('editOperation'),
                section: formData.get('targetSection'),
                details: formData.get('editDetails')
            }]
        };
        
        this.showLoading(true);
        this.showToast('Applying feedback...', 'info');
        
        try {
            const response = await fetch(`${this.apiBase}/runs/${this.currentRunId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showToast('Feedback applied successfully!', 'success');
                
                // Refresh the results
                this.refreshResults();
            } else {
                const error = await response.json();
                this.showToast(`Feedback failed: ${error.detail}`, 'error');
            }
        } catch (error) {
            this.showToast(`Feedback error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async refreshResults() {
        if (!this.currentRunId) return;
        
        try {
            const response = await fetch(`${this.apiBase}/runs/${this.currentRunId}`);
            if (response.ok) {
                const result = await response.json();
                this.populateArtifactLinks(result);
            }
        } catch (error) {
            console.log('Failed to refresh results');
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const compileBtn = document.getElementById('compileBtn');
        const btnText = compileBtn.querySelector('.btn-text');
        const btnLoading = compileBtn.querySelector('.btn-loading');
        
        if (show) {
            loadingOverlay.style.display = 'flex';
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            compileBtn.disabled = true;
        } else {
            loadingOverlay.style.display = 'none';
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            compileBtn.disabled = false;
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.upeInterface = new UPEInterface();
});