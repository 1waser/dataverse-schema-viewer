// history.js — Undo/Redo 履歴管理

const _history = [];
let _hIdx = -1;

function pushHistory() {
  // 現在より未来のスタックを切り捨て
  _history.splice(_hIdx + 1);

  _history.push({
    active:    new Set(activeTableNames),
    positions: JSON.parse(JSON.stringify(cardPositions)),
    details:   { ...tableDetails },   // 列/リレーションデータは変更されないので浅いコピーで十分
  });

  if (_history.length > 50) { _history.shift(); } else { _hIdx = _history.length - 1; }
  _updateButtons();
}

function undo() {
  if (_hIdx <= 0) return;
  _hIdx--;
  _applyState(_history[_hIdx]);
}

function redo() {
  if (_hIdx >= _history.length - 1) return;
  _hIdx++;
  _applyState(_history[_hIdx]);
}

function _applyState(state) {
  // カードをすべて除去
  document.querySelectorAll('.er-table-card').forEach(c => c.remove());
  document.getElementById('canvas-empty')?.remove();

  // 状態復元
  activeTableNames = new Set(state.active);
  tableDetails     = { ...state.details };

  Object.keys(cardPositions).forEach(k => delete cardPositions[k]);
  Object.assign(cardPositions, JSON.parse(JSON.stringify(state.positions)));

  cardIndex = 0;

  // カード再描画
  state.active.forEach(name => {
    const table    = allTables.find(t => t.LogicalName === name);
    const { columns = [], relations = [] } = state.details[name] ?? {};
    if (table) renderERCard(table, columns, relations, cardIndex++, onFieldClick);
  });

  if (state.active.size === 0) {
    const inner = document.getElementById('er-canvas-inner');
    inner.insertAdjacentHTML('afterbegin', `
      <div class="canvas-empty" id="canvas-empty">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
          <rect x="8" y="8" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
          <rect x="36" y="28" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
          <path d="M28 22 L36 42" stroke="#555" stroke-width="2" stroke-dasharray="4 2"/>
        </svg>
        <p>左のリストからテーブルを選択すると<br>ER 図が表示されます</p>
      </div>`);
  }

  renderTableList(allTables, activeTableNames, onTableSelect);
  drawConnections(tableDetails);
  applyGroupFilter(activeGroupFilter);
  _updateButtons();
}

function _updateButtons() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = _hIdx <= 0;
  if (btnRedo) btnRedo.disabled = _hIdx >= _history.length - 1;
}

function initHistory() {
  // キーボードショートカット
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  document.getElementById('btn-undo')?.addEventListener('click', undo);
  document.getElementById('btn-redo')?.addEventListener('click', redo);
  document.getElementById('btn-reset')?.addEventListener('click', resetCanvas);
  document.getElementById('btn-export')?.addEventListener('click', showExportMenu);

  // 初期状態を積む
  pushHistory();
  _updateButtons();
}

function resetCanvas() {
  if (!confirm('キャンバスをリセットします。すべてのテーブル選択が解除されます。')) return;

  document.querySelectorAll('.er-table-card').forEach(c => c.remove());
  document.getElementById('canvas-empty')?.remove();

  activeTableNames = new Set();
  tableDetails     = {};
  cardIndex        = 0;
  Object.keys(cardPositions).forEach(k => delete cardPositions[k]);

  const inner = document.getElementById('er-canvas-inner');
  inner.insertAdjacentHTML('afterbegin', `
    <div class="canvas-empty" id="canvas-empty">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
        <rect x="8" y="8" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
        <rect x="36" y="28" width="20" height="28" rx="4" stroke="#555" stroke-width="2"/>
        <path d="M28 22 L36 42" stroke="#555" stroke-width="2" stroke-dasharray="4 2"/>
      </svg>
      <p>左のリストからテーブルを選択すると<br>ER 図が表示されます</p>
    </div>`);

  renderTableList(allTables, activeTableNames, onTableSelect);
  drawConnections({});
  applyGroupFilter(null);
  pushHistory();
}

function showExportMenu() {
  // 将来: Excel出力など。現在はPNG案内
  const msg = `書き出し機能（実装予定）

【現在】— 未実装
【将来対応予定】
  • PNG画像として保存
  • Excel（テーブル一覧・列定義）
  • CSV

Excel出力はご要望があれば優先実装します。`;
  alert(msg);
}
