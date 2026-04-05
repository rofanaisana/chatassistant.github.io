// ===================== STATE =====================
const state = {
  headerImg: '',
  albumImg: '',
  mainTitle: '',
  mainArtist: '',
  mainLyrics: '',
  timeStart: '00:00',
  timeEnd: '04:10',
  progressPos: 30,
  showSetlist: false,
  tracks: [],
  footerText: '',
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

// ===================== PREVIEW =====================
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

function renderPreview() {
  // 상태 동기화
  state.mainTitle = getVal('mainTitle');
  state.mainArtist = getVal('mainArtist');
  state.mainLyrics = getVal('mainLyrics');
  state.timeStart = getVal('timeStart') || '00:00';
  state.timeEnd = getVal('timeEnd') || '04:10';
  state.progressPos = parseInt(getVal('progressPos'), 10) || 30;
  state.showSetlist = document.getElementById('setlistToggle')?.checked || false;
  state.footerText = getVal('footerText');

  // 셋리스트 에디터 토글
  const setlistEditor = document.getElementById('setlistEditor');
  if (setlistEditor) {
    setlistEditor.style.display = state.showSetlist ? '' : 'none';
  }

  const font = getVal('fontSelect') || 'Pretendard';
  const fontStack = getFontStack(font);
  const bgColor = getColor('bgColor', '#1a1a2e');
  const textColor = getColor('textColor', '#ffffff');
  const accentColor = getColor('accentColor', '#e8e8e8');
  const lyricsColor = getColor('lyricsColor', '#bbbbbb');
  const albumFallback = getColor('albumFallbackColor', '#4A90D9');

  const progressPct = Math.max(0, Math.min(100, state.progressPos));

  // 헤더 배경 (블러)
  const headerBg = state.headerImg
    ? `background-image:url('${state.headerImg}');background-size:cover;background-position:center;`
    : `background:${bgColor};`;

  // 앨범 이미지
  const albumContent = state.albumImg
    ? `<img src="${esc(state.albumImg)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<i class="fa-solid fa-music" style="font-size:2rem;color:rgba(255,255,255,0.6);"></i>`;

  let html = '';

  // ===== 카세트 테이프 =====
  html += `
    <div class="pl-cassette" style="font-family:${fontStack};color:${textColor};background:${bgColor};border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.25);">
      <!-- 헤더 블러 배경 -->
      <div style="position:relative;padding:2rem 1.5rem 1.2rem;overflow:hidden;">
        <div style="position:absolute;inset:0;${headerBg}filter:blur(20px) brightness(0.6);transform:scale(1.2);z-index:0;"></div>
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:0.8rem;">
          <!-- 원형 앨범 이미지 -->
          <div style="width:100px;height:100px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${albumFallback};box-shadow:0 4px 20px rgba(0,0,0,0.3);flex-shrink:0;">
            ${albumContent}
          </div>
          <!-- 제목 & 아티스트 -->
          <div style="text-align:center;">
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.2rem;">${esc(state.mainTitle || '노래 제목')}</div>
            <div style="font-size:0.82rem;opacity:0.7;">${esc(state.mainArtist || '아티스트')}</div>
          </div>
          <!-- 가사 -->
          <div style="font-size:0.82rem;color:${lyricsColor};text-align:center;line-height:1.6;white-space:pre-wrap;max-width:90%;">${esc(state.mainLyrics || '')}</div>
        </div>
      </div>
      <!-- 프로그레스 바 -->
      <div style="padding:0.8rem 1.5rem 0.6rem;">
        <div style="position:relative;height:4px;background:rgba(255,255,255,0.15);border-radius:4px;margin-bottom:0.4rem;">
          <div style="width:${progressPct}%;height:100%;background:${accentColor};border-radius:4px;"></div>
          <div style="position:absolute;top:50%;left:${progressPct}%;transform:translate(-50%,-50%);width:12px;height:12px;background:${accentColor};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;opacity:0.5;">
          <span>${esc(state.timeStart)}</span>
          <span>${esc(state.timeEnd)}</span>
        </div>
      </div>
      <!-- 컨트롤 버튼 -->
      <div style="display:flex;align-items:center;justify-content:center;gap:1.8rem;padding:0.4rem 1.5rem 1.2rem;font-size:1.1rem;opacity:0.6;">
        <i class="fa-solid fa-shuffle" style="font-size:0.8rem;"></i>
        <i class="fa-solid fa-backward-step"></i>
        <div style="width:40px;height:40px;border-radius:50%;background:${accentColor};display:flex;align-items:center;justify-content:center;opacity:1;">
          <i class="fa-solid fa-play" style="color:${bgColor};font-size:0.9rem;margin-left:2px;"></i>
        </div>
        <i class="fa-solid fa-forward-step"></i>
        <i class="fa-solid fa-repeat" style="font-size:0.8rem;"></i>
      </div>
  `;

  // ===== 셋리스트 =====
  if (state.showSetlist) {
    html += `
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding:1rem 1.5rem 0.6rem;">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.4;margin-bottom:0.8rem;">SETLIST</div>
    `;

    if (state.tracks.length === 0) {
      html += `<div style="font-size:0.82rem;opacity:0.3;text-align:center;padding:1rem 0;">곡을 추가하면 여기에 표시됩니다</div>`;
    } else {
      state.tracks.forEach((track, idx) => {
        const trackAlbum = track.albumImg
          ? `<div style="width:44px;height:44px;border-radius:6px;overflow:hidden;flex-shrink:0;"><img src="${esc(track.albumImg)}" style="width:100%;height:100%;object-fit:cover;" /></div>`
          : '';
        html += `
          <div style="display:flex;align-items:center;gap:0.8rem;padding:0.6rem 0;${idx < state.tracks.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.08);' : ''}">
            <span style="font-size:0.78rem;font-weight:700;opacity:0.35;min-width:1.4rem;text-align:right;">${idx + 1}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.88rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(track.title || '제목 없음')}</div>
              ${track.lyrics ? `<div style="font-size:0.75rem;color:${lyricsColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:0.15rem;">${esc(track.lyrics)}</div>` : ''}
            </div>
            ${trackAlbum}
          </div>
        `;
      });
    }

    // 하단 문구 (footer)
    if (state.footerText) {
      html += `
        <div style="margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:0.68rem;opacity:0.3;letter-spacing:0.02em;">
          ${esc(state.footerText)}
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `</div>`; // .pl-cassette 닫기

  document.getElementById('playlistPreview').innerHTML = html;
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
    version: 1,
    headerImg: state.headerImg,
    albumImg: state.albumImg,
    mainTitle: getVal('mainTitle'),
    mainArtist: getVal('mainArtist'),
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
    textColor: getVal('textColor'),
    accentColor: getVal('accentColor'),
    lyricsColor: getVal('lyricsColor'),
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
      setVal('mainArtist', data.mainArtist);
      setVal('mainLyrics', data.mainLyrics);
      setVal('timeStart', data.timeStart || '00:00');
      setVal('timeEnd', data.timeEnd || '04:10');
      setVal('progressPos', data.progressPos || 30);
      setVal('footerText', data.footerText);
      if (data.font) setVal('fontSelect', data.font);
      if (data.bgColor) setVal('bgColor', data.bgColor);
      if (data.textColor) setVal('textColor', data.textColor);
      if (data.accentColor) setVal('accentColor', data.accentColor);
      if (data.lyricsColor) setVal('lyricsColor', data.lyricsColor);
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
  const bgColor = getColor('bgColor', '#1a1a2e');
  html2canvas(target, {
    scale: 2,
    backgroundColor: bgColor,
    useCORS: true,
  }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'playlist-preview.png';
    a.click();
  }).catch(() => alert('이미지 저장 중 오류가 발생했습니다.'));
}

// ===================== HELPERS =====================
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
