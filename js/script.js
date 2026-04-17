/* ============================================================
   대본 편집기 (Script Editor) — js/script.js
   ============================================================ */

// ─── State ───
let currentLayout = 1;       // 1 or 2
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

function getRatioStyle() {
  const canvas = document.getElementById('scriptCanvas');
  // 자유 모드: aspect-ratio 없음
  if (currentRatio === 'free') {
    canvas.style.aspectRatio = '';
    return;
  }
  const [w, h] = currentRatio.split(':').map(Number);
  canvas.style.aspectRatio = `${w}/${h}`;
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
    // Show thumbnail in upload box
    const labelId = slot === 'top' ? 'topImgLabel' : slot === 'bottom' ? 'bottomImgLabel' : 'bgImgLabel';
    const boxId = slot === 'top' ? 'topImgBox' : slot === 'bottom' ? 'bottomImgBox' : 'bgImgBox';
    document.getElementById(boxId).innerHTML = `<img src="${ev.target.result}" />`;
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function removeImg(slot) {
  images[slot] = null;
  if (slot === 'top') {
    document.getElementById('topImgBox').innerHTML = '<span id="topImgLabel"><i class="fa-solid fa-upload"></i> 클릭하여 업로드</span>';
    document.getElementById('topImgInput').value = '';
  } else if (slot === 'bottom') {
    document.getElementById('bottomImgBox').innerHTML = '<span id="bottomImgLabel"><i class="fa-solid fa-upload"></i> 클릭하여 업로드</span>';
    document.getElementById('bottomImgInput').value = '';
  } else {
    document.getElementById('bgImgBox').innerHTML = '<span id="bgImgLabel"><i class="fa-solid fa-upload"></i> 클릭하여 업로드</span>';
    document.getElementById('bgImgInput').value = '';
  }
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

// ─── Text Parsing ───
function parseFormatting(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold **...**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *...*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough ~~...~~
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Underline __...__
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');
  return html;
}

function parseScript(rawText) {
  const lines = rawText.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      result.push({ type: 'gap' });
      continue;
    }
    // 첫 번째 : 를 기준으로 분리
    const colonIdx = trimmed.indexOf(':');
    // 영어 콜론
    const colonIdx2 = trimmed.indexOf('：');
    // 가장 먼저 나오는 콜론 사용 (한글 전각 콜론도 지원)
    let idx = -1;
    if (colonIdx >= 0 && colonIdx2 >= 0) idx = Math.min(colonIdx, colonIdx2);
    else if (colonIdx >= 0) idx = colonIdx;
    else if (colonIdx2 >= 0) idx = colonIdx2;

    if (idx > 0 && idx < trimmed.length - 1) {
      const name = trimmed.substring(0, idx).trim();
      const dialogue = trimmed.substring(idx + 1).trim();
      // 이름이 너무 길면 (20자 초과) 지문으로 처리
      if (name.length <= 20) {
        result.push({ type: 'line', name, dialogue });
      } else {
        result.push({ type: 'narration', text: trimmed });
      }
    } else {
      result.push({ type: 'narration', text: trimmed });
    }
  }
  return result;
}

// ─── Render ───
function renderPreview() {
  const canvas = document.getElementById('scriptCanvas');
  const body = document.getElementById('scriptBody');
  const topImg = document.getElementById('topImage');
  const bottomImg = document.getElementById('bottomImage');
  const overlay = document.getElementById('layout2Overlay');

  // Ratio
  getRatioStyle();

  // Values
  const padTop = document.getElementById('padTop').value;
  const padBottom = document.getElementById('padBottom').value;
  const padLeft = document.getElementById('padLeft').value;
  const padRight = document.getElementById('padRight').value;
  const nameWidth = document.getElementById('nameWidth').value;
  const nameGap = document.getElementById('nameGap').value;
  const lineGap = document.getElementById('lineGap').value;
  const fontSize = document.getElementById('fontSize').value;
  const lineHeight = (document.getElementById('lineHeight').value / 100).toFixed(2);
  const fontFamily = document.getElementById('fontSelect').value;
  const nameColor = document.getElementById('nameColor').value;
  const dialogueColor = document.getElementById('dialogueColor').value;
  const narrationColor = document.getElementById('narrationColor').value;
  const canvasBg = document.getElementById('canvasBg').value;

  // Layout
  canvas.classList.toggle('layout-2', currentLayout === 2);

  if (currentLayout === 1) {
    canvas.style.background = canvasBg;
    canvas.style.backgroundImage = '';
    overlay.style.display = 'none';
    // Top image
    if (images.top) {
      topImg.src = images.top;
      topImg.style.display = 'block';
      topImg.style.height = document.getElementById('topImgHeight').value + 'px';
    } else {
      topImg.style.display = 'none';
    }
    // Bottom image
    if (images.bottom) {
      bottomImg.src = images.bottom;
      bottomImg.style.display = 'block';
      bottomImg.style.height = document.getElementById('bottomImgHeight').value + 'px';
    } else {
      bottomImg.style.display = 'none';
    }
  } else {
    topImg.style.display = 'none';
    bottomImg.style.display = 'none';
    const bgType = document.getElementById('bgType').value;
    if (bgType === 'color') {
      canvas.style.background = document.getElementById('bgColor').value;
      canvas.style.backgroundImage = '';
    } else if (bgType === 'image' && images.bg) {
      canvas.style.backgroundImage = `url(${images.bg})`;
      canvas.style.backgroundColor = '';
    }
    // Overlay
    const opVal = document.getElementById('bgOverlayOpacity').value;
    const ovColor = document.getElementById('bgOverlayColor').value;
    if (parseInt(opVal) > 0) {
      overlay.style.display = 'block';
      overlay.style.background = ovColor;
      overlay.style.opacity = (opVal / 100).toFixed(2);
    } else {
      overlay.style.display = 'none';
    }
  }

  // Script inner padding
  const inner = document.getElementById('scriptInner');
  inner.style.padding = `${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`;
  inner.style.fontFamily = fontFamily;
  inner.style.fontSize = fontSize + 'px';
  inner.style.lineHeight = lineHeight;

  // Parse and render
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
      html += `<div class="script-line" style="margin-bottom:${lineGap}px;">`;
      html += `<span class="script-name" style="width:${nameWidth}px;min-width:${nameWidth}px;color:${nameColor};margin-right:${nameGap}px;">${parseFormatting(item.name)}</span>`;
      html += `<span class="script-dialogue" style="color:${dialogueColor};">${parseFormatting(item.dialogue)}</span>`;
      html += `</div>`;
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

// ─── Save / Load JSON ───
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
      fontFamily: document.getElementById('fontSelect').value,
      nameColor: document.getElementById('nameColor').value,
      dialogueColor: document.getElementById('dialogueColor').value,
      narrationColor: document.getElementById('narrationColor').value,
      canvasBg: document.getElementById('canvasBg').value,
      bgType: document.getElementById('bgType').value,
      bgColor: document.getElementById('bgColor').value,
      bgOverlayOpacity: document.getElementById('bgOverlayOpacity').value,
      bgOverlayColor: document.getElementById('bgOverlayColor').value
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = 'script_backup_' + Date.now() + '.json';
  link.href = URL.createObjectURL(blob);
  link.click();
}

function loadJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      document.getElementById('scriptInput').value = data.script || '';
      const s = data.settings || {};
      const setVal = (id, val) => { if (val !== undefined) document.getElementById(id).value = val; };
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
      if (s.fontFamily) document.getElementById('fontSelect').value = s.fontFamily;

      // Ratio
      if (data.ratio) {
        currentRatio = data.ratio;
        document.querySelectorAll('.ratio-btn').forEach(b => {
          b.classList.toggle('active', b.textContent.trim() === data.ratio || (data.ratio === 'free' && b.textContent.trim() === '자유'));
        });
      }

      // Layout
      if (data.layout) {
        const btns = document.querySelectorAll('.layout-toggle button');
        btns.forEach(b => b.classList.remove('active'));
        btns[data.layout - 1].classList.add('active');
        setLayout(data.layout, btns[data.layout - 1]);
      }

      // Update slider display values
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
  renderPreview();
});
