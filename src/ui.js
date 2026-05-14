// ui.js — ER図描画・ドラッグ・ズーム・接続線

const CARD_WIDTH    = 272;
const PREVIEW_FIELDS = 7;
const GRID_COLS     = 3;
const GRID_GAP_X    = 340;
const GRID_GAP_Y    = 320;
const CARD_START_X  = 60;
const CARD_START_Y  = 60;

const cardPositions = {};

// 型メタ
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
  MultiSelectPicklist:{ icon:'▾▾', color: '#f97316', label: 'MList'},
  Status:           { icon: '●',  color: '#64748b', label: 'Status'},
  State:            { icon: '●',  color: '#64748b', label: 'State' },
  Virtual:          { icon: '◌',  color: '#94a3b8', label: 'Virtual'},
};
function typeMeta(type) {
  return TYPE_META[type] ?? { icon: '·', color: '#94a3b8', label: type ?? '?' };
}

// ===== テーブル一覧 =====
function renderTableList(tables, activeNames, onSelect) {
  const list = document.getElementById('table-list');

  // 検索ボックスの現在値でフィルタ（常時適用）
  const q = (document.getElementById('search-tables')?.value ?? '').trim().toLowerCase();
  const filtered = q
    ? tables.filter(t => {
        const display = (t.DisplayName?.UserLocalizedLabel?.Label ?? '').toLowerCase();
        return display.includes(q) || t.LogicalName.toLowerCase().includes(q);
      })
    : tables;

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">テーブルが見つかりません</p>';
    return;
  }
  list.innerHTML = filtered.map(t => {
    const display  = t.DisplayName?.UserLocalizedLabel?.Label ?? t.LogicalName;
    const isActive = activeNames.has(t.LogicalName);
    const isCustom = t.IsCustomEntity;
    return `
      <div class="table-item ${isActive ? 'active' : ''} ${isCustom ? 'custom' : 'standard'}"
           data-logical="${t.LogicalName}" title="${t.LogicalName}" draggable="true">
        <span class="table-icon">${isCustom ? '✦' : '◈'}</span>
        <span class="table-name">${display}</span>
        <span class="table-type-dot ${isCustom ? 'dot-custom' : 'dot-standard'}"></span>
      </div>`;
  }).join('');

  list.querySelectorAll('.table-item').forEach(el => {
    el.addEventListener('click', () => onSelect(el.dataset.logical));
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', el.dataset.logical);
    });
  });
}

// ===== ER カード =====
function renderERCard(table, columns, relations, index, onFieldClick, onCardClose) {
  const canvas = document.getElementById('er-canvas-inner');
  document.getElementById(`card-${table.LogicalName}`)?.remove();

  if (!cardPositions[table.LogicalName]) {
    cardPositions[table.LogicalName] = smartPosition(table.LogicalName, index);
  }
  const pos = cardPositions[table.LogicalName];

  const display     = table.DisplayName?.UserLocalizedLabel?.Label ?? table.LogicalName;
  const previewCols = columns.slice(0, PREVIEW_FIELDS);
  const remaining   = columns.length - previewCols.length;
  const isCustom    = table.IsCustomEntity;

  // ヘッダー色: 標準=緑、カスタム=青
  const headerGrad = isCustom
    ? 'linear-gradient(135deg,#0078d4 0%,#1565c0 100%)'
    : 'linear-gradient(135deg,#059669 0%,#047857 100%)';

  const fieldsHtml = previewCols.map(col => {
    const colDisplay = col.DisplayName?.UserLocalizedLabel?.Label ?? col.LogicalName;
    const isPK  = col.IsPrimaryId;
    const meta  = typeMeta(isPK ? 'Uniqueidentifier' : col.AttributeType);
    return `
      <div class="field-row" data-logical="${col.LogicalName}">
        <span class="field-type-icon" style="color:${meta.color}">${meta.icon}</span>
        <span class="field-name ${isPK ? 'field-pk' : ''}">${colDisplay}</span>
        <span class="field-type-badge">${meta.label}</span>
      </div>`;
  }).join('');

  const moreHtml = remaining > 0
    ? `<div class="more-fields">＋ ${remaining} 列</div>` : '';

  const card = document.createElement('div');
  card.className = 'er-table-card';
  card.id = `card-${table.LogicalName}`;
  card.dataset.logical = table.LogicalName;
  card.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${CARD_WIDTH}px`;

  card.innerHTML = `
    <button class="card-close-btn" title="キャンバスから削除">✕</button>
    <div class="card-header" style="background:${headerGrad}">
      <div class="entity-icon">${isCustom ? '✦' : '◈'}</div>
      <div class="entity-titles">
        <div class="entity-name">${display}</div>
        <div class="entity-logical">${table.LogicalName}</div>
      </div>
      <div class="card-badges">
        ${isCustom ? '<span class="badge badge-custom">Custom</span>' : '<span class="badge badge-std">Standard</span>'}
        ${relations.length > 0 ? `<span class="badge badge-rel">${relations.length} rel</span>` : ''}
      </div>
    </div>
    <div class="card-body">${fieldsHtml}${moreHtml}</div>
    <div class="card-footer">
      <span>${columns.length} 列</span>
      <span>${relations.length} リレーション</span>
    </div>`;

  card.querySelectorAll('.field-row').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const col = columns.find(c => c.LogicalName === el.dataset.logical);
      if (col) onFieldClick(table, col);
    });
  });

  card.querySelector('.card-close-btn').addEventListener('click', e => {
    e.stopPropagation();
    onCardClose?.(table.LogicalName);
  });

  canvas.appendChild(card);
  makeDraggable(card);
}

function smartPosition(logicalName, index) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return { x: CARD_START_X + col * GRID_GAP_X, y: CARD_START_Y + row * GRID_GAP_Y };
}

// ===== ドラッグ =====
function makeDraggable(card) {
  card.addEventListener('mousedown', e => {
    if (e.target.closest('.field-row') || e.target.closest('.more-fields')) return;
    e.preventDefault();
    card.classList.add('dragging');
    const origX = parseInt(card.style.left);
    const origY = parseInt(card.style.top);
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
      if (typeof pushHistory === 'function') pushHistory();
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
    const next   = clampScale(canvasScale * delta);
    canvasPanX = mouseX - (mouseX - canvasPanX) * (next / canvasScale);
    canvasPanY = mouseY - (mouseY - canvasPanY) * (next / canvasScale);
    canvasScale = next;
    applyTransform(inner);
    syncSlider();
  }, { passive: false });

  // 背景パン
  let panStart = null;
  wrap.addEventListener('mousedown', e => {
    if (e.target !== wrap && e.target !== inner) return;
    panStart = { x: e.clientX - canvasPanX, y: e.clientY - canvasPanY };
    wrap.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!panStart) return;
    canvasPanX = e.clientX - panStart.x;
    canvasPanY = e.clientY - panStart.y;
    applyTransform(inner);
  });
  window.addEventListener('mouseup', () => { panStart = null; wrap.style.cursor = ''; });

  // ズームスライダー
  const slider = document.getElementById('zoom-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      const next = clampScale(parseInt(slider.value) / 100);
      const cx = wrap.clientWidth / 2;
      const cy = wrap.clientHeight / 2;
      canvasPanX = cx - (cx - canvasPanX) * (next / canvasScale);
      canvasPanY = cy - (cy - canvasPanY) * (next / canvasScale);
      canvasScale = next;
      applyTransform(inner);
      document.getElementById('zoom-label').textContent = Math.round(canvasScale * 100) + '%';
    });
  }

  // ボタン
  document.getElementById('btn-fit')?.addEventListener('click', fitAll);
  document.getElementById('btn-auto-layout')?.addEventListener('click', autoLayout);
}

function clampScale(s) { return Math.min(2.5, Math.max(0.2, s)); }

function syncSlider() {
  const slider = document.getElementById('zoom-slider');
  const label  = document.getElementById('zoom-label');
  if (slider) slider.value = Math.round(canvasScale * 100);
  if (label)  label.textContent = Math.round(canvasScale * 100) + '%';
}

function applyTransform(inner) {
  inner = inner || document.getElementById('er-canvas-inner');
  inner.style.transform = `translate(${canvasPanX}px,${canvasPanY}px) scale(${canvasScale})`;
  drawConnections();
}

function fitAll() {
  const cards = [...document.querySelectorAll('.er-table-card')];
  if (!cards.length) return;
  const wrap = document.getElementById('er-canvas');
  const inner = document.getElementById('er-canvas-inner');
  const ww = wrap.clientWidth - 80;
  const wh = wrap.clientHeight - 80;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  cards.forEach(c => {
    const x = parseInt(c.style.left), y = parseInt(c.style.top);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + c.offsetWidth);
    maxY = Math.max(maxY, y + c.offsetHeight);
  });
  const cw = maxX - minX || 1, ch = maxY - minY || 1;
  canvasScale = clampScale(Math.min(ww / cw, wh / ch));
  canvasPanX  = (ww - cw * canvasScale) / 2 + 40 - minX * canvasScale;
  canvasPanY  = (wh - ch * canvasScale) / 2 + 40 - minY * canvasScale;
  applyTransform(inner);
  syncSlider();
}

// ===== 最適配置 =====
function autoLayout() {
  const cards = [...document.querySelectorAll('.er-table-card')];
  if (!cards.length) return;

  const nodes = new Set(cards.map(c => c.dataset.logical));
  const childrenOf = {};
  const inDegree   = {};
  nodes.forEach(n => { childrenOf[n] = []; inDegree[n] = 0; });

  // ReferencedEntity = 1側(親)  ReferencingEntity = N側(子)
  Object.values(_tableDetails).forEach(({ relations }) => {
    relations.forEach(rel => {
      const parent = rel.ReferencedEntity;
      const child  = rel.ReferencingEntity;
      if (nodes.has(parent) && nodes.has(child) && parent !== child) {
        if (!childrenOf[parent].includes(child)) {
          childrenOf[parent].push(child);
          inDegree[child]++;
        }
      }
    });
  });

  // BFS でレイヤー割り当て
  const layer = {};
  const queue = [...nodes].filter(n => inDegree[n] === 0);
  queue.forEach(n => (layer[n] = 0));
  const visited = new Set(queue);

  while (queue.length) {
    const node = queue.shift();
    childrenOf[node].forEach(child => {
      layer[child] = Math.max(layer[child] ?? 0, layer[node] + 1);
      if (!visited.has(child)) { visited.add(child); queue.push(child); }
    });
  }
  nodes.forEach(n => { if (layer[n] === undefined) layer[n] = 0; });

  // レイヤーごとにグループ化して配置
  const byLayer = {};
  nodes.forEach(n => {
    const l = layer[n];
    (byLayer[l] = byLayer[l] ?? []).push(n);
  });

  const COL_GAP = 360, ROW_GAP = 300, START_X = 60, START_Y = 60;
  const maxPerCol = Math.max(...Object.values(byLayer).map(a => a.length));

  Object.entries(byLayer).forEach(([l, list]) => {
    const offset = ((maxPerCol - list.length) * ROW_GAP) / 2;
    list.forEach((name, i) => {
      const x = START_X + parseInt(l) * COL_GAP;
      const y = START_Y + offset + i * ROW_GAP;
      cardPositions[name] = { x, y };
      const card = document.getElementById(`card-${name}`);
      if (card) { card.style.left = x + 'px'; card.style.top = y + 'px'; }
    });
  });

  drawConnections();
  setTimeout(() => { fitAll(); if (typeof pushHistory === 'function') pushHistory(); }, 50);
}

// ===== 見やすく配置 =====
function tidyLayout() {
  const cards = [...document.querySelectorAll('.er-table-card')];
  if (!cards.length) return;

  const nodes = cards.map(c => c.dataset.logical);
  const nodeSet = new Set(nodes);
  const ch = {}, pa = {};
  nodes.forEach(n => { ch[n] = []; pa[n] = []; });

  // 方向ごとのリレーション数を集計
  const dirCount = {};
  Object.values(_tableDetails).forEach(({ relations }) => {
    relations.forEach(rel => {
      const p = rel.ReferencedEntity, c = rel.ReferencingEntity;
      if (nodeSet.has(p) && nodeSet.has(c) && p !== c) {
        const key = `${p}->${c}`;
        dirCount[key] = (dirCount[key] ?? 0) + 1;
      }
    });
  });

  // ペアごとに「多い方向」だけをエッジとして採用
  const addedPair = new Set();
  Object.entries(dirCount).forEach(([key, cnt]) => {
    const [p, c] = key.split('->');
    const pairKey = [p, c].sort().join('|');
    if (addedPair.has(pairKey)) return;
    addedPair.add(pairKey);
    const rev = `${c}->${p}`;
    const revCnt = dirCount[rev] ?? 0;
    // 多い方向を親→子として採用（同数なら最初に現れた方向）
    const [parent, child] = cnt >= revCnt ? [p, c] : [c, p];
    ch[parent].push(child); pa[child].push(parent);
  });

  // 他のテーブルと繋がっているか
  const hasLink = n => ch[n].length > 0 || pa[n].length > 0;
  const linked   = nodes.filter(hasLink);
  const isolated = nodes.filter(n => !hasLink(n));

  // BFS で列（左=1側、右=N側）を割り当て
  const colOf = {};
  const inDeg = {};
  linked.forEach(n => { inDeg[n] = pa[n].length; });
  const roots = linked.filter(n => inDeg[n] === 0);
  roots.forEach(n => (colOf[n] = 0));
  const q = [...roots], vis = new Set(roots);
  while (q.length) {
    const n = q.shift();
    ch[n].forEach(c => {
      colOf[c] = Math.max(colOf[c] ?? 0, colOf[n] + 1);
      if (!vis.has(c)) { vis.add(c); q.push(c); }
    });
  }
  linked.forEach(n => { if (colOf[n] === undefined) colOf[n] = 0; });

  // 列ごとにグループ化して配置
  const byCol = {};
  linked.forEach(n => { const l = colOf[n]; (byCol[l] = byCol[l] ?? []).push(n); });
  const cols = Object.keys(byCol).map(Number).sort((a, b) => a - b);

  const COL_W = 370, CARD_H = 310, START_X = 60, START_Y = 60;
  const posY = {};

  cols.forEach(l => {
    const list = byCol[l];
    // 親のY平均でソート → 交差を減らす
    list.sort((a, b) => {
      const avg = n => { const ps = pa[n].filter(p => posY[p] !== undefined); return ps.length ? ps.reduce((s, p) => s + posY[p], 0) / ps.length : 0; };
      return avg(a) - avg(b);
    });
    // 上から順に配置（親に近いY優先）
    let nextY = START_Y;
    list.forEach(n => {
      const ps = pa[n].filter(p => posY[p] !== undefined);
      const ideal = ps.length ? Math.round(ps.reduce((s, p) => s + posY[p], 0) / ps.length) : nextY;
      posY[n] = Math.max(ideal, nextY);
      nextY = posY[n] + CARD_H;
    });
  });

  // 繋がっているテーブルを配置
  cols.forEach(l => {
    byCol[l].forEach(name => {
      const x = START_X + l * COL_W;
      const y = posY[name];
      cardPositions[name] = { x, y };
      const card = document.getElementById(`card-${name}`);
      if (card) { card.style.left = x + 'px'; card.style.top = y + 'px'; }
    });
  });

  // 孤立テーブルは下の行に横並び
  const maxY = linked.length > 0
    ? Math.max(...linked.map(n => posY[n])) + CARD_H + 60
    : START_Y;
  isolated.forEach((name, i) => {
    const x = START_X + i * COL_W;
    const y = maxY;
    cardPositions[name] = { x, y };
    const card = document.getElementById(`card-${name}`);
    if (card) { card.style.left = x + 'px'; card.style.top = y + 'px'; }
  });

  drawConnections();
  setTimeout(() => { fitAll(); if (typeof pushHistory === 'function') pushHistory(); }, 50);
}

// ===== 接続線（アニメーション玉付き） =====
let _tableDetails = {};
let _pathCounter  = 0;

function drawConnections(tableDetails) {
  if (tableDetails) _tableDetails = tableDetails;

  const wrap = document.getElementById('er-canvas');
  let svg = document.getElementById('connection-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'connection-svg';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;overflow:visible;pointer-events:none;';
    wrap.appendChild(svg);
    svg.innerHTML = `<defs>
      <marker id="arrow-end" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <path d="M0,0 L0,7 L9,3.5 Z" fill="#0078d4" opacity="0.65"/>
      </marker>
      <marker id="arrow-end-green" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
        <path d="M0,0 L0,7 L9,3.5 Z" fill="#059669" opacity="0.65"/>
      </marker>
    </defs>`;
  }

  let g = svg.querySelector('g.conn-group');
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'conn-group');
    svg.appendChild(g);
  }

  const inner = document.getElementById('er-canvas-inner');
  g.style.transform = inner?.style.transform ?? '';
  g.innerHTML = '';

  const drawn = new Map(); // key → offset count
  Object.values(_tableDetails).forEach(({ relations }) => {
    relations.forEach(rel => {
      // N側 = ReferencingEntity (子), 1側 = ReferencedEntity (親)
      const nCard = document.getElementById(`card-${rel.ReferencingEntity}`);
      const oneCard = document.getElementById(`card-${rel.ReferencedEntity}`);
      if (!nCard || !oneCard || nCard === oneCard) return;

      const key = [rel.ReferencingEntity, rel.ReferencedEntity].sort().join('|');
      const offsetIdx = drawn.get(key) ?? 0;
      drawn.set(key, offsetIdx + 1);
      const offset = offsetIdx * 18;

      const from = getEdgePoint(nCard, oneCard);   // N側 出発
      const to   = getEdgePoint(oneCard, nCard);   // 1側 到着

      const dx = Math.abs(to.x - from.x);
      const cp = Math.max(80, dx * 0.5);
      const fSign = from.side === 'right' ? 1 : -1;
      const tSign = to.side   === 'right' ? 1 : -1;

      const d = `M${from.x},${from.y + offset} C${from.x + fSign*cp},${from.y + offset} ${to.x + tSign*cp},${to.y + offset} ${to.x},${to.y + offset}`;

      const pathId = `rel-path-${_pathCounter++}`;

      // パス本体
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', pathId);
      path.setAttribute('d', d);
      path.setAttribute('class', 'relation-line');
      path.setAttribute('marker-end', 'url(#arrow-end)');
      path.style.pointerEvents = 'none';

      // ヒット領域
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('class', 'relation-hit');
      hit.style.pointerEvents = 'stroke';
      hit.addEventListener('mouseenter', e => {
        path.classList.add('relation-line-hover');
        showRelTooltip(e, rel);
      });
      hit.addEventListener('mouseleave', () => {
        path.classList.remove('relation-line-hover');
        hideRelTooltip();
      });

      // アニメーション玉（3つ、N→1方向）
      const ballColors = ['#0078d4','#60a5fa','#93c5fd'];
      const balls = ballColors.map((color, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', i === 0 ? '0.9' : i === 1 ? '0.6' : '0.35');
        circle.style.pointerEvents = 'none';

        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        anim.setAttribute('dur', '2.4s');
        anim.setAttribute('begin', `${(i * 0.8).toFixed(1)}s`);
        anim.setAttribute('repeatCount', 'indefinite');
        anim.setAttribute('rotate', 'auto');

        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);
        anim.appendChild(mpath);
        circle.appendChild(anim);
        return circle;
      });

      g.appendChild(path);
      balls.forEach(b => g.appendChild(b));
      g.appendChild(hit);
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
  return tx > fromCX
    ? { x: fx + fw, y: fromCY, side: 'right' }
    : { x: fx,      y: fromCY, side: 'left'  };
}

// ===== ツールチップ =====
let tooltip = null;
function showRelTooltip(e, rel) {
  hideRelTooltip();

  // FK列の表示名を取得
  const refCols = _tableDetails[rel.ReferencingEntity]?.columns ?? [];
  const fkCol   = refCols.find(c => c.LogicalName === rel.ReferencingAttribute);
  const fkDisplay = fkCol?.DisplayName?.UserLocalizedLabel?.Label ?? rel.ReferencingAttribute ?? '—';

  // 参照先テーブル表示名
  const nTable  = _tableDetails[rel.ReferencingEntity];
  const oneTable = _tableDetails[rel.ReferencedEntity];

  tooltip = document.createElement('div');
  tooltip.className = 'rel-tooltip';
  tooltip.innerHTML = `
    <div class="rel-tooltip-title">${rel.SchemaName ?? 'Relation'}</div>
    <div class="rel-tooltip-section">
      <span class="rel-tooltip-badge n">N</span>
      <span class="rel-tooltip-entity">${rel.ReferencingEntity}</span>
    </div>
    <div class="rel-tooltip-fk">
      <div class="rel-tooltip-fk-label">外部キー (FK)</div>
      <div class="rel-tooltip-fk-name">${fkDisplay}</div>
      <div class="rel-tooltip-fk-logical">${rel.ReferencingAttribute ?? ''}</div>
    </div>
    <div class="rel-tooltip-section">
      <span class="rel-tooltip-badge one">1</span>
      <span class="rel-tooltip-entity">${rel.ReferencedEntity}</span>
    </div>`;
  tooltip.style.cssText = `left:${e.clientX + 14}px;top:${e.clientY - 10}px`;
  document.body.appendChild(tooltip);

  // 画面端補正
  const r = tooltip.getBoundingClientRect();
  if (r.right > window.innerWidth - 10)
    tooltip.style.left = (e.clientX - r.width - 10) + 'px';
}
function hideRelTooltip() { tooltip?.remove(); tooltip = null; }

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
      <div class="detail-row"><span class="detail-label">種別</span><span class="detail-value">${table.IsCustomEntity ? '🔵 カスタム' : '🟢 標準'}</span></div>
    </div>
    <div class="detail-section">
      <h4>列</h4>
      <div class="detail-row"><span class="detail-label">表示名</span><span class="detail-value">${display}</span></div>
      <div class="detail-row"><span class="detail-label">論理名</span><span class="detail-value">${column.LogicalName}</span></div>
      <div class="detail-row"><span class="detail-label">型</span><span class="detail-value" style="color:${meta.color};font-weight:600">${meta.icon} ${column.AttributeType ?? '—'}</span></div>
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
