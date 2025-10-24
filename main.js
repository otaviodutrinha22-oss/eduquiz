// ========================
// main.js - EduQuiz (atualizado: countdown live, ajustes UI e correções)
// - Adições: countdown 3..2..1 antes do start ao vivo, alunos só entram na sala,
//   fixes no botão "Ver tentativas" (cor), alinhamento checkbox, select branco,
//   centralização da tela inicial, e pequenos refinamentos.
// ========================

// ------------------------
// Helpers de storage
// ------------------------
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ------------------------
// Ensure initial structure
// ------------------------
function ensureStorageStructure() {
  if (!lsGet("users", null)) {
    const users = {
      professors: [
        { username: "João Gabriel", password: "123" },
      ],
      students: [
        { username: "Jorge", password: "123" },
      ]
    };
    lsSet("users", users);
  }
  if (!lsGet("quizzes", null)) lsSet("quizzes", []);
  if (!lsGet("submissions", null)) lsSet("submissions", []);
  if (!lsGet("pontuacoes", null)) lsSet("pontuacoes", {});
  if (!lsGet("liveRooms", null)) lsSet("liveRooms", {}); // live room meta
}
ensureStorageStructure();

// ------------------------
// Injected CSS (updated)
// ------------------------
const style = document.createElement('style');
style.innerHTML = `

:root{
  --muted: #93a3ad;
  --accent-solid: #9be7e3;
  --menu-bg-start: #0b7780;
  --menu-bg-end: #002632;
  --card-shadow: rgba(0,0,0,0.45);
  --bg: #071425;
  --text: #e6f3f6;
}

/* Reset e scroll */
*{box-sizing:border-box;}
html, body {
  height: 100%;
  margin:0;
  padding:0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, Arial, sans-serif;
  overflow-y: auto; /* permite scroll */
}

/* Container principal */
#container {
  box-sizing: border-box;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px;
  min-height: 100vh;  /* ocupa toda a tela */
  display: flex;
  flex-direction: column; /* empilha verticalmente */
  align-items: stretch;   /* largura total */
  justify-content: flex-start; /* começa do topo */
}
;
document.head.appendChild(style);

/* buttons */
button { font-family:inherit; border:none; cursor:pointer; border-radius:10px; padding:8px 12px; }
.btn-accent { background: linear-gradient(90deg,#10B981,#06B6D4); color:#001a1a; font-weight:700; }
.btn-primary { background: linear-gradient(90deg,#0b5a78,#083a52); color:var(--text); font-weight:700; }
.btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.04); color:var(--text); }
.btn-small { padding:6px 8px; font-size:13px; border-radius:8px; background: rgba(255,255,255,0.02); color:var(--text); }
.btn-small-alt { padding:6px 8px; font-size:13px; border-radius:8px; background: rgba(255,255,255,0.95); color:var(--bg); }

/* hamburger */
#hamburger { position: fixed; top: 18px; left: 18px; z-index: 10010; background: transparent; font-size: 24px; color: var(--text); cursor:pointer; padding:8px; border-radius:8px; border: 1px solid rgba(255,255,255,0.04); }

/* Side menu */
#sideMenu { position: fixed; top: 0; left: 0; height: 100vh; width: 280px;
  background: linear-gradient(180deg, var(--menu-bg-start), var(--menu-bg-end));
  color: var(--text); padding: 18px; box-shadow: 8px 0 40px rgba(0,0,0,0.6); display: none; z-index: 10011; overflow:auto;
  border-right: 1px solid rgba(255,255,255,0.03);
  backdrop-filter: blur(6px);
  opacity:0.98;
}
#sideMenu.open { display:block; }
#sideMenu .menu-title { font-weight:800; margin-bottom:12px; }
#sideMenu button { display:block; width:100%; margin:8px 0; text-align:left; border-radius:8px; padding:10px 12px; background: rgba(255,255,255,0.03); color:var(--text); border: none; font-weight:700; }

/* overlay */
#menuOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10009; display:none; }
#menuOverlay.show { display:block; }

/* central containers */
.central-panel { max-width:1000px; width:100%; margin:0 auto; padding:18px; box-sizing:border-box; }

/* select white style */
.select-white { background: #ffffff !important; color: var(--bg) !important; font-weight:700; border: 1px solid rgba(0,0,0,0.06); padding:10px; border-radius:8px; }

/* quiz layout & alternatives */
.quiz-container { max-width: 1000px; width: 100%; padding: 22px; border-radius: 12px; background: rgba(0,0,0,0.12); }
.quiz-container.large { max-width: 1000px; padding: 28px; }
.alternativas { display: grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:12px; }
.alternativas.single-column { grid-template-columns: 1fr; }
.btn-alternativa { padding: 16px 18px; font-size: 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.04); cursor:pointer; width: 100%; text-align:left; white-space: normal; }

/* alternative colors */
.alt-red { background: linear-gradient(180deg,#ef4444,#dc2626); color: #fff; }
.alt-yellow { background: linear-gradient(180deg,#facc15,#f59e0b); color: #111; }
.alt-green { background: linear-gradient(180deg,#34d399,#10b981); color: #012; }
.alt-blue { background: linear-gradient(180deg,#60a5fa,#3b82f6); color: #fff; }
.alt-purple { background: linear-gradient(180deg,#a78bfa,#7c3aed); color: #fff; }
.alt-err { background: linear-gradient(180deg,#ef4444,#dc2626); color: #fff; }
.alt-correct { background: linear-gradient(180deg,#3b82f6,#2563eb); color: #fff; }

.btn-alternativa.disabled { opacity: 0.6; pointer-events: none; }
.btn-alternativa.correta { outline: 3px solid rgba(16,185,129,0.18); box-shadow: 0 6px 18px rgba(16,185,129,0.06); }
.btn-alternativa.errada { outline: 3px solid rgba(239,108,108,0.12); box-shadow: 0 6px 18px rgba(239,108,108,0.04); }

/* correction box: fundo branco e texto escuro legível */
.correction-box { background: #ffffff; color: var(--bg); border: 1px solid rgba(0,0,0,0.06); padding: 8px; border-radius: 8px; }
.correction-box input, .correction-box textarea { color: var(--bg); background: #fff; border:1px solid rgba(0,0,0,0.06); padding:6px; border-radius:6px; }

/* submissions layout */
.submissions-panel { display:flex; gap:12px; align-items:flex-start; }
.submissions-left { width:300px; max-height:60vh; overflow:auto; padding-right:10px; }
.submissions-right { flex:1; max-height:60vh; overflow:auto; }

/* podium & overlays */
.podium-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index: 20000; color:var(--text); }
.podium-card { width:90%; max-width:1200px; height:80vh; background: linear-gradient(180deg,#fff,#f3f6f8); color: var(--bg); border-radius:12px; display:flex; align-items:center; justify-content:center; gap:12px; padding:20px; }

/* checkbox inline alignment */
.inline-checkbox { display:flex; align-items:center; gap:8px; }

/* big countdown overlay (center) */
.countdown-overlay { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:22000; background: rgba(0,0,0,0.7); }
.countdown-bubble { font-size: 140px; font-weight:900; color: #fff; width:320px; height:320px; border-radius:50%; display:flex; align-items:center; justify-content:center; background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.12), rgba(255,255,255,0.04)); box-shadow: 0 18px 50px rgba(0,0,0,0.6); transform:scale(0.6); opacity:0; animation: popIn 900ms ease forwards; }
@keyframes popIn { 0% { transform: scale(0.4); opacity:0 } 40% { transform: scale(1.08); opacity:1 } 100% { transform: scale(1); opacity:1 } }
.countdown-digit { font-size:120px; line-height:1; }

/* leaderboard brief */
.leaderboard-brief { position: fixed; right:20px; top:20px; z-index: 18000; background: rgba(255,255,255,0.95); color:var(--bg); padding:12px 16px; border-radius:8px; box-shadow: 0 8px 40px rgba(0,0,0,0.25); }

/* small helpers */
.voltar { cursor:pointer; text-decoration:underline; color:var(--muted); }
`;
document.head.appendChild(style);

// ------------------------
// Globals
// ------------------------
let perguntas = [];
let quizEmConstrucao = [];
let indicePergunta = 0;
let pontuacao = 0;
let totalPerguntas = 0;
let usuarioAtual = "";
let usuarioRole = ""; // 'professor' || 'aluno'
let currentQuizName = null;
let currentSubmissionAnswers = [];
let quizActive = false;
let abandonTimerHandle = null;
let abandonVisibilityHandler = null;
let abandonBlurHandler = null;
let abandonFocusHandler = null;

// Live keys
const LIVE_BROADCAST_KEY = "eduquiz_live_event";

// ------------------------
// Recompute pontuações from submissions (source of truth)
// ------------------------
function recomputePontuacoesFromSubmissions() {
  const submissions = lsGet("submissions", []) || [];
  const ponts = {};
  submissions.forEach(s => {
    const aluno = s.aluno || "anonimo";
    const pontosTot = parseFloat(s.totalPoints || 0) || 0;
    if (!ponts[aluno]) ponts[aluno] = 0;
    ponts[aluno] += pontosTot;
  });
  lsSet("pontuacoes", ponts);
  return ponts;
}

// ------------------------
// Menu / sidebar
// ------------------------
function ensureMenuElements() {
  if (!document.getElementById("menuOverlay")) {
    const ov = document.createElement("div");
    ov.id = "menuOverlay";
    ov.onclick = closeSideMenu;
    document.body.appendChild(ov);
  }
  if (!document.getElementById("sideClose")) {
    const sc = document.createElement("button");
    sc.id = "sideClose";
    sc.title = "Fechar";
    sc.innerText = "←";
    sc.onclick = closeSideMenu;
    document.body.appendChild(sc);
  }
}
function renderSideMenu() {
  const old = document.getElementById("sideMenu");
  if (old) old.remove();
  const side = document.createElement("div");
  side.id = "sideMenu";
  side.innerHTML = `<div class="menu-title">Menu</div>`;
  if (usuarioRole === "professor") {
    side.innerHTML += `
      <button id="menuCriarQuiz">📚 Criar / Ver Quizzes</button>
      <button id="menuSubmissoes">📝 Submissões / Corrigir</button>
      <button id="menuResultados">🏆 Resultados (Ranking)</button>
      <button id="menuAlunos">👥 Alunos</button>
      <button id="menuMinhaConta">⚙️ Minha Conta</button>
      <button id="menuSair">⎋ Sair</button>
      <button id="menuFechar">✕ Fechar</button>
    `;
  } else {
    side.innerHTML += `
      <button id="menuVerQuizzes">📚 Ver Quizzes</button>
      <button id="menuHistorico">🕘 Meu Histórico</button>
      <button id="menuResultados">🏆 Resultados (Ranking)</button>
      <button id="menuMinhaContaAluno">⚙️ Minha Conta</button>
      <button id="menuSair">⎋ Sair</button>
      <button id="menuFechar">✕ Fechar</button>
    `;
  }
  document.body.appendChild(side);
  ensureMenuElements();

  if (usuarioRole === "professor") {
    document.getElementById("menuCriarQuiz").onclick = () => { closeSideMenu(); adicionarPergunta(); };
    document.getElementById("menuSubmissoes").onclick = () => { closeSideMenu(); painelProfessorSubmissoes(); };
    document.getElementById("menuResultados").onclick = () => { closeSideMenu(); mostrarRanking(); };
    document.getElementById("menuAlunos").onclick = () => { closeSideMenu(); mostrarTabelaAlunos(); };
    document.getElementById("menuMinhaConta").onclick = () => { closeSideMenu(); alterarSenhaTela('professor', usuarioAtual); };
    document.getElementById("menuSair").onclick = () => { logoutFlow(); };
    document.getElementById("menuFechar").onclick = () => { closeSideMenu(); };
  } else {
    document.getElementById("menuVerQuizzes").onclick = () => { closeSideMenu(); mostrarQuizzesAluno(); };
    document.getElementById("menuHistorico").onclick = () => { closeSideMenu(); mostrarHistoricoAluno(); };
    document.getElementById("menuResultados").onclick = () => { closeSideMenu(); mostrarRanking(); };
    document.getElementById("menuMinhaContaAluno").onclick = () => { closeSideMenu(); alterarSenhaTela('student', usuarioAtual); };
    document.getElementById("menuSair").onclick = () => { logoutFlow(); };
    document.getElementById("menuFechar").onclick = () => { closeSideMenu(); };
  }
}
function openSideMenu() {
  ensureMenuElements();
  if (!document.getElementById("sideMenu")) renderSideMenu();
  document.getElementById("sideMenu").classList.add('open');
  document.getElementById("menuOverlay").classList.add('show');
  const sc = document.getElementById("sideClose"); if (sc) sc.style.display = 'flex';
  const ham = document.getElementById("hamburger"); if (ham) ham.style.display = 'none';
}
function closeSideMenu() {
  const side = document.getElementById("sideMenu"); if (side) side.classList.remove('open');
  const overlay = document.getElementById("menuOverlay"); if (overlay) overlay.classList.remove('show');
  const sc = document.getElementById("sideClose"); if (sc) sc.style.display = 'none';
  const ham = document.getElementById("hamburger"); if (ham) ham.style.display = '';
}
function toggleSideMenu() {
  const side = document.getElementById("sideMenu");
  if (!side || !side.classList.contains('open')) openSideMenu();
  else closeSideMenu();
}
function ensureHamburger() {
  const existing = document.getElementById("hamburger");
  if (existing) existing.remove();
  const btn = document.createElement("button");
  btn.id = "hamburger";
  btn.innerText = "☰";
  btn.title = "Menu";
  btn.onclick = toggleSideMenu;
  document.body.appendChild(btn);
}
function logoutFlow() {
  usuarioAtual = "";
  usuarioRole = "";
  closeSideMenu();
  telaInicial();
}

// ------------------------
// Dashboard
// ------------------------
function renderDashboard() {
  recomputePontuacoesFromSubmissions();
  const container = document.getElementById("container");
  if (!document.getElementById("sideMenu")) renderSideMenu();
  closeSideMenu();
  ensureHamburger();

  const quizzes = lsGet("quizzes", []);
  const submissions = lsGet("submissions", []);
  const users = lsGet("users", { professors: [], students: [] });

  const ponts = lsGet("pontuacoes", {});
  const ranking = Object.entries(ponts).sort((a,b)=> (parseFloat(b[1]||0) - parseFloat(a[1]||0))).slice(0,3);
  const studentList = users.students || [];
  const relevantStudents = studentList.map(s=>({ username:s.username, points: parseFloat(ponts[s.username])||0 }));
  const sumPoints = relevantStudents.reduce((acc,s)=>acc + (s.points||0),0);
  const avg = relevantStudents.length ? (sumPoints / relevantStudents.length).toFixed(2) : 0;

  let cardA = "", cardB = "", cardC = "", cardD = "";

  cardA = `<h3>Top 3 Alunos</h3><div class="list">` + (ranking.length ? ranking.map((r,i)=> `<div><strong>${i+1}.</strong> ${r[0]} — <span class="small-muted">${r[1]} pts</span></div>`).join("") : `<div>Nenhum</div>`) + `</div>`;

  if (usuarioRole === "professor") {
    cardB = `<h3>Média dos Alunos</h3><div class="big">${avg}</div><div class="small-muted">Média dos ${relevantStudents.length} alunos</div>`;
    const mine = quizzes.filter(q => q.createdBy === usuarioAtual || !q.createdBy);
    cardC = `<h3>Meus Quizzes</h3><div class="big">${mine.length}</div><div class="small-muted">${mine.length} quizzes criados</div><button id="cardMeusQuizzes" class="btn-ghost">Ver meus quizzes</button>`;
    const pendentes = submissions.filter(s => !s.graded);
    cardD = `<h3>Submissões pendentes</h3><div class="big">${pendentes.length}</div><div class="small-muted">Aguardando correção</div><button id="cardPendentes" class="btn-ghost">Ver submissões</button>`;
  } else {
    const userPoints = parseFloat(ponts[usuarioAtual]) || 0;
    cardB = `<h3>Minha Pontuação</h3><div class="big">${userPoints}</div><div class="small-muted">Pontuação total</div>`;
    const mineSubs = submissions.filter(s => s.aluno === usuarioAtual);
    cardC = `<h3>Meus Quizzes</h3><div class="big">${mineSubs.length}</div><div class="small-muted">Tentativas realizadas</div><button id="cardMeusSubs" class="btn-ghost">Ver histórico</button>`;
    const last3 = mineSubs.slice().sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).slice(0,3);
    cardD = `<h3>Últimas Submissões</h3><div class="list">` + (last3.length ? last3.map(s=> `<div><strong>${s.quizName}</strong> — ${s.totalPoints} pts <div class="small-muted">${new Date(s.timestamp).toLocaleString()}</div></div>`).join("") : "<div>Nenhuma</div>") + `</div>`;
  }

  container.innerHTML = `
    <div class="dashboard-frame" style="width:100%; padding:12px; background:transparent; border-radius:12px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:20px; width:100%; height:100%;">
        <div class="dashboard-card" id="cardA">${cardA}</div>
        <div class="dashboard-card" id="cardB">${cardB}</div>
        <div class="dashboard-card" id="cardC">${cardC}</div>
        <div class="dashboard-card" id="cardD">${cardD}</div>
      </div>
    </div>
  `;

  const btnA = document.getElementById("cardMeusQuizzes");
  if (btnA) btnA.onclick = () => {
    const quizzes = lsGet("quizzes", []);
    if (quizzes.length === 0) { alert("Nenhum quiz salvo."); return; }
    mostrarQuizzesProfessor();
  };
  const btnPend = document.getElementById("cardPendentes");
  if (btnPend) btnPend.onclick = painelProfessorSubmissoes;
  const btnMySubs = document.getElementById("cardMeusSubs");
  if (btnMySubs) btnMySubs.onclick = mostrarHistoricoAluno;
}

// ------------------------
// Tela inicial / escolha (CENTRADO e espaçado)
 // ------------------------
function telaInicial() {
  const container = document.getElementById("container");
  container.innerHTML = `
    <div class="central-panel" style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh;">
      <h1 style="color:var(--accent-solid); margin:0 0 18px 0;">EduQuiz</h1>
      <div style="display:flex; gap:18px; justify-content:center; margin-top:12px;">
        <button id="btnProfessor" class="btn-primary" style="padding:12px 24px; font-size:18px;">Professor</button>
        <button id="btnAluno" class="btn-accent" style="padding:12px 24px; font-size:18px;">Aluno</button>
      </div>
    </div>
  `;
  // reset any menu/hamburger
  const side = document.getElementById("sideMenu"); if (side) side.remove();
  const ham = document.getElementById("hamburger"); if (ham) ham.remove();
  const sc = document.getElementById("sideClose"); if (sc) sc.style.display = 'none';
  const overlay = document.getElementById("menuOverlay"); if (overlay) overlay.classList.remove('show');

  document.getElementById("btnProfessor").onclick = () => escolherCriarOuEntrar("professor");
  document.getElementById("btnAluno").onclick = () => escolherCriarOuEntrar("aluno");
}
function escolherCriarOuEntrar(tipo) {
  const container = document.getElementById("container");
  container.innerHTML = `
    <div class="central-panel" style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh;">
      <h2 style="color:var(--accent-solid)">${tipo === "professor" ? "Professor" : "Aluno"}</h2>
      <p>O que deseja fazer?</p>
      <div style="display:flex; gap:18px; justify-content:center; margin-top:18px;">
        <button id="btnEntrarConta" class="btn-accent" style="padding:10px 18px;">Entrar (conta existente)</button>
        <button id="btnCriarConta" class="btn-ghost" style="padding:10px 18px;">Criar Conta</button>
      </div>
      <p style="margin-top:16px;"><button id="voltarHome" class="btn-small">Voltar</button></p>
    </div>
  `;
  document.getElementById("btnEntrarConta").onclick = () => selecionarUsuario(tipo);
  document.getElementById("btnCriarConta").onclick = () => criarContaDireta(tipo);
  document.getElementById("voltarHome").onclick = telaInicial;
}

// ------------------------
// Criar conta
// ------------------------
function criarContaDireta(tipo) {
  const users = lsGet("users", { professors: [], students: [] });
  const container = document.getElementById("container");
  container.innerHTML = `
    <div class="central-panel" style="max-width:520px; margin:0 auto;">
      <h2 style="color:var(--accent-solid)">Criar Conta - ${tipo === "professor" ? "Professor" : "Aluno"}</h2>
      <label>Usuário:</label><br><input type="text" id="novoUserCriar" style="padding:10px; width:100%;"><br><br>
      <label>Senha:</label><br><input type="password" id="novoPassCriar" style="padding:10px; width:100%;"><br><br>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button id="btnCriarConf" class="btn-accent">Criar</button>
        <button id="btnVoltarCriar" class="btn-ghost">Voltar</button>
      </div>
    </div>
  `;
  document.getElementById("btnVoltarCriar").onclick = () => escolherCriarOuEntrar(tipo);
  document.getElementById("btnCriarConf").onclick = () => {
    const novo = document.getElementById("novoUserCriar").value.trim();
    const senha = document.getElementById("novoPassCriar").value;
    if (!novo || !senha) { alert("Preencha usuário e senha."); return; }
    const list = tipo === "professor" ? users.professors : users.students;
    if (list.find(x=>x.username === novo)) { alert("Usuário já existe."); return; }
    if (tipo === "professor") users.professors.push({ username: novo, password: senha });
    else users.students.push({ username: novo, password: senha });
    lsSet("users", users);
    alert(`Conta ${novo} criada. Faça login.`);
    selecionarUsuario(tipo);
  };
}

// ------------------------
// Seleção / Login (select + senha) - btnCriar leva à criação
// ------------------------
function selecionarUsuario(tipo) {
  const users = lsGet("users", { professors: [], students: [] });
  const lista = tipo === "professor" ? users.professors : users.students;
  const container = document.getElementById("container");

  let options = `<option value="">Selecione ${tipo === "professor" ? "Professor" : "Aluno"}</option>`;
  lista.forEach(u => options += `<option value="${u.username}">${u.username}</option>`);

  container.innerHTML = `
    <div class="central-panel" style="max-width:720px; margin:0 auto;">
      <h2 style="color:var(--accent-solid)">Login ${tipo === "professor" ? "Professor" : "Aluno"}</h2>
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
        <select id="usuario" class="select-white" style="padding:12px; font-weight:700;">${options}</select>
        <input type="password" id="senha" placeholder="Senha" style="padding:12px;">
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="btnEntrar" class="btn-accent" style="padding:10px 20px; font-size:16px;">Entrar</button>
          <button id="btnCriarUsuario" class="btn-small">Criar</button>
        </div>
        <div style="text-align:center;"><button id="btnVoltarEscolha" class="btn-ghost">Voltar</button></div>
      </div>
    </div>
  `;
  document.getElementById("btnVoltarEscolha").onclick = () => escolherCriarOuEntrar(tipo);
  document.getElementById("btnCriarUsuario").onclick = () => criarContaDireta(tipo);
  document.getElementById("btnEntrar").onclick = () => fazerLogin(tipo);
}

// ------------------------
// Fazer login
// ------------------------
function fazerLogin(tipo) {
  const usuarioSelect = document.getElementById("usuario") ? document.getElementById("usuario").value : "";
  const senha = document.getElementById("senha") ? document.getElementById("senha").value : "";
  const users = lsGet("users", { professors: [], students: [] });
  const lista = tipo === "professor" ? users.professors : users.students;

  const usuario = usuarioSelect;
  if (!usuario || !senha) { alert("Selecione usuário e informe a senha."); return; }

  const found = lista.find(u => u.username === usuario && u.password === senha);
  if (!found) { alert("Usuário ou senha incorretos!"); return; }

  usuarioAtual = usuario;
  usuarioRole = tipo === "professor" ? "professor" : "aluno";
  pontuacao = 0;
  renderDashboard();
}

// ------------------------
// Mostrar quizzes para aluno (se live -> apenas Entrar Sala; não mostrar Iniciar para quizzes live)
// ------------------------
function mostrarQuizzesAluno() {
  const container = document.getElementById("container");
  const quizzesSalvos = lsGet("quizzes", []);
  let html = `<h2 style="color:var(--accent-solid)">📚 Quizzes Disponíveis</h2>`;

  if (quizzesSalvos.length === 0) {
    html += `<p>Nenhum quiz disponível no momento.</p><p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
    container.innerHTML = `<div class="central-panel">${html}</div>`;
    document.getElementById("voltar").onclick = renderDashboard;
    return;
  }

  quizzesSalvos.forEach((quiz, index) => {
    const tags = (quiz.tags || []).map(t => `<span class="small-muted">${t}</span>`).join(" ");
    const liveBadge = quiz.live ? ' <strong style="color:#ffd166">[AO VIVO]</strong>' : '';
    html += `
      <div class="quiz-item" style="border:1px solid rgba(255,255,255,0.04); padding:12px; margin:12px 0; border-radius:10px;">
        <div style="flex:1;">
          <h3 style="margin:0;color:var(--accent-solid)">${quiz.nome}${liveBadge}</h3>
          <p class="small-muted" style="margin:6px 0;">${quiz.descricao || ""}</p>
          <p style="margin:6px 0;"><strong>${quiz.perguntas.length}</strong> perguntas &nbsp; ${tags}</p>
        </div>
        <div style="margin-left:12px; display:flex; flex-direction:column; gap:6px;">
          ${quiz.live ? `<button class="btn-join-live btn-ghost" data-index="${index}">Entrar Sala</button>` : `<button class="btn-iniciar btn-accent" data-index="${index}">Iniciar Quiz</button>`}
        </div>
      </div>
    `;
  });

  html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;

  document.querySelectorAll(".btn-iniciar").forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute("data-index"));
      const quizzes = lsGet("quizzes", []);
      const quizEscolhido = quizzes[index];
      if (!quizEscolhido) { alert("Erro: quiz não encontrado."); return; }
      perguntas = quizEscolhido.perguntas.map(p => ({ ...p }));
      currentQuizName = quizEscolhido.nome;
      totalPerguntas = perguntas.length;
      indicePergunta = 0;
      pontuacao = 0;
      currentSubmissionAnswers = [];
      iniciarQuiz();
    };
  });

  // live join (send join request)
  document.querySelectorAll(".btn-join-live").forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.getAttribute("data-index"));
      const quizzes = lsGet("quizzes", []);
      const quizEscolhido = quizzes[index];
      if (!quizEscolhido || !quizEscolhido.liveRoomId) { alert("Sala ao vivo não encontrada."); return; }
      // send join request
      broadcastEvent({ type: 'room_join_request', roomId: quizEscolhido.liveRoomId, student: usuarioAtual });
      // show waiting UI
      openLiveClientUI(quizEscolhido.liveRoomId);
    };
  });

  document.getElementById("voltar").onclick = renderDashboard;
}

// ------------------------
// Mostrar quizzes professor
// ------------------------
function mostrarQuizzesProfessor() {
  const container = document.getElementById("container");
  const quizzes = lsGet("quizzes", []);
  let html = `<h2 style="color:var(--accent-solid)">Quizzes</h2>`;
  if (quizzes.length === 0) {
    html += `<p>Nenhum quiz criado ainda.</p>`;
    html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
    container.innerHTML = `<div class="central-panel">${html}</div>`;
    document.getElementById("voltar").onclick = renderDashboard;
    return;
  }
  quizzes.forEach((q, idx) => {
    const liveBadge = q.live ? ' <strong style="color:#ffd166">[AO VIVO]</strong>' : '';
    html += `
      <div style="border:1px solid rgba(255,255,255,0.03); padding:8px; margin:8px 0; border-radius:8px; background: rgba(0,0,0,0.12);">
        <h3 style="margin:0;color:var(--accent-solid)">${q.nome}${liveBadge}</h3>
        <p class="small-muted">${q.descricao || ""} &nbsp; ${ (q.tags || []).map(t=>`<span class="small-muted">${t}</span>`).join(" ") }</p>
        <p style="margin:6px 0;">Perguntas: <strong>${q.perguntas.length}</strong></p>
        <div style="display:flex; gap:8px;">
          <button class="btn-iniciar-prof" data-index="${idx}">Abrir / Iniciar</button>
          ${q.live ? `<button class="btn-open-live" data-index="${idx}">Abrir Sala</button>` : ''}
        </div>
      </div>
    `;
  });
  html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltar").onclick = renderDashboard;

  document.querySelectorAll(".btn-iniciar-prof").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      const quizzes = lsGet("quizzes", []);
      const quiz = quizzes[idx];
      if (!quiz) { alert("Quiz não encontrado"); return; }
      perguntas = quiz.perguntas.map(p => ({ ...p }));
      currentQuizName = quiz.nome;
      totalPerguntas = perguntas.length;
      indicePergunta = 0;
      pontuacao = 0;
      currentSubmissionAnswers = [];
      iniciarQuiz();
    };
  });

  // abrir sala (host control)
  document.querySelectorAll(".btn-open-live").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      const quizzes = lsGet("quizzes", []);
      const quiz = quizzes[idx];
      if (!quiz) { alert("Quiz não encontrado"); return; }
      openLiveRoom(quiz);
    };
  });
}

// ------------------------
// Iniciar quiz (client-side). Abandono e layout large respected.
// ------------------------
function iniciarQuiz() {
  totalPerguntas = perguntas.length;
  if (totalPerguntas === 0) { alert("Não há perguntas carregadas para este quiz."); return; }
  if (indicePergunta >= perguntas.length) { finalizarQuiz(); return; }

  currentSubmissionAnswers = currentSubmissionAnswers || [];
  if (indicePergunta === 0) currentSubmissionAnswers = [];

  startAbandonWatch();
  quizActive = true;

  const container = document.getElementById("container");
  const perguntaAtual = perguntas[indicePergunta];

  const isLarge = !!perguntaAtual.large;

  let htmlAlternativas = "";
  if (perguntaAtual.tipo === "multipla") {
    const colorClasses = ['alt-red','alt-yellow','alt-green','alt-blue','alt-purple'];
    perguntaAtual.alternativas.forEach((alt,i) => {
      const letra = String.fromCharCode(65+i);
      const colorClass = colorClasses[i] || 'alt-blue';
      htmlAlternativas += `<button class="btn-alternativa ${colorClass}" data-alt="${alt}">${letra}) ${alt}</button>`;
    });
  } else if (perguntaAtual.tipo === "certoErrado") {
    htmlAlternativas = `<button class="btn-alternativa alt-err" data-alt="Errado">Errado</button><button class="btn-alternativa alt-correct" data-alt="Certo">Certo</button>`;
  } else if (perguntaAtual.tipo === "discursiva") {
    htmlAlternativas = `<textarea id="respostaDiscursiva" rows="6" cols="60" placeholder="Digite sua resposta..." style="width:100%; padding:10px; background: rgba(255,255,255,0.03); color:var(--text); border-radius:8px;"></textarea><br><button id="enviarDiscursiva" class="btn-accent" style="margin-top:8px;">Enviar Resposta</button>`;
  }

  const quizContainerClass = isLarge ? 'quiz-container large' : 'quiz-container';
  const alternativasClass = isLarge ? 'alternativas single-column' : 'alternativas';

  container.innerHTML = `
    <div class="central-panel">
      <div class="${quizContainerClass}">
        <div style="display:flex; justify-content: space-between; align-items:flex-start; width:100%;">
          <div class="pergunta" style="font-size:${isLarge ? 22:18}px; color:var(--text); line-height:1.4; flex:1; margin-right:12px;">${perguntaAtual.texto}</div>
          <div id="cronometro" style="font-weight:700; color:var(--accent-solid);">${perguntaAtual.tempo}</div>
        </div>
        <p style="margin:8px; color:var(--muted);">Pergunta ${indicePergunta + 1} de ${totalPerguntas}</p>

        <div id="barraProgressoContainer" style="background-color:rgba(255,255,255,0.04); width:100%; height:18px; border-radius:10px; margin:12px 0;">
          <div id="barraProgresso" style="width:0%; height:100%; border-radius:10px;"></div>
        </div>

        <div style="margin:12px 0; color:var(--text);">Pontuação: <strong id="pontuacaoAtual">${pontuacao}</strong></div>

        <div class="${alternativasClass}">${htmlAlternativas}</div>

        ${indicePergunta === perguntas.length - 1 ? '<button id="btnFinalizar" class="btn-primary" style="margin-top:12px;">Finalizar Quiz</button>' : ''}

        <p id="feedback" style="font-weight:bold; font-size:18px; height:28px; margin-top:12px;"></p>
        <p class="voltar" id="voltar" style="margin-top:12px; cursor:pointer;color:var(--muted);">Voltar</p>
      </div>
    </div>
  `;

  // cronometro
  let tempo = perguntaAtual.tempo;
  const cronometro = document.getElementById("cronometro");
  let timer = setInterval(() => {
    tempo--;
    cronometro.textContent = tempo;
    if (tempo <= 5) cronometro.classList.add("piscando");
    if (tempo <= 0) {
      clearInterval(timer);
      if (perguntaAtual.tipo === "discursiva") {
        currentSubmissionAnswers.push({ index: indicePergunta, tipo: "discursiva", texto: "", autoPoints: 0, awardedPoints: 0 });
      } else {
        currentSubmissionAnswers.push({ index: indicePergunta, tipo: perguntaAtual.tipo, selected: null, autoPoints: 0, awardedPoints: 0 });
      }
      indicePergunta++;
      iniciarQuiz();
    }
  }, 1000);

  const btnFinalizar = document.getElementById("btnFinalizar");
  if (btnFinalizar) btnFinalizar.onclick = () => { clearInterval(timer); stopAbandonWatch(); finalizarQuiz(); };

  if (perguntaAtual.tipo === "discursiva") {
    const textarea = document.getElementById("respostaDiscursiva");
    const enviarBtn = document.getElementById("enviarDiscursiva");
    textarea.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarRespostaDiscursiva(); }
    });
    enviarBtn.onclick = enviarRespostaDiscursiva;
    function enviarRespostaDiscursiva() {
      clearInterval(timer);
      const resposta = textarea.value.trim();
      let pontosAuto = 0;
      if (resposta.length > 10) pontosAuto = 10;
      currentSubmissionAnswers.push({ index: indicePergunta, tipo: "discursiva", texto: resposta, autoPoints: pontosAuto, awardedPoints: pontosAuto });
      pontuacao += pontosAuto;
      document.getElementById("pontuacaoAtual").textContent = pontuacao;
      atualizarBarraProgresso();
      setTimeout(()=> {
        indicePergunta++;
        if (indicePergunta < perguntas.length) iniciarQuiz();
        else finalizarQuiz();
      },700);
    }
    document.getElementById("voltar").onclick = () => { clearInterval(timer); stopAbandonWatch(); renderDashboard(); };
    return;
  }

  // alternatives handling
  const botoes = document.querySelectorAll(".btn-alternativa");
  const feedback = document.getElementById("feedback");
  botoes.forEach(btn => {
    btn.onclick = () => {
      botoes.forEach(b => { b.classList.add("disabled"); b.disabled = true; });
      clearInterval(timer);

      let pontos = 0;
      let selectedText = btn.getAttribute('data-alt') || btn.textContent;
      const corretaNormalized = (perguntaAtual.correta || "").toString().trim().toLowerCase();
      const selectedNormalized = (selectedText || "").toString().trim().toLowerCase();

      if (selectedNormalized && corretaNormalized && selectedNormalized === corretaNormalized) {
        btn.classList.add("correta");
        feedback.textContent = "✅ Correto!";
        pontos = 10; pontuacao += 10;
      } else {
        btn.classList.add("errada");
        feedback.textContent = "❌ Errado!";
        botoes.forEach(b => { if ((b.getAttribute('data-alt') || b.textContent).toString().trim().toLowerCase() === corretaNormalized) b.classList.add("correta"); });
      }

      currentSubmissionAnswers.push({ index: indicePergunta, tipo: perguntaAtual.tipo, selected: selectedText, autoPoints: pontos, awardedPoints: pontos });

      document.getElementById("pontuacaoAtual").textContent = pontuacao;
      atualizarBarraProgresso();

      setTimeout(()=> {
        feedback.textContent = "";
        indicePergunta++;
        if (indicePergunta < perguntas.length) iniciarQuiz();
        else finalizarQuiz();
      },1000);
    };
  });

  document.getElementById("voltar").onclick = () => { clearInterval(timer); stopAbandonWatch(); renderDashboard(); };
}

// ------------------------
// Abandon watch (>=2s) same as before
// ------------------------
function startAbandonWatch() {
  stopAbandonWatch();
  function scheduleAbandon() {
    if (abandonTimerHandle) clearTimeout(abandonTimerHandle);
    abandonTimerHandle = setTimeout(() => {
      handleAbandonment();
    }, 2000);
  }
  function cancelAbandon() {
    if (abandonTimerHandle) { clearTimeout(abandonTimerHandle); abandonTimerHandle = null; }
  }
  abandonVisibilityHandler = () => {
    if (document.visibilityState === 'hidden') scheduleAbandon();
    else cancelAbandon();
  };
  abandonBlurHandler = () => scheduleAbandon();
  abandonFocusHandler = () => cancelAbandon();

  document.addEventListener('visibilitychange', abandonVisibilityHandler);
  window.addEventListener('blur', abandonBlurHandler);
  window.addEventListener('focus', abandonFocusHandler);
}
function stopAbandonWatch() {
  if (abandonVisibilityHandler) { document.removeEventListener('visibilitychange', abandonVisibilityHandler); abandonVisibilityHandler = null; }
  if (abandonBlurHandler) { window.removeEventListener('blur', abandonBlurHandler); abandonBlurHandler = null; }
  if (abandonFocusHandler) { window.removeEventListener('focus', abandonFocusHandler); abandonFocusHandler = null; }
  if (abandonTimerHandle) { clearTimeout(abandonTimerHandle); abandonTimerHandle = null; }
}
function handleAbandonment() {
  if (!quizActive) return;
  quizActive = false;
  stopAbandonWatch();

  const submissions = lsGet("submissions", []);
  const aluno = usuarioAtual || "anonimo";
  const sub = {
    quizName: currentQuizName || ("TesteLocal_" + (new Date()).getTime()),
    aluno,
    timestamp: new Date().toISOString(),
    answers: currentSubmissionAnswers || [],
    totalPoints: 0,
    graded: true,
    autoForfeit: true,
    reason: "abandono",
    note: "Usuário saiu da aba/foi inativo por >= 2s durante o quiz."
  };
  submissions.push(sub);
  lsSet("submissions", submissions);
  recomputePontuacoesFromSubmissions();

  alert("Você saiu da página por mais de 2 segundos. Quiz finalizado com 0 pontos por abandono.");
  currentQuizName = null; perguntas = []; indicePergunta = 0; pontuacao = 0; currentSubmissionAnswers = [];
  renderDashboard();
}

// ------------------------
// Adicionar Pergunta (checkbox inline aligned, num alternatives only for multipla)
// ------------------------
function adicionarPergunta() {
  const container = document.getElementById("container");
  container.innerHTML = `
    <div class="central-panel" style="max-width:960px; margin:0 auto;">
      <h2 style="color:var(--accent-solid)">Adicionar Pergunta (Professor)</h2>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; gap:12px; align-items:center;">
          <label>Tipo de pergunta:</label>
          <select id="tipoPergunta" class="select-white" style="padding:10px; width:220px;">
            <option value="multipla">Múltipla Escolha</option>
            <option value="certoErrado">Certo ou Errado</option>
            <option value="discursiva">Discursiva</option>
          </select>
          <div class="inline-checkbox" style="margin-left:12px;">
            <input type="checkbox" id="checkQuestaoGrande">
            <label for="checkQuestaoGrande" style="margin:0">Questão grande (layout expandido)</label>
          </div>
        </div>

        <label>Pergunta:</label>
        <textarea id="textoPergunta" rows="3" style="width:100%; padding:10px;"></textarea>

        <div id="alternativasDiv">
          <label>Número de alternativas:</label>
          <select id="numAlternativas" class="select-white" style="padding:10px; width:140px;">
            <option value="3">3 (A-C)</option>
            <option value="4" selected>4 (A-D)</option>
            <option value="5">5 (A-E)</option>
          </select>

          <label>Alternativas (preencha as desejadas):</label>
          <div id="alternativasInputs"></div>
        </div>

        <label>Resposta correta (texto exato):</label>
        <input type="text" id="respostaCorreta" placeholder="Ex: Paris" style="padding:10px; width:100%; max-width:480px;">

        <label>Tempo (segundos):</label>
        <input type="number" id="tempoPergunta" value="30" min="5" style="padding:10px; width:120px;">
      </div>

      <div style="display:flex; gap:12px; margin-top:12px;">
        <button id="btnSalvarPergunta" class="btn-primary">Salvar Pergunta</button>
        <button id="btnCriarQuiz" class="btn-accent">Criar Quiz (salvar quizzes)</button>
        <button id="btnLimparConstrucao" class="btn-ghost">Limpar</button>
      </div>

      <h3 style="margin-top:18px; color:var(--accent-solid)">Perguntas do quiz em construção:</h3>
      <div id="perguntasCriadas" style="max-height:260px; overflow:auto; border:1px solid rgba(255,255,255,0.03); padding:8px; background: rgba(0,0,0,0.12);"></div>

      <p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted); margin-top:12px;">Voltar</p>
    </div>
  `;

  const tipoSelect = document.getElementById("tipoPergunta");
  const numAltSelect = document.getElementById("numAlternativas");
  const alternativasDiv = document.getElementById("alternativasDiv");
  const alternativasInputs = document.getElementById("alternativasInputs");
  const checkLarge = document.getElementById("checkQuestaoGrande");

  function renderAlternativasInputs(n) {
    alternativasInputs.innerHTML = "";
    const labels = ['A','B','C','D','E'];
    for (let i=0;i<n;i++){
      const row = document.createElement("div");
      row.style.marginBottom = "8px";
      row.innerHTML = `<input type="text" class="alternativa" placeholder="Alternativa ${labels[i]}" style="padding:10px; width:100%;">`;
      alternativasInputs.appendChild(row);
    }
  }
  renderAlternativasInputs(parseInt(numAltSelect.value || 4));

  // hide alternativasDiv unless multipla
  function updateAlternativasVisibility() {
    if (tipoSelect.value === 'multipla') {
      alternativasDiv.style.display = 'block';
      renderAlternativasInputs(parseInt(numAltSelect.value || 4));
    } else {
      alternativasDiv.style.display = 'none';
    }
  }
  updateAlternativasVisibility();

  tipoSelect.onchange = updateAlternativasVisibility;
  numAltSelect.onchange = () => renderAlternativasInputs(parseInt(numAltSelect.value));

  document.getElementById("voltar").onclick = () => renderDashboard();

  function atualizarListaPerguntas() {
    const div = document.getElementById("perguntasCriadas");
    div.innerHTML = "";
    if (quizEmConstrucao.length === 0) { div.innerHTML = "<i>Nenhuma pergunta adicionada ainda.</i>"; return; }
    quizEmConstrucao.forEach((p, i) => {
      const node = document.createElement("div");
      node.style.padding = "6px 0";
      node.innerHTML = `<strong>${i+1}.</strong> ${p.texto} <small class="small-muted">(${p.tipo}, ${p.tempo}s) ${p.large ? '— <strong>GRANDE</strong>' : ''}</small>`;
      div.appendChild(node);
    });
  }
  atualizarListaPerguntas();

  document.getElementById("btnSalvarPergunta").onclick = () => {
    const tipo = tipoSelect.value;
    const texto = document.getElementById("textoPergunta").value.trim();
    const tempo = parseInt(document.getElementById("tempoPergunta").value) || 30;
    const correta = document.getElementById("respostaCorreta").value.trim();
    const isLarge = !!checkLarge.checked;

    if (!texto) { alert("Escreva o texto da pergunta."); return; }
    if (tipo === "multipla" && !correta) { alert("Escreva a resposta correta (campo 'Resposta correta')."); return; }

    let alternativas = [];
    if (tipo === "multipla") {
      alternativas = Array.from(document.querySelectorAll(".alternativa")).map(i=>i.value.trim()).filter(x=>x);
      if (alternativas.length < 2) { alert("Coloque pelo menos 2 alternativas preenchidas."); return; }
    }

    quizEmConstruccaoPush({ tipo, texto, alternativas, correta, tempo, large: !!isLarge });
    alert("Pergunta adicionada ao quiz em construção!");
    atualizarListaPerguntas();

    document.getElementById("textoPergunta").value = "";
    document.getElementById("respostaCorreta").value = "";
    document.querySelectorAll(".alternativa").forEach(i => i.value = "");
    checkLarge.checked = false;
  };

  function quizEmConstruccaoPush(obj) {
    quizEmConstrucao.push(obj);
  }

  document.getElementById("btnCriarQuiz").onclick = () => {
    if (!quizEmConstrucao || quizEmConstrucao.length === 0) { alert("Adicione ao menos 1 pergunta antes de criar o quiz."); return; }
    const nomeQuiz = prompt("Digite um nome para o quiz:");
    if (!nomeQuiz) { alert("Nome inválido."); return; }
    const descricao = prompt("Adicione uma descrição (opcional):") || "";
    const tagsRaw = prompt("Adicione tags separadas por vírgula (opcional):") || "";
    const tags = tagsRaw.split(",").map(t=>t.trim()).filter(Boolean);

    const isLive = confirm("Criar este quiz como AO VIVO (sincronizado entre abas)? OK = Sim, Cancel = Não");

    const stored = lsGet("quizzes", []);
    let finalName = nomeQuiz;
    let idx = 1;
    while (stored.find(q=>q.nome === finalName)) { finalName = `${nomeQuiz} (${idx++})`; }

    const quizObj = { nome: finalName, descricao, tags, perguntas: quizEmConstrucao.map(p=>({...p})), createdBy: usuarioAtual, createdAt: new Date().toISOString(), live: !!isLive };
    if (isLive) {
      const roomId = `room_${Date.now()}_${Math.floor(Math.random()*9999)}`;
      quizObj.live = true;
      quizObj.liveRoomId = roomId;
      const liveRooms = lsGet("liveRooms", {}) || {};
      liveRooms[roomId] = { roomId, quizName: finalName, host: usuarioAtual, state: 'idle', participants: [], waitingRequests: [], meta: {} };
      lsSet("liveRooms", liveRooms);
    }

    stored.push(quizObj);
    lsSet("quizzes", stored);
    alert(`Quiz "${finalName}" criado com ${quizEmConstrucao.length} perguntas e salvo.`);
    quizEmConstrucao = [];
    atualizarListaPerguntas();
  };

  document.getElementById("btnLimparConstrucao").onclick = () => {
    if (!confirm("Limpar perguntas em construção?")) return;
    quizEmConstrucao = [];
    atualizarListaPerguntas();
  };
}

// ------------------------
// registrarPontuacaoLocal (kept)
function registrarPontuacaoLocal(aluno, pontos) {
  if (!aluno) aluno = "anonimo";
  let ponts = lsGet("pontuacoes", {}) || {};
  const prev = parseFloat(ponts[aluno]) || 0;
  pontos = parseFloat(pontos) || 0;
  ponts[aluno] = prev + pontos;
  lsSet("pontuacoes", ponts);
}

// ------------------------
// finalizarQuiz (save submission and recompute)
function finalizarQuiz() {
  stopAbandonWatch();
  quizActive = false;

  const submissions = lsGet("submissions", []);
  const aluno = usuarioAtual || "anonimo";
  const total = (currentSubmissionAnswers || []).reduce((s, a) => s + (a.awardedPoints || 0), 0);
  const sub = { quizName: currentQuizName || ("TesteLocal_" + (new Date()).getTime()), aluno, timestamp: new Date().toISOString(), answers: currentSubmissionAnswers || [], totalPoints: total, graded: false };
  submissions.push(sub);
  lsSet("submissions", submissions);
  recomputePontuacoesFromSubmissions();

  const container = document.getElementById("container");
  container.innerHTML = `
    <div class="central-panel" style="text-align:center;">
      <h2 style="color:var(--accent-solid)">Quiz finalizado!</h2>
      <p>${usuarioAtual || "Aluno"}, sua pontuação total (auto) foi <strong>${total}</strong> pontos.</p>
      <div style="display:flex; gap:12px; justify-content:center; margin-top:12px;">
        <button id="verRanking" class="btn-accent">Ver Ranking</button>
        <button id="reiniciar" class="btn-ghost">Jogar novamente</button>
      </div>
      <p style="margin-top:12px;"><span class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</span></p>
    </div>
  `;
  document.getElementById("verRanking").onclick = mostrarRanking;
  document.getElementById("reiniciar").onclick = () => {
    indicePergunta = 0; pontuacao = 0; currentSubmissionAnswers = []; iniciarQuiz();
  };
  document.getElementById("voltar").onclick = renderDashboard;

  currentQuizName = null; perguntas = []; indicePergunta = 0; pontuacao = 0; currentSubmissionAnswers = [];
}

// ------------------------
// atualizarBarraProgresso
function atualizarBarraProgresso() {
  const barra = document.getElementById("barraProgresso");
  if (!barra) return;
  const pontosTotais = (totalPerguntas || 1) * 10;
  const percentual = (pontuacao / pontosTotais) * 100;
  barra.style.width = percentual + "%";
}

// ------------------------
// Painel de submissões / correção (fix: buttons color & "Ver tentativas" style)
function painelProfessorSubmissoes() {
  const container = document.getElementById("container");
  const quizzes = lsGet("quizzes", []);
  let html = `<h2 style="color:var(--accent-solid)">Submissões & Correções</h2>`;
  if (quizzes.length === 0) {
    html += `<p>Nenhum quiz criado ainda.</p><p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
    container.innerHTML = `<div class="central-panel">${html}</div>`;
    document.getElementById("voltar").onclick = () => renderDashboard();
    return;
  }

  quizzes.forEach((q, idx) => {
    html += `
      <div style="border:1px solid rgba(255,255,255,0.03); padding:8px; margin:8px 0; border-radius:8px; background: rgba(0,0,0,0.12);">
        <h3 style="margin:0;color:var(--accent-solid)">${q.nome}</h3>
        <p class="small-muted">${q.descricao || ""} &nbsp; ${ (q.tags || []).map(t=>`<span class="small-muted">${t}</span>`).join(" ") }</p>
        <p style="margin:6px 0;">Perguntas: <strong>${q.perguntas.length}</strong></p>
        <div style="display:flex; gap:8px;">
          <button class="btn-ver-submissions btn-small" data-index="${idx}">Ver Submissões</button>
          ${q.live ? `<button class="btn-open-live" data-index="${idx}">Abrir Sala</button>` : ''}
        </div>
      </div>
    `;
  });

  html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltar").onclick = () => renderDashboard();

  document.querySelectorAll(".btn-ver-submissions").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      verSubmissoesDoQuiz(lsGet("quizzes", [])[idx]);
    };
  });

  document.querySelectorAll(".btn-open-live").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      const quizzes = lsGet("quizzes", []);
      const quiz = quizzes[idx];
      if (!quiz) { alert("Quiz não encontrado"); return; }
      openLiveRoom(quiz);
    };
  });
}

// ------------------------
// verSubmissoesDoQuiz - left: alunos (ver tentativas now uses btn-small) ; right: submissions list with correction button (white bg + dark text corrected)
function verSubmissoesDoQuiz(quiz) {
  if (!quiz) { alert("Quiz inválido."); return; }
  recomputePontuacoesFromSubmissions();
  const submissions = lsGet("submissions", []).filter(s => s.quizName === quiz.nome) || [];
  const container = document.getElementById("container");

  const soma = submissions.reduce((acc,s)=> acc + (parseFloat(s.totalPoints)||0), 0);
  const mediaQuiz = submissions.length ? (soma / submissions.length).toFixed(2) : "—";

  const porAluno = {};
  submissions.forEach(s => {
    const a = s.aluno || "anonimo";
    if (!porAluno[a]) porAluno[a] = [];
    porAluno[a].push(s);
  });
  const alunos = Object.keys(porAluno).sort();

  let leftHtml = `<h3 style="color:var(--accent-solid)">Alunos (${alunos.length})</h3>`;
  leftHtml += `<div class="small-muted">Média do quiz: <strong>${mediaQuiz}</strong></div><br>`;
  leftHtml += `<div>`;
  if (alunos.length === 0) leftHtml += `<div class="small-muted">Nenhuma submissão.</div>`;
  alunos.forEach(a => {
    const tentativas = porAluno[a];
    const somaAluno = tentativas.reduce((acc,t)=> acc + (parseFloat(t.totalPoints)||0),0);
    const mediaAluno = (tentativas.length ? (somaAluno / tentativas.length).toFixed(2) : "—");
    leftHtml += `<div style="padding:6px; border-radius:6px; margin-bottom:8px; background:#fff; color:var(--bg);">
      <strong>${a}</strong><div class="small-muted">Tentativas: ${tentativas.length} — Média: ${mediaAluno}</div>
      <div style="margin-top:6px;"><button class="btn-small btn-open-aluno-quiz" data-aluno="${a}">Ver tentativas</button></div>
    </div>`;
  });
  leftHtml += `</div>`;

  let rightHtml = `<h3 style="color:var(--accent-solid)">Todas as Submissões - ${quiz.nome}</h3>`;
  if (submissions.length === 0) {
    rightHtml += `<p>Nenhuma submissão ainda.</p>`;
  } else {
    submissions.slice().sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)).forEach((s,idx) => {
      const flag = s.autoForfeit ? '<span style="color:#ef6c6c;font-weight:700;">(ABANDONO)</span>' : '';
      rightHtml += `<div style="padding:8px; margin-bottom:8px; border-radius:6px; background:#fff; color:var(--bg);">
        <p><strong>Aluno:</strong> ${s.aluno} <span class="small-muted">(${new Date(s.timestamp).toLocaleString()})</span> ${flag}</p>
        <p><strong>Pontos:</strong> <span id="sub-total-${idx}">${s.totalPoints}</span></p>
        <button class="btn-open-sub btn-abrir-sub btn-small-alt" data-quiz="${quiz.nome}" data-timestamp="${s.timestamp}" data-aluno="${s.aluno}">Abrir / Corrigir</button>
      </div>`;
    });
  }

  container.innerHTML = `<div class="central-panel">
    <div class="submissions-panel">
      <div class="submissions-left">${leftHtml}</div>
      <div class="submissions-right">${rightHtml}</div>
    </div>
    <p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted); margin-top:12px;">Voltar</p>
  </div>`;

  document.getElementById("voltar").onclick = painelProfessorSubmissoes;

  document.querySelectorAll(".btn-abrir-sub").forEach(btn => {
    btn.onclick = () => {
      const ts = btn.getAttribute("data-timestamp"), aluno = btn.getAttribute("data-aluno"), qname = btn.getAttribute("data-quiz");
      const subs = lsGet("submissions", []).filter(s => s.quizName === qname && s.timestamp === ts && s.aluno === aluno);
      if (subs.length) abrirSubmissao(quiz, subs[0]);
      else alert("Submissão não encontrada.");
    };
  });

  document.querySelectorAll(".btn-open-aluno-quiz").forEach(btn => {
    btn.onclick = () => {
      const aluno = btn.getAttribute("data-aluno");
      const tentativas = (lsGet("submissions", []) || []).filter(s => s.aluno === aluno && s.quizName === quiz.nome).slice().sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
      const rightDiv = document.querySelector(".submissions-right");
      if (!rightDiv) return;
      let html = `<h3 style="color:var(--accent-solid)">Tentativas de ${aluno} - ${quiz.nome}</h3>`;
      if (tentativas.length === 0) html += `<p>Nenhuma tentativa deste aluno para este quiz.</p>`;
      tentativas.forEach((s,idx) => {
        const flag = s.autoForfeit ? '<span style="color:#ef6c6c;font-weight:700;">(ABANDONO)</span>' : '';
        html += `<div style="padding:8px; margin-bottom:8px; border-radius:6px; background:#fff; color:var(--bg);">
          <p><strong>${new Date(s.timestamp).toLocaleString()}</strong> ${flag}</p>
          <p><strong>Pontos:</strong> ${s.totalPoints}</p>
          <button class="btn-abrir-sub btn-small-alt" data-quiz="${quiz.nome}" data-timestamp="${s.timestamp}" data-aluno="${aluno}">Abrir / Corrigir</button>
        </div>`;
      });
      rightDiv.innerHTML = html;
      rightDiv.querySelectorAll(".btn-abrir-sub").forEach(btn2 => {
        btn2.onclick = () => {
          const ts = btn2.getAttribute("data-timestamp"), aluno = btn2.getAttribute("data-aluno"), qname = btn2.getAttribute("data-quiz");
          const subs = lsGet("submissions", []).filter(s => s.quizName === qname && s.timestamp === ts && s.aluno === aluno);
          if (subs.length) abrirSubmissao(quiz, subs[0]);
          else alert("Submissão não encontrada.");
        };
      });
    };
  });
}

// ------------------------
// abrirSubmissao (correção) — uses correction-box and inputs legíveis
function abrirSubmissao(quiz, submission) {
  const container = document.getElementById("container");
  let html = `<h2 style="color:var(--accent-solid)">Corrigir: ${quiz.nome}</h2>`;
  html += `<p><strong>Aluno:</strong> ${submission.aluno} <span class="small-muted">(${new Date(submission.timestamp).toLocaleString()})</span></p>`;
  if (submission.autoForfeit) {
    html += `<div style="padding:10px; border-radius:8px; background: rgba(239,108,108,0.08); color:#ef6c6c; font-weight:700;">Motivo: ${submission.reason || 'abandono'} — ${submission.note || ''}</div><br>`;
  }
  html += `<div class="correction-box">`;

  submission.answers.forEach((ans, i) => {
    html += `<div style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed rgba(0,0,0,0.06);">`;
    html += `<p><strong>Pergunta ${i+1} (${ans.tipo})</strong></p>`;
    if (ans.tipo === "discursiva") {
      html += `<p style="color:var(--bg)">${ans.texto || "<i>Resposta vazia</i>"}</p>`;
      html += `<label>AutoPoints: ${ans.autoPoints || 0}</label><br>`;
      html += `Atribuir pontos: <input type="number" id="grade-${i}" value="${ans.awardedPoints||0}" min="0" max="10">`;
    } else {
      html += `<p style="color:var(--bg)">Resposta do aluno: <em>${ans.selected||"<nenhuma>"}</em></p>`;
      html += `<p class="small-muted" style="color:rgba(0,0,0,0.6)">AutoPoints (calculado): ${ans.autoPoints || 0}</p>`;
      html += `Ajustar (se quiser): <input type="number" id="grade-${i}" value="${ans.awardedPoints||ans.autoPoints||0}" min="0" max="10">`;
    }
    html += `</div>`;
  });

  html += `</div>`;
  html += `<p><strong>Total atual:</strong> <span id="display-total">${submission.totalPoints}</span></p>`;
  html += `<div style="display:flex; gap:8px;"><button id="btnSalvarCorrecao" class="btn-accent">Salvar Correção</button> <button id="btnVoltarCorrecoes" class="btn-ghost">Voltar</button></div>`;

  container.innerHTML = `<div class="central-panel">${html}</div>`;

  document.getElementById("btnVoltarCorrecoes").onclick = painelProfessorSubmissoes;

  document.getElementById("btnSalvarCorrecao").onclick = () => {
    const submissions = lsGet("submissions", []);
    const indexInStorage = submissions.findIndex(s => s.timestamp === submission.timestamp && s.aluno === submission.aluno && s.quizName === submission.quizName);
    if (indexInStorage === -1) { alert("Submissão não encontrada (erro)."); return; }

    let novoTotal = 0;
    submission.answers.forEach((ans, i) => {
      const el = document.getElementById(`grade-${i}`);
      const v = el ? parseInt(el.value) || 0 : (ans.awardedPoints || 0);
      ans.awardedPoints = v;
      novoTotal += v;
    });

    submission.totalPoints = novoTotal;
    submission.graded = true;

    submissions[indexInStorage] = submission;
    lsSet("submissions", submissions);

    // recompute pontuações
    recomputePontuacoesFromSubmissions();

    alert("Correção salva. Pontuação do aluno atualizada.");
    const quizzes = lsGet("quizzes", []);
    const quizMeta = quizzes.find(q=>q.nome===submission.quizName) || { nome: submission.quizName };
    verSubmissoesDoQuiz(quizMeta);
  };
}

// ------------------------
// Histórico do aluno
function mostrarHistoricoAluno() {
  const container = document.getElementById("container");
  const subs = lsGet("submissions", []).filter(s => s.aluno === usuarioAtual);
  let html = `<h2 style="color:var(--accent-solid)">Meu Histórico - ${usuarioAtual}</h2>`;
  if (!subs || subs.length === 0) {
    html += `<p>Você ainda não realizou nenhum quiz.</p>`;
    html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
    container.innerHTML = `<div class="central-panel">${html}</div>`;
    document.getElementById("voltar").onclick = () => renderDashboard();
    return;
  }

  const somaTotal = subs.reduce((a,s)=> a + (parseFloat(s.totalPoints)||0), 0);
  const mediaTotal = (subs.length ? (somaTotal / subs.length).toFixed(2) : "—");

  const porQuiz = {};
  subs.forEach(s => {
    if (!porQuiz[s.quizName]) porQuiz[s.quizName] = [];
    porQuiz[s.quizName].push(s);
  });

  html += `<div class="small-muted">Média total (todas tentativas): <strong>${mediaTotal}</strong></div><br>`;
  html += `<div style="max-height:60vh; overflow:auto;">`;
  Object.keys(porQuiz).forEach(qname => {
    const arr = porQuiz[qname];
    const soma = arr.reduce((a,b)=> a + (parseFloat(b.totalPoints)||0), 0);
    const media = arr.length ? (soma / arr.length).toFixed(2) : "—";
    html += `<div style="border:1px solid rgba(255,255,255,0.03); padding:8px; margin:8px 0; border-radius:8px; background: rgba(0,0,0,0.08);">
      <p><strong>Quiz:</strong> ${qname} <span class="small-muted">(${arr.length} tentativas)</span></p>
      <p><strong>Média neste quiz:</strong> ${media}</p>
      <button class="btn-view-sub btn-small" data-quiz="${qname}">Ver tentativas</button>
    </div>`;
  });
  html += `</div><p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;

  document.querySelectorAll(".btn-view-sub").forEach((btn,i) => {
    btn.onclick = () => {
      const qname = btn.getAttribute("data-quiz");
      const arr = lsGet("submissions", []).filter(s => s.aluno === usuarioAtual && s.quizName === qname).slice().sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
      let html2 = `<h2 style="color:var(--accent-solid)">Tentativas de ${usuarioAtual} - ${qname}</h2>`;
      if (!arr || arr.length === 0) html2 += `<p>Sem tentativas.</p>`;
      arr.forEach(s => {
        const status = s.graded ? '<span class="small-muted">(corrigido)</span>' : '<span class="small-muted">(não corrigido)</span>';
        html2 += `<div style="border:1px solid rgba(255,255,255,0.03); padding:8px; margin:8px 0; border-radius:6px; background:#fff; color:var(--bg);">
          <p><strong>${new Date(s.timestamp).toLocaleString()}</strong> ${status}</p>
          <p><strong>Pontos:</strong> ${s.totalPoints}</p>
          <button class="btn-open-my-sub btn-small-alt" data-ts="${s.timestamp}" data-quiz="${qname}">Ver Detalhes</button>
        </div>`;
      });
      html2 += `<p class="voltar" id="voltarDetalhes" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
      document.querySelector(".central-panel").innerHTML = html2;
      document.getElementById("voltarDetalhes").onclick = mostrarHistoricoAluno;

      document.querySelectorAll(".btn-open-my-sub").forEach(b => {
        b.onclick = () => {
          const ts = b.getAttribute("data-ts");
          const sub = lsGet("submissions", []).find(x=> x.timestamp === ts && x.aluno === usuarioAtual && x.quizName === qname);
          if (sub) visualizarSubmissaoAluno(sub);
          else alert("Submissão não encontrada.");
        };
      });
    };
  });

  document.getElementById("voltar").onclick = () => renderDashboard();
}

function visualizarSubmissaoAluno(submission) {
  const container = document.getElementById("container");
  let html = `<h2 style="color:var(--accent-solid)">Detalhes - ${submission.quizName}</h2>`;
  html += `<p><strong>Aluno:</strong> ${submission.aluno} <span class="small-muted">(${new Date(submission.timestamp).toLocaleString()})</span></p>`;
  if (submission.autoForfeit) {
    html += `<div style="padding:10px; border-radius:8px; background: rgba(239,108,108,0.06); color:#ef6c6c; font-weight:700;">Motivo: ${submission.reason || 'abandono'}</div><br>`;
  }
  html += `<div class="correction-box">`;
  submission.answers.forEach((ans,i) => {
    html += `<div style="margin-bottom:8px; padding-bottom:6px; border-bottom:1px dashed rgba(0,0,0,0.06);">`;
    html += `<p><strong>Pergunta ${i+1} (${ans.tipo})</strong></p>`;
    if (ans.tipo === "discursiva") {
      html += `<p style="color:var(--bg)">${ans.texto || "<i>Resposta vazia</i>"}</p>`;
      html += `<p class="small-muted">AutoPoints: ${ans.autoPoints || 0} | Pontos atribuídos: ${ans.awardedPoints||0}</p>`;
    } else {
      html += `<p style="color:var(--bg)">Resposta: <em>${ans.selected||"<nenhuma>"}</em></p>`;
      html += `<p class="small-muted" style="color:rgba(0,0,0,0.6)">AutoPoints: ${ans.autoPoints || 0}</p>`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  html += `<p><strong>Total:</strong> ${submission.totalPoints}</p>`;
  html += `<p><button id="voltarHist" class="btn-ghost">Voltar</button></p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltarHist").onclick = mostrarHistoricoAluno;
}

// ------------------------
// Alterar senha & mostrar tabela alunos (entrarNoAluno)
function alterarSenhaTela(tipo, username) {
  const container = document.getElementById("container");
  const users = lsGet("users", { professors: [], students: [] });
  let isProf = tipo === 'professor';
  const userToEdit = username || usuarioAtual;
  container.innerHTML = `
    <div class="central-panel" style="max-width:520px; margin:0 auto;">
      <h2 style="color:var(--accent-solid)">Alterar Senha - ${userToEdit}</h2>
      <label>Senha atual:</label><br><input type="password" id="oldPass"><br><br>
      <label>Nova senha:</label><br><input type="password" id="newPass"><br><br>
      <label>Confirmar nova senha:</label><br><input type="password" id="confirmPass"><br><br>
      <div style="display:flex; gap:8px; justify-content:center;">
        <button id="btnSalvarSenha" class="btn-accent">Salvar</button>
        <button id="btnVoltarConta" class="btn-ghost">Voltar</button>
      </div>
    </div>
  `;
  document.getElementById("btnVoltarConta").onclick = () => { renderDashboard(); };
  document.getElementById("btnSalvarSenha").onclick = () => {
    const oldP = document.getElementById("oldPass").value;
    const newP = document.getElementById("newPass").value;
    const conf = document.getElementById("confirmPass").value;
    if (!oldP || !newP) { alert("Preencha os campos."); return; }
    if (newP !== conf) { alert("Nova senha e confirmação não batem."); return; }
    const usersData = lsGet("users", { professors: [], students: [] });
    const list = isProf ? usersData.professors : usersData.students;
    const idx = list.findIndex(u => u.username === userToEdit);
    if (idx === -1) { alert("Usuário não encontrado."); return; }
    if (list[idx].password !== oldP) { alert("Senha atual incorreta."); return; }
    list[idx].password = newP;
    if (isProf) usersData.professors = list; else usersData.students = list;
    lsSet("users", usersData);
    alert("Senha alterada com sucesso.");
    renderDashboard();
  };
}

function mostrarTabelaAlunos() {
  recomputePontuacoesFromSubmissions();
  const container = document.getElementById("container");
  const usersData = lsGet("users", { professors: [], students: [] });
  const students = usersData.students || [];
  const ponts = lsGet("pontuacoes", {});
  const studentsWithPoints = students.map(s => ({ username: s.username, points: parseFloat(ponts[s.username]) || 0 }));
  studentsWithPoints.sort((a,b)=> b.points - a.points);
  const list = studentsWithPoints.slice(0,30);

  let soma = list.reduce((acc,s)=> acc + (s.points || 0), 0);
  const media = list.length ? (soma / list.length).toFixed(2) : 0;

  let html = `<h2 style="color:var(--accent-solid)">Alunos (top ${list.length})</h2>`;
  html += `<div class="stat-box" style="background:linear-gradient(90deg,#10B981,#06B6D4); color:#012; padding:10px; border-radius:10px; display:inline-block;">Média de pontos (mostrados): <strong>${media}</strong></div>`;
  html += `<table style="width:100%; margin-top:12px; color:var(--text);"><thead><tr><th>#</th><th>Aluno</th><th>Pontos</th><th>Ações</th></tr></thead><tbody>`;
  list.forEach((s, idx) => {
    html += `<tr>
      <td>${idx+1}</td>
      <td>${s.username}</td>
      <td id="pts-${s.username}">${s.points}</td>
      <td><button class="btn-small" data-user="${s.username}" onclick="entrarNoAluno(this.getAttribute('data-user'))">Entrar</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `<p style="margin-top:10px;"><button id="voltarTabela" class="btn-ghost">Voltar</button></p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltarTabela").onclick = () => renderDashboard();
}

// entrarNoAluno
window.entrarNoAluno = function(username) {
  const submissions = lsGet("submissions", []).filter(s => s.aluno === username);
  let html = `<h2 style="color:var(--accent-solid)">Aluno: ${username}</h2>`;
  if (!submissions || submissions.length === 0) {
    html += `<p>Sem submissões.</p><p class="voltar" id="voltarHistorico" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
    document.getElementById("container").innerHTML = `<div class="central-panel">${html}</div>`;
    document.getElementById("voltarHistorico").onclick = mostrarTabelaAlunos;
    return;
  }

  const somaTotal = submissions.reduce((a,b)=> a + (parseFloat(b.totalPoints)||0), 0);
  const mediaTotal = submissions.length ? (somaTotal / submissions.length).toFixed(2) : "—";

  const porQuiz = {};
  submissions.forEach(s => { if (!porQuiz[s.quizName]) porQuiz[s.quizName]=[]; porQuiz[s.quizName].push(s); });

  html += `<div class="small-muted">Média total do aluno (todas tentativas): <strong>${mediaTotal}</strong></div><br>`;
  Object.keys(porQuiz).forEach(q => {
    const arr = porQuiz[q];
    const somaQ = arr.reduce((a,b)=> a + (parseFloat(b.totalPoints)||0), 0);
    const mediaQ = arr.length ? (somaQ / arr.length).toFixed(2) : "—";
    html += `<div style="border:1px solid rgba(255,255,255,0.03); padding:8px; margin:8px 0; border-radius:6px; background:#fff; color:var(--bg);">
      <p><strong>Quiz:</strong> ${q}</p>
      <p><strong>Média neste quiz:</strong> ${mediaQ} (${arr.length} tentativas)</p>
      <button class="btn-open-student-quiz btn-small" data-user="${username}" data-quiz="${q}">Ver tentativas</button>
    </div>`;
  });

  html += `<p class="voltar" id="voltarHistorico" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
  document.getElementById("container").innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltarHistorico").onclick = mostrarTabelaAlunos;

  document.querySelectorAll(".btn-open-student-quiz").forEach(btn => {
    btn.onclick = () => {
      const user = btn.getAttribute("data-user"), q = btn.getAttribute("data-quiz");
      const arr = lsGet("submissions", []).filter(s => s.aluno === user && s.quizName === q).slice().sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
      let html2 = `<h3 style="color:var(--accent-solid)">Tentativas de ${user} - ${q}</h3>`;
      arr.forEach(s => {
        html2 += `<div style="padding:8px; margin-bottom:8px; border-radius:6px; background:#fff; color:var(--bg);">
          <p><strong>${new Date(s.timestamp).toLocaleString()}</strong></p>
          <p><strong>Pontos:</strong> ${s.totalPoints}</p>
          <button class="btn-open-this-sub btn-small" data-ts="${s.timestamp}" data-user="${user}" data-quiz="${q}">Abrir</button>
        </div>`;
      });
      html2 += `<p class="voltar" id="voltarVoltar" style="cursor:pointer;color:var(--muted);">Voltar</p>`;
      document.querySelector(".central-panel").innerHTML = html2;
      document.getElementById("voltarVoltar").onclick = () => entrarNoAluno(username);

      document.querySelectorAll(".btn-open-this-sub").forEach(b => {
        b.onclick = () => {
          const ts = b.getAttribute("data-ts");
          const sub = lsGet("submissions", []).find(x=> x.timestamp === ts && x.aluno === user && x.quizName === q);
          if (sub) abrirSubmissao({nome:q}, sub);
          else alert("Submissão não encontrada.");
        };
      });
    };
  });
};

// ------------------------
// Ranking (filter global or per quiz) - ensure select has class select-white (text dark on white)
function mostrarRanking() {
  recomputePontuacoesFromSubmissions();
  const container = document.getElementById("container");
  const ponts = lsGet("pontuacoes", {});
  const quizzes = lsGet("quizzes", []);
  let selectHtml = `<select id="rankingFilter" class="select-white" style="padding:10px; border-radius:8px; margin-bottom:12px;"><option value="__global__">Geral (todas submissões)</option>`;
  quizzes.forEach(q => selectHtml += `<option value="${escapeHtml(q.nome)}">${escapeHtml(q.nome)}</option>`);
  selectHtml += `</select>`;

  let html = `<h2 style="color:var(--accent-solid)">🏆 Ranking</h2>`;
  html += `<div>${selectHtml}</div>`;
  html += `<div id="rankingResults" style="margin-top:12px;"></div>`;
  html += `<div style="margin-top:12px;"><button id="voltarRank" class="btn-ghost">Voltar</button></div>`;

  container.innerHTML = `<div class="central-panel">${html}</div>`;
  document.getElementById("voltarRank").onclick = () => renderDashboard();
  document.getElementById("rankingFilter").onchange = () => renderRankingResults(document.getElementById("rankingFilter").value);
  renderRankingResults("__global__");

  function renderRankingResults(filter) {
    const resultsDiv = document.getElementById("rankingResults");
    if (!resultsDiv) return;
    let entries = [];
    if (filter === "__global__") {
      entries = Object.entries(ponts).map(([n,p])=>({ name:n, points: p || 0 }));
      entries.sort((a,b)=> b.points - a.points);
    } else {
      const subs = lsGet("submissions", []).filter(s => s.quizName === filter);
      const map = {};
      subs.forEach(s => {
        const n = s.aluno || 'anonimo';
        map[n] = (map[n] || 0) + (parseFloat(s.totalPoints)||0);
      });
      entries = Object.keys(map).map(k=>({ name:k, points: map[k] }));
      entries.sort((a,b)=> b.points - a.points);
    }

    if (!entries || entries.length === 0) {
      resultsDiv.innerHTML = `<p>Nenhum resultado para esse filtro.</p>`;
      return;
    }

    const medals = [
      { emoji: '🥇', style: 'color:#D4AF37; font-size:20px;' },
      { emoji: '🥈', style: 'color:#C0C0C0; font-size:18px;' },
      { emoji: '🥉', style: 'color:#CD7F32; font-size:16px;' }
    ];
    let out = `<div style="display:flex; gap:12px; align-items:flex-end;">`;
    for (let i=0;i<3;i++) {
      const e = entries[i];
      if (!e) {
        out += `<div style="flex:1; padding:12px; border-radius:8px; background: rgba(255,255,255,0.06);"><div style="font-size:18px; color:var(--muted)">—</div></div>`;
      } else {
        out += `<div style="flex:1; padding:12px; border-radius:8px; background: linear-gradient(180deg,#fff,#f2f6f8); color:var(--bg); text-align:center;">
          <div style="${medals[i].style}">${medals[i].emoji}</div>
          <div style="font-weight:800; font-size:18px; margin-top:6px">${escapeHtml(e.name)}</div>
          <div class="small-muted">${e.points} pts</div>
        </div>`;
      }
    }
    out += `</div>`;

    out += `<div style="margin-top:12px;"><h4 style="margin:0;color:var(--accent-solid)">Próximos colocados</h4><ol>`;
    entries.slice(3,12).forEach(row => out += `<li>${escapeHtml(row.name)} — ${row.points} pts</li>`);
    out += `</ol></div>`;

    resultsDiv.innerHTML = out;
  }
}

// ------------------------
// UTIL
function escapeHtml(s) {
  if (!s) return '';
  return s.toString().replace(/[&<>"']/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
  });
}

// ------------------------
// LIVE: storage broadcasting & handlers (with countdown animation)

// broadcast via localStorage
function broadcastEvent(obj) {
  try {
    const ev = { payload: obj, ts: Date.now(), sender: usuarioAtual || 'anon' };
    localStorage.setItem(LIVE_BROADCAST_KEY, JSON.stringify(ev));
  } catch (e) { console.error("broadcast failed", e); }
}

window.addEventListener('storage', (ev) => {
  if (!ev.key) return;
  if (ev.key === LIVE_BROADCAST_KEY && ev.newValue) {
    try {
      const data = JSON.parse(ev.newValue);
      const payload = data.payload;
      handleIncomingLiveEvent(payload);
    } catch (e) { console.error("invalid live event", e); }
  }
});

function handleIncomingLiveEvent(payload) {
  if (!payload || !payload.type) return;
  if (payload.type === 'room_update') {
    const liveRooms = lsGet("liveRooms", {}) || {};
    if (payload.roomId && payload.update) {
      liveRooms[payload.roomId] = Object.assign(liveRooms[payload.roomId] || {}, payload.update);
      if (payload.update.waitingRequests) liveRooms[payload.roomId].waitingRequests = payload.update.waitingRequests;
      if (payload.update.participants) liveRooms[payload.roomId].participants = payload.update.participants;
      lsSet("liveRooms", liveRooms);
    }
  } else if (payload.type === 'room_join_request') {
    if (!payload.roomId) return;
    const liveRooms = lsGet("liveRooms", {}) || {};
    const room = liveRooms[payload.roomId];
    if (room && room.host === usuarioAtual) {
      room.waitingRequests = room.waitingRequests || [];
      if (!room.waitingRequests.includes(payload.student) && !room.participants.includes(payload.student)) {
        room.waitingRequests.push(payload.student);
        liveRooms[payload.roomId] = room;
        lsSet("liveRooms", liveRooms);
        broadcastEvent({ type: 'room_update', roomId: payload.roomId, update: { waitingRequests: room.waitingRequests } });
      }
    }
  } else if (payload.type === 'room_join_approved') {
    const liveRooms = lsGet("liveRooms", {}) || {};
    if (payload.roomId) {
      liveRooms[payload.roomId] = liveRooms[payload.roomId] || {};
      liveRooms[payload.roomId].participants = payload.participants || [];
      liveRooms[payload.roomId].waitingRequests = payload.waitingRequests || [];
      lsSet("liveRooms", liveRooms);
    }
  } else if (payload.type === 'room_countdown') {
    // show big countdown to students (all participants)
    if (payload.roomId && payload.startAt) {
      // Start countdown overlay with animation
      showCountdownOverlay(Math.max(0, payload.startAt - Date.now()));
    }
  } else if (payload.type === 'room_start') {
    if (payload.roomId && payload.quizName && payload.startAt) {
      const liveRooms = lsGet("liveRooms", {}) || {};
      const room = liveRooms[payload.roomId];
      if (room) {
        room.state = 'started';
        lsSet("liveRooms", liveRooms);
        if (usuarioRole === 'aluno') {
          const joined = (room.participants || []).includes(usuarioAtual);
          if (joined) {
            openLiveClientUI(payload.roomId);
          }
        }
      }
    }
  } else if (payload.type === 'room_question') {
    if (usuarioRole === 'aluno') {
      const lr = lsGet("liveRooms", {}) || {};
      const room = lr[payload.roomId];
      if (room && (room.participants || []).includes(usuarioAtual)) {
        openLiveClientQuestion(payload.roomId, payload);
      }
    }
  } else if (payload.type === 'room_answer') {
    const liveRooms = lsGet("liveRooms", {}) || {};
    const room = liveRooms[payload.roomId];
    if (room && room.host === usuarioAtual) {
      room.meta = room.meta || {};
      room.meta.answers = room.meta.answers || {};
      room.meta.answers[payload.questionIndex] = room.meta.answers[payload.questionIndex] || [];
      room.meta.answers[payload.questionIndex].push({
        student: payload.student,
        selected: payload.selected,
        correct: payload.correct,
        timeMs: payload.timeMs,
        ts: Date.now()
      });
      liveRooms[payload.roomId] = room;
      lsSet("liveRooms", liveRooms);
    }
  } else if (payload.type === 'room_scores_snapshot') {
    if (payload.roomId && payload.snapshot) {
      if (usuarioRole === 'aluno') {
        showLeaderboardBrief(payload.snapshot);
      }
    }
  } else if (payload.type === 'room_end') {
    if (payload.roomId && payload.podium) {
      showFinalPodium(payload.podium);
    }
  }
}

function getLocalLiveRoom(roomId) {
  const liveRooms = lsGet("liveRooms", {}) || {};
  return liveRooms[roomId];
}

// ------------------------
// Host opens live room UI (approve/waiting) - unchanged flow but with countdown start
function openLiveRoom(quiz) {
  if (!quiz.liveRoomId) { alert("Quiz ao vivo não tem roomId."); return; }
  const liveRooms = lsGet("liveRooms", {}) || {};
  let room = liveRooms[quiz.liveRoomId];
  if (!room) {
    room = { roomId: quiz.liveRoomId, quizName: quiz.nome, host: usuarioAtual, state: 'idle', participants: [], waitingRequests: [], meta: {} };
    liveRooms[quiz.liveRoomId] = room;
    lsSet("liveRooms", liveRooms);
  }

  const container = document.getElementById("container");
  let html = `<h2 style="color:var(--accent-solid)">Sala Ao Vivo - ${quiz.nome}</h2>`;
  html += `<div id="liveRoomPanel"><p>Host: <strong>${room.host}</strong></p><p class="small-muted">Room ID: ${room.roomId}</p>`;
  html += `<div style="display:flex; gap:12px; margin-top:12px;"><div style="flex:1;"><h4>Esperando aprovação</h4><div id="waitingRequestsList"></div></div><div style="flex:1;"><h4>Participantes aprovados</h4><div id="participantsList"></div></div></div>`;
  html += `<div style="display:flex; gap:8px; margin-top:12px;"><button id="btnStartLive" class="btn-accent">Iniciar Quiz para todos (contagem)</button> <button id="btnCloseLive" class="btn-ghost">Fechar sala</button></div>`;
  html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted); margin-top:12px;">Voltar</p></div>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;

  function refreshLists() {
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    const r2 = liveRooms2[quiz.liveRoomId] || room;
    const waitDiv = document.getElementById("waitingRequestsList");
    const partDiv = document.getElementById("participantsList");
    if (!waitDiv || !partDiv) return;
    const wait = r2.waitingRequests || [];
    const parts = r2.participants || [];
    waitDiv.innerHTML = wait.length ? wait.map(s=>`<div style="padding:6px; background:#fff; color:var(--bg); margin-bottom:6px; border-radius:6px;"><strong>${s}</strong> <button class="btn-small approve-btn" data-student="${s}">Aprovar</button></div>`).join('') : `<div class="small-muted">Nenhum aguardando.</div>`;
    partDiv.innerHTML = parts.length ? `<ul>${parts.map(p=>`<li>${p}</li>`).join('')}</ul>` : `<div class="small-muted">Nenhum participante aprovado ainda.</div>`;
    document.querySelectorAll(".approve-btn").forEach(b => {
      b.onclick = () => {
        const stud = b.getAttribute("data-student");
        approveStudentInRoom(quiz.liveRoomId, stud);
      };
    });
  }
  const interval = setInterval(refreshLists, 800);
  refreshLists();

  document.getElementById("btnCloseLive").onclick = () => {
    clearInterval(interval);
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    if (liveRooms2[quiz.liveRoomId]) {
      liveRooms2[quiz.liveRoomId].state = 'closed';
      lsSet("liveRooms", liveRooms2);
      broadcastEvent({ type: 'room_update', roomId: quiz.liveRoomId, update: { state:'closed' } });
    }
    painelProfessorSubmissoes();
  };

  // Start with countdown broadcast to all participants; after countdown hostStartLiveLoop is called
  document.getElementById("btnStartLive").onclick = () => {
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    const room2 = liveRooms2[quiz.liveRoomId];
    if (!room2) { alert("Sala não encontrada."); return; }

    if (!room2.participants || room2.participants.length === 0) {
      if (!confirm("Nenhum participante aprovado. Deseja iniciar mesmo assim?")) return;
    }

    // set countdown startAt for 3 seconds in future to allow display
    const delayMs = 3000; // 3s countdown
    const startAt = Date.now() + 500; // small sync - countdown will run client-side from 3..2..1 to zero
    // broadcast countdown instruction (payload includes startAt reference to begin animation client-side)
    broadcastEvent({ type: 'room_countdown', roomId: room2.roomId, startAt: startAt });
    // Schedule sending room_start after a short buffer (give clients time to run 3..2..1)
    setTimeout(() => {
      // actually mark started and broadcast start
      room2.state = 'started';
      lsSet("liveRooms", liveRooms2);
      broadcastEvent({ type: 'room_start', roomId: room2.roomId, quizName: room2.quizName, startAt: Date.now(), host: usuarioAtual });
      // start the host orchestrator AFTER 3s to allow countdown finish
      setTimeout(() => {
        hostStartLiveLoop(quiz, room2.roomId);
      }, 1200); // small buffer after room_start
    }, 3000);
    clearInterval(interval);
  };

  document.getElementById("voltar").onclick = () => { clearInterval(interval); painelProfessorSubmissoes(); };
}

// Approve student helper
function approveStudentInRoom(roomId, student) {
  const liveRooms = lsGet("liveRooms", {}) || {};
  const room = liveRooms[roomId];
  if (!room) return;
  room.waitingRequests = (room.waitingRequests || []).filter(s => s !== student);
  room.participants = room.participants || [];
  if (!room.participants.includes(student)) room.participants.push(student);
  liveRooms[roomId] = room;
  lsSet("liveRooms", liveRooms);
  broadcastEvent({ type: 'room_update', roomId, update: { waitingRequests: room.waitingRequests, participants: room.participants } });
  broadcastEvent({ type: 'room_join_approved', roomId, participants: room.participants, waitingRequests: room.waitingRequests });
}

// Host orchestrates live quiz (questions, aggregation, awarding by speed)
function hostStartLiveLoop(quiz, roomId) {
  const liveRooms = lsGet("liveRooms", {}) || {};
  const room = liveRooms[roomId];
  if (!room) { alert("Sala não encontrada."); return; }

  const runtimeKey = `edu_live_runtime_${roomId}`;
  let runtime = { state:'started', quizName: quiz.nome, roomId, host: usuarioAtual, currentQuestionIndex: 0, scores: {} };
  lsSet(runtimeKey, runtime);

  const totalQ = quiz.perguntas.length;
  function startQuestion(qIndex) {
    if (qIndex >= totalQ) {
      // finalize
      const finalScores = runtime.scores || {};
      const arr = Object.keys(finalScores).map(k=>({ student:k, points: finalScores[k] })).sort((a,b)=> b.points - a.points);
      broadcastEvent({ type: 'room_end', roomId, podium: arr.slice(0,10) });
      // persist results as submissions
      const submissions = lsGet("submissions", []) || [];
      Object.keys(finalScores).forEach(student => {
        submissions.push({
          quizName: quiz.nome,
          aluno: student,
          timestamp: new Date().toISOString(),
          answers: [],
          totalPoints: finalScores[student],
          graded: true,
          note: 'live_quiz_result'
        });
      });
      lsSet("submissions", submissions);
      recomputePontuacoesFromSubmissions();
      alert("Quiz ao vivo finalizado e resultados publicados.");
      return;
    }

    // broadcast question
    const questionData = quiz.perguntas[qIndex];
    const duration = parseInt(questionData.tempo || 20);
    const questionStartAt = Date.now();
    broadcastEvent({ type: 'room_question', roomId, questionIndex: qIndex, questionData: { texto: questionData.texto, alternativas: questionData.alternativas || [], tipo: questionData.tipo, correta: questionData.correta }, questionStartAt, questionDuration: duration });

    // reset meta answers
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    liveRooms2[roomId].meta = liveRooms2[roomId].meta || {};
    liveRooms2[roomId].meta.answers = liveRooms2[roomId].meta.answers || {};
    liveRooms2[roomId].meta.answers[qIndex] = [];
    lsSet("liveRooms", liveRooms2);

    // wait for duration + buffer
    setTimeout(() => {
      const liveRooms3 = lsGet("liveRooms", {}) || {};
      const answers = (liveRooms3[roomId] && liveRooms3[roomId].meta && liveRooms3[roomId].meta.answers[qIndex]) || [];

      const corrects = answers.filter(a => a.correct).sort((a,b) => a.timeMs - b.timeMs);
      let basePoints = 30;
      corrects.forEach((c, idx) => {
        const pts = Math.max(0, basePoints - idx);
        runtime.scores[c.student] = (runtime.scores[c.student] || 0) + pts;
      });
      const participants = (liveRooms3[roomId] && liveRooms3[roomId].participants) || [];
      participants.forEach(p => { if (runtime.scores[p] === undefined) runtime.scores[p] = runtime.scores[p] || 0; });

      const snapshotArr = Object.keys(runtime.scores).map(k=>({ student:k, points: runtime.scores[k] })).sort((a,b)=> b.points - a.points).slice(0,5);
      broadcastEvent({ type: 'room_scores_snapshot', roomId, snapshot: snapshotArr });
      showLeaderboardBrief(snapshotArr);

      setTimeout(() => {
        runtime.currentQuestionIndex = qIndex + 1;
        lsSet(runtimeKey, runtime);
        startQuestion(qIndex + 1);
      }, 5000);

    }, (duration * 1000) + 600);
  }

  startQuestion(0);
}

// ------------------------
// Student waiting UI (openLiveClientUI) - shows waiting/approved state
function openLiveClientUI(roomId) {
  const room = getLocalLiveRoom(roomId);
  const container = document.getElementById("container");
  let roomName = room ? room.quizName : roomId;
  let html = `<h2 style="color:var(--accent-solid)">Sala - ${roomName}</h2>`;
  html += `<div id="liveClientPanel"><p>Você entrou na fila de espera. Aguarde aprovação do professor.</p><div id="waitingParticipants" style="margin-top:12px;"></div><div style="margin-top:12px;"><button id="leaveRoom" class="btn-ghost">Sair da fila</button></div></div>`;
  html += `<p class="voltar" id="voltar" style="cursor:pointer;color:var(--muted); margin-top:12px;">Voltar</p>`;
  container.innerHTML = `<div class="central-panel">${html}</div>`;

  document.getElementById("leaveRoom").onclick = () => {
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    if (liveRooms2[roomId]) {
      liveRooms2[roomId].waitingRequests = (liveRooms2[roomId].waitingRequests || []).filter(p=>p !== usuarioAtual);
      lsSet("liveRooms", liveRooms2);
      broadcastEvent({ type: 'room_update', roomId, update: { waitingRequests: liveRooms2[roomId].waitingRequests } });
    }
    renderDashboard();
  };

  document.getElementById("voltar").onclick = () => renderDashboard();

  const interval = setInterval(() => {
    const liveRooms2 = lsGet("liveRooms", {}) || {};
    const r2 = liveRooms2[roomId];
    const pdiv = document.getElementById("waitingParticipants");
    if (!pdiv) { clearInterval(interval); return; }
    if (!r2) {
      pdiv.innerHTML = `<div class="small-muted">Sala fechada ou não encontrada.</div>`;
      return;
    }
    const waiting = (r2.waitingRequests || []).includes(usuarioAtual);
    const approved = (r2.participants || []).includes(usuarioAtual);
    const statusHtml = approved ? `<div style="padding:8px; background:#fff; color:var(--bg); border-radius:6px;">Aprovado! Aguarde início.</div>` : waiting ? `<div style="padding:8px; background:#fff; color:var(--bg); border-radius:6px;">Na fila de espera...</div>` : `<div class="small-muted">Você não está na fila. Clique em 'Entrar Sala' novamente.</div>`;
    pdiv.innerHTML = statusHtml;
    if (r2.state === 'started' && approved) {
      clearInterval(interval);
    }
  }, 800);
}

// ------------------------
// Student receives question (openLiveClientQuestion): display and send answers to host
function openLiveClientQuestion(roomId, payload) {
  const question = payload.questionData;
  const qIndex = payload.questionIndex;
  const duration = payload.questionDuration || 20;
  const container = document.getElementById("container");

  let alternativesHtml = '';
  if (question.tipo === 'multipla') {
    const colorClasses = ['alt-red','alt-yellow','alt-green','alt-blue','alt-purple'];
    (question.alternativas || []).forEach((alt,i) => {
      const letra = String.fromCharCode(65+i);
      const colorClass = colorClasses[i] || 'alt-blue';
      alternativesHtml += `<button class="btn-alternativa ${colorClass}" data-alt="${alt}">${letra}) ${alt}</button>`;
    });
  } else if (question.tipo === 'certoErrado') {
    alternativesHtml = `<button class="btn-alternativa alt-err" data-alt="Errado">Errado</button><button class="btn-alternativa alt-correct" data-alt="Certo">Certo</button>`;
  } else {
    alternativesHtml = `<textarea id="liveDisc" rows="5" style="width:100%; padding:10px; background: rgba(255,255,255,0.03); color:var(--text);"></textarea><br><button id="sendDisc" class="btn-accent">Enviar</button>`;
  }

  container.innerHTML = `
    <div class="central-panel">
      <div class="quiz-container">
        <div style="display:flex; justify-content: space-between; align-items:flex-start; width:100%;">
          <div style="font-size:18px; color:var(--text); line-height:1.4; flex:1;">${question.texto}</div>
          <div id="liveCrono" style="font-weight:700; color:var(--accent-solid);">${duration}</div>
        </div>
        <p style="margin:8px; color:var(--muted);">Pergunta ${qIndex + 1}</p>
        <div id="liveAlternativas" class="alternativas">${alternativesHtml}</div>
        <p id="liveFeedback" style="font-weight:bold; margin-top:12px; height:24px;"></p>
      </div>
    </div>
  `;

  let remaining = duration;
  const cron = document.getElementById("liveCrono");
  const timer = setInterval(() => {
    remaining--;
    if (cron) cron.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timer);
    }
  }, 1000);

  const buttons = document.querySelectorAll(".btn-alternativa");
  let answered = false;
  buttons.forEach(btn => {
    btn.onclick = () => {
      if (answered) return;
      answered = true;
      const selected = btn.getAttribute('data-alt') || btn.textContent;
      clearInterval(timer);
      const correctNormalized = (question.correta || "").toString().trim().toLowerCase();
      const selectedNormalized = (selected || "").toString().trim().toLowerCase();
      const correct = (selectedNormalized === correctNormalized);
      const timeMs = Date.now() - payload.questionStartAt;
      broadcastEvent({ type: 'room_answer', roomId, questionIndex: qIndex, student: usuarioAtual, selected, correct, timeMs });
      document.getElementById("liveFeedback").textContent = correct ? '✅ Enviado (correto)' : '❌ Enviado (incorreto)';
    };
  });

  const sendDisc = document.getElementById("sendDisc");
  if (sendDisc) {
    sendDisc.onclick = () => {
      if (answered) return;
      answered = true;
      const txt = document.getElementById("liveDisc").value.trim();
      const timeMs = Date.now() - payload.questionStartAt;
      broadcastEvent({ type: 'room_answer', roomId, questionIndex: qIndex, student: usuarioAtual, selected: txt, correct: false, timeMs });
      document.getElementById("liveFeedback").textContent = 'Resposta enviada (será avaliada pelo professor)';
    };
  }
}

// ------------------------
// showLeaderboardBrief & showFinalPodium (kept)
function showLeaderboardBrief(snapshotArr) {
  const existing = document.getElementById("edu_leaderboard_brief");
  if (existing) existing.remove();
  const div = document.createElement("div");
  div.id = "edu_leaderboard_brief";
  div.className = "leaderboard-brief";
  let html = `<strong>Top</strong><ol style="margin:6px 0; padding-left:16px;">`;
  snapshotArr.forEach(s => html += `<li>${escapeHtml(s.student)}: ${s.points}</li>`);
  html += `</ol>`;
  div.innerHTML = html;
  document.body.appendChild(div);
  setTimeout(()=> { const el = document.getElementById("edu_leaderboard_brief"); if (el) el.remove(); }, 5000);
}

function showFinalPodium(podiumArr) {
  const overlay = document.createElement("div");
  overlay.className = "podium-overlay";
  overlay.id = "edu_podium_overlay";
  let html = `<div class="podium-card">`;
  const medals = ['🥇','🥈','🥉','🎖️'];
  for (let i=0;i<4;i++) {
    const p = podiumArr[i] || { student: '—', points:0 };
    html += `<div class="podium-entry" style="flex:1; text-align:center; padding:20px; border-radius:12px; background: linear-gradient(180deg,#e8eef2,#fff); box-shadow: 0 8px 30px rgba(0,0,0,0.12);">
      <div class="podium-medal" style="font-size:46px;">${medals[i]}</div>
      <div style="font-size:20px; font-weight:800; margin-top:6px">${escapeHtml(p.student)}</div>
      <div style="font-size:16px;">${p.points} pts</div>
    </div>`;
  }
  html += `</div>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  setTimeout(()=> {
    const o = document.getElementById("edu_podium_overlay");
    if (o) o.addEventListener('click', ()=> { o.remove(); });
  }, 1500);
}

// ------------------------
// Countdown overlay (animated)
function showCountdownOverlay(initialDelayMs) {
  // We'll do a 3..2..1 countdown. initialDelayMs is time until starting (ms).
  // Show overlay that displays 3 then 2 then 1 then GO.
  const overlay = document.createElement("div");
  overlay.className = "countdown-overlay";
  overlay.id = "edu_countdown_overlay";
  const bubble = document.createElement("div");
  bubble.className = "countdown-bubble";
  const digit = document.createElement("div");
  digit.className = "countdown-digit";
  bubble.appendChild(digit);
  overlay.appendChild(bubble);
  document.body.appendChild(overlay);

  // compute schedule: start with 3 shown immediately, then 2 after 1s, etc.
  const sequence = [3,2,1,'GO'];
  let i = 0;
  function showNext() {
    if (!digit) return;
    const val = sequence[i];
    digit.textContent = val;
    // small scale pop effect each digit
    bubble.style.animation = 'popIn 420ms ease forwards';
    i++;
    if (i < sequence.length) {
      setTimeout(showNext, 900);
    } else {
      // remove overlay after short pause
      setTimeout(()=> { const e = document.getElementById("edu_countdown_overlay"); if (e) e.remove(); }, 700);
    }
  }

  // if initialDelayMs > ~0, wait a short sync then start sequence
  setTimeout(() => {
    showNext();
  }, Math.max(100, 0));
}

// ------------------------
// Small utility: students host answer event already handled via storage listeners above

// ------------------------
// Init
(function initApp() {
  if (!document.getElementById("container")) {
    const c = document.createElement("div");
    c.id = "container";
    document.body.appendChild(c);
  }
  ensureMenuElements();
  ensureHamburger();
  telaInicial();
})();