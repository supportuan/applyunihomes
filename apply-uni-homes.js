(function () {
  const FRAME_W = 1440;
  const FRAME_H = 900;
  const DESKTOP_MQ = '(min-width: 1024px)';
  const BAR_COUNT = 62;
  const waveform = document.getElementById('waveform');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isDesktop() {
    return window.matchMedia(DESKTOP_MQ).matches;
  }

  function frameUnit() {
    return Math.max(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H);
  }

  function applyFrameUnit() {
    if (!isDesktop()) return;
    document.documentElement.style.setProperty('--u', String(frameUnit()));
  }

  applyFrameUnit();
  window.addEventListener('resize', applyFrameUnit);

  if (reducedMotion) {
    const lighting = document.getElementById('lighting');
    if (lighting) lighting.classList.add('reduced-off');
    const vid = document.querySelector('.scene-video');
    if (vid) vid.remove();
  }

  function lerpColor(c1, c2, t) {
    const p = (hex) => hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    const a = p(c1);
    const b = p(c2);
    const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return '#' + m.map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  function barHeight(i) {
    const x = i / (BAR_COUNT - 1);
    const burst = Math.exp(-Math.pow((x - 0.25) / 0.06, 2)) * 1;
    const bump1 = Math.exp(-Math.pow((x - 0.33) / 0.05, 2)) * 0.45;
    const bump2 = Math.exp(-Math.pow((x - 0.68) / 0.07, 2)) * 0.38;
    const noise = 0.12 + (Math.sin(i * 2.17) * 0.5 + 0.5) * 0.18;
    return Math.min(1, noise + burst + bump1 + bump2) * 34;
  }

  function buildWaveform() {
    if (!waveform) return;
    waveform.innerHTML = '';
    const u = frameUnit();
    for (let i = 0; i < BAR_COUNT; i++) {
      const h = barHeight(i);
      const bar = document.createElement('span');
      bar.className = 'wave-bar';
      const t = i / (BAR_COUNT - 1);
      let color;
      if (t < 0.5) color = lerpColor('5560ff', '86a2ff', t * 2);
      else color = lerpColor('86a2ff', 'a083ff', (t - 0.5) * 2);
      bar.style.height = isDesktop() ? `${h * u}px` : `${h}px`;
      bar.style.background = `linear-gradient(to top, ${color}, ${color}cc)`;
      waveform.appendChild(bar);
    }
  }

  function attachWaveBreathing() {
    if (reducedMotion) return;
    document.querySelectorAll('.wave-bar').forEach((bar, i) => {
      const delay = (i % 12) * 0.08;
      bar.style.animation = `wave-breathe 1.6s ease-in-out ${delay}s infinite`;
    });
  }

  buildWaveform();
  attachWaveBreathing();
  window.addEventListener('resize', () => {
    buildWaveform();
    attachWaveBreathing();
    applyFrameUnit();
  });

  const wordmark = document.querySelector('.wordmark');
  const subtitle = document.querySelector('.subtitle');
  const label = document.querySelector('.episode-label');
  const card = document.querySelector('.player-card');
  const aboutLabel = document.querySelector('.about-label');
  const aboutCopy = document.querySelector('[data-about-copy]');
  const platformRow = document.querySelector('.platform-row');
  const bars = () => [...waveform.querySelectorAll('.wave-bar')];

  function finishAnim(anim) {
    anim.onfinish = () => {
      try {
        anim.commitStyles();
      } catch (_) {
        /* commitStyles not supported */
      }
      anim.cancel();
    };
  }

  function runEntrance() {
    if (reducedMotion) {
      waveform.classList.add('wipe-ready');
      return;
    }

    const desktop = isDesktop();
    const wmFrom = desktop
      ? { filter: 'blur(18px)', opacity: 0, transform: 'translateX(-50%) scale(1.04)' }
      : { filter: 'blur(18px)', opacity: 0, transform: 'scale(1.02)' };
    const wmTo = desktop
      ? { filter: 'blur(0)', opacity: 1, transform: 'translateX(-50%) scale(1)' }
      : { filter: 'blur(0)', opacity: 1, transform: 'none' };

    const wordAnim = wordmark.animate([wmFrom, wmTo], {
      duration: 900,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    });
    if (!desktop) finishAnim(wordAnim);

    const tl = [wordAnim];

    if (subtitle) {
      const subFrom = desktop
        ? { opacity: 0, transform: 'translateX(-50%) translateY(14px)' }
        : { opacity: 0, transform: 'translateY(8px)' };
      const subTo = desktop
        ? { opacity: 1, transform: 'translateX(-50%) translateY(0)' }
        : { opacity: 1, transform: 'none' };
      const subAnim = subtitle.animate([subFrom, subTo], {
        duration: 700,
        delay: 120,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      });
      if (!desktop) finishAnim(subAnim);
      tl.push(subAnim);
    }

    const labFrom = desktop
      ? { opacity: 0, letterSpacing: '0.3em', transform: 'translateX(-50%)' }
      : { opacity: 0, letterSpacing: '0.22em' };
    const labTo = desktop
      ? { opacity: 1, letterSpacing: '0.05em', transform: 'translateX(-50%)' }
      : { opacity: 1, letterSpacing: '0.05em' };
    const labAnim = label.animate([labFrom, labTo], {
      duration: 800,
      delay: 220,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    });
    if (!desktop) finishAnim(labAnim);
    tl.push(labAnim);

    const cardAnim = card.animate(
      [
        { opacity: 0, filter: 'blur(12px)', transform: 'translateY(18px)' },
        { opacity: 1, filter: 'blur(0)', transform: 'none' },
      ],
      { duration: 850, delay: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );
    finishAnim(cardAnim);
    tl.push(cardAnim);

    bars().forEach((bar, i) => {
      const barAnim = bar.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 350,
        delay: 520 + i * 12,
        easing: 'ease-out',
        fill: 'forwards',
      });
      finishAnim(barAnim);
    });

    const aboutLabelAnim = aboutLabel.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 500, delay: 1100, fill: 'forwards', easing: 'ease-out' }
    );
    finishAnim(aboutLabelAnim);

    if (aboutCopy) {
      const aboutCopyAnim = aboutCopy.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 0.92, transform: 'none' }],
        { duration: 550, delay: 1180, fill: 'forwards', easing: 'ease-out' }
      );
      finishAnim(aboutCopyAnim);
    }

    if (platformRow) {
      const platformRowAnim = platformRow.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 500, delay: 1420, fill: 'forwards', easing: 'ease-out' }
      );
      finishAnim(platformRowAnim);
    }

    Promise.all(tl.map((a) => a.finished)).then(() => waveform.classList.add('wipe-ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runEntrance);
  } else {
    runEntrance();
  }

  const playBtn = document.querySelector('.play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => playBtn.classList.toggle('is-playing'));
  }
})();