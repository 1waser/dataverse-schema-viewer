// ui.js — ER図描画・ドラッグ・検索 UI

const CARD_WIDTH = 280;
const PREVIEW_FIELDS = 8;
const GRID_COLS = 3;
const GRID_GAP_X = 340;
const GRID_GAP_Y = 60;
const CARD_START_X = 40;
const CARD_START_Y = 40;

// カード位置記憶
const cardPositions = {};

// テーブル一覧レンダリング
function renderTableList(tables, activeNames, onSelect) {
  const list = document.getElementById('table-list');

  if (!tables.length) {
    list.innerHTML = '<p class="empty-state">テーブルが見つかりません</p>';
    return;
  }

  list.innerHTML = tables.map(t => {
    const display = t.DisplayName?.UserLocalizedLabel?.Label ?? t.LogicalName;
    const isActive = activeNames.has(t.LogicalName);
    const icon = t.IsCustomEntity ? '✦' : '◈';
    return `
      <div class="table-item ${isActive ? 'active' : ''}"
           data-logical="${t.LogicalName}"
           title="${t.LogicalName}">
        <span class="table-icon">${icon}</span>
        <span class="table-name">${display}</span>
      </div>`;
  }).join('');

  list.querySelectorAll('.table-item').forEach(el => {
    el.addEventListener('click', () => onSelect(el.dataset.logical));
  });
}

// ER図にカードを追加
function renderERCard(table, columns, relations, index, onFieldClick) {
  const canvas = document.getElementById('er-canvas');

  // 既存カード削除
  const existing = document.getElementById(`card-${table.LogicalName}`);
  if (existing) existing.remove();

  // 初期位置（グリッド配置）
  if (!cardPositions[table.LogicalName]) {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    cardPositions[table.LogicalName] = {
      x: CARD_START_X + col * GRID_GAP_X,
      y: CARD_START_Y + row * GRID_GAP_Y * 5,
    };
  }
  const pos = cardPositions[table.LogicalName];

  const display = table.DisplayName?.UserLocalizedLabel?.Label ?? table.LogicalName;
  const previewCols = columns.slice(0, PREVIEW_FIELDS);
  const remaining = columns.length - previewCols.length;

  const fieldsHtml = previewCols.map(col => {
    const colDisplay = col.DisplayName?.UserLocalizedLabel?.Label ?? col.LogicalName;
    const isPK = col.IsPrimaryId;
    const keyIcon = isPK ? '🔑' : '';
    return `
      <div class="field-row" data-logical="${col.LogicalName}" data-table="${table.LogicalName}">
        <span class="field-key">${keyIcon}</span>
        <span class="field-name">${colDisplay}</span>
        <span class="field-type">${col.AttributeType ?? ''}</span>
      </div>`;
  }).join('');

  const moreHtml = remaining > 0
    ? `<div class="more-fields" data-table="${table.LogicalName}">+ ${remaining} 列をすべて表示</div>`
    : '';

  const card = document.createElement('div');
  card.className = 'er-table-card';
  card.id = `card-${table.LogicalName}`;
  card.dataset.logical = table.LogicalName;
  card.style.cssText = `left:${pos.x}px; top:${pos.y}px;`;

  card.innerHTML = `
    <div class="card-header">
      <div class="entity-icon">◈</div>
      <div>
        <div class="entity-name">${display}</div>
        <div class="entity-logical">${table.LogicalName}</div>
      </div>
    </div>
    <div class="card-body">${fieldsHtml}${moreHtml}</div>
    <div class="card-footer">
      <span>${columns.length} 列</span>
      <span>${relations.length} リレーション</span>
    </div>`;

  // フィールドクリック
  card.querySelectorAll('.field-row').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const col = columns.find(c => c.LogicalName === el.dataset.logical);
      if (col) onFieldClick(table, col);
    });
  });

  canvas.appendChild(card);
  makeDraggable(card);
}

// ドラッグ実装
function makeDraggable(card) {
  let startX, startY, origX, origY;

  card.addEventListener('mousedown', (e) => {
    if (e.target.closest('.field-row') || e.target.closest('.more-fields')) return;
    e.preventDefault();
    card.classList.add('dragging');

    const rect = card.getBoundingClientRect();
    origX = parseInt(card.style.left);
    origY = parseInt(card.style.top);
    startX = e.clientX;
    startY = e.clientY;

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      card.style.left = (origX + dx) + 'px';
      card.style.top  = (origY + dy) + 'px';
      cardPositions[card.dataset.logical] = {
        x: origX + dx,
        y: origY + dy,
      };
      drawConnections();
    };

    const onUp = () => {
      card.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// SVG接続線を描画
function drawConnections(tableDetails) {
  const canvas = document.getElementById('er-canvas');
  let svg = document.getElementById('connection-svg');

  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connection-svg';
    svg.setAttribute('class', 'connection-svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
    canvas.insertBefore(svg, canvas.firstChild);
  }

  svg.innerHTML = '';
  if (!tableDetails) return;

  Object.entries(tableDetails).forEach(([logicalName, { relations }]) => {
    relations.forEach(rel => {
      const fromCard = document.getElementById(`card-${rel.ReferencingEntity}`);
      const toCard   = document.getElementById(`card-${rel.ReferencedEntity}`);
      if (!fromCard || !toCard || fromCard === toCard) return;

      const from = getCardCenter(fromCard);
      const to   = getCardCenter(toCard);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const cx = (from.x + to.x) / 2;
      path.setAttribute('d', `M${from.x},${from.y} C${cx},${from.y} ${cx},${to.y} ${to.x},${to.y}`);
      path.setAttribute('class', 'relation-line');
      svg.appendChild(path);
    });
  });
}

function getCardCenter(card) {
  return {
    x: parseInt(card.style.left) + card.offsetWidth / 2,
    y: parseInt(card.style.top)  + card.offsetHeight / 2,
  };
}

// 詳細パネル
function showDetailPanel(table, column) {
  const panel = document.getElementById('detail-panel');
  const title = document.getElementById('detail-title');
  const content = document.getElementById('detail-content');

  const display = column.DisplayName?.UserLocalizedLabel?.Label ?? column.LogicalName;
  const tableDisplay = table.DisplayName?.UserLocalizedLabel?.Label ?? table.LogicalName;
  const desc = column.Description?.UserLocalizedLabel?.Label ?? '—';

  title.textContent = display;
  content.innerHTML = `
    <div class="detail-section">
      <h4>テーブル</h4>
      <div class="detail-row">
        <span class="detail-label">表示名</span>
        <span class="detail-value">${tableDisplay}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">論理名</span>
        <span class="detail-value">${table.LogicalName}</span>
      </div>
    </div>
    <div class="detail-section">
      <h4>列</h4>
      <div class="detail-row">
        <span class="detail-label">表示名</span>
        <span class="detail-value">${display}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">論理名</span>
        <span class="detail-value">${column.LogicalName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">型</span>
        <span class="detail-value">${column.AttributeType ?? '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">主キー</span>
        <span class="detail-value">${column.IsPrimaryId ? '✓' : '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">必須</span>
        <span class="detail-value">${column.RequiredLevel?.Value ?? '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">カスタム</span>
        <span class="detail-value">${column.IsCustomAttribute ? '✓' : '—'}</span>
      </div>
    </div>
    <div class="detail-section">
      <h4>説明</h4>
      <p style="font-size:12px;color:var(--text-sub);line-height:1.6">${desc}</p>
    </div>`;

  panel.classList.remove('hidden');
}

// ステータスバー
function setStatus(msg, loading = false) {
  const bar = document.getElementById('status-bar');
  if (!msg) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.innerHTML = loading
    ? `<div class="spinner"></div><span>${msg}</span>`
    : `<span>${msg}</span>`;
}
