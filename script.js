/* Health Chain · BID standalone page interactions. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Header: shadow on scroll ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Modules dropdown (hover on desktop, click/keyboard everywhere) ---------- */
  document.querySelectorAll("[data-menu]").forEach(function (item) {
    var trigger = item.querySelector(".nav-trigger");
    var closeTimer;

    function setOpen(open) {
      item.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      // Resources: the label is a link and the caret is its own button
      var labelLink = item.querySelector(".nav-split a");
      if (labelLink) trigger.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + labelLink.textContent + " menu");
    }

    trigger.addEventListener("click", function () {
      setOpen(!item.classList.contains("is-open"));
    });
    item.addEventListener("mouseenter", function () { clearTimeout(closeTimer); setOpen(true); });
    item.addEventListener("mouseleave", function () { closeTimer = setTimeout(function () { setOpen(false); }, 130); });
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) setOpen(false);
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setOpen(false); trigger.focus(); }
    });
    item.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) setOpen(false);
    });
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    var setMobile = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.hidden = !open;
    };
    toggle.addEventListener("click", function () {
      setMobile(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMobile(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileNav.hidden) { setMobile(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) setMobile(false);
    });
  }

  /* ---------- Mobile navigation: Solutions / Resources accordions ---------- */
  document.querySelectorAll("[data-acc]").forEach(function (group) {
    var btn = group.querySelector(".m-toggle");
    var sub = group.querySelector(".m-sub");
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + group.querySelector(".m-row a").textContent + " menu");
      sub.hidden = !open;
    });
  });

  /* ---------- Placeholder links (URL not yet confirmed) ---------- */
  document.querySelectorAll("[data-placeholder]").forEach(function (a) {
    a.title = a.getAttribute("data-placeholder");
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---------- Scroll reveals ---------- */
  var revealTargets = document.querySelectorAll(".reveal, [data-chain], [data-steps]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { revealer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Module rail: highlight the module in view ---------- */
  var spyLinks = document.querySelectorAll("[data-spy]");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    spyLinks.forEach(function (a) { linkFor[a.getAttribute("data-spy")] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var link = linkFor[entry.target.id];
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Marquee: duplicate the track for a seamless loop ---------- */
  if (!reduceMotion.matches) {
    document.querySelectorAll("[data-marquee] .marquee-track").forEach(function (track) {
      Array.prototype.slice.call(track.children).forEach(function (li) {
        var copy = li.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.appendChild(copy);
      });
    });
  }

  /* ---------- Hero card: gentle pointer tilt (fine pointers only) ---------- */
  var tiltCard = document.querySelector("[data-tilt]");
  if (tiltCard && !reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    var hero = tiltCard.closest(".hero");
    var frame;
    hero.addEventListener("pointermove", function (e) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        var r = tiltCard.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        tiltCard.style.transform =
          "perspective(1200px) rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 5).toFixed(2) + "deg)";
      });
    });
    hero.addEventListener("pointerleave", function () {
      cancelAnimationFrame(frame);
      tiltCard.style.transform = "";
    });
  }

  /* ---------- Ask it / Answer: type each pair as it scrolls into view ----------
     Question first, then its answer. Pairs run one after another through a
     queue, so two pairs never type at once. Without JS, IntersectionObserver
     or with reduced motion the text simply stays as written. */
  var qaBlocks = document.querySelectorAll(".qa");
  if (qaBlocks.length && "IntersectionObserver" in window && !reduceMotion.matches) {
    // Wrap a text container so the typed text overlays an invisible full copy
    // (keeps the card's size fixed) and screen readers still get the full text.
    var makeTypeable = function (el) {
      var text = el.textContent.replace(/\s+/g, " ").trim();
      el.textContent = "";
      el.classList.add("qa-type");
      var ghost = document.createElement("span");
      ghost.className = "qa-ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.textContent = text;
      var live = document.createElement("span");
      live.className = "qa-live";
      live.setAttribute("aria-hidden", "true");
      var sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = text;
      el.append(ghost, live, sr);
      return { el: el, live: live, text: text };
    };

    // Per-character delay with a little variation, longer after punctuation.
    var typeOut = function (t, baseMs) {
      return new Promise(function (resolve) {
        var i = 0;
        t.el.classList.add("is-typing");
        (function next() {
          i++;
          t.live.textContent = t.text.slice(0, i);
          if (i >= t.text.length) {
            t.el.classList.remove("is-typing");
            resolve();
            return;
          }
          var ch = t.text.charAt(i - 1);
          var delay = baseMs * (0.6 + Math.random() * 0.8);
          if (/[,.?;:]/.test(ch)) delay += baseMs * 5;
          setTimeout(next, delay);
        })();
      });
    };
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    var qaQueue = Promise.resolve();
    var qaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        qaObserver.unobserve(entry.target);
        var pair = entry.target._qa;
        qaQueue = qaQueue.then(function () {
          return wait(250)
            .then(function () { return typeOut(pair.q, 38); })
            .then(function () { return wait(380); })
            .then(function () {
              entry.target.classList.remove("is-pending");
              return typeOut(pair.a, 16);
            });
        });
      });
    }, { threshold: 0.6 });

    qaBlocks.forEach(function (qa) {
      var question = qa.querySelector(".qa-q em");
      var answerRow = qa.querySelector(".qa-a");
      var tag = answerRow && answerRow.querySelector(".qa-tag");
      if (!question || !tag) return;
      // The answer is plain text after its tag; give it its own element.
      var answer = document.createElement("span");
      while (tag.nextSibling) answer.appendChild(tag.nextSibling);
      answerRow.appendChild(answer);

      qa._qa = { q: makeTypeable(question), a: makeTypeable(answer) };
      qa.classList.add("is-pending");
      qaObserver.observe(qa);
    });
  }

  /* ---------- Configuration timeline: light the dots in turn, on a loop ----------
     The fill line runs to each dot, the dot lights as it arrives, and after
     the last one everything resets and starts again. Runs only while the
     timeline is on screen; reduced motion keeps the static lit dots. */
  var timeline = document.querySelector(".timeline");
  if (timeline && "IntersectionObserver" in window && !reduceMotion.matches) {
    var tlItems = Array.prototype.slice.call(timeline.children);
    var tlStep = -1;
    var tlTimer = null;
    var TL_STEP_MS = 1100, TL_LIGHT_MS = 500, TL_HOLD_MS = 1600, TL_RESET_MS = 700;

    var tlFillTo = function (i) {
      var dot = tlItems[i].querySelector(".tl-dot");
      var t = timeline.getBoundingClientRect();
      var d = dot.getBoundingClientRect();
      // the line starts 14px from the top (see .timeline::after)
      timeline.style.setProperty("--tl-fill", Math.max(0, d.top + d.height / 2 - t.top - 14) + "px");
    };
    var tlClear = function () {
      tlItems.forEach(function (li) { li.classList.remove("is-lit", "is-current"); });
      timeline.style.setProperty("--tl-fill", "0px");
    };
    var tlTick = function () {
      tlStep++;
      if (tlStep >= tlItems.length) {
        // fade out, reset, start again
        timeline.classList.add("is-resetting");
        tlItems.forEach(function (li) { li.classList.remove("is-current"); });
        tlTimer = setTimeout(function () {
          tlClear(); // the line shrinks while still faded out
          tlTimer = setTimeout(function () {
            timeline.classList.remove("is-resetting");
            tlStep = -1;
            tlTick();
          }, TL_RESET_MS);
        }, TL_RESET_MS);
        return;
      }
      var step = tlStep;
      tlFillTo(step);
      tlTimer = setTimeout(function () {
        tlItems.forEach(function (li, i) { li.classList.toggle("is-current", i === step); });
        tlItems[step].classList.add("is-lit");
        tlTimer = setTimeout(tlTick, step === tlItems.length - 1 ? TL_HOLD_MS : TL_STEP_MS - TL_LIGHT_MS);
      }, TL_LIGHT_MS);
    };
    var tlStart = function () {
      if (tlTimer) return;
      timeline.classList.add("is-animated");
      tlClear();
      tlStep = -1;
      tlTimer = setTimeout(tlTick, 600); // let the reveal settle first
    };
    var tlStop = function () {
      clearTimeout(tlTimer);
      tlTimer = null;
      timeline.classList.remove("is-animated", "is-resetting");
      tlClear();
    };

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.isIntersecting ? tlStart() : tlStop(); });
    }, { threshold: 0.35 }).observe(timeline);
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();