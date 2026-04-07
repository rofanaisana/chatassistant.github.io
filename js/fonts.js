/* ================================================================
   fonts.js — 전역 글꼴 관리
   관리자가 여기에만 글꼴을 추가하면 모든 페이지에 자동 반영됩니다.
   ================================================================ */

/**
 * 글꼴 목록
 * - value: CSS font-family에 사용할 이름
 * - label: 에디터 드롭다운에 표시할 이름
 * - stack: 실제 CSS font-family 전체 (fallback 포함)
 *
 * 🔧 글꼴 추가 방법: 아래 배열에 항목을 추가하기만 하면 됩니다!
 *    단, 웹폰트일 경우 해당 @import 또는 <link>를 css/style.css 또는 HTML <head>에 추가해야 합니다.
 */
const GLOBAL_FONTS = [
  {
    value: 'Pretendard',
    label: 'Pretendard (기본)',
    stack: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
  },
  {
    value: 'RIDIBatang',
    label: '리디바탕',
    stack: "'RIDIBatang', 'Noto Sans KR', serif"
  },
  {
    value: 'Nanum Gothic',
    label: '나눔고딕',
    stack: "'Nanum Gothic', 'Noto Sans KR', sans-serif"
  },
  {
    value: 'Nanum Myeongjo',
    label: '나눔명조',
    stack: "'Nanum Myeongjo', 'Noto Sans KR', serif"
  },
];

/**
 * <select> 요소에 글꼴 옵션을 채워넣는 함수
 * @param {string|HTMLSelectElement} selectEl - <select> 요소 또는 id
 * @param {string} [selectedValue] - 선택할 기본 값
 */
function populateFontSelect(selectEl, selectedValue) {
  const el = typeof selectEl === 'string' ? document.getElementById(selectEl) : selectEl;
  if (!el) return;
  el.innerHTML = '';
  GLOBAL_FONTS.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    if (selectedValue && f.value === selectedValue) opt.selected = true;
    el.appendChild(opt);
  });
}

/**
 * 페이지 내의 모든 글꼴 <select>를 한 번에 채우기
 * @param {string[]} ids - select 요소들의 id 배열
 */
function populateAllFontSelects(ids) {
  ids.forEach(id => populateFontSelect(id));
}

/**
 * font value → CSS font-family stack 변환
 * @param {string} fontValue
 * @returns {string}
 */
function getFontStack(fontValue) {
  const found = GLOBAL_FONTS.find(f => f.value === fontValue);
  return found ? found.stack : GLOBAL_FONTS[0].stack;
}
