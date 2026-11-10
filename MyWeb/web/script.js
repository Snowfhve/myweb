/* =========================================================
   好好生活计划 · 页面交互
   Vanilla JavaScript, no external dependencies
   ========================================================= */

(function () {
  "use strict";

  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call(
      (context || document).querySelectorAll(selector)
    );
  };

  var storage = {
    get: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* localStorage can be unavailable on file:// in some browsers */
      }
    },
    remove: function (key) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        /* no-op */
      }
    }
  };

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function localDateKey(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function mondayKey(date) {
    var d = date || new Date();
    var dayIndex = (d.getDay() + 6) % 7;
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayIndex);
    return localDateKey(monday);
  }

  /* ---------- Header, scroll progress, mobile navigation ---------- */

  var header = $(".site-header");
  var progressBar = $(".scroll-progress");

  function updateScrollUI() {
    var scrollTop =
      window.pageYOffset || document.documentElement.scrollTop || 0;
    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 8);
    }
    if (progressBar) {
      var maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      var progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      progressBar.style.transform = "scaleX(" + progress + ")";
    }
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  var navToggle = $(".nav-toggle");
  var nav = $(".nav");

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", function (event) {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        closeNav();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) closeNav();
    });
  }

  /* ---------- Today's date ---------- */

  var todayNode = $("[data-today]");
  if (todayNode) {
    var now = new Date();
    var weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    todayNode.textContent =
      now.getFullYear() +
      "." +
      pad(now.getMonth() + 1) +
      "." +
      pad(now.getDate()) +
      " · " +
      weekdays[now.getDay()];
  }

  var yearNode = $("[data-year]");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  /* ---------- Gentle scroll reveal ---------- */

  var revealNodes = $$(".reveal");
  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  if (revealNodes.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      revealNodes.forEach(function (node) {
        revealObserver.observe(node);
      });
    }
  }

  /* ---------- Home: little tip generator ---------- */

  var tipText = $("[data-tip-text]");
  var tipButton = $("[data-tip-button]");

  if (tipText && tipButton) {
    var dailyTips = [
      "早餐加一个鸡蛋，再配一份水果，上午会更踏实。",
      "把水杯放在看得见的地方，看到就喝两口。",
      "久坐一小时，就站起来接杯水、伸个懒腰。",
      "今天走 20 分钟路，不用换运动服也算数。",
      "睡前半小时把手机放远一点，给自己留一段安静。",
      "吃饭时慢一点，吃到七分饱就停一停。",
      "阳光好的时候出门晒 10 分钟，心情也会亮一点。",
      "与其追求完美的一天，不如先完成一件小事。"
    ];
    var lastTip = -1;

    tipButton.addEventListener("click", function () {
      var index = Math.floor(Math.random() * dailyTips.length);
      if (index === lastTip) {
        index = (index + 1) % dailyTips.length;
      }
      lastTip = index;
      tipText.textContent = dailyTips[index];
    });
  }

  /* ---------- Meal lightbox ---------- */

  var lightbox = $("#lightbox");
  var lightboxTriggers = $$("[data-lightbox]");

  if (lightbox && lightboxTriggers.length) {
    var lightboxImage = $("[data-lightbox-image]", lightbox);
    var lightboxCaption = $("[data-lightbox-caption]", lightbox);

    var openLightbox = function () {
      if (typeof lightbox.showModal === "function") {
        lightbox.showModal();
      } else {
        lightbox.setAttribute("open", "");
      }
      document.body.style.overflow = "hidden";
    };

    var closeLightbox = function () {
      if (typeof lightbox.close === "function") {
        lightbox.close();
      } else {
        lightbox.removeAttribute("open");
        document.body.style.overflow = "";
      }
    };

    lightboxTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var fullSource = trigger.getAttribute("data-full");
        var caption = trigger.getAttribute("data-caption") || "";
        var thumb = $("img", trigger);

        if (!fullSource) return;
        if (lightboxImage) {
          lightboxImage.src = fullSource;
          lightboxImage.alt =
            (thumb && thumb.alt ? thumb.alt : "健康餐照片") + "，大图";
        }
        if (lightboxCaption) lightboxCaption.textContent = caption;
        openLightbox();
      });
    });

    $$("[data-lightbox-close]", lightbox).forEach(function (button) {
      button.addEventListener("click", closeLightbox);
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener("close", function () {
      document.body.style.overflow = "";
    });
  }

  /* ---------- Weekly movement tracker ---------- */

  var moveTracker = $("[data-move-tracker]");

  if (moveTracker) {
    var moveBoxes = $$("[data-move-day]", moveTracker);
    var moveCount = $("[data-move-count]", moveTracker);
    var moveFill = $("[data-move-fill]", moveTracker);
    var moveMessage = $("[data-move-message]", moveTracker);
    var moveReset = $("[data-move-reset]", moveTracker);
    var moveStorageKey = "haohao-move-week";
    var thisWeek = mondayKey();

    var readMoveState = function () {
      var raw = storage.get(moveStorageKey);
      if (!raw) return null;

      try {
        var parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.week === thisWeek &&
          Array.isArray(parsed.days) &&
          parsed.days.length === moveBoxes.length
        ) {
          return parsed.days;
        }
      } catch (error) {
        return null;
      }
      return null;
    };

    var moveMessages = [
      "从今天的一小步开始，先挑最喜欢的一天。",
      "身体已经开始记得动起来的感觉了。",
      "节奏不错，休息日也是计划的一部分。",
      "很稳！记得听听身体的反馈。",
      "本周全部点亮。奖励自己好好睡一觉吧。"
    ];

    var messageForCount = function (count) {
      if (count === 0) return moveMessages[0];
      if (count <= 2) return moveMessages[1];
      if (count <= 4) return moveMessages[2];
      if (count < moveBoxes.length) return moveMessages[3];
      return moveMessages[4];
    };

    var updateMoveTracker = function (save) {
      var count = 0;

      moveBoxes.forEach(function (box) {
        var card = box.closest(".day-card");
        if (card) card.classList.toggle("is-done", box.checked);
        if (box.checked) count += 1;
      });

      if (moveCount) {
        moveCount.textContent = count + " / " + moveBoxes.length;
      }
      if (moveFill) {
        moveFill.style.width =
          (moveBoxes.length ? (count / moveBoxes.length) * 100 : 0) + "%";
      }
      if (moveMessage) {
        moveMessage.textContent = messageForCount(count);
      }

      if (save) {
        storage.set(
          moveStorageKey,
          JSON.stringify({
            week: thisWeek,
            days: moveBoxes.map(function (box) {
              return box.checked;
            })
          })
        );
      }
    };

    var savedMoveDays = readMoveState();
    if (savedMoveDays) {
      moveBoxes.forEach(function (box, index) {
        box.checked = Boolean(savedMoveDays[index]);
      });
    }

    moveBoxes.forEach(function (box) {
      box.addEventListener("change", function () {
        updateMoveTracker(true);
      });
    });

    if (moveReset) {
      moveReset.addEventListener("click", function () {
        moveBoxes.forEach(function (box) {
          box.checked = false;
        });
        storage.remove(moveStorageKey);
        updateMoveTracker(false);
      });
    }

    updateMoveTracker(false);
  }

  /* ---------- Daily check-in ---------- */

  var checkin = $("[data-checkin]");

  if (checkin) {
    var checkBoxes = $$("[data-check]", checkin);
    var checkCount = $("[data-check-count]", checkin);
    var checkRing = $("[data-check-ring]", checkin);
    var checkMessage = $("[data-check-message]", checkin);
    var checkReset = $("[data-check-reset]", checkin);
    var checkStorageKey = "haohao-checkin-" + localDateKey();
    var checkMessages = [
      "今天不用满分，先完成一件小事就好。",
      "已经开始啦，继续保持这个轻快的节奏。",
      "过半了，给自己倒杯水吧。",
      "就差一点点了，今天的状态很不错。",
      "全部完成！记得对自己说一声辛苦啦。"
    ];

    var updateCheckin = function (save) {
      var count = 0;

      checkBoxes.forEach(function (box) {
        var row = box.closest(".check-row");
        if (row) row.classList.toggle("is-checked", box.checked);
        if (box.checked) count += 1;
      });

      if (checkCount) checkCount.textContent = String(count);
      if (checkRing) {
        var percent = checkBoxes.length
          ? (count / checkBoxes.length) * 100
          : 0;
        checkRing.style.strokeDashoffset = String(100 - percent);
      }
      if (checkMessage) {
        checkMessage.textContent = checkMessages[count] || checkMessages[0];
      }

      if (save) {
        storage.set(
          checkStorageKey,
          JSON.stringify(
            checkBoxes.map(function (box) {
              return box.checked;
            })
          )
        );
      }
    };

    var readCheckin = function () {
      var raw = storage.get(checkStorageKey);
      if (!raw) return null;
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === checkBoxes.length) {
          return parsed;
        }
      } catch (error) {
        return null;
      }
      return null;
    };

    var savedChecks = readCheckin();
    if (savedChecks) {
      checkBoxes.forEach(function (box, index) {
        box.checked = Boolean(savedChecks[index]);
      });
    }

    checkBoxes.forEach(function (box) {
      box.addEventListener("change", function () {
        updateCheckin(true);
      });
    });

    if (checkReset) {
      checkReset.addEventListener("click", function () {
        checkBoxes.forEach(function (box) {
          box.checked = false;
        });
        storage.remove(checkStorageKey);
        updateCheckin(false);
      });
    }

    updateCheckin(false);
  }

  /* ---------- Add current page to keyboard skip target ---------- */

  var mainContent = document.querySelector("main");
  if (mainContent && !mainContent.id) {
    mainContent.id = "main-content";
  }
})();
