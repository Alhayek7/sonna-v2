/* ===== الصفحة الشخصية للمشارك: p.html?u=اسم_الحساب ===== */
(function () {
  $('#footOrg').textContent = `برنامج ${CFG.PROGRAM_NAME} · مبادرة ${CFG.ORG_NAME}`;
  const handle = cleanHandle(new URLSearchParams(location.search).get('u') || '').toLowerCase();
  const fail = msg => { $('#state').textContent = msg; };
  if (!handle) return fail('الرابط غير مكتمل. افتح صفحتك من لوحة الترتيب.');

  async function load() {
    if (!sb) { const d = demoData(); return { settings: d.settings, participants: d.participants, subs: d.subs }; }
    const [{ data: settings, error }, participants, subs] = await Promise.all([
      sb.from('settings').select('*').eq('id', 1).single(),
      fetchAll(() => sb.from('participants').select('id,full_name,instagram,specialty,photo_url,is_member,country_code,city,created_at').eq('status', 'approved').order('created_at')),
      fetchAll(() => sb.from('submissions').select('id,participant_id,day_number,reel_url').eq('status', 'approved').order('id'))
    ]);
    if (error) throw error;
    return { settings, participants, subs };
  }

  (async () => {
    try {
      const { settings, participants, subs } = await load();
      const info = challengeInfo(settings), all = computeRows(participants, subs, info);
      const mem = computeRows(participants.filter(p => p.is_member), subs, info);
      const r = all.find(x => x.p.instagram.toLowerCase() === handle);
      if (!r) return fail('لم نجد مشاركًا بهذا الحساب، أو أن طلبه ما زال قيد المراجعة.');
      const p = r.p, mr = mem.find(x => x.p.id === p.id);
      document.title = `${p.full_name} | تحدي ${info.total} يومًا`;
      $('#pfAv').innerHTML = avatarHTML(p);
      $('#pfBadge').innerHTML = memberBadgeHTML(p);
      $('#pfName').textContent = p.full_name; $('#pfSpec').textContent = p.specialty; $('#pfPlace').textContent = placeText(p) || '';
      $('#pfIg').href = 'https://instagram.com/' + encodeURIComponent(p.instagram); $('#pfIg').textContent = '@' + p.instagram;
      $('#pfTotal').textContent = info.total; $('#pfMot').textContent = motivation(r, info);
      const stats = [['🏅', '#' + r.rank, 'الترتيب العام'], ...(mr ? [['🎓', '#' + mr.rank, `ترتيب ${CFG.MEMBER_LABEL}`]] : []), ['📅', `${r.done}/${info.total}`, 'أيام منجزة'], ['🔥', r.streak, 'سلسلة حالية'], ['⚡', r.pct + '%', 'نسبة الإنجاز']];
      $('#pfStats').innerHTML = stats.map(s => `<div class="card stat tilt"><div class="ic">${s[0]}</div><div><b>${esc(String(s[1]))}</b><span>${esc(s[2])}</span></div></div>`).join('');
      let grid = '';
      for (let d = 1; d <= info.total; d++) {
        const url = r.days.get(d), ok = r.days.has(d);
        const inner = ok && url && isHttps(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener">${d}</a>` : d;
        grid += `<div class="day ${ok ? 'ok' : (d < info.currentDay ? 'miss' : '')} ${d === info.currentDay ? 'cur' : ''}">${inner}</div>`;
      }
      $('#pfDays').innerHTML = grid;
      $('#pfBdg').innerHTML = badgesFor(r, info.total).map(b => `<span>${b.i} ${b.t}</span>`).join('');
      $('#pfCard').onclick = () => {
        const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="sheet wide"><div class="sheet-h"><h3 style="color:var(--navy);font-weight:900">🪪 بطاقة المشاركة</h3><button class="x" data-close aria-label="إغلاق">✕</button></div><div id="cardMount"></div></div>`;
        m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); }; document.body.appendChild(m);
        ShareCard.mount($('#cardMount'), cardData(p, { photo: p.photo_url, cors: true, total: info.total }), cardCaption(p), 'challenge-' + p.instagram);
      };
      $('#pfShare').onclick = () => {
        const text = `${p.full_name} أنجز ${r.done} يومًا من ${info.total} في تحدي ${CFG.PROGRAM_NAME} 🔥`, url = profileUrl(p);
        if (navigator.share) navigator.share({ text, url }).catch(() => { });
        else copyText(`${text}\n${url}`).then(ok => toast(ok ? 'تم نسخ الرابط ✅' : 'تعذّر النسخ', 'ok'));
      };
      $('#state').classList.add('hide'); $('#prof').classList.remove('hide'); enableTilt();
    } catch (e) { console.error(e); fail('تعذّر تحميل الصفحة، حاول لاحقًا.'); }
  })();
})();
