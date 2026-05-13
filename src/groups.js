// groups.js — グループ管理・フィルタ

let groups = {}; // { groupName: Set<logicalName> }
let activeGroupFilter = null; // null = 全表示

function renderGroupsPanel() {
  let panel = document.getElementById('groups-panel');
  if (!panel) return;

  const groupNames = Object.keys(groups);

  panel.innerHTML = `
    <div class="groups-header">
      <span class="groups-title">グループ</span>
      <button class="icon-btn" id="btn-add-group" title="新規グループ">＋</button>
    </div>
    <div id="groups-list" class="groups-list">
      ${groupNames.length === 0
        ? '<p class="empty-state" style="font-size:11px;padding:12px 8px">テーブルをここにドロップしてグループ化</p>'
        : groupNames.map(name => renderGroup(name)).join('')}
    </div>`;

  document.getElementById('btn-add-group').addEventListener('click', () => {
    const name = prompt('グループ名を入力してください');
    if (name && name.trim()) {
      groups[name.trim()] = new Set();
      renderGroupsPanel();
    }
  });

  // ドロップゾーン（各グループ）
  panel.querySelectorAll('.group-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const logicalName = e.dataTransfer.getData('text/plain');
      const groupName = zone.dataset.group;
      if (logicalName && groupName) {
        groups[groupName].add(logicalName);
        renderGroupsPanel();
      }
    });
  });

  // グループアクションボタン
  panel.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      const action = btn.dataset.action;
      const group  = btn.dataset.group;
      const item   = btn.dataset.item;

      if (action === 'filter') {
        if (activeGroupFilter === group) {
          activeGroupFilter = null;
          applyGroupFilter(null);
          btn.textContent = '👁';
          btn.title = 'このグループのみ表示';
        } else {
          activeGroupFilter = group;
          applyGroupFilter(group);
          panel.querySelectorAll('[data-action=filter]').forEach(b => { b.textContent = '👁'; });
          btn.textContent = '✓';
          btn.title = '全テーブル表示に戻す';
        }
      } else if (action === 'remove-group') {
        if (confirm(`グループ「${group}」を削除しますか？`)) {
          delete groups[group];
          if (activeGroupFilter === group) { activeGroupFilter = null; applyGroupFilter(null); }
          renderGroupsPanel();
        }
      } else if (action === 'remove-item') {
        groups[group].delete(item);
        renderGroupsPanel();
      }
    });
  });
}

function renderGroup(name) {
  const items = [...groups[name]];
  const isActive = activeGroupFilter === name;
  return `
    <div class="group-block">
      <div class="group-header">
        <span class="group-name">${name}</span>
        <span class="group-count">${items.length}</span>
        <button class="icon-btn group-action-btn" data-action="filter" data-group="${name}"
          title="${isActive ? '全テーブル表示に戻す' : 'このグループのみ表示'}">${isActive ? '✓' : '👁'}</button>
        <button class="icon-btn group-action-btn" data-action="remove-group" data-group="${name}" title="削除">✕</button>
      </div>
      <div class="group-drop-zone ${items.length === 0 ? 'empty' : ''}" data-group="${name}">
        ${items.length === 0
          ? '<span class="drop-hint">テーブルをここへ</span>'
          : items.map(t => `
            <div class="group-item">
              <span class="group-item-name">${t}</span>
              <button class="group-item-remove" data-action="remove-item" data-group="${name}" data-item="${t}">✕</button>
            </div>`).join('')}
      </div>
    </div>`;
}

function applyGroupFilter(groupName) {
  const cards = document.querySelectorAll('.er-table-card');
  if (!groupName) {
    cards.forEach(c => c.style.opacity = '1');
    drawConnections();
    return;
  }
  const allowed = groups[groupName];
  cards.forEach(c => {
    c.style.opacity = allowed.has(c.dataset.logical) ? '1' : '0.15';
  });
  drawConnections();
}

function makeTablesDraggable() {
  document.querySelectorAll('.table-item').forEach(el => {
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', el.dataset.logical);
      el.classList.add('dragging-item');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging-item'));
  });
}
