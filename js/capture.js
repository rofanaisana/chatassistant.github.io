/* capture.js — 미리보기 iframe을 PNG / GIF로 저장
 *
 * 구조상 알아둘 것:
 * 1) 캡처 라이브러리는 iframe "안쪽"에 주입해서 iframe 안에서 실행한다.
 *    부모에서 실행하면 getComputedStyle이 부모 window 기준으로 동작해 스타일이 날아간다.
 * 2) SVG foreignObject는 외부 리소스를 못 불러온다. 그래서 캡처 전에
 *    모든 외부 이미지를 data URL로 바꿔 심어야 한다. CORS를 막는 서버가 많아
 *    이미지 프록시를 거치는 경로를 둔다.
 *
 * 전제: previewFrame에 sandbox="allow-scripts allow-same-origin"이 걸려 있어야 한다.
 */
(function () {
  'use strict';

  var LIB = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  // gifenc의 main 필드는 CJS라 변환 서비스를 거치면 named export가 깨진다. ESM 빌드를 직접 가리킨다.
  var GIFENC = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';
  // CORS 헤더를 붙여 이미지를 되돌려주는 공개 프록시. n=-1은 애니메이션 GIF 전체 유지.
  var PROXY = 'https://images.weserv.nl/?n=-1&url=';

  var frame, statusEl;
  var gifencMod = null;

  function $(id) { return document.getElementById(id); }

  function status(msg, tone) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.dataset.tone = tone || '';
  }

  /* html-to-image는 Error가 아닌 값(이미지 onerror 이벤트 등)으로 reject하는
     경로가 있다. 그대로 .message를 읽으면 undefined가 뜨므로 직접 풀어쓴다. */
  function describe(e) {
    console.error('[capture]', e);
    if (!e) return '알 수 없는 오류';
    if (typeof e === 'string') return e;
    if (e.message) return e.message;
    if (e.target && e.target.tagName) return e.target.tagName.toLowerCase() + ' 로드 실패 — 콘솔(F12) 확인';
    if (e.type) return e.type + ' 이벤트 — 콘솔(F12) 확인';
    try { return JSON.stringify(e); } catch (_) { return String(e); }
  }

  function busy(on) {
    ['savePngBtn', 'saveGifBtn'].forEach(function (id) {
      var b = $(id);
      if (b) b.disabled = on;
    });
  }

  function ensureLib() {
    var win = frame.contentWindow;
    var doc = frame.contentDocument;
    if (!doc) return Promise.reject(new Error('미리보기에 접근할 수 없습니다. sandbox 설정을 확인하세요.'));
    if (win.htmlToImage) return Promise.resolve();

    return new Promise(function (res, rej) {
      var s = doc.createElement('script');
      s.src = LIB;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('캡처 라이브러리를 불러오지 못했습니다.')); };
      (doc.head || doc.documentElement).appendChild(s);
    });
  }

  /* ── 외부 이미지 인라인 ───────────────────────────── */

  function blobToDataURL(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(fr.result); };
      fr.onerror = function () { rej(new Error('이미지 변환 실패')); };
      fr.readAsDataURL(blob);
    });
  }

  /* 직접 fetch → 막히면 프록시. 둘 다 실패하면 원본을 남겨둔다. */
  async function fetchAsDataURL(url) {
    var res = null;
    try {
      res = await fetch(url, { mode: 'cors' });
      if (!res.ok) res = null;
    } catch (e) { res = null; }

    if (!res) {
      var allow = $('useProxy') ? $('useProxy').checked : true;
      if (!allow) throw new Error('CORS 차단 (프록시 꺼짐)');
      res = await fetch(PROXY + encodeURIComponent(url.replace(/^https?:\/\//, '')));
      if (!res.ok) throw new Error('프록시 응답 ' + res.status);
    }

    var blob = await res.blob();
    return { url: await blobToDataURL(blob), type: blob.type };
  }

  /* 캡처 직전에 외부 이미지를 data URL로 바꾸고, 되돌릴 목록을 반환한다. */
  async function inlineImages(doc) {
    var all = Array.prototype.slice.call(doc.querySelectorAll('img'));
    var targets = all.filter(function (im) {
      if (!im.src || im.src.indexOf('data:') === 0) return false;
      try { return new URL(im.src, doc.baseURI).origin !== location.origin; }
      catch (e) { return false; }
    });

    var restore = [];
    var failed = 0;
    var animated = 0;

    for (var i = 0; i < targets.length; i++) {
      var im = targets[i];
      status('외부 이미지 처리 중… ' + (i + 1) + ' / ' + targets.length);
      try {
        var got = await fetchAsDataURL(im.src);
        restore.push([im, im.src]);
        im.src = got.url;
        if (/gif/i.test(got.type)) animated++;
        if (im.decode) { try { await im.decode(); } catch (e) {} }
      } catch (e) {
        failed++;
        console.warn('[capture] 이미지 인라인 실패:', im.src, e);
      }
    }

    return { restore: restore, failed: failed, total: targets.length, animated: animated };
  }

  function undoInline(restore) {
    restore.forEach(function (pair) { pair[0].src = pair[1]; });
  }

  /* ── 캡처 영역 / 옵션 ─────────────────────────────── */

  function region() {
    var doc = frame.contentDocument;
    var root = doc.documentElement;
    var body = doc.body;
    var full = $('captureFull') ? $('captureFull').checked : true;

    var w = Math.ceil(frame.clientWidth) || 800;
    var h = full
      ? Math.max(root.scrollHeight, body ? body.scrollHeight : 0, frame.clientHeight)
      : Math.ceil(frame.clientHeight);

    return { w: w, h: Math.ceil(h), node: root };
  }

  function options(r, extra) {
    var o = {
      width: r.w,
      height: r.h,
      pixelRatio: 1,
      backgroundColor: '#ffffff',
      cacheBust: false,   // 이미지는 이미 인라인했으므로 재요청할 이유가 없다
      skipFonts: $('embedFonts') ? !$('embedFonts').checked : false
    };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  function download(href, name, revoke) {
    var a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
    if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 5000);
  }

  function stamp() {
    return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  }

  function ready() {
    var code = $('htmlInput').value.trim();
    if (!code) { status('먼저 HTML 코드를 붙여넣으세요.', 'warn'); return false; }
    if (typeof switchViewerTab === 'function' && window.matchMedia('(max-width: 768px)').matches) {
      switchViewerTab('preview');
    }
    return true;
  }

  /* ── PNG ─────────────────────────────────────────── */
  window.savePngImage = async function () {
    if (!ready()) return;
    busy(true);
    status('준비 중…');

    var doc = frame.contentDocument;
    var inlined = null;

    try {
      await ensureLib();
      inlined = await inlineImages(doc);

      var r = region();
      var ratio = parseInt($('captureScale') ? $('captureScale').value : 2, 10);
      status('캡처 중… ' + r.w + '×' + r.h);

      var url = await frame.contentWindow.htmlToImage.toPng(r.node, options(r, { pixelRatio: ratio }));
      download(url, 'viewer-' + stamp() + '.png');

      var note = inlined.failed
        ? ' · 이미지 ' + inlined.failed + '/' + inlined.total + '개 실패'
        : '';
      status(r.w + '×' + r.h + ' @' + ratio + 'x 저장 완료' + note, inlined.failed ? 'warn' : '');
    } catch (e) {
      status('PNG 실패: ' + describe(e), 'warn');
    } finally {
      if (inlined) undoInline(inlined.restore);
      busy(false);
    }
  };

  /* ── GIF ─────────────────────────────────────────── */

  /* 애니메이션 1회 재생에 걸리는 시간(ms). duration이 "auto"인 경우가 있어 걸러낸다. */
  function span(a) {
    var t = a.effect.getComputedTiming();
    var dur = typeof t.duration === 'number' ? t.duration : 0;
    var iter = isFinite(t.iterations) ? t.iterations : 1;
    var ms = (t.delay || 0) + (t.endDelay || 0) + dur * iter;
    return isFinite(ms) ? ms : 0;
  }

  function twoFrames(win) {
    return new Promise(function (res) {
      win.requestAnimationFrame(function () { win.requestAnimationFrame(res); });
    });
  }

  window.saveGifImage = async function () {
    if (!ready()) return;
    busy(true);
    status('준비 중…');

    var win = frame.contentWindow;
    var doc = frame.contentDocument;
    var anims = [];
    var inlined = null;

    try {
      await ensureLib();

      if (!gifencMod) {
        var mod = await import(GIFENC);
        gifencMod = typeof mod.GIFEncoder === 'function' ? mod : (mod.default || mod);
        if (typeof gifencMod.GIFEncoder !== 'function') {
          gifencMod = null;
          throw new Error('GIF 인코더를 불러오지 못했습니다.');
        }
      }

      anims = doc.getAnimations ? doc.getAnimations() : [];
      if (!anims.length) {
        status('움직이는 CSS 애니메이션이 없습니다. PNG를 쓰세요.', 'warn');
        busy(false);
        return;
      }

      var r = region();
      if (r.w * r.h > 4000000) {
        status('영역이 너무 큽니다 (' + r.w + '×' + r.h + '). "전체 높이"를 끄세요.', 'warn');
        busy(false);
        return;
      }

      inlined = await inlineImages(doc);
      if (inlined.animated) {
        console.warn('[capture] 애니메이션 GIF ' + inlined.animated + '개는 첫 프레임으로 고정됩니다.');
      }

      var fps = parseInt($('gifFps').value, 10) || 15;
      var limit = (parseFloat($('gifSecs').value) || 3) * 1000;
      var longest = Math.max.apply(null, anims.map(span));
      var total = Math.min(longest > 0 ? longest : limit, limit);
      var step = 1000 / fps;
      var count = Math.max(2, Math.round(total / step));

      /* 폰트 CSS는 한 번만 만들어 모든 프레임에 재사용한다. */
      var fontCSS = '';
      if (!options(r).skipFonts && typeof win.htmlToImage.getFontEmbedCSS === 'function') {
        status('폰트 준비 중…');
        try { fontCSS = await win.htmlToImage.getFontEmbedCSS(r.node); }
        catch (e) { console.warn('[capture] 폰트 임베드 실패, 시스템 폰트로 진행', e); }
      }

      var frameOpts = options(r, { pixelRatio: 1, skipFonts: true, fontEmbedCSS: fontCSS });

      var enc = gifencMod.GIFEncoder();
      var buf = document.createElement('canvas');
      buf.width = r.w; buf.height = r.h;
      var ctx = buf.getContext('2d', { willReadFrequently: true });

      /* 애니메이션을 멈추고 currentTime을 한 칸씩 옮겨가며 찍는다.
         캡처가 느려도 프레임 간격이 정확히 유지된다. */
      anims.forEach(function (a) { a.pause(); });

      try {
        for (var i = 0; i < count; i++) {
          anims.forEach(function (a) {
            try { a.currentTime = i * step; } catch (e) {}
          });
          await twoFrames(win);

          var c;
          try {
            c = await win.htmlToImage.toCanvas(r.node, frameOpts);
          } catch (e) {
            throw new Error('프레임 ' + (i + 1) + '/' + count + ' — ' + describe(e));
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, r.w, r.h);
          ctx.drawImage(c, 0, 0, r.w, r.h);

          var data = ctx.getImageData(0, 0, r.w, r.h).data;
          var pal = gifencMod.quantize(data, 256);
          enc.writeFrame(gifencMod.applyPalette(data, pal), r.w, r.h, {
            palette: pal, delay: Math.round(step)
          });

          status('프레임 ' + (i + 1) + ' / ' + count);
        }

        enc.finish();
        download(URL.createObjectURL(new Blob([enc.bytes()], { type: 'image/gif' })),
                 'viewer-' + stamp() + '.gif', true);

        var note = inlined.animated
          ? ' · GIF 이미지 ' + inlined.animated + '개는 정지 상태'
          : '';
        status(count + '프레임 저장 완료' + note, inlined.animated ? 'warn' : '');
      } finally {
        anims.forEach(function (a) { a.play(); });
      }
    } catch (e) {
      status('GIF 실패: ' + describe(e), 'warn');
    } finally {
      if (inlined) undoInline(inlined.restore);
      busy(false);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    frame = $('previewFrame');
    statusEl = $('captureStatus');
  });
})();
