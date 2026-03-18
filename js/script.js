
let currentTurmaId = null;
let currentUcId = null;
let currentDayId = null;
const ADMIN_EMAIL = "admin@portal.com";
const ADMIN_SENHA = "123456";

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeIcons(next);
}

function updateThemeIcons(theme) {
  const sunSVG = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  const moonSVG = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  const icon = theme === "dark" ? moonSVG : sunSVG;
  ["themeIconHeader","themeIconLogin"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon;
  });
}

function getTurmas() { return JSON.parse(localStorage.getItem("turmas_v4") || "[]"); }
function saveTurmas(t) { localStorage.setItem("turmas_v4", JSON.stringify(t)); }

function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + type;
  el.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const err = document.getElementById("loginErro");
  if (!email || !senha) { err.textContent = "Preencha todos os campos!"; return; }
  if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    localStorage.setItem("adminLogado", "true");
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appHeader").classList.remove("hidden");
    document.getElementById("dashboardScreen").classList.remove("hidden");
    listarTurmas();
    toast("Login realizado com sucesso!");
  } else {
    err.textContent = "Credenciais incorretas!";
  }
}

function logout() {
  localStorage.removeItem("adminLogado");
  ["dashboardScreen","turmaScreen","ucScreen","appHeader"].forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById("loginScreen").style.display = "flex";
  toast("Sessao encerrada.");
}

function showTab(tabId, btn) {
  ["alunosTab","ucsTab","freqGeralTab"].forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
  btn.closest(".tabs").querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  if (tabId === "ucsTab") listarUcs();
  if (tabId === "freqGeralTab") renderFreqGeral();
  if (tabId === "alunosTab") listarAlunos();
}

function listarTurmas() {
  const turmas = getTurmas();
  const div = document.getElementById("turmasList");
  if (!turmas.length) {
    div.innerHTML = '<p style="color:var(--text2);font-size:13px;text-align:center;padding:20px 0;">Nenhuma turma cadastrada. Crie uma acima!</p>';
    return;
  }
  div.innerHTML = "";
  turmas.forEach(t => {
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div class="item-info">
        <div class="item-name">${t.nome}</div>
        <div class="item-sub">${t.alunos ? t.alunos.length : 0} alunos &bull; ${t.ucs ? t.ucs.length : 0} UCs</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" onclick="entrarNaTurma(${t.id})">Abrir</button>
        <button class="btn btn-danger btn-sm" onclick="removerTurma(${t.id})">Excluir</button>
      </div>`;
    div.appendChild(el);
  });
}

function criarTurma() {
  const nome = document.getElementById("turmaNome").value.trim();
  if (!nome) { toast("Nome obrigatorio!", "error"); return; }
  let turmas = getTurmas();
  turmas.push({ id: Date.now(), nome, alunos: [], ucs: [] });
  saveTurmas(turmas);
  document.getElementById("turmaNome").value = "";
  listarTurmas();
  toast("Turma criada com sucesso!");
}

function removerTurma(id) {
  if (!confirm("Excluir esta turma e todos os seus dados?")) return;
  saveTurmas(getTurmas().filter(t => t.id !== id));
  listarTurmas();
  toast("Turma excluida.");
}

function entrarNaTurma(id) {
  currentTurmaId = id;
  document.getElementById("dashboardScreen").classList.add("hidden");
  document.getElementById("turmaScreen").classList.remove("hidden");
  renderTurmaScreen();
}

function renderTurmaScreen() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  if (!turma) return voltarDashboard();
  document.getElementById("bc-turma").textContent = turma.nome;
  document.querySelectorAll("#turmaScreen .tab").forEach((t,i) => t.classList.toggle("active", i===0));
  ["alunosTab","ucsTab","freqGeralTab"].forEach((id,i) => {
    document.getElementById(id).classList.toggle("hidden", i!==0);
  });
  listarAlunos();
}

function voltarDashboard() {
  currentTurmaId = null;
  document.getElementById("turmaScreen").classList.add("hidden");
  document.getElementById("dashboardScreen").classList.remove("hidden");
  listarTurmas();
}

function listarAlunos() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const div = document.getElementById("alunosList");
  document.getElementById("totalAlunos").textContent = `(${turma.alunos.length})`;
  if (!turma.alunos.length) {
    div.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:10px 0;">Nenhum aluno cadastrado.</p>';
    return;
  }
  div.innerHTML = "";
  turma.alunos.forEach(al => {
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div class="item-info">
        <div class="item-name">${al.nome}</div>
        <div class="item-sub">Matricula: ${al.matricula}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" onclick="editarAluno(${al.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="removerAluno(${al.id})">Remover</button>
      </div>`;
    div.appendChild(el);
  });
}

function adicionarAluno() {
  const nome = document.getElementById("alunoNome").value.trim();
  const mat = document.getElementById("alunoMatricula").value.trim();
  if (!nome || !mat) { toast("Preencha todos os campos!", "error"); return; }
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  if (turma.alunos.some(a => a.matricula === mat)) { toast("Matricula ja cadastrada!", "error"); return; }
  turma.alunos.push({ id: Date.now(), nome, matricula: mat });
  saveTurmas(turmas);
  document.getElementById("alunoNome").value = "";
  document.getElementById("alunoMatricula").value = "";
  listarAlunos();
  toast("Aluno adicionado!");
}

function editarAluno(id) {
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  let al = turma.alunos.find(a => a.id === id);
  const nn = prompt("Novo nome:", al.nome); if (!nn || !nn.trim()) return;
  const nm = prompt("Nova matricula:", al.matricula); if (!nm || !nm.trim()) return;
  if (turma.alunos.some(a => a.id !== id && a.matricula === nm.trim())) { toast("Matricula ja cadastrada!", "error"); return; }
  al.nome = nn.trim(); al.matricula = nm.trim();
  saveTurmas(turmas); listarAlunos(); toast("Aluno atualizado!");
}

function removerAluno(id) {
  if (!confirm("Remover este aluno?")) return;
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  turma.alunos = turma.alunos.filter(a => a.id !== id);
  saveTurmas(turmas); listarAlunos(); toast("Aluno removido.");
}

function listarUcs() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const div = document.getElementById("ucsList");
  if (!turma.ucs.length) {
    div.innerHTML = '<p style="color:var(--text2);font-size:13px;padding:10px 0;">Nenhuma UC cadastrada.</p>';
    return;
  }
  div.innerHTML = "";
  turma.ucs.forEach(uc => {
    const el = document.createElement("div");
    el.className = "list-item";
    el.innerHTML = `
      <div class="item-info">
        <div class="item-name">${uc.nome}</div>
        <div class="item-sub">${uc.totalAulas} aulas planejadas &bull; ${(uc.dias || []).length} dias registrados</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" onclick="editarUc(${uc.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="removerUc(${uc.id})">Excluir</button>
        <button class="btn btn-primary btn-sm" onclick="abrirUc(${uc.id})">Frequencia</button>
      </div>`;
    div.appendChild(el);
  });
}

function adicionarUc() {
  const nome = document.getElementById("ucNome").value.trim();
  const total = parseInt(document.getElementById("ucTotalAulas").value);
  if (!nome || isNaN(total) || total < 1) { toast("Preencha nome e total valido!", "error"); return; }
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  turma.ucs.push({ id: Date.now(), nome, totalAulas: total, dias: [] });
  saveTurmas(turmas);
  document.getElementById("ucNome").value = "";
  document.getElementById("ucTotalAulas").value = "";
  listarUcs(); toast("UC adicionada!");
}

function editarUc(id) {
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  let uc = turma.ucs.find(u => u.id === id);
  const nn = prompt("Novo nome:", uc.nome); if (!nn || !nn.trim()) return;
  const nt = parseInt(prompt("Novo total de aulas:", uc.totalAulas));
  if (isNaN(nt) || nt < 1) { toast("Total invalido!", "error"); return; }
  uc.nome = nn.trim(); uc.totalAulas = nt;
  saveTurmas(turmas); listarUcs(); toast("UC atualizada!");
}

function removerUc(id) {
  if (!confirm("Excluir esta UC e todos os registros?")) return;
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  turma.ucs = turma.ucs.filter(u => u.id !== id);
  saveTurmas(turmas); listarUcs(); toast("UC removida.");
}

function abrirUc(id) {
  currentUcId = id; currentDayId = null;
  document.getElementById("turmaScreen").classList.add("hidden");
  document.getElementById("ucScreen").classList.remove("hidden");
  renderUcScreen();
}

function voltarTurma() {
  currentUcId = null; currentDayId = null;
  document.getElementById("ucScreen").classList.add("hidden");
  document.getElementById("turmaScreen").classList.remove("hidden");
  renderTurmaScreen();
}

function getUc() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  return turma ? turma.ucs.find(u => u.id === currentUcId) : null;
}

function renderUcScreen() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const uc = getUc();
  if (!uc) return voltarTurma();
  document.getElementById("bc-turma2").textContent = turma.nome;
  document.getElementById("bc-uc").textContent = uc.nome;
  document.getElementById("ucNomeTitle").textContent = uc.nome;
  document.getElementById("ucTotalAulasDisplay").textContent = `${uc.totalAulas} aulas planejadas`;
  renderUcStats();
  renderDaysNav();
  if (currentDayId) renderFreqDay();
  renderUcAlunosSummary();
}

function renderUcStats() {
  const uc = getUc();
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const dias = uc.dias || [];
  let totalP = 0, totalF = 0;
  turma.alunos.forEach(al => {
    dias.forEach(d => {
      if (d.presencas && d.presencas[al.id] === true) totalP++;
      else if (d.presencas && d.presencas[al.id] === false) totalF++;
    });
  });
  const grid = document.getElementById("ucStatsGrid");
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-val">${dias.length}</div><div class="stat-lbl">Dias Registrados</div></div>
    <div class="stat-card" style="border-top-color:var(--blue);"><div class="stat-val" style="color:var(--blue)">${turma.alunos.length}</div><div class="stat-lbl">Alunos</div></div>
    <div class="stat-card" style="border-top-color:var(--green);"><div class="stat-val" style="color:var(--green)">${totalP}</div><div class="stat-lbl">Total Presencas</div></div>
    <div class="stat-card" style="border-top-color:var(--red);"><div class="stat-val" style="color:var(--red)">${totalF}</div><div class="stat-lbl">Total Faltas</div></div>
  `;
}

function openAddDayModal() {
  document.getElementById("newDayDate").value = new Date().toISOString().slice(0,10);
  document.getElementById("newDayDesc").value = "";
  openModal("addDayModal");
}

function addDay() {
  const date = document.getElementById("newDayDate").value;
  const desc = document.getElementById("newDayDesc").value.trim();
  if (!date) { toast("Selecione uma data!", "error"); return; }
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  let uc = turma.ucs.find(u => u.id === currentUcId);
  if (!uc.dias) uc.dias = [];
  const num = uc.dias.length + 1;
  const presencas = {};
  turma.alunos.forEach(al => { presencas[al.id] = null; });
  const dayId = Date.now();
  uc.dias.push({ id: dayId, date, desc: desc || `Dia ${String(num).padStart(2,'0')}`, presencas });
  saveTurmas(turmas);
  currentDayId = dayId;
  closeModal("addDayModal");
  renderUcScreen();
  toast("Dia criado!");
}

function removeDay(dayId) {
  if (!confirm("Remover este dia e seus registros?")) return;
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  let uc = turma.ucs.find(u => u.id === currentUcId);
  uc.dias = uc.dias.filter(d => d.id !== dayId);
  saveTurmas(turmas);
  if (currentDayId === dayId) currentDayId = uc.dias.length ? uc.dias[uc.dias.length-1].id : null;
  renderUcScreen();
  toast("Dia removido.");
}

function renderDaysNav() {
  const uc = getUc();
  const dias = uc.dias || [];
  const nav = document.getElementById("daysNav");
  nav.innerHTML = "";
  dias.forEach(d => {
    const dt = d.date ? new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR") : "";
    const span = document.createElement("div");
    span.className = "day-tab" + (currentDayId === d.id ? " active" : "");
    span.innerHTML = `<span onclick="selectDay(${d.id})" style="cursor:pointer;">${d.desc}${dt ? ' - ' + dt : ''}</span><button class="del-day" onclick="removeDay(${d.id})">x</button>`;
    nav.appendChild(span);
  });
  if (!dias.length) {
    document.getElementById("freqDayContent").innerHTML = '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Clique em "+ Novo Dia" para registrar frequencia.</p>';
  }
}

function selectDay(dayId) {
  currentDayId = dayId;
  renderDaysNav();
  renderFreqDay();
}

function renderFreqDay() {
  if (!currentDayId) return;
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const uc = getUc();
  const day = (uc.dias || []).find(d => d.id === currentDayId);
  if (!day) return;
  const content = document.getElementById("freqDayContent");
  if (!turma.alunos.length) {
    content.innerHTML = '<p style="color:var(--text2);padding:10px 0;">Adicione alunos na turma primeiro.</p>';
    return;
  }
  let html = `<table class="freq-table"><thead><tr>
    <th>Aluno</th><th>Matricula</th><th>Frequencia</th>
    <th style="text-align:right;">Situacao</th></tr></thead><tbody>`;
  turma.alunos.forEach(al => {
    if (!day.presencas) day.presencas = {};
    const p = day.presencas[al.id];
    const pA = p === true ? "active" : "";
    const fA = p === false ? "active" : "";
    let sit = p === true
      ? '<span class="badge badge-green">Presente</span>'
      : p === false
      ? '<span class="badge badge-red">Falta</span>'
      : '<span class="badge" style="background:var(--surface3);color:var(--text3);">Pendente</span>';
    html += `<tr>
      <td style="font-weight:700;font-family:'Nunito',sans-serif;">${al.nome}</td>
      <td style="color:var(--text2);font-size:12px;">${al.matricula}</td>
      <td>
        <div class="pf-group">
          <span class="pf-group-label">Registrar:</span>
          <button class="pf-btn p-btn ${pA}" onclick="setPF(${day.id},${al.id},true)" title="Presente">P</button>
          <button class="pf-btn f-btn ${fA}" onclick="setPF(${day.id},${al.id},false)" title="Falta">F</button>
        </div>
      </td>
      <td style="text-align:right;">${sit}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  content.innerHTML = html;
}

function setPF(dayId, alunoId, val) {
  let turmas = getTurmas();
  let turma = turmas.find(t => t.id === currentTurmaId);
  let uc = turma.ucs.find(u => u.id === currentUcId);
  let day = uc.dias.find(d => d.id === dayId);
  if (!day) return;
  if (!day.presencas) day.presencas = {};
  day.presencas[alunoId] = day.presencas[alunoId] === val ? null : val;
  saveTurmas(turmas);
  renderFreqDay();
  renderUcStats();
  renderUcAlunosSummary();
}

function calcPctAluno(alunoId, dias) {
  let pres = 0, faltas = 0;
  (dias || []).forEach(d => {
    const v = d.presencas ? d.presencas[alunoId] : null;
    if (v === true) pres++;
    else if (v === false) faltas++;
  });
  const total = pres + faltas;
  if (total === 0) return { pct: null, pres, faltas };
  return { pct: Math.min(100, Math.round((pres / total) * 100)), pres, faltas };
}

function pctColor(pct) {
  if (pct === null) return "var(--text3)";
  if (pct >= 75) return "var(--green)";
  if (pct >= 50) return "var(--yellow)";
  if (pct >= 30) return "var(--orange)";
  return "var(--red)";
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function renderUcAlunosSummary() {
  const uc = getUc();
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const div = document.getElementById("ucAlunosSummary");
  if (!turma.alunos.length) { div.innerHTML = '<p style="color:var(--text2);">Nenhum aluno.</p>'; return; }
  div.innerHTML = "";
  const dias = uc.dias || [];
  turma.alunos.forEach(al => {
    const { pct, pres, faltas } = calcPctAluno(al.id, dias);
    const color = pctColor(pct);
    const total = pres + faltas;
    const barW = pct !== null ? pct : 0;
    let faltaDates = [];
    dias.forEach(d => {
      if (d.presencas && d.presencas[al.id] === false) faltaDates.push(`${d.desc} (${fmtDate(d.date)})`);
    });
    const row = document.createElement("div");
    row.className = "aluno-summary";
    row.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
        <div>
          <span style="font-weight:700;font-size:14px;font-family:'Nunito',sans-serif;">${al.nome}</span>
          <span style="color:var(--text2);font-size:11px;margin-left:8px;font-weight:600;">${al.matricula}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--green);font-weight:700;">P: ${pres}</span>
          <span style="font-size:12px;color:var(--red);font-weight:700;">F: ${faltas}</span>
          <span style="font-size:12px;color:var(--text2);">Total: ${total}</span>
          ${pct !== null ? `<span style="font-weight:800;font-size:16px;color:${color};font-family:'Nunito',sans-serif;">${pct}%</span>` : `<span style="font-size:12px;color:var(--text3);">Sem registros</span>`}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div class="pct-bar" style="width:140px;height:8px;"><div class="pct-fill" style="width:${barW}%;background:${color};"></div></div>
        <span style="font-size:11px;color:var(--text2);font-weight:600;">${pct !== null ? pct + '% de presenca' : 'aguardando registros'}</span>
      </div>
      ${faltaDates.length ? `<div><span style="font-size:11px;color:var(--text2);display:block;margin-bottom:5px;font-weight:700;">Faltas registradas:</span>${faltaDates.map(d => `<span class="falta-date">${d}</span>`).join("")}</div>` : `<span style="font-size:11px;color:var(--green);font-weight:700;">Nenhuma falta registrada</span>`}
    `;
    div.appendChild(row);
  });
}

function renderFreqGeral() {
  const turma = getTurmas().find(t => t.id === currentTurmaId);
  const div = document.getElementById("freqGeralList");
  if (!turma.alunos.length) { div.innerHTML = '<p style="color:var(--text2);">Nenhum aluno cadastrado.</p>'; return; }
  if (!turma.ucs.length) { div.innerHTML = '<p style="color:var(--text2);">Nenhuma UC cadastrada.</p>'; return; }
  div.innerHTML = "";
  turma.alunos.forEach(al => {
    let totalPres = 0, totalFaltas = 0;
    turma.ucs.forEach(uc => {
      const { pres, faltas } = calcPctAluno(al.id, uc.dias || []);
      totalPres += pres; totalFaltas += faltas;
    });
    const totalReg = totalPres + totalFaltas;
    const overallPct = totalReg > 0 ? Math.min(100, Math.round((totalPres / totalReg) * 100)) : null;
    const color = pctColor(overallPct);
    const barW = overallPct !== null ? overallPct : 0;
    const row = document.createElement("div");
    row.className = "aluno-freq-row";
    row.innerHTML = `
      <div class="aluno-freq-header" onclick="toggleFreqAccordion(this)">
        <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
          <div>
            <div style="font-weight:700;font-size:14px;font-family:'Nunito',sans-serif;">${al.nome}</div>
            <div style="font-size:11px;color:var(--text2);font-weight:600;">${al.matricula}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--green);font-weight:700;">P: ${totalPres}</span>
          <span style="font-size:12px;color:var(--red);font-weight:700;">F: ${totalFaltas}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="pct-bar" style="width:90px;"><div class="pct-fill" style="width:${barW}%;background:${color};"></div></div>
            ${overallPct !== null ? `<span class="pct-label" style="color:${color};min-width:40px;">${overallPct}%</span>` : `<span style="font-size:11px;color:var(--text3);">-</span>`}
          </div>
          <span class="accordion-icon" style="color:var(--text3);font-size:20px;font-weight:900;margin-left:4px;font-family:'Nunito',sans-serif;line-height:1;">+</span>
        </div>
      </div>
      <div class="aluno-freq-body">
        <div style="border-top:1px solid var(--border);padding-top:12px;">
          ${turma.ucs.map(uc => {
            const { pct, pres, faltas } = calcPctAluno(al.id, uc.dias || []);
            const c = pctColor(pct);
            const bw = pct !== null ? pct : 0;
            const faltaDates = (uc.dias || []).filter(d => d.presencas && d.presencas[al.id] === false).map(d => fmtDate(d.date));
            return `<div class="uc-freq-item">
              <div class="uc-name">${uc.nome}</div>
              <span style="font-size:11px;color:var(--green);min-width:40px;font-weight:700;">P: ${pres}</span>
              <span style="font-size:11px;color:var(--red);min-width:40px;font-weight:700;">F: ${faltas}</span>
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="pct-bar" style="width:70px;"><div class="pct-fill" style="width:${bw}%;background:${c};"></div></div>
                ${pct !== null ? `<span style="font-weight:800;font-size:13px;color:${c};min-width:36px;font-family:'Nunito',sans-serif;">${pct}%</span>` : `<span style="font-size:11px;color:var(--text3);">-</span>`}
              </div>
              ${faltaDates.length ? `<div>${faltaDates.map(fd => `<span class="falta-date">${fd}</span>`).join("")}</div>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>`;
    div.appendChild(row);
  });
}

function toggleFreqAccordion(header) {
  const body = header.nextElementSibling;
  const isOpen = body.classList.contains("open");
  document.querySelectorAll(".aluno-freq-body").forEach(b => b.classList.remove("open"));
  document.querySelectorAll(".accordion-icon").forEach(s => { s.textContent = "+"; });
  if (!isOpen) {
    body.classList.add("open");
    const icon = header.querySelector(".accordion-icon");
    if (icon) icon.textContent = "-";
  }
}

function init() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcons(savedTheme);
  if (localStorage.getItem("adminLogado") === "true") {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appHeader").classList.remove("hidden");
    document.getElementById("dashboardScreen").classList.remove("hidden");
    listarTurmas();
  }
  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", e => { if (e.target === o) o.classList.remove("open"); });
  });
}
window.onload = init;
