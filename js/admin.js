/**
 * Catherine's Birthday Surprise - Admin Backend Controller
 */

const AdminPanel = {
  modalEl: null,
  isOpen: false,

  init() {
    this.modalEl = document.getElementById('adminModal');
    this.bindEvents();
    this.checkUrlTrigger();
  },

  checkUrlTrigger() {
    // If URL has ?admin=bobo or ?admin=true or ?admin=1 or #admin, show trigger & open immediately
    const urlParams = new URLSearchParams(window.location.search);
    const triggerBtn = document.getElementById('adminTriggerBtn');
    const isAdmin = urlParams.get('admin') === 'bobo' || 
                    urlParams.get('admin') === 'true' || 
                    urlParams.get('admin') === '1' || 
                    window.location.hash === '#admin';

    if (isAdmin) {
      if (triggerBtn) triggerBtn.style.setProperty('display', 'flex', 'important');
      setTimeout(() => this.open(), 400);
    } else {
      if (triggerBtn) triggerBtn.style.setProperty('display', 'none', 'important');
    }
  },

  bindEvents() {
    // Admin Trigger Button (Floating gear icon - visible only when triggered)
    const triggerBtn = document.getElementById('adminTriggerBtn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.open();
      });
    }

    // Secret trigger: Triple click on wax seal or title prompts for Bobo's PIN
    let secretClicks = 0;
    let secretTimer = null;
    const triggerElements = [
      document.getElementById('waxSealSecretBtn'),
      document.getElementById('countdownTitle'),
      document.querySelector('.wax-seal-badge')
    ];

    triggerElements.forEach(el => {
      if (!el) return;
      el.addEventListener('click', () => {
        secretClicks++;
        clearTimeout(secretTimer);
        secretTimer = setTimeout(() => { secretClicks = 0; }, 1400);

        if (secretClicks >= 3) {
          secretClicks = 0;
          const pin = prompt('🔐 請輸入後台管理金鑰 (密碼)：');
          if (pin && (pin.toLowerCase() === 'bobo' || pin === '430' || pin === '0430' || pin === '999')) {
            const btn = document.getElementById('adminTriggerBtn');
            if (btn) btn.style.setProperty('display', 'flex', 'important');
            this.open();
            showToast('✨ 歡迎 Bobo！後台管理面板已開啟。');
          } else if (pin !== null) {
            alert('❌ 密碼錯誤');
          }
        }
      });
    });

    // Copy Share Link Buttons in Admin
    const copyPublic = document.getElementById('adminCopyPublicBtn');
    if (copyPublic) {
      copyPublic.addEventListener('click', () => {
        const cleanUrl = window.location.origin + window.location.pathname;
        navigator.clipboard.writeText(cleanUrl).then(() => {
          showToast('📋 已複製【正式公開連結】！直接傳給 Patty。');
        });
      });
    }

    const copyUnlocked = document.getElementById('adminCopyUnlockedBtn');
    if (copyUnlocked) {
      copyUnlocked.addEventListener('click', () => {
        const url = window.location.origin + window.location.pathname + '?mode=unlocked';
        navigator.clipboard.writeText(url).then(() => {
          showToast('🔓 已複製【強制解鎖連結】！點開直接看禮物卡片。');
        });
      });
    }

    const copyAdmin = document.getElementById('adminCopyAdminBtn');
    if (copyAdmin) {
      copyAdmin.addEventListener('click', () => {
        const url = window.location.origin + window.location.pathname + '?admin=bobo';
        navigator.clipboard.writeText(url).then(() => {
          showToast('🔑 已複製【管理員專屬後台連結】！請妥善保存。');
        });
      });
    }

    // Modal Close Button
    const closeBtn = document.getElementById('adminCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Save Button
    const saveBtn = document.getElementById('adminSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    // Reset to Default Button
    const resetBtn = document.getElementById('adminResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // Quick Time Presets
    document.querySelectorAll('.quick-time-btn[data-time-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.timeAction;
        this.applyQuickTime(action);
      });
    });

    // Test countdown completion
    const testCountdownBtn = document.getElementById('adminTestCountdownBtn');
    if (testCountdownBtn) {
      testCountdownBtn.addEventListener('click', () => {
        this.close();
        App.onCountdownComplete();
      });
    }

    // Reset scratch cards
    const resetScratchBtn = document.getElementById('adminResetScratchBtn');
    if (resetScratchBtn) {
      resetScratchBtn.addEventListener('click', () => {
        location.reload();
      });
    }

    // Export JSON
    const exportBtn = document.getElementById('adminExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportConfig());
    }

    // Import JSON
    const importBtn = document.getElementById('adminImportBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importConfig());
    }
  },

  open() {
    this.populateForm();
    this.modalEl.classList.add('open');
    this.isOpen = true;
  },

  close() {
    this.modalEl.classList.remove('open');
    this.isOpen = false;
  },

  populateForm() {
    const c = ConfigManager.getConfig();

    // Mode Radio
    const modeRadio = document.querySelector(`input[name="adminMode"][value="${c.mode}"]`);
    if (modeRadio) modeRadio.checked = true;

    // Target Time
    const timeInput = document.getElementById('adminTargetTime');
    if (timeInput) timeInput.value = c.targetTime || '';

    // Recipient Name
    const nameInput = document.getElementById('adminRecipientName');
    if (nameInput) nameInput.value = c.recipientName || '賴品岑';

    // Countdown Title & Subtitle
    const cdTitleInput = document.getElementById('adminCountdownTitle');
    if (cdTitleInput) cdTitleInput.value = c.countdownTitle || '距離 賴品岑 (Patty) 的專屬驚喜解鎖還有';

    const cdSubInput = document.getElementById('adminCountdownSubtitle');
    if (cdSubInput) cdSubInput.value = c.countdownSubtitle || '';

    // Photo Caption
    const photoCaptionInput = document.getElementById('adminPhotoCaption');
    if (photoCaptionInput) photoCaptionInput.value = c.photoCaption || '';

    // Card Letter Text
    const letterInput = document.getElementById('adminCardLetter');
    if (letterInput) letterInput.value = c.cardLetter || '';

    // Prizes
    if (c.prizes && c.prizes.length >= 2) {
      document.getElementById('adminPrize1Title').value = c.prizes[0].title || '';
      document.getElementById('adminPrize1Desc').value = c.prizes[0].desc || '';
      document.getElementById('adminPrize1Code').value = c.prizes[0].code || '';

      document.getElementById('adminPrize2Title').value = c.prizes[1].title || '';
      document.getElementById('adminPrize2Desc').value = c.prizes[1].desc || '';
      document.getElementById('adminPrize2Code').value = c.prizes[1].code || '';
    }
  },

  applyQuickTime(action) {
    const timeInput = document.getElementById('adminTargetTime');
    if (!timeInput) return;

    const target = new Date();

    if (action === 'plus5m') {
      target.setMinutes(target.getMinutes() + 5);
    } else if (action === 'plus1h') {
      target.setHours(target.getHours() + 1);
    } else if (action === 'midnight') {
      target.setDate(target.getDate() + 1);
      target.setHours(0, 0, 0, 0);
    } else if (action === 'tomorrow12') {
      target.setDate(target.getDate() + 1);
      target.setHours(12, 0, 0, 0);
    }

    // Format for datetime-local (YYYY-MM-DDTHH:mm)
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(target - tzOffset)).toISOString().slice(0, 16);
    timeInput.value = localISOTime;

    // Automatically switch mode to 'timer'
    const timerRadio = document.querySelector('input[name="adminMode"][value="timer"]');
    if (timerRadio) timerRadio.checked = true;

    showToast('已設定定時時間！');
  },

  saveSettings() {
    const currentConfig = ConfigManager.getConfig();

    const selectedMode = document.querySelector('input[name="adminMode"]:checked')?.value || 'timer';
    const targetTime = document.getElementById('adminTargetTime').value;
    const recipientName = document.getElementById('adminRecipientName').value.trim() || '賴品岑';
    const countdownTitle = document.getElementById('adminCountdownTitle').value.trim();
    const countdownSubtitle = document.getElementById('adminCountdownSubtitle').value.trim();
    const photoCaption = document.getElementById('adminPhotoCaption').value.trim();
    const cardLetter = document.getElementById('adminCardLetter').value.trim();

    const prize1 = {
      id: 'drink',
      title: document.getElementById('adminPrize1Title').value.trim() || '☕ 今日特調 ‧ 飲料一杯兌換券',
      desc: document.getElementById('adminPrize1Desc').value.trim() || '憑此券可兌換全品項特調飲品 / 星巴克任選一杯！',
      code: document.getElementById('adminPrize1Code').value.trim() || 'BDAY-DRINK-2026',
      icon: '☕'
    };

    const prize2 = {
      id: 'gift',
      title: document.getElementById('adminPrize2Title').value.trim() || '🎁 命中注定 ‧ 神秘小禮一個',
      desc: document.getElementById('adminPrize2Desc').value.trim() || '由好友親自挑選並為妳準備的神秘生日禮物！',
      code: document.getElementById('adminPrize2Code').value.trim() || 'BDAY-GIFT-999',
      icon: '🎁'
    };

    const updatedConfig = {
      ...currentConfig,
      mode: selectedMode,
      targetTime,
      recipientName,
      countdownTitle,
      countdownSubtitle,
      photoCaption,
      cardLetter,
      prizes: [prize1, prize2]
    };

    ConfigManager.saveConfig(updatedConfig);
    App.config = updatedConfig;
    App.applyConfigToDOM();
    App.evaluateDisplayState();

    this.close();
    showToast('🎉 後台設定已成功儲存並即時套用！');
  },

  resetToDefaults() {
    if (confirm('確定要將所有設定恢復為預設值嗎？')) {
      const defaultConf = ConfigManager.getDefaultConfig();
      ConfigManager.saveConfig(defaultConf);
      App.config = defaultConf;
      App.applyConfigToDOM();
      App.evaluateDisplayState();
      this.populateForm();
      showToast('已恢復為預設設定！');
    }
  },

  exportConfig() {
    const config = ConfigManager.getConfig();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "config.json");
    dlAnchor.click();
    showToast('已匯出最新 config.json 設定檔！');
  },

  importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          ConfigManager.saveConfig(imported);
          App.config = imported;
          App.applyConfigToDOM();
          App.evaluateDisplayState();
          this.populateForm();
          showToast('成功匯入設定！');
        } catch (err) {
          alert('匯入失敗：JSON 格式無效');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

// Initialize Admin on load
document.addEventListener('DOMContentLoaded', () => {
  AdminPanel.init();
});
