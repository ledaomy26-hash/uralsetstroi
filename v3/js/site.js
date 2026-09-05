/* ==========================================================================
   ООО «УРАЛСЕТЬСТРОЙ» — поведение сайта
   Ничего лишнего: меню, разрез объекта, сбор заявки в письмо.
   ========================================================================== */
(function () {
  'use strict';

  var PHONE = '79068125444';        /* для подсказки в тексте заявки */
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

  var calmMotion = window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Листание этапами: по всему сайту ----------------------------------
     Сначала (01.09.2026) листались только первые экраны главной: владелец
     просил «крутнул колёсиком — спустился на вторую, и видно, как
     выставляются цифры». 02.09.2026 он попросил то же самое на всех
     страницах: «а мы так по всему сайту можем сделать? есть места, которые
     не умещаются на одну страницу, но ничего страшного, главное, чтобы оно
     листалось этапами».

     Штатный scroll-snap так не умеет: при mandatory щелчок колеса в 120 px
     не перекрывает высоту экрана, и браузер возвращает страницу на место
     (измерено: scrollY 33 при следующем экране на 911). Поэтому остановки
     считает скрипт.

     Как считаются остановки:
       · начало каждого раздела страницы плюс подвал;
       · раздел выше окна режется НЕ ровным шагом, а по границам блоков:
         следующая остановка встаёт на верх первой карточки (строки,
         объекта), которая целиком не поместилась. Владелец 02.09.2026:
         «подними выше — тогда и текст влезет, и три окошка влезут,
         а другое на вторую перенесётся… чтобы выглядело аккуратно».
         Ровный шаг резал ряд карточек пополам, и это выглядело поломкой;
       · у полноэкранных разделов (.ekran) высота шапки не вычитается:
         они рассчитаны ровно на экран. У обычных — вычитается, иначе
         прилипшая шапка накрыла бы заголовок.

     Границы, за которые листание не выходит:
       · только мышь на широком экране — на телефоне и тачпаде с инерцией
         перехват мешает, там прокрутка остаётся обычной;
       · мелкие щелчки тачпада (меньше 12 px) не трогаем вовсе;
       · внутри прокручиваемого поля (текст заявки, таблица) — обычная
         прокрутка;
       · при системном «уменьшить движение» не работает;
       · пока идёт переход, следующие щелчки не копятся. */
  var topbar = document.querySelector('.topbar');

  var meritTopbar = function () {
    var h = topbar ? Math.round(topbar.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--topbar-h', h + 'px');
    // высоту шапки знает стиль липкой колонки заявки
    if (masthead) {
      document.documentElement.style.setProperty(
        '--shapka-h', Math.round(masthead.getBoundingClientRect().height) + 'px');
    }
  };
  meritTopbar();
  window.addEventListener('resize', meritTopbar);

  /* Порог 1240, а не 900: ниже этой ширины форма заявки идёт в один
     столбец и в экран не помещается никак — раздел занимал два экрана,
     второй выходил почти пустым (проверено на окне 1024×700). На узком
     окне листание по экранам выключено, там обычная прокрутка. */
  var myshNaShirokom = window.matchMedia &&
                       window.matchMedia('(min-width:1240px) and (pointer:fine)').matches;

  if (myshNaShirokom && !calmMotion) {
    var ostanovki = [];

    /* ------------------------------------------------------------------
       Страница раскладывается на НАСТОЯЩИЕ экраны.

       Как было и почему это пришлось переделать. Раньше скрипт только
       выбирал остановки, а вёрстка оставалась сплошной лентой. Остановка
       ставилась на начало блока, поэтому верхняя кромка вставала ровно,
       а нижняя падала куда придётся — и снизу вылезала полоска чужого
       раздела. Владелец 02.09.2026: «одна страница налипает на другую,
       листаешь — и край одной страницы показывается на другой». Замеры
       это подтвердили: под цифрами полоса светлого раздела в 45 px,
       под шестью разделами — 330 px тёмного, под шагами 1–3 торчали
       заголовки шагов 4–6 на 56 px.

       Никакой выбор остановок этого не лечит: текст физически стоит там,
       где стоит. Поэтому теперь скрипт сам раскладывает страницу
       по экранам: каждому разделу отмеряется целое число экранов, ряды
       внутри раздела расставляются так, чтобы ни один не пересекал
       границу экрана, а остаток высоты уходит в воздух — сверху под
       шапкой и снизу до края. Границы экранов совпадают с краями окна,
       поэтому налипать нечему.

       Правится только вертикальный воздух: margin-top у первого ряда
       экрана и высота раздела. Ни один размер шрифта, ни одна колонка
       не трогаются. На телефоне, тачпаде и при «уменьшить движение»
       раскладка не применяется вовсе — там обычная лента. */

    var pravki = [];                       // что скрипт менял, чтобы вернуть назад

    var pripisat = function (el, svoystvo, znachenie) {
      pravki.push({ el: el, svoystvo: svoystvo, bylo: el.style[svoystvo] });
      el.style[svoystvo] = znachenie;
    };

    var snyat = function () {
      for (var i = pravki.length - 1; i >= 0; i--) {
        pravki[i].el.style[pravki[i].svoystvo] = pravki[i].bylo;
      }
      pravki = [];
    };

    var verhDok = function (el) {
      return Math.round(el.getBoundingClientRect().top + window.scrollY);
    };
    var nizDok = function (el) {
      return Math.round(el.getBoundingClientRect().bottom + window.scrollY);
    };
    var otstupSverhu = function (el) {
      return parseFloat(window.getComputedStyle(el).marginTop) || 0;
    };

    /* Ленты карточек, которые МОЖНО разложить по рядам, когда раздел целиком
       в экран не помещается.

       Раньше они делились всегда, даже если влезали: владелец 02.09.2026
       просил «заголовок и три вкладочки на одной странице, оставшиеся три
       на другой». 04.09.2026 заказчик прислал два видео с телевизора
       с обратной просьбой: «чтобы все шесть на одной странице были»,
       «слишком долго листать главную страницу — объединить». Владелец решил
       делать по последнему слову заказчика.

       Поэтому деление стало условным: сначала раздел собирается как есть,
       и если он влезает в экран целиком — лента остаётся одним куском.
       Не влезает — делится по рядам, как и раньше. Так и заказчик получил
       шесть карточек на одном листе, и старая беда не вернулась: заголовок
       не остаётся один на пустом экране, а ряд не режется границей. */
    var DELIMYE = '.works, .etapy, .reasons, .objects, .cards, .ledger, ' +
                  '.doclist, .fotoset, .foot__grid';

    /* А это, наоборот, не дробится никогда. Форма — единое целое: когда
       скрипт разобрал её на поля, ряды перепутались с левой колонкой,
       заголовок «Заявка на расчёт» ушёл под шапку, а следом остался
       пустой чёрный экран (окно 1536×776, снимок 02.09.2026). То же
       и с разрезом объекта, таблицей и полосой призыва. */
    var NEDELIMYE = 'form, .request, .cutaway, .tablewrap, .cta-strip, ' +
                    '.detail, .pagehead .shell, .polosa__inner, .cepochka';

    /* Цели якорных ссылок этой страницы.

       05.09.2026 заказчик прислал два видео: жмёт в подвале «Электромонтаж»
       и попадает на «Индивидуальные тепловые пункты», «Тепловые пункты»
       уводят непонятно куда, «Вентиляция» останавливается серединой экрана.
       Его слова: «не совсем корректно переходят по вот этим вот ссылкам».

       Причина не в разметке — id стоят верно. Шесть разделов услуг лежат
       ОДНОЙ секцией, поэтому раскладка сажает их по два-три на экран, и
       браузерный прыжок по якорю оставляет нужный раздел то у нижней кромки,
       то за ней. Лечение из двух частей: раздел, на который есть якорь,
       всегда начинает свой экран (здесь), а сам переход ведём сами и уже
       после раскладки (ниже, `podvestiKYakoryu`). */
    var yakornye = [];
    Array.prototype.forEach.call(
      document.querySelectorAll('a[href*="#"]'), function (a) {
        var href = a.getAttribute('href') || '';
        var id = href.slice(href.indexOf('#') + 1);
        if (!id || id === 'main') return;
        var el = document.getElementById(id);
        if (el && yakornye.indexOf(el) < 0) yakornye.push(el);
      });

    var estYakor = function (el) {
      for (var i = 0; i < yakornye.length; i++) {
        if (el === yakornye[i] || el.contains(yakornye[i])) return true;
      }
      return false;
    };

    /* Ряды раздела: то, что человек читает как одну строку. Узел выше
       рабочей полосы раскрываем на детей — так от ленты карточек доходим
       до отдельной карточки, а заголовочный блок не дробим. Абсолютные
       слои (фотография полосы) рядом не считаются: они не в потоке. */
    var sobratRyady = function (koren, polezno, delitLenty) {
      var bloki = [];
      var obhod = function (el, glubina) {
        Array.prototype.forEach.call(el.children, function (d) {
          var st = window.getComputedStyle(d);
          if (st.position === 'absolute' || st.position === 'fixed') return;
          if (st.display === 'none') return;
          var r = d.getBoundingClientRect();
          if (r.height < 8) return;
          if (d.children.length && glubina < 4 && !d.matches(NEDELIMYE) &&
              (r.height > polezno * 0.9 || (delitLenty && d.matches(DELIMYE)))) {
            obhod(d, glubina + 1);
            return;
          }
          bloki.push({
            el: d,
            verh: Math.round(r.top + window.scrollY),
            niz: Math.round(r.bottom + window.scrollY)
          });
        });
      };
      obhod(koren, 0);
      bloki.sort(function (a, b) { return a.verh - b.verh; });

      var ryady = [];
      bloki.forEach(function (b) {
        var last = ryady[ryady.length - 1];
        if (last && Math.abs(b.verh - last.verh) < 6) {
          last.eli.push(b.el);
          last.niz = Math.max(last.niz, b.niz);
        } else {
          ryady.push({ eli: [b.el], verh: b.verh, niz: b.niz });
        }
      });
      ryady.forEach(function (r) {
        r.yakor = r.eli.some(estYakor);
      });
      return ryady;
    };

    /* Минимальный воздух под шапкой. Было 18; 04.09.2026 снижено до 14:
       на окне 1440×900 разделу «Шесть разделов» не хватало ровно этих
       пикселей, чтобы уложиться в один экран, и он снова разъезжался
       на два листа — то самое, на что заказчик прислал видео. */
    var VOZDUH = 14;

    var razlozhit = function () {
      snyat();

      var okno = window.innerHeight;
      var shapka = masthead ? Math.round(masthead.getBoundingClientRect().height) : 0;
      var polezno = okno - shapka;          // полоса под шапкой, где живёт содержимое
      ostanovki = [];
      if (polezno < 300) return;            // окно совсем низкое — не раскладываем

      var uzly = Array.prototype.slice.call(
        document.querySelectorAll('main > section, .foot'));
      var granica = 0;                      // верх текущего экрана в координатах страницы

      uzly.forEach(function (s, nomer) {
        var verh = verhDok(s);

        /* Раздел всегда начинается ровно с края экрана: тогда весь экран
           окрашен фоном одного раздела и стык не виден. */
        if (nomer > 0 && verh !== granica) {
          pripisat(s, 'marginTop', (otstupSverhu(s) + (granica - verh)) + 'px');
          verh = verhDok(s);
        }

        var konec = verh;                   // низ последнего ряда раздела

        if (s.classList.contains('ekran')) {
          /* Полноэкранный раздел рассчитан ровно на окно: над ним может
             стоять верхняя строка реквизитов, её высоту вычитаем. */
          pripisat(s, 'minHeight', (granica + okno - verh) + 'px');
          konec = nizDok(s);
        } else {
          /* Сначала пробуем раздел целым куском. Влез в экран — так и
             оставляем: это и есть «объединить», о чём просил заказчик
             04.09.2026. Не влез — пересобираем с делением лент по рядам. */
          var ryady = sobratRyady(s, polezno, false);
          var nuzhno = ryady.length
            ? ryady[ryady.length - 1].niz - ryady[0].verh
            : 0;
          if (nuzhno > polezno - VOZDUH * 2) {
            ryady = sobratRyady(s, polezno, true);
          }
          var i = 0;
          var ekran = 0;

          while (i < ryady.length) {
            /* Сколько рядов влезает в этот экран, считая от первого.
               Ряд, на который ведёт якорь, в чужой экран не подсаживаем:
               по ссылке из подвала человек должен увидеть раздел с самого
               верха, а не найти его прижатым к нижней кромке. */
            var k = i;
            var mesto = polezno - VOZDUH * 2;
            while (k + 1 < ryady.length && !ryady[k + 1].yakor &&
                   ryady[k + 1].niz - ryady[i].verh <= mesto) k++;

            var vysota = ryady[k].niz - ryady[i].verh;
            var svobodno = polezno - vysota;
            /* Остаток высоты делим: 38 % над содержимым, остальное под ним.
               Так ряд не прижат к шапке и не висит в пустоте. А если
               содержимого меньше половины полосы (короткий раздел вроде
               полосы призыва), ставим его ровно по центру — тогда пустота
               читается как замысел, а не как обрыв.

               Когда свободного места в обрез, воздух делим поровну и не
               берём больше, чем есть: иначе ряд вылезал за нижнюю кромку
               на десяток пикселей, раздел получал лишний экран, и за
               заявкой шла пустая чёрная страница (окно 1536×776). */
            var dolya = vysota < polezno * 0.5 ? 0.5 : 0.38;
            var vozduh;
            if (svobodno <= 4) vozduh = 2;                    // ряд выше полосы
            else if (svobodno < VOZDUH * 2) vozduh = Math.floor(svobodno / 2);
            else vozduh = Math.round(VOZDUH + (svobodno - VOZDUH) * dolya);

            var cel = granica + ekran * okno + shapka + vozduh;
            var delta = cel - ryady[i].verh;
            if (delta !== 0) {
              ryady[i].eli.forEach(function (el) {
                pripisat(el, 'marginTop', (otstupSverhu(el) + delta) + 'px');
              });
              /* Всё, что ниже, уехало на ту же величину — сверяемся
                 с настоящей раскладкой, а не с арифметикой. */
              var stalo = verhDok(ryady[i].eli[0]);
              var popravka = stalo - ryady[i].verh;
              for (var q = i; q < ryady.length; q++) {
                ryady[q].verh += popravka;
                ryady[q].niz += popravka;
              }
            }

            /* Ряд выше экрана (длинная таблица, форма) занимает столько
               экранов, сколько ему нужно, — иначе он уехал бы за край. */
            var zanyal = Math.max(1, Math.ceil(
              (ryady[k].niz - (granica + ekran * okno)) / okno));
            ekran += zanyal;
            konec = ryady[k].niz;
            i = k + 1;
          }
        }

        /* Низ раздела ставим ровно на границу экрана: свой нижний отступ
           убираем, нужную высоту добираем через min-height — фон при этом
           остаётся фоном раздела, а не просветом страницы. */
        var ekranov = Math.max(1, Math.ceil((konec - granica) / okno));
        var celNiz = granica + ekranov * okno;
        pripisat(s, 'paddingBottom', '0px');
        pripisat(s, 'minHeight', (celNiz - verh) + 'px');
        var fakt = nizDok(s);
        if (fakt !== celNiz) {                 // осталась чужая рамка или отступ
          pripisat(s, 'minHeight', (celNiz - verh - (fakt - celNiz)) + 'px');
        }

        granica = celNiz;
      });

      /* Остановки — просто края экранов. Последняя не может быть ниже,
         чем позволяет прокрутка. */
      var predel = Math.max(0, document.documentElement.scrollHeight - okno);
      for (var e = 0; e <= granica - okno + 1; e += okno) {
        ostanovki.push(Math.min(e, predel));
      }
      if (!ostanovki.length || ostanovki[ostanovki.length - 1] < predel - 2) {
        ostanovki.push(predel);
      }
    };

    /* --- Переход по якорю ------------------------------------------------
       Браузер прыгает на якорь в момент навигации — то есть ДО того, как
       скрипт разложит страницу по экранам, и до того, как догрузятся
       фотографии, от которых зависит высота карточек. Каждая следующая
       перекладка сдвигает содержимое под уже установленной прокруткой, и
       человек оказывается на соседнем разделе. Ровно это заказчик и снял
       на видео 04.09.2026.

       Поэтому цель считаем сами и по краю экрана: раздел, у которого есть
       якорь, начинает свой экран, значит нужная остановка — та, что стоит
       над ним. Тогда после перехода раздел виден целиком, с воздухом под
       шапкой, а не половиной у кромки. */
    /* Допуск берём В ПЛЮС, а не в минус. Целый раздел (`section#zayavka`)
       начинается ровно на границе экрана, и при вычитании допуска эта
       граница отбрасывалась — переход уходил на экран выше, к тёмному
       хвосту предыдущего раздела. У блока внутри раздела (`.detail#em`)
       верх стоит ниже границы на шапку и воздух, ему допуск безразличен. */
    var ostanovkaDlya = function (el) {
      var v = verhDok(el);
      for (var i = ostanovki.length - 1; i >= 0; i--) {
        if (ostanovki[i] <= v + 4) return ostanovki[i];
      }
      return 0;
    };

    /* Куда человек шёл по якорю. Держим сам элемент, а не адрес: пока он
       не тронул страницу сам, каждая перекладка обязана вернуть его на это
       место, сколько бы снимков ни догрузилось следом. */
    /* Прокрутка без плавности браузера. В стиле стоит
       `html{ scroll-behavior:smooth }` — он нужен там, где листания нет
       (телефон, тачпад): тогда якорь доезжает мягко сам. Но на наши
       собственные переходы он ложится вторым слоем: каждый кадр анимации
       запускает ещё одну плавную прокрутку, и вместо 0,4 с прыжок тянется
       полторы секунды и смазывается. Поэтому здесь плавность выключаем
       явно — свою кривую мы рисуем сами.

       Именно `instant`, а не `auto`: `auto` по спецификации значит «как
       сказано в стиле», то есть тот же самый smooth. Замер 05.09.2026:
       с `auto` переход к заявке с главной шёл 1,5 с и на 600-й миллисекунде
       был пройден лишь на 5 %. */
    var prokrutit = function (y) {
      try {
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      } catch (err) {
        window.scrollTo(0, y);
      }
    };

    var celYakorya = null;
    var chelovekKrutil = false;
    /* Номер идущего перехода. Объявлен здесь, а не рядом с `pereyti`:
       подведение к якорю случается уже на первой раскладке, то есть
       раньше. */
    var perehod = 0;

    var otpustit = function () {
      chelovekKrutil = true;
      celYakorya = null;
    };

    var podvestiKYakoryu = function (plavno) {
      if (!celYakorya || !ostanovki.length) return;
      var cel = ostanovkaDlya(celYakorya);
      if (plavno) {
        zanyato = true;
        pereyti(cel);
        return;
      }
      /* Мгновенное подведение обязано отменить идущий переход. Иначе
         снимок, догрузившийся посреди плавного хода, перекладывает
         страницу, мы ставим прокрутку на новое место — а следующий кадр
         анимации возвращает её на старое, посчитанное до перекладки.
         Именно так «Прислать проект» с главной оставалась на разделе
         «Почему мы» (замер 05.09.2026: 663 px вместо 0). */
      perehod++;
      zanyato = false;
      if (Math.abs(window.scrollY - cel) > 2) prokrutit(cel);
    };

    var vzyatIzAdresa = function () {
      var id = (location.hash || '').slice(1);
      celYakorya = id ? document.getElementById(id) : null;
    };
    vzyatIzAdresa();

    /* Пока страница устаканивается (шрифты, снимки), доводим прокрутку
       после каждой перекладки — если человек ещё не тронул её сам. */
    var razlozhitIPodvesti = function () {
      razlozhit();
      if (!chelovekKrutil) podvestiKYakoryu(false);
    };

    razlozhitIPodvesti();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(razlozhitIPodvesti);
    }
    window.addEventListener('load', razlozhitIPodvesti);
    window.addEventListener('hashchange', function () {
      chelovekKrutil = false;
      vzyatIzAdresa();
      podvestiKYakoryu(true);
    });

    /* Тронул страницу сам — больше не ведём. Колесо ловится ниже, здесь
       клавиши и палец: иначе доведение спорило бы с человеком. */
    window.addEventListener('keydown', function (e) {
      if (/^(Arrow|Page|Home|End| )/.test(e.key)) otpustit();
    });
    window.addEventListener('touchstart', otpustit, { passive: true });

    /* Фотографии разделов помечены `loading="lazy"`, и высота карточки
       меняется в тот момент, когда снимок наконец пришёл, — то есть уже
       после расчёта. В режиме экранов это недопустимо: раскладка обязана
       быть готова до первого щелчка колеса. Поэтому здесь ленивую загрузку
       отменяем (на телефоне она остаётся) и пересчитываем по каждому
       пришедшему снимку. Слежения за высотой документа нет намеренно:
       расчёт сам её меняет и вызвал бы себя по кругу. */
    var kartinki = Array.prototype.slice.call(document.querySelectorAll('main img'));
    var poZagruzke = null;
    kartinki.forEach(function (im) {
      if (im.loading === 'lazy') im.loading = 'eager';
      if (im.complete) return;
      im.addEventListener('load', function () {
        clearTimeout(poZagruzke);
        poZagruzke = setTimeout(razlozhitIPodvesti, 60);
      });
    });
    var schetchik = null;
    window.addEventListener('resize', function () {
      clearTimeout(schetchik);
      schetchik = setTimeout(razlozhit, 200);
    });

    // поле, внутри которого есть что прокручивать, забирает колесо себе
    var vnutriProkrutki = function (el) {
      while (el && el !== document.body && el.nodeType === 1) {
        var st = window.getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 4) return true;
        el = el.parentElement;
      }
      return false;
    };

    var zanyato = false;

    /* Переход между экранами ведём сами, а не браузерным `smooth`.
       У браузера своя кривая и своя длительность, и на длинном прыжке
       страница дёргается. Здесь одна и та же мягкая кривая на любой
       дистанции: сперва разгон, потом долгое торможение — движение
       читается как «страница уехала», а не «скачок». */
    var pereyti = function (cel) {
      var start = window.scrollY;
      var put = cel - start;
      /* Быстро, но плавно. Первая версия тянулась до 0,82 с — владелец:
         «лиснул колесиком и слишком долго жду». Теперь 0,3–0,42 с. */
      var dlit = Math.max(300, Math.min(420, 240 + Math.abs(put) * 0.14));
      var t0 = null;
      var moy = ++perehod;

      var shag = function (now) {
        if (moy !== perehod) return;               // переход отменён — уходим
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dlit);
        // ease-in-out: 0.5 - cos(pi*p)/2, но с уклоном в торможение
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        prokrutit(Math.round(start + put * e));
        if (p < 1) requestAnimationFrame(shag);
        else zanyato = false;
      };
      requestAnimationFrame(shag);
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;                       // масштабирование не трогаем
      if (Math.abs(e.deltaY) < 12) return;         // мелкая крошка тачпада
      otpustit();                                  // дальше страницу не дёргаем
      if (vnutriProkrutki(e.target)) return;
      if (ostanovki.length < 2) return;

      var y = window.scrollY;
      var vniz = e.deltaY > 0;
      var cel = null;

      if (vniz) {
        for (var i = 0; i < ostanovki.length; i++) {
          if (ostanovki[i] > y + 8) { cel = ostanovki[i]; break; }
        }
      } else {
        for (var j = ostanovki.length - 1; j >= 0; j--) {
          if (ostanovki[j] < y - 8) { cel = ostanovki[j]; break; }
        }
      }

      if (cel === null) return;                    // край страницы — отдаём браузеру

      e.preventDefault();
      if (zanyato) return;
      zanyato = true;
      pereyti(cel);
    }, { passive: false });

    /* Ссылка на свой же раздел ведётся тем же плавным переходом, что и
       колесо. Отдать её браузеру нельзя: он прыгает на верх элемента, а
       верх накрыт липкой шапкой — заголовок оказывается под ней. */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey ||
          e.shiftKey || e.altKey) return;
      var a = e.target;
      while (a && a !== document.body && a.tagName !== 'A') a = a.parentElement;
      if (!a || a.tagName !== 'A') return;
      if (a.target && a.target !== '_self') return;

      var href = a.getAttribute('href') || '';
      var reshetka = href.indexOf('#');
      if (reshetka < 0) return;
      var id = href.slice(reshetka + 1);
      if (!id) return;

      /* «uslugi.html#em» со страницы услуг — это своя же страница. */
      var chuzhaya = href.slice(0, reshetka);
      var svoya = location.pathname.split('/').pop() || 'index.html';
      if (chuzhaya && chuzhaya !== svoya) return;

      var el = document.getElementById(id);
      if (!el || !ostanovki.length) return;

      /* Клик по ссылке — это просьба попасть в место, а не «человек листает
         сам»: снимки догружаются и после клика, каждая догрузка
         перекладывает страницу, и без доведения человек снова оказался бы
         на соседнем разделе — ровно та беда, с которой всё началось. */
      e.preventDefault();
      chelovekKrutil = false;
      celYakorya = el;
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      else location.hash = id;
      if (zanyato) return;
      zanyato = true;
      pereyti(ostanovkaDlya(el));
    });
  } else {
    /* --- Якорь там, где листания по экранам нет ---------------------------
       Телефон, тачпад, «уменьшить движение». Раскладки здесь нет, отступ
       под шапку даёт `scroll-margin-top` из стиля — но остаётся вторая
       половина беды: снимок догружается уже после прыжка и толкает
       содержимое вниз. Замер 05.09.2026 на окне 1024×700: заявка уезжала
       на 222 px. Поэтому просто возвращаем элемент на место, пока человек
       не тронул страницу сам. */
    var celTihaya = null;
    var tronul = false;

    var vzyatTihuyu = function () {
      var id = (location.hash || '').slice(1);
      celTihaya = id ? document.getElementById(id) : null;
    };
    vzyatTihuyu();

    var dovesti = function () {
      if (!celTihaya || tronul) return;
      try {
        celTihaya.scrollIntoView({ block: 'start', behavior: 'instant' });
      } catch (err) {
        celTihaya.scrollIntoView(true);
      }
    };

    ['wheel', 'touchstart', 'keydown'].forEach(function (sob) {
      window.addEventListener(sob, function () { tronul = true; }, { passive: true });
    });
    window.addEventListener('hashchange', function () {
      tronul = false;
      vzyatTihuyu();
      dovesti();
    });
    window.addEventListener('load', dovesti);

    var srok = null;
    Array.prototype.forEach.call(document.querySelectorAll('main img'), function (im) {
      if (im.complete) return;
      im.addEventListener('load', function () {
        clearTimeout(srok);
        srok = setTimeout(dovesti, 80);
      });
    });
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

  /* --- Согласие запирает отправку ----------------------------------------
     Заказчик 02.09.2026 голосом: «не должна срабатывать отправка без согласия
     на обработку персональных данных». Проверка в check() была и раньше,
     но по кнопкам этого не было видно — теперь пока галочки нет, обе кнопки
     отправки притушены, а сам блок согласия подсвечивается при попытке. */
  var agreeBox = document.getElementById('fAgree');
  var soglasie = document.getElementById('soglasieBox');
  var sendButtons = Array.prototype.slice.call(
    form.querySelectorAll('[data-send="mail"], [data-send="max"]'));

  /* Кнопку именно притушаем, а не отключаем атрибутом: отключённая кнопка
     выпадает из обхода с клавиатуры и молчит в ответ на нажатие — человек
     не понимает, чего от него хотят. Здесь она нажимается и отвечает
     подсказкой, а отправку не пускает проверка в check(). */
  var syncLock = function () {
    var ok = !agreeBox || agreeBox.checked;
    sendButtons.forEach(function (b) { b.classList.toggle('is-locked', !ok); });
    if (ok) {
      if (soglasie) soglasie.classList.remove('is-nado');
      // упрёк про согласие снимаем сразу, как только галочка поставлена
      if (status && status.textContent.indexOf('согласие') > -1) say('');
    }
  };

  if (agreeBox) agreeBox.addEventListener('change', syncLock);
  syncLock();

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
    if (val('fOrg')) lines.push('Компания: ' + val('fOrg'));
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
    if (agreeBox && !agreeBox.checked) {
      say('Отметьте согласие на обработку персональных данных — без него мы не вправе принять заявку.');
      if (soglasie) {
        soglasie.classList.remove('is-nado');
        void soglasie.offsetWidth;          // перезапуск подсветки при повторном нажатии
        soglasie.classList.add('is-nado');
      }
      agreeBox.focus();
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
        say('Открываем почту: письмо уйдёт на ' + MAIL + '. Проверьте его и нажмите «Отправить».');
      }

      /* Отправка в MAX убрана 04.09.2026 по слову владельца: «вообще убрать
         это, отправить в MAX, просто отправить на почту». Мессенджер не давал
         прямой ссылки в чат компании — только экран «Отправить в MAX», где
         адресата человек выбирал сам, и без ссылки max.ru/u/<хеш> от самого
         заказчика толку от кнопки было мало. Остались два пути: письмо
         и текст заявки в буфер. */
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
})();
