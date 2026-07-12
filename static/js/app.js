/**
 * ScriptVault - Premium Interactive Frontend & Cloud Script Collection Manager
 */

// Application State
const state = {
    scripts: [],
    searchQuery: ''
};

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
    generateScriptBtn: document.getElementById('generate-script-btn'),
    
    // Toast Container
    toastContainer: document.getElementById('toast-container')
};

dom.generateScriptBtn.addEventListener('click', () => {
    openGenerateModal();
});

// --- Generate Modal (Create geo-preset) ---------------------------------
let _generateModal = null;
function createGenerateModal() {
        if (_generateModal) return _generateModal;

        const modal = document.createElement('div');
        modal.className = 'generate-modal modal-overlay';
        modal.id = 'generate-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
        <div class="modal-panel">
            <header class="modal-header">
                <h3>Новый гео-пресет</h3>
                <button class="modal-close">×</button>
            </header>
            <form class="generate-form">
                <div class="form-row">
                    <label>Title</label>
                    <input name="presetTitle" required placeholder="Страна / Оффер (например:  BG Parazit)" />
                </div>

                <div class="form-row" style="margin-bottom: 15px;">
                    <label>Тип объявления</label>
                    <select name="adType" style="width: 100%; box-sizing: border-box; padding: 11px 16px; margin-top: 6px; border-radius: 12px; background: rgba(0, 0, 0, 0.35); outline: none; border: 1px solid rgba(255, 255, 255, 0.08); color: #fff; font-size: 13px; font-weight: 600;">
                        <option value="video">Видео (с Long Headlines)</option>
                        <option value="static">Статика (без Long Headlines)</option>
                    </select>
                </div>

                <div class="section" data-section="headlines">
                    <h4>Headlines <span>(от 5 до 40 символов)</span></h4>
                    ${new Array(5).fill(0).map((_,i)=> `<textarea name="h${i}" data-min="5" data-max="40" placeholder="Headline ${i+1}" ${i===0? 'required': ''}></textarea>`).join('')}
                </div>

                <div class="section" data-section="long-headlines">
                    <h4>Long Headlines <span>(от 5 до 90 символов)</span></h4>
                    ${new Array(5).fill(0).map((_,i)=> `<textarea name="lh${i}" data-min="5" data-max="90" placeholder="Long Headline ${i+1}" ${i===0? 'required': ''}></textarea>`).join('')}
                </div>

                <div class="section" data-section="descriptions">
                    <h4>Descriptions <span>(от 5 до 90 символов)</span></h4>
                    ${new Array(5).fill(0).map((_,i)=> `<textarea name="d${i}" data-min="5" data-max="90" placeholder="Description ${i+1}" ${i===0? 'required': ''}></textarea>`).join('')}
                </div>

                <footer class="modal-actions">
                    <button type="submit" class="btn-primary">Сгенерировать</button>
                    <button type="button" class="btn-secondary modal-cancel">Отмена</button>
                </footer>
            </form>
        </div>`;

        document.addEventListener('paste', function (e) {
        const target = e.target;

        // Проверяем, что вставка происходит в textarea внутри блока .section
        if (target.tagName === 'TEXTAREA' && target.closest('.section')) {
            const section = target.closest('.section');
                const textareas = Array.from(section.querySelectorAll('textarea'));

                // Проверяем, что это именно ПЕРВЫЙ textarea в этой секции (индекс 0)
                if (target === textareas[0]) {
                    // Получаем текст из буфера обмена
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                    
                    // Разбиваем текст по переносам строк, убираем лишние пробелы по краям
                    // .filter(line => line.trim() !== '') удалит пустые строки (актуально при копировании из ChatGPT/Notion)
                    const lines = pastedText.split(/\r?\n/)
                                            .map(line => line.trim())
                                            .filter(line => line.length > 0);

                    // Если вставили многострочный текст (больше одной строки)
                    if (lines.length > 1) {
                        // Отменяем стандартное поведение браузера (чтобы весь кусок текста не упал в первое поле)
                        e.preventDefault();

                        // Распределяем строки по textarea в текущей секции
                        lines.forEach((line, index) => {
                            if (textareas[index]) {
                                textareas[index].value = line;
                                
                                // Важно: вызываем событие 'input' вручную.
                                // Это нужно, если у вас привязаны счетчики символов (data-min/data-max) или валидация.
                                textareas[index].dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        });
                    }
                }
            }
        });

        // basic styles so modal is usable (keeps consistent look with existing app)
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:100}
            .modal-panel{max-width:920px;width:96%;max-height:90vh;overflow:auto;background: rgba(18, 16, 35, 0.45);border: 1px solid rgba(255, 255, 255, 0.1);box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);padding: 24px;transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);backdrop-filter: blur(20px);border-radius: 18px;}
            .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
            .modal-header h3{margin:0}
            .modal-close{background:transparent;border:0;font-size:35px;cursor:pointer;color: #fff;padding: 0 5px;font-weight: 500;}
            .generate-form .form-row{margin-bottom:12px}
            .form-row label {font-weight: 700;font-size: 16px;color: #bfc5ce;}
            .generate-form input, .generate-form textarea, .generate-form select{width:100%;box-sizing:border-box;padding:11px 16px;margin-top:6px;border-radius:12px;background: rgba(0, 0, 0, 0.35);outline: none;border: 1px solid rgba(255, 255, 255, 0.08);color: #fff;font-size: 13px;font-weight: 600;}
            .generate-form input::placeholder, .generate-form textarea::placeholder{color: #aaa}
            .generate-form textarea{min-height:48px;margin-bottom:6px;resize:vertical}
            .section{margin-bottom:14px}
            .section h4{color:#bfc5ce;}
            .section h4 span {font-size:12px;color:#aaa;font-weight:500;margin-left:6px}
            .modal-actions{display:flex;gap:8px;justify-content:flex-end}
            .btn-primary{background:#0069ff;color:#fff;border:0;padding:8px 12px;border-radius:6px;cursor:pointer}
            .btn-secondary{background:transparent;border:1px solid #ccc;padding:8px 12px;border-radius:6px;cursor:pointer}
        `;
        modal.appendChild(style);

        document.body.appendChild(modal);

        // handlers
        modal.querySelector('.modal-close').addEventListener('click', closeGenerateModal);
        modal.querySelector('.modal-cancel').addEventListener('click', closeGenerateModal);

        const adTypeSelect = modal.querySelector('[name="adType"]');
        const longHeadlinesSection = modal.querySelector('[data-section="long-headlines"]');
        adTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'static') {
                longHeadlinesSection.style.display = 'none';
                longHeadlinesSection.querySelectorAll('textarea').forEach(ta => ta.removeAttribute('required'));
            } else {
                longHeadlinesSection.style.display = 'block';
                longHeadlinesSection.querySelector('[name="lh0"]').setAttribute('required', '');
            }
        });

        modal.querySelector('.generate-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                try {
                        const payload = collectGenerateForm(form);
                        const scriptText = buildGeneratedScript(payload.headlines, payload.longHeadlines, payload.descriptions, payload.adType);

                        // show result modal with textarea + actions
                        showGeneratedResult(scriptText, payload.presetTitle || 'Generated preset');
                } catch (err) {
                        showToast(err.message || 'Validation error', 'error');
                }
        });

        _generateModal = modal;
        return modal;
}

function openGenerateModal() {
    createGenerateModal();
    const adTypeSelect = _generateModal.querySelector('[name="adType"]');
    if (adTypeSelect) {
        adTypeSelect.value = 'video';
        adTypeSelect.dispatchEvent(new Event('change'));
    }
    _generateModal.style.display = 'flex';
}

function closeGenerateModal() {
    if (!_generateModal) return;
    _generateModal.style.display = 'none';
}

function collectGenerateForm(form) {
    const presetTitle = form.presetTitle ? form.presetTitle.value.trim() : '';
    if (!presetTitle) throw new Error('Title обязателен');
    const adType = form.adType.value;

    function collect(prefix, count, min, max, isRequired) {
            const out = [];
            for (let i = 0; i < count; i++) {
                const el = form.querySelector(`[name="${prefix}${i}"]`);
                if (!el) continue;
                const val = el.value.trim();
                if (i === 0 && !val && isRequired) throw new Error('Первое поле в каждом разделе обязательно');
                if (val) {
                    if (val.length < min || val.length > max) throw new Error(`Длина значения должна быть от ${min} до ${max} символов`);
                    out.push(val);
                }
            }
            return out;
    }

    const headlines = collect('h', 5, 5, 40, true);
    const longHeadlines = adType === 'video' ? collect('lh', 5, 5, 90, true) : [];
    const descriptions = collect('d', 5, 5, 90, true);

    return { presetTitle, adType, headlines, longHeadlines, descriptions };
}

function buildGeneratedScript(headlines, longHeadlines, descriptions, adType) {
        // helper to stringify array entries with proper indentation
        function arrToBlock(arr) {
                if (!arr || arr.length === 0) return '';
                return arr.map(s => '    ' + JSON.stringify(s)).join(',\n');
        }

        const HEADLINES_BLOCK = arrToBlock(headlines);
        const LONG_BLOCK = arrToBlock(longHeadlines);
        const DESC_BLOCK = arrToBlock(descriptions);

        if (adType === 'static') {
            return `(function () {
    'use strict';
    const HEADLINES = [
${HEADLINES_BLOCK ? HEADLINES_BLOCK + '\n' : ''}  ];
    const DESCRIPTIONS = [
${DESC_BLOCK ? DESC_BLOCK + '\n' : ''}  ];

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function randomDelay(min, max) { return sleep(Math.floor(Math.random() * (max - min + 1)) + min); }


    function set(el, val) {
        if (!el) return;
        el.focus();
        el.dispatchEvent(new Event('focus', {bubbles: true}));
        el.value = val;
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        el.blur();
        el.dispatchEvent(new Event('blur', {bubbles: true}));
    }

    function findAddButton(debugId, labelText) {
        let btn = null;
        // Strategy 0: Direct search inside the specific container
        const container = document.querySelector('multi-asset-editor[debugid="' + debugId + '"]');
        if (container) {
            btn = Array.from(container.querySelectorAll('material-button')).find(b => 
                (b.textContent.includes(labelText) || b.textContent.includes('add')) && b.offsetWidth > 0
            );
            if (btn) return btn;
        }
    
        // Fallback strategies
        btn = Array.from(document.querySelectorAll('material-button')).find(b =>
            (b.textContent.trim() === 'add' + labelText || b.textContent.trim() === labelText) && b.offsetWidth > 0
        );
        if (!btn) btn = Array.from(document.querySelectorAll('material-button')).find(b =>
            b.textContent.includes(labelText) && b.querySelector('material-icon') && b.offsetWidth > 0
        );
        if (!btn) btn = Array.from(document.querySelectorAll('.add-asset-button')).find(b =>
            b.textContent.includes(labelText) && b.offsetWidth > 0
        );
        return btn;
    }

    setTimeout(async () => {
        console.log('\u{1F680} Google Ads Auto-Fill');
        console.log('');

        // Single image ad
        try {
            const vr = Array.from(document.querySelectorAll('material-radio')).find(r =>
                (r.textContent || '').includes('Single image ad') || (r.textContent || '').includes('Show ads with a single image')
            );
            if (vr) { vr.click(); console.log('   \u2705 Single image ad'); await sleep(1000); }
        } catch(e) {}
        console.log('');

        // Landing Page Preview
        try {
            const cb = Array.from(document.querySelectorAll('material-checkbox')).find(c =>
                (c.textContent || '').includes('Show a screenshot of your landing page')
            );
            if (cb && cb.getAttribute('aria-checked') !== 'false') { 
                cb.click(); 
                console.log('   \u2705 Landing Page Preview отключен'); 
                await sleep(1000); 
            }
            else if (!cb) {
                const lp = document.querySelector('#enhancement-option-LANDING_PAGE_PREVIEW');
                if (lp && lp.getAttribute('aria-checked') !== 'false') { lp.click(); await sleep(1000); }
            }
        } catch(e) {}
        console.log('');

        // Image Optimization
        try {
            const imgOptCb = Array.from(document.querySelectorAll('material-checkbox')).find(c => {
                const t = (c.textContent || '').toLowerCase();
                return t.includes('image enhancement') || t.includes('image optimization') || t.includes('asset optimization');
            });
            if (imgOptCb && imgOptCb.getAttribute('aria-checked') !== 'false') {
                imgOptCb.click();
                console.log('   \u2705 Image Optimization отключен');
                await sleep(1000);
            }
        } catch(e) {}
        console.log('');

        // Add fields
        async function addSection(debugId, labelText, needed) {
            console.log('🔄 Проверка полей: ' + labelText);
            const inputs = Array.from(document.querySelectorAll('multi-asset-editor[debugid="' + debugId + '"] input.input-area')).filter(el => el.offsetWidth > 0);
            const clicks = needed - inputs.length;
            if (clicks > 0) {
                const btn = findAddButton(debugId, labelText);
                if (btn) {
                    console.log('   ➕ Добавляем ' + clicks + ' полей (' + labelText + ')');
                    for (let i = 0; i < clicks; i++) { 
                        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
                        await sleep(300);
                        btn.click(); 
                        await sleep(500); 
                    }
                    await sleep(1500); // Дать время Angular отрендерить новые поля
                } else {
                    console.log('   ❌ Кнопка "Добавить ' + labelText + '" не найдена!');
                }
            }
        }

        await addSection('headlines', 'Headline', HEADLINES.length);
        await addSection('descriptions', 'Description', DESCRIPTIONS.length);

        await sleep(1000);

        // Fill Headlines
        console.log('📝 Заполнение Headlines...');
        const hi = Array.from(document.querySelectorAll('multi-asset-editor[debugid="headlines"] input.input-area')).filter(el => el.offsetWidth > 0);
        for (let i = 0; i < Math.min(HEADLINES.length, hi.length); i++) {
            set(hi[i], HEADLINES[i]);
            console.log('   \u2705 H' + (i+1) + ': ' + HEADLINES[i]);
            await randomDelay(300, 600);
        }

        // Fill Descriptions
        console.log('📝 Заполнение Descriptions...');
        const di = Array.from(document.querySelectorAll('multi-asset-editor[debugid="descriptions"] input.input-area')).filter(el => el.offsetWidth > 0);
        for (let i = 0; i < Math.min(DESCRIPTIONS.length, di.length); i++) {
            set(di[i], DESCRIPTIONS[i]);
            console.log('   \u2705 D' + (i+1) + ': ' + DESCRIPTIONS[i]);
            await randomDelay(300, 600);
        }

        // Final URL
        const urlEl = document.querySelector('url-input[debugid="final-url"] input.input-area');

        // Business Name (auto from URL)
        const compEl = document.querySelector('material-input[debugid="business-name"] input');

        console.log('');
        console.log('\u{1F389} Заполнение завершено!');
    }, 100);

})();`;
        }

        // Default 'video' type
        const tpl = `(function () {
    'use strict';
    const HEADLINES = [
${HEADLINES_BLOCK ? HEADLINES_BLOCK + '\n' : ''}  ];
    const LONG_HEADLINES = [
${LONG_BLOCK ? LONG_BLOCK + '\n' : ''}  ];
    const DESCRIPTIONS = [
${DESC_BLOCK ? DESC_BLOCK + '\n' : ''}  ];

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function randomDelay(min, max) { return sleep(Math.floor(Math.random() * (max - min + 1)) + min); }


    function set(el, val) {
        if (!el) return;
        el.focus();
        el.dispatchEvent(new Event('focus', {bubbles: true}));
        el.value = val;
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        el.blur();
        el.dispatchEvent(new Event('blur', {bubbles: true}));
    }

    function findAddButton(debugId, labelText) {
        let btn = null;
        // Strategy 0: Direct search inside the specific container
        const container = document.querySelector('multi-asset-editor[debugid="' + debugId + '"]');
        if (container) {
            btn = Array.from(container.querySelectorAll('material-button')).find(b => 
                (b.textContent.includes(labelText) || b.textContent.includes('add')) && b.offsetWidth > 0
            );
            if (btn) return btn;
        }
    
        // Fallback strategies
        btn = Array.from(document.querySelectorAll('material-button')).find(b =>
            (b.textContent.trim() === 'add' + labelText || b.textContent.trim() === labelText) && b.offsetWidth > 0
        );
        if (!btn) btn = Array.from(document.querySelectorAll('material-button')).find(b =>
            b.textContent.includes(labelText) && b.querySelector('material-icon') && b.offsetWidth > 0
        );
        if (!btn) btn = Array.from(document.querySelectorAll('.add-asset-button')).find(b =>
            b.textContent.includes(labelText) && b.offsetWidth > 0
        );
        return btn;
    }

    setTimeout(async () => {
        console.log('\u{1F680} Google Ads Auto-Fill');
        console.log('');

        // Video Ad
        try {
            const vr = Array.from(document.querySelectorAll('material-radio')).find(r =>
                (r.textContent || '').includes('Video ad') || (r.textContent || '').includes('Show ads with a single video')
            );
            if (vr) { vr.click(); console.log('   \u2705 Video ad'); await sleep(1000); }
        } catch(e) {}
        console.log('');

        // Landing Page Preview
        try {
            const cb = Array.from(document.querySelectorAll('material-checkbox')).find(c =>
                (c.textContent || '').includes('Show a screenshot of your landing page')
            );
            if (cb && cb.getAttribute('aria-checked') !== 'false') { 
                cb.click(); 
                console.log('   \u2705 Landing Page Preview отключен'); 
                await sleep(1000); 
            }
            else if (!cb) {
                const lp = document.querySelector('#enhancement-option-LANDING_PAGE_PREVIEW');
                if (lp && lp.getAttribute('aria-checked') !== 'false') { lp.click(); await sleep(1000); }
            }
        } catch(e) {}
        console.log('');

        // Image Optimization
        try {
            const imgOptCb = Array.from(document.querySelectorAll('material-checkbox')).find(c => {
                const t = (c.textContent || '').toLowerCase();
                return t.includes('image enhancement') || t.includes('image optimization') || t.includes('asset optimization');
            });
            if (imgOptCb && imgOptCb.getAttribute('aria-checked') !== 'false') {
                imgOptCb.click();
                console.log('   \u2705 Image Optimization отключен');
                await sleep(1000);
            }
        } catch(e) {}
        console.log('');

        // Add fields
        async function addSection(debugId, labelText, needed) {
            console.log('🔄 Проверка полей: ' + labelText);
            const inputs = Array.from(document.querySelectorAll('multi-asset-editor[debugid="' + debugId + '"] input.input-area')).filter(el => el.offsetWidth > 0);
            const clicks = needed - inputs.length;
            if (clicks > 0) {
                const btn = findAddButton(debugId, labelText);
                if (btn) {
                    console.log('   ➕ Добавляем ' + clicks + ' полей (' + labelText + ')');
                    for (let i = 0; i < clicks; i++) { 
                        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
                        await sleep(300);
                        btn.click(); 
                        await sleep(500); 
                    }
                    await sleep(1500); // Дать время Angular отрендерить новые поля
                } else {
                    console.log('   ❌ Кнопка "Добавить ' + labelText + '" не найдена!');
                }
            }
        }

        await addSection('headlines', 'Headline', HEADLINES.length);
        await addSection('long-headlines', 'Long headline', LONG_HEADLINES.length);
        await addSection('descriptions', 'Description', DESCRIPTIONS.length);

        await sleep(1000);

        // Fill Headlines
        console.log('📝 Заполнение Headlines...');
        const hi = Array.from(document.querySelectorAll('multi-asset-editor[debugid="headlines"] input.input-area')).filter(el => el.offsetWidth > 0);
        for (let i = 0; i < Math.min(HEADLINES.length, hi.length); i++) {
            set(hi[i], HEADLINES[i]);
            console.log('   \u2705 H' + (i+1) + ': ' + HEADLINES[i]);
            await randomDelay(300, 600);
        }

        // Fill Long Headlines
        console.log('📝 Заполнение Long Headlines...');
        const lhi = Array.from(document.querySelectorAll('multi-asset-editor[debugid="long-headlines"] input.input-area')).filter(el => el.offsetWidth > 0);
        for (let i = 0; i < Math.min(LONG_HEADLINES.length, lhi.length); i++) {
            set(lhi[i], LONG_HEADLINES[i]);
            console.log('   \u2705 LH' + (i+1) + ': ' + LONG_HEADLINES[i]);
            await randomDelay(300, 600);
        }

        // Fill Descriptions
        console.log('📝 Заполнение Descriptions...');
        const di = Array.from(document.querySelectorAll('multi-asset-editor[debugid="descriptions"] input.input-area')).filter(el => el.offsetWidth > 0);
        for (let i = 0; i < Math.min(DESCRIPTIONS.length, di.length); i++) {
            set(di[i], DESCRIPTIONS[i]);
            console.log('   \u2705 D' + (i+1) + ': ' + DESCRIPTIONS[i]);
            await randomDelay(300, 600);
        }

        // Final URL
        const urlEl = document.querySelector('url-input[debugid="final-url"] input.input-area');
        if (urlEl && FINAL_URL) { set(urlEl, FINAL_URL); console.log('   \u2705 URL: ' + FINAL_URL); }

        // Business Name (auto from URL)
        const compEl = document.querySelector('material-input[debugid="business-name"] input');
        if (compEl && FINAL_URL) {
            let name = '';
            try {
                const u = FINAL_URL.startsWith('http') ? FINAL_URL : 'https://' + FINAL_URL;
                const d = new URL(u).hostname.replace(/^www\\./, '').split('.')[0];
                name = d.charAt(0).toUpperCase() + d.slice(1);
            } catch(e) { name = FINAL_URL.split('.')[0]; name = name.charAt(0).toUpperCase() + name.slice(1); }
            if (name) { set(compEl, name); console.log('   \u2705 BN: ' + name); }
        }

        console.log('');
        console.log('\u{1F389} Заполнение завершено!');
    }, 100);

})();`;

        return tpl;
}

function showGeneratedResult(scriptText, presetTitle) {
        // reuse or create a small result modal
        let result = document.getElementById('generated-result-modal');
        if (!result) {
                result = document.createElement('div');
                result.id = 'generated-result-modal';
                result.className = 'generate-modal modal-overlay';
                result.style.display = 'none';
                result.innerHTML = `
                    <div class="modal-panel">
                        <header class="modal-header"><h3>Сгенерированный скрипт</h3><button class="modal-close">&#215;</button></header>
                        <div style="margin-bottom:8px"><strong>Preset:</strong> <span id="gen-preset-title"></span></div>
                        <textarea id="generated-script-text" style="width:100%;height:360px;font-family:monospace;white-space:pre;background: rgba(0, 0, 0, 0.35);color: #fff;padding: 17px 14px;border-radius: 18px;" readonly></textarea>
                        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
                            <button id="copy-generated" class="btn-primary">Копировать</button>
                            <button id="save-generated" class="btn-primary">Сохранить в Scripts</button>
                            <button id="close-generated" class="btn-secondary">Закрыть</button>
                        </div>
                    </div>`;
                document.body.appendChild(result);
                result.querySelector('.modal-close').addEventListener('click', () => { result.style.display = 'none'; });
                result.querySelector('#close-generated').addEventListener('click', () => { result.style.display = 'none'; });
                result.querySelector('#copy-generated').addEventListener('click', async () => {
                        const txt = document.getElementById('generated-script-text').value;
                        try { await navigator.clipboard.writeText(txt); showToast('Скрипт скопирован в буфер обмена!', 'success'); } catch (e) { showToast('Не удалось скопировать', 'error'); }
                });
                result.querySelector('#save-generated').addEventListener('click', async () => {
                        const txt = document.getElementById('generated-script-text').value;
                        const name = presetTitle || 'Generated preset ' + Date.now();
                        const newScript = { name, content: txt, created_at: new Date().toISOString() };
                        const success = await addScripts(newScript);
                        if (success) {
                            showToast('Скрипт сохранен в облако', 'success');
                            result.style.display = 'none';
                            if (_generateModal) {
                                const generateForm = _generateModal.querySelector('.generate-form');
                                if (generateForm) generateForm.reset();
                            }
                            closeGenerateModal();
                        }
                });
        }

        document.getElementById('gen-preset-title').textContent = presetTitle || '';
        document.getElementById('generated-script-text').value = scriptText;
        result.style.display = 'flex';
}

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
// Cloud API Handlers (async / await Server Backend Bin CRUD)
// ==========================================================================

async function fetchScripts() {
    try {
        const response = await fetch('/api/scripts', { 
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Не удалось загрузить скрипты с сервера');
        const data = await response.json();
        state.scripts = data || [];
        render();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function addScripts(newScript) {
    try {
        const response = await fetch('/api/scripts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newScript)
        });
        
        if (!response.ok) throw new Error('Не удалось сохранить изменения на сервере');
        const responseData = await response.json();
        newScript.id = responseData.id;
        newScript.created_at = responseData.created_at || newScript.created_at;
        state.scripts.unshift(newScript);
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
        name,
        content,
        created_at: new Date().toISOString()
    };
    
    const success = await addScripts(newScript);
    if (success) {
        // Reset Inputs
        dom.scriptForm.reset();
        showToast('Скрипт успешно добавлен в хранилище', 'success');
    }
}

async function handleUpdateScript(e) {
    e.preventDefault();
    
    const id = dom.editScriptId.value;
    const name = dom.editScriptName.value.trim();
    const content = dom.editScriptContent.value;
    
    const updatedScript = {
        name,
        content
    };

    try {
        const response = await fetch(`/api/scripts?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedScript)
        });

        if (!response.ok) throw new Error('Не удалось обновить скрипт на сервере');
        const responseData = await response.json();

        state.scripts = state.scripts.map(s => s.id == id ? responseData : s);
        render();
        closeModal();
        showToast('Скрипт сохранен на сервере', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleDeleteScript() {
    const id = dom.editScriptId.value;

    if (!confirm('Вы уверены, что хотите окончательно удалить этот скрипт?')) {
        return;
    }

    try {
        const response = await fetch(`/api/scripts?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Не удалось удалить скрипт с сервера');
        
        state.scripts = state.scripts.filter(s => s.id != id);
        render();
        closeModal();
        showToast('Скрипт успешно удален', 'info');
    } catch (error) {
        showToast(error.message, 'error');
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
    console.log(state, '= state =');
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
    console.log(script, '= openDetailsModal script =');
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
