/* ===== صفحة التسجيل ===== */
(function () {
  let blob = null;
  const showErr = (m, offerOpen) => {
    const e = $('#err'); e.textContent = m; e.classList.remove('hide');
    $('#errActions').classList.toggle('hide', !offerOpen);
    e.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const clearErr = () => { $('#err').classList.add('hide'); $('#errActions').classList.add('hide'); };

  /* القوائم والإرشادات */
  $('#country').innerHTML = countryOptionsHTML(guessCountry());
  $('#codeHint').textContent = CFG.MEMBER_CODE_HINT || '';
  $$('input[name=kind]').forEach(r => r.addEventListener('change', syncKind));
  function syncKind() {
    const member = $('input[name=kind]:checked').value === 'member';
    $('#codeField').classList.toggle('hide', !member);
    if (member) setTimeout(() => $('#memberCode').focus(), 50);
  }
  $('#goOpen').onclick = () => { $('input[name=kind][value=open]').checked = true; syncKind(); clearErr(); toast('تم التحويل إلى مشاركة مفتوحة. اضغط إرسال'); };
  syncKind();

  /* حالة التسجيل (مفتوح/مغلق) */
  (async () => {
    if (!sb) { $('#demo').classList.remove('hide'); return; }
    const { data } = await sb.from('settings').select('*').eq('id', 1).single();
    if (data && !data.registration_open) { $('#closed').classList.remove('hide'); $('#go').disabled = true; }
    if (data && data.registration_open) {   // نخبر الزائر مسبقًا بنمط الانضمام
      const n = $('#joinNote'); if (n) { n.textContent = data.join_mode === 'auto' ? '⚡ الانضمام مباشر: تبدأ التحدي فور التسجيل.' : '📝 تُراجَع الطلبات من الإدارة: ستتمكن من المشاركة بعد قبولك، وسنخبرك بالحالة بعد التسجيل.'; n.classList.remove('hide'); }
    }
  })();

  /* ضغط الصورة إلى مربع 480px JPEG */
  function compress(file) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const S = 480, c = document.createElement('canvas'); c.width = c.height = S;
        const k = Math.max(S / img.width, S / img.height), w = img.width * k, h = img.height * k;
        c.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? res(b) : rej(new Error('compress')), 'image/jpeg', .85);
      };
      img.onerror = () => rej(new Error('image'));
      img.src = url;
    });
  }

  $('#photo').onchange = async e => {
    const f = e.target.files[0]; blob = null; if (!f) return;
    if (!f.type.startsWith('image/')) { showErr('اختر ملف صورة صالحًا'); return; }
    try {
      blob = await compress(f);
      $('#prev').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
      clearErr();
    } catch { showErr('تعذّرت قراءة الصورة، جرّب صورة أخرى'); }
  };

  $('#form').onsubmit = async e => {
    e.preventDefault(); clearErr();
    const f = new FormData(e.target);
    if (String(f.get('website') || '').trim()) { showDone({ is_member: false }, true); return; }   // روبوت: نجاح وهمي
    if (!sb) return showErr('لم يتم ربط قاعدة البيانات بعد');

    const kind = f.get('kind');
    const name = String(f.get('full_name')).trim(), spec = String(f.get('specialty')).trim(), ig = cleanHandle(f.get('instagram'));
    const country = String(f.get('country') || ''), city = String(f.get('city') || '').trim();
    const code = kind === 'member' ? String(f.get('member_code') || '').trim() : '';

    if (kind === 'member' && !code) return showErr('اكتب رقم العضوية، أو اختر «مشاركة مفتوحة».', true);
    if (name.length < 2) return showErr('اكتب اسمك الكامل');
    if (!/^[A-Za-z0-9._]{1,40}$/.test(ig)) return showErr('اسم حساب إنستغرام غير صحيح (أحرف إنجليزية وأرقام ونقطة وشرطة سفلية فقط)');
    if (!/^[A-Z]{2}$/.test(country)) return showErr('اختر دولتك');
    if (spec.length < 2) return showErr('اكتب تخصصك الوظيفي');
    if (!blob) return showErr('أرفق صورتك الشخصية');
    if (!$('#agree').checked) return showErr('يلزم الموافقة على التعهد');

    const btn = $('#go'); btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    try {
      /* نسجّل أولًا (فيتحقق الخادم من الرقم)، ثم نرفع الصورة. عنوان الصورة معروف مسبقًا */
      const path = `${crypto.randomUUID()}.jpg`;
      const photo_url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      const { data, error } = await sb.rpc('register_participant', {
        p_full_name: name, p_instagram: ig, p_specialty: spec, p_country: country,
        p_city: city || null, p_photo_url: photo_url, p_member_code: code || null
      });
      if (error) throw error;
      if (!data || !data.ok) {
        const codeErr = data && (data.error === 'invalid_code' || data.error === 'code_used');
        showErr(regError(data && data.error), !!codeErr);
        return;
      }
      let photoOk = true;
      try {
        const up = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) photoOk = false;
      } catch { photoOk = false; }
      showDone(data, false, photoOk, { name, spec, country, city, ig, photo: URL.createObjectURL(blob) });
    } catch (err) {
      console.error(err);
      showErr('تعذّر إرسال الطلب، تحقق من اتصالك وحاول مرة أخرى' + (err && (err.message || err.code) ? ' — تفاصيل فنية: ' + [err.code, err.message, err.details, err.hint].filter(Boolean).join(' | ') : ''));
    } finally {
      btn.disabled = false; btn.textContent = 'إرسال طلب التسجيل';
    }
  };

  function showDone(res, fake, photoOk = true, me = null) {
    $('#form').classList.add('hide'); $('#ok').classList.remove('hide');
    const direct = res.status === 'approved';
    $('#okTitle').textContent = direct ? 'أهلًا بك في التحدي! 🎉' : (res.is_member ? 'أهلًا بك في البرنامج! 🎓' : 'تم استلام طلبك!');
    $('#okText').textContent = direct
      ? 'تم قبولك مباشرة وأصبحت جزءًا من التحدي. ابدأ الآن بإرسال ريلز اليوم من الصفحة الرئيسية، وسيظهر اسمك في الترتيب.'
      : (res.is_member
        ? `تم التحقق من رقم عضويتك. طلبك الآن قيد المراجعة من الإدارة، وبعد قبولك تستطيع المشاركة والتفاعل في «${CFG.MEMBER_LABEL}» والترتيب العام.`
        : 'طلبك الآن قيد المراجعة من الإدارة. بعد قبولك تستطيع المشاركة والتفاعل في التحدي، وعند إتمامه تستلم شهادة إنجاز رقمية.');
    const st = $('#okStatus');
    st.className = 'note ' + (direct ? 'ok' : 'warn');
    st.innerHTML = direct ? '✅ <b>الحالة: مقبول</b>' : '⏳ <b>الحالة: بانتظار مراجعة الإدارة.</b> يمكنك التحقق من حالة طلبك في أي وقت من صفحة التسجيل بحساب إنستغرام الذي سجّلت به.';
    $('#cardBox').classList.toggle('hide', !me); $('#profBox').classList.toggle('hide', !me);
    if (me) { const link = profileUrl({ instagram: me.ig }); $('#profLink').textContent = link; $('#profCopy').onclick = async () => toast(await copyText(link) ? 'تم نسخ الرابط ✅' : 'تعذّر النسخ', 'ok'); }
    if (me && typeof ShareCard !== 'undefined') {
      const p = { full_name: me.name, specialty: me.spec, is_member: !!res.is_member, country_code: me.country, city: me.city };
      ShareCard.mount($('#cardMount'), cardData(p, { photo: me.photo, total: 30 }), cardCaption(p), 'challenge-' + me.ig);
    }
    if (!photoOk) { const n = $('#okPhoto'); n.textContent = 'تم تسجيلك لكن تعذّر رفع الصورة. أرسلها لإدارة المنصة وستُضاف لك.'; n.classList.remove('hide'); }
    if (CFG.GROUP_LINK && isHttps(CFG.GROUP_LINK)) { const g = $('#groupBtn'); g.href = CFG.GROUP_LINK; g.classList.remove('hide'); }
    $$('[data-share]').forEach(b => b.onclick = shareSite);
    if (!fake) confetti();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* تحقق المشارك من حالة طلبه */
  $('#stForm').onsubmit = async e => {
    e.preventDefault(); if (!sb) return;
    const out = $('#stOut'); out.className = 'note'; out.textContent = 'جارٍ التحقق…';
    const { data, error } = await sb.rpc('participant_status', { p_instagram: cleanHandle($('#stIg').value) });
    if (error) { out.className = 'note err'; out.textContent = 'تعذّر التحقق الآن، حاول لاحقًا.'; return; }
    const m = { approved: ['ok', '✅ طلبك مقبول، أنت الآن جزء من التحدي. ابدأ بإرسال ريلز اليوم!'], pending: ['warn', '⏳ طلبك ما زال قيد المراجعة من الإدارة. سنعتمده قريبًا بإذن الله.'],
      rejected: ['err', 'لم يُقبل هذا الطلب. تواصل مع إدارة المنصة للاستفسار.'], none: ['warn', 'لا يوجد طلب بهذا الحساب. تأكد من كتابة اسم الحساب كما سجّلته.'] }[data] || ['warn', 'تعذّر تحديد الحالة'];
    out.className = 'note ' + m[0]; out.textContent = m[1];
  };
})();
