// ============ STATE ============
let lang = 'ka';
let chatOpen = false;
let unreadCount = 0;
let chatHistory = [];
let pendingBotMsgs = [];
let currentCalc = {};

// ============ BANK DATA ============
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

// ============ LANG ============
function toggleLang() {
  lang = lang === 'ka' ? 'en' : 'ka';
  document.getElementById('langBtn').textContent = lang === 'ka' ? 'EN' : 'KA';
  document.querySelectorAll('[data-ka]').forEach(el => {
    if (el.tagName === 'OPTION') {
      el.textContent = lang === 'ka' ? el.dataset.ka : (el.dataset.en || el.dataset.ka);
    } else {
      el.textContent = lang === 'ka' ? el.dataset.ka : (el.dataset.en || el.dataset.ka);
    }
  });
}

// ============ TABS ============
function switchTab(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
}

// ============ LOAN ============
function updateAmount(v) {
  document.getElementById('amountVal').textContent = '₾' + parseInt(v).toLocaleString();
}
function updateTerm(v) {
  document.getElementById('termVal').textContent = v;
}

function calculate() {
  const amount = parseFloat(document.getElementById('amountSlider').value);
  const term = parseInt(document.getElementById('termSlider').value);
  currentCalc = { amount, term };

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

  document.getElementById('resultsLabel').textContent =
    `₾${amount.toLocaleString()} · ${term} ${lang === 'ka' ? 'თვე' : 'months'} · ${results.length} ${lang === 'ka' ? 'ბანკი შედარდა' : 'banks compared'}`;
  document.getElementById('resultsSection').classList.remove('hidden');
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Queue chatbot message
  const best = results[0];
  const msg = lang === 'ka'
    ? `₾${amount.toLocaleString()}-ის სესხზე ${term} თვით საუკეთესო ვარიანტი ${best.name}ია — ₾${best.payment.toFixed(2)}/თვეში. გაქვს შეკითხვები?`
    : `Best option for ₾${amount.toLocaleString()} over ${term} months is ${best.nameEn} — ₾${best.payment.toFixed(2)}/month. Any questions?`;
  queueBotMsg(msg);
}

function submitLead() {
  const name = document.getElementById('leadName').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const consent = document.getElementById('consent').checked;
  if (!name || !phone) { showToast(lang === 'ka' ? 'გთხოვთ შეავსოთ ყველა ველი' : 'Please fill all fields'); return; }
  if (!consent) { showToast(lang === 'ka' ? 'გთხოვთ მოინიშნოთ თანხმობა' : 'Please check consent'); return; }
  showToast(lang === 'ka' ? `მადლობა ${name}! ბანკი მალე დაგიკავშირდება.` : `Thank you ${name}! Bank will contact you soon.`);
  document.getElementById('leadName').value = '';
  document.getElementById('leadPhone').value = '';
  const msg = lang === 'ka' ? `შესანიშნავია ${name}! შენი მოთხოვნა გადაეგზავნა ბანკებს. 24 საათში დაგიკავშირდებიან. 🎉` : `Great ${name}! Your request was sent to banks. They'll contact you within 24h. 🎉`;
  queueBotMsg(msg);
}

// ============ SAVINGS ============
function calcSavings() {
  const goal = parseFloat(document.getElementById('saveGoal').value) || 10000;
  const mo = parseFloat(document.getElementById('saveMo').value) || 500;
  const rate = parseFloat(document.getElementById('saveRateSlider').value) / 100 / 12;
  let bal = 0, months = 0;
  while (bal < goal && months < 600) { bal = bal * (1 + rate) + mo; months++; }
  const interest = Math.max(0, Math.round(bal - mo * months));
  document.getElementById('saveMonths').textContent = months;
  document.getElementById('saveTotal').textContent = '₾' + Math.round(bal).toLocaleString();
  document.getElementById('saveInterest').textContent = '₾' + interest.toLocaleString();
  document.getElementById('saveYear').textContent = new Date().getFullYear() + Math.ceil(months / 12);
  document.getElementById('saveGoalLabel').textContent = '₾' + goal.toLocaleString();
  const pct = Math.min(100, Math.round((mo * months / goal) * 100));
  document.getElementById('saveProgress').style.width = pct + '%';
}

// ============ BUDGET ============
function calcBudget() {
  const inc = parseFloat(document.getElementById('income').value) || 3000;
  const rule = document.getElementById('budgetRule').value;
  let n, w, s;
  if (rule === '503020') { n = 0.5; w = 0.3; s = 0.2; }
  else if (rule === '702010') { n = 0.7; w = 0.2; s = 0.1; }
  else { n = 0.6; w = 0.2; s = 0.2; }

  const needs = Math.round(inc * n);
  const wants = Math.round(inc * w);
  const savings = Math.round(inc * s);

  document.getElementById('bNeeds').textContent = '₾' + needs.toLocaleString();
  document.getElementById('bWants').textContent = '₾' + wants.toLocaleString();
  document.getElementById('bSavings').textContent = '₾' + savings.toLocaleString();

  document.querySelectorAll('.bc-pct')[0].textContent = Math.round(n * 100) + '%';
  document.querySelectorAll('.bc-pct')[1].textContent = Math.round(w * 100) + '%';
  document.querySelectorAll('.bc-pct')[2].textContent = Math.round(s * 100) + '%';

  const catList = document.getElementById('catList');
  catList.innerHTML = '';
  cats.forEach(c => {
    const amt = Math.round(inc * c.pct);
    const pct = Math.round(c.pct * 100);
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = `
      <div class="cat-icon" style="background:${c.color}18">${c.emoji}</div>
      <div class="cat-info">
        <span class="cat-name">${lang === 'ka' ? c.name : c.nameEn}</span>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct * 2}%;background:${c.color}"></div></div>
      </div>
      <div class="cat-right">
        <div class="cat-amount">₾${amt.toLocaleString()}</div>
        <div class="cat-pct">${pct}%</div>
      </div>`;
    catList.appendChild(row);
  });
}

// ============ CURRENCY ============
function convertCurrency() {
  const amt = parseFloat(document.getElementById('curAmount').value) || 0;
  const from = document.getElementById('curFrom').value;
  const to = document.getElementById('curTo').value;
  const inGEL = amt * rates[from];
  const result = (inGEL / rates[to]).toFixed(2);
  const oneUnit = (rates[from] / rates[to]).toFixed(4);
  document.getElementById('curResultMain').textContent = `${amt.toLocaleString()} ${from} = ${parseFloat(result).toLocaleString()} ${to}`;
  document.getElementById('curResultRate').textContent = `1 ${from} = ${oneUnit} ${to}`;
}
function swapCurrency() {
  const f = document.getElementById('curFrom');
  const t = document.getElementById('curTo');
  const tmp = f.value; f.value = t.value; t.value = tmp;
  convertCurrency();
}

// ============ ADVISOR ============
function getAdvice() {
  const income = parseFloat(document.getElementById('advIncome').value) || 2000;
  const food = parseFloat(document.getElementById('expFood').value) || 0;
  const transport = parseFloat(document.getElementById('expTransport').value) || 0;
  const ent = parseFloat(document.getElementById('expEnt').value) || 0;
  const util = parseFloat(document.getElementById('expUtil').value) || 0;
  const other = parseFloat(document.getElementById('expOther').value) || 0;
  const goalAmt = parseFloat(document.getElementById('advGoalAmt').value) || 5000;
  const totalExp = food + transport + ent + util + other;
  const expPct = Math.round((totalExp / income) * 100);
  const entPct = Math.round((ent / income) * 100);
  const monthsToGoal = Math.ceil(goalAmt / Math.max(1, income - totalExp));

  const tips = [];

  if (entPct > 20) {
    tips.push({ icon: '🎮', color: '#F97316', title: lang === 'ka' ? 'გართობის ხარჯი მაღალია' : 'High Entertainment Spend', text: lang === 'ka' ? `გართობაზე შემოსავლის ${entPct}% მიდის. სცადე სტრიმინგ სერვისები კინოს ნაცვლად — თვეში ₾${Math.round(ent * 0.4)}-ს დაზოგავ.` : `Entertainment is ${entPct}% of income. Try streaming services instead of cinema — save ~₾${Math.round(ent * 0.4)}/month.` });
  }
  if (income - totalExp < income * 0.1) {
    tips.push({ icon: '⚠️', color: '#EF4444', title: lang === 'ka' ? 'დანაზოგი ძალიან მცირეა' : 'Very Low Savings', text: lang === 'ka' ? `ხარჯები შემოსავლის ${expPct}%-ია. სცადე 50/30/20 წესი — შემოსავლის 20% ავტომატურად გადადე.` : `Expenses are ${expPct}% of income. Try 50/30/20 rule — automatically save 20%.` });
  }
  if (expPct > 80) {
    tips.push({ icon: '📊', color: '#8B5CF6', title: lang === 'ka' ? 'ხარჯები მაღალია' : 'High Expenses', text: lang === 'ka' ? `ხარჯები შემოსავლის ${expPct}%-ია. ₾${Math.round(totalExp - income * 0.7)}-ით შემცირება ბალანსს გაუმჯობესებს.` : `Expenses are ${expPct}% of income. Reducing by ₾${Math.round(totalExp - income * 0.7)} would improve balance.` });
  }
  if (monthsToGoal < 12 && monthsToGoal > 0) {
    tips.push({ icon: '🎯', color: '#10B981', title: lang === 'ka' ? 'მიზანი ახლოსაა!' : 'Goal is Close!', text: lang === 'ka' ? `${monthsToGoal} თვეში მიაღწევ ₾${goalAmt.toLocaleString()}-ის მიზანს. შენ შეგიძლია!` : `You'll reach your ₾${goalAmt.toLocaleString()} goal in ${monthsToGoal} months. You got this!` });
  }
  tips.push({ icon: '🏦', color: '#C9A84C', title: lang === 'ka' ? 'საბანკო რჩევა' : 'Banking Tip', text: lang === 'ka' ? 'ლიბერთი ბანკი და კრედო ბანკი გთავაზობენ 12%-მდე სადეპოზიტო განაკვეთს 12 თვის ვადით.' : 'Liberty Bank and Credo Bank offer up to 12% deposit rates for 12-month terms.' });

  const res = document.getElementById('adviceResults');
  res.innerHTML = tips.map(t => `
    <div class="advice-card" style="border-left-color:${t.color}">
      <div class="advice-icon" style="background:${t.color}18">${t.icon}</div>
      <div><div class="advice-title">${t.title}</div><div class="advice-text">${t.text}</div></div>
    </div>`).join('');
  res.classList.remove('hidden');
  res.scrollIntoView({ behavior: 'smooth' });
}

// ============ CHATBOT ============
function queueBotMsg(msg) {
  if (chatOpen) {
    addBotMsg(msg);
  } else {
    pendingBotMsgs.push(msg);
    unreadCount++;
    const badge = document.getElementById('chatBadge');
    badge.textContent = unreadCount;
    badge.classList.remove('hidden');
    document.getElementById('chatFab').classList.add('pulse');
  }
}

function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const fab = document.getElementById('chatFab');

  if (chatOpen) {
    panel.classList.remove('hidden');
    fab.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    // Clear badge
    unreadCount = 0;
    document.getElementById('chatBadge').classList.add('hidden');
    fab.classList.remove('pulse');
    // Show pending messages
    if (document.getElementById('chatMsgs').children.length === 0) {
      addBotMsg(lang === 'ka' ? 'გამარჯობა! მე ვარ ფინო — შენი ფინანსური ასისტენტი. რით შემიძლია დაგეხმარო? 😊' : 'Hello! I\'m ფინო — your financial assistant. How can I help you? 😊');
    }
    pendingBotMsgs.forEach(m => addBotMsg(m));
    pendingBotMsgs = [];
    setTimeout(() => document.getElementById('chatInput').focus(), 300);
  } else {
    panel.classList.add('hidden');
    fab.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }
}

function addBotMsg(text) {
  const msgs = document.getElementById('chatMsgs');
  const d = document.createElement('div');
  d.className = 'msg bot';
  d.textContent = text;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTyping() {
  const msgs = document.getElementById('chatMsgs');
  const d = document.createElement('div');
  d.className = 'msg typing';
  d.id = 'typing';
  d.textContent = 'ფინო წერს...';
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

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

  const context = currentCalc.amount
    ? `User is comparing a loan of ₾${currentCalc.amount} for ${currentCalc.term} months. `
    : '';

  const systemPrompt = `You are ფინო, a friendly Georgian financial assistant app. Help users with loans, savings, budgets and currency in Georgia. Georgian banks and rates: TBC Bank 15-22%, Bank of Georgia 16-24%, Liberty Bank 18-26%, Credo Bank 19-28%, Basisbank 17-25%. ${context}Always be warm and simple. Respond in Georgian by default, English if user writes English. Max 3 sentences unless explaining something complex. After loan questions always ask: გსურს ბანკმა პირდაპირ დაგიკავშირდეს?`;

  try {
    const GEMINI_KEY = window.GEMINI_API_KEY || 'gemini key';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: chatHistory
      })
    });
    const data = await response.json();
    document.getElementById('typing')?.remove();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || (lang === 'ka' ? 'ბოდიში, ვერ გავიგე. სცადეთ კიდევ.' : 'Sorry, I didn\'t understand. Try again.');
    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    addBotMsg(reply);
  } catch (e) {
    document.getElementById('typing')?.remove();
    addBotMsg(lang === 'ka' ? 'API გასაღები საჭიროა. დააყენეთ GEMINI_API_KEY.' : 'API key required. Set GEMINI_API_KEY.');
  }
}

// ============ TOAST ============
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

// ============ INIT ============
window.addEventListener('DOMContentLoaded', () => {
  calcSavings();
  calcBudget();
  convertCurrency();

  // Pulse chatbot after 4 seconds
  setTimeout(() => {
    if (!chatOpen) {
      document.getElementById('chatFab').classList.add('pulse');
      queueBotMsg(lang === 'ka' ? 'გამარჯობა! 👋 გჭირდება დახმარება სესხის შედარებაში?' : 'Hello! 👋 Need help comparing loans?');
    }
  }, 4000);
});
