// i18n Module for XOPC Website
const i18n = {
  currentLang: localStorage.getItem('xopc-lang') || 'zh',
  translations: {},
  
  async init() {
    try {
      const [enRes, zhRes] = await Promise.all([
        fetch('/locales/en.json'),
        fetch('/locales/zh.json')
      ]);
      this.translations.en = await enRes.json();
      this.translations.zh = await zhRes.json();
      
      this.apply();
      this.updateLangIcon();
      document.documentElement.lang = this.currentLang;
      
      // Initialize pipeline translations
      this.initPipelineTranslations();
    } catch (e) {
      console.error('Failed to load translations:', e);
    }
  },
  
  get(key) {
    const keys = key.split('.');
    let obj = this.translations[this.currentLang];
    for (const k of keys) {
      obj = obj?.[k];
    }
    return obj || key;
  },
  
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.get(key);
      if (translated) el.textContent = translated;
    });
    
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const translated = this.get(key);
      if (translated) el.innerHTML = translated;
    });
  },
  
  toggle() {
    this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('xopc-lang', this.currentLang);
    document.documentElement.lang = this.currentLang;
    this.apply();
    this.updateLangIcon();
    this.updateAISuggestion();
  },
  
  updateLangIcon() {
    const icon = document.getElementById('lang-icon');
    if (icon) {
      icon.textContent = this.currentLang === 'zh' ? 'EN' : '中';
    }
  },
  
  initPipelineTranslations() {
    // Update AI suggestion when columns change
    const updateAISuggestion = () => {
      const suggestion = document.getElementById('ai-suggestion');
      if (suggestion && window.getAISuggestionText) {
        suggestion.textContent = window.getAISuggestionText();
      }
    };
    
    // Store reference for pipeline to use
    window.updateAISuggestion = updateAISuggestion;
    
    // Hook into existing column drop events if they exist
    setTimeout(() => {
      const columns = document.querySelectorAll('.pipeline-column');
      columns.forEach(column => {
        const originalDrop = column.ondrop;
        column.ondrop = function(e) {
          if (originalDrop) originalDrop.call(this, e);
          setTimeout(updateAISuggestion, 100);
        };
      });
    }, 1000);
  }
};

// Pipeline AI suggestion texts
const pipelineSuggestions = {
  zh: {
    default: '💡 建议：拖拽卡片到不同阶段，体验智能任务管理。Plan 阶段需要 Human in Loop 确认。',
    todo: '💡 任务已移至 Todo，准备开始规划。',
    plan: '💡 任务进入 Plan 阶段，等待 Human in Loop 确认。',
    doing: '💡 任务开始执行，AI 正在处理中...',
    done: '💡 任务完成！AI 正在总结经验。'
  },
  en: {
    default: 'Tip: Drag cards between stages to experience intelligent task management. Plan stage requires Human in Loop confirmation.',
    todo: 'Task moved to Todo, ready to start planning.',
    plan: 'Task entered Plan stage, waiting for Human in Loop confirmation.',
    doing: 'Task started execution, AI is processing...',
    done: 'Task completed! AI is summarizing insights.'
  }
};

function getPipelineSuggestion(status) {
  const lang = i18n.currentLang;
  return pipelineSuggestions[lang]?.[status] || pipelineSuggestions[lang]?.default || pipelineSuggestions.en.default;
}

// Make it globally accessible
window.getAISuggestionText = getPipelineSuggestion;
window.i18n = i18n;
window.toggleLang = () => i18n.toggle();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => i18n.init());
