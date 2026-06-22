/* --------------------------------------------------------
   Bloom Triage Journey Tracker - Interactive Application (Hebrew RTL version)
   -------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- APPLICATION STATE ---
  const state = {
    currentStep: 0,       // Active triage station (0-3)
    expandedSteps: [0],   // List of step indexes currently expanded
    theme: 'light',       // 'light' or 'dark'
    breathingActive: false,
    breathInterval: null,
    chatMessages: [
      { sender: 'desk', text: "שלום! אני שרה מדלפק הקבלה. את מוזמנת לכתוב לי כאן בצ'אט או להשתמש בכפתורים המהירים למעלה אם את צריכה מים, שמיכה או עדכון לגבי התהליך.", time: '16:48' }
    ]
  };

  // --- DOM ELEMENTS ---
  const elements = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    sunIcon: document.querySelector('.sun-icon'),
    moonIcon: document.querySelector('.moon-icon'),
    
    // Simulator
    simToggleBtn: document.getElementById('simToggleBtn'),
    simPanelWrapper: document.getElementById('simPanelWrapper'),
    simStepBtns: document.querySelectorAll('.sim-step-btn'),
    simResetBtn: document.getElementById('simResetBtn'),
    
    // Timeline
    timelineItems: document.querySelectorAll('.timeline-item'),
    overallProgressBadge: document.getElementById('overallProgressBadge'),
    
    // Breathing Assistant
    breathCard: document.getElementById('breathCard'),
    breathHeader: document.getElementById('breathHeader'),
    breathBody: document.getElementById('breathBody'),
    breathToggleBtn: document.getElementById('breathToggleBtn'),
    breathCircle: document.getElementById('breathCircle'),
    breathText: document.getElementById('breathText'),
    breathControlBtn: document.getElementById('breathControlBtn'),
    
    // Need Help Drawer
    helpBtnTrigger: document.getElementById('helpBtnTrigger'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    helpBottomSheet: document.getElementById('helpBottomSheet'),
    closeDrawerBtn: document.getElementById('closeDrawerBtn'),
    reqActionBtns: document.querySelectorAll('.req-action-btn'),
    chatLog: document.getElementById('chatLog'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    
    // Toast
    appToast: document.getElementById('appToast'),
    toastMessage: document.getElementById('toastMessage'),
    
    // Welcome Note
    currentStatusTime: document.getElementById('currentStatusTime'),
    
    // Pathways in Station 4
    pathwayCards: document.querySelectorAll('.pathway-card')
  };

  // --- COMFORT TIPS DATA (HEBREW) ---
  const supportiveTips = [
    "את מתפקדת בצורה מדהימה. את מוזמנת לעמעם את האורות בחדר או לבקש מהמלווה שלך להחזיק לך את היד. הרפיית הלסת עוזרת לרכך את עוצמת הצירים.",
    "זכרי: כל נשימה מקרבת אותך למפגש עם הבייבי שלך. שאפי שלווה, נשפי מתח.",
    "אם קר לך, פתחי את מגירת 'צריכה עזרה' למטה ובקשי שמיכה חמה משרה בקבלה.",
    "צוות המיילדות שלנו עוקב ברציפות אחר נתוני המוניטור (CTG). את והתינוק שלך בידיים בטוחות ומשגיחות.",
    "צריכה לזוז? שאלי את המיילדת אם ניתן לשבת על כדור פיזיו במהלך בדיקת המוניטור."
  ];

  // --- INITIALIZATION ---
  initTheme();
  updateTimelineUI();
  updateStatusTime();
  rotateTips();

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem('bloom-theme');
    if (savedTheme) {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      state.theme = 'dark';
    }
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    if (state.theme === 'dark') {
      elements.sunIcon.style.display = 'block';
      elements.moonIcon.style.display = 'none';
    } else {
      elements.sunIcon.style.display = 'none';
      elements.moonIcon.style.display = 'block';
    }
  }

  elements.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('bloom-theme', state.theme);
    applyTheme();
  });

  // --- MOCK ARRIVAL TIME ---
  function updateStatusTime() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    elements.currentStatusTime.textContent = `הגעה: ${hrs}:${mins}`;
  }

  // --- SIMULATION CONTROL HUB ---
  elements.simToggleBtn.addEventListener('click', () => {
    elements.simPanelWrapper.classList.toggle('open');
  });

  elements.simStepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepIndex = parseInt(btn.getAttribute('data-step'), 10);
      
      // Update active button
      elements.simStepBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update state & refresh tracker
      state.currentStep = stepIndex;
      if (!state.expandedSteps.includes(stepIndex)) {
        state.expandedSteps.push(stepIndex);
      }
      
      updateTimelineUI();
      showToast(`הסימולטור הועבר לתחנה ${stepIndex + 1}`);
      
      const stations = [
        "קבלת מיילדת התחילה.",
        "חיבור למוניטור עוברי (CTG) בוצע.",
        "רופא/ה החל/ה בבדיקת אולטרסאונד.",
        "המלצות שחרור או אשפוז הופקו על ידי הרופא/ה."
      ];
      addChatMessage('system', stations[stepIndex]);
    });
  });

  elements.simResetBtn.addEventListener('click', () => {
    state.currentStep = 0;
    state.expandedSteps = [0];
    elements.simStepBtns.forEach(b => b.classList.remove('active'));
    elements.simStepBtns[0].classList.add('active');
    
    // Reset checkboxes in station 1
    const checkboxVitals = document.getElementById('check-vitals');
    const checkboxUrine = document.getElementById('check-urine');
    if (checkboxVitals) checkboxVitals.checked = false;
    if (checkboxUrine) checkboxUrine.checked = false;
    
    updateTimelineUI();
    showToast("המעקב אופס חזרה לתחנה 1");
    addChatMessage('system', "מעקב המיון אופס חזרה לקבלת מיילדת.");
  });

  // --- TIMELINE CONTROLS ---
  function updateTimelineUI() {
    elements.overallProgressBadge.textContent = `תחנה ${state.currentStep + 1} מתוך 4`;

    elements.timelineItems.forEach((item, index) => {
      item.classList.remove('active', 'completed', 'pending', 'expanded');
      
      const lineFill = item.querySelector('.timeline-line-fill');
      
      if (index < state.currentStep) {
        item.classList.add('completed');
        if (lineFill) lineFill.style.height = '100%';
        enableStepCheckboxes(item, true, true);
      } else if (index === state.currentStep) {
        item.classList.add('active');
        if (lineFill) lineFill.style.height = '0%';
        enableStepCheckboxes(item, true, false);
      } else {
        item.classList.add('pending');
        if (lineFill) lineFill.style.height = '0%';
        enableStepCheckboxes(item, false, false);
      }

      if (state.expandedSteps.includes(index)) {
        item.classList.add('expanded');
      }
    });

    // Special layout feature: highlight next steps cards in Station 4 based on recommendations
    if (state.currentStep === 3) {
      elements.pathwayCards.forEach(c => c.classList.remove('highlight'));
      const recCard = document.getElementById('path-discharge');
      if (recCard) recCard.classList.add('highlight');
    } else {
      elements.pathwayCards.forEach(c => c.classList.remove('highlight'));
    }
  }

  function enableStepCheckboxes(stationNode, enabled, checked) {
    const checkboxes = stationNode.querySelectorAll('.interactive-checkbox');
    checkboxes.forEach(cb => {
      cb.disabled = !enabled;
      if (checked) {
        cb.checked = true;
        const textNode = cb.nextElementSibling.nextElementSibling;
        if (textNode) textNode.classList.add('text-completed');
      } else if (!enabled) {
        cb.checked = false;
        const textNode = cb.nextElementSibling.nextElementSibling;
        if (textNode) textNode.classList.remove('text-completed');
      }
    });
  }

  // Interactive Checklist Action inside Active Station
  document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('interactive-checkbox')) {
      const checkbox = e.target;
      const labelText = checkbox.nextElementSibling.nextElementSibling;
      
      if (checkbox.checked) {
        labelText.classList.add('text-completed');
        showToast("משימה הושלמה");
        checkStationChecklistDone();
      } else {
        labelText.classList.remove('text-completed');
      }
    }
  });

  function checkStationChecklistDone() {
    const activeItem = document.querySelector('.timeline-item.active');
    if (!activeItem) return;
    
    const checkboxes = activeItem.querySelectorAll('.interactive-checkbox');
    const checkedBoxes = activeItem.querySelectorAll('.interactive-checkbox:checked');
    
    if (checkboxes.length > 0 && checkboxes.length === checkedBoxes.length) {
      setTimeout(() => {
        showToast("בדיקות המיילדת הושלמו בהצלחה!");
        addChatMessage('desk', "ראיתי שהמיילדת סיימה את בדיקת המדדים וסטיק השתן שלך במיון. אנחנו נערכים להעביר אותך לחדר הניטור העובר (תחנה 2) מיד.");
        
        // Auto-toggle to step 2 in simulation for seamless flow
        const step2Btn = document.querySelector('.sim-step-btn[data-step="1"]');
        if (step2Btn) {
          setTimeout(() => {
            step2Btn.click();
          }, 2500);
        }
      }, 1000);
    }
  }

  elements.timelineItems.forEach(item => {
    const header = item.querySelector('.timeline-card');
    header.addEventListener('click', (e) => {
      if (e.target.closest('.checklist-item')) return;
      
      const stepIndex = parseInt(item.getAttribute('data-index'), 10);
      const isExpanded = state.expandedSteps.includes(stepIndex);
      
      if (isExpanded) {
        state.expandedSteps = state.expandedSteps.filter(idx => idx !== stepIndex);
      } else {
        state.expandedSteps.push(stepIndex);
      }
      
      updateTimelineUI();
    });
  });

  // --- BREATHING ASSISTANT ---
  elements.breathHeader.addEventListener('click', () => {
    elements.breathBody.classList.toggle('collapsed');
    const isCollapsed = elements.breathBody.classList.contains('collapsed');
    elements.breathToggleBtn.textContent = isCollapsed ? 'ננסה?' : 'סגירה';
    
    if (isCollapsed && state.breathingActive) {
      stopBreathingCycle();
    }
  });

  elements.breathControlBtn.addEventListener('click', () => {
    if (state.breathingActive) {
      stopBreathingCycle();
    } else {
      startBreathingCycle();
    }
  });

  function startBreathingCycle() {
    state.breathingActive = true;
    elements.breathControlBtn.textContent = "עצירת תרגול";
    elements.breathControlBtn.style.backgroundColor = "var(--color-neutral-muted)";
    
    let cycle = 0; // 0 = Inhale, 1 = Hold, 2 = Exhale, 3 = Hold
    
    function runBreathingTick() {
      if (!state.breathingActive) return;
      
      if (cycle === 0) {
        elements.breathCircle.className = "breathing-circle inhaling";
        elements.breathText.textContent = "שאיפה עמוקה";
        cycle = 1;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 1) {
        elements.breathCircle.className = "breathing-circle inhaling";
        elements.breathText.textContent = "עצירת נשימה";
        cycle = 2;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 2) {
        elements.breathCircle.className = "breathing-circle exhaling";
        elements.breathText.textContent = "נשיפה איטית";
        cycle = 3;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 3) {
        elements.breathCircle.className = "breathing-circle exhaling";
        elements.breathText.textContent = "הרפיה...";
        cycle = 0;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      }
    }
    
    runBreathingTick();
  }

  function stopBreathingCycle() {
    state.breathingActive = false;
    clearTimeout(state.breathTimeout);
    elements.breathControlBtn.textContent = "התחלת תרגול";
    elements.breathControlBtn.style.backgroundColor = "var(--color-blue)";
    elements.breathCircle.className = "breathing-circle";
    elements.breathText.textContent = "מוכנה";
  }

  // --- NEED HELP BOTTOM SHEET DRAWER ---
  elements.helpBtnTrigger.addEventListener('click', openHelpDrawer);
  elements.drawerBackdrop.addEventListener('click', closeHelpDrawer);
  elements.closeDrawerBtn.addEventListener('click', closeHelpDrawer);

  function openHelpDrawer() {
    elements.drawerBackdrop.classList.add('active');
    elements.helpBottomSheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeHelpDrawer() {
    elements.drawerBackdrop.classList.remove('active');
    elements.helpBottomSheet.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Quick action alerts
  elements.reqActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const requestType = btn.getAttribute('data-req');
      let msgText = "";
      let toastConfirmText = "";
      let responseDelay = 3000;
      let replyText = "";
      
      switch(requestType) {
        case 'water':
          msgText = "שלום קבלה, אפשר לבקש בבקשה כוס מים קרים?";
          toastConfirmText = "בקשת מים נשלחה בהצלחה!";
          replyText = "שלום! איש צוות מביא לך כוס מים קרים לחדר המיון כעת. נגיע אלייך תוך דקות ספורות.";
          break;
        case 'discomfort':
          msgText = "שלום לצוות המיילדות, אני חווה כאב חזק / צירים חזקים ואשמח לסיוע.";
          toastConfirmText = "התראת כאב נשלחה למיילדות!";
          replyText = "הבנתי לחלוטין. המיילדת התורנית קיבלה עדכון דחוף על הכאב. שרה שולחת מישהי לבדוק את המדדים ואת רמת הנוחות שלך מיד.";
          responseDelay = 2000;
          break;
        case 'wait':
          msgText = "סליחה, אפשר לקבל עדכון לגבי זמן ההמתנה המשוער לבדיקת רופא/ה?";
          toastConfirmText = "בקשת בדיקת זמנים נשלחה!";
          replyText = "כמובן. הרופא/ה במיון עובר/ת כעת על רישומי המוניטור של תחנה 2. זמן ההמתנה המשוער להתחלת תחנה 3 הוא כ-15-20 דקות. תודה רבה על הסבלנות.";
          break;
        case 'blanket':
          msgText = "שלום קבלה, קצת קר לי בחדר. אפשר לבקש שמיכה חמה?";
          toastConfirmText = "בקשת שמיכה חמה נשלחה!";
          replyText = "כמובן! אנו מחממים שמיכה מחוטאת עבורך כעת. אחד מאנשי הצוות יביא אותה לחדרך תוך 3 עד 5 דקות.";
          break;
      }
      
      addChatMessage('user', msgText);
      showToast(toastConfirmText);
      
      setTimeout(() => {
        addChatMessage('desk', replyText);
      }, responseDelay);
    });
  });

  // Chat Submission
  elements.sendChatBtn.addEventListener('click', submitCustomMessage);
  elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitCustomMessage();
    }
  });

  function submitCustomMessage() {
    const text = elements.chatInput.value.trim();
    if (!text) return;
    
    addChatMessage('user', text);
    elements.chatInput.value = "";
    
    setTimeout(() => {
      let automatedText = "תודה שפנית אלינו. שרה קיבלה את הודעתך בדלפק הקבלה ומתאמת מול הצוות הרפואי. אנו נחזור אלייך בהקדם האפשרי.";
      
      const lower = text.toLowerCase();
      if (lower.includes('מלווה') || lower.includes('בעל') || lower.includes('בן זוג') || lower.includes('שותף') || lower.includes('אמא')) {
        automatedText = "כן, המלווה שלך מוזמן/נת להישאר איתך לאורך כל השהות בחדר המיון. במידה והם צריכים לצאת לקנות אוכל או שתייה, קפיטריה זמינה בקומה 1 של בית החולים.";
      } else if (lower.includes('שירותים') || lower.includes('שרותים') || lower.includes('פיפי')) {
        automatedText = "השירותים הקרובים ביותר נמצאים מיד משמאל ברגע שיוצאים מחדר ההמתנה של המיון. במידה ואת מחוברת למוניטור העובר, אנא קראי למיילדת כדי שתנתק אותך בבטחה לפני שאת קמה.";
      } else if (lower.includes('כאב') || lower.includes('ציר') || lower.includes('שורף') || lower.includes('דם')) {
        automatedText = "סימנתי את פנייתך בעדיפות גבוהה בעקבות דיווח על כאב/צירים. המיילדת התורנית במיון יולדות עודכנה ותגיע לחדרך מיד.";
      }
      
      addChatMessage('desk', automatedText);
    }, 2500);
  }

  function addChatMessage(sender, text) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const msgCard = document.createElement('div');
    msgCard.className = `message ${sender === 'user' ? 'user-msg' : sender === 'system' ? 'system-msg' : 'desk-msg'}`;
    
    msgCard.innerHTML = `
      <span class="msg-time">${timeStr}</span>
      <p>${escapeHTML(text)}</p>
    `;
    
    elements.chatLog.appendChild(msgCard);
    elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  }

  function escapeHTML(str) {
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

  // --- TOAST NOTIFICATIONS ---
  let toastTimeout = null;
  function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.appToast.classList.add('active');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.appToast.classList.remove('active');
    }, 3000);
  }

  // --- DYNAMIC HELP TIPS ROTATOR ---
  function rotateTips() {
    let index = 0;
    const tipTextNode = document.getElementById('dynamicTipText');
    if (!tipTextNode) return;
    
    setInterval(() => {
      index = (index + 1) % supportiveTips.length;
      
      tipTextNode.style.opacity = '0';
      setTimeout(() => {
        tipTextNode.textContent = supportiveTips[index];
        tipTextNode.style.opacity = '1';
      }, 350);
    }, 15000);
  }

});
