(() => {
  'use strict';

  const SIMULATION_AUTH_KEY = 'chikitsak_demo_auth';
  if ((location.pathname === '/simulation' || location.pathname === '/simulation/') && sessionStorage.getItem(SIMULATION_AUTH_KEY) !== 'meera') {
    location.replace('/login');
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'chikitsak_full_app_v2';
  const IST = 'en-IN';
  const TASK_ID = 'CHK-RM-1048';
  const AGENT_SYSTEM_PROMPT = 'You are Chikitsak, a family-care execution agent. Choose only the supplied permissible action. Explain the decision, identify the exact governing rule, and provide the exact task message sent to the named recipient. Never infer a dosage, exceed a mandate, disclose unnecessary health information, or close on courier status alone.';
  const PAGE_FLOW = [
    { route: 'home', label: 'Home' },
    { route: 'communications', label: 'Practitioner review' },
    { route: 'refill', label: 'Active refill' },
    { route: 'timeline', label: 'Care timeline' },
    { route: 'approvals', label: 'Approvals' },
    { route: 'payment', label: 'Payment' },
    { route: 'delivery', label: 'Delivery' },
    { route: 'handover', label: 'Family handover' },
    { route: 'permissions', label: 'Permissions' },
    { route: 'evidence', label: 'Evidence' },
    { route: 'integrations', label: 'Integrations' }
  ];
  const SCRIPTED_HINDI = 'बेटा, डॉक्टर साहब ने आज दवाई बदल दी है। कहा कि कोलेस्ट्रॉल वाली गोली अब एक की जगह दो... मतलब बड़ी वाली लेनी है। पर्ची पर लिख दिया है। और कहा दो महीने बाद दोबारा टेस्ट कराना। घर में गोलियाँ बस दो-तीन दिन की बची हैं।';
  const SCRIPTED_ENGLISH = 'The doctor changed the cholesterol medicine today. Rajan is unsure whether it means two tablets or a larger tablet; the instruction is written on the prescription. A repeat test is due in two months, and only two or three days of tablets remain.';
  const PHARMACY_SCRIPT = `GNANI API TRANSCRIPT · EXACT RETURN
नमस्ते, मैं चिकित्सक सहायक बोल रहा हूँ, राजन मेहता जी के लिए अधिकृत रिफिल की उपलब्धता की पुष्टि करनी थी, क्या एटोरॉस्टिन 20 मिलीग्राम की 30 टैबलेट की आपूर्ति उपलब्ध है उपलब्ध है अंतिम देय राशि क्या होगी ₹680 राजन मेहता के नाम पर क्या एक पैक रिज़र्व किया जा सकता है फार्मेसी ऑर्डर रेफरेंस भी बताएँ प्रिंस एस एम 1,048

NORMALISED OUTCOME
Available · ₹680 · one pack reserved · pharmacy order SM-1048`;

  const BASE_EVIDENCE = [
    { id: 'care-circle', at: '2026-05-18T05:10:00.000Z', title: 'Meera added as Rajan’s primary caregiver', source: 'Rajan Mehta · consent', mode: 'live', rule: 'Only the patient may authorise a caregiver.', message: 'Meera Mehta added as primary caregiver.', confidence: 'Identity verified', stateAfter: 'CARE_CIRCLE_ACTIVE' },
    { id: 'baseline-rx', at: '2026-06-12T06:45:00.000Z', title: 'Atorvastatin 10 mg nightly established', source: 'Dr Kavita Sharma · signed prescription', mode: 'offsite', rule: 'A signed doctor record establishes dosage authority.', message: 'No outbound message.', confidence: 'Document verified', stateAfter: 'BASELINE_REGIMEN_CONFIRMED' },
    { id: 'approved-pharmacy', at: '2026-06-12T07:05:00.000Z', title: 'Shekhawat Medical Store approved for routine refills', source: 'Meera Mehta · family permissions', mode: 'live', rule: 'Only a caregiver-approved pharmacy may receive an autonomous order.', message: 'Shekhawat Medical Store approved for exact refills.', confidence: 'Caregiver authorised', stateAfter: 'PHARMACY_APPROVED' },
    { id: 'standing-limit', at: '2026-07-03T11:20:00.000Z', title: 'Routine-medicine payment limit set to ₹650', source: 'Meera Mehta · family permissions', mode: 'live', rule: 'Payments above ₹650 require Meera’s one-time approval.', message: 'Routine medicine limit saved at ₹650 per order.', confidence: 'Caregiver authorised', stateAfter: 'MANDATE_ACTIVE' },
    { id: 'stock-check-amlodipine', at: '2026-09-30T13:15:00.000Z', title: 'Amlodipine stock confirmed: 8 tablets remaining', source: 'Rajan Mehta · medicine check-in', mode: 'offsite', rule: 'Patient-reported stock may schedule a reorder but cannot change dosage.', message: 'Amlodipine reorder scheduled for 9 October.', confidence: 'Patient reported', stateAfter: 'MEDICINE_STABLE' },
    { id: 'insulin-autonomous', at: '2026-10-02T12:10:00.000Z', title: 'Insulin glargine refill closed autonomously', source: 'Task CHK-RM-1039 · complete evidence chain', mode: 'live', rule: 'Exact prescription + approved pharmacy + ₹1,420 ≤ ₹1,500 insulin limit.', message: 'Order SM-1039 paid, delivered and confirmed; no approval request sent.', confidence: 'Policy matched', stateAfter: 'CLOSED_AUTONOMOUSLY' },
    { id: 'doctor-visit', at: '2026-10-04T06:40:00.000Z', title: 'Follow-up visit completed; instructions not yet reconciled', source: 'Rajan’s shared care calendar', mode: 'offsite', rule: 'Attendance alone cannot establish a treatment change.', message: 'Rajan, please share the doctor’s updated instruction and prescription.', confidence: 'Visit confirmed', stateAfter: 'AWAITING_PATIENT_UPDATE' }
  ];

  const POLICY_ACTIONS = [
    { id: 'read-records', label: 'Read verified doctor records' },
    { id: 'check-stock', label: 'Call an approved pharmacy for stock' },
    { id: 'book-delivery', label: 'Book prepaid delivery after payment' },
    { id: 'send-reminders', label: 'Send medicine and test reminders' },
    { id: 'new-pharmacy', label: 'Use a pharmacy not already approved' },
    { id: 'share-extra', label: 'Share data beyond the minimum task set' },
    { id: 'dose-substitution', label: 'Accept a dosage or medicine substitution' },
    { id: 'close-on-courier', label: 'Close a task from courier status alone' }
  ];

  const TRACKING = [
    { key: 'booked', label: 'Booked', detail: 'AWB generated' },
    { key: 'scheduled', label: 'Pickup scheduled', detail: 'Pharmacy notified' },
    { key: 'picked', label: 'Picked up', detail: 'Label scanned' },
    { key: 'transit', label: 'In transit', detail: 'Jaipur hub' },
    { key: 'delivered', label: 'Delivered', detail: 'Courier event only' }
  ];

  const STAGES = [
    { id: 'origin', title: 'Doctor visit awaiting review', short: 'Review', mode: 'offsite', modeLabel: 'Off-site', body: 'Chikitsak knows Rajan attended a follow-up visit, but still carries the last verified dose: Atorvastatin 10 mg nightly. Rajan’s message and updated prescription must arrive before anything changes.', gate: 'Do not infer a clinical change', safety: 'A completed appointment does not establish a new dosage.', offsite: 'Show Rajan’s WhatsApp voice note and prescription.', action: 'go-communications', actionLabel: 'Open practitioner review', route: 'communications' },
    { id: 'voice', title: 'Hindi request understood', short: 'Voice', mode: 'live', modeLabel: 'Live APIs', body: 'Gemini detects Hindi, Gnani preserves the original transcript, and Gemini creates a faithful English event without resolving the dosage ambiguity.', gate: 'Preserve uncertainty', safety: '“Two instead of one” cannot be converted into a dosage instruction.', offsite: 'Upload the same WhatsApp audio to the live pipeline.', action: 'go-communications', actionLabel: 'Open live voice pipeline', route: 'communications' },
    { id: 'prescription', title: 'Prescription verified', short: 'Rx', mode: 'wizard', modeLabel: 'World return', body: 'The synthetic prescription confirms Atorvastatin 20 mg, one tablet nightly, 30 tablets. The operator returns the document; Gemini decides the next permissible action.', gate: 'Document outranks recollection', safety: 'Only the prescription can confirm the changed strength and instruction.', offsite: 'Show the synthetic prescription image in the video.', action: 'verify-prescription', actionLabel: 'Ingest verified prescription', route: 'refill' },
    { id: 'pharmacy', title: 'Pharmacy scenario returns stock and price', short: 'Pharmacy', mode: 'wizard', modeLabel: 'Scripted scenario', body: 'A scripted pharmacy return supplies availability, ₹680 and reservation SM-1048 for the walkthrough. No live provider call is made.', gate: 'Verify before paying', safety: 'No substitution or clinical discussion is permitted.', offsite: 'Play the demo call and show the scripted transcript.', action: 'go-pharmacy', actionLabel: 'Review scripted return', route: 'communications' },
    { id: 'approval', title: '₹30 exception sent to Meera', short: 'Approval', mode: 'offsite', modeLabel: 'Off-site + policy', body: 'The ₹680 quote exceeds the ₹650 standing limit. Chikitsak pauses and requests a one-time approval instead of silently raising the mandate.', gate: 'Human authority required', safety: 'The one-time exception cannot change the permanent limit.', offsite: 'Show Meera’s WhatsApp approval message.', action: 'go-approvals', actionLabel: 'Review approval', route: 'approvals' },
    { id: 'pine-order', title: 'Pine Labs order created', short: 'Order', mode: 'wizard', modeLabel: 'Rail return', body: 'Gemini has already chosen CALL_PINE. The task, pharmacy order, sub-merchant and ₹680 amount return as one documentation-faithful order.', gate: 'Approval must match this task', safety: 'No real money moves in this prototype.', offsite: 'Narrate that Shekhawat is represented as an onboarded sub-merchant.', action: 'go-payment', actionLabel: 'Review Pine Labs return', route: 'payment' },
    { id: 'payment', title: 'Payment processed', short: 'Paid', mode: 'wizard', modeLabel: 'Rail return', body: 'A documentation-faithful Pine Labs response returns PROCESSED. Chikitsak stores the server-side result, then Gemini decides whether delivery is permitted.', gate: 'Verified result required', safety: 'Shipment cannot be created before payment is processed.', offsite: 'No personal UPI transfer is presented as Pine Labs.', action: 'go-payment', actionLabel: 'Return payment response', route: 'payment' },
    { id: 'shipment', title: 'Delhivery shipment created', short: 'Shipment', mode: 'wizard', modeLabel: 'Rail return', body: 'Gemini has already chosen CALL_DELHIVERY. The operator returns a simulated AWB and label from the Vaishali Nagar pickup to Rajan’s Malviya Nagar home.', gate: 'Payment precedes dispatch', safety: 'The logistics rail receives no diagnosis or longitudinal health record.', offsite: 'Show the generated SIMULATION label.', action: 'go-delivery', actionLabel: 'Review Delhivery return', route: 'delivery' },
    { id: 'pickup', title: 'Pharmacy packs and hands over', short: 'Pickup', mode: 'offsite', modeLabel: 'Off-site', body: 'The pharmacy packs a dummy medicine box, attaches the simulation label and keeps it ready. The Wizard advances the pickup events.', gate: 'Physical handoff is still human', safety: 'Chikitsak coordinates; it does not pretend the pharmacy’s work disappeared.', offsite: 'Film the dummy parcel being labelled and handed over.', action: 'go-delivery', actionLabel: 'Advance pickup events', route: 'delivery' },
    { id: 'delivered', title: 'Courier reports delivered', short: 'Delivered', mode: 'wizard', modeLabel: 'Wizard', body: 'Delhivery returns DELIVERED, but Chikitsak deliberately keeps the care task open.', gate: 'Courier status is insufficient', safety: '“Delivered” is not proof that Rajan received the correct medicine.', offsite: 'Show the staged courier-delivery event.', action: 'go-delivery', actionLabel: 'Complete tracking', route: 'delivery' },
    { id: 'receipt', title: 'Rajan confirms the contents', short: 'Receipt', mode: 'offsite', modeLabel: 'Off-site', body: 'Rajan confirms that the pack was sealed and contains 30 Atorvastatin 20 mg tablets.', gate: 'Household evidence required', safety: 'The identity, medicine, strength and quantity must match.', offsite: 'Show Rajan’s final WhatsApp confirmation and dummy pack.', action: 'confirm-receipt', actionLabel: 'Record Rajan’s confirmation', route: 'communications' },
    { id: 'closed', title: 'Refill closed; follow-up remains', short: 'Closed', mode: 'live', modeLabel: 'Policy-gated', body: 'The refill closes only after the complete evidence chain exists. The two-month test remains a separate open follow-up.', gate: 'Closure evidence complete', safety: 'Closing one loop must not erase the next obligation.', offsite: 'End on the evidence bundle and December follow-up.', action: 'close-task', actionLabel: 'Close with complete evidence', route: 'evidence' }
  ];

  const DEFAULT_STATE = {
    version: 3,
    requestReceived: false,
    voiceNormalized: false,
    voiceMode: null,
    voice: null,
    prescriptionVerified: false,
    pharmacyVerified: false,
    approval: 'pending',
    pineOrderCreated: false,
    paymentProcessed: false,
    shipmentCreated: false,
    trackingIndex: -1,
    householdConfirmed: false,
    closed: false,
    handover: false,
    model: 'scripted-demo',
    spendLimits: { routine: 650, insulin: 1500, urgent: 2000 },
    policies: {
      'read-records': 'auto',
      'check-stock': 'auto',
      'book-delivery': 'auto',
      'send-reminders': 'auto',
      'new-pharmacy': 'ask',
      'share-extra': 'ask',
      'dose-substitution': 'never',
      'close-on-courier': 'never'
    },
    evidence: structuredClone(BASE_EVIDENCE),
    decisions: []
  };

  let state = loadState();
  let busy = false;
  let draggedPolicyId = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved?.version === DEFAULT_STATE.version ? { ...DEFAULT_STATE, ...saved } : structuredClone(DEFAULT_STATE);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function now() { return new Date().toISOString(); }
  function timeLabel(value) { return new Date(value).toLocaleTimeString(IST, { hour: '2-digit', minute: '2-digit', hour12: true }); }
  function esc(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 1900); }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch { toast('Copy was blocked by the browser'); } }
  function go(route) { location.hash = route; }

  function evidenceExists(id) { return state.evidence.some(item => item.id === id); }
  function addEvidence(item) {
    if (item.id && evidenceExists(item.id)) return;
    state.evidence.push({ at: now(), rule: 'Recorded evidence; no autonomous action taken.', message: 'No outbound message.', confidence: 'Confirmed', stateAfter: currentTaskState(), ...item });
    saveState();
  }

  function currentTaskState() {
    if (state.closed) return 'CLOSED';
    if (state.householdConfirmed) return 'RECEIPT_CONFIRMED';
    if (state.trackingIndex >= 4) return 'DELIVERED_AWAITING_CONFIRMATION';
    if (state.shipmentCreated) return 'IN_DELIVERY';
    if (state.paymentProcessed) return 'PAID';
    if (state.approval === 'approved') return 'APPROVED';
    if (state.pharmacyVerified) return 'AWAITING_CAREGIVER_APPROVAL';
    if (state.prescriptionVerified) return 'AWAITING_PHARMACY_VERIFICATION';
    if (state.voiceNormalized) return 'AWAITING_PRESCRIPTION_VERIFICATION';
    if (state.requestReceived) return 'REQUEST_RECEIVED';
    return 'AWAITING_PATIENT_UPDATE';
  }

  function completedCount() {
    const checks = [
      state.requestReceived,
      state.voiceNormalized,
      state.prescriptionVerified,
      state.pharmacyVerified,
      state.approval === 'approved',
      state.pineOrderCreated,
      state.paymentProcessed,
      state.shipmentCreated,
      state.trackingIndex >= 2,
      state.trackingIndex >= 4,
      state.householdConfirmed,
      state.closed
    ];
    return checks.filter(Boolean).length;
  }

  function firstIncompleteIndex() { return Math.min(completedCount(), STAGES.length - 1); }

  function route() {
    const candidate = location.hash.replace('#', '') || 'home';
    return $(`[data-route="${candidate}"]`) ? candidate : 'home';
  }

  function renderRoute() {
    const active = route();
    $$('.screen').forEach(screen => screen.classList.toggle('active', screen.dataset.route === active));
    $$('[data-route-link]').forEach(link => link.classList.toggle('active', link.dataset.routeLink === active));
    renderPageFlow(active);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderPageFlow(active = route()) {
    const index = Math.max(0, PAGE_FLOW.findIndex(page => page.route === active));
    const current = PAGE_FLOW[index];
    const isFirst = index === 0;
    const isLast = index === PAGE_FLOW.length - 1;
    $('#pageFlowCount').textContent = `Page ${index + 1} of ${PAGE_FLOW.length}`;
    $('#pageFlowCurrent').textContent = current.label;
    $('#pageFlowPrev').disabled = isFirst;
    $('#pageFlowPrev').dataset.routeTarget = isFirst ? '' : PAGE_FLOW[index - 1].route;
    $('#pageFlowNext').dataset.routeTarget = isLast ? PAGE_FLOW[0].route : PAGE_FLOW[index + 1].route;
    $('#pageFlowNext').textContent = isLast ? 'Back to Home' : `Next: ${PAGE_FLOW[index + 1].label}`;
  }

  function renderHome() {
    const count = completedCount();
    const stage = STAGES[Math.min(count, 11)];
    $('#homeProgressBar').style.width = `${Math.max(6, count / 12 * 100)}%`;
    $('#homeCurrentStage').textContent = state.closed ? 'Refill closed with complete evidence' : stage.title;
    $('#homeNextAction').textContent = state.closed ? 'Complete the repeat test on 4 December' : stage.actionLabel;
    $('#coverageMetric').textContent = `${Math.min(100, 42 + Math.round(count / 12 * 58))}%`;
    $('#homeLoopMedicine').textContent = state.prescriptionVerified ? 'Verified: Atorvastatin 20 mg · one tablet nightly' : 'Last verified: Atorvastatin 10 mg nightly';
    $('#atorvastatinDose').textContent = state.prescriptionVerified ? 'Atorvastatin 20 mg' : 'Atorvastatin 10 mg';
    $('#atorvastatinInstruction').textContent = state.prescriptionVerified ? 'One tablet nightly · verified 4 Oct' : 'One tablet nightly · last verified 12 Jun';
    $('#atorvastatinCount').textContent = state.closed ? '30 / 30' : '3 / 30';
    $('#atorvastatinMeta').textContent = state.closed ? 'Delivered and confirmed today' : state.prescriptionVerified ? 'New strength awaiting fulfilment' : 'Refill due in 2–3 days';
    $('#medicineChangeMetric').textContent = state.prescriptionVerified ? '1 verified change today' : 'No changes recorded today';
    $('#openLoopMetric').textContent = '1';
    $('#openLoopCopy').textContent = state.closed ? 'Repeat test · 4 December' : 'Doctor visit review';
    if (state.closed) {
      $('#homeIntro').textContent = 'Rajan’s new regimen is verified and the refill has been received. His regular medicine cabinet and next follow-up are up to date.';
      $('#homeAttentionIcon').textContent = '✓';
      $('#homeAttentionKicker').textContent = 'Care loop completed';
      $('#homeAttentionTitle').textContent = 'Atorvastatin 20 mg delivered and confirmed';
      $('#homeAttentionCopy').textContent = 'Rajan confirmed the sealed 30-tablet pack. The refill is closed; the repeat test on 4 December remains open.';
      $('#homeAttentionAction').textContent = 'View complete evidence';
      $('#homeAttentionAction').dataset.go = 'evidence';
      $('#homeLoopEyebrow').textContent = 'Completed care loop';
      $('#homeLoopTitle').textContent = 'Atorvastatin 20 mg refill';
      $('#homeLoopStatus').textContent = 'Closed';
      $('#homeLoopStatus').classList.add('closed');
      $('#homeLoopStatus').classList.remove('open');
      $('#homeStock').textContent = '30 tablets received';
    } else {
      $('#homeIntro').textContent = 'Rajan’s regular medicines are being tracked. He completed a doctor visit this morning, but no change has been added yet.';
      $('#homeAttentionIcon').textContent = '+';
      $('#homeAttentionKicker').textContent = 'Visit completed';
      $('#homeAttentionTitle').textContent = 'Waiting for Rajan’s post-visit update';
      $('#homeAttentionCopy').textContent = 'The app still shows the last verified regimen: Atorvastatin 10 mg nightly. A visit alone does not change it.';
      $('#homeAttentionAction').textContent = 'Open practitioner review';
      $('#homeAttentionAction').dataset.go = 'communications';
      $('#homeLoopEyebrow').textContent = 'Post-visit care loop';
      $('#homeStock').textContent = '3 tablets left';
      $('#homeLoopStatus').textContent = state.requestReceived ? 'In progress' : 'Awaiting update';
      $('#homeLoopStatus').classList.add('open');
      $('#homeLoopStatus').classList.remove('closed');
      $('#homeLoopTitle').textContent = state.requestReceived ? 'Atorvastatin review and refill' : 'Doctor visit review';
      if (state.prescriptionVerified) {
        $('#homeAttentionKicker').textContent = 'Prescription verified';
        $('#homeAttentionTitle').textContent = 'New 20 mg regimen is now confirmed';
        $('#homeAttentionCopy').textContent = 'The timeline has been updated. Chikitsak is carrying the refill through pharmacy, payment, delivery and household confirmation.';
        $('#homeAttentionAction').textContent = 'Continue active refill';
        $('#homeAttentionAction').dataset.go = 'refill';
      } else if (state.requestReceived) {
        $('#homeAttentionKicker').textContent = 'Patient update received';
        $('#homeAttentionTitle').textContent = 'Rajan reports a possible dosage change';
        $('#homeAttentionCopy').textContent = 'The report is preserved, but Home still shows 10 mg until the updated prescription is verified.';
        $('#homeAttentionAction').textContent = 'Verify the new prescription';
        $('#homeAttentionAction').dataset.go = 'refill';
      }
    }
    $$('[data-task-status]').forEach(el => { if (el.id === 'homeLoopStatus') return; el.textContent = state.closed ? 'Closed' : 'Open'; el.classList.toggle('closed', state.closed); el.classList.toggle('open', !state.closed); });
    $('#navProgress').textContent = `${count}/12`;
    $('#navApproval').textContent = state.approval === 'approved' ? '✓' : '1';
  }

  function renderTimeline() {
    const base = [
      { title: 'Atorvastatin 10 mg nightly established', copy: 'Dr Kavita Sharma’s signed prescription creates the verified baseline used on Home.', time: '12 Jun 2026', kind: state.prescriptionVerified ? 'past' : 'confirmed', meta: ['Doctor record', state.prescriptionVerified ? 'Previous regimen' : 'Current regimen'] },
      { title: 'Follow-up consultation completed', copy: 'The shared calendar confirms that Rajan attended the visit. No dosage change is inferred from attendance alone.', time: '4 Oct · 12:10', kind: 'confirmed', meta: ['Care calendar', 'Visit confirmed'] }
    ];
    if (state.requestReceived) base.push({ title: 'Patient reports a possible medicine change', copy: 'Rajan says “two instead of one… the larger one.” The account stays provisional until the prescription is verified.', time: '4 Oct · 12:42', kind: state.prescriptionVerified ? 'past' : 'provisional', meta: ['WhatsApp', state.prescriptionVerified ? 'Superseded by document' : 'Reported only'] });
    if (state.prescriptionVerified) {
      base.push({ title: 'Atorvastatin 20 mg nightly confirmed', copy: 'The updated prescription confirms one tablet nightly and a 30-tablet refill.', time: '4 Oct · 12:46', kind: 'confirmed', meta: ['Prescription', 'Confirmed'] });
      base.push({ title: 'Repeat test follow-up', copy: 'Due two months after the verified medicine change.', time: '4 Dec 2026', kind: 'future', meta: ['Follow-up', 'Open'] });
    }
    $('#timelineRegimenTitle').textContent = state.prescriptionVerified ? 'Atorvastatin 20 mg' : 'Atorvastatin 10 mg';
    $('#timelineRegimenCopy').textContent = state.prescriptionVerified ? 'One tablet nightly · prescribed 4 October 2026' : 'One tablet nightly · established 12 June 2026';
    $('#timelineSource').textContent = state.prescriptionVerified ? 'Updated synthetic prescription' : 'Dr Kavita Sharma’s signed prescription';
    $('#timelinePrevious').textContent = state.prescriptionVerified ? '10 mg nightly' : 'No earlier change on record';
    $('#timelineFollowup').textContent = state.prescriptionVerified ? '4 December 2026' : 'Today’s visit not yet reconciled';
    $('#careTimeline').innerHTML = base.map(event => `<article class="timeline-event ${event.kind}"><header><h3>${esc(event.title)}</h3><time>${esc(event.time)}</time></header><p>${esc(event.copy)}</p><div class="event-meta">${event.meta.map(x => `<span>${esc(x)}</span>`).join('')}</div></article>`).join('');
  }

  function renderProgress() {
    const count = completedCount();
    $('#progressRibbon').innerHTML = STAGES.map((stage, index) => `<div class="progress-step ${index < count ? 'done' : index === count ? 'current' : ''}" title="${esc(stage.title)}"><span>${index + 1} · ${esc(stage.short)}</span></div>`).join('');
  }

  function actionDisabled(action) {
    const rules = {
      'verify-prescription': !state.voiceNormalized,
      'go-pharmacy': !state.prescriptionVerified,
      'go-approvals': !state.pharmacyVerified,
      'go-payment': state.approval !== 'approved',
      'go-delivery': !state.paymentProcessed,
      'confirm-receipt': state.trackingIndex < 4,
      'close-task': !state.householdConfirmed
    };
    return Boolean(rules[action]);
  }

  function renderActiveStage() {
    const index = firstIncompleteIndex();
    const stage = STAGES[index];
    $('#activeStageCard').innerHTML = `<div class="stage-top"><span class="stage-number">${index + 1}</span><span class="eyebrow">${esc(stage.gate)}</span><span class="mode ${stage.mode} stage-mode">${esc(stage.modeLabel)}</span></div><h2>${esc(stage.title)}</h2><p>${esc(stage.body)}</p><div class="stage-evidence"><div><small>Task</small><b>${TASK_ID}</b></div><div><small>Current state</small><b>${esc(currentTaskState())}</b></div><div><small>Evidence recorded</small><b>${state.evidence.length} items</b></div></div>${state.decisions.length ? `<div class="privacy-strip"><b>Latest Chikitsak decision:</b> ${esc(state.decisions.at(-1).title)} — ${esc(state.decisions.at(-1).reason)}</div>` : ''}<div class="stage-actions"><button class="btn primary" data-action="${stage.action}" ${actionDisabled(stage.action) ? 'disabled' : ''}>${esc(stage.actionLabel)}</button></div>`;
    const decision = state.decisions.at(-1);
    $('#agentModel').textContent = decision?.model || state.model;
    $('#agentDecisionTitle').textContent = decision?.title || 'Waiting for evidence';
    $('#agentDecisionReason').textContent = decision?.reason || 'The model has not selected an action yet.';
    $('#agentRule').textContent = decision?.rule_followed || 'No decision yet';
    $('#agentMessage').textContent = decision?.message_sent || 'No outbound message';
    $('#agentSystemPrompt').textContent = AGENT_SYSTEM_PROMPT;
    $('#safetyGate').textContent = stage.gate;
    $('#safetyCopy').textContent = stage.safety;
    $('#offsiteNext').textContent = stage.offsite;
    $('#offsiteCopy').textContent = stage.mode === 'offsite' ? 'Complete this visibly outside the site, then return the evidence.' : 'The related external moment remains explicitly labelled.';
  }

  function renderVoice() {
    $('#geminiModel').value = state.model;
    const status = $('#voicePipelineStatus');
    if (!state.voiceNormalized) {
      if (!status.dataset.running) status.innerHTML = '<div class="pipeline-item"><i></i><span>Waiting for audio</span><small>Not started</small></div>';
      return;
    }
    const v = state.voice || {};
    status.innerHTML = `<div class="pipeline-item done"><i></i><span>Language detected</span><small>${esc(v.language || 'Hindi · hi-IN')}</small></div><div class="pipeline-item done"><i></i><span>Gnani transcript preserved</span><small>${state.voiceMode === 'live' ? 'Live API' : 'Scripted fallback'}</small></div><div class="pipeline-item done"><i></i><span>English event created</span><small>Uncertainty retained</small></div><div class="privacy-strip"><b>Gnani-validated transcript:</b> ${esc(v.transcript || SCRIPTED_HINDI)}</div><div class="privacy-strip"><b>English event:</b> ${esc(v.english || SCRIPTED_ENGLISH)}</div>`;
  }

  function renderApproval() {
    const approved = state.approval === 'approved';
    const limit = state.spendLimits.routine;
    const excess = Math.max(0, 680 - limit);
    $('#approvalCard').classList.toggle('completed', approved);
    $('.approval-banner span', $('#approvalCard')).textContent = approved ? (excess ? 'Approved once' : 'Within mandate') : excess ? '₹' + excess + ' above limit' : 'Within configured limit';
    $('.approval-banner small', $('#approvalCard')).textContent = approved ? 'Routine limit remains ₹' + limit.toLocaleString('en-IN') : excess ? 'One-time exception requested' : 'Standing mandate can authorise this order';
    $('#approvalLimit').textContent = '₹' + limit.toLocaleString('en-IN');
    $('#approvalExcess').textContent = '₹' + excess.toLocaleString('en-IN');
    $('#approvalEvidenceLabel').textContent = excess ? 'I have shown Meera’s off-site WhatsApp approval in the recording.' : 'This payment is inside Meera’s configured routine-medicine limit.';
    $('#approveOnce').textContent = approved ? 'Approval evidence ingested' : excess ? 'Ingest Meera’s approval' : 'Apply standing mandate';
    $('#approveOnce').disabled = approved;
    $('#declineApproval').disabled = approved;
    $('#paymentApprovalState').textContent = approved ? (excess ? 'One-time approval recorded' : 'Within ₹' + limit.toLocaleString('en-IN') + ' mandate') : excess ? 'Waiting for Meera' : 'Standing mandate available';
    $('#approvalPolicyCopy').textContent = excess ? 'The permanent refill limit remains ₹' + limit.toLocaleString('en-IN') + '. The approval applies only to task CHK-RM-1048 and cannot be reused.' : 'No exception is needed at the current ₹' + limit.toLocaleString('en-IN') + ' routine-medicine limit. Medicine verification rules remain unchanged.';
    $('#approvalChat').classList.toggle('hidden', !approved);
  }

  function renderPayment() {
    $('#createPineOrder').disabled = state.approval !== 'approved' || state.pineOrderCreated;
    $('#createPineOrder').textContent = state.pineOrderCreated ? 'CREATED response ingested' : 'Return Pine Labs CREATED response';
    $('#processPinePayment').disabled = !state.pineOrderCreated || state.paymentProcessed;
    $('#processPinePayment').textContent = state.paymentProcessed ? 'Payment processed' : 'Return PROCESSED response';
    $('#paymentStateTitle').textContent = state.paymentProcessed ? 'Payment processed' : state.pineOrderCreated ? 'Order ready for UPI' : 'Waiting for order';
    $('#pineStepOne').classList.toggle('done', state.pineOrderCreated);
    $('#pineStepTwo').classList.toggle('current', state.pineOrderCreated && !state.paymentProcessed);
    $('#pineStepTwo').classList.toggle('done', state.paymentProcessed);
    $('#pineStepThree').classList.toggle('current', state.paymentProcessed);
    $('#pineStepThree').classList.toggle('done', state.paymentProcessed);
    $('#pineResponse').textContent = state.paymentProcessed ? JSON.stringify({ order_id: 'PL-1048-680', merchant_order_reference: 'SM-1048', sub_merchant_id: 'SHK-VAISHALI-01', status: 'PROCESSED', payment_amount: { value: 68000, currency: 'INR' }, payment_method: 'UPI', transaction_id: 'PLTXN-680-1048', simulation: true }, null, 2) : state.pineOrderCreated ? JSON.stringify({ order_id: 'PL-1048-680', merchant_order_reference: 'SM-1048', sub_merchant_id: 'SHK-VAISHALI-01', amount: { value: 68000, currency: 'INR' }, status: 'CREATED', simulation: true }, null, 2) : 'No response yet.';
  }

  function renderDelivery() {
    $('#createShipment').disabled = !state.paymentProcessed || state.shipmentCreated;
    $('#createShipment').textContent = state.shipmentCreated ? 'Shipment response ingested' : 'Return Delhivery shipment response';
    $('#shipmentStatus').textContent = state.trackingIndex >= 4 ? 'Delivered · awaiting confirmation' : state.shipmentCreated ? TRACKING[Math.max(0, state.trackingIndex)].label : 'Not created';
    $('#shipmentStatus').classList.toggle('open', state.shipmentCreated && !state.closed);
    $('#deliveryPaymentCheck').textContent = state.paymentProcessed ? 'PROCESSED · PLTXN-680-1048' : 'Waiting for Pine Labs';
    $('#awbNumber').textContent = state.shipmentCreated ? 'AWB 784512309876' : 'AWB PENDING';
    $('#advanceTracking').disabled = !state.shipmentCreated || state.trackingIndex >= TRACKING.length - 1;
    $('#advanceTracking').textContent = state.trackingIndex >= TRACKING.length - 1 ? 'Delivered event returned' : 'Return next tracking event';
    $('#trackingLine').innerHTML = TRACKING.map((step, index) => `<div class="track-step ${index <= state.trackingIndex ? 'done' : ''}"><b>${esc(step.label)}</b><span>${esc(step.detail)}</span></div>`).join('');
    $('#deliveryWarning').classList.toggle('hidden', state.trackingIndex < 4 || state.householdConfirmed);
    $('#receiptChat').classList.toggle('hidden', !state.householdConfirmed);
  }

  function renderHandover() {
    $('#simulateHandover').textContent = state.handover ? 'Return ownership to Meera' : 'Simulate 24-hour handover';
    const dose = state.prescriptionVerified ? 'Atorvastatin 20 mg nightly' : 'Atorvastatin 10 mg nightly';
    $('#handoverPacket').innerHTML = state.handover ? '<ul><li>Task CHK-RM-1048 remains ' + (state.closed ? 'closed; December follow-up open' : 'open') + '</li><li>Current verified medicine: ' + dose + '</li><li>Doctor record: Dr Kavita Sharma, 12 Jun baseline and 4 Oct visit</li><li>Payment authority remains with Meera</li><li>Arjun may monitor delivery and confirm receipt</li></ul>' : '<p>No active handover. Meera owns task CHK-RM-1048. Doctor records remain attached to the family care file.</p>';
    $('#doctorRecordStatus').textContent = state.prescriptionVerified ? 'Updated prescription verified' : 'Earlier prescription confirmed';
    $('#doctorRecordStatus').classList.toggle('closed', state.prescriptionVerified);
    $('#doctorRecordDose').textContent = state.prescriptionVerified ? 'Atorvastatin 20 mg · one tablet nightly' : 'Visit completed; new instructions unverified';
    $('#doctorRecordCopy').textContent = state.prescriptionVerified ? 'The updated prescription is linked to the earlier 10 mg record without overwriting it.' : 'Rajan’s report and the updated prescription must be reconciled before the dose changes.';
    $('#doctorRecordFollowup').textContent = state.prescriptionVerified ? 'Repeat test · 4 December 2026' : 'Pending prescription verification';
  }

  function renderPermissions() {
    const limits = state.spendLimits;
    const format = value => '₹' + Number(value).toLocaleString('en-IN');
    $('#routineLimit').value = limits.routine;
    $('#insulinLimit').value = limits.insulin;
    $('#urgentLimit').value = limits.urgent;
    $('#routineLimitOutput').textContent = format(limits.routine);
    $('#insulinLimitOutput').textContent = format(limits.insulin);
    $('#urgentLimitOutput').textContent = format(limits.urgent);
    $('#scopeRoutineLimit').textContent = format(limits.routine) + ' per order';
    $('#activeLimit').textContent = format(limits.routine);
    const names = { auto: 'Move to Ask', ask: 'Move to Never', never: 'Move to Allow' };
    const containers = { auto: $('#policyAuto'), ask: $('#policyAsk'), never: $('#policyNever') };
    Object.values(containers).forEach(container => { container.innerHTML = ''; });
    POLICY_ACTIONS.forEach(action => {
      const status = state.policies[action.id] || 'ask';
      const card = document.createElement('div');
      card.className = 'policy-action';
      card.draggable = true;
      card.dataset.policyId = action.id;
      card.innerHTML = '<span>' + esc(action.label) + '</span><button type="button" data-policy-move="' + esc(action.id) + '">' + names[status] + '</button>';
      containers[status].appendChild(card);
    });
  }

  function renderEvidence() {
    $('#evidenceCount').textContent = state.evidence.length;
    $('#liveCount').textContent = state.evidence.filter(e => e.mode === 'live').length;
    $('#wizardCount').textContent = state.evidence.filter(e => e.mode === 'wizard').length;
    $('#closureGate').textContent = state.closed ? 'Satisfied' : state.trackingIndex >= 4 ? 'Awaiting household' : 'Open';
    $('#evidenceRows').innerHTML = state.evidence.map(item => `<tr><td>${esc(new Date(item.at).toLocaleString(IST, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }))}</td><td>${esc(item.title)}</td><td>${esc(item.source)}</td><td><span class="mode-chip ${item.mode}">${esc(item.mode)}</span></td><td>${esc(item.rule || 'Recorded evidence; no autonomous action taken.')}</td><td>${esc(item.message || 'No outbound message.')}</td><td>${esc(item.confidence)}</td><td>${esc(item.stateAfter)}</td></tr>`).join('');
    $('#evidenceEmpty').classList.toggle('hidden', state.evidence.length > 0);
    $('.evidence-table-wrap').classList.toggle('hidden', state.evidence.length === 0);
  }

  function renderAll() {
    saveState();
    renderHome(); renderTimeline(); renderProgress(); renderActiveStage(); renderVoice(); renderApproval(); renderPayment(); renderDelivery(); renderHandover(); renderPermissions(); renderEvidence();
  }

  async function askAgent(eventSummary, expectedAction) {
    const schema = { type: 'object', properties: { title: { type: 'string' }, action: { type: 'string', enum: [expectedAction] }, reason: { type: 'string' }, rule_followed: { type: 'string' }, message_sent: { type: 'string' }, recipient: { type: 'string' }, minimum_data: { type: 'array', items: { type: 'string' } } }, required: ['title', 'action', 'reason', 'rule_followed', 'message_sent', 'recipient', 'minimum_data'] };
    const payload = { model: state.model, store: false, system_instruction: AGENT_SYSTEM_PROMPT, input: `Task ${TASK_ID}. Current state: ${currentTaskState()}. New evidence: ${eventSummary}. Permissible action: ${expectedAction}.`, generation_config: { temperature: 0, thinking_level: 'low' }, response_format: { type: 'text', mime_type: 'application/json', schema } };
    try {
      const res = await fetch('/api/agent-decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: state.model, payload }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
      let text = (body?.steps || []).filter(step => step.type === 'model_output').flatMap(step => step.content || []).filter(part => part.type === 'text').map(part => part.text || '').join('').replace(/^```json\s*|\s*```$/g, '').trim();
      const decision = JSON.parse(text);
      state.decisions.push({ at: now(), model: state.model, ...decision });
      addEvidence({ id: `decision-${expectedAction}-${state.decisions.length}`, title: `Chikitsak chose ${expectedAction}`, source: state.model, mode: 'live', rule: decision.rule_followed, message: decision.message_sent, confidence: 'Policy-gated', stateAfter: currentTaskState() });
      saveState();
      return decision;
    } catch (error) {
      const fallback = { title: expectedAction.replaceAll('_', ' '), action: expectedAction, reason: 'The deterministic safety policy allows only this next action.', rule_followed: 'Only the supplied permissible action may execute after its evidence gate passes.', message_sent: `Proceed with ${expectedAction} for ${TASK_ID}; disclose only the task minimum.`, recipient: 'Chikitsak workflow', minimum_data: [] };
      state.decisions.push({ at: now(), model: 'Deterministic fallback', ...fallback });
      saveState();
      toast('Safe next action recorded; model explanation was unavailable');
      return fallback;
    }
  }

  async function runVoicePipeline(scripted = false) {
    if (busy) return;
    const file = $('#voiceFile').files[0];
    if (!scripted && !file) { toast('Choose Rajan’s voice note first'); return; }
    if (file && file.size > 12 * 1024 * 1024) { toast('Audio must be 12 MB or smaller'); return; }
    busy = true;
    $('#runVoice').disabled = true;
    const status = $('#voicePipelineStatus');
    status.dataset.running = '1';
    const setStatus = (items) => { status.innerHTML = items.map(x => `<div class="pipeline-item ${x.state || ''}"><i></i><span>${esc(x.label)}</span><small>${esc(x.detail || '')}</small></div>`).join(''); };
    try {
      if (!state.requestReceived) {
        state.requestReceived = true;
        addEvidence({ id: 'whatsapp-origin', title: 'WhatsApp voice note and prescription received', source: 'Rajan Mehta · WhatsApp', mode: 'offsite', confidence: 'Source recorded', stateAfter: 'REQUEST_RECEIVED' });
      }
      if (scripted) {
        setStatus([{ label: 'Hindi detected', detail: 'Scripted fallback', state: 'done' }, { label: 'Transcript preserved', detail: 'Wizard evidence', state: 'done' }, { label: 'English event created', detail: 'Uncertainty retained', state: 'done' }]);
        state.voiceNormalized = true; state.voiceMode = 'wizard'; state.voice = { language: 'Hindi · hi-IN', transcript: SCRIPTED_HINDI, english: SCRIPTED_ENGLISH };
        addEvidence({ id: 'voice-scripted', title: 'Hindi request normalised to English', source: 'Scripted Gnani/Gemini fallback', mode: 'wizard', confidence: 'Scenario evidence', stateAfter: 'AWAITING_PRESCRIPTION_VERIFICATION' });
      } else {
        setStatus([{ label: 'Detecting spoken language', detail: state.model }, { label: 'Gnani transcript', detail: 'Waiting' }, { label: 'English event', detail: 'Waiting' }]);
        const detectForm = new FormData(); detectForm.append('audio_file', file, file.name); detectForm.append('model', state.model);
        const detectRes = await fetch('/api/detect-language', { method: 'POST', body: detectForm }); const detected = await detectRes.json();
        if (!detectRes.ok || !detected.success) throw new Error(detected?.error?.message || `Language detection failed (${detectRes.status})`);
        setStatus([{ label: 'Language detected', detail: `${detected.detected_language.language_name} · ${detected.detected_language.language_code}`, state: 'done' }, { label: 'Calling Gnani', detail: 'api.vachana.ai/stt/v3' }, { label: 'English event', detail: 'Waiting' }]);
        const gnaniForm = new FormData(); gnaniForm.append('audio_file', file, file.name); gnaniForm.append('language_code', detected.detected_language.language_code);
        const gnaniRes = await fetch('/api/gnani-transcribe', { method: 'POST', body: gnaniForm }); const gnani = await gnaniRes.json();
        if (!gnaniRes.ok || !gnani.success) throw new Error(gnani?.error?.message || `Gnani transcription failed (${gnaniRes.status})`);
        setStatus([{ label: 'Language detected', detail: detected.detected_language.language_code, state: 'done' }, { label: 'Gnani transcript preserved', detail: 'Raw response saved', state: 'done' }, { label: 'Translating faithfully', detail: state.model }]);
        const translateRes = await fetch('/api/translate-transcript', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: state.model, transcript: gnani.transcript, language_name: detected.detected_language.language_name, language_code: detected.detected_language.language_code }) }); const translated = await translateRes.json();
        if (!translateRes.ok || !translated.success) throw new Error(translated?.error?.message || `Translation failed (${translateRes.status})`);
        state.voiceNormalized = true; state.voiceMode = 'live'; state.voice = { language: `${detected.detected_language.language_name} · ${detected.detected_language.language_code}`, transcript: gnani.transcript, english: translated.english_text, raw: gnani.raw };
        addEvidence({ id: 'language-live', title: `Language detected: ${detected.detected_language.language_name}`, source: state.model, mode: 'live', confidence: 'API response', stateAfter: 'REQUEST_RECEIVED' });
        addEvidence({ id: 'gnani-live', title: 'Gnani transcript preserved', source: 'Gnani STT v3', mode: 'live', confidence: 'Raw response retained', stateAfter: 'REQUEST_RECEIVED' });
        addEvidence({ id: 'translation-live', title: 'English event created with uncertainty intact', source: state.model, mode: 'live', confidence: 'Faithful translation', stateAfter: 'AWAITING_PRESCRIPTION_VERIFICATION' });
        setStatus([{ label: 'Language detected', detail: state.voice.language, state: 'done' }, { label: 'Gnani transcript preserved', detail: 'Live API', state: 'done' }, { label: 'English event created', detail: 'Complete', state: 'done' }]);
      }
      await askAgent('Rajan reports an ambiguous dose change; a prescription image exists but has not been verified.', 'VERIFY_PRESCRIPTION');
      toast('Voice request processed safely');
    } catch (error) {
      setStatus([{ label: 'Live pipeline stopped', detail: error.message, state: 'error' }, { label: 'Scripted fallback remains available', detail: 'No evidence was fabricated' }]);
      toast(error.message);
    } finally {
      busy = false; $('#runVoice').disabled = false; delete status.dataset.running; renderAll();
    }
  }

  async function recordOrigin() {
    if (state.requestReceived) { toast('WhatsApp origin already recorded'); return; }
    state.requestReceived = true;
    addEvidence({ id: 'whatsapp-origin', title: 'WhatsApp voice note and prescription received', source: 'Rajan Mehta · WhatsApp', mode: 'offsite', confidence: 'Source recorded', stateAfter: 'REQUEST_RECEIVED' });
    renderAll(); go('communications'); toast('Origin recorded');
  }

  async function verifyPrescription() {
    if (!state.voiceNormalized) { toast('Process the voice note first'); return; }
    if (state.prescriptionVerified) return;
    state.prescriptionVerified = true;
    addEvidence({ id: 'prescription', title: 'Prescription confirms Atorvastatin 20 mg nightly', source: 'Synthetic prescription · 4 Oct 2026', mode: 'wizard', rule: 'A verified prescription—not patient recollection—may establish the new dose.', message: 'No external message; the document was returned to Chikitsak.', confidence: 'Document verified', stateAfter: 'AWAITING_PHARMACY_VERIFICATION' });
    await askAgent('The prescription confirms Atorvastatin 20 mg, one tablet nightly, quantity 30. Stock and price are unknown.', 'CALL_GNANI_PROVIDER');
    renderAll(); toast('Prescription verified; pharmacy call is next');
  }

  async function returnPharmacyCall() {
    if (!state.prescriptionVerified) { toast('Verify the prescription before calling the pharmacy'); return; }
    if (state.pharmacyVerified) { toast('Pharmacy response already recorded'); return; }
    state.pharmacyVerified = true;
    addEvidence({ id: 'pharmacy-call', title: 'Scripted pharmacy return: stock, ₹680 price and reservation SM-1048', source: 'Gnani demo scenario · request 01a107a8…384e', mode: 'wizard', rule: 'Verify exact medicine, quantity and final price before any payment decision.', message: 'क्या एटोरॉस्टिन 20 मिलीग्राम की 30 टैबलेट उपलब्ध है? अंतिम देय राशि क्या होगी? एक पैक राजन मेहता के नाम पर रिज़र्व करें।', confidence: 'Simulated scenario evidence', stateAfter: 'AWAITING_CAREGIVER_APPROVAL' });
    await askAgent('Shekhawat confirms the prescribed 20 mg pack, quantity 30, at ₹680. The current routine-medicine limit is ₹' + state.spendLimits.routine + '.', 'ASK_CAREGIVER_APPROVAL');
    renderAll(); go('approvals'); toast('Pharmacy response returned; Meera must approve');
  }

  async function approveOnce() {
    if (!state.pharmacyVerified) { toast('The pharmacy must verify stock and price first'); return; }
    const excess = Math.max(0, 680 - state.spendLimits.routine);
    if (excess && !$('#approvalEvidence').checked) { toast('First confirm that Meera’s off-site message was shown'); return; }
    state.approval = 'approved';
    if (excess) {
      addEvidence({ id: 'meera-approval', title: 'Meera approves ₹680 for this refill only', source: 'Meera Mehta · WhatsApp relay', mode: 'offsite', rule: 'A one-time approval must match the task, provider and amount.', message: 'Approve ₹680 for task CHK-RM-1048 to Shekhawat Medical Store only.', confidence: 'Authorised caregiver', stateAfter: 'APPROVED' });
      await askAgent('Meera approved ₹680 for task CHK-RM-1048 only. The permanent limit remains ₹' + state.spendLimits.routine + '.', 'CALL_PINE');
    } else {
      addEvidence({ id: 'standing-mandate-approval', title: '₹680 refill authorised inside the routine-medicine limit', source: 'Family permissions · standing mandate', mode: 'live', confidence: 'Policy matched', stateAfter: 'APPROVED' });
      await askAgent('The ₹680 order is inside the ₹' + state.spendLimits.routine + ' routine-medicine limit and all clinical verification gates are satisfied.', 'CALL_PINE');
    }
    renderAll(); go('payment'); toast(excess ? 'One-time approval recorded' : 'Standing mandate authorised the order');
  }

  function declineApproval() {
    if (state.approval === 'approved') return;
    state.approval = 'declined';
    addEvidence({ id: `declined-${Date.now()}`, title: 'Meera declines the ₹680 exception', source: 'Meera Mehta', mode: 'offsite', confidence: 'Authorised caregiver', stateAfter: 'PAUSED' });
    renderAll(); toast('Task paused; no payment was created');
  }

  function createPineOrder() {
    if (state.approval !== 'approved') { toast('Meera’s approval is required'); return; }
    if (state.pineOrderCreated) return;
    state.pineOrderCreated = true;
    addEvidence({ id: 'pine-order', title: 'Pine Labs order PL-1048-680 created', source: 'Pine Labs documentation-faithful response', mode: 'wizard', rule: 'CALL_PINE was selected only after task-specific approval.', message: 'Create ₹680 order for SM-1048, sub-merchant SHK-VAISHALI-01, task CHK-RM-1048.', confidence: 'Simulated API response', stateAfter: 'PAYMENT_ORDER_CREATED' });
    renderAll(); toast('Payment order created');
  }

  async function processPinePayment() {
    if (!state.pineOrderCreated) { toast('Create the payment order first'); return; }
    if (state.paymentProcessed) return;
    state.paymentProcessed = true;
    addEvidence({ id: 'pine-payment', title: '₹680 UPI payment returns PROCESSED', source: 'Pine Labs documentation-faithful response', mode: 'wizard', rule: 'Only a server-side PROCESSED response may unlock logistics.', message: 'Payment PLTXN-680-1048 confirmed for ₹680 to SHK-VAISHALI-01.', confidence: 'Simulated server response', stateAfter: 'PAID' });
    await askAgent('Pine Labs order PL-1048-680 returned PROCESSED for ₹680 to sub-merchant SHK-VAISHALI-01.', 'CALL_DELHIVERY');
    renderAll(); go('delivery'); toast('Payment processed; shipment is now permitted');
  }

  function createShipment() {
    if (!state.paymentProcessed) { toast('Payment must be processed before dispatch'); return; }
    if (state.shipmentCreated) return;
    state.shipmentCreated = true; state.trackingIndex = 0;
    addEvidence({ id: 'shipment', title: 'Delhivery shipment and AWB created', source: 'Delhivery documentation-faithful response', mode: 'wizard', rule: 'A paid task may create a minimum-data shipment from the registered pickup.', message: 'Pickup: 18 Queens Road, Vaishali Nagar 302021. Deliver: 142 Sector 4, Malviya Nagar 302017. Contents: sealed medicine pack.', confidence: 'Simulated API response', stateAfter: 'IN_DELIVERY' });
    renderAll(); toast('Shipment created; print the simulation label');
  }

  async function advanceTracking() {
    if (!state.shipmentCreated) { toast('Create the shipment first'); return; }
    if (state.trackingIndex >= TRACKING.length - 1) return;
    state.trackingIndex += 1;
    const event = TRACKING[state.trackingIndex];
    addEvidence({ id: `tracking-${event.key}`, title: `Delhivery: ${event.label}`, source: 'Delhivery tracking Wizard', mode: state.trackingIndex === 2 ? 'offsite' : 'wizard', confidence: 'Simulated tracking event', stateAfter: state.trackingIndex >= 4 ? 'DELIVERED_AWAITING_CONFIRMATION' : 'IN_DELIVERY' });
    if (state.trackingIndex >= 4) await askAgent('Delhivery reports DELIVERED, but no household member has confirmed the contents.', 'WAIT_FOR_HOUSEHOLD_CONFIRMATION');
    renderAll(); toast(state.trackingIndex >= 4 ? 'Delivered—but the care loop remains open' : event.label);
  }

  async function confirmReceipt() {
    if (state.trackingIndex < 4) { toast('Household confirmation follows the delivered event'); return; }
    if (state.householdConfirmed) return;
    state.householdConfirmed = true;
    addEvidence({ id: 'household-receipt', title: 'Rajan confirms sealed pack, 20 mg strength and 30 tablets', source: 'Rajan Mehta · WhatsApp relay', mode: 'offsite', rule: 'Courier delivery alone cannot close a medicine task.', message: 'दवाई मिल गई। पैकेट सील था और 20 mg की 30 गोलियाँ हैं।', confidence: 'Household confirmation', stateAfter: 'RECEIPT_CONFIRMED' });
    await askAgent('Rajan confirms that the sealed pack contains 30 Atorvastatin 20 mg tablets.', 'CLOSE_TASK');
    renderAll(); go('refill'); toast('Receipt confirmed; closure is now permitted');
  }

  function closeTask() {
    if (!state.householdConfirmed) { toast('Household confirmation is required'); return; }
    if (state.closed) return;
    state.closed = true;
    addEvidence({ id: 'closure', title: 'Refill closed with complete evidence chain', source: 'Chikitsak policy engine', mode: 'live', rule: 'Close only after prescription, provider, payment, delivery and household evidence all match.', message: 'Task CHK-RM-1048 closed; repeat test follow-up remains open for 4 December.', confidence: 'All closure gates satisfied', stateAfter: 'CLOSED' });
    addEvidence({ id: 'followup', title: 'Two-month test follow-up remains open', source: 'Verified prescription', mode: 'wizard', confidence: 'Scheduled obligation', stateAfter: 'CLOSED_REFILL_OPEN_FOLLOWUP' });
    renderAll(); go('evidence'); toast('Care loop closed correctly');
  }

  function toggleHandover() {
    state.handover = !state.handover;
    addEvidence({ id: `handover-${Date.now()}`, title: state.handover ? 'Task visibility handed to Arjun for 24 hours' : 'Primary ownership returned to Meera', source: 'Family handover control', mode: 'offsite', confidence: 'Simulation', stateAfter: currentTaskState() });
    renderAll(); toast(state.handover ? 'Minimum-data handover created' : 'Ownership returned to Meera');
  }

  function setPolicyStatus(id, status) {
    const action = POLICY_ACTIONS.find(item => item.id === id);
    if (!action || !['auto', 'ask', 'never'].includes(status)) return;
    state.policies[id] = status;
    addEvidence({ id: 'permission-' + id + '-' + Date.now(), title: 'Permission updated: ' + action.label, source: 'Meera Mehta · family permissions', mode: 'live', confidence: 'Caregiver authorised', stateAfter: 'POLICY_' + status.toUpperCase() });
    renderAll();
    toast('Permission moved to ' + (status === 'auto' ? 'Allow automatically' : status === 'ask' ? 'Ask first' : 'Never'));
  }

  function cyclePolicy(id) {
    const order = ['auto', 'ask', 'never'];
    const current = state.policies[id] || 'ask';
    setPolicyStatus(id, order[(order.indexOf(current) + 1) % order.length]);
  }

  function resetPermissions() {
    state.spendLimits = structuredClone(DEFAULT_STATE.spendLimits);
    state.policies = structuredClone(DEFAULT_STATE.policies);
    addEvidence({ id: 'permissions-reset-' + Date.now(), title: 'Family permissions restored to defaults', source: 'Meera Mehta · family permissions', mode: 'live', confidence: 'Caregiver authorised', stateAfter: currentTaskState() });
    renderAll();
    toast('Default permissions restored');
  }

  function exportEvidence() {
    const bundle = { simulation: 'Chikitsak end-to-end care loop', task_id: TASK_ID, exported_at: now(), scenario: { patient: 'Rajan Mehta, 73, Jaipur', caregiver: 'Meera Mehta, Bengaluru', doctor: 'Dr Kavita Sharma', baseline_medicine: 'Atorvastatin 10 mg nightly', verified_change: state.prescriptionVerified ? 'Atorvastatin 20 mg nightly, 30 tablets' : 'Not yet verified', stable_medicines: ['Amlodipine 5 mg every morning', 'Insulin glargine 100 IU/ml'], pharmacy: 'Shekhawat Medical Store · Vaishali Nagar', amount_inr: 680 }, agent: { model: state.model, system_prompt: AGENT_SYSTEM_PROMPT }, permissions: { spend_limits: state.spendLimits, actions: state.policies }, state: currentTaskState(), evidence: state.evidence, decisions: state.decisions, prototype_boundary: { whatsapp: 'off-site manual relay', gnani_stt: 'scripted fallback', gnani_outbound: 'scripted demo recording and transcript', pine_labs: 'documentation-faithful Wizard return', delhivery: 'documentation-faithful Wizard return' } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'chikitsak-rajan-care-loop-evidence.json'; a.click(); URL.revokeObjectURL(url);
  }

  function evidenceSummary() {
    return [`# Chikitsak evidence — ${TASK_ID}`, `State: ${currentTaskState()}`, `Model: ${state.model}`, '', ...state.evidence.map((e, i) => `${i + 1}. ${e.title}\n   Source: ${e.source}\n   Rule: ${e.rule || 'Recorded evidence; no autonomous action taken.'}\n   Message: ${e.message || 'No outbound message.'}\n   Mode: ${e.mode}; Confidence: ${e.confidence}\n   State after: ${e.stateAfter}`)].join('\n');
  }

  function resetDemo() {
    if (!confirm('Reset the complete Rajan–Meera simulation? This removes the local evidence log.')) return;
    state = structuredClone(DEFAULT_STATE); localStorage.removeItem(STORAGE_KEY); $('#approvalEvidence').checked = false; $('#voiceFile').value = ''; renderAll(); go('home'); toast('Simulation reset');
  }

  document.addEventListener('click', async event => {
    const goButton = event.target.closest('[data-go]'); if (goButton) { go(goButton.dataset.go); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    const policyMove = event.target.closest('[data-policy-move]')?.dataset.policyMove;
    if (policyMove) { cyclePolicy(policyMove); return; }
    if (action === 'record-origin') await recordOrigin();
    if (action === 'go-communications') go('communications');
    if (action === 'verify-prescription') await verifyPrescription();
    if (action === 'go-pharmacy') go('communications');
    if (action === 'go-approvals') go('approvals');
    if (action === 'go-payment') go('payment');
    if (action === 'go-delivery') go('delivery');
    if (action === 'confirm-receipt') await confirmReceipt();
    if (action === 'close-task') closeTask();
  });

  document.addEventListener('dragstart', event => {
    const card = event.target.closest('[data-policy-id]');
    if (!card) return;
    draggedPolicyId = card.dataset.policyId;
    card.classList.add('dragging');
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragend', event => {
    event.target.closest('[data-policy-id]')?.classList.remove('dragging');
    draggedPolicyId = null;
    $$('.policy-column').forEach(column => column.classList.remove('drag-over'));
  });
  $$('.policy-column').forEach(column => {
    column.addEventListener('dragover', event => { event.preventDefault(); column.classList.add('drag-over'); });
    column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
    column.addEventListener('drop', event => {
      event.preventDefault();
      column.classList.remove('drag-over');
      if (draggedPolicyId) setPolicyStatus(draggedPolicyId, column.dataset.policyStatus);
    });
  });

  window.addEventListener('hashchange', renderRoute);
  $('#pageFlowPrev').addEventListener('click', event => { const target = event.currentTarget.dataset.routeTarget; if (target) go(target); });
  $('#pageFlowNext').addEventListener('click', event => { const target = event.currentTarget.dataset.routeTarget; if (target) go(target); });
  $('#resetDemo').addEventListener('click', resetDemo);
  $('#geminiModel').addEventListener('change', event => { state.model = event.target.value; saveState(); toast(`${event.target.options[event.target.selectedIndex].text} selected`); });
  $('#runVoice').addEventListener('click', () => runVoicePipeline(false)); $('#useScriptedVoice').addEventListener('click', () => runVoicePipeline(true));
  $('#gnaniScript').textContent = PHARMACY_SCRIPT; $('#returnPharmacyCall').addEventListener('click', returnPharmacyCall);
  $('#approveOnce').addEventListener('click', approveOnce); $('#declineApproval').addEventListener('click', declineApproval);
  $('#createPineOrder').addEventListener('click', createPineOrder); $('#processPinePayment').addEventListener('click', processPinePayment);
  $('#createShipment').addEventListener('click', createShipment); $('#advanceTracking').addEventListener('click', advanceTracking); $('#printLabel').addEventListener('click', () => window.print());
  $('#simulateHandover').addEventListener('click', toggleHandover); $('#exportEvidence').addEventListener('click', exportEvidence); $('#copyEvidence').addEventListener('click', () => copyText(evidenceSummary()));
  $('#resetPermissions').addEventListener('click', resetPermissions);
  [['routineLimit', 'routine'], ['insulinLimit', 'insulin'], ['urgentLimit', 'urgent']].forEach(([inputId, key]) => {
    $('#' + inputId).addEventListener('input', event => {
      state.spendLimits[key] = Number(event.target.value);
      saveState();
      renderPermissions();
      if (key === 'routine') renderApproval();
    });
    $('#' + inputId).addEventListener('change', event => {
      addEvidence({ id: 'limit-' + key + '-' + Date.now(), title: key.charAt(0).toUpperCase() + key.slice(1) + ' medicine limit set to ₹' + Number(event.target.value).toLocaleString('en-IN'), source: 'Meera Mehta · family permissions', mode: 'live', confidence: 'Caregiver authorised', stateAfter: currentTaskState() });
      renderAll();
    });
  });
  $('.voice-message button').addEventListener('click', () => toast('Play Rajan’s actual WhatsApp voice note off-site, then upload it here'));

  renderRoute(); renderAll();
})();
