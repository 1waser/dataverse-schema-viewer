// app.js — アプリケーションエントリポイント

let allTables = [];
let activeTableNames = new Set();
let tableDetails = {};
let currentEnvUrl = '';
let cardIndex = 0;

// ===== 初期化 =====
(async () => {
  try {
    const account = await initAuth();
    if (account) {
      showMain(account);
    } else {
      showLogin();
    }
  } catch (e) {
    console.error('initAuth failed:', e);
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    const note = document.querySelector('.note');
    if (note) note.textContent = '初期化エラー: ' + e.message;
  }

  // ログインボタン
  document.getElementById('btn-login').addEventListener('click', async () => {
    try {
      await login();
    } catch (e) {
      console.error('login failed:', e);
      alert('ログインエラー: ' + e.message);
    }
  });

  // ログアウト
  document.getElementById('btn-logout').addEventListener('click', () => logout());

  // デモモード（ログイン画面・トップバー両方）
  const startDemo = () => {
    showMain({ name: 'デモユーザー', username: 'demo' });
    loadDemo();
    document.getElementById('demo-badge').classList.remove('hidden');
  };
  document.getElementById('btn-demo-login').addEventListener('click', startDemo);

  // テーブル読み込み
  document.getElementById('btn-load').addEventListener('click', loadTables);
  document.getElementById('env-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadTables();
  });

  // テーブル検索
  document.getElementById('search-tables').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    filterTableList(q);
  });

  // 詳細パネルを閉じる
  document.getElementById('btn-close-detail').addEventListener('click', () => {
    document.getElementById('detail-panel').classList.add('hidden');
  });

  // ズーム（シンプル実装）
  document.getElementById('btn-fit').addEventListener('click', fitCanvas);

  // サイドバー開閉
  document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
    const open = document.querySelector('.sidebar').classList.contains('collapsed');
    setSidebar(open);
  });

  // 保存（将来実装）
  document.getElementById('btn-save').addEventListener('click', () => {
    alert('保存機能は近日対応予定です。');
  });

  // 全画面
  document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenIcon);

  // 見やすく
  document.getElementById('btn-tidy-layout').addEventListener('click', tidyLayout);
})();

// ===== 画面切替 =====
function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('main-screen').classList.add('hidden');
}

function showMain(account) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
  document.getElementById('user-name').textContent =
    account.name ?? account.username ?? 'ユーザー';
  initCanvasInteraction();
  renderGroupsPanel();
  initHistory();
}

// ===== テーブル読み込み =====
async function loadTables() {
  const envUrl = document.getElementById('env-url').value.trim();
  if (!envUrl) { alert('環境 URL を入力してください'); return; }

  // https 確認
  if (!envUrl.startsWith('https://')) {
    alert('URL は https:// から始めてください');
    return;
  }

  currentEnvUrl = envUrl;
  setStatus('テーブル一覧を取得中...', true);

  try {
    const token = await getToken(envUrl);
    allTables = await fetchTables(envUrl, token);

    renderTableList(allTables, activeTableNames, onTableSelect);
    setStatus(`${allTables.length} テーブルを取得しました`);
    setTimeout(() => setStatus(null), 3000);
  } catch (e) {
    setStatus(null);
    showError(e);
  }
}

// ===== テーブル選択 =====
async function onTableSelect(logicalName) {
  // トグル（削除）
  if (activeTableNames.has(logicalName)) {
    activeTableNames.delete(logicalName);
    document.getElementById(`card-${logicalName}`)?.remove();
    delete tableDetails[logicalName];
    renderTableList(allTables, activeTableNames, onTableSelect);
    drawConnections(tableDetails);
    pushHistory();
    return;
  }

  activeTableNames.add(logicalName);
  renderTableList(allTables, activeTableNames, onTableSelect);

  const table = allTables.find(t => t.LogicalName === logicalName);
  if (!table) return;

  setStatus(`${table.DisplayName?.UserLocalizedLabel?.Label ?? logicalName} を読み込み中...`, true);

  try {
    const token = await getToken(currentEnvUrl);
    const [columns, relations] = await Promise.all([
      fetchColumns(currentEnvUrl, logicalName, token),
      fetchRelations(currentEnvUrl, logicalName, token),
    ]);

    tableDetails[logicalName] = { columns, relations };

    const index = cardIndex++;
    renderERCard(table, columns, relations, index, onFieldClick, onTableSelect);
    drawConnections(tableDetails);
    document.getElementById('canvas-empty')?.remove();
    setStatus(null);
    pushHistory();
  } catch (e) {
    activeTableNames.delete(logicalName);
    renderTableList(allTables, activeTableNames, onTableSelect);
    setStatus(null);
    showError(e);
  }
}

// ===== フィールドクリック =====
function onFieldClick(table, column) {
  showDetailPanel(table, column);
}

// ===== テーブル検索フィルタ =====
function filterTableList(query) {
  if (!query) {
    renderTableList(allTables, activeTableNames, onTableSelect);
    return;
  }
  const filtered = allTables.filter(t => {
    const display = (t.DisplayName?.UserLocalizedLabel?.Label ?? '').toLowerCase();
    const logical = t.LogicalName.toLowerCase();
    return display.includes(query) || logical.includes(query);
  });
  renderTableList(filtered, activeTableNames, onTableSelect);
}

// ===== 全体表示 =====
function fitCanvas() {
  const cards = document.querySelectorAll('.er-table-card');
  if (!cards.length) return;

  let minX = Infinity, minY = Infinity;
  cards.forEach(c => {
    minX = Math.min(minX, parseInt(c.style.left));
    minY = Math.min(minY, parseInt(c.style.top));
  });

  const dx = 40 - minX;
  const dy = 40 - minY;

  cards.forEach(c => {
    const x = parseInt(c.style.left) + dx;
    const y = parseInt(c.style.top)  + dy;
    c.style.left = x + 'px';
    c.style.top  = y + 'px';
    const name = c.dataset.logical;
    if (cardPositions[name]) {
      cardPositions[name] = { x, y };
    }
  });
  drawConnections(tableDetails);
}

// ===== サイドバー開閉 =====
function setSidebar(open) {
  document.querySelector('.sidebar').classList.toggle('collapsed', !open);
  document.getElementById('sidebar-tab-icon').textContent = open ? '‹' : '›';
  document.getElementById('btn-toggle-sidebar').style.left = open ? '260px' : '0';
}

// ===== 全画面 =====
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
function updateFullscreenIcon() {
  const isFs = !!document.fullscreenElement;
  document.getElementById('icon-fullscreen-enter').style.display = isFs ? 'none' : '';
  document.getElementById('icon-fullscreen-exit').style.display  = isFs ? '' : 'none';
}

// ===== エラー表示 =====
function showError(e) {
  console.error(e);
  const msg = e.message ?? String(e);

  if (msg.includes('401') || msg.includes('Unauthorized')) {
    alert('認証エラー: Dataverse への権限がありません。\n「API のアクセス許可」で Dynamics CRM > user_impersonation が付与されているか確認してください。');
  } else if (msg.includes('CORS') || msg.includes('Failed to fetch')) {
    alert('接続エラー: 環境 URL を確認してください。\n正しい形式: https://yourorg.crm7.dynamics.com');
  } else {
    alert(`エラー: ${msg}`);
  }
}
