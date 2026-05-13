// ui.js — ER図描画・ドラッグ・ズーム・接続線

const CARD_WIDTH    = 272;
const PREVIEW_FIELDS = 7;
const GRID_COLS     = 3;
const GRID_GAP_X    = 340;
const GRID_GAP_Y    = 320;
const CARD_START_X  = 60;
const CARD_START_Y  = 60;

const cardPositions = {};

// 型 → アイコン・色
const TYPE_META = {
  Uniqueidentifier: { icon: '🔑', color: '#f59e0b', label: 'GUID' },
  String:           { icon: '📝', color: '#6366f1', label: 'Text' },
  Memo:             { icon: '📄', color: '#6366f1', label: 'Memo' },
  Integer:          { icon: '#',  color: '#0ea5e9', label: 'Int'  },
  BigInt:           { icon: '#',  color: '#0ea5e9', label: 'Int'  },
  Decimal:          { icon: '∑',  color: '#0ea5e9', label: 'Dec'  },
  Double:           { icon: '∑',  color: '#0ea5e9', label: 'Dbl'  },
  Money:            { icon: '¥',  color: '#10b981', label: 'Money'},
  Boolean:          { icon: '⊡',  color: '#8b5cf6', label: 'Bool' },
  DateTime:         { icon: '📅', color: '#ef4444', label: 'Date' },
  Lookup:           { icon: '🔗', color: '#0078d4', label: 'FK'   },
  Customer:         { icon: '🔗', color: '#0078d4', label: 'FK'   },
  Owner:            { icon: '👤', color: '#64748b', label: 'Owner'},
  Picklist:         { icon: '▾',  color: '#f97316', label: 'List' },
  MultiSelectPicklist: { icon: '▾▾', color: '#f97316', label: 'MList'},
  Status:           { icon: '●',  color: '#64748b', label: 'Status'},
  State:            { icon: '●',  color: '#64748b', label: 'State' },
  Virtual:          { icon: '◌',  color: '#94a3b8', label: 'Virtual'},
};

function typeMeta(type) {
  return TYPE_META[type] ?? { icon: '·', color: '#94a3b8', label: type ?? '?' };
}

// ===== テーブル一覧レンダリング =====
function renderTableList(tables, activeNames, onSelect) {
  const list = document.getElementById('table-list');
  if (!tables.length) {
    list.innerHTML = '<p class="empty-state">テーブルが見つかりません</p>';
    return;
  }
  list.innerHTML = tables.map(t => {
    const display  = t.DisplayName?.UserLocalizedLabel?.Label ?? t.LogicalName;
    const isActive = activeNames.has(t.LogicalName);
    return `
      <div class="table-item ${isActive ? 'active' : ''}" data-logical="${t.LogicalName}" title="${t.LogicalName}">
        <span class="table-icon">${t.IsCustomEntity ? '✦' : '◈'}</span>
        <span class="table-name">${display}</span>
      </div>`;
  }).join('');

  list.querySelectorAll('.table-item').forEach(el =>
    el.addEventListener('click', () => onSelect(el.dataset.logical))
  );
}

// ===== ER カードレンダリング =====
function renderERCard(table, columns, relations, index, onFieldClick) {
  const canvas = document.getElementById('er-canvas-inner');
  document.getElementById(`card-${table.LogicalName}`)?.remove();

  if (!cardPositions[table.LogicalName]) {
    cardPositions[table.LogicalName] = smartPosition(table.LogicalName, index);
  }
  const pos = cardPositions[table.LogicalName];

  const display    = table.DisplayName?.UserLocalizedLabel?.Label ?? table.LogicalName;
  const previewCols = columns.slice(0, PREVIEW_FIELDS);
  const remaining  = columns.length - previewCols.length;

  const fieldsHtml = previewCols.map(col => {
    const colDisplay = col.DisplayName?.UserLocalizedLabel?.Label ?? col.LogicalName;
    const isPK  = col.IsPrimaryId;
    const meta  = typeMeta(isPK ? 'Uniqueidentifier' : col.AttributeType);
    return `
      <div class="field-row" data-logical="${col.LogicalName}">
        <span class="field-type-icon" style="color:${meta.color}" title="${meta.label}">${meta.icon}</span>
        <span class="field-name ${isPK ? 'field-pk' : ''}">${colDisplay}</span>
        <span class="field-type-badge">${meta.label}</span>
      </div>`;
  }).join('');

  const moreHtml = remaining > 0
    ? `<div class="more-fields">＋ ${remaining} 列</div>`
    : '';

  const relCount = relations.length;

  const card = document.createElement('div');
  card.className = 'er-table-card';
  card.id = `card-${table.LogicalName}`;
  card.dataset.logical = table.LogicalName;
  card.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${CARD_WIDTH}px`;

  card.innerHTML = `
    <div class="card-header">
      <div class="entity-icon">${table.IsCustomEntity ? '✦' : '◈'}</div>
      <div class="entity-titles">
        <div class="entity-name">${display}</div>
        <div class="entity-logical">${table.LogicalName}</div>
      </div>
      <div class="card-badges">
        ${table.IsCustomEntity ? '<span class="badge badge-custom">Custom</span>' : ''}
        ${relCount > 0 ? `<span class="badge badge-rel">${relCount} rel</span>` : ''}
      </div>
    </div>
    <div class="card-body">${fieldsHtml}${moreHtml}</div>
    <div class="card-footer">
      <span>${columns.length} 列</span>
      <span>${relCount} リレーション</span>
    </div>`;

  card.querySelectorAll('.field-row').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const col = columns.find(c => c.LogicalName === el.dataset.logical);
      if (col) onFieldClick(table, col);
    });
  });

  canvas.appendChild(card);
  makeDraggable(card);
}

function smartPosition(logicalName, index) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: CARD_START_X + col * GRID_GAP_X,
    y: CARD_START_Y + row * GRID_GAP_Y,
  };
}

// ===== ドラッグ =====
function makeDraggable(card) {
  card.addEventListener('mousedown', e => {
    if (e.target.closest('.field-row') || e.target.closest('.more-fields')) return;
    e.preventDefault();
    card.classList.add('dragging');

    const origX  = parseInt(card.style.left);
    const origY  = parseInt(card.style.top);
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = e => {
      const x = origX + (e.clientX - startX) / canvasScale;
      const y = origY + (e.clientY - startY) / canvasScale;
      card.style.left = x + 'px';
      card.style.top  = y + 'px';
      cardPositions[card.dataset.logical] = { x, y };
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

// ===== ズーム・パン =====
let canvasScale = 1;
let canvasPanX  = 0;
let canvasPanY  = 0;

function initCanvasInteraction() {
  const wrap  = document.getElementById('er-canvas');
  const inner = document.getElementById('er-canvas-inner');

  // ホイールズーム
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const rect   = wrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta  = e.deltaY < 0 ? 1.1 : 0.91;
    const next   = Math.min(2.5, Math.max(0.2, canvasScale * delta));

    canvasPanX = mouseX - (mouseX - canvasPanX) * (next / canvasScale);
    canvasPanY = mouseY - (mouseY - canvasPanY) * (next / canvasScale);
    canvasScale = next;
    applyTransform(inner);
  }, { passive: false });

  // 背景ドラッグでパン
  let panStart = null;
  wrap.addEventListener('mousedown', e => {
    if (e.target !== wrap && e.target !== inner &&
        !e.target.classList.contains('canvas-bg')) return;
    panStart = { x: e.clientX - canvasPanX, y: e.clientY - canvasPanY };
    wrap.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!panStart) return;
    canvasPanX = e.clientX - panStart.x;
    canvasPanY = e.clientY - panStart.y;
    applyTransform(inner);
  });
  window.addEventListener('mouseup', () => {
    panStart = null;
    wrap.style.cursor = '';
  });

  // ツールバーボタン
  document.getElementById('btn-zoom-in').addEventListener('click',  () => zoomBy(1.2));
  document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(0.83));
  document.getElementById('btn-fit').addEventListener('click', fitAll);
}

function zoomBy(factor) {
  const wrap  = document.getElementById('er-canvas');
  const inner = document.getElementById('er-canvas-inner');
  const cx = wrap.clientWidth  / 2;
  const cy = wrap.clientHeight / 2;
  const next = Math.min(2.5, Math.max(0.2, canvasScale * factor));
  canvasPanX = cx - (cx - canvasPanX) * (next / canvasScale);
  canvasPanY = cy - (cy - canvasPanY) * (next / canvasScale);
  canvasScale = next;
  applyTransform(inner);
}

function applyTransform(inner) {
  inner.style.transform = `translate(${canvasPanX}px,${canvasPanY}px) scale(${canvasScale})`;
  drawConnections();
}

function fitAll() {
  const cards = [...document.querySelectorAll('.er-table-card')];
  if (!cards.length) return;

  const wrap = document.getElementById('er-canvas');
  const inner = document.getElementById('er-canvas-inner');
  const ww = wrap.clientWidth  - 80;
  const wh = wrap.clientHeight - 80;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  cards.forEach(c => {
    const x = parseInt(c.style.left), y = parseInt(c.style.top);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + c.offsetWidth);
    maxY = Math.max(maxY, y + c.offsetHeight);
  });

  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;
  canvasScale = Math.min(2, Math.min(ww / contentW, wh / contentH));
  canvasPanX  = (ww - contentW * canvasScale) / 2 + 40 - minX * canvasScale;
  canvasPanY  = (wh - contentH * canvasScale) / 2 + 40 - minY * canvasScale;
  applyTransform(inner);
}

// ===== 接続線 =====
let _tableDetails = {};

function drawConnections(tableDetails) {
  if (tableDetails) _tableDetails = tableDetails;

  const wrap  = document.getElementById('er-canvas');
  let svg = document.getElementById('connection-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connection-svg';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:visible;';
    wrap.insertBefore(svg, wrap.firstChild);

    // defs: arrowhead
    svg.innerHTML = `
      <defs>
        <marker id="arrow-many" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L9,3.5 Z" fill="#0078d4" opacity="0.7"/>
        </marker>
        <marker id="arrow-one" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="2.5" fill="#0078d4" opacity="0.7"/>
        </marker>
      </defs>`;
  }

  // SVGをキャンバス内transformに合わせる
  const inner = document.getElementById('er-canvas-inner');
  const g = svg.querySelector('g.conn-group') || (() => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'conn-group');
    svg.appendChild(g);
    return g;
  })();

  g.style.transform = inner.style.transform;
  g.innerHTML = '';

  const drawn = new Set();

  Object.values(_tableDetails).forEach(({ relations }) => {
    relations.forEach(rel => {
      const key = [rel.ReferencingEntity, rel.ReferencedEntity].sort().join('|');
      const fromCard = document.getElementById(`card-${rel.ReferencingEntity}`);
      const toCard   = document.getElementById(`card-${rel.ReferencedEntity}`);
      if (!fromCard || !toCard || fromCard === toCard) return;

      const offset = drawn.has(key) ? 30 : 0;
      drawn.add(key);

      const from = getEdgePoint(fromCard, toCard);
      const to   = getEdgePoint(toCard, fromCard);

      // ベジェ制御点（水平方向に引き出す）
      const dx = Math.abs(to.x - from.x);
      const cp = Math.max(80, dx * 0.5);

      const fromSign = from.side === 'right' ? 1 : -1;
      const toSign   = to.side === 'right'   ? 1 : -1;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M${from.x},${from.y + offset}
                 C${from.x + fromSign * cp},${from.y + offset}
                  ${to.x + toSign * cp},${to.y + offset}
                  ${to.x},${to.y + offset}`;
      path.setAttribute('d', d);
      path.setAttribute('class', 'relation-line');
      path.setAttribute('marker-end', 'url(#arrow-many)');
      path.setAttribute('marker-start', 'url(#arrow-one)');

      // ホバー用透明太線
      const hitPath = path.cloneNode();
      hitPath.setAttribute('class', 'relation-hit');
      hitPath.setAttribute('marker-end', '');
      hitPath.setAttribute('marker-start', '');
      hitPath.dataset.label = rel.SchemaName ?? '';
      hitPath.style.pointerEvents = 'stroke';
      hitPath.addEventListener('mouseenter', e => showRelTooltip(e, rel));
      hitPath.addEventListener('mouseleave', hideRelTooltip);

      g.appendChild(path);
      g.appendChild(hitPath);
    });
  });
}

function getEdgePoint(fromCard, toCard) {
  const fx = parseInt(fromCard.style.left);
  const fy = parseInt(fromCard.style.top);
  const fw = fromCard.offsetWidth;
  const fh = fromCard.offsetHeight;
  const tx = parseInt(toCard.style.left);

  const fromCX = fx + fw / 2;
  const fromCY = fy + fh / 2;

  if (tx > fromCX) {
    return { x: fx + fw, y: fromCY, side: 'right' };
  } else {
    return { x: fx, y: fromCY, side: 'left' };
  }
}

// ===== リレーションツールチップ =====
let tooltip = null;

function showRelTooltip(e, rel) {
  hideRelTooltip();
  tooltip = document.createElement('div');
  tooltip.className = 'rel-tooltip';
  tooltip.innerHTML = `
    <div class="rel-tooltip-title">${rel.SchemaName ?? 'Relation'}</div>
    <div class="rel-tooltip-row">${rel.ReferencingEntity} → ${rel.ReferencedEntity}</div>
    <div class="rel-tooltip-row" style="color:var(--text-sub);font-size:10px">${rel.ReferencingAttribute ?? ''}</div>`;
  tooltip.style.cssText = `left:${e.clientX + 12}px;top:${e.clientY - 10}px`;
  document.body.appendChild(tooltip);
}

function hideRelTooltip() {
  tooltip?.remove();
  tooltip = null;
}

// ===== 詳細パネル =====
function showDetailPanel(table, column) {
  const panel   = document.getElementById('detail-panel');
  const title   = document.getElementById('detail-title');
  const content = document.getElementById('detail-content');

  const display      = column.DisplayName?.UserLocalizedLabel?.Label ?? column.LogicalName;
  const tableDisplay = table.DisplayName?.UserLocalizedLabel?.Label ?? table.LogicalName;
  const desc         = column.Description?.UserLocalizedLabel?.Label ?? '—';
  const meta         = typeMeta(column.AttributeType);

  title.textContent = display;
  content.innerHTML = `
    <div class="detail-section">
      <h4>テーブル</h4>
      <div class="detail-row"><span class="detail-label">表示名</span><span class="detail-value">${tableDisplay}</span></div>
      <div class="detail-row"><span class="detail-label">論理名</span><span class="detail-value">${table.LogicalName}</span></div>
    </div>
    <div class="detail-section">
      <h4>列</h4>
      <div class="detail-row"><span class="detail-label">表示名</span><span class="detail-value">${display}</span></div>
      <div class="detail-row"><span class="detail-label">論理名</span><span class="detail-value">${column.LogicalName}</span></div>
      <div class="detail-row">
        <span class="detail-label">型</span>
        <span class="detail-value" style="color:${meta.color};font-weight:600">${meta.icon} ${column.AttributeType ?? '—'}</span>
      </div>
      <div class="detail-row"><span class="detail-label">主キー</span><span class="detail-value">${column.IsPrimaryId ? '✓' : '—'}</span></div>
      <div class="detail-row"><span class="detail-label">必須</span><span class="detail-value">${column.RequiredLevel?.Value ?? '—'}</span></div>
      <div class="detail-row"><span class="detail-label">カスタム</span><span class="detail-value">${column.IsCustomAttribute ? '✓' : '—'}</span></div>
    </div>
    <div class="detail-section">
      <h4>説明</h4>
      <p style="font-size:12px;color:var(--text-sub);line-height:1.7">${desc}</p>
    </div>`;

  panel.classList.remove('hidden');
}

// ===== ステータスバー =====
function setStatus(msg, loading = false) {
  const bar = document.getElementById('status-bar');
  if (!msg) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.innerHTML = loading
    ? `<div class="spinner"></div><span>${msg}</span>`
    : `<span>${msg}</span>`;
}
