// ============ STATE & DATA ============
let lang = 'ka';
let chatOpen = false;
let unreadCount = 0;
let chatHistory = [];
let pendingBotMsgs = [];
let currentCalc = {};

const banks = [
  { name: 'TBC ბანკი', nameEn: 'TBC Bank', short: 'T', color: '#1A5276', min: 15, max: 22 },
  { name: 'საქართველოს ბანკი', nameEn: 'Bank of Georgia', short: 'ს', color: '#E67E22', min: 16, max: 24 },
  { name: 'ბაზისბანკი', nameEn: 'Basisbank', short: 'ბ', color: '#8B5CF6', min: 17, max: 25 },
  { name: 'ლიბერთი ბანკი', nameEn: 'Liberty Bank', short: 'ლ', color: '#EF4444', min: 18, max: 26 },
  { name: 'კრედო ბანკი', nameEn: 'Credo Bank', short: 'კ', color: '#10B981', min: 19, max: 28 }
];

const rates = { GEL: 1, USD: 2.72, EUR: 2.98, GBP: 3.44, RUB: 0.030, TRY: 0.079 };

const cats = [
  { name: 'საცხოვრებელი', nameEn: 'Housing', emoji: '🏠', color: '#3B82F6', pct: 0.30 },
  { name: 'საკვები', nameEn: 'Food', emoji: '🛒', color: '#F97316', pct: 0.15 },
  { name: 'ტრანსპორტი', nameEn: 'Transport', emoji: '🚗', color: '#8B5CF6', pct: 0.10 },
  { name: 'ჯანმრთელობა', nameEn: 'Health', emoji: '❤️', color: '#EF4444', pct: 0.10 },
  { name: 'გართობა', nameEn: 'Entertainment', emoji: '🎉', color: '#EC4899', pct: 0.15 },
  { name: 'დანაზოგი', nameEn: 'Savings', emoji: '🐷', color: '#10B981', pct: 0.20 }
];

// ============ INTERFACE UTILITIES ============
function toggleLang() {
  lang = lang === 'ka' ? 'en' : 'ka';
  document.getElementById('langBtn').textContent = lang === 'ka' ? 'EN' : 'KA';
  document.querySelectorAll('[data-ka]').forEach(el => {
    el.textContent = lang === 'ka' ? el.dataset.ka : (el.dataset.en || el.dataset.ka);
  });
}

function switchTab(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
}

function updateAmount(v) { document.getElementById('amountVal').textContent = '₾' + parseInt(v).toLocaleString(); }
function updateTerm(v) { document.getElementById('termVal').textContent = v; }

// ============ MATH CALCULATIONS ============
function calculate() {
  const amount = parseFloat(document.getElementById('amountSlider').value);
  const term = parseInt(document.getElementById('termSlider').value);
  const loanType = document.getElementById('loanType').value;
  currentCalc = { amount, term, loanType };

  const results = banks.map(b => {
    const midRate = (b.min + b.max) / 2 / 100 / 12;
    const payment = amount * midRate * Math.pow(1 + midRate, term) / (Math.pow(1 + midRate, term) - 1);
    const total = payment * term;
    return { ...b, payment: Math.round(payment * 100) / 100, total: Math.round(total * 100) / 100 };
  }).sort((a, b) => a.payment - b.payment);

  const list = document.getElementById('bankList');
  list.innerHTML = '';
  results.forEach((b, i) => {
    const row = document.createElement('div');
    row.className = 'bank-row' + (i === 0 ? ' best' : '');
    row.innerHTML = `
      <div class="bank-avatar" style="background:${b.color}">${b.short}</div>
      <div class="bank-middle">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="bank-info-name">${lang === 'ka' ? b.name : b.nameEn}</span>
          ${i === 0 ? '<span class="bank-best-badge">' + (lang === 'ka' ? 'საუკეთესო' : 'Best') + '</span>' : ''}
        </div>
        <span class="bank-info-rate">${b.min}%–${b.max}%</span>
      </div>
      <div class="bank-stats">
        <div class="bank-stat-label">${lang === 'ka' ? 'ყოველთვიური' : 'Monthly'}</div>
        <div class="bank-stat-val">₾${b.payment.toLocaleString('ka-GE', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        <div class="bank-stat-label" style="margin-top:4px">${lang === 'ka' ? 'ჯამი' : 'Total'}</div>
        <div class="bank-stat-val" style="font-size:12px;color:var(--text3)">₾${b.total.toLocaleString('ka-GE', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      </div>`;
    list.appendChild(row);
  });

  document.getElementById('resultsLabel').textContent = `${amount.toLocaleString()} ₾ · ${term} თვე`;
  document.getElementById('resultsSection').classList.remove('hidden');

  const best = results[0];
  const msg = lang === 'ka'
    ? `შედარება დასრულდა! 📊\n\n✅ საუკეთესო ვარიანტი: ${best.name}\n💰 ყოველთვიური გადახდა: ₾${best.payment.toFixed(2)}\n📅 ვადა: ${term} თვე\n\nგსურს დაგაკავშირო ბანკთან?`
    : `Comparison complete! 📊\n\n✅ Best option: ${best.nameEn}\n💰 Monthly payment: ₾${best.payment.toFixed(2)}`;
  queueBotMsg(msg);
}

function submitLead() {
  const name = document.getElementById('leadName').value.trim();
  if (!name) return;
  showToast(lang === 'ka' ? 'მადლობა! მოთხოვნა გაგზავნილია.' : 'Thank you!');
}

function calcSavings() {
  const goal = parseFloat(document.getElementById('saveGoal').value) || 10000;
  const mo = parseFloat(document.getElementById('saveMo').value) || 500;
  const rate = parseFloat(document.getElementById('saveRateSlider').value) / 100 / 12;
  let bal = 0, months = 0;
  while (bal < goal && months < 600) { bal = bal * (1 + rate) + mo; months++; }
  document.getElementById('saveMonths').textContent = months;
  document.getElementById('saveTotal').textContent = '₾' + Math.round(bal).toLocaleString();
}

// Simple layout update triggers for elements in your HTML
function calcBudget() {
  const inc = parseFloat(document.getElementById('income').value) || 3000;
  document.getElementById('bNeeds').textContent = '₾' + Math.round(inc * 0.5).toLocaleString();
  document.getElementById('bWants').textContent = '₾' + Math.round(inc * 0.3).toLocaleString();
  document.getElementById('bSavings').textContent = '₾' + Math.round(inc * 0.2).toLocaleString();
}

function convertCurrency() {
  const amt = parseFloat(document.getElementById('curAmount').value) || 0;
  const from = document.getElementById('curFrom').value;
  const to = document.getElementById('curTo').value;
  const res = (amt * rates[from] / rates[to]).toFixed(2);
  document.getElementById('curResultMain').textContent = `${amt} ${from} = ${res} ${to}`;
}

function swapCurrency() {
  const f = document.getElementById('curFrom'), t = document.getElementById('curTo');
  const tmp = f.value; f.value = t.value; t.value = tmp;
  convertCurrency();
}

function getAdvice() {
  const income = parseFloat(document.getElementById('advIncome').value) || 2000;
  const advMsg = `შენი შემოსავალია ₾${income}. მზად ხარ ბიუჯეტის ოპტიმიზაციისთვის?`;
  queueBotMsg(advMsg);
}

// ============ CHAT INTERACTION ============
function queueBotMsg(msg) {
  if (chatOpen) addBotMsg(msg);
  else { pendingBotMsgs.push(msg); unreadCount++; updateBadge(); }
}

function updateBadge() {
  const b = document.getElementById('chatBadge');
  if (unreadCount > 0) { b.textContent = unreadCount; b.classList.remove('hidden'); }
  else b.classList.add('hidden');
}

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  if (chatOpen) {
    panel.classList.remove('hidden'); unreadCount = 0; updateBadge();
    if (document.getElementById('chatMsgs').children.length === 0) {
      addBotMsg('გამარჯობა! მე ვარ ფინო — შენი ფინანსური ასისტენტი. 😊');
    }
    pendingBotMsgs.forEach(m => addBotMsg(m)); pendingBotMsgs = [];
  } else panel.classList.add('hidden');
}

function addBotMsg(text) {
  const msgs = document.getElementById('chatMsgs');
  const d = document.createElement('div');
  d.className = 'msg bot';
  d.style.whiteSpace = 'pre-line';
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  const msgs = document.getElementById('chatMsgs');
  const d = document.createElement('div');
  d.className = 'msg typing';
  d.id = 'typing';
  d.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

// ============ SECURE AI FETCH CALL ============
async function sendMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const msgs = document.getElementById('chatMsgs');
  const um = document.createElement('div');
  um.className = 'msg user';
  um.textContent = text;
  msgs.appendChild(um);
  msgs.scrollTop = msgs.scrollHeight;

  chatHistory.push({ role: 'user', parts: [{ text }] });
  addTyping();

  const context = currentCalc.amount ? `User context: comparing loan of ₾${currentCalc.amount} for ${currentCalc.term} months.` : '';
  const systemPrompt = `You are ფინო, a warm Georgian financial assistant. Help users with loans, savings, budgets. Context: ${context}`;

  try {
    // Calling our local Vercel cloud function instead of directly hitting Google
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: chatHistory, systemInstruction: systemPrompt })
    });
    
    const data = await response.json();
    document.getElementById('typing')?.remove();
    
    if (!response.ok) throw new Error(data.error || 'Server error');
    
    chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
    addBotMsg(data.reply);
  } catch (e) {
    document.getElementById('typing')?.remove();
    addBotMsg('კავშირის პრობლემა. გთხოვთ სცადოთ კიდევ.');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

window.addEventListener('DOMContentLoaded', () => { calcSavings(); calcBudget(); convertCurrency(); });