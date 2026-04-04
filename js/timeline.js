// ===================== STATE =====================
const state = {
  profiles: [],
  nodes: [],
  nextProfileId: 1,
  nextNodeId: 1,
};

const AVATAR_COLORS = ['#4A90D9', '#e9658b', '#f5a623', '#7ed321', '#9b59b6', '#1abc9c'];

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
  if (state.profiles.length >= 6) {
    alert('인물은 최대 6인까지 추가할 수 있습니다.');
    return;
  }
  const id = state.nextProfileId++;
  state.profiles.push({ id, name: `인물 ${id}`, desc: '', imgUrl: '' });
  renderProfiles();
  renderPreview();
  updateProfileBtn();
}

function removeProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  renderProfiles();
  renderPreview();
  updateProfileBtn();
}

function updateProfile(id, field, value) {
  const profile = state.profiles.find(p => p.id === id);
  if (profile) {
    if (field === 'desc') {
      value = value.slice(0, 30);
    }
    profile[field] = value;
    renderPreview();
    if (field === 'desc') {
      const counter = document.getElementById(`descCount-${id}`);
      if (counter) counter.textContent = `${value.length}/30`;
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

function renderProfiles() {
  const list = document.getElementById('profileList');
  if (state.profiles.length === 0) {
    list.innerHTML = `<div class="text-muted" style="margin-bottom:0.8rem;">인물이 없습니다. 추가해 보세요.</div>`;
    updateProfileBtn();
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
        </div>
        <button class="btn-icon danger" onclick="removeProfile(${profile.id})" title="삭제">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="char-row">
        <div class="form-group">
          <label class="form-label">이름</label>
          <input type="text" class="form-input" value="${escAttr(profile.name)}"
            oninput="updateProfile(${profile.id}, 'name', this.value)" placeholder="인물 이름" />
        </div>
        <div class="form-group">
          <label class="form-label">짧은 설명</label>
          <input type="text" class="form-input" value="${escAttr(profile.desc)}" maxlength="30"
            oninput="updateProfile(${profile.id}, 'desc', this.value)" placeholder="예: 주인공" />
          <div class="char-count" id="descCount-${profile.id}">${profile.desc.length}/30</div>
        </div>
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
    `;
    list.appendChild(card);
  });
  updateProfileBtn();
}

function updateProfileBtn() {
  const btn = document.getElementById('addProfileBtn');
  btn.disabled = state.profiles.length >= 6;
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
    size: 10,
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
    if (field === 'gap' || field === 'size') {
      node[field] = parseInt(value, 10) || 0;
    } else {
      node[field] = value;
    }
    if (field === 'color' || field === 'size') {
      const item = document.querySelector(`.node-item[data-id="${id}"]`);
      if (item) {
        const dot = item.querySelector('.node-dot-preview');
        if (dot) {
          const color = field === 'color' ? value : node.color;
          const size = field === 'size' ? parseInt(value, 10) : node.size;
          dot.style.backgroundColor = color;
          dot.style.borderColor = color;
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
        }
        if (field === 'size') {
          const label = item.querySelector('.size-label');
          if (label) label.textContent = `${value}px`;
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
    item.innerHTML = `
      <div class="node-item-header">
        <div class="node-dot-preview" style="background-color:${node.color};border-color:${node.color};width:${node.size}px;height:${node.size}px;"></div>
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
          <label class="form-label">색상</label>
          <input type="color" value="${node.color}"
            oninput="updateNode(${node.id}, 'color', this.value)" style="width:100%;height:36px;" />
        </div>
        <div class="form-group">
          <label class="form-label">크기: <span class="size-label">${node.size}px</span></label>
          <input type="range" min="8" max="20" value="${node.size}"
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
  if (state.profiles.length === 0) {
    row.innerHTML = '';
    return;
  }
  row.innerHTML = state.profiles.map((p, idx) => {
    const avatarContent = p.imgUrl
      ? `<img src="${escAttr(p.imgUrl)}" />`
      : esc(p.name.charAt(0));
    return `
    <div class="profile-chip">
      <div class="profile-avatar" style="background:${AVATAR_COLORS[idx % AVATAR_COLORS.length]}">
        ${avatarContent}
      </div>
      <div class="profile-info">
        <strong>${esc(p.name)}</strong>
        <span>${esc(p.desc)}</span>
      </div>
    </div>
  `;
  }).join('');
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
    const dotSize = node.size || 10;
    const gap = isLast ? 0 : (node.gap || 40);

    let alignClass = '';
    let markerLeft = `${Math.round((20 - dotSize) / 2)}px`;
    let markerRight = 'auto';

    if (align === 'right') {
      alignClass = ' align-right';
      markerLeft = 'auto';
      markerRight = `${Math.round((20 - dotSize) / 2)}px`;
    } else if (align === 'center') {
      if (idx % 2 === 0) {
        alignClass = ' align-center-left';
        markerLeft = 'auto';
        markerRight = `calc(50% - ${dotSize / 2}px)`;
      } else {
        alignClass = ' align-center-right';
        markerLeft = `calc(50% - ${dotSize / 2}px)`;
        markerRight = 'auto';
      }
    }

    const nodeBg = isLast ? sanitizeColor(node.color, '#4A90D9') : bgColor;

    const markerStyle = `
      width:${dotSize}px;
      height:${dotSize}px;
      background-color:${nodeBg};
      border:2px solid ${sanitizeColor(node.color, '#4A90D9')};
      top:4px;
      left:${markerLeft};
      right:${markerRight};
    `;

    html += `
      <div class="timeline-node${alignClass}" style="padding-bottom:${isLast ? 0 : gap}px;">
        <div class="node-marker${isLast ? ' last' : ''}" style="${markerStyle}"></div>
        <div class="node-time" style="color:${timeTextColor};">${esc(node.time || '시점')}</div>
        <div class="node-desc" style="color:${descTextColor};">${escDesc(node.desc || '')}</div>
      </div>
    `;
  });

  let lineLeft = '9px';
  let lineRight = 'auto';
  if (align === 'right') {
    lineLeft = 'auto';
    lineRight = '9px';
  } else if (align === 'center') {
    lineLeft = '50%';
    lineRight = 'auto';
  }

  list.innerHTML = `
    <div style="position:relative;">
      <div style="
        position:absolute;
        left:${lineLeft};
        right:${lineRight};
        top:6px;
        width:2px;
        background:${lineColor};
        height:calc(100% - 16px);
        border-radius:2px;
        ${align === 'center' ? 'transform:translateX(-50%);' : ''}
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
.profiles-row{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;}
.profile-chip{display:flex;align-items:center;gap:0.6rem;background:#fff;border-radius:12px;padding:0.5rem 0.9rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
.profile-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:#fff;}
.profile-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;}
.profile-info strong{display:block;font-size:0.85rem;font-weight:700;color:#333;}
.profile-info span{font-size:0.75rem;color:#888;}
.timeline-list{position:relative;}
.timeline-node{position:relative;padding-left:36px;display:flex;flex-direction:column;}
.timeline-node.align-right{padding-left:0;padding-right:36px;text-align:right;}
.timeline-node.align-right .node-marker{left:auto;right:0;}
.timeline-node.align-center-left{padding-left:0;padding-right:calc(50% + 18px);text-align:right;}
.timeline-node.align-center-left .node-marker{left:auto;}
.timeline-node.align-center-right{padding-right:0;padding-left:calc(50% + 18px);text-align:left;}
.node-marker{position:absolute;border-radius:50%;border:2px solid #4A90D9;background:transparent;}
.node-marker.last{background:currentColor;border-color:currentColor;}
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
    version: 2,
    profiles: state.profiles,
    nodes: state.nodes,
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
      if (data.profiles) state.profiles = data.profiles;
      if (data.nodes) state.nodes = data.nodes;
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
