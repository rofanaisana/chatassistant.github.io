// ===================== STATE =====================
const state = {
  profiles: [],
  nodes: [],
  relations: [],
  nextProfileId: 1,
  nextNodeId: 1,
};

const AVATAR_COLORS = ['#4A90D9', '#e9658b', '#f5a623', '#7ed321', '#9b59b6', '#1abc9c'];

const NODE_SHAPES = [
  { value: 'circle', label: '● 원' },
  { value: 'heart', label: '♥ 하트' },
  { value: 'star', label: '★ 별' },
  { value: 'triangle', label: '▲ 세모' },
  { value: 'diamond', label: '◆ 마름모' },
];

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  renderProfiles();
  renderNodes();
  renderPreview();
});

// ===================== ACCORDION =====================
function toggleAccordion(id) {
  const section = document.getElementById(id);
  if (section) section.classList.toggle('collapsed');
}

// ===================== MOBILE TABS =====================
function switchTab(tab) {
  const editor = document.getElementById('editorPanel');
  const preview = document.getElementById('previewPanel');
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'editor') {
    editor.removeAttribute('data-hidden');
    preview.setAttribute('data-hidden', 'true');
  } else {
    editor.setAttribute('data-hidden', 'true');
    preview.removeAttribute('data-hidden');
  }
}

// ===================== PROFILE MANAGEMENT =====================
function addProfile() {
  if (state.profiles.length >= 3) {
    alert('인물은 최대 3인까지 추가할 수 있습니다.');
    return;
  }
  const id = state.nextProfileId++;
  state.profiles.push({ id, name: `인물 ${id}`, imgUrl: '' });
  rebuildRelations();
  renderProfiles();
  renderPreview();
  updateProfileBtn();
}

function removeProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  rebuildRelations();
  renderProfiles();
  renderPreview();
  updateProfileBtn();
}

function updateProfile(id, field, value) {
  const profile = state.profiles.find(p => p.id === id);
  if (profile) {
    profile[field] = value;
    renderPreview();
    // 이름 변경 시 관계 UI도 갱신
    if (field === 'name') {
      renderRelationsUI();
    }
  }
}

function handleProfileImage(id, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const profile = state.profiles.find(p => p.id === id);
    if (profile) {
      profile.imgUrl = e.target.result;
      renderProfiles();
      renderPreview();
    }
  };
  reader.readAsDataURL(file);
}

function removeProfileImage(id) {
  const profile = state.profiles.find(p => p.id === id);
  if (profile) {
    profile.imgUrl = '';
    renderProfiles();
    renderPreview();
  }
}

// ===================== RELATION MANAGEMENT =====================
function rebuildRelations() {
  const newRelations = [];
  // 인접 인물 쌍만 (0↔1, 1↔2)
  for (let i = 0; i < state.profiles.length - 1; i++) {
    const a = state.profiles[i].id;
    const b = state.profiles[i + 1].id;
    const existing = state.relations.find(r =>
      (r.from === a && r.to === b) || (r.from === b && r.to === a)
    );
    newRelations.push({
      from: a,
      to: b,
      label: existing ? existing.label : '',
    });
  }
  state.relations = newRelations;
}

function updateRelation(fromId, toId, value) {
  const rel = state.relations.find(r =>
    (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId)
  );
  if (rel) {
    rel.label = value;
    renderPreview();
  }
}

function getRelationLabel(idA, idB) {
  const rel = state.relations.find(r =>
    (r.from === idA && r.to === idB) || (r.from === idB && r.to === idA)
  );
  return rel ? rel.label : '';
}

function renderRelationsUI() {
  const container = document.getElementById('relationsList');
  if (!container) return;
  if (state.profiles.length < 2) {
    container.innerHTML = '<div class="text-muted">인물 2인 이상 추가시 관계를 설정할 수 있습니다.</div>';
    return;
  }
  container.innerHTML = '';
  state.relations.forEach(rel => {
    const pFrom = state.profiles.find(p => p.id === rel.from);
    const pTo = state.profiles.find(p => p.id === rel.to);
    if (!pFrom || !pTo) return;
    const row = document.createElement('div');
    row.className = 'relation-row';
    row.innerHTML = `
      <span class="relation-pair">
        <span class="relation-name">${esc(pFrom.name)}</span>
        <i class="fa-solid fa-arrows-left-right" style="color:#aaa;font-size:0.7rem;"></i>
        <span class="relation-name">${esc(pTo.name)}</span>
      </span>
      <input type="text" class="form-input" value="${escAttr(rel.label)}"
        oninput="updateRelation(${rel.from}, ${rel.to}, this.value)"
        placeholder="예: 연인, 형제, 라이벌" style="flex:1;" />
    `;
    container.appendChild(row);
  });
}

function renderProfiles() {
  const list = document.getElementById('profileList');
  if (state.profiles.length === 0) {
    list.innerHTML = `<div class="text-muted" style="margin-bottom:0.8rem;">인물이 없습니다. 추가해 보세요.</div>`;
    updateProfileBtn();
    renderRelationsUI();
    return;
  }
  list.innerHTML = '';
  state.profiles.forEach((profile, idx) => {
    const card = document.createElement('div');
    card.className = 'character-card';
    const avatarPreview = profile.imgUrl
      ? `<img src="${escAttr(profile.imgUrl)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />`
      : esc(profile.name.charAt(0));
    card.innerHTML = `
      <div class="character-card-header">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div class="profile-avatar" style="background:${AVATAR_COLORS[idx % AVATAR_COLORS.length]};width:28px;height:28px;font-size:0.7rem;">
            ${avatarPreview}
          </div>
          <span class="character-num">인물 ${idx + 1}</span>
          <span style="font-size:0.82rem;font-weight:500;color:#555;">${esc(profile.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.2rem;">
          <button class="btn-icon" onclick="toggleCardBody(this)" title="접기/펼치기">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <button class="btn-icon danger" onclick="removeProfile(${profile.id})" title="삭제">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="character-card-body">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input type="text" class="form-input" value="${escAttr(profile.name)}"
            oninput="updateProfile(${profile.id}, 'name', this.value)" placeholder="인물 이름" />
        </div>
        <div class="form-group">
          <label class="form-label">프로필 이미지</label>
          <div class="profile-img-upload">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('imgUpload-${profile.id}').click()">
              <i class="fa-solid fa-camera"></i> ${profile.imgUrl ? '변경' : '업로드'}
            </button>
            ${profile.imgUrl ? `<button class="btn btn-danger btn-sm" onclick="removeProfileImage(${profile.id})"><i class="fa-solid fa-trash"></i> 삭제</button>` : ''}
            <input type="file" id="imgUpload-${profile.id}" accept="image/*" style="display:none"
              onchange="handleProfileImage(${profile.id}, this)" />
          </div>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  updateProfileBtn();
  renderRelationsUI();
}

// 카드 접기/펼치기 토글
function toggleCardBody(btn) {
  const card = btn.closest('.character-card');
  const body = card.querySelector('.character-card-body');
  const icon = btn.querySelector('i');
  if (body.style.display === 'none') {
    body.style.display = '';
    icon.className = 'fa-solid fa-chevron-down';
  } else {
    body.style.display = 'none';
    icon.className = 'fa-solid fa-chevron-up';
  }
}

function updateProfileBtn() {
  const btn = document.getElementById('addProfileBtn');
  btn.disabled = state.profiles.length >= 3;
}

// ===================== NODE SHAPES =====================
function getShapeChar(shape) {
  const map = {
    circle: { char: '●', outline: '●' },
    heart: { char: '♥', outline: '♥' },
    star: { char: '★', outline: '★' },
    triangle: { char: '▲', outline: '▲' },
    diamond: { char: '◆', outline: '◆' },
  };
  return map[shape] || map.circle;
}

// ===================== NODE MANAGEMENT =====================
function addNode() {
  const id = state.nextNodeId++;
  state.nodes.push({
    id,
    time: '',
    desc: '',
    gap: 40,
    color: '#4A90D9',
    shape: 'circle',
  });
  renderNodes();
  renderPreview();
}

function removeNode(id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  renderNodes();
  renderPreview();
}

function clearAllNodes() {
  if (state.nodes.length === 0) return;
  if (!confirm('타임라인 노드를 모두 삭제하시겠습니까?')) return;
  state.nodes = [];
  renderNodes();
  renderPreview();
}

function updateNode(id, field, value) {
  const node = state.nodes.find(n => n.id === id);
  if (node) {
    if (field === 'gap') {
      node[field] = parseInt(value, 10) || 0;
    } else {
      node[field] = value;
    }
    if (field === 'color' || field === 'shape') {
      const item = document.querySelector(`.node-item[data-id="${id}"]`);
      if (item) {
        const dot = item.querySelector('.node-dot-preview');
        if (dot) {
          const shapeInfo = getShapeChar(node.shape || 'circle');
          dot.textContent = shapeInfo.char;
          dot.style.color = node.color;
        }
      }
    }
    renderPreview();
  }
}

function renderNodes() {
  const list = document.getElementById('nodeList');
  if (state.nodes.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-timeline"></i><p>노드를 추가해 보세요</p></div>`;
    return;
  }
  list.innerHTML = '';
  state.nodes.forEach((node, idx) => {
    const item = document.createElement('div');
    item.className = 'node-item';
    item.dataset.id = node.id;

    const shapeInfo = getShapeChar(node.shape || 'circle');
    const shapeOptions = NODE_SHAPES.map(s =>
      `<option value="${s.value}" ${(node.shape || 'circle') === s.value ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    item.innerHTML = `
      <div class="node-item-header">
        <span class="node-dot-preview" style="color:${node.color};font-size:14px;line-height:1;">${shapeInfo.char}</span>
        <span style="font-size:0.82rem;font-weight:700;color:#4A90D9;">노드 ${idx + 1}</span>
        <span class="drag-handle" title="드래그하여 순서 변경"><i class="fa-solid fa-grip-vertical"></i></span>
        <button class="btn-icon danger" onclick="removeNode(${node.id})" title="삭제">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-group">
        <label class="form-label">시점 (자유 텍스트)</label>
        <input type="text" class="form-input" value="${escAttr(node.time)}"
          oninput="updateNode(${node.id}, 'time', this.value)" placeholder="예: 마력기 320년, 제3시대 초" />
      </div>
      <div class="form-group">
        <label class="form-label">설명</label>
        <textarea class="form-textarea" rows="2"
          oninput="updateNode(${node.id}, 'desc', this.value)"
          placeholder="사건 설명을 입력하세요">${esc(node.desc)}</textarea>
      </div>
      <div class="node-row-3">
        <div class="form-group">
          <label class="form-label">간격 (px)</label>
          <input type="number" class="form-input" value="${node.gap}" min="0" max="300"
            oninput="updateNode(${node.id}, 'gap', this.value)" placeholder="40" />
        </div>
        <div class="form-group">
          <label class="form-label">모양</label>
          <select class="form-select" onchange="updateNode(${node.id}, 'shape', this.value)">
            ${shapeOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">색상</label>
          <input type="color" value="${node.color}"
            oninput="updateNode(${node.id}, 'color', this.value)" style="width:100%;height:36px;" />
        </div>
      </div>
    `;
    list.appendChild(item);
  });
  initSortable();
}

// ===================== SORTABLE =====================
let sortable = null;
function initSortable() {
  const list = document.getElementById('nodeList');
  if (sortable) sortable.destroy();
  sortable = Sortable.create(list, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      const items = list.querySelectorAll('.node-item');
      const newOrder = [];
      items.forEach(item => {
        const id = parseInt(item.dataset.id, 10);
        const node = state.nodes.find(n => n.id === id);
        if (node) newOrder.push(node);
      });
      state.nodes = newOrder;
      renderPreview();
    }
  });
}

// ===================== PREVIEW =====================
function getSelectedFont() {
  const sel = document.getElementById('fontSelect');
  return sel ? sel.value : 'Pretendard';
}

function getFontStack(font) {
  const stacks = {
    'Pretendard': "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    'RIDIBatang': "'RIDIBatang', 'Noto Sans KR', serif",
    'Nanum Gothic': "'Nanum Gothic', 'Noto Sans KR', sans-serif",
    'Nanum Myeongjo': "'Nanum Myeongjo', 'Noto Sans KR', serif",
  };
  return stacks[font] || stacks['Pretendard'];
}

function renderPreview() {
  const font = getSelectedFont();
  const previewEl = document.getElementById('timelinePreview');
  previewEl.style.fontFamily = getFontStack(font);

  const bgColor = document.getElementById('bgColor') ? document.getElementById('bgColor').value : '#fdf8f0';
  previewEl.style.background = bgColor;

  const titleInput = document.getElementById('timelineTitle');
  const titleVal = titleInput ? titleInput.value.trim() : '';
  let titleEl = document.getElementById('timelineTitleEl');
  if (titleVal) {
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.id = 'timelineTitleEl';
      titleEl.className = 'timeline-title';
      previewEl.insertBefore(titleEl, previewEl.firstChild);
    }
    titleEl.textContent = titleVal;
  } else if (titleEl) {
    titleEl.remove();
  }

  renderProfilesPreview();
  renderTimelinePreview();
}

function renderProfilesPreview() {
  const row = document.getElementById('profilesRow');
  if (state.profiles.length === 0) {
    row.innerHTML = '';
    row.className = 'profiles-row';
    return;
  }

  // 항상 한 줄 가로 배치: 인물1 ←→ 인물2 ←→ 인물3
  let html = '<div class="profiles-inline">';

  state.profiles.forEach((p, idx) => {
    // 인접 인물 사이에 관계 화살표 표시
    if (idx > 0) {
      const prevP = state.profiles[idx - 1];
      const relLabel = getRelationLabel(prevP.id, p.id);
      html += `
        <div class="relation-arrow-block">
          ${relLabel ? `<span class="relation-label-preview">${esc(relLabel)}</span>` : '<span class="relation-label-empty"></span>'}
          <div class="relation-arrows">← →</div>
        </div>
      `;
    }

    const avatarContent = p.imgUrl
      ? `<img src="${escAttr(p.imgUrl)}" />`
      : esc(p.name.charAt(0));

    html += `
      <div class="profile-chip-v2">
        <div class="profile-avatar-v2" style="background:${AVATAR_COLORS[idx % AVATAR_COLORS.length]}">
          ${avatarContent}
        </div>
        <span class="profile-name-v2">${esc(p.name)}</span>
      </div>
    `;
  });

  html += '</div>';
  row.innerHTML = html;
  row.className = 'profiles-row';
}

function renderTimelinePreview() {
  const list = document.getElementById('timelineList');
  if (state.nodes.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-timeline"></i><p>노드를 추가하면 여기에 표시됩니다</p></div>`;
    return;
  }

  const align = document.getElementById('alignSelect') ? document.getElementById('alignSelect').value : 'left';
  const bgColor = sanitizeColor(document.getElementById('bgColor') ? document.getElementById('bgColor').value : '', '#fdf8f0');
  const lineColor = sanitizeColor(document.getElementById('lineColor') ? document.getElementById('lineColor').value : '', '#c8a97e');
  const timeTextColor = sanitizeColor(document.getElementById('timeTextColor') ? document.getElementById('timeTextColor').value : '', '#4A90D9');
  const descTextColor = sanitizeColor(document.getElementById('descTextColor') ? document.getElementById('descTextColor').value : '', '#555555');
  const lastIdx = state.nodes.length - 1;

  let html = '';

  state.nodes.forEach((node, idx) => {
    const isLast = idx === lastIdx;
    const gap = isLast ? 0 : (node.gap || 40);
    const shape = node.shape || 'circle';
    const shapeInfo = getShapeChar(shape);
    const shapeChar = isLast ? shapeInfo.char : shapeInfo.outline;
    const nodeColor = sanitizeColor(node.color, '#4A90D9');

    let alignClass = '';
    if (align === 'right') {
      alignClass = ' align-right';
    } else if (align === 'center') {
      alignClass = (idx % 2 === 0) ? ' align-center-left' : ' align-center-right';
    }

    html += `
      <div class="timeline-node${alignClass}" style="padding-bottom:${isLast ? 0 : gap}px;">
        <span class="node-shape-marker" style="color:${nodeColor};">${shapeChar}</span>
        <div class="node-time" style="color:${timeTextColor};">${esc(node.time || '시점')}</div>
        <div class="node-desc" style="color:${descTextColor};">${escDesc(node.desc || '')}</div>
      </div>
    `;
  });

  // 연결선 위치 — 마커 중심에 맞춤
  let linePos = '';
  if (align === 'right') {
    linePos = 'right:6px;left:auto;';
  } else if (align === 'center') {
    linePos = 'left:50%;transform:translateX(-50%);';
  } else {
    linePos = 'left:6px;';
  }

  list.innerHTML = `
    <div style="position:relative;">
      <div style="
        position:absolute;
        ${linePos}
        top:6px;
        width:2px;
        background:${lineColor};
        height:calc(100% - 12px);
        border-radius:2px;
      "></div>
      ${html}
    </div>
  `;
}

// ===================== EXPORT =====================
function copyHTML() {
  const preview = document.getElementById('timelinePreview');
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>연표</title>
<style>
body{font-family:'Noto Sans KR',-apple-system,sans-serif;background:#f5f7fa;display:flex;justify-content:center;padding:2rem;}
.timeline-wrapper{background:#fdf8f0;border-radius:16px;padding:2rem 1.5rem;box-shadow:0 4px 30px rgba(0,0,0,0.1);max-width:640px;width:100%;}
.timeline-title{text-align:center;font-size:1.3rem;font-weight:700;color:#333;margin-bottom:1.5rem;}
.profiles-row{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;justify-content:center;}
.profiles-inline{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:nowrap;}
.profile-chip-v2{display:flex;flex-direction:column;align-items:center;gap:0.3rem;flex-shrink:0;}
.profile-avatar-v2{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;color:#fff;overflow:hidden;}
.profile-avatar-v2 img{width:100%;height:100%;border-radius:50%;object-fit:cover;}
.profile-name-v2{font-size:0.78rem;font-weight:600;color:#333;text-align:center;}
.relation-arrow-block{display:flex;flex-direction:column;align-items:center;padding:0 0.6rem;gap:0.1rem;margin-bottom:1.1rem;}
.relation-label-preview{font-size:0.68rem;font-weight:700;color:#555;white-space:nowrap;text-align:center;max-width:120px;overflow:hidden;text-overflow:ellipsis;}
.relation-label-empty{height:0.85rem;}
.relation-arrows{font-size:0.6rem;color:#aaa;letter-spacing:1px;}
.timeline-list{position:relative;}
.timeline-node{position:relative;padding-left:24px;display:flex;flex-direction:column;}
.timeline-node.align-right{padding-left:0;padding-right:24px;text-align:right;}
.timeline-node.align-right .node-shape-marker{left:auto;right:0;}
.timeline-node.align-center-left{padding-left:0;padding-right:calc(50% + 14px);text-align:right;}
.timeline-node.align-center-left .node-shape-marker{left:auto;right:calc(50% - 7px);}
.timeline-node.align-center-right{padding-right:0;padding-left:calc(50% + 14px);text-align:left;}
.timeline-node.align-center-right .node-shape-marker{left:calc(50% - 7px);right:auto;}
.node-shape-marker{position:absolute;left:0;top:2px;font-size:14px;line-height:1;width:14px;text-align:center;}
.node-time{font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;}
.node-desc{font-size:0.88rem;line-height:1.65;white-space:pre-wrap;}
</style>
</head>
<body>
${preview.outerHTML}
</body>
</html>`;
  navigator.clipboard.writeText(html).then(() => alert('HTML이 클립보드에 복사되었습니다!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('HTML이 클립보드에 복사되었습니다!');
    });
}

function saveJSON() {
  const data = {
    version: 3,
    profiles: state.profiles,
    nodes: state.nodes,
    relations: state.relations,
    nextProfileId: state.nextProfileId,
    nextNodeId: state.nextNodeId,
    font: getSelectedFont(),
    align: document.getElementById('alignSelect') ? document.getElementById('alignSelect').value : 'left',
    bgColor: document.getElementById('bgColor') ? document.getElementById('bgColor').value : '#fdf8f0',
    lineColor: document.getElementById('lineColor') ? document.getElementById('lineColor').value : '#c8a97e',
    timeTextColor: document.getElementById('timeTextColor') ? document.getElementById('timeTextColor').value : '#4A90D9',
    descTextColor: document.getElementById('descTextColor') ? document.getElementById('descTextColor').value : '#555555',
    title: document.getElementById('timelineTitle') ? document.getElementById('timelineTitle').value : '',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'timeline-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.profiles) {
        state.profiles = data.profiles.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name || '',
          imgUrl: p.imgUrl || '',
        }));
      }
      if (data.nodes) {
        state.nodes = data.nodes.map(n => ({
          id: n.id,
          time: n.time || '',
          desc: n.desc || '',
          gap: n.gap !== undefined ? n.gap : 40,
          color: n.color || '#4A90D9',
          shape: n.shape || 'circle',
        }));
      }
      if (data.relations) {
        state.relations = data.relations;
      } else {
        rebuildRelations();
      }
      if (data.nextProfileId) state.nextProfileId = data.nextProfileId;
      if (data.nextNodeId) state.nextNodeId = data.nextNodeId;
      if (data.font) document.getElementById('fontSelect').value = data.font;
      if (data.align && document.getElementById('alignSelect')) document.getElementById('alignSelect').value = data.align;
      if (data.bgColor && document.getElementById('bgColor')) document.getElementById('bgColor').value = data.bgColor;
      if (data.lineColor && document.getElementById('lineColor')) document.getElementById('lineColor').value = data.lineColor;
      if (data.timeTextColor && document.getElementById('timeTextColor')) document.getElementById('timeTextColor').value = data.timeTextColor;
      if (data.descTextColor && document.getElementById('descTextColor')) document.getElementById('descTextColor').value = data.descTextColor;
      if (data.title !== undefined && document.getElementById('timelineTitle')) document.getElementById('timelineTitle').value = data.title;
      renderProfiles();
      renderNodes();
      renderPreview();
      alert('불러오기 완료!');
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function saveImage() {
  const preview = document.getElementById('timelinePreview');
  const bgColor = document.getElementById('bgColor') ? document.getElementById('bgColor').value : '#fdf8f0';
  html2canvas(preview, {
    scale: 2,
    backgroundColor: bgColor,
    useCORS: true,
  }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'timeline-preview.png';
    a.click();
  }).catch(() => alert('이미지 저장 중 오류가 발생했습니다.'));
}

// ===================== HELPERS =====================
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escDesc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeColor(color, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(String(color)) ? String(color) : fallback;
}
