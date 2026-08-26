/* ==========================================================================
   ООО «УРАЛСЕТЬСТРОЙ» — поведение сайта
   Ничего лишнего: меню, разрез объекта, сбор заявки в письмо или WhatsApp.
   ========================================================================== */
(function () {
  'use strict';

  var PHONE_WA = '79068125444';
  var MAIL = 'uralsetstroi96@mail.ru';

  /* --- Меню на узком экране --------------------------------------------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* --- Тень у прилипшей шапки ------------------------------------------- */
  var masthead = document.getElementById('masthead');
  if (masthead) {
    var onScroll = function () {
      masthead.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Появление блоков при прокрутке ------------------------------------ */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (!('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  var calmMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Чертёж прорисовывается при загрузке ------------------------------- */
  var strokes = document.querySelectorAll('.cutaway .draw');
  if (strokes.length && !calmMotion) {
    strokes.forEach(function (el, i) {
      var len = 0;
      try { len = el.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      el.style.setProperty('--len', len);
      el.style.strokeDasharray = len;
      el.style.animationDelay = (0.1 + i * 0.13).toFixed(2) + 's';
    });
  }

  /* --- Цифры набегают, когда доходишь до них ----------------------------- */
  var counters = document.querySelectorAll('.ledger__val');

  // Разбираем «314,3», «3 500», «7» — формат запоминаем и собираем обратно
  var parseNumber = function (raw) {
    var text = raw.replace(/ /g, ' ').trim();
    var grouped = /\d\s\d/.test(text);
    var decimals = 0;
    var comma = text.indexOf(',');
    if (comma > -1) {
      var tail = text.slice(comma + 1).replace(/\D/g, '');
      decimals = tail.length;
    }
    var value = parseFloat(text.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(value)) return null;
    return { value: value, decimals: decimals, grouped: grouped };
  };

  var format = function (n, spec) {
    var s = n.toFixed(spec.decimals).replace('.', ',');
    if (spec.grouped) {
      var parts = s.split(',');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      s = parts.join(',');
    }
    return s;
  };

  if (counters.length && !calmMotion && 'IntersectionObserver' in window) {
    var runCount = function (el) {
      // единица измерения живёт в отдельном span, её не трогаем
      var unit = el.querySelector('span');
      var host = null;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) {
          host = el.childNodes[i];
          break;
        }
      }
      if (!host) return;

      var spec = parseNumber(host.textContent);
      if (!spec) return;

      var from = 0;
      var dur = 900;
      var start = null;

      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        host.textContent = format(from + (spec.value - from) * eased, spec);
        if (p < 1) requestAnimationFrame(step);
        else host.textContent = format(spec.value, spec);
      };

      host.textContent = format(0, spec);
      if (unit) unit.style.opacity = '1';
      requestAnimationFrame(step);
    };

    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* --- Разрез объекта: выбор раздела ------------------------------------- */
  var zones = document.querySelectorAll('.cutaway .zone');
  var outCode = document.getElementById('cutCode');
  var outTitle = document.getElementById('cutTitleOut');
  var outText = document.getElementById('cutText');
  var hint = document.getElementById('cutHint');

  if (zones.length && outCode && outTitle && outText) {
    var base = {
      code: outCode.textContent,
      title: outTitle.textContent,
      text: outText.textContent
    };
    var pinned = null;

    var show = function (zone) {
      outCode.textContent = zone.dataset.code;
      outTitle.textContent = zone.dataset.title;
      outText.textContent = zone.dataset.text;
      zones.forEach(function (z) { z.classList.toggle('is-active', z === zone); });
      if (hint) hint.textContent = 'раздел выбран';
    };

    var reset = function () {
      outCode.textContent = base.code;
      outTitle.textContent = base.title;
      outText.textContent = base.text;
      zones.forEach(function (z) { z.classList.remove('is-active'); });
      if (hint) hint.textContent = 'наведите на раздел';
    };

    zones.forEach(function (zone) {
      zone.addEventListener('mouseenter', function () { if (!pinned) show(zone); });
      zone.addEventListener('mouseleave', function () { if (!pinned) reset(); });
      zone.addEventListener('focus', function () { show(zone); });

      var pin = function (e) {
        e.preventDefault();
        if (pinned === zone) { pinned = null; reset(); }
        else { pinned = zone; show(zone); }
      };

      zone.addEventListener('click', pin);
      zone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') pin(e);
      });
    });
  }

  /* --- Заявка: собираем текст и отдаём в почту или WhatsApp -------------- */
  var form = document.getElementById('requestForm');
  if (!form) return;

  var status = document.getElementById('formStatus');

  var say = function (msg) { if (status) status.textContent = msg; };

  var val = function (id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  var collect = function () {
    var picked = [];
    form.querySelectorAll('input[name="section"]:checked').forEach(function (box) {
      picked.push(box.value);
    });

    var lines = ['Заявка на расчёт с сайта'];
    lines.push('');
    lines.push('Имя: ' + (val('fName') || '—'));
    if (val('fOrg')) lines.push('Организация: ' + val('fOrg'));
    lines.push('Телефон: ' + (val('fPhone') || '—'));
    if (val('fMail')) lines.push('Почта: ' + val('fMail'));
    if (val('fObject')) lines.push('Объект: ' + val('fObject'));
    if (picked.length) {
      lines.push('');
      lines.push('Разделы:');
      picked.forEach(function (p) { lines.push('· ' + p); });
    }
    if (val('fText')) {
      lines.push('');
      lines.push('Задача:');
      lines.push(val('fText'));
    }
    return lines.join('\n');
  };

  var check = function () {
    var name = document.getElementById('fName');
    var phone = document.getElementById('fPhone');

    if (!val('fName')) {
      say('Укажите, как к вам обращаться.');
      if (name) name.focus();
      return false;
    }
    if (val('fPhone').replace(/\D/g, '').length < 10) {
      say('Нужен телефон — по нему проще всего уточнить объёмы.');
      if (phone) phone.focus();
      return false;
    }
    return true;
  };

  form.querySelectorAll('[data-send]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.dataset.send;

      if (mode === 'copy') {
        var text = collect();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () { say('Текст заявки скопирован — вставьте в письмо или мессенджер.'); },
            function () { say('Скопировать не вышло. Выделите текст полей вручную.'); }
          );
        } else {
          say('Браузер не даёт скопировать. Выделите текст полей вручную.');
        }
        return;
      }

      if (!check()) return;
      var body = collect();

      if (mode === 'mail') {
        var subject = 'Заявка на расчёт';
        if (val('fObject')) subject += ' — ' + val('fObject');
        window.location.href =
          'mailto:' + MAIL +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        say('Открываем почту. Проверьте письмо и нажмите «Отправить».');
      }

      if (mode === 'whatsapp') {
        window.open('https://wa.me/' + PHONE_WA + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
        say('Открываем WhatsApp. Проверьте сообщение и нажмите «Отправить».');
      }
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
})();
