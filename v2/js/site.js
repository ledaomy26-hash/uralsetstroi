/* ==========================================================================
   ООО «УРАЛСЕТЬСТРОЙ» — поведение сайта
   Ничего лишнего: меню, разрез объекта, сбор заявки в письмо или в MAX.
   ========================================================================== */
(function () {
  'use strict';

  var PHONE = '79068125444';        /* для подсказки: по этому номеру находят в MAX */
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
      document.body.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Листание по экранам -----------------------------------------------
     Владелец: «первая страница умещается сразу; крутнул колёсиком —
     спустился на вторую, и видно, как выставляются цифры; ещё раз —
     на третью».

     Штатный scroll-snap это не даёт: при mandatory щелчок колеса в 120 px
     не перекрывает высоту экрана, и браузер возвращает страницу на место
     (измерено: scrollY 33 при следующем экране на 911). Поэтому переход
     делает скрипт.

     Границы, за которые он не выходит:
       · только мышь на широком экране — на телефоне и тачпаде с инерцией
         перехват мешает, там прокрутка остаётся обычной;
       · только в зоне первых экранов, ниже — руки прочь;
       · при системном «уменьшить движение» не работает вовсе;
       · пока идёт переход, следующие щелчки не копятся. */
  var ekrany = Array.prototype.slice.call(document.querySelectorAll('.ekran, #raboty'));
  var topbar = document.querySelector('.topbar');

  if (ekrany.length > 1) {
    // высота верхней строки реквизитов: первый экран считается вместе с ней,
    // иначе страница на неё же выше окна — «умещается сразу» не работает
    var meritTopbar = function () {
      var h = topbar ? Math.round(topbar.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--topbar-h', h + 'px');
    };
    meritTopbar();
    window.addEventListener('resize', meritTopbar);

    var mysh = window.matchMedia &&
               window.matchMedia('(min-width:900px) and (pointer:fine)').matches;

    if (mysh && !calmMotion) {
      var zanyato = false;

      var blizhnij = function () {
        var y = window.scrollY;
        var nomer = 0;
        var raznica = Infinity;
        for (var i = 0; i < ekrany.length; i++) {
          var d = Math.abs(ekrany[i].offsetTop - y);
          if (d < raznica) { raznica = d; nomer = i; }
        }
        return nomer;
      };

      window.addEventListener('wheel', function (e) {
        if (e.ctrlKey) return;                     // масштабирование не трогаем
        var granica = ekrany[ekrany.length - 1].offsetTop;
        if (window.scrollY > granica + 8) return;  // ниже зоны — обычная прокрутка

        var vniz = e.deltaY > 0;
        var tekushchij = blizhnij();
        var sledujushchij = tekushchij + (vniz ? 1 : -1);

        // с последнего экрана вниз и с первого вверх — отдаём браузеру
        if (sledujushchij < 0 || sledujushchij >= ekrany.length) return;

        e.preventDefault();
        if (zanyato) return;
        zanyato = true;
        window.scrollTo({ top: ekrany[sledujushchij].offsetTop, behavior: 'smooth' });
        setTimeout(function () { zanyato = false; }, 720);
      }, { passive: false });
    }
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
    var runCount = function (el, zaderzhka) {
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
      var dur = 1100;
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
      // цифры трогаются не разом, а одна за другой — так видно, что они
      // именно набегают; экран с ведомостью на это и рассчитан
      setTimeout(function () { requestAnimationFrame(step); }, zaderzhka || 0);
    };

    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var sosedi = entry.target.closest('.ledger');
          var nomer = 0;
          if (sosedi) {
            var vse = sosedi.querySelectorAll('.ledger__val');
            for (var i = 0; i < vse.length; i++) {
              if (vse[i] === entry.target) { nomer = i; break; }
            }
          }
          runCount(entry.target, nomer * 140);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* --- Разрез объекта: выбор раздела -------------------------------------
     Мышь ловит отдельный слой .hits поверх всей графики, а подсвечивается
     соответствующая группа .zone — они связаны через data-zone. */
  var zones = document.querySelectorAll('.cutaway .zone');
  var hits = document.querySelectorAll('.cutaway .hit');
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
    var current = null;   // какая зона показана сейчас
    var leaveTimer = null;

    var show = function (zone) {
      if (current === zone) return;      // тот же раздел — DOM не трогаем
      current = zone;
      outCode.textContent = zone.dataset.code;
      outTitle.textContent = zone.dataset.title;
      outText.textContent = zone.dataset.text;
      zones.forEach(function (z) { z.classList.toggle('is-active', z === zone); });
      if (hint) hint.textContent = 'раздел выбран';
    };

    var reset = function () {
      if (pinned) return;          // закреплённый раздел не гасим
      if (current === null) return;
      current = null;
      outCode.textContent = base.code;
      outTitle.textContent = base.title;
      outText.textContent = base.text;
      zones.forEach(function (z) { z.classList.remove('is-active'); });
      if (hint) hint.textContent = 'наведите на раздел';
    };

    // ключ раздела → группа с графикой
    var byKey = {};
    zones.forEach(function (z) { byKey[z.dataset.zone] = z; });

    var figure = document.querySelector('.cutaway__figure');
    var readout = document.getElementById('cutRead');
    var cap = document.querySelector('.cutaway__cap');

    /* Тексты разделов разной длины, и блок подсказки от них менял высоту.
       Колонка выравнивается по центру, поэтому схема ездила вверх-вниз.
       Считаем самый высокий вариант и закрепляем высоту — рисунок стоит
       на месте, а подсказка меняется внутри готового места. */
    var lockHeights = function () {
      var keep = {
        code: outCode.textContent,
        title: outTitle.textContent,
        text: outText.textContent,
        hint: hint ? hint.textContent : null
      };

      if (readout) {
        readout.style.minHeight = '';
        var maxRead = readout.offsetHeight;
        zones.forEach(function (z) {
          outCode.textContent = z.dataset.code;
          outTitle.textContent = z.dataset.title;
          outText.textContent = z.dataset.text;
          if (readout.offsetHeight > maxRead) maxRead = readout.offsetHeight;
        });
        outCode.textContent = keep.code;
        outTitle.textContent = keep.title;
        outText.textContent = keep.text;
        readout.style.minHeight = maxRead + 'px';
      }

      // подпись над схемой тоже меняется — «наведите на раздел» / «раздел выбран»
      if (cap && hint) {
        cap.style.minHeight = '';
        var maxCap = cap.offsetHeight;
        ['наведите на раздел', 'раздел выбран'].forEach(function (t) {
          hint.textContent = t;
          if (cap.offsetHeight > maxCap) maxCap = cap.offsetHeight;
        });
        hint.textContent = keep.hint;
        cap.style.minHeight = maxCap + 'px';
      }
    };

    lockHeights();
    // после подгрузки шрифтов размеры меняются — пересчитываем
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockHeights);
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(lockHeights, 200);
    });

    /* Раздел под курсором ищем сами, по координатам. Своё наведение браузера
       здесь использовать нельзя: внутри SVG с работающими анимациями он
       периодически отдаёт целью фон вместо области, и подсказка мигает
       даже на неподвижном курсоре. Геометрию берём у тех же областей. */
    var zoneAt = function (x, y) {
      for (var i = 0; i < hits.length; i++) {
        var r = hits[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          return byKey[hits[i].dataset.zone] || null;
        }
      }
      return null;
    };

    if (figure) {
      figure.addEventListener('mousemove', function (e) {
        if (pinned) return;
        var zone = zoneAt(e.clientX, e.clientY);
        figure.classList.toggle('is-hot', !!zone);
        if (zone) {
          clearTimeout(leaveTimer);
          show(zone);
        } else {
          // между разделами есть промежутки: не гасим сразу, иначе при
          // движении вдоль трубы подсказка успевает мигнуть
          clearTimeout(leaveTimer);
          leaveTimer = setTimeout(reset, 140);
        }
      });

      figure.addEventListener('mouseleave', function () {
        figure.classList.remove('is-hot');
        clearTimeout(leaveTimer);
        if (!pinned) reset();
      });

      figure.addEventListener('click', function (e) {
        var zone = zoneAt(e.clientX, e.clientY);
        if (!zone) return;
        clearTimeout(leaveTimer);
        if (pinned === zone) {
          pinned = null;           // второй щелчок — открепить, но оставить показ
          show(zone);
        } else {
          pinned = zone;
          show(zone);
        }
      });
    }

    /* Клавиатурной навигации по областям нет намеренно: фокус на невидимом
       прямоугольнике заставлял браузер прокручивать страницу к нему.
       Те же шесть разделов идут ниже обычными ссылками — там всё доступно. */
  }

  /* --- Заявка: собираем текст и отдаём в почту или в MAX ----------------- */
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
    // Согласие ставит человек сам: по 152-ФЗ оно должно быть действием,
    // а не строчкой рядом с кнопкой. Без галочки заявка не собирается.
    var agree = document.getElementById('fAgree');
    if (agree && !agree.checked) {
      say('Отметьте согласие на обработку персональных данных — без него мы не вправе принять заявку.');
      agree.focus();
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

      /* MAX вместо WhatsApp — по просьбе заказчика 02.09.2026.
         Прямой ссылки «написать по номеру», как wa.me, у MAX нет: мессенджер
         её не предусматривает. Официальный диплинк один — :share, он открывает
         экран «Отправить в MAX» с уже подставленным текстом, а чат человек
         выбирает сам. Поэтому в подсказке сразу сказано, кого выбирать. */
      if (mode === 'max') {
        window.open('https://max.ru/:share?text=' + encodeURIComponent(body), '_blank', 'noopener');
        say('Открываем MAX. Выберите чат «Уралсетьстрой» или найдите нас по номеру +7 906 812-54-44.');
      }
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
})();
