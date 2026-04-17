/* ============================================================
   대본 편집기 (Script Editor) — js/script.js
   ============================================================ */

// ─── State ───
let currentLayout = 1;
let currentRatio = '3:4';
let images = { top: null, bottom: null, bg: null };

// ─── Accordion ───
function toggleAccordion(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

// ─── Mobile Tab ───
function switchTab(tab) {
  document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.mobile-tab-btn[data-tab="${tab}"]`).classList.add('active');
  const ep = document.getElementById('editorPanel');
  const pp = document.getElementById('previewPanel');
  if (tab === 'editor') { ep.removeAttribute('data-hidden'); pp.setAttribute('data-hidden','true'); }
  else { pp.removeAttribute('data-hidden'); ep.setAttribute('data-hidden','true'); }
}

// ─── Layout Toggle ───
function setLayout(num, btn) {
  currentLayout = num;
  btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('layout1Options').style.display = num === 1 ? '' : 'none';
  document.getElementById('layout2Options').style.display = num === 2 ? '' : 'none';
  renderPreview();
}

// ─── Ratio ───
function setRatio(ratio, btn) {
  currentRatio = ratio;
  document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPreview();
}

function applyRatio() {
  const canvas = document.getElementById('scriptCanvas');
  if (currentRatio === 'free') {
    canvas.style.aspectRatio = '';
  } else {
    const [w, h] = currentRatio.split(':').map(Number);
    canvas.style.aspectRatio = `${w}/${h}`;
  }
}

// ─── Background Type (Layout 2) ───
function onBgTypeChange() {
  const t = document.getElementById('bgType').value;
  document.getElementById('bgColorOption').style.display = t === 'color' ? '' : 'none';
  document.getElementById('bgImageOption').style.display = t === 'image' ? '' : 'none';
  renderPreview();
}

// ─── Image Handling ───
function handleImg(slot, e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    images[slot] = ev.target.result;
    const boxId = slot === 'top' ? 'topImgBox' : slot === 'bottom' ? 'bottomImgBox' : 'bgImgBox';
    document.getElementById(boxId).innerHTML = `<img src="${ev.target.result}" />`;
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function removeImg(slot) {
  images[slot] = null;
  const map = {
    top:    { box: 'topImgBox',    label: 'topImgLabel',    input: 'topImgInput' },
    bottom: { box: 'bottomImgBox', label: 'bottomImgLabel', input: 'bottomImgInput' },
    bg:     { box: 'bgImgBox',     label: 'bgImgLabel',     input: 'bgImgInput' }
  };
  const m = map[slot];
  document.getElementById(m.box).innerHTML = `<span id="${m.label}"><i class="fa-solid fa-upload"></i> 클릭하여 업로드</span>`;
  document.getElementById(m.input).value = '';
  renderPreview();
}

// ─── Format Insert ───
function insertFormat(before, after) {
  const ta = document.getElementById('scriptInput');
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;
  const selected = text.substring(start, end);
  ta.value = text.substring(0, start) + before + selected + after + text.substring(end);
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + selected.length;
  ta.focus();
  renderPreview();
}

// ─── Text Formatting ───
function parseFormatting(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  return html;
}

// ─── Colon Finder (반각 : 전각 ： 모두 지원) ───
function findColonIndex(text) {
  const c1 = text.indexOf(':');
  const c2 = text.indexOf('\uff1a'); // ：
  if (c1 >= 0 && c2 >= 0) return Math.min(c1, c2);
  if (c1 >= 0) return c1;
  if (c2 >= 0) return c2;
  return -1;
}

// ─── Script Parsing (연속 동일 이름 병합 + 들여쓰기 이어붙이기) ───
function parseScript(rawText) {
  const lines = rawText.split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') {
      tokens.push({ type: 'gap' });
      continue;
    }

    // 들여쓰기 줄: 앞에 공백 2개 이상 + 콜론 없음 → 이전 대사 연속
    const leadingSpaces = raw.match(/^(\s*)/)[1].length;
    const hasColon = findColonIndex(trimmed) > 0;

    if (leadingSpaces >= 2 && !hasColon) {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'line') {
        tokens[tokens.length - 1].dialogues.push(trimmed);
        continue;
      }
    }

    // 콜론 기준 분리
    const colonIdx = findColonIndex(trimmed);
    if (colonIdx > 0 && colonIdx < trimmed.length - 1) {
      const name = trimmed.substring(0, colonIdx).trim();
      const dialogue = trimmed.substring(colonIdx + 1).trim();
      if (name.length <= 20) {
        tokens.push({ type: 'line', name, dialogues: [dialogue] });
        continue;
      }
    }

    tokens.push({ type: 'narration', text: trimmed });
  }

  // 2차: 연속 동일 이름 병합
  const merged = [];
  for (const token of tokens) {
    if (token.type === 'line' && merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (prev.type === 'line' && prev.name === token.name) {
        prev.dialogues.push(...token.dialogues);
        continue;
      }
    }
    merged.push(token);
  }

  return merged;
}

// ─── Render Preview ───
function renderPreview() {
  const canvas = document.getElementById('scriptCanvas');
  const body = document.getElementById('scriptBody');
  const topImg = document.getElementById('topImage');
  const bottomImg = document.getElementById('bottomImage');
  const overlay = document.getElementById('layout2Overlay');
  const inner = document.getElementById('scriptInner');

  applyRatio();

  // 값 읽기
  const padTop = document.getElementById('padTop').value;
  const padBottom = document.getElementById('padBottom').value;
  const padLeft = document.getElementById('padLeft').value;
  const padRight = document.getElementById('padRight').value;
  const nameWidth = document.getElementById('nameWidth').value;
  const nameGap = document.getElementById('nameGap').value;
  const lineGap = document.getElementById('lineGap').value;
  const fontSize = document.getElementById('fontSize').value;
  const lineHeight = (document.getElementById('lineHeight').value / 100).toFixed(2);
  const nameColor = document.getElementById('nameColor').value;
  const dialogueColor = document.getElementById('dialogueColor').value;
  const narrationColor = document.getElementById('narrationColor').value;
  const canvasBg = document.getElementById('canvasBg').value;

  // ★ fonts.js의 getFontStack() 사용
  const fontValue = document.getElementById('fontSelect').value;
  const fontFamily = getFontStack(fontValue);

  // ─── 레이아웃 분기 ───
  canvas.classList.toggle('layout-2', currentLayout === 2);

  if (currentLayout === 1) {
    // 레이아웃 1: 캔버스 전체가 배경색, 이미지는 상·하단
    canvas.style.background = canvasBg;
    canvas.style.backgroundImage = '';
    overlay.style.display = 'none';
    inner.style.background = '';
    inner.style.margin = '0';

    if (images.top) {
      topImg.src = images.top;
      topImg.style.display = 'block';
      topImg.style.height = document.getElementById('topImgHeight').value + 'px';
    } else {
      topImg.style.display = 'none';
    }
    if (images.bottom) {
      bottomImg.src = images.bottom;
      bottomImg.style.display = 'block';
      bottomImg.style.height = document.getElementById('bottomImgHeight').value + 'px';
    } else {
      bottomImg.style.display = 'none';
    }
  } else {
    // ★ 레이아웃 2: 캔버스 = 배경색/이미지, 안쪽에 흰색 본문 박스
    topImg.style.display = 'none';
    bottomImg.style.display = 'none';

    // 배경
    const bgType = document.getElementById('bgType').value;
    if (bgType === 'color') {
      canvas.style.background = document.getElementById('bgColor').value;
      canvas.style.backgroundImage = '';
    } else if (bgType === 'image' && images.bg) {
      canvas.style.backgroundImage = `url(${images.bg})`;
      canvas.style.backgroundSize = 'cover';
      canvas.style.backgroundPosition = 'center';
      canvas.style.backgroundColor = '';
    } else {
      canvas.style.background = document.getElementById('bgColor').value;
    }

    // 오버레이
    const opVal = parseInt(document.getElementById('bgOverlayOpacity').value);
    if (opVal > 0) {
      overlay.style.display = 'block';
      overlay.style.background = document.getElementById('bgOverlayColor').value;
      overlay.style.opacity = (opVal / 100).toFixed(2);
    } else {
      overlay.style.display = 'none';
    }

    // ★ 핵심: 본문 영역에 흰색 배경 + 바깥 여백(margin)
    const outerY = document.getElementById('outerPadY').value;
    const outerX = document.getElementById('outerPadX').value;
    inner.style.background = '#fff';
    inner.style.margin = `${outerY}px ${outerX}px`;
  }

  // 본문 내부 padding & 폰트
  inner.style.padding = `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`;
  inner.style.fontFamily = fontFamily;
  inner.style.fontSize = fontSize + 'px';
  inner.style.lineHeight = lineHeight;

  // 파싱 & 렌더
  const raw = document.getElementById('scriptInput').value;
  if (!raw.trim()) {
    body.innerHTML = '<div class="empty-state"><i class="fa-solid fa-pen-nib"></i><p>대본을 입력하면 여기에 표시됩니다</p></div>';
    return;
  }

  const parsed = parseScript(raw);
  let html = '';

  for (const item of parsed) {
    if (item.type === 'gap') {
      html += `<div class="line-gap" style="height:${Math.max(parseInt(lineGap) * 3, 12)}px;"></div>`;
    } else if (item.type === 'narration') {
      html += `<div class="script-narration" style="color:${narrationColor};margin-bottom:${lineGap}px;">${parseFormatting(item.text)}</div>`;
    } else {
      html += `<div class="script-block" style="margin-bottom:${lineGap}px;">`;
      html += `<span class="script-name" style="width:${nameWidth}px;min-width:${nameWidth}px;color:${nameColor};margin-right:${nameGap}px;">${parseFormatting(item.name)}</span>`;
      html += `<div class="script-dialogue-group">`;
      for (const d of item.dialogues) {
        html += `<div class="script-dialogue" style="color:${dialogueColor};">${parseFormatting(d)}</div>`;
      }
      html += `</div></div>`;
    }
  }

  body.innerHTML = html;
}

// ─── Save Image ───
function saveImage() {
  const target = document.getElementById('scriptCanvas');
  html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false
  }).then(c => {
    const link = document.createElement('a');
    link.download = 'script_' + Date.now() + '.png';
    link.href = c.toDataURL('image/png');
    link.click();
  });
}

// ─── Save JSON ───
function saveJSON() {
  const data = {
    layout: currentLayout,
    ratio: currentRatio,
    script: document.getElementById('scriptInput').value,
    settings: {
      padTop: document.getElementById('padTop').value,
      padBottom: document.getElementById('padBottom').value,
      padLeft: document.getElementById('padLeft').value,
      padRight: document.getElementById('padRight').value,
      nameWidth: document.getElementById('nameWidth').value,
      nameGap: document.getElementById('nameGap').value,
      lineGap: document.getElementById('lineGap').value,
      fontSize: document.getElementById('fontSize').value,
      lineHeight: document.getElementById('lineHeight').value,
      fontValue: document.getElementById('fontSelect').value,
      nameColor: document.getElementById('nameColor').value,
      dialogueColor: document.getElementById('dialogueColor').value,
      narrationColor: document.getElementById('narrationColor').value,
      canvasBg: document.getElementById('canvasBg').value,
      bgType: document.getElementById('bgType').value,
      bgColor: document.getElementById('bgColor').value,
      bgOverlayOpacity: document.getElementById('bgOverlayOpacity').value,
      bgOverlayColor: document.getElementById('bgOverlayColor').value,
      outerPadY: document.getElementById('outerPadY').value,
      outerPadX: document.getElementById('outerPadX').value
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'script_backup_' + Date.now() + '.json';
  link.href = URL.createObjectURL(blob);
  link.click();
}

// ─── Load JSON ───
function loadJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      document.getElementById('scriptInput').value = data.script || '';
      const s = data.settings || {};
      const setVal = (id, val) => { if (val !== undefined && document.getElementById(id)) document.getElementById(id).value = val; };
      setVal('padTop', s.padTop);
      setVal('padBottom', s.padBottom);
      setVal('padLeft', s.padLeft);
      setVal('padRight', s.padRight);
      setVal('nameWidth', s.nameWidth);
      setVal('nameGap', s.nameGap);
      setVal('lineGap', s.lineGap);
      setVal('fontSize', s.fontSize);
      setVal('lineHeight', s.lineHeight);
      setVal('nameColor', s.nameColor);
      setVal('dialogueColor', s.dialogueColor);
      setVal('narrationColor', s.narrationColor);
      setVal('canvasBg', s.canvasBg);
      setVal('bgType', s.bgType);
      setVal('bgColor', s.bgColor);
      setVal('bgOverlayOpacity', s.bgOverlayOpacity);
      setVal('bgOverlayColor', s.bgOverlayColor);
      setVal('outerPadY', s.outerPadY);
      setVal('outerPadX', s.outerPadX);
      if (s.fontValue) document.getElementById('fontSelect').value = s.fontValue;

      if (data.ratio) {
        currentRatio = data.ratio;
        document.querySelectorAll('.ratio-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim() === data.ratio || (data.ratio === 'free' && b.textContent.trim() === '자유'));
        });
      }

      if (data.layout) {
        const btns = document.querySelectorAll('.layout-toggle button');
        btns.forEach(b => b.classList.remove('active'));
        btns[data.layout - 1].classList.add('active');
        setLayout(data.layout, btns[data.layout - 1]);
      }

      // 슬라이더 표시값 갱신
      document.querySelectorAll('.slider-row').forEach(row => {
        const inp = row.querySelector('input[type="range"]');
        const val = row.querySelector('.slider-val');
        if (inp && val) {
          if (inp.id === 'lineHeight') val.textContent = (inp.value / 100).toFixed(1);
          else if (inp.id === 'bgOverlayOpacity') val.textContent = inp.value + '%';
          else val.textContent = inp.value + 'px';
        }
      });

      renderPreview();
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  // ★ fonts.js의 populateFontSelect 사용
  populateFontSelect('fontSelect', 'Pretendard');
  renderPreview();
});
