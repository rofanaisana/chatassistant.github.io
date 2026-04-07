/* ================================================================
   checklist.js — Chat Backup 체크리스트 페이지 로직 (v2)
   ================================================================ */

// ─── State ─────────────────────────────────────────────
let state = {
  mainTitle: '',
  bgColor: '#f8f9fb',
  bgImage: '',
  bgBlur: 0,
  imgShape: 'circle',
  tiltA: -3,
  tiltB: 3,
  charA: { name: '캐릭터 A', image: '' },
  charB: { name: '캐릭터 B', image: '' },
  checkA: { shape: 'check', color: '#4A90D9', customImage: '' },
  checkB: { shape: 'heart', color: '#e9658b', customImage: '' },
  fonts: {
    title:  { family: 'Pretendard', size: 22, color: '#222222' },
    aName:  { family: 'Pretendard', size: 14, color: '#333333' },
    bName:  { family: 'Pretendard', size: 14, color: '#333333' },
    q:      { family: 'Pretendard', size: 14, color: '#333333' },
    aCmt:   { family: 'Pretendard', size: 13, color: '#666666' },
    bCmt:   { family: 'Pretendard', size: 13, color: '#666666' },
    cat:    { family: 'Pretendard', size: 16, color: '#444444' },
  },
  items: []
  // question: { type, id, question, checkA, checkB, commentA, commentB }
  // separator: { type, id, sepStyle, sepImage }
  // category: { type, id, title }
};

let itemIdCounter = 0;
let sortableInstance = null;

// ─── Check symbols ─────────────────────────────────────
const CHECK_SYMBOLS = {
  check: '✓',
  circle: '●',
  star: '★',
  heart: '♥',
  cross: '✕'
};

const SEP_STYLES = [
  { value: 'solid',  label: '── 실선' },
  { value: 'dashed', label: '- - 점선' },
  { value: 'dotted', label: '··· 도트' },
  { value: 'double', label: '═══ 이중선' },
  { value: 'wave',   label: '〰 물결' },
  { value: 'custom', label: '🖼️ 커스텀 이미지' },
];

// ─── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPreview();
  initSortable();
});

// ─── Accordion ─────────────────────────────────────────
function toggleAccordion(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

// ─── Mobile tabs ───────────────────────────────────────
function switchTab(tab) {
  const editor = document.getElementById('editorPanel');
  const preview = document.getElementById('previewPanel');
  document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.mobile-tab-btn[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'editor') {
    editor.removeAttribute('data-hidden');
    preview.setAttribute('data-hidden', 'true');
  } else {
    preview.removeAttribute('data-hidden');
    editor.setAttribute('data-hidden', 'true');
  }
}

// ─── Background ────────────────────────────────────────
function onBgImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.bgImage = ev.target.result;
    document.getElementById('bgImgClearBtn').style.display = '';
    document.getElementById('blurGroup').style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function clearBgImage() {
  state.bgImage = '';
  document.getElementById('bgImgFile').value = '';
  document.getElementById('bgImgClearBtn').style.display = 'none';
  document.getElementById('blurGroup').style.display = 'none';
  renderPreview();
}

function onBlurChange() {
  state.bgBlur = parseInt(document.getElementById('bgBlur').value);
  document.getElementById('bgBlurVal').textContent = state.bgBlur + 'px';
  renderPreview();
}

// ─── Character images ──────────────────────────────────
function onCharImageUpload(e, who) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if (who === 'A') state.charA.image = ev.target.result;
    else state.charB.image = ev.target.result;
    document.getElementById(`char${who}ImgClear`).style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function clearCharImage(who) {
  if (who === 'A') { state.charA.image = ''; document.getElementById('charAImgFile').value = ''; }
  else { state.charB.image = ''; document.getElementById('charBImgFile').value = ''; }
  document.getElementById(`char${who}ImgClear`).style.display = 'none';
  renderPreview();
}

// ─── Shape change ──────────────────────────────────────
function onShapeChange() {
  state.imgShape = document.getElementById('imgShape').value;
  document.getElementById('polaroidTiltSection').style.display =
    state.imgShape === 'polaroid' ? '' : 'none';
  renderPreview();
}

function onTiltChange() {
  state.tiltA = parseInt(document.getElementById('tiltA').value);
  state.tiltB = parseInt(document.getElementById('tiltB').value);
  document.getElementById('tiltAVal').textContent = state.tiltA + '°';
  document.getElementById('tiltBVal').textContent = state.tiltB + '°';
  renderPreview();
}

// ─── Check shape (A/B separate) ────────────────────────
function onCheckShapeChange(who) {
  const shape = document.getElementById(`checkShape${who}`).value;
  state[`check${who}`].shape = shape;
  document.getElementById(`customCheckGroup${who}`).style.display =
    shape === 'custom' ? '' : 'none';
  renderPreview();
}

function onCustomCheckUpload(e, who) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state[`check${who}`].customImage = ev.target.result;
    const img = document.getElementById(`customCheckPreview${who}`);
    img.src = ev.target.result;
    img.style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

// ─── Read font settings ────────────────────────────────
function readFonts() {
  state.fonts.title = { family: g('fontTitle'), size: parseInt(g('sizeTitle')), color: g('colorTitle') };
  state.fonts.aName = { family: g('fontAName'), size: parseInt(g('sizeAName')), color: g('colorAName') };
  state.fonts.bName = { family: g('fontBName'), size: parseInt(g('sizeBName')), color: g('colorBName') };
  state.fonts.q     = { family: g('fontQ'),     size: parseInt(g('sizeQ')),     color: g('colorQ') };
  state.fonts.aCmt  = { family: g('fontACmt'),  size: parseInt(g('sizeACmt')),  color: g('colorACmt') };
  state.fonts.bCmt  = { family: g('fontBCmt'),  size: parseInt(g('sizeBCmt')),  color: g('colorBCmt') };
  state.fonts.cat   = { family: g('fontCat'),   size: parseInt(g('sizeCat')),   color: g('colorCat') };
}
function g(id) { return document.getElementById(id).value; }

// ─── Separator image upload per item ───────────────────
function onSepImageUpload(e, itemId) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const item = state.items.find(it => it.id === itemId);
    if (item) {
      item.sepImage = ev.target.result;
      renderPreview();
    }
  };
  reader.readAsDataURL(file);
}

// ─── Items CRUD ────────────────────────────────────────
function addItem(type) {
  const id = ++itemIdCounter;
  if (type === 'question') {
    state.items.push({ type, id, question: '', checkA: false, checkB: false, commentA: '', commentB: '' });
  } else if (type === 'separator') {
    state.items.push({ type, id, sepStyle: 'solid', sepImage: '' });
  } else if (type === 'category') {
    state.items.push({ type, id, title: '' });
  }
  renderEditor();
  renderPreview();
}

function removeItem(id) {
  state.items = state.items.filter(it => it.id !== id);
  renderEditor();
  renderPreview();
}

function clearAllItems() {
  if (state.items.length && !confirm('모든 항목을 삭제하시겠습니까?')) return;
  state.items = [];
  renderEditor();
  renderPreview();
}

function updateItem(id, key, value) {
  const item = state.items.find(it => it.id === id);
  if (item) {
    item[key] = value;
    if (key === 'sepStyle') {
      // Show/hide custom image upload in editor
      renderEditor();
    }
    renderPreview();
  }
}

// ─── Editor render ─────────────────────────────────────
function renderEditor() {
  const container = document.getElementById('itemList');
  if (state.items.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-square-check"></i><p>항목을 추가해 보세요</p></div>`;
    return;
  }

  let html = '';
  state.items.forEach(item => {
    if (item.type === 'question') {
      html += `
        <div class="cl-item-card" data-id="${item.id}">
          <div class="cl-item-card-header">
            <i class="fa-solid fa-grip-vertical drag-handle"></i>
            <span class="cl-badge cl-badge-question">질문</span>
            <div style="flex:1"></div>
            <button class="btn-icon danger" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="cl-item-body">
            <div class="form-group" style="margin-bottom:0.4rem;">
              <input type="text" class="form-input" placeholder="질문을 입력하세요"
                value="${escAttr(item.question)}"
                oninput="updateItem(${item.id},'question',this.value)" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;">
              <label style="font-size:0.8rem;display:flex;align-items:center;gap:0.3rem;cursor:pointer;">
                <input type="checkbox" ${item.checkA ? 'checked' : ''}
                  onchange="updateItem(${item.id},'checkA',this.checked)" /> A 체크
              </label>
              <label style="font-size:0.8rem;display:flex;align-items:center;gap:0.3rem;cursor:pointer;">
                <input type="checkbox" ${item.checkB ? 'checked' : ''}
                  onchange="updateItem(${item.id},'checkB',this.checked)" /> B 체크
              </label>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;">
              <div class="form-group" style="margin-bottom:0;">
                <input type="text" class="form-input" placeholder="A 코멘트 (선택)"
                  value="${escAttr(item.commentA)}"
                  oninput="updateItem(${item.id},'commentA',this.value)" />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <input type="text" class="form-input" placeholder="B 코멘트 (선택)"
                  value="${escAttr(item.commentB)}"
                  oninput="updateItem(${item.id},'commentB',this.value)" />
              </div>
            </div>
          </div>
        </div>`;
    } else if (item.type === 'separator') {
      const sepStyleOptions = SEP_STYLES.map(s =>
        `<option value="${s.value}" ${item.sepStyle === s.value ? 'selected' : ''}>${s.label}</option>`
      ).join('');

      let customUploadHTML = '';
      if (item.sepStyle === 'custom') {
        customUploadHTML = `
          <div style="margin-top:0.4rem;">
            <div class="text-muted" style="margin-bottom:0.3rem;">이미지 업로드 (권장 크기: 전체 너비 × 20px)</div>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('sepImg_${item.id}').click()">
                <i class="fa-solid fa-upload"></i> 업로드
              </button>
              ${item.sepImage ? '<span class="text-muted">✓ 등록됨</span>' : ''}
              <input type="file" id="sepImg_${item.id}" accept="image/*" style="display:none"
                onchange="onSepImageUpload(event,${item.id})" />
            </div>
          </div>`;
      }

      html += `
        <div class="cl-item-card" data-id="${item.id}">
          <div class="cl-item-card-header">
            <i class="fa-solid fa-grip-vertical drag-handle"></i>
            <span class="cl-badge cl-badge-sep">구분선</span>
            <div style="flex:1"></div>
            <button class="btn-icon danger" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="cl-item-body">
            <div class="cl-sep-style-row">
              <select class="form-select" onchange="updateItem(${item.id},'sepStyle',this.value)">
                ${sepStyleOptions}
              </select>
            </div>
            ${customUploadHTML}
          </div>
        </div>`;
    } else if (item.type === 'category') {
      html += `
        <div class="cl-item-card" data-id="${item.id}">
          <div class="cl-item-card-header">
            <i class="fa-solid fa-grip-vertical drag-handle"></i>
            <span class="cl-badge cl-badge-cat">카테고리</span>
            <div style="flex:1"></div>
            <button class="btn-icon danger" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <div class="cl-item-body">
            <div class="form-group" style="margin-bottom:0;">
              <input type="text" class="form-input" placeholder="카테고리 제목"
                value="${escAttr(item.title || '')}"
                oninput="updateItem(${item.id},'title',this.value)" />
            </div>
          </div>
        </div>`;
    }
  });

  container.innerHTML = html;
  initSortable();
}

function escAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escHTML(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Sortable ──────────────────────────────────────────
function initSortable() {
  const el = document.getElementById('itemList');
  if (sortableInstance) sortableInstance.destroy();
  if (!el.querySelector('.cl-item-card')) return;
  sortableInstance = new Sortable(el, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      const cards = el.querySelectorAll('.cl-item-card');
      const newOrder = [];
      cards.forEach(card => {
        const id = parseInt(card.dataset.id);
        const item = state.items.find(it => it.id === id);
        if (item) newOrder.push(item);
      });
      state.items = newOrder;
      renderPreview();
    }
  });
}

// ─── Preview render ────────────────────────────────────
function renderPreview() {
  // Sync state from editor
  state.mainTitle = document.getElementById('mainTitle').value;
  state.bgColor = document.getElementById('bgColor').value;
  state.checkA.color = document.getElementById('checkColorA').value;
  state.checkB.color = document.getElementById('checkColorB').value;
  state.charA.name = document.getElementById('charAName').value || '캐릭터 A';
  state.charB.name = document.getElementById('charBName').value || '캐릭터 B';
  readFonts();

  renderTitle();
  renderBackground();
  renderCharacters();
  renderItems();
}

function renderTitle() {
  const el = document.getElementById('clTitle');
  const f = state.fonts.title;
  if (state.mainTitle && state.mainTitle.trim()) {
    el.style.display = '';
    el.style.fontFamily = `'${f.family}', sans-serif`;
    el.style.fontSize = f.size + 'px';
    el.style.color = f.color;
    el.textContent = state.mainTitle;
  } else {
    el.style.display = 'none';
  }
}

function renderBackground() {
  const layer = document.getElementById('bgLayer');
  const area = document.getElementById('checklistPreview');

  if (state.bgImage) {
    layer.style.backgroundImage = `url(${state.bgImage})`;
    layer.style.backgroundColor = '';
    layer.style.filter = `blur(${state.bgBlur}px)`;
    layer.style.inset = `-${state.bgBlur + 5}px`;
    area.style.backgroundColor = 'transparent';
  } else {
    layer.style.backgroundImage = '';
    layer.style.filter = '';
    layer.style.inset = '0';
    layer.style.backgroundColor = '';
    area.style.backgroundColor = state.bgColor;
  }
}

function renderCharacters() {
  const wrap = document.getElementById('clCharacters');
  const shape = state.imgShape;
  const f = state.fonts;

  function charBlock(who, charData, fontCfg, tilt) {
    const hasImg = !!charData.image;
    const imgTag = hasImg
      ? `<img src="${charData.image}" alt="${escAttr(charData.name)}" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:2rem;"><i class="fa-solid fa-user"></i></div>`;

    const nameStyle = `font-family:'${fontCfg.family}',sans-serif;font-size:${fontCfg.size}px;color:${fontCfg.color};`;

    if (shape === 'polaroid') {
      return `
        <div class="cl-char-block">
          <div class="cl-polaroid-frame" style="transform:rotate(${tilt}deg);">
            <div class="cl-char-img-wrap shape-square">${imgTag}</div>
            <div class="cl-polaroid-name" style="${nameStyle}">${escHTML(charData.name)}</div>
          </div>
        </div>`;
    }

    return `
      <div class="cl-char-block">
        <div class="cl-char-img-wrap shape-${shape}">${imgTag}</div>
        <div class="cl-char-name" style="${nameStyle}">${escHTML(charData.name)}</div>
      </div>`;
  }

  wrap.innerHTML =
    charBlock('A', state.charA, f.aName, state.tiltA) +
    charBlock('B', state.charB, f.bName, state.tiltB);
}

function getCheckContent(checked, who) {
  const cfg = state[`check${who}`];
  if (!checked) {
    // Unchecked: show symbol faded
    if (cfg.shape === 'custom' && cfg.customImage) {
      return `<img src="${cfg.customImage}" alt="" style="opacity:0.15;" />`;
    }
    const sym = CHECK_SYMBOLS[cfg.shape] || '✓';
    return `<span style="color:${cfg.color};opacity:0.15;">${sym}</span>`;
  }
  // Checked
  if (cfg.shape === 'custom' && cfg.customImage) {
    return `<img src="${cfg.customImage}" alt="check" />`;
  }
  const sym = CHECK_SYMBOLS[cfg.shape] || '✓';
  return `<span style="color:${cfg.color};">${sym}</span>`;
}

function renderItems() {
  const area = document.getElementById('clItemsArea');
  const f = state.fonts;

  if (state.items.length === 0) {
    area.innerHTML = `<div class="empty-state" style="padding:2rem;"><i class="fa-regular fa-square-check"></i><p>항목을 추가하면 여기에 표시됩니다</p></div>`;
    return;
  }

  let html = '';
  state.items.forEach(item => {
    if (item.type === 'separator') {
      const style = item.sepStyle || 'solid';
      if (style === 'custom' && item.sepImage) {
        html += `<img class="cl-separator-img" src="${item.sepImage}" alt="separator" />`;
      } else {
        html += `<hr class="cl-separator sep-${style}" />`;
      }
    } else if (item.type === 'category') {
      const fc = f.cat;
      html += `<div class="cl-category-title" style="font-family:'${fc.family}',sans-serif;font-size:${fc.size}px;color:${fc.color};">${escHTML(item.title) || '카테고리'}</div>`;
    } else if (item.type === 'question') {
      const checkAFinal = getCheckContent(item.checkA, 'A');
      const checkBFinal = getCheckContent(item.checkB, 'B');

      let commentsHTML = '';
      const hasA = item.commentA && item.commentA.trim();
      const hasB = item.commentB && item.commentB.trim();
      if (hasA || hasB) {
        commentsHTML = `<div class="cl-comments">`;
        if (hasA) {
          commentsHTML += `<div class="cl-comment cl-comment-a" style="font-family:'${f.aCmt.family}',sans-serif;font-size:${f.aCmt.size}px;color:${f.aCmt.color};">${escHTML(item.commentA)}</div>`;
        } else {
          commentsHTML += `<div></div>`;
        }
        if (hasB) {
          commentsHTML += `<div class="cl-comment cl-comment-b" style="font-family:'${f.bCmt.family}',sans-serif;font-size:${f.bCmt.size}px;color:${f.bCmt.color};">${escHTML(item.commentB)}</div>`;
        } else {
          commentsHTML += `<div></div>`;
        }
        commentsHTML += `</div>`;
      }

      html += `
        <div class="cl-question-row">
          <div class="cl-q-main">
            <div class="cl-check-cell ${item.checkA ? 'checked' : 'unchecked'}">${checkAFinal}</div>
            <div class="cl-q-text" style="font-family:'${f.q.family}',sans-serif;font-size:${f.q.size}px;color:${f.q.color};">${escHTML(item.question) || '질문을 입력하세요'}</div>
            <div class="cl-check-cell ${item.checkB ? 'checked' : 'unchecked'}">${checkBFinal}</div>
          </div>
          ${commentsHTML}
        </div>`;
    }
  });

  area.innerHTML = html;
}

// ─── Export: Copy HTML ─────────────────────────────────
function copyHTML() {
  const el = document.getElementById('checklistPreview');
  navigator.clipboard.writeText(el.outerHTML).then(() => {
    alert('HTML이 클립보드에 복사되었습니다!');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = el.outerHTML;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('HTML이 클립보드에 복사되었습니다!');
  });
}

// ─── Export: Save JSON ─────────────────────────────────
function saveJSON() {
  renderPreview(); // Ensure state is synced
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'checklist.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export: Load JSON ─────────────────────────────────
function loadJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      // Merge with defaults for backward compat
      state = Object.assign({
        mainTitle: '',
        bgColor: '#f8f9fb', bgImage: '', bgBlur: 0,
        imgShape: 'circle', tiltA: -3, tiltB: 3,
        charA: { name: '캐릭터 A', image: '' },
        charB: { name: '캐릭터 B', image: '' },
        checkA: { shape: 'check', color: '#4A90D9', customImage: '' },
        checkB: { shape: 'heart', color: '#e9658b', customImage: '' },
        fonts: {
          title: { family: 'Pretendard', size: 22, color: '#222222' },
          aName: { family: 'Pretendard', size: 14, color: '#333333' },
          bName: { family: 'Pretendard', size: 14, color: '#333333' },
          q:     { family: 'Pretendard', size: 14, color: '#333333' },
          aCmt:  { family: 'Pretendard', size: 13, color: '#666666' },
          bCmt:  { family: 'Pretendard', size: 13, color: '#666666' },
          cat:   { family: 'Pretendard', size: 16, color: '#444444' },
        },
        items: []
      }, data);

      // Handle old format migration (single checkShape/checkColor → A/B)
      if (data.checkShape && !data.checkA) {
        state.checkA = { shape: data.checkShape, color: data.checkColor || '#4A90D9', customImage: data.customCheckImage || '' };
        state.checkB = { shape: data.checkShape, color: data.checkColor || '#e9658b', customImage: data.customCheckImage || '' };
      }

      itemIdCounter = Math.max(0, ...state.items.map(it => it.id || 0));
      restoreEditorFromState();
      renderEditor();
      renderPreview();
    } catch (err) {
      alert('JSON 파일을 읽을 수 없습니다.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function restoreEditorFromState() {
  document.getElementById('mainTitle').value = state.mainTitle || '';
  document.getElementById('bgColor').value = state.bgColor || '#f8f9fb';
  document.getElementById('bgBlur').value = state.bgBlur || 0;
  document.getElementById('bgBlurVal').textContent = (state.bgBlur || 0) + 'px';
  document.getElementById('imgShape').value = state.imgShape || 'circle';
  document.getElementById('polaroidTiltSection').style.display = state.imgShape === 'polaroid' ? '' : 'none';
  document.getElementById('tiltA').value = state.tiltA ?? -3;
  document.getElementById('tiltB').value = state.tiltB ?? 3;
  document.getElementById('tiltAVal').textContent = (state.tiltA ?? -3) + '°';
  document.getElementById('tiltBVal').textContent = (state.tiltB ?? 3) + '°';
  document.getElementById('charAName').value = state.charA.name || '';
  document.getElementById('charBName').value = state.charB.name || '';

  // Check A
  document.getElementById('checkShapeA').value = state.checkA.shape || 'check';
  document.getElementById('checkColorA').value = state.checkA.color || '#4A90D9';
  document.getElementById('customCheckGroupA').style.display = state.checkA.shape === 'custom' ? '' : 'none';
  if (state.checkA.customImage) {
    const imgA = document.getElementById('customCheckPreviewA');
    imgA.src = state.checkA.customImage;
    imgA.style.display = '';
  }

  // Check B
  document.getElementById('checkShapeB').value = state.checkB.shape || 'heart';
  document.getElementById('checkColorB').value = state.checkB.color || '#e9658b';
  document.getElementById('customCheckGroupB').style.display = state.checkB.shape === 'custom' ? '' : 'none';
  if (state.checkB.customImage) {
    const imgB = document.getElementById('customCheckPreviewB');
    imgB.src = state.checkB.customImage;
    imgB.style.display = '';
  }

  // BG image
  if (state.bgImage) {
    document.getElementById('bgImgClearBtn').style.display = '';
    document.getElementById('blurGroup').style.display = '';
  } else {
    document.getElementById('bgImgClearBtn').style.display = 'none';
    document.getElementById('blurGroup').style.display = 'none';
  }
  if (state.charA.image) document.getElementById('charAImgClear').style.display = '';
  else document.getElementById('charAImgClear').style.display = 'none';
  if (state.charB.image) document.getElementById('charBImgClear').style.display = '';
  else document.getElementById('charBImgClear').style.display = 'none';

  // Fonts
  const f = state.fonts;
  document.getElementById('fontTitle').value = f.title.family;
  document.getElementById('sizeTitle').value = f.title.size;
  document.getElementById('colorTitle').value = f.title.color;
  document.getElementById('fontAName').value = f.aName.family;
  document.getElementById('sizeAName').value = f.aName.size;
  document.getElementById('colorAName').value = f.aName.color;
  document.getElementById('fontBName').value = f.bName.family;
  document.getElementById('sizeBName').value = f.bName.size;
  document.getElementById('colorBName').value = f.bName.color;
  document.getElementById('fontQ').value = f.q.family;
  document.getElementById('sizeQ').value = f.q.size;
  document.getElementById('colorQ').value = f.q.color;
  document.getElementById('fontACmt').value = f.aCmt.family;
  document.getElementById('sizeACmt').value = f.aCmt.size;
  document.getElementById('colorACmt').value = f.aCmt.color;
  document.getElementById('fontBCmt').value = f.bCmt.family;
  document.getElementById('sizeBCmt').value = f.bCmt.size;
  document.getElementById('colorBCmt').value = f.bCmt.color;
  document.getElementById('fontCat').value = f.cat.family;
  document.getElementById('sizeCat').value = f.cat.size;
  document.getElementById('colorCat').value = f.cat.color;
}

// ─── Export: Save Image ────────────────────────────────
function saveImage() {
  const target = document.getElementById('checklistPreview');
  html2canvas(target, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: null
  }).then(canvas => {
    const a = document.createElement('a');
    a.download = 'checklist.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }).catch(err => {
    console.error(err);
    alert('이미지 저장에 실패했습니다.');
  });
}
