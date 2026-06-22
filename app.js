/* --------------------------------------------------------
   Bloom Triage Journey Tracker - Interactive Application
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
      { sender: 'desk', text: "Hello! I'm Sarah at the front desk. Feel free to message me here or use the quick buttons above if you need water, blankets, or an update.", time: '16:48' }
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

  // --- COMFORT TIPS DATA ---
  const supportiveTips = [
    "You are doing beautifully. Feel free to adjust the room lighting or ask your partner to hold your hand. Relaxing your jaw helps soften contractions.",
    "Remember: every breath gets you closer to meeting your baby. Inhale peace, exhale tension.",
    "If you are feeling cold, open the 'Need Assistance' drawer below and request a warm, sanitised blanket from Sarah.",
    "Our midwife team checks the CTG monitoring feeds continuously. You and your baby are in safe, watchful hands.",
    "Need to move around? Ask the midwife if you can sit on a birthing ball during monitor readings."
  ];

  // --- INITIALIZATION ---
  initTheme();
  updateTimelineUI();
  updateStatusTime();
  rotateTips();

  // --- THEME MANAGEMENT ---
  function initTheme() {
    // Respect system settings if no local override
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
    elements.currentStatusTime.textContent = `Arrived: ${hrs}:${mins}`;
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
      // Auto expand the new active step
      if (!state.expandedSteps.includes(stepIndex)) {
        state.expandedSteps.push(stepIndex);
      }
      
      updateTimelineUI();
      showToast(`Journey simulator set to Station ${stepIndex + 1}`);
      
      // Append automated event updates in chat to simulate clinical workflow
      const stations = [
        "Midwife Consultation started.",
        "Fetal monitoring CTG belts connected.",
        "Doctor examining ultrasound imaging.",
        "Discharge recommendations generated by clinical team."
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
    showToast("Journey reset back to Station 1");
    addChatMessage('system', "Triage tracking reset to Midwife Consultation.");
  });

  // --- TIMELINE CONTROLS ---
  function updateTimelineUI() {
    elements.overallProgressBadge.textContent = `Station ${state.currentStep + 1} of 4`;

    elements.timelineItems.forEach((item, index) => {
      // Remove classes
      item.classList.remove('active', 'completed', 'pending', 'expanded');
      
      const lineFill = item.querySelector('.timeline-line-fill');
      
      if (index < state.currentStep) {
        // Completed stations
        item.classList.add('completed');
        if (lineFill) lineFill.style.height = '100%';
        enableStepCheckboxes(item, true, true); // disabled but fully checked
      } else if (index === state.currentStep) {
        // Active station
        item.classList.add('active');
        if (lineFill) lineFill.style.height = '0%';
        enableStepCheckboxes(item, true, false); // enable checkboxes for interaction
      } else {
        // Pending future stations
        item.classList.add('pending');
        if (lineFill) lineFill.style.height = '0%';
        enableStepCheckboxes(item, false, false); // disable and unchecked
      }

      // Check expansion override
      if (state.expandedSteps.includes(index)) {
        item.classList.add('expanded');
      }
    });

    // Special layout feature: highlight next steps cards in Station 4 based on recommendations
    if (state.currentStep === 3) {
      // Simulate doctor suggesting Safe Discharge after observation
      elements.pathwayCards.forEach(c => c.classList.remove('highlight'));
      const recCard = document.getElementById('path-discharge');
      if (recCard) recCard.classList.add('highlight');
    } else {
      elements.pathwayCards.forEach(c => c.classList.remove('highlight'));
    }
  }

  // Helper to enable/disable child checkbox elements of a station
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
        showToast("Task completed");
        
        // Auto-scroll simulation check
        checkStationChecklistDone();
      } else {
        labelText.classList.remove('text-completed');
      }
    }
  });

  // Check if all interactive checkboxes in active step are checked, and trigger midwife simulation message
  function checkStationChecklistDone() {
    const activeItem = document.querySelector('.timeline-item.active');
    if (!activeItem) return;
    
    const checkboxes = activeItem.querySelectorAll('.interactive-checkbox');
    const checkedBoxes = activeItem.querySelectorAll('.interactive-checkbox:checked');
    
    if (checkboxes.length > 0 && checkboxes.length === checkedBoxes.length) {
      setTimeout(() => {
        showToast("Midwife assessment completed!");
        addChatMessage('desk', "I see your midwife has finished your vital readings and dipstick test. We are preparing to transfer you to the fetal monitoring room (Station 2) next.");
        
        // Auto-toggle to step 2 in simulation for seamless flow
        const step2Btn = document.querySelector('.sim-step-btn[data-step="1"]');
        if (step2Btn) {
          setTimeout(() => {
            step2Btn.click();
          }, 2000);
        }
      }, 1000);
    }
  }

  // Timeline item header tap to expand accordion
  elements.timelineItems.forEach(item => {
    const header = item.querySelector('.timeline-card');
    header.addEventListener('click', (e) => {
      // Don't expand if checkbox clicked
      if (e.target.closest('.checklist-item')) return;
      
      const stepIndex = parseInt(item.getAttribute('data-index'), 10);
      const isExpanded = state.expandedSteps.includes(stepIndex);
      
      if (isExpanded) {
        // Collapse: remove from expanded list
        state.expandedSteps = state.expandedSteps.filter(idx => idx !== stepIndex);
      } else {
        // Expand: add to list
        state.expandedSteps.push(stepIndex);
      }
      
      updateTimelineUI();
    });
  });

  // --- BREATHING ASSISTANT ---
  elements.breathHeader.addEventListener('click', () => {
    elements.breathBody.classList.toggle('collapsed');
    const isCollapsed = elements.breathBody.classList.contains('collapsed');
    elements.breathToggleBtn.textContent = isCollapsed ? 'Try it' : 'Close';
    
    // Stop breathing cycle if closed
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
    elements.breathControlBtn.textContent = "Pause Guide";
    elements.breathControlBtn.style.backgroundColor = "var(--color-neutral-muted)";
    
    let cycle = 0; // 0 = Inhale, 1 = Hold, 2 = Exhale, 3 = Hold
    
    function runBreathingTick() {
      if (!state.breathingActive) return;
      
      if (cycle === 0) {
        elements.breathCircle.className = "breathing-circle inhaling";
        elements.breathText.textContent = "Inhale Deeply";
        cycle = 1;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 1) {
        elements.breathCircle.className = "breathing-circle inhaling";
        elements.breathText.textContent = "Hold Breath";
        cycle = 2;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 2) {
        elements.breathCircle.className = "breathing-circle exhaling";
        elements.breathText.textContent = "Exhale Slowly";
        cycle = 3;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      } else if (cycle === 3) {
        elements.breathCircle.className = "breathing-circle exhaling";
        elements.breathText.textContent = "Relax";
        cycle = 0;
        state.breathTimeout = setTimeout(runBreathingTick, 4000);
      }
    }
    
    runBreathingTick();
  }

  function stopBreathingCycle() {
    state.breathingActive = false;
    clearTimeout(state.breathTimeout);
    elements.breathControlBtn.textContent = "Start Guide";
    elements.breathControlBtn.style.backgroundColor = "var(--color-blue)";
    elements.breathCircle.className = "breathing-circle";
    elements.breathText.textContent = "Ready";
  }

  // --- NEED HELP BOTTOM SHEET DRAWER ---
  elements.helpBtnTrigger.addEventListener('click', openHelpDrawer);
  elements.drawerBackdrop.addEventListener('click', closeHelpDrawer);
  elements.closeDrawerBtn.addEventListener('click', closeHelpDrawer);

  function openHelpDrawer() {
    elements.drawerBackdrop.classList.add('active');
    elements.helpBottomSheet.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
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
          msgText = "Hello front desk, could I please request a cup of cold drinking water?";
          toastConfirmText = "Water request sent successfully!";
          replyText = "Hi! A member of our staff is bringing a cold cup of water to your triage bay now. It will be there in just a few minutes.";
          break;
        case 'discomfort':
          msgText = "Hello midwife desk, I'm feeling strong discomfort / baby contractions and would like some assistance.";
          toastConfirmText = "Pain alert sent to midwives!";
          replyText = "Understood. The midwife on duty has been notified. Sarah is sending someone to check your vitals and comfort levels right away.";
          responseDelay = 2000;
          break;
        case 'wait':
          msgText = "Excuse me, can I please request an update on my estimated waiting time to see the doctor?";
          toastConfirmText = "Wait estimate request sent!";
          replyText = "Certainly. The doctor is currently reviewing monitoring records for Station 2. The estimated wait to start Station 3 is about 15-20 minutes. We appreciate your patience.";
          break;
        case 'blanket':
          msgText = "Hello front desk, I'm feeling a bit cold. Could I request a warm blanket?";
          toastConfirmText = "Blanket request sent!";
          replyText = "Of course! We are warming a sanitised blanket for you right now. Someone will bring it to your room in 3 to 5 minutes.";
          break;
      }
      
      // Send user message
      addChatMessage('user', msgText);
      showToast(toastConfirmText);
      
      // Auto reply from desk after delay
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
    
    // User message
    addChatMessage('user', text);
    elements.chatInput.value = "";
    
    // Reception reply simulation
    setTimeout(() => {
      let automatedText = "Thank you for reaching out. Sarah has received your message at the front desk and is coordinating with the clinical team. We will get back to you immediately.";
      
      // Simple smart keyword response matching
      const lower = text.toLowerCase();
      if (lower.includes('partner') || lower.includes('husband') || lower.includes('companion')) {
        automatedText = "Yes, your support partner is welcome to stay with you in the triage room. If they need to step out for food, the cafeteria is on level 1.";
      } else if (lower.includes('bathroom') || lower.includes('toilet')) {
        automatedText = "The nearest restrooms are located immediately to the left as you exit the triage reception room. If you are connected to the fetal monitor, please call the midwife before disconnecting.";
      } else if (lower.includes('pain') || lower.includes('contract')) {
        automatedText = "I have flagged your message as priority. The duty midwife is being alerted immediately to check on your comfort.";
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
    
    // Auto scroll chat log to bottom
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
      
      // Fade out transition
      tipTextNode.style.opacity = '0';
      setTimeout(() => {
        tipTextNode.textContent = supportiveTips[index];
        tipTextNode.style.opacity = '1';
      }, 350);
    }, 15000); // rotate every 15 seconds
  }

});
