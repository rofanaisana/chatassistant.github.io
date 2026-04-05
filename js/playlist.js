// ===================== STATE =====================
const state = {
  headerImg: '',
  albumImg: '',
  tracks: [],
  nextTrackId: 1,
};

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
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

// ===================== IMAGE HANDLING =====================
function handleHeaderImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.headerImg = e.target.result;
    document.getElementById('headerImgRemoveBtn').style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function removeHeaderImg() {
  state.headerImg = '';
  document.getElementById('headerImgRemoveBtn').style.display = 'none';
  document.getElementById('headerImgUpload').value = '';
  renderPreview();
}

function handleAlbumImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.albumImg = e.target.result;
    document.getElementById('albumImgRemoveBtn').style.display = '';
    renderPreview();
  };
  reader.readAsDataURL(file);
}

function removeAlbumImg() {
  state.albumImg = '';
  document.getElementById('albumImgRemoveBtn').style.display = 'none';
  document.getElementById('albumImgUpload').value = '';
  renderPreview();
}

// ===================== TRACK MANAGEMENT =====================
function addTrack() {
  if (state.tracks.length >= 10) {
    alert('곡은 최대 10곡까지 추가할 수 있습니다.');
    return;
  }
  const id = state.nextTrackId++;
  state.tracks.push({ id, title: '', lyrics: '', albumImg: '' });
  renderTracks();
  renderPreview();
}

function removeTrack(id) {
  state.tracks = state.tracks.filter(t => t.id !== id);
  renderTracks();
  renderPreview();
}

function updateTrack(id, field, value) {
  const track = state.tracks.find(t => t.id === id);
  if (track) {
    track[field] = value;
    renderPreview();
  }
}

function handleTrackImg(id, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const track = state.tracks.find(t => t.id === id);
    if (track) {
      track.albumImg = e.target.result;
      renderTracks();
      renderPreview();
    }
  };
  reader.readAsDataURL(file);
}

function removeTrackImg(id) {
  const track = state.tracks.find(t => t.id === id);
  if (track) {
    track.albumImg = '';
    renderTracks();
    renderPreview();
  }
}

function renderTracks() {
  const list = document.getElementById('trackList');
  if (state.tracks.length === 0) {
    list.innerHTML = '<div class="text-muted" style="margin-bottom:0.8rem;">곡을 추가해 보세요.</div>';
    updateTrackBtn();
    return;
  }
  list.innerHTML = '';
  state.tracks.forEach((track, idx) => {
    const item = document.createElement('div');
    item.className = 'node-item';
    item.style.cursor = 'default';
    item.innerHTML = `
      <div class="node-item-header">
        <span style="font-size:0.82rem;font-weight:700;color:#4A90D9;">곡 ${idx + 1}</span>
        <button class="btn-icon danger" onclick="removeTrack(${track.id})" title="삭제">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="form-group">
        <label class="form-label">제목</label>
        <input type="text" class="form-input" value="${escAttr(track.title)}"
          oninput="updateTrack(${track.id}, 'title', this.value)" placeholder="곡 제목" />
      </div>
      <div class="form-group">
        <label class="form-label">가사 (1~2줄)</label>
        <input type="text" class="form-input" value="${escAttr(track.lyrics)}"
          oninput="updateTrack(${track.id}, 'lyrics', this.value)" placeholder="가사 한 줄" />
      </div>
      <div class="form-group">
        <label class="form-label">앨범 이미지 (선택)</label>
        <div class="profile-img-upload">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('trackImg-${track.id}').click()">
            <i class="fa-solid fa-image"></i> ${track.albumImg ? '변경' : '업로드'}
          </button>
          ${track.albumImg ? `<button class="btn btn-danger btn-sm" onclick="removeTrackImg(${track.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          <input type="file" id="trackImg-${track.id}" accept="image/*" style="display:none"
            onchange="handleTrackImg(${track.id}, this)" />
        </div>
      </div>
    `;
    list.appendChild(item);
  });
  updateTrackBtn();
}

function updateTrackBtn() {
  const btn = document.getElementById('addTrackBtn');
  if (btn) btn.disabled = state.tracks.length >= 10;
}

// ===================== HELPERS =====================
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function getColor(id, fallback) {
  const val = getVal(id);
  return /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback;
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

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===================== PREVIEW RENDER =====================
function renderPreview() {
  const showSetlist = document.getElementById('setlistToggle')?.checked || false;
  const footerText = getVal('footerText');
  const mainTitle = getVal('mainTitle');
  const mainLyrics = getVal('mainLyrics');
  const timeStart = getVal('timeStart') || '00:00';
  const timeEnd = getVal('timeEnd') || '04:10';
  const progressPct = Math.max(0, Math.min(100, parseInt(getVal('progressPos'), 10) || 30));

  const setlistEditor = document.getElementById('setlistEditor');
  if (setlistEditor) setlistEditor.style.display = showSetlist ? '' : 'none';

  const font = getVal('fontSelect') || 'Pretendard';
  const fontStack = getFontStack(font);
  const bgColor = getColor('bgColor', '#f8e8ee');
  const setlistBgColor = getColor('setlistBgColor', '#ffffff');
  const textColor = getColor('textColor', '#333333');
  const lyricsColor = getColor('lyricsColor', '#888888');
  const accentColor = getColor('accentColor', '#555555');
  const dividerColor = getColor('dividerColor', '#cccccc');
  const albumFallback = getColor('albumFallbackColor', '#d4a0b0');

  const hasHeaderImg = !!state.headerImg;

  // 앨범 원형
  const albumHTML = state.albumImg
    ? `<img src="${esc(state.albumImg)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<i class="fa-solid fa-music" style="font-size:2rem;color:rgba(255,255,255,0.5);"></i>`;

  // ===== 바깥 배경 (직사각형, border-radius:0) =====
  const outerBg = hasHeaderImg
    ? `<div style="position:absolute;inset:0;background-image:url('${state.headerImg}');background-size:cover;background-position:center;filter:blur(14px) brightness(0.75);transform:scale(1.15);z-index:0;"></div><div style="position:absolute;inset:0;background:${bgColor};opacity:0.2;z-index:0;"></div>`
    : '';

  // ===== 카세트 테이프 (항상 동일 크기) =====
  const cassetteHTML = `
    <div style="border-radius:16px;overflow:visible;box-shadow:0 4px 20px rgba(0,0,0,0.1);position:relative;width:100%;max-width:320px;flex-shrink:0;z-index:2;">
      <!-- 상단: 헤더 이미지 원본 or 배경색 -->
      <div style="position:relative;overflow:hidden;height:140px;border-radius:16px 16px 0 0;${hasHeaderImg ? `background-image:url('${state.headerImg}');background-size:cover;background-position:center;` : `background:${bgColor};`}">
      </div>
      <!-- 앨범 이미지 (상단/하단 경계에 걸침, 앞으로) -->
      <div style="position:absolute;left:20px;top:85px;z-index:10;width:90px;height:90px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${albumFallback};box-shadow:0 4px 16px rgba(0,0,0,0.18);">
        ${albumHTML}
      </div>
      <!-- 하단: 다크 패널 -->
      <div style="background:#1a1a1a;padding:1.4rem 1.2rem 0.8rem;color:#fff;border-radius:0 0 16px 16px;">
        <div style="text-align:center;margin-bottom:0.6rem;">
          <div style="font-size:0.95rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(mainTitle || '노래 제목')}</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:0.2rem;line-height:1.5;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(mainLyrics || '가사 1~2줄')}</div>
        </div>
        <div style="margin-bottom:0.3rem;">
          <div style="position:relative;height:3px;background:rgba(255,255,255,0.15);border-radius:3px;margin-bottom:0.3rem;">
            <div style="width:${progressPct}%;height:100%;background:rgba(255,255,255,0.6);border-radius:3px;"></div>
            <div style="position:absolute;top:50%;left:${progressPct}%;transform:translate(-50%,-50%);width:10px;height:10px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.63rem;color:rgba(255,255,255,0.4);">
            <span>${esc(timeStart)}</span>
            <span>${esc(timeEnd)}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:1rem;color:rgba(255,255,255,0.6);font-size:0.8rem;padding-top:0.1rem;">
          <i class="fa-solid fa-backward" style="font-size:0.6rem;opacity:0.5;"></i>
          <i class="fa-solid fa-backward-step"></i>
          <div style="width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;">
            <i class="fa-solid fa-play" style="font-size:0.65rem;margin-left:2px;"></i>
          </div>
          <i class="fa-solid fa-forward-step"></i>
          <i class="fa-solid fa-forward" style="font-size:0.6rem;opacity:0.5;"></i>
        </div>
      </div>
    </div>
  `;

  // ===== 카세트만 =====
  if (!showSetlist) {
    document.getElementById('playlistPreview').innerHTML = `
      <div class="pl-cassette" style="font-family:${fontStack};position:relative;overflow:hidden;padding:2rem;${hasHeaderImg ? '' : `background:${bgColor};`}">
        ${outerBg}
        <div style="position:relative;z-index:1;display:flex;justify-content:center;">
          ${cassetteHTML}
        </div>
      </div>
    `;
    return;
  }

  // ===== 셋리스트 =====
  let tracksContent = '';
  if (state.tracks.length === 0) {
    tracksContent = `<div style="font-size:0.82rem;color:${lyricsColor};text-align:center;padding:2rem 0;">곡을 추가하면 여기에 표시됩니다</div>`;
  } else {
    state.tracks.forEach((track, idx) => {
      const trackAlbum = track.albumImg
        ? `<div style="width:40px;height:40px;border-radius:6px;overflow:hidden;flex-shrink:0;"><img src="${esc(track.albumImg)}" style="width:100%;height:100%;object-fit:cover;" /></div>`
        : '';
      tracksContent += `
        <div style="display:flex;align-items:center;gap:0.6rem;padding:0.55rem 0;">
          <span style="font-size:0.8rem;font-weight:700;color:${lyricsColor};min-width:1.6rem;text-align:right;">${idx + 1}.</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;font-weight:600;color:${textColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(track.title || '제목')}</div>
            ${track.lyrics ? `<div style="font-size:0.72rem;color:${lyricsColor};margin-top:0.08rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(track.lyrics)}</div>` : ''}
          </div>
          ${trackAlbum}
        </div>
        <div style="height:1px;background:${dividerColor};opacity:0.3;"></div>
      `;
    });
  }

  let footerHTML = '';
  if (footerText) {
    footerHTML = `
      <div style="margin-top:auto;padding-top:0.8rem;text-align:center;font-size:0.65rem;color:${lyricsColor};opacity:0.4;">
        ${esc(footerText)}
      </div>
    `;
  }

  // 셋리스트: 카세트 하단 근처에서 시작 (margin-top으로 크게 겹침)
  // 카세트 전체 높이 ≈ 140(상단) + ~160(하단) = ~300px
  // 셋리스트 상단을 카세트 하단 부근에서 시작 → margin-top: 160px (카세트의 절반 아래)
  const setlistPanel = `
    <div style="background:${setlistBgColor};border-radius:16px;padding:1rem 1.2rem;display:flex;flex-direction:column;flex:1;min-width:0;margin-top:160px;margin-left:-30px;box-shadow:0 4px 20px rgba(0,0,0,0.06);z-index:1;min-height:200px;">
      ${tracksContent}
      ${footerHTML}
    </div>
  `;

  document.getElementById('playlistPreview').innerHTML = `
    <div class="pl-cassette" style="font-family:${fontStack};position:relative;overflow:hidden;padding:1.5rem 1.5rem 1.5rem 1.5rem;${hasHeaderImg ? '' : `background:${bgColor};`}">
      ${outerBg}
      <div style="position:relative;z-index:1;display:flex;align-items:flex-start;">
        ${cassetteHTML}
        ${setlistPanel}
      </div>
    </div>
  `;
}

// ===================== EXPORT =====================
function copyHTML() {
  const preview = document.getElementById('playlistPreview');
  const fullHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>플레이리스트</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
<style>
body{font-family:'Noto Sans KR',-apple-system,sans-serif;background:#f5f7fa;display:flex;justify-content:center;padding:2rem;margin:0;}
</style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;
  navigator.clipboard.writeText(fullHTML).then(() => alert('HTML이 클립보드에 복사되었습니다!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = fullHTML;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('HTML이 클립보드에 복사되었습니다!');
    });
}

function saveJSON() {
  const data = {
    version: 6,
    headerImg: state.headerImg,
    albumImg: state.albumImg,
    mainTitle: getVal('mainTitle'),
    mainLyrics: getVal('mainLyrics'),
    timeStart: getVal('timeStart'),
    timeEnd: getVal('timeEnd'),
    progressPos: parseInt(getVal('progressPos'), 10) || 30,
    showSetlist: document.getElementById('setlistToggle')?.checked || false,
    tracks: state.tracks,
    footerText: getVal('footerText'),
    nextTrackId: state.nextTrackId,
    font: getVal('fontSelect'),
    bgColor: getVal('bgColor'),
    setlistBgColor: getVal('setlistBgColor'),
    textColor: getVal('textColor'),
    lyricsColor: getVal('lyricsColor'),
    accentColor: getVal('accentColor'),
    dividerColor: getVal('dividerColor'),
    albumFallbackColor: getVal('albumFallbackColor'),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'playlist-backup.json';
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
      state.headerImg = data.headerImg || '';
      state.albumImg = data.albumImg || '';
      state.tracks = (data.tracks || []).slice(0, 10).map(t => ({
        id: t.id,
        title: t.title || '',
        lyrics: t.lyrics || '',
        albumImg: t.albumImg || '',
      }));
      state.nextTrackId = data.nextTrackId || (state.tracks.length + 1);

      setVal('mainTitle', data.mainTitle);
      setVal('mainLyrics', data.mainLyrics);
      setVal('timeStart', data.timeStart || '00:00');
      setVal('timeEnd', data.timeEnd || '04:10');
      setVal('progressPos', data.progressPos || 30);
      setVal('footerText', data.footerText);
      if (data.font) setVal('fontSelect', data.font);
      if (data.bgColor) setVal('bgColor', data.bgColor);
      if (data.setlistBgColor) setVal('setlistBgColor', data.setlistBgColor);
      if (data.textColor) setVal('textColor', data.textColor);
      if (data.lyricsColor) setVal('lyricsColor', data.lyricsColor);
      if (data.accentColor) setVal('accentColor', data.accentColor);
      if (data.dividerColor) setVal('dividerColor', data.dividerColor);
      if (data.albumFallbackColor) setVal('albumFallbackColor', data.albumFallbackColor);

      const toggle = document.getElementById('setlistToggle');
      if (toggle) toggle.checked = !!data.showSetlist;

      document.getElementById('headerImgRemoveBtn').style.display = state.headerImg ? '' : 'none';
      document.getElementById('albumImgRemoveBtn').style.display = state.albumImg ? '' : 'none';

      renderTracks();
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
  const target = document.querySelector('.pl-cassette');
  if (!target) {
    alert('미리보기를 먼저 생성해 주세요.');
    return;
  }
  html2canvas(target, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
  }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'playlist-preview.png';
    a.click();
  }).catch(() => alert('이미지 저장 중 오류가 발생했습니다.'));
}
