(function () {
  'use strict';
  const styles = `
.gc-watermark{position:absolute;inset:0;pointer-events:none;overflow:hidden;container-type:size;z-index:1}
.gc-watermark .gc-mark{position:absolute;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:.15em;transform:translate(-50%,-50%) rotate(var(--mark-turn));text-align:center;line-height:1.1}
.gc-watermark .gc-mark img{display:block;width:100%;height:auto;max-height:100%;margin:0;padding:0;object-fit:contain}
.gc-watermark .gc-mark-text{font-size:inherit;max-width:100%;font-weight:850;font-family:system-ui,sans-serif;flex:none;line-height:1.12}
.gc-watermark .gc-mark-line{display:block;white-space:nowrap}
.gc-watermark .gc-mark-combined img{max-height:52%;width:75%;flex-shrink:1}
`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const number = (value, min, max, fallback) => {
    const n = value === '' || value == null ? NaN : Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  function imageUrl(value) {
    try {
      const url = new URL(value, location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch (error) { return ''; }
  }
  let measure;
  const fittedLabels = new Map();
  function fitLabel(text, combined) {
    const key = combined + ':' + text;
    if (fittedLabels.has(key)) return fittedLabels.get(key);
    if (!measure) {
      measure = document.createElement('canvas').getContext('2d');
      if (measure) measure.font = '850 100px system-ui, sans-serif';
    }
    const width = value => measure ? measure.measureText(value).width / 100 : Array.from(value).length;
    const words = text.trim().split(/\s+/);
    const wordWidths = words.map(width), space = width(' ');
    const maxHeight = combined ? .39 : .91;
    const maxWidth = .86;
    function wrap(scale) {
      const lines = [];
      let line = '', used = 0;
      for (let i = 0; i < words.length; i++) {
        if (wordWidths[i] * scale > maxWidth) return null;
        if (line && (used + space + wordWidths[i]) * scale > maxWidth) {
          lines.push(line);
          line = '';
        }
        used = line ? used + space + wordWidths[i] : wordWidths[i];
        line = line ? line + ' ' + words[i] : words[i];
      }
      lines.push(line);
      const maxLines = combined ? 3 : 4;
      return lines.length <= maxLines && lines.length * 1.12 * scale <= maxHeight ? lines : null;
    }
    let lo = 0, hi = combined ? .18 : .28;
    for (let step = 0; step < 16; step++) {
      const middle = (lo + hi) / 2;
      if (wrap(middle)) lo = middle;
      else hi = middle;
    }
    const lines = wrap(lo);
    const label = {scale:lo, html:'<span class="gc-mark-text">' +
      lines.map(line => '<span class="gc-mark-line">' + escape(line) + '</span>').join(' ') + '</span>'};
    if (fittedLabels.size >= 40) fittedLabels.clear();
    fittedLabels.set(key, label);
    return label;
  }
  function markup(settings, fallbackImage) {
    if (!settings || !settings.enabled) return '';
    const size = number(settings.size, 10, 65, 28);
    const count = Math.round(number(settings.quantity, 1, 9, 3));
    const opacity = number(settings.opacity, 1, 100, 15) / 100;
    const angle = number(settings.angle, -180, 180, 0);
    const radians = angle * Math.PI / 180;
    const rotationFit = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
    const placeX = number(settings.x, 0, 100, 50) / 100;
    const placeY = number(settings.y, 0, 100, 50) / 100;
    const text = String(settings.text || '').slice(0, 100).trim() || 'GAMER COMAYAGUA';
    const color = /^#[0-9a-f]{6}$/i.test(settings.color || '') ? settings.color : '#142348';
    const mode = settings.mode || 'image';
    const image = mode === 'text' ? '' : (settings.image && imageUrl(settings.image)) || (fallbackImage && imageUrl(fallbackImage));
    const label = mode !== 'image' || !image ? fitLabel(text, Boolean(image)) : null;
    const content = (image ? '<img src="' + escape(image) + '" alt="">' : '') + (label ? label.html : '');
    const columns = settings.layout === 'row' ? count : settings.layout === 'column' ? 1 : Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / columns);
    const cellW = Math.min(size + 5, 94 / columns);
    const cellH = Math.min(size + 5, 94 / rows);
    const groupW = cellW * columns;
    const groupH = cellH * rows;
    const left = 3 + (94 - groupW) * placeX;
    const top = 3 + (94 - groupH) * placeY;
    const marks = Array.from({length: count}, (_, index) => {
      const row = Math.floor(index / columns);
      const rowCount = Math.min(columns, count - row * columns);
      const x = left + (columns - rowCount) * cellW / 2 + (index % columns + .5) * cellW;
      const y = top + (row + .5) * cellH;
      const unit = Math.min(size, cellW * .89, cellH * .89) / rotationFit;
      const combined = image && label ? ' gc-mark-combined' : '';
      const font = label ? unit * label.scale : unit * .18;
      return '<div class="gc-mark' + combined + '" style="left:' + x + '%;top:' + y +
        '%;width:' + unit + 'cqmin;height:' + unit + 'cqmin;font-size:min(' + font + 'cqmin,40px);--mark-turn:' + angle +
        'deg">' + content + '</div>';
    }).join('');
    return '<div class="gc-watermark" aria-hidden="true" style="opacity:' + opacity + ';color:' + color + '">' + marks + '</div>';
  }
  function applyStyles() {
    if (document.getElementById('gc-mark-styles')) return;
    const style = document.createElement('style');
    style.id = 'gc-mark-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }
  window.GC_MARKS = {markup, styles, applyStyles};
})();
