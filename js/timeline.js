// ===================== STATE =====================
const state = {
  profiles: [],
  nodes: [],
  relations: [],
  nextProfileId: 1,
  nextNodeId: 1,
};

const AVATAR_COLORS = ['#4A90D9', '#e9658b', '#f5a623', '#7ed321', '#9b59b6', '#1abc9c'];
const collapsedProfiles = new Set();

const NODE_SHAPES = [
  { value: 'circle', label: '● 원', icon: '●' },
  { value: 'heart', label: '♥ 하트', icon: '♥' },
  { value: 'star', label: '★ 별', icon: '★' },
  { value: 'triangle', label: '▲ 세모', icon: '▲' },
  { value: 'diamond', label: '◆ 마름모', icon: '◆' },
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
  collapsedProfiles.delete(id);
  rebuildRelations();
  renderProfiles();
  renderPreview();
  updateProfileBtn();
}

function toggleProfileCard(id) {
  if (collapsedProfiles.has(id)) {
    collapsedProfiles.delete(id);
  } else {
    collapsedProfiles.add(id);
  }
  renderProfiles();
}

function updateProfile(id, field, value) {
  const profile = state.profiles.find(p => p.id === id);
  if (profile) {
    profile[field] = value;
    renderPreview();
    if (field === 'name') {
      renderProfiles();
    }
  }
}

function handleProfileImage(id, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const profile = state.profiles.find(p => p.id === id);
    if (profile) { profile.imgUrl = e.target.result; renderProfiles(); renderPreview(); }
  };
  reader.readAsDataURL(file);
}

function removeProfileImage(id) {
  const profile = state.profiles.find(p => p.id === id);
  if (profile) { profile.imgUrl = ''; renderProfiles(); renderPreview(); }
}

// ===================== RELATION MANAGEMENT =====================
function rebuildRelations() {
  const newRelations = [];
  for (let i = 0; i < state.profiles.length; i++) {
    for (let j = i + 1; j < state.profiles.length; j++) {
      const a = state.profiles[i].id;
      const b = state.profiles[j].id;
      const existing = state.relations.find(r =>
        (r.from === a && r.to === b) || (r.from === b && r.to === a)
      );
      newRelations.push({
        from: a,
        to: b,
        label: existing ? existing.label : '',
      });
    }
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
    const isCollapsed = collapsedProfiles.has(profile.id);
    const avatarPreview = profile.imgUrl
      ? `<img src="${escAttr(profile.imgUrl)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;" />`
      : esc(profile.name.charAt(0));
    card.innerHTML = `
      <div class="character-card-header" onclick="toggleProfileCard(${profile.id})">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div class="profile-avatar" style="background:${AVATAR_COLORS[idx % AVATAR_COLORS.length]};width:28px;height:28px;font-size:0.7rem;">
            ${avatarPreview}
          </div>
          <span class="character-num">인물 ${idx + 1}</span>
          <span style="font-size:0.82rem;color:#555;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(profile.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.3rem;">
          <i class="fa-solid fa-chevron-down" style="font-size:0.75rem;color:#aaa;transition:transform 0.2s;${isCollapsed ? 'transform:rotate(-90deg);' : ''}"></i>
          <button class="btn-icon danger" onclick="event.stopPropagation();removeProfile(${profile.id})" title="삭제">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="char-card-body${isCollapsed ? ' collapsed' : ''}">
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

function updateProfileBtn() {
  const btn = document.getElementById('addProfileBtn');
  btn.disabled = state.profiles.length >= 3;
}

// ===================== NODE MANAGEMENT =====================
function addNode() {
  const id = state.nextNodeId++;
  state.nodes.push({
    id,
    time: '',
    desc: '',
    color: '#4A90D9',
    size: 14,
    shape: 'circle',
    centerSide: 'left',
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
    if (field === 'size') {
      node[field] = parseInt(value, 10) || 14;
    } else {
      node[field] = value;
    }
    if (field === 'color' || field === 'size' || field === 'shape') {
      // 도트 프리뷰 업데이트
      const item = document.querySelector(`.node-item[data-id="${id}"]`);
      if (item) {
        const dot = item.querySelector('.node-dot-preview');
        if (dot) {
          updateDotPreview(dot, node);
        }
        if (field === 'size') {
          const label = item.querySelector('.size-label');
          if (label) label.textContent = `${value}px`;
        }
      }
    }
    if (field === 'centerSide') {
      renderNodes();
    }
    renderPreview();
  }
}

function updateDotPreview(dot, node) {
  const shapeInfo = getShapeChar(node.shape || 'circle');
  dot.textContent = shapeInfo.char;
  dot.style.color = node.color;
  dot.style.fontSize = `${node.size || 14}px`;
  dot.style.lineHeight = '1';
}

function getShapeChar(shape) {
  const map = {
    circle: { char: '●', outline: '○' },
    heart: { char: '♥', outline: '♡' },
    star: { char: '★', outline: '☆' },
    triangle: { char: '▲', outline: '△' },
    diamond: { char: '◆', outline: '◇' },
  };
  return map[shape] || map.circle;
}

function renderNodes() {
  const list = document.getElementById('nodeList');
  if (state.nodes.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-timeline"></i><p>노드를 추가해 보세요</p></div>`;
    return;
  }
  const align = document.getElementById('alignSelect') ? document.getElementById('alignSelect').value : 'left';
  list.innerHTML = '';
  state.nodes.forEach((node, idx) => {
    const item = document.createElement('div');
    item.className = 'node-item';
    item.dataset.id = node.id;

    const shapeInfo = getShapeChar(node.shape || 'circle');

    const centerSideUI = align === 'center' ? `
      <div class="form-group">
        <label class="form-label">배치</label>
        <select class="form-select" onchange="updateNode(${node.id}, 'centerSide', this.value)">
          <option value="left" ${(node.centerSide || 'left') === 'left' ? 'selected' : ''}>← 좌측</option>
          <option value="right" ${node.centerSide === 'right' ? 'selected' : ''}>→ 우측</option>
        </select>
      </div>
    ` : '';

    const shapeOptions = NODE_SHAPES.map(s =>
      `<option value="${s.value}" ${(node.shape || 'circle') === s.value ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    item.innerHTML = `
      <div class="node-item-header">
        <span class="node-dot-preview" style="color:${node.color};font-size:${node.size || 14}px;line-height:1;">${shapeInfo.char}</span>
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
      <div class="node-row">
        ${centerSideUI}
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
        <div class="form-group">
          <label class="form-label">크기: <span class="size-label">${node.size || 14}px</span></label>
          <input type="range" min="10" max="24" value="${node.size || 14}"
            oninput="updateNode(${node.id}, 'size', this.value)" />
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
  if (state.profiles.length === 0) { row.innerHTML = ''; row.className = 'profiles-row-v2'; return; }

  row.className = 'profiles-row-v2';
  let html = '<div class="profiles-inline">';

  state.profiles.forEach((p, idx) => {
    if (idx > 0) {
      // 인접한 인물 간 관계
      const rel = state.relations.find(r =>
        (r.from === state.profiles[idx - 1].id && r.to === p.id) ||
        (r.from === p.id && r.to === state.profiles[idx - 1].id)
      );
      const label = rel && rel.label ? esc(rel.label) : '';
      html += `
        <div class="relation-arrow-block">
          ${label ? `<span class="relation-label">${label}</span>` : '<span class="relation-label" style="visibility:hidden;">·</span>'}
          <div class="relation-arrows">
            <span>←</span>
            <span>→</span>
          </div>
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

  // 3인일 때 1↔3 관계 (아래 브릿지)
  if (state.profiles.length === 3) {
    const rel13 = state.relations.find(r =>
      (r.from === state.profiles[0].id && r.to === state.profiles[2].id) ||
      (r.from === state.profiles[2].id && r.to === state.profiles[0].id)
    );
    if (rel13 && rel13.label) {
      html += `
        <div class="relation-bridge">
          <span class="relation-bridge-line"></span>
          <span class="relation-bridge-content">
            <span class="relation-bridge-names">${esc(state.profiles[0].name)} ↔ ${esc(state.profiles[2].name)}</span>
            <span class="relation-bridge-label">${esc(rel13.label)}</span>
          </span>
          <span class="relation-bridge-line"></span>
        </div>
      `;
    }
  }

  row.innerHTML = html;
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
  const defaultGap = 40;

  let html = '';

  state.nodes.forEach((node, idx) => {
    const isLast = idx === lastIdx;
    const dotSize = node.size || 14;
    const gap = isLast ? 0 : defaultGap;
    const shape = node.shape || 'circle';
    const shapeInfo = getShapeChar(shape);

    // 마지막 노드는 채워진 문자, 나머지는 비어있는 문자
    const shapeChar = isLast ? shapeInfo.char : shapeInfo.outline;

    let alignClass = '';
    let markerStyle = '';

    if (align === 'right') {
      alignClass = ' align-right';
      markerStyle = `position:absolute;right:0;top:0;font-size:${dotSize}px;line-height:1;color:${sanitizeColor(node.color, '#4A90D9')};`;
    } else if (align === 'center') {
      const side = node.centerSide || 'left';
      if (side === 'left') {
        alignClass = ' align-center-left';
        markerStyle = `position:absolute;right:calc(50% - ${dotSize / 2}px);top:0;font-size:${dotSize}px;line-height:1;color:${sanitizeColor(node.color, '#4A90D9')};`;
      } else {
        alignClass = ' align-center-right';
        markerStyle = `position:absolute;left:calc(50% - ${dotSize / 2}px);top:0;font-size:${dotSize}px;line-height:1;color:${sanitizeColor(node.color, '#4A90D9')};`;
      }
    } else {
      // left (기본)
      markerStyle = `position:absolute;left:0;top:0;font-size:${dotSize}px;line-height:1;color:${sanitizeColor(node.color, '#4A90D9')};`;
    }

    html += `
      <div class="timeline-node${alignClass}" style="padding-bottom:${isLast ? 0 : gap}px;">
        <span class="node-shape-marker" style="${markerStyle}">${shapeChar}</span>
        <div class="node-time" style="color:${timeTextColor};">${esc(node.time || '시점')}</div>
        <div class="node-desc" style="color:${descTextColor};">${escDesc(node.desc || '')}</div>
      </div>
    `;
  });

  // 연결선 위치
  let lineLeft = '6px';
  let lineRight = 'auto';
  let lineTransform = '';
  if (align === 'right') { lineLeft = 'auto'; lineRight = '6px'; }
  else if (align === 'center') { lineLeft = '50%'; lineRight = 'auto'; lineTransform = 'transform:translateX(-50%);'; }

  list.innerHTML = `
    <div style="position:relative;">
      <div style="
        position:absolute;
        left:${lineLeft};
        right:${lineRight};
        top:8px;
        width:2px;
        background:${lineColor};
        height:calc(100% - 16px);
        border-radius:2px;
        ${lineTransform}
      "></div>
      ${html}
    </div>
  `;
}

// ===================== EXPORT =====================
function copyHTML() {
  const preview = document.getElementById('timelinePreview');
  const html = `<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n<title>연표</title>\n<style>\nbody{font-family:'Noto Sans KR',-apple-system,sans-serif;background:#f5f7fa;display:flex;justify-content:center;padding:2rem;}\n.timeline-wrapper{background:#fdf8f0;border-radius:16px;padding:2rem 1.5rem;box-shadow:0 4px 30px rgba(0,0,0,0.1);max-width:640px;width:100%;}\n.timeline-title{text-align:center;font-size:1.3rem;font-weight:700;color:#333;margin-bottom:1.5rem;}\n.profiles-row-v2{margin-bottom:2rem;}\n.profiles-inline{display:flex;align-items:center;justify-content:center;gap:0;}\n.profile-chip-v2{display:flex;flex-direction:column;align-items:center;gap:0.3rem;}\n.profile-avatar-v2{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;color:#fff;overflow:hidden;}\n.profile-avatar-v2 img{width:100%;height:100%;border-radius:50%;object-fit:cover;}\n.profile-name-v2{font-size:0.78rem;font-weight:600;color:#333;text-align:center;}\n.relation-arrow-block{display:flex;flex-direction:column;align-items:center;padding:0 0.5rem;gap:0.1rem;margin-bottom:1.1rem;}\n.relation-label{font-size:0.68rem;font-weight:700;color:#555;}\n.relation-arrows{font-size:0.6rem;color:#aaa;letter-spacing:1px;}\n.relation-bridge{display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-top:0.3rem;}\n.relation-bridge-line{flex:1;max-width:40px;height:1px;background:#ccc;}\n.relation-bridge-content{display:flex;flex-direction:column;align-items:center;gap:0.05rem;}\n.relation-bridge-names{font-size:0.65rem;color:#aaa;}\n.relation-bridge-label{font-size:0.7rem;font-weight:700;color:#555;}\n.timeline-list{position:relative;}\n.timeline-node{position:relative;padding-left:28px;display:flex;flex-direction:column;text-align:left;}\n.timeline-node.align-right{padding-left:0;padding-right:28px;text-align:right;}\n.timeline-node.align-center-left{padding-left:0;padding-right:calc(50% + 14px);text-align:right;}\n.timeline-node.align-center-right{padding-right:0;padding-left:calc(50% + 14px);text-align:left;}\n.node-shape-marker{position:absolute;line-height:1;}\n.node-time{font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;}\n.node-desc{font-size:0.88rem;line-height:1.65;white-space:pre-wrap;word-break:break-word;}\n</style>\n</head>\n<body>\n${preview.outerHTML}\n</body>\n</html>`;
  navigator.clipboard.writeText(html).then(() => alert('HTML이 클립보드에 복사되었습니다!'))
    .catch(() => { const ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('HTML이 클립보드에 복사되었습니다!'); });
}

function saveJSON() {
  const data = {
    version: 4,
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
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'timeline-backup.json'; a.click(); URL.revokeObjectURL(a.href);
}

function loadJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.profiles) {
        state.profiles = data.profiles.map(p => ({
          id: p.id, name: p.name || '', imgUrl: p.imgUrl || ''
        }));
        collapsedProfiles.clear();
        data.profiles.forEach(p => collapsedProfiles.add(p.id));
      }
      if (data.nodes) {
        state.nodes = data.nodes.map(n => ({
          ...n,
          centerSide: n.centerSide || 'left',
          shape: n.shape || 'circle',
          size: n.size || 14,
        }));
      }
      if (data.relations) { state.relations = data.relations; } else { rebuildRelations(); }
      if (data.nextProfileId) state.nextProfileId = data.nextProfileId;
      if (data.nextNodeId) state.nextNodeId = data.nextNodeId;
      if (data.font) document.getElementById('fontSelect').value = data.font;
      if (data.align && document.getElementById('alignSelect')) document.getElementById('alignSelect').value = data.align;
      if (data.bgColor && document.getElementById('bgColor')) document.getElementById('bgColor').value = data.bgColor;
      if (data.lineColor && document.getElementById('lineColor')) document.getElementById('lineColor').value = data.lineColor;
      if (data.timeTextColor && document.getElementById('timeTextColor')) document.getElementById('timeTextColor').value = data.timeTextColor;
      if (data.descTextColor && document.getElementById('descTextColor')) document.getElementById('descTextColor').value = data.descTextColor;
      if (data.title !== undefined && document.getElementById('timelineTitle')) document.getElementById('timelineTitle').value = data.title;
      renderProfiles(); renderNodes(); renderPreview();
      alert('불러오기 완료!');
    } catch (err) { alert('파일을 읽는 중 오류가 발생했습니다.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

function saveImage() {
  const preview = document.getElementById('timelinePreview');
  const bgColor = document.getElementById('bgColor') ? document.getElementById('bgColor').value : '#fdf8f0';
  html2canvas(preview, { scale: 2, backgroundColor: bgColor, useCORS: true })
    .then(canvas => { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'timeline-preview.png'; a.click(); })
    .catch(() => alert('이미지 저장 중 오류가 발생했습니다.'));
}

// ===================== HELPERS =====================
function esc(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escDesc(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>'); }
function escAttr(str) { return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitizeColor(color, fallback) { return /^#[0-9a-fA-F]{6}$/.test(String(color)) ? String(color) : fallback; }
