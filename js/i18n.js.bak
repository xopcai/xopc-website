// i18n Module for XOPC Website
const i18n = {
  currentLang: localStorage.getItem('xopc-lang') || 'zh',
  translations: {},
  
  async init() {
    try {
      // Load both translation files
      const [enRes, zhRes] = await Promise.all([
        fetch('/locales/en.json'),
        fetch('/locales/zh.json')
      ]);
      this.translations.en = await enRes.json();
      this.translations.zh = await zhRes.json();
      
      // Apply translations
      this.apply();
      
      // Update lang icon
      this.updateLangIcon();
      
      // Update html lang attribute
      document.documentElement.lang = this.currentLang;
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
  },
  
  updateLangIcon() {
    const icon = document.getElementById('lang-icon');
    if (icon) {
      icon.textContent = this.currentLang === 'zh' ? 'EN' : '中';
    }
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => i18n.init());

// Make it globally accessible
window.i18n = i18n;
window.toggleLang = () => i18n.toggle();
