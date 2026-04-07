/* ================================================================
   checklist.js — Chat Backup 체크리스트 페이지 로직
   ================================================================ */

// ─── State ─────────────────────────────────────────────
let state = {
  bgColor: '#f8f9fb',
  bgImage: '',
  bgBlur: 0,
  imgShape: 'circle',
  tiltA: -3,
  tiltB: 3,
  charA: { name: '캐릭터 A', image: '' },
  charB: { name: '캐릭터 B', image: '' },
  checkShape: 'check',
  checkColor: '#e9658b',
  customCheckImage: '',
  fonts: {
    aName:  { family: 'Pretendard', size: 14, color: '#333333' },
    bName:  { family: 'Pretendard', size: 14, color: '#333333' },
    q:      { family: 'Pretendard', size: 14, color: '#333333' },
    aCmt:   { family: 'Pretendard', size: 13, color: '#666666' },
    bCmt:   { family: 'Pretendard', size: 13, color: '#666666' },
  },
  items: []   // { type:'question'|'separator'|'category', id, question?, checkA?, checkB?, commentA?, commentB?, title? }
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

// ─── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPreview();
  initSortable();
});

// ─── Accordion ─────────────────────────────────────────
function toggleAccordion(id) {
  const el = document.getElementById(id);
  el.classList.toggle('collapsed');
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

// ─── Check shape ───────────────────────────────────────
function onCheckShapeChange() {
  state.checkShape = document.getElementById('checkShape').value;
  document.getElementById('customCheckGroup').style.display =
    state.checkShape === 'custom' ? '' : 'none';
  renderPreview();
}

function onCustomCheckUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.customCheckImage = ev.target.result;
    const img = document.getElementById('customCheckPreview');
    img.src = ev.target.result;
    img.style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

// ─── Read font settings ────────────────────────────────
function readFonts() {
  state.fonts.aName = { family: g('fontAName'), size: parseInt(g('sizeAName')), color: g('colorAName') };
  state.fonts.bName = { family: g('fontBName'), size: parseInt(g('sizeBName')), color: g('colorBName') };
  state.fonts.q     = { family: g('fontQ'),     size: parseInt(g('sizeQ')),     color: g('colorQ') };
  state.fonts.aCmt  = { family: g('fontACmt'),  size: parseInt(g('sizeACmt')),  color: g('colorACmt') };
  state.fonts.bCmt  = { family: g('fontBCmt'),  size: parseInt(g('sizeBCmt')),  color: g('colorBCmt') };
}
function g(id) { return document.getElementById(id).value; }

// ─── Items CRUD ────────────────────────────────────────
function addItem(type) {
  const id = ++itemIdCounter;
  if (type === 'question') {
    state.items.push({ type, id, question: '', checkA: false, checkB: false, commentA: '', commentB: '' });
  } else if (type === 'separator') {
    state.items.push({ type, id });
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
  if (item) { item[key] = value; renderPreview(); }
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
      html += `
        <div class="cl-item-card" data-id="${item.id}">
          <div class="cl-item-card-header">
            <i class="fa-solid fa-grip-vertical drag-handle"></i>
            <span class="cl-badge cl-badge-sep">구분선</span>
            <div style="flex:1"></div>
            <button class="btn-icon danger" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
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
  // Read current editor values into state
  state.bgColor = document.getElementById('bgColor').value;
  state.checkColor = document.getElementById('checkColor').value;
  state.charA.name = document.getElementById('charAName').value || '캐릭터 A';
  state.charB.name = document.getElementById('charBName').value || '캐릭터 B';
  readFonts();

  renderBackground();
  renderCharacters();
  renderItems();
}

function renderBackground() {
  const layer = document.getElementById('bgLayer');
  const area = document.getElementById('checklistPreview');

  if (state.bgImage) {
    layer.style.backgroundImage = `url(${state.bgImage})`;
    layer.style.backgroundColor = '';
    layer.style.filter = `blur(${state.bgBlur}px)`;
    // Extend layer beyond edges to prevent blur white edges
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

    let shapeClass = `shape-${shape}`;
    let nameHTML = `<div class="cl-char-name" style="font-family:'${fontCfg.family}',sans-serif;font-size:${fontCfg.size}px;color:${fontCfg.color};">${escHTML(charData.name)}</div>`;

    if (shape === 'polaroid') {
      return `
        <div class="cl-char-block">
          <div class="cl-polaroid-frame" style="transform:rotate(${tilt}deg);">
            <div class="cl-char-img-wrap shape-square">${imgTag}</div>
          </div>
          ${nameHTML}
        </div>`;
    }

    return `
      <div class="cl-char-block">
        <div class="cl-char-img-wrap ${shapeClass}">${imgTag}</div>
        ${nameHTML}
      </div>`;
  }

  wrap.innerHTML =
    charBlock('A', state.charA, f.aName, state.tiltA) +
    charBlock('B', state.charB, f.bName, state.tiltB);
}

function getCheckContent(checked) {
  if (!checked) return '';
  if (state.checkShape === 'custom' && state.customCheckImage) {
    return `<img src="${state.customCheckImage}" alt="check" />`;
  }
  const sym = CHECK_SYMBOLS[state.checkShape] || '✓';
  return `<span style="color:${state.checkColor};">${sym}</span>`;
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
      html += `<hr class="cl-separator" />`;
    } else if (item.type === 'category') {
      html += `<div class="cl-category-title">${escHTML(item.title) || '카테고리'}</div>`;
    } else if (item.type === 'question') {
      const checkACls = item.checkA ? 'checked' : 'unchecked';
      const checkBCls = item.checkB ? 'checked' : 'unchecked';
      const checkAHTML = item.checkA ? getCheckContent(true) : getCheckContent(false) || `<span style="color:${state.checkColor};opacity:0.2;">${CHECK_SYMBOLS[state.checkShape] || '✓'}</span>`;
      const checkBHTML = item.checkB ? getCheckContent(true) : getCheckContent(false) || `<span style="color:${state.checkColor};opacity:0.2;">${CHECK_SYMBOLS[state.checkShape] || '✓'}</span>`;

      // Build unchecked content
      let uncheckContent;
      if (state.checkShape === 'custom' && state.customCheckImage) {
        uncheckContent = `<img src="${state.customCheckImage}" alt="" style="opacity:0.2;" />`;
      } else {
        const sym = CHECK_SYMBOLS[state.checkShape] || '✓';
        uncheckContent = `<span style="color:${state.checkColor};opacity:0.2;">${sym}</span>`;
      }

      const checkAFinal = item.checkA ? getCheckContent(true) : uncheckContent;
      const checkBFinal = item.checkB ? getCheckContent(true) : uncheckContent;

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
  const html = el.outerHTML;
  navigator.clipboard.writeText(html).then(() => {
    alert('HTML이 클립보드에 복사되었습니다!');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('HTML이 클���보드에 복사되었습니다!');
  });
}

// ─── Export: Save JSON ─────────────────────────────────
function saveJSON() {
  // Sync state from editor
  state.bgColor = document.getElementById('bgColor').value;
  state.checkColor = document.getElementById('checkColor').value;
  state.charA.name = document.getElementById('charAName').value;
  state.charB.name = document.getElementById('charBName').value;
  state.imgShape = document.getElementById('imgShape').value;
  state.checkShape = document.getElementById('checkShape').value;
  readFonts();

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
      Object.assign(state, data);
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
  document.getElementById('checkShape').value = state.checkShape || 'check';
  document.getElementById('checkColor').value = state.checkColor || '#e9658b';
  document.getElementById('customCheckGroup').style.display = state.checkShape === 'custom' ? '' : 'none';

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

  if (state.customCheckImage) {
    const img = document.getElementById('customCheckPreview');
    img.src = state.customCheckImage;
    img.style.display = '';
  }

  // Fonts
  const f = state.fonts;
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
}

// ─── Export: Save Image ────���───────────────────────────
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
