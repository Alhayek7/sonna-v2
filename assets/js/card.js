/* ===== بطاقة المشاركة (بطاقة هوية المشارك — للنشر على لينكدإن وإنستغرام) =====
   تُرسم في المتصفح على Canvas ثم تُحمَّل كصورة PNG. لا تحتاج خادمًا.
   التصميم يُرسم على مساحة 760×1280 ثم تُكبَّر للمنشور (1080×1350) أو الستوري (1080×1920).
   ✏️ الشعارات: assets/logo.png (شعار البرنامج الأبيض) · assets/flame.png (الشعلة) · assets/marqat-navy.png / marqat-white.png (شعار المرقاة)
      لاستبدال شعار المرقاة بنسخة أوضح: ضع ملفين بنفس الاسمين (PNG شفاف، يفضّل عرض 800px+).
   ✏️ الألوان: الكحلي #0a2463 · الأزرق #1d6bf0 · السماوي #3aa0ff */
const ShareCard = (() => {
  const W = 1080, CW = 760, CH = 1280;
  const FONT = 'Tajawal, "Segoe UI", Tahoma, Arial, sans-serif', SCRIPT = '"Aref Ruqaa", Tajawal, serif';
  const NAVY = '#0a2463', BLUE = '#1d6bf0', SKY = '#3aa0ff';
  const PROG_BOX = [256, 244, 840, 853];            // حدود المحتوى داخل logo.png

  const loadImg = (src, cors) => new Promise(res => {
    if (!src) return res(null);
    const im = new Image(); if (cors) im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = () => res(null); im.src = src;
  });
  const rr = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  function fit(x, text, weight, size, maxW, min = 16, fam = FONT) { do { x.font = `${weight} ${size}px ${fam}`; size -= 1; } while (x.measureText(text).width > maxW && size > min); }
  /* صورة مُلوَّنة: لون صلب أو تدرّج (grad = [c1,c2]) */
  function tint(im, col, sb) {
    const [sx, sy, sw, sh] = sb || [0, 0, im.width, im.height];
    const c = document.createElement('canvas'); c.width = sw; c.height = sh; const t = c.getContext('2d');
    t.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh); t.globalCompositeOperation = 'source-in';
    if (Array.isArray(col)) { const g = t.createLinearGradient(0, 0, sw * .6, sh); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); t.fillStyle = g; } else t.fillStyle = col;
    t.fillRect(0, 0, sw, sh); return c;
  }
  /* يرسم صورة داخل صندوق مع الحفاظ على النسبة؛ align: 'r' | 'l' | 'c' */
  function contain(x, im, bx, by, bw, bh, align = 'c') {
    const w0 = im.width, h0 = im.height, s = Math.min(bw / w0, bh / h0), w = w0 * s, h = h0 * s;
    const px = align === 'r' ? bx + bw - w : align === 'l' ? bx : bx + (bw - w) / 2; x.drawImage(im, px, by + (bh - h) / 2, w, h); return { x: px, w, h };
  }
  function qrCanvas(text, size, fg) {
    try {
      const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), c = document.createElement('canvas'), cell = Math.ceil(size / (n + 2));
      c.width = c.height = cell * (n + 2); const t = c.getContext('2d'); t.fillStyle = '#fff'; t.fillRect(0, 0, c.width, c.height); t.fillStyle = fg;
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) t.fillRect((k + 1) * cell, (r + 1) * cell, cell, cell);
      return c;
    } catch { return null; }
  }
  function icon(x, kind, cx, cy) {                 // أيقونات بيضاء بسيطة داخل دائرة
    x.save(); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineWidth = 3.2; x.lineCap = 'round';
    if (kind === 'person') { x.beginPath(); x.arc(cx, cy - 6, 6.5, 0, 7); x.fill(); x.beginPath(); x.arc(cx, cy + 14, 13, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    else if (kind === 'star') { x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } x.closePath(); x.fillStyle = '#ffd36e'; x.fill(); }
    else if (kind === 'pin') { x.beginPath(); x.arc(cx, cy - 4, 10, Math.PI * .85, Math.PI * .15); x.lineTo(cx, cy + 15); x.closePath(); x.fill(); x.fillStyle = NAVY; x.beginPath(); x.arc(cx, cy - 4, 4, 0, 7); x.fill(); }
    else { x.font = `800 28px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'ltr'; x.fillText('@', cx, cy + 1); }
    x.restore();
  }

  /* opts: { name, specialty, isMember, countryName, countryCode, city, ig, photo, photoCors, program, org, memberLabel, openLabel,
             url, qrUrl, handle, tagline, total, format: 'post' | 'story' } */
  async function build(o, withPhoto = true) {
    try { await Promise.all(['900 60px Tajawal', '700 30px Tajawal', '500 30px Tajawal', '800 30px Tajawal', '700 40px "Aref Ruqaa"'].map(f => document.fonts.load(f))); } catch { }
    const story = o.format === 'story', H = story ? 1920 : 1350, S = story ? 1.2 : .9, ox = (W - CW * S) / 2, oy = story ? 250 : 150;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.textBaseline = 'middle';

    const [prog, mqN, mqW, flame, ph, flag] = await Promise.all([
      loadImg('assets/logo.png'), loadImg('assets/marqat-navy.png'), loadImg('assets/marqat-white.png'), loadImg('assets/flame.png'),
      withPhoto ? loadImg(o.photo, o.photoCors) : null,
      withPhoto && o.countryCode ? loadImg(`https://flagcdn.com/w80/${String(o.countryCode).toLowerCase()}.png`, true) : null]);

    // ---- خلفية ناعمة بخطوط ضوء مائلة
    let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f4f8fe'); g.addColorStop(1, '#dfeafb'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.save(); x.rotate(-.5); for (let i = -4; i < 9; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.55)' : 'rgba(180,205,240,.14)'; x.fillRect(i * 190 - 200, -300, 110, H * 2); } x.restore();

    // ---- الحبل (Lanyard)
    const lx = W / 2, lw = 74 * S / .9 * .9;
    x.save(); g = x.createLinearGradient(lx - lw / 2, 0, lx + lw / 2, 0); g.addColorStop(0, '#08215c'); g.addColorStop(.5, '#14388f'); g.addColorStop(1, '#08215c');
    x.fillStyle = g; x.fillRect(lx - lw / 2, -10, lw, oy + 30);
    if (flame) { const f = tint(flame, '#4aa8ff'); for (let k = 0; k < 3; k++) { const fy = 18 + k * 110; if (fy < oy - 50) x.drawImage(f, lx - 13, fy, 26, 26 * flame.height / flame.width * .9); } }
    x.restore();
    // مشبك معدني
    x.save(); g = x.createLinearGradient(0, oy - 18, 0, oy + 34); g.addColorStop(0, '#e9eef6'); g.addColorStop(.5, '#9aa7ba'); g.addColorStop(1, '#d8e0ec');
    x.fillStyle = g; rr(x, lx - lw / 2 - 6, oy - 8, lw + 12, 44, 8); x.fill(); x.strokeStyle = 'rgba(10,36,99,.35)'; x.lineWidth = 2; x.stroke(); x.restore();

    // ---- البطاقة (إحداثيات 760×1280)
    x.save(); x.translate(ox, oy); x.scale(S, S);
    x.save(); x.shadowColor = 'rgba(10,36,99,.35)'; x.shadowBlur = 50; x.shadowOffsetY = 22; x.fillStyle = '#fff'; rr(x, 0, 0, CW, CH, 46); x.fill(); x.restore();
    x.save(); rr(x, 0, 0, CW, CH, 46); x.clip();
    g = x.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#f3f8ff'); g.addColorStop(1, '#e6f1ff'); x.fillStyle = g; x.fillRect(0, 0, CW, CH);
    // موجات زرقاء ناعمة
    const wave = (pts, c1, c2) => { g = x.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 6) x.bezierCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]); x.closePath(); x.fill(); };
    wave([760, 20, 700, 60, 640, 40, 590, 0, 760, 0, 760, 0], 'rgba(120,190,255,.55)', 'rgba(200,228,255,.2)');
    wave([760, 120, 690, 40, 620, 20, 570, 0, 600, 0, 760, 0], 'rgba(58,160,255,.25)', 'rgba(255,255,255,0)');
    wave([0, 900, 160, 820, 300, 940, 420, 880, 560, 830, 760, 760, 760, 1280, 0, 1280, 0, 1280], 'rgba(200,226,255,.45)', 'rgba(130,190,255,.35)');
    wave([760, 840, 690, 900, 700, 1010, 640, 1120, 600, 1180, 700, 1160, 760, 1130, 760, 1280, 760, 1280], 'rgba(29,107,240,.85)', 'rgba(10,36,99,.9)');
    wave([760, 880, 725, 930, 735, 1010, 700, 1100, 690, 1160, 730, 1150, 760, 1100, 760, 1280, 760, 1280], 'rgba(90,180,255,.9)', 'rgba(29,107,240,.8)');
    // فتحة الحبل
    x.fillStyle = '#dfe8f5'; rr(x, 300, 22, 160, 30, 15); x.fill(); x.strokeStyle = 'rgba(10,36,99,.15)'; x.lineWidth = 2; x.stroke();

    // ---- صف الشعارات
    const topY = 96; x.fillStyle = 'rgba(10,36,99,.22)'; x.fillRect(379, topY - 8, 2, 78);
    if (prog) contain(x, tint(prog, NAVY, PROG_BOX), 395, topY - 12, 310, 100, 'r');
    if (mqN) contain(x, mqN, 55, topY - 14, 100, 106, 'l');
    x.direction = 'rtl'; x.textAlign = 'left'; x.fillStyle = NAVY; fit(x, o.org, 800, 24, 200, 14); x.fillText(o.org, 168, topY + 22);
    x.fillStyle = SKY; x.font = `500 17px ${FONT}`; x.fillText('للتعليم والتدريب', 168, topY + 52);

    // ---- العنوان + الشعلة
    if (flame) { const fh = 290, fw = fh * flame.width / flame.height; x.save(); x.shadowColor = 'rgba(29,107,240,.3)'; x.shadowBlur = 24; x.drawImage(tint(flame, [NAVY, '#2b8cff']), 705 - fw, 215, fw, fh); x.restore(); }
    x.direction = 'rtl'; x.textAlign = 'right';
    g = x.createLinearGradient(300, 0, 550, 0); g.addColorStop(0, SKY); g.addColorStop(1, BLUE); x.fillStyle = g; rr(x, 300, 232, 250, 52, 26); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `800 27px ${FONT}`; x.fillText('المشارك في تحدي', 425, 260);
    x.textAlign = 'right'; x.fillStyle = NAVY; fit(x, 'صناع الأثر الرقمي', 900, 60, 470, 30); x.fillText('صناع الأثر الرقمي', 545, 326);
    x.fillStyle = '#16296b'; fit(x, `${o.total} يومًا .. لصناعة أثر حقيقي`, 600, 29, 450, 18); x.fillText(`${o.total} يومًا .. لصناعة أثر حقيقي`, 545, 378);

    // ---- الصورة الشخصية
    const px = 210, py = 575, R = 118;
    x.save(); x.shadowColor = 'rgba(29,107,240,.35)'; x.shadowBlur = 30; x.shadowOffsetY = 8;
    g = x.createLinearGradient(px - R, py - R, px + R, py + R); g.addColorStop(0, '#9fd0ff'); g.addColorStop(.5, '#3aa0ff'); g.addColorStop(1, '#bfe0ff');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, R + 12, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py, R + 5, 0, 7); x.fill(); x.restore();
    x.save(); x.beginPath(); x.arc(px, py, R, 0, 7); x.clip();
    if (ph) { const s = Math.max(2 * R / ph.width, 2 * R / ph.height), w = ph.width * s, h = ph.height * s; x.drawImage(ph, px - w / 2, py - h / 2 + (h > 2 * R ? R * .06 : 0), w, h); }
    else {
      g = x.createLinearGradient(px - R, py - R, px + R, py + R); g.addColorStop(0, BLUE); g.addColorStop(1, NAVY); x.fillStyle = g; x.fillRect(px - R, py - R, 2 * R, 2 * R);
      x.fillStyle = '#fff'; x.font = `900 110px ${FONT}`; x.textAlign = 'center'; x.direction = 'rtl'; x.fillText([...o.name.trim()][0] || '؟', px, py + 6);
    }
    x.restore();

    // ---- العبارة بالخط اليدوي
    x.save(); x.translate(560, 580); x.rotate(-.13); x.textAlign = 'center'; x.direction = 'rtl'; x.fillStyle = BLUE; fit(x, 'معاً .. نصنع أثراً أكبر', 700, 44, 300, 24, SCRIPT); x.fillText('معاً .. نصنع أثراً أكبر', 0, 0);
    x.strokeStyle = SKY; x.lineWidth = 3.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-135, 36); x.quadraticCurveTo(0, 18, 140, 14); x.stroke(); x.restore();

    // ---- الاسم
    x.textAlign = 'center'; x.direction = 'rtl'; x.fillStyle = NAVY; fit(x, o.name, 900, 50, 620, 24); x.fillText(o.name, CW / 2, 748);
    if (o.ig) { x.direction = 'ltr'; x.fillStyle = BLUE; x.font = `700 27px ${FONT}`; x.fillText('@' + o.ig, CW / 2, 796); }

    // ---- صفوف البيانات
    const place = [o.countryName, o.city].filter(Boolean).join(' - ') || '—';
    const rows = [
      ['person', 'التخصص', o.specialty || '—'],
      [o.isMember ? 'star' : 'person', 'العضوية', o.isMember ? o.memberLabel : o.openLabel],
      ['pin', 'الدولة', place],
      ['at', 'الحساب', o.ig ? '@' + o.ig : '—']];
    rows.forEach((r, i) => {
      const cy = 872 + i * 66;
      if (i) { x.fillStyle = 'rgba(10,36,99,.1)'; x.fillRect(70, cy - 33, 620, 1.5); }
      g = x.createLinearGradient(0, cy - 25, 0, cy + 25); g.addColorStop(0, '#16409d'); g.addColorStop(1, NAVY); x.fillStyle = g; x.beginPath(); x.arc(668, cy, 25, 0, 7); x.fill(); icon(x, r[0], 668, cy);
      x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = BLUE; x.font = `700 25px ${FONT}`; x.fillText(r[1], 628, cy);
      x.fillStyle = 'rgba(29,107,240,.35)'; x.fillRect(512, cy - 18, 2, 36);
      const isAt = r[0] === 'at'; x.fillStyle = NAVY; x.direction = isAt ? 'ltr' : 'rtl'; x.textAlign = 'right';
      let maxW = 420; const showFlag = r[0] === 'pin' && flag; if (showFlag) maxW -= 56;
      fit(x, r[2], 700, 26, maxW, 15); x.textAlign = isAt ? 'left' : 'right'; const vx = isAt ? 80 : 490;
      if (isAt) { x.textAlign = 'right'; x.direction = 'ltr'; x.fillText(r[2], 490, cy + 1); } else x.fillText(r[2], vx, cy + 1);
      if (showFlag) { const tw = x.measureText(r[2]).width, fh = 28, fw = fh * flag.width / flag.height; x.save(); rr(x, 490 - tw - 12 - fw, cy - fh / 2, fw, fh, 4); x.clip(); x.drawImage(flag, 490 - tw - 12 - fw, cy - fh / 2, fw, fh); x.restore(); }
    });

    // ---- الشريط السفلي
    const by = 1150; g = x.createLinearGradient(0, by, CW, CH); g.addColorStop(0, '#0d2f7e'); g.addColorStop(1, '#071b4d');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, by + 18); x.bezierCurveTo(160, by - 14, 300, by + 40, 460, by + 14); x.bezierCurveTo(560, by - 2, 650, by - 10, 760, by + 6); x.lineTo(760, CH); x.lineTo(0, CH); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(90,180,255,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, by + 14); x.bezierCurveTo(160, by - 18, 300, by + 36, 460, by + 10); x.bezierCurveTo(560, by - 6, 650, by - 14, 760, by + 2); x.stroke();
    const qr = qrCanvas(o.qrUrl || o.url, 240, NAVY);
    if (qr) { x.fillStyle = '#fff'; rr(x, 34, by + 24, 92, 92, 10); x.fill(); x.drawImage(qr, 39, by + 29, 82, 82); }
    x.textAlign = 'left'; x.direction = 'rtl'; x.fillStyle = '#fff'; x.font = `700 20px ${FONT}`; x.fillText('امسح الرمز', 140, by + 52); x.fillText('لمعرفة المزيد', 140, by + 80);
    x.direction = 'ltr'; x.fillStyle = '#9fd0ff'; x.font = `600 15px ${FONT}`; x.fillText(o.url, 140, by + 106);
    if (mqW) contain(x, mqW, 470, by + 26, 64, 82, 'c');
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(548, by + 34, 2, 66);
    if (prog) contain(x, tint(prog, '#ffffff', PROG_BOX), 562, by + 26, 170, 82, 'c');
    x.restore(); x.restore();

    // ---- نص إضافي في الستوري
    if (story) {
      x.textAlign = 'center'; x.direction = 'rtl'; x.fillStyle = NAVY; x.font = `800 46px ${FONT}`; x.fillText(o.tagline, W / 2, 1836);
      x.direction = 'ltr'; x.fillStyle = BLUE; x.font = `700 34px ${FONT}`; x.fillText(o.url, W / 2, 1884);
    }
    return c;
  }

  /* يُرجع {canvas, dataUrl}. إن منع المتصفح التصدير بسبب الصورة (CORS) نعيد الرسم بدونها */
  async function make(o) {
    let canvas = await build(o, true), dataUrl;
    try { dataUrl = canvas.toDataURL('image/png'); }
    catch { canvas = await build(o, false); dataUrl = canvas.toDataURL('image/png'); }
    return { canvas, dataUrl };
  }
  const toBlob = dataUrl => fetch(dataUrl).then(r => r.blob());
  function download(dataUrl, name) { const a = document.createElement('a'); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  async function share(dataUrl, name, text) {      // مشاركة الصورة نفسها على الجوال إن أمكن
    try {
      const f = new File([await toBlob(dataUrl)], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return true; }
    return false;
  }
  /* واجهة جاهزة: معاينة + اختيار المقاس + تحميل + مشاركة + نسخ نص المنشور
     el: الحاوية · base: بيانات البطاقة · caption: نص المنشور المقترح · fileBase: اسم الملف */
  async function mount(el, base, caption, fileBase = 'challenge-card') {
    el.innerHTML = `
      <div class="seg" role="tablist" aria-label="مقاس البطاقة" style="margin-bottom:12px">
        <button type="button" class="seg-b on" data-f="post">🖼️ منشور</button><button type="button" class="seg-b" data-f="story">📱 ستوري</button></div>
      <div class="card-stage"><img class="card-prev" alt="بطاقة المشاركة في التحدي"><div class="card-load">جارٍ تجهيز بطاقتك…</div></div>
      <div class="card-btns"><button type="button" class="btn gold" data-a="dl">⬇ تحميل البطاقة</button><button type="button" class="btn" data-a="sh">📤 مشاركة</button><button type="button" class="btn ghost" data-a="cp">📋 نسخ نص المنشور</button></div>
      <p class="card-tip">💡 انشر البطاقة على حسابك مع النص المقترح ووسم الحساب الرسمي، فمشاركتك تدعم المبادرة وتحفّز غيرك.</p>`;
    const img = el.querySelector('.card-prev'), load = el.querySelector('.card-load');
    let fmt = 'post', cur = null;
    const draw = async () => {
      load.style.display = ''; img.style.opacity = .25;
      try { cur = await make({ ...base, format: fmt }); img.src = cur.dataUrl; img.style.opacity = 1; load.style.display = 'none'; }
      catch (e) { console.error(e); load.textContent = 'تعذّر تجهيز البطاقة، حدّث الصفحة وحاول مجددًا'; }
    };
    el.querySelector('.seg').onclick = e => { const b = e.target.closest('.seg-b'); if (!b) return; fmt = b.dataset.f; el.querySelectorAll('.seg-b').forEach(x => x.classList.toggle('on', x === b)); draw(); };
    el.querySelector('.card-btns').onclick = async e => {
      const b = e.target.closest('button'); if (!b || !cur) return; const name = `${fileBase}-${fmt}.png`;
      if (b.dataset.a === 'dl') download(cur.dataUrl, name);
      else if (b.dataset.a === 'cp') toast(await copyText(caption) ? 'تم نسخ نص المنشور ✅' : 'تعذّر النسخ', 'ok');
      else if (!(await share(cur.dataUrl, name, caption))) { download(cur.dataUrl, name); toast('تم تحميل البطاقة، انشرها من معرض الصور 📲'); }
    };
    await draw();
  }
  return { make, download, share, mount };
})();
