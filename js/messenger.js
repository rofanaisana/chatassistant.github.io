// ===================== STATE =====================
const state = {
  characters: [
    { id: 1, name: '이름', imgUrl: '', side: 'right' },
    { id: 2, name: '이름', imgUrl: '', side: 'left' },
  ],
  messages: [],
  nextCharId: 3,
  nextMsgId: 1,
};

const AVATAR_COLORS = ['#4A90D9', '#e9658b', '#f5a623', '#7ed321', '#9b59b6', '#1abc9c'];
const collapsedChars = new Set([1, 2]);

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  populateFontSelect('fontSelect', 'Pretendard');
  renderCharacters();
  renderMessages();
  renderPreview();
  initSortable();
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

// ===================== CHARACTER MANAGEMENT =====================
function addCharacter() {
  if (state.characters.length >= 6) {
    alert('캐릭터는 최대 6인까지 추가할 수 있습니다.');
    return;
  }
  const id = state.nextCharId++;
  state.characters.push({ id, name: `캐릭터 ${id}`, imgUrl: '', side: 'left' });
  renderCharacters();
  renderPreview();
  updateCharBtn();
}

function removeCharacter(id) {
  if (state.characters.length <= 2) {
    alert('최소 2인의 캐릭터가 필요합니다.');
    return;
  }
  state.characters = state.characters.filter(c => c.id !== id);
  collapsedChars.delete(id);
  state.messages.forEach(m => {
    if (m.type === 'chat' && !state.characters.find(c => c.id === m.charId)) {
      m.charId = state.characters[0].id;
    }
  });
  renderCharacters();
  renderMessages();
  renderPreview();
  updateCharBtn();
}

function toggleCharCard(charId) {
  if (collapsedChars.has(charId)) {
    collapsedChars.delete(charId);
  } else {
    collapsedChars.add(charId);
  }
  renderCharacters();
}

function updateCharInput(id, field, value) {
  const char = state.characters.find(c => c.id === id);
  if (char) {
    char[field] = value;
    renderPreview();
    if (field === 'name') renderCharacters();
    refreshMessageSpeakers();
  }
}

function handleCharImage(id, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const char = state.characters.find(c => c.id === id);
    if (char) {
      char.imgUrl = e.target.result;
      renderCharacters();
      renderPreview();
    }
  };
  reader.readAsDataURL(file);
}

function removeCharImage(id) {
  const char = state.characters.find(c => c.id === id);
  if (char) {
    char.imgUrl = '';
    renderCharacters();
    renderPreview();
  }
}

function renderCharacters() {
  const list = document.getElementById('characterList');
  list.innerHTML = '';
  state.characters.forEach((char, idx) => {
    const card = document.createElement('div');
    card.className = 'character-card';
    const isCollapsed = collapsedChars.has(char.id);
    const imgPreviewHTML = char.imgUrl
      ? `<img src="${escAttr(char.imgUrl)}" class="char-img-preview" alt="프로필" />`
      : `<div class="char-img-placeholder"><i class="fa-solid fa-user"></i></div>`;
    card.innerHTML = `
      <div class="character-card-header" onclick="toggleCharCard(${char.id})">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="character-num">캐릭터 ${idx + 1}</span>
          <span style="font-size:0.82rem;color:#555;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(char.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.3rem;">
          <i class="fa-solid fa-chevron-down" style="font-size:0.75rem;color:#aaa;transition:transform 0.2s;${isCollapsed ? 'transform:rotate(-90deg);' : ''}"></i>
          <button class="btn-icon danger" onclick="event.stopPropagation();removeCharacter(${char.id})" title="삭제">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="char-card-body${isCollapsed ? ' collapsed' : ''}" id="charBody-${char.id}">
        <div class="char-row">
          <div class="form-group">
            <label class="form-label">이름</label>
            <input type="text" class="form-input" value="${escAttr(char.name)}"
              oninput="updateCharInput(${char.id}, 'name', this.value)" placeholder="캐릭터 이름" />
          </div>
          <div class="form-group">
            <label class="form-label">말풍선 위치</label>
            <select class="form-select" onchange="updateCharInput(${char.id}, 'side', this.value)">
              <option value="left" ${char.side === 'left' ? 'selected' : ''}>← 좌측</option>
              <option value="right" ${char.side === 'right' ? 'selected' : ''}>→ 우측</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">프로필 이미지</label>
          <div class="char-img-upload-area">
            ${imgPreviewHTML}
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('charImg-${char.id}').click()" style="flex:1;">
              <i class="fa-solid fa-camera"></i> ${char.imgUrl ? '변경' : '업로드'}
            </button>
            ${char.imgUrl ? `<button class="btn btn-danger btn-sm" onclick="removeCharImage(${char.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
          <input type="file" id="charImg-${char.id}" accept="image/*" style="display:none"
            onchange="handleCharImage(${char.id}, this)" />
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  updateCharBtn();
}

function updateCharBtn() {
  const btn = document.getElementById('addCharBtn');
  btn.disabled = state.characters.length >= 6;
}

// ===================== MESSAGE MANAGEMENT =====================
function addMessage(type) {
  const defaultChar = state.characters[0];
  const id = state.nextMsgId++;
  const msg = { id, type, charId: defaultChar ? defaultChar.id : null, text: '' };
  state.messages.push(msg);
  renderMessages();
  renderPreview();
  const list = document.getElementById('messageList');
  list.scrollTop = list.scrollHeight;
}

function removeMessage(id) {
  state.messages = state.messages.filter(m => m.id !== id);
  renderMessages();
  renderPreview();
}

function clearAllMessages() {
  if (state.messages.length === 0) return;
  if (!confirm('대화 내용을 모두 삭제하시겠습니까?')) return;
  state.messages = [];
  renderMessages();
  renderPreview();
}

function moveMessage(id, direction) {
  const idx = state.messages.findIndex(m => m.id === id);
  if (idx < 0) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= state.messages.length) return;
  [state.messages[idx], state.messages[newIdx]] = [state.messages[newIdx], state.messages[idx]];
  renderMessages();
  renderPreview();
}

function updateMessage(id, field, value) {
  const msg = state.messages.find(m => m.id === id);
  if (msg) {
    if (field === 'charId') {
      msg[field] = parseInt(value, 10);
    } else {
      msg[field] = value;
    }
    renderPreview();
  }
}

function renderMessages() {
  const list = document.getElementById('messageList');
  if (state.messages.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-comment-dots"></i><p>메시지를 추가해 보세요</p></div>`;
    return;
  }
  list.innerHTML = '';
  state.messages.forEach((msg, idx) => {
    const item = document.createElement('div');
    item.className = 'message-item';
    item.dataset.id = msg.id;

    let badgeClass = 'badge-chat';
    let badgeText = '대사';
    if (msg.type === 'scene') { badgeClass = 'badge-system'; badgeText = '시스템'; }

    const speakerSelect = msg.type !== 'scene'
      ? `<select class="form-select" style="flex:1;min-width:0;" onchange="updateMessage(${msg.id}, 'charId', this.value)">
          ${state.characters.map(c => `<option value="${c.id}" ${c.id === msg.charId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>`
      : `<span class="text-muted" style="flex:1;font-size:0.82rem;">시스템 메시지</span>`;

    const placeholder = msg.type === 'scene' ? '시스템 메시지를 입력하세요' : '대사를 입력하세요';
    const isFirst = idx === 0;
    const isLast = idx === state.messages.length - 1;

    item.innerHTML = `
      <div class="message-item-header">
        <span class="message-type-badge ${badgeClass}">${badgeText}</span>
        ${speakerSelect}
        <button class="btn-icon" onclick="moveMessage(${msg.id}, -1)" title="위로 이동" ${isFirst ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-up"></i>
        </button>
        <button class="btn-icon" onclick="moveMessage(${msg.id}, 1)" title="아래로 이동" ${isLast ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <span class="drag-handle" title="드래그하여 순서 변경"><i class="fa-solid fa-grip-vertical"></i></span>
        <button class="btn-icon danger" onclick="removeMessage(${msg.id})" title="삭제">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <textarea class="form-textarea" rows="2" placeholder="${placeholder}"
        oninput="updateMessage(${msg.id}, 'text', this.value)">${esc(msg.text)}</textarea>
    `;
    list.appendChild(item);
  });
  initSortable();
}

function refreshMessageSpeakers() {
  document.querySelectorAll('#messageList .message-item').forEach(item => {
    const id = parseInt(item.dataset.id, 10);
    const msg = state.messages.find(m => m.id === id);
    if (!msg || msg.type === 'scene') return;
    const sel = item.querySelector('select');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = state.characters.map(c =>
      `<option value="${c.id}" ${String(c.id) === currentVal ? 'selected' : ''}>${esc(c.name)}</option>`
    ).join('');
  });
}

// ===================== SORTABLE =====================
let sortable = null;
function initSortable() {
  const list = document.getElementById('messageList');
  if (sortable) sortable.destroy();
  sortable = Sortable.create(list, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      const items = list.querySelectorAll('.message-item');
      const newOrder = [];
      items.forEach(item => {
        const id = parseInt(item.dataset.id, 10);
        const msg = state.messages.find(m => m.id === id);
        if (msg) newOrder.push(msg);
      });
      state.messages = newOrder;
      renderMessages();
      renderPreview();
    }
  });
}

// ===================== PREVIEW =====================
function onThemeChange() {
  const theme = document.getElementById('themeSelect').value;
  const customOpts = document.getElementById('customThemeOptions');
  if (theme === 'custom') {
    customOpts.classList.add('visible');
  } else {
    customOpts.classList.remove('visible');
  }
  renderPreview();
}

function getSelectedFont() {
  const sel = document.getElementById('fontSelect');
  return sel ? sel.value : 'Pretendard';
}

function applyCustomThemeStyles() {
  const bg = document.getElementById('customBg').value;
  const leftBubble = document.getElementById('customLeftBubble').value;
  const leftText = document.getElementById('customLeftText').value;
  const rightBubble = document.getElementById('customRightBubble').value;
  const rightText = document.getElementById('customRightText').value;
  const headerBg = document.getElementById('customHeaderBg').value;
  const headerText = document.getElementById('customHeaderText').value;

  const preview = document.getElementById('messengerPreview');
  const header = preview.querySelector('.messenger-header');
  const body = preview.querySelector('.messenger-body');

  preview.style.background = bg;
  if (header) { header.style.background = headerBg; header.style.color = headerText; }
  if (body) {
    body.querySelectorAll('.bubble-row.left .bubble-text').forEach(el => { el.style.background = leftBubble; el.style.color = leftText; });
    body.querySelectorAll('.bubble-row.right .bubble-text').forEach(el => { el.style.background = rightBubble; el.style.color = rightText; });
  }
}

function renderPreview() {
  const theme = document.getElementById('themeSelect').value;
  const roomName = document.getElementById('roomName').value || '채팅방';
  const font = getSelectedFont();

  const wrap = document.getElementById('messengerPreviewWrap');
  wrap.className = `theme-${theme}`;
  document.getElementById('previewRoomName').textContent = roomName;

  const previewEl = document.getElementById('messengerPreview');
  previewEl.style.fontFamily = getFontStack(font);

  const body = document.getElementById('previewBody');
  if (state.messages.length === 0) {
    body.innerHTML = `<div class="empty-state"><i class="fa-regular fa-comment-dots"></i><p>대화를 추가하면 여기에 표시됩니다</p></div>`;
    if (theme === 'custom') applyCustomThemeStyles();
    return;
  }

  const html = state.messages.map(msg => buildMessageHTML(msg)).join('');
  body.innerHTML = html;

  if (theme === 'custom') {
    applyCustomThemeStyles();
  } else {
    previewEl.style.background = '';
    const header = previewEl.querySelector('.messenger-header');
    if (header) { header.style.background = ''; header.style.color = ''; }
  }
}

function buildMessageHTML(msg) {
  if (msg.type === 'scene') {
    return `<div class="scene-block"><span class="scene-text">${esc(msg.text || '시스템 메시지')}</span></div>`;
  }
  const char = state.characters.find(c => c.id === msg.charId) || state.characters[0];
  if (!char) return '';
  const side = char.side || 'left';
  const charIdx = state.characters.indexOf(char);
  const avatarHTML = char.imgUrl
    ? `<img src="${escAttr(char.imgUrl)}" class="avatar-circle" alt="${escAttr(char.name)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />`
    : `<div class="avatar-circle avatar-color-${charIdx % 6}" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#fff;">${esc(char.name.charAt(0))}</div>`;

  return `
    <div class="bubble-row ${side}">
      ${avatarHTML}
      <div class="bubble-content">
        <div class="bubble-name">${esc(char.name)}</div>
        <div class="bubble-text">${esc(msg.text || '')}</div>
      </div>
    </div>
  `;
}

// ===================== EXPORT =====================
function copyHTML() {
  const preview = document.getElementById('messengerPreview');
  const theme = document.getElementById('themeSelect').value;
  const html = `<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n<title>메신저 대화</title>\n<style>\n${getThemeCSS(theme)}\n</style>\n</head>\n<body style="background:#f5f7fa;display:flex;justify-content:center;padding:2rem;margin:0;">\n${preview.outerHTML}\n</body>\n</html>`;
  navigator.clipboard.writeText(html).then(() => alert('HTML이 클립보드에 복사되었습니다!'))
    .catch(() => { const ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('HTML이 클립보드에 복사되었습니다!'); });
}

function saveJSON() {
  const data = {
    version: 2,
    characters: state.characters,
    messages: state.messages,
    nextCharId: state.nextCharId,
    nextMsgId: state.nextMsgId,
    roomName: document.getElementById('roomName').value,
    theme: document.getElementById('themeSelect').value,
    font: getSelectedFont(),
    customTheme: {
      bg: document.getElementById('customBg').value,
      leftBubble: document.getElementById('customLeftBubble').value,
      leftText: document.getElementById('customLeftText').value,
      rightBubble: document.getElementById('customRightBubble').value,
      rightText: document.getElementById('customRightText').value,
      headerBg: document.getElementById('customHeaderBg').value,
      headerText: document.getElementById('customHeaderText').value,
    },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'messenger-backup.json'; a.click(); URL.revokeObjectURL(a.href);
}

function loadJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.characters) { state.characters = data.characters; collapsedChars.clear(); data.characters.forEach(c => collapsedChars.add(c.id)); }
      if (data.messages) {
        const filtered = []; let actionCount = 0;
        data.messages.forEach(m => { if (m.type === 'action') { actionCount++; } else { filtered.push(m); } });
        state.messages = filtered;
        if (actionCount > 0) console.warn(`불러오기: '지문(action)' 타입 메시지 ${actionCount}개가 제거되었습니다.`);
      }
      if (data.nextCharId) state.nextCharId = data.nextCharId;
      if (data.nextMsgId) state.nextMsgId = data.nextMsgId;
      if (data.roomName) document.getElementById('roomName').value = data.roomName;
      if (data.theme) document.getElementById('themeSelect').value = data.theme;
      if (data.font) populateFontSelect('fontSelect', data.font);
      if (data.customTheme) {
        document.getElementById('customBg').value = data.customTheme.bg || '#f0f2f5';
        document.getElementById('customLeftBubble').value = data.customTheme.leftBubble || '#e8f4fe';
        document.getElementById('customLeftText').value = data.customTheme.leftText || '#222222';
        document.getElementById('customRightBubble').value = data.customTheme.rightBubble || '#c8e6ff';
        document.getElementById('customRightText').value = data.customTheme.rightText || '#1a2c3d';
        document.getElementById('customHeaderBg').value = data.customTheme.headerBg || '#4A90D9';
        document.getElementById('customHeaderText').value = data.customTheme.headerText || '#ffffff';
      }
      const customOpts = document.getElementById('customThemeOptions');
      if (data.theme === 'custom') { customOpts.classList.add('visible'); } else { customOpts.classList.remove('visible'); }
      renderCharacters(); renderMessages(); renderPreview();
      alert('불러오기 완료!');
    } catch (err) { alert('파일을 읽는 중 오류가 발생했습니다.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

function saveImage() {
  const preview = document.getElementById('messengerPreview');
  html2canvas(preview, { scale: 2, backgroundColor: null, useCORS: true })
    .then(canvas => { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'messenger-preview.png'; a.click(); })
    .catch(() => alert('이미지 저장 중 오류가 발생했습니다.'));
}

// ===================== HELPERS =====================
function esc(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>'); }
function escAttr(str) { return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function getThemeCSS(theme) {
  const base = `.messenger-preview{border-radius:16px;overflow:hidden;min-height:300px;display:flex;flex-direction:column;}.messenger-header{padding:1rem 1.2rem;}.messenger-header .room-name{font-size:1rem;font-weight:700;}.messenger-body{flex:1;padding:1rem;display:flex;flex-direction:column;gap:0.6rem;}.bubble-row{display:flex;align-items:flex-end;gap:0.5rem;}.bubble-row.right{flex-direction:row-reverse;}.avatar-circle{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#fff;}.bubble-content{display:flex;flex-direction:column;max-width:70%;}.bubble-row.right .bubble-content{align-items:flex-end;}.bubble-name{font-size:0.72rem;font-weight:600;margin-bottom:0.2rem;opacity:0.7;}.bubble-text{padding:0.5rem 0.85rem;border-radius:18px;font-size:0.9rem;line-height:1.5;word-break:break-word;white-space:pre-wrap;}.scene-block{display:flex;align-items:center;gap:0.7rem;padding:0.4rem 0.6rem;}.scene-block::before,.scene-block::after{content:'';flex:1;height:1px;opacity:0.3;}.scene-text{font-size:0.8rem;font-weight:600;white-space:nowrap;opacity:0.75;}`;
  const themes = {
    kakao: base + `.messenger-preview{background:#B2C7D9;}.messenger-header{background:#a8bfcf;}.messenger-header .room-name{color:#fff;}.bubble-row.left .bubble-text{background:#fff;color:#222;border-radius:0 18px 18px 18px;}.bubble-row.right .bubble-text{background:#FEE500;color:#222;border-radius:18px 0 18px 18px;}.bubble-name{color:#333;}.scene-block::before,.scene-block::after{background:#666;}.scene-text{color:#444;}`,
    line: base + `.messenger-preview{background:#f5f5f5;}.messenger-header{background:#06C755;}.messenger-header .room-name{color:#fff;}.bubble-row.left .bubble-text{background:#fff;color:#222;border-radius:0 18px 18px 18px;}.bubble-row.right .bubble-text{background:#06C755;color:#fff;border-radius:18px 0 18px 18px;}.bubble-name{color:#555;}.scene-block::before,.scene-block::after{background:#999;}.scene-text{color:#666;}`,
    twitter: base + `.messenger-preview{background:#fff;}.messenger-header{background:#fff;border-bottom:1px solid #e7e7e7;}.messenger-header .room-name{color:#0f1419;}.bubble-row.left .bubble-text{background:#eff3f4;color:#0f1419;border-radius:4px 18px 18px 18px;}.bubble-row.right .bubble-text{background:#1D9BF0;color:#fff;border-radius:18px 4px 18px 18px;}.bubble-name{color:#536471;}.scene-block::before,.scene-block::after{background:#cfd9de;}.scene-text{color:#536471;}`,
    light: base + `.messenger-preview{background:#f8f9fb;}.messenger-header{background:#fff;border-bottom:1px solid #e8eaf0;}.messenger-header .room-name{color:#333;}.bubble-row.left .bubble-text{background:#e8f4fe;color:#2c3e50;border-radius:4px 18px 18px 18px;}.bubble-row.right .bubble-text{background:#c8e6ff;color:#1a2c3d;border-radius:18px 4px 18px 18px;}.bubble-name{color:#666;}.scene-block::before,.scene-block::after{background:#bbb;}.scene-text{color:#888;}`,
    dark: base + `.messenger-preview{background:#1a1a2e;}.messenger-header{background:#16213e;}.messenger-header .room-name{color:#e0e0e0;}.bubble-row.left .bubble-text{background:#2a2a4a;color:#ddd;border-radius:4px 18px 18px 18px;}.bubble-row.right .bubble-text{background:#0f3460;color:#e0e0e0;border-radius:18px 4px 18px 18px;}.bubble-name{color:#aaa;}.scene-block::before,.scene-block::after{background:#555;}.scene-text{color:#aaa;}`,
    custom: base + `.messenger-preview{background:#f0f2f5;}.messenger-header{background:#4A90D9;}.messenger-header .room-name{color:#fff;}.bubble-name{opacity:0.7;}.bubble-row.left .bubble-text{border-radius:0 18px 18px 18px;}.bubble-row.right .bubble-text{border-radius:18px 0 18px 18px;}.scene-block::before,.scene-block::after{background:currentColor;opacity:0.3;}.scene-text{opacity:0.75;}`,
  };
  return themes[theme] || themes.kakao;
}
