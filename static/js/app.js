/**
 * ScriptVault - Premium Interactive Frontend & Cloud Script Collection Manager
 */

// Application State
const state = {
    scripts: [],
    searchQuery: ''
};

// ExtendsClass Shared Public JSON Bin Configuration
const BIN_URL = 'https://json.extendsclass.com/bin/f8b6bd12efbe';
// DOM Cache
const dom = {
    scriptForm: document.getElementById('script-form'),
    scriptNameInput: document.getElementById('script-name-input'),
    scriptContentInput: document.getElementById('script-content-input'),
    
    // Search
    scriptSearch: document.getElementById('script-search'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    
    // Grid & List Elements
    scriptsGrid: document.getElementById('scripts-grid-container'),
    emptyState: document.getElementById('empty-state'),
    badgeTotal: document.getElementById('badge-total'),
    
    // Stats
    statCount: document.getElementById('stat-count'),
    currentDateStr: document.getElementById('current-date-str'),
    
    // Modals
    detailsModal: document.getElementById('details-modal'),
    editScriptForm: document.getElementById('edit-script-form'),
    editScriptId: document.getElementById('edit-script-id'),
    editScriptName: document.getElementById('edit-script-name'),
    editScriptContent: document.getElementById('edit-script-content'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    deleteScriptBtn: document.getElementById('delete-script-btn'),
    
    // Toast Container
    toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Set current date in dashboard (Russian format since UI uses Russian)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dom.currentDateStr.textContent = new Date().toLocaleDateString('ru-RU', options);
    
    // Fetch scripts from ExtendsClass Cloud Storage
    fetchScripts();
    
    // Bind Event Listeners
    bindEvents();
}

// Bind User Actions & Submissions
function bindEvents() {
    // Add Script Submit
    dom.scriptForm.addEventListener('submit', handleAddScript);
    
    // Quick Search Inputs
    dom.scriptSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        dom.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        render();
    });
    
    dom.clearSearchBtn.addEventListener('click', () => {
        dom.scriptSearch.value = '';
        state.searchQuery = '';
        dom.clearSearchBtn.style.display = 'none';
        render();
    });
    
    // Modal controls
    dom.closeModalBtn.addEventListener('click', closeModal);
    dom.cancelEditBtn.addEventListener('click', closeModal);
    dom.editScriptForm.addEventListener('submit', handleUpdateScript);
    dom.deleteScriptBtn.addEventListener('click', handleDeleteScript);
    
    // Close modal on background overlay click
    dom.detailsModal.addEventListener('click', (e) => {
        if (e.target === dom.detailsModal) closeModal();
    });
}

// ==========================================================================
// Cloud API Handlers (async / await ExtendsClass Bin CRUD)
// ==========================================================================

async function fetchScripts() {
    try {
        const response = await fetch(BIN_URL);

        if (!response.ok) throw new Error('Не удалось загрузить скрипты из облака');
        const data = await response.json();
        state.scripts = data.scripts || [];
        render();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function saveScripts(updatedScripts) {
    try {
        const response = await fetch(BIN_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/merge-patch+json', 'Api-Key': '2cd92280-718b-11f1-b6b0-0242ac110005' },
            body: JSON.stringify({ scripts: updatedScripts })
        });
        
        if (!response.ok) throw new Error('Не удалось сохранить изменения в облаке');
        
        state.scripts = updatedScripts;
        render();
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

async function handleAddScript(e) {
    e.preventDefault();
    
    const name = dom.scriptNameInput.value.trim();
    const content = dom.scriptContentInput.value;
    
    const newScript = {
        id: Date.now(), // Generate unique numeric ID client-side
        name,
        content,
        created_at: new Date().toISOString()
    };
    
    // Add to the beginning of the list
    const updatedScripts = [newScript, ...state.scripts];
    
    const success = await saveScripts(updatedScripts);
    if (success) {
        // Reset Inputs
        dom.scriptForm.reset();
        showToast('Скрипт успешно добавлен в облачное хранилище', 'success');
    }
}

async function handleUpdateScript(e) {
    e.preventDefault();
    
    const id = parseInt(dom.editScriptId.value);
    const name = dom.editScriptName.value.trim();
    const content = dom.editScriptContent.value;
    
    const updatedScripts = state.scripts.map(s => {
        if (s.id === id) {
            return { ...s, name, content };
        }
        return s;
    });
    
    const success = await saveScripts(updatedScripts);
    if (success) {
        closeModal();
        showToast('Скрипт сохранен в облаке', 'success');
    }
}

async function handleDeleteScript() {
    const id = parseInt(dom.editScriptId.value);
    if (!confirm('Вы уверены, что хотите окончательно удалить этот скрипт?')) {
        return;
    }
    
    const updatedScripts = state.scripts.filter(s => s.id !== id);
    
    const success = await saveScripts(updatedScripts);
    if (success) {
        closeModal();
        showToast('Скрипт удален из облака', 'info');
    }
}

// Clipboard copying
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        showToast('Скрипт скопирован в буфер обмена!', 'success');
    } catch (err) {
        showToast('Не удалось скопировать скрипт', 'error');
    }
}

// ==========================================================================
// Rendering Engine
// ==========================================================================

function render() {
    let filtered = [...state.scripts];
    
    // Search Query Matching
    if (state.searchQuery) {
        filtered = filtered.filter(script => 
            script.name.toLowerCase().includes(state.searchQuery) ||
            script.content.toLowerCase().includes(state.searchQuery)
        );
    }
    
    // Update dashboard counter metrics
    dom.badgeTotal.textContent = filtered.length;
    dom.statCount.textContent = state.scripts.length;
    
    // Clear list
    dom.scriptsGrid.innerHTML = '';
    
    // Empty state trigger check
    if (filtered.length === 0) {
        dom.emptyState.style.display = 'flex';
    } else {
        dom.emptyState.style.display = 'none';
        
        // Render cards
        filtered.forEach(script => {
            const card = document.createElement('div');
            card.className = 'script-card glass-card';
            
            // Format first few lines of script as code block preview
            const lines = script.content.split('\n');
            const previewLines = lines.slice(0, 5).join('\n');
            const hasMore = lines.length > 5;
            const previewText = previewLines + (hasMore ? '\n...' : '');
            
            card.innerHTML = `
                <div class="script-card-header">
                    <span class="script-card-title" title="${escapeHTML(script.name)}">${escapeHTML(script.name)}</span>
                    <span class="copy-indicator">Клик: Копировать</span>
                </div>
                <div class="script-card-body">${escapeHTML(previewText)}</div>
                <div class="script-card-footer">
                    <button class="details-btn">
                        <i class="fa-solid fa-circle-info"></i> Детали
                    </button>
                </div>
            `;
            
            // Card click copy (excluding Details button)
            card.addEventListener('click', (e) => {
                // If details button was clicked, don't copy
                if (e.target.closest('.details-btn')) return;
                copyToClipboard(script.content);
            });
            
            // Details click modal trigger
            const detailsBtn = card.querySelector('.details-btn');
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid copy event triggers
                openDetailsModal(script);
            });
            
            dom.scriptsGrid.appendChild(card);
        });
    }
}

// XSS Sanitizer to safely output variables into template strings
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==========================================================================
// Modal Management
// ==========================================================================

function openDetailsModal(script) {
    dom.editScriptId.value = script.id;
    dom.editScriptName.value = script.name;
    dom.editScriptContent.value = script.content;
    
    dom.detailsModal.classList.add('active');
    dom.detailsModal.style.display = 'flex';
}

function closeModal() {
    dom.detailsModal.classList.remove('active');
    setTimeout(() => {
        dom.detailsModal.style.display = 'none';
    }, 250);
}

// ==========================================================================
// Reusable Premium Toast Banner
// ==========================================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info toast-icon toast-icon-info"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check toast-icon toast-icon-success"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation toast-icon toast-icon-error"></i>';
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close-btn"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    dom.toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    
    // Slide out and remove toast banner smoothly after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideIn 0.3s reverse cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, 3500);
}
