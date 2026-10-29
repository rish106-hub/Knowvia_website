// Generated from Main.dc.html, then wired to /api/waitlist and the microphone (see scripts/design-port/README.md).
/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */
import { DCLogic } from "@/lib/dc-logic";

export class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { faqOpen: 0, faqTab: 0, policies: {}, msOpen: false, askIdx: 0, askPhase: 'ready', termIdx: 0, numStep: 0, filmC: 0, filmPlaying: false, roomRate: 8000, priv: { 0: true, 1: true, 2: false }, promiseSeen: {}, storySeen: {}, railIdx: -1, railShow: false, dockOpen: false, dockAway: false };
    this.timers = {};
    this.raf = {};
    this.done = {};
    this.offs = [];
    this.observers = [];
  }
  componentDidMount() {
    var self = this;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window)) return;
    var watch = function (els, opts, fn) {
      var o = new IntersectionObserver(function (entries) { entries.forEach(fn); }, opts);
      els.forEach(function (el) { if (el) o.observe(el); });
      self.observers.push(o);
    };
    var listen = function (target, type, fn) { target.addEventListener(type, fn, { passive: true }); self.offs.push(function () { target.removeEventListener(type, fn); }); };
    // statements beside the pinned numbers chart
    watch(Array.prototype.slice.call(document.querySelectorAll('[data-step]')), { rootMargin: '-45% 0px -45% 0px' }, function (en) {
      if (en.isIntersecting) self.setState({ numStep: +en.target.getAttribute('data-step') });
    });
    // promises cross out as each one is read
    watch(Array.prototype.slice.call(document.querySelectorAll('[data-promise]')), { threshold: 0.6 }, function (en) {
      if (!en.isIntersecting) return;
      var seen = Object.assign({}, self.state.promiseSeen); seen[en.target.getAttribute('data-promise')] = true; self.setState({ promiseSeen: seen });
    });
    watch([document.getElementById('partners')], { threshold: 0.3 }, function (en) { if (en.isIntersecting) self.setState({ flowIn: true }); });
    // section rail
    var railIds = ['how', 'clauses', 'desk', 'try', 'promises', 'questions', 'research', 'partners'];
    watch(railIds.map(function (id) { return document.getElementById(id); }), { rootMargin: '-45% 0px -50% 0px' }, function (en) {
      if (en.isIntersecting) self.setState({ railIdx: railIds.indexOf(en.target.id) });
    });
    // story tiles draw their charts the first time they are seen
    watch(Array.prototype.slice.call(document.querySelectorAll('[data-story]')), { threshold: 0.4 }, function (en) {
      if (!en.isIntersecting) return;
      var seen = Object.assign({}, self.state.storySeen); seen[en.target.getAttribute('data-story')] = true; self.setState({ storySeen: seen });
    });
    // the nav slides away while you read down, and comes back as soon as you scroll up
    var nav = document.querySelector('.kv-nav'), lastY = window.scrollY;
    var onScroll = function () {
      if (self.raf.scroll) return;
      self.raf.scroll = requestAnimationFrame(function () {
        self.raf.scroll = 0;
        var y = window.scrollY;
        if (nav) nav.classList.toggle('kv-nav-up', y > lastY && y > 400 && !document.getElementById('mobile-menu'));
        lastY = y;
        var show = y > window.innerHeight * 0.8;
        if (show !== self.state.railShow) self.setState({ railShow: show });
      });
    };
    listen(window, 'scroll', onScroll);
    // the dock steps aside for the sign-up form and the footer; Escape closes its panel
    var away = {};
    watch([document.getElementById('early-list'), document.querySelector('footer')], { threshold: 0.15 }, function (en) {
      away[en.target.id || 'footer'] = en.isIntersecting;
      var a = Object.keys(away).some(function (k) { return away[k]; });
      if (a !== self.state.dockAway) self.setState({ dockAway: a });
    });
    var onKey = function (e) {
      if (e.key !== 'Escape' || !self.state.dockOpen) return;
      self.dockSet(false);
      var x = document.querySelector('.kv-dock-x'); if (x) x.focus();
    };
    document.addEventListener('keydown', onKey);
    self.offs.push(function () { document.removeEventListener('keydown', onKey); });
    // blocks rise into place as they enter; anything already on screen is shown at once so nothing flashes
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.kv-reveal'));
    reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('kv-in'); });
    document.documentElement.classList.add('kv-js');
    watch(reveals.filter(function (el) { return !el.classList.contains('kv-in'); }), { rootMargin: '0px 0px -8% 0px' }, function (en) {
      if (en.isIntersecting) en.target.classList.add('kv-in');
    });
    if (reduce) return;
    // the hero holds still while the numbers slide over it; a hero taller than the screen holds at its bottom edge
    var hero = document.getElementById('top');
    var heroFit = function () { if (hero) hero.style.top = Math.min(0, window.innerHeight - hero.offsetHeight) + 'px'; };
    heroFit();
    listen(window, 'resize', heroFit);
    // the fine print slides past one to one with the scroll while its band is pinned, eased toward the target each frame
    var hsEl = document.querySelector('[data-hs]'), track = hsEl && hsEl.querySelector('[data-hs-track]'), hsBar = hsEl && hsEl.querySelector('[data-hs-bar]');
    if (track) {
      // the pin is only as tall as the cards and holds in the middle of the screen, so nothing empty scrolls past when it lets go
      var travel = 0, pinTop = 0, SPEED = 1.5, rail = document.querySelector('.kv-rail'), pin = hsEl.firstElementChild;
      var hsSize = function () {
        hsEl.classList.add('kv-hs-on');
        travel = Math.max(0, track.scrollWidth - window.innerWidth);
        pinTop = Math.max(0, Math.round((window.innerHeight - pin.offsetHeight) / 2));
        pin.style.top = pinTop + 'px';
        hsEl.style.height = (pin.offsetHeight + Math.round(travel / SPEED)) + 'px';
      };
      var hsDraw = function () {
        self.raf.hs = 0;
        var box = hsEl.getBoundingClientRect(), x = Math.min(travel, Math.max(0, (pinTop - box.top) * SPEED));
        if (rail) rail.classList.toggle('kv-rail-off', box.top < window.innerHeight * 0.5 && box.bottom > window.innerHeight * 0.5);
        track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
        if (hsBar) hsBar.style.transform = 'scaleX(' + (travel ? x / travel : 0).toFixed(4) + ')';
      };
      var hsScroll = function () { if (!self.raf.hs) self.raf.hs = requestAnimationFrame(hsDraw); };
      hsSize(); hsScroll();
      listen(window, 'scroll', hsScroll);
      listen(window, 'resize', function () { hsSize(); hsScroll(); });
    }
    this.askAuto = true;
    this.timers.askNext = setTimeout(function () { self.askGo(1); }, 5000);
    var run = function (key) {
      var t0 = null;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var x = Math.min(1, (ts - t0) / 1600);
        var s = {}; s[key] = 1 - Math.pow(1 - x, 4);
        self.setState(s);
        if (x < 1) self.raf[key] = requestAnimationFrame(step);
      };
      var s0 = {}; s0[key] = 0; self.setState(s0);
      self.raf[key] = requestAnimationFrame(step);
    };
    watch([document.getElementById('industry'), document.getElementById('stories')], { threshold: 0.2 }, function (en) {
      if (en.isIntersecting && !self.done[en.target.id]) {
        self.done[en.target.id] = true;
        run(en.target.id === 'industry' ? 'pInd' : 'pSto');
      }
    });
  }
  askGo(i, text) {
    var self = this;
    clearTimeout(this.timers.askNext); clearTimeout(this.timers.askType);
    this.setState({ askIdx: i, askText: text || null, askPhase: 'typing' });
    this.timers.askType = setTimeout(function () {
      self.setState({ askPhase: 'ready' });
      if (self.askAuto) self.timers.askNext = setTimeout(function () { self.askGo((i + 1) % 4); }, 5000);
    }, 900);
  }
  dockSet(open) {
    document.documentElement.classList.toggle('kv-lock', open);
    this.setState({ dockOpen: open });
    clearTimeout(this.timers.dockFocus);
    if (open) this.timers.dockFocus = setTimeout(function () { var a = document.querySelector('.kv-dock-list a'); if (a) a.focus(); }, 320);
  }
  filmPlay(on) {
    var self = this;
    clearTimeout(this.timers.film);
    if (on) {
      var left = this.filmLeft || 5000;
      this.filmStart = Date.now() - (5000 - left);
      this.timers.film = setTimeout(function () { self.filmLeft = 5000; self.setState({ filmC: (self.state.filmC + 1) % 4 }); self.filmPlay(true); }, left);
    } else if (this.state.filmPlaying) {
      this.filmLeft = Math.max(200, 5000 - (Date.now() - (this.filmStart || Date.now())));
    }
    this.setState({ filmPlaying: on });
  }
  componentDidUpdate(prev) {
    var reset = {};
    if (prev.heroFormState !== this.props.heroFormState) reset.heroState = null;
    if (prev.closingFormState !== this.props.closingFormState) reset.closeState = null;
    if (prev.mobileMenuOpen !== this.props.mobileMenuOpen) reset.menu = null;
    if (prev.closingMode !== this.props.closingMode) reset.mode = null;
    if (prev.closingVoiceState !== this.props.closingVoiceState) { reset.voice = null; reset.voiceSecs = null; }
    if (Object.keys(reset).length) this.setState(reset);
  }
  componentWillUnmount() {
    Object.keys(this.timers).forEach(function (k) { clearTimeout(this.timers[k]); }, this);
    Object.keys(this.raf).forEach(function (k) { cancelAnimationFrame(this.raf[k]); }, this);
    this.raf = {};
    this.observers.forEach(function (o) { o.disconnect(); });
    this.offs.forEach(function (off) { off(); });
    document.documentElement.classList.remove('kv-js', 'kv-lock');
    if (this.recTick) clearInterval(this.recTick);
    if (this.playTick) clearInterval(this.playTick);
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    if (this.player) this.player.pause();
  }
  formModel(key, propState) {
    var self = this;
    var st = this.state[key + 'State'] || propState || 'default';
    var email = this.state[key + 'Email'] || '';
    var errors = {
      empty: 'Enter your email address.',
      invalid: 'Enter an email address like name@example.com.',
      network: 'We could not add you. Check your connection and try again.',
      server: 'Something went wrong on our side, and your email was not saved. Try again in a minute.'
    };
    var invalid = st === 'empty' || st === 'invalid';
    var busy = st === 'submitting';
    var base = 'flex:1 1 260px;min-width:0;height:56px;box-sizing:border-box;padding:0 18px;border-radius:12px;background:#FFFFFF;font:inherit;font-size:17px;color:#1A3034;';
    return {
      showForm: st !== 'success',
      showSuccess: st === 'success',
      busy: busy,
      busyStr: busy ? 'true' : 'false',
      invalid: invalid ? 'true' : 'false',
      error: errors[st] || '',
      buttonLabel: busy ? 'Joining' : (st === 'network' || st === 'server' ? 'Try again' : 'Join the early list'),
      emailShown: email || 'your address',
      inputStyle: base + (invalid ? 'border:2px solid #A74335;' : 'border:1px solid #7B918E;'),
      setEmail: function (e) {
        var s = {};
        s[key + 'Email'] = e.target.value;
        var cur = self.state[key + 'State'] || propState;
        if (cur === 'empty' || cur === 'invalid') s[key + 'State'] = 'default';
        self.setState(s);
      },
      submit: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (busy) return;
        var v = (self.state[key + 'Email'] || '').trim();
        var s = {};
        if (!v) { s[key + 'State'] = 'empty'; self.setState(s); return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { s[key + 'State'] = 'invalid'; self.setState(s); return; }
        s[key + 'State'] = 'submitting'; self.setState(s);
        self.sendSignup(key, v);
      }
    };
  }
  sendSignup(key, email) {
    var self = this;
    var query = new URLSearchParams(window.location.search);
    var payload = { email: email, location: key === 'hero' ? 'hero' : 'closing', company_website: '' };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) { var q = query.get(k); if (q) payload[k] = q; });
    if (key === 'close') {
      var evLabels = ['A renewal', 'Planned treatment', 'A job change', 'Parents\' cover', 'Nothing yet, just getting organised'];
      var polLabels = ['Employer group cover', 'Family floater', 'Parents\' policy', 'Super top-up', 'Not sure'];
      payload.events = evLabels.filter(function (l, i) { return !!self.state.events[i]; });
      payload.policies = polLabels.filter(function (l, i) { return !!self.state.policies[i]; });
      if (self.state.closeName) payload.name = self.state.closeName;
    }
    var done = function (state, extra) { var d = {}; d[key + 'State'] = state; Object.assign(d, extra || {}); self.setState(d); };
    fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) {
        if (res.status === 400) { done('invalid'); return; }
        if (!res.ok) { done('server'); return; }
        window.dispatchEvent(new CustomEvent('knowvia:lead'));
        var mode = self.state.mode || self.props.closingMode || 'write';
        if (key === 'close' && mode === 'voice' && self.state.voice === 'recorded' && self.audioBlob) {
          var form = new FormData();
          form.append('email', email);
          form.append('consent', 'yes');
          form.append('duration', String(self.state.voiceSecs || 0));
          form.append('audio', self.audioBlob, 'voice-note.webm');
          return fetch('/api/voice-note', { method: 'POST', body: form })
            .then(function (r) { done('success', { voiceSaved: r.ok }); })
            .catch(function () { done('success', { voiceSaved: false }); });
        }
        done('success');
      })
      .catch(function () { done('network'); });
  }
  renderVals() {
    var self = this;
    var menuOpen = this.state.menu != null ? this.state.menu : !!this.props.mobileMenuOpen;
    var inr = function (v) { return Math.round(v).toLocaleString('en-IN'); };

    // hero: a sample policy you can ask
    var B = { covered: 'Covered', unclear: 'Not confirmed', gap: 'Not covered', next: 'Next step' };
    var qa = [
      { q: 'Is Maa’s cataract surgery covered?', k: 'covered', a: 'Yes. Cataract has a 2-year wait. Your policy began March 2024, so Maa is clear from March 2026.', c: 'Page 11 · clause 4.2', t: '“Cataract: 24 months of continuous coverage.”' },
      { q: 'Which hospital room can we take?', k: 'unclear', a: 'The schedule lists no room-rent limit. Ask the TPA before admission. A bigger room can cut the whole claim.', c: 'Schedule · page 2', t: 'No room category or daily cap is stated.' },
      { q: 'Is my brother on this policy?', k: 'gap', a: 'No. This floater covers you and Maa only. Add his employer policy and we will check it too.', c: 'Page 1 · insured persons', t: '“Insured: Self, Mother.”' },
      { q: 'What do we do on admission day?', k: 'next', a: 'Call the TPA helpline, give the policy number and ask for cashless pre-authorisation.', c: 'Page 3 · claims procedure', t: '“Intimate the TPA within 24 hours of admission.”' }
    ];
    var askIdx = this.state.askIdx || 0;
    var custom = this.state.askText;
    var cur = custom ? { q: custom, k: 'next', a: 'When Knowvia opens, it answers this from your own policy, with the page and line it comes from. If the policy does not say, we tell you that too.', c: 'Your policy · the exact page', t: 'Join the early list to try it first.' } : qa[askIdx];
    var autoOn = !!this.askAuto;
    var ask = {
      q: cur.q, a: cur.a, c: cur.c, t: cur.t, badge: custom ? 'Not open yet' : B[cur.k], badgeCls: 'kv-badge kv-b-' + cur.k,
      typing: this.state.askPhase === 'typing', ready: this.state.askPhase !== 'typing',
      status: autoOn ? 'Playing sample questions' : 'Tap a question, or ask your own',
      toggleLabel: autoOn ? 'Pause' : 'Play',
      chips: qa.map(function (x, i) {
        var on = !custom && i === askIdx;
        return { q: x.q, pressed: on ? 'true' : 'false', timerCls: 'kv-timer' + (on && autoOn && self.state.askPhase !== 'typing' ? ' kv-timer-run' : ''), pick: function () { self.askAuto = false; self.askGo(i); } };
      }),
      setText: function (e) { self.setState({ askDraft: e.target.value }); },
      submit: function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var text = (self.state.askDraft || '').trim();
        if (!text) return;
        self.askAuto = false;
        var low = text.toLowerCase();
        var hit = /cataract|eye/.test(low) ? 0 : /room|rent|ward/.test(low) ? 1 : /brother|sister|who|family|covered\?/.test(low) ? 2 : /admi|hospital|cashless|emergency|tpa/.test(low) ? 3 : -1;
        if (hit >= 0) self.askGo(hit); else self.askGo(askIdx, text);
        if (e && e.target && e.target.reset) e.target.reset();
        self.setState({ askDraft: '' });
      },
      toggle: function () {
        self.askAuto = !self.askAuto;
        clearTimeout(self.timers.askNext);
        if (self.askAuto) self.askGo(custom ? 0 : (askIdx + 1) % 4); else self.setState({});
      }
    };
    var terms = ['Room rent limit', 'Co-pay', 'Waiting period', 'Sub-limit', 'Deductible', 'Network hospital', 'Pre-existing disease', 'Cashless claim', 'Portability', 'Restoration benefit', 'No-claim bonus', 'Day-care procedure'];
    var defs = [
      ['The most your policy pays per day for a hospital room. Pick a pricier room and other charges can be cut too.', 'Room rent: up to 1% of sum insured per day.'],
      ['A fixed share of every claim that you pay yourself, such as 10% or 20%.', 'A co-payment of 20% applies to each admissible claim.'],
      ['How long you must hold the policy before some illnesses or treatments are covered.', 'Listed conditions are covered after 24 months.'],
      ['A cap on what the policy pays for one treatment, such as cataract, even when your cover is higher.', 'Cataract: up to ₹40,000 per eye.'],
      ['The amount you pay first, before the policy starts paying.', 'Aggregate deductible: ₹3,00,000 per policy year.'],
      ['A hospital tied up with your insurer or TPA, where a cashless claim is possible.', 'Cashless is available only at network hospitals.'],
      ['A condition you had before buying the policy. Usually covered only after a waiting period.', 'Pre-existing diseases are covered after 36 months.'],
      ['The insurer pays the hospital directly, after it approves the treatment.', 'Pre-authorisation is required for cashless treatment.'],
      ['Moving your policy to another insurer while keeping credit for waiting periods already served.', 'Apply at least 45 days before renewal.'],
      ['Cover that refills after you use it up within the policy year, within its rules.', 'Sum insured is restored once per policy year.'],
      ['Extra cover added for each year without a claim.', 'Cumulative bonus of 10% per claim-free year.'],
      ['Treatment that needs less than 24 hours in hospital and is still covered.', 'Day-care procedures are covered as listed in the annexure.']
    ];
    var tones = [['#0F4A3A', '#FFFFFF', '#0F4A3A'], ['#C8E6A0', '#0F4A3A', '#C8E6A0'], ['#FFFFFF', '#163F42', '#163F42'], ['#163F42', '#FFFFFF', '#163F42'], ['#CDEBE5', '#163F42', '#CDEBE5'], ['#A8DCCB', '#0F4A3A', '#A8DCCB']];
    var termIdx = this.state.termIdx || 0;
    var clauses = terms.map(function (t, i) {
      var tone = tones[i % tones.length];
      return {
        label: t, pressed: i === termIdx ? 'true' : 'false',
        pick: function () { self.setState({ termIdx: i }); },
        style: 'background:' + tone[0] + ';color:' + tone[1] + ';border:1.5px solid ' + tone[2],
        markStyle: 'flex:0 0 auto;width:9px;height:9px;transform:rotate(45deg);background:currentColor;opacity:0.55'
      };
    });
    var term = {
      name: terms[termIdx], def: defs[termIdx][0], ex: '“' + defs[termIdx][1] + '”',
      pos: ('0' + (termIdx + 1)).slice(-2) + ' of ' + terms.length,
      prev: function () { self.setState({ termIdx: (termIdx + terms.length - 1) % terms.length }); },
      next: function () { self.setState({ termIdx: (termIdx + 1) % terms.length }); }
    };
    var ticker = terms.concat(terms);
    var hsTones = [['#163F42', '#FFFFFF'], ['#C8E6A0', '#0F4A3A'], ['#FFFFFF', '#163F42'], ['#176F69', '#FFFFFF'], ['#CDEBE5', '#163F42'], ['#FBF1DD', '#7A5207']];
    var hsCards = [0, 1, 2, 3, 4, 6].map(function (t, i) {
      return { n: '0' + (i + 1), name: terms[t], def: defs[t][0], ex: '“' + defs[t][1] + '”', style: 'background:' + hsTones[i][0] + ';color:' + hsTones[i][1] };
    });
    var oldWay = [
      ['Room rent', 'You learn the room limit when the bill arrives.'],
      ['Who is covered', 'You are not sure who is still on the family policy.'],
      ['Cash', 'You look for an ATM while the admission waits.'],
      ['Leaving a job', 'You get an end date. Nobody tells you how to keep your cover.'],
      ['Buying more', 'A relative says the top-up is cheap.']
    ].map(function (r) { return { moment: r[0], text: r[1] }; });
    var newWay = [
      ['Room rent', 'You see the room limit, and its page, before you choose a room.'],
      ['Who is covered', 'Every person has a row: known, not confirmed, or missing.'],
      ['Cash', 'You know how much cash to keep ready, and why.'],
      ['Leaving a job', 'The deadline to keep your cover is already on your page.'],
      ['Buying more', 'You see what the top-up adds, and what it does not.']
    ].map(function (r) { return { moment: r[0], text: r[1] }; });
    var ways = oldWay.map(function (r, i) { return { moment: r.moment, old: r.text, new: newWay[i].text }; });

    // numbers: the statement in view picks the chart
    var numStep = this.state.numStep || 0;
    var nf = { bars: [0, 1, 2, 3].map(function (i) { return i <= numStep ? 'kv-on' : ''; }) };
    [0, 1, 2, 3].forEach(function (i) { nf['f' + i] = 'kv-frame' + (i === numStep ? ' kv-on' : ''); nf['s' + i] = 'kv-step' + (i === numStep ? ' kv-on' : ''); });
    var nidx = [['Claims cut or rejected', '44%'], ['Rejected in one year', '₹26,037 cr'], ['Longest discharge wait', '48 h'], ['Paid from own pocket', '43%']].map(function (x, i) {
      return { k: '0' + (i + 1), label: x[0], v: x[1], cur: i === numStep ? 'true' : 'false', go: function () { var el = document.querySelector('[data-step="' + i + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); self.setState({ numStep: i }); } };
    });
    var people = [];
    for (var q = 0; q < 10; q++) people.push({ cls: 'kv-person' + (q < 4 ? ' kv-hit' : ''), delay: 'transition-delay:' + (q < 4 ? 300 + q * 220 : 0) + 'ms' });
    var grid = [];
    for (var gi = 0; gi < 100; gi++) grid.push({ cls: 'kv-cell' + (gi < 43 ? ' kv-cell-hit' : ''), style: 'transition-delay:' + (gi < 43 ? 200 + gi * 20 : 0) + 'ms' });

    // film
    var filmC = this.state.filmC || 0, playing = !!this.state.filmPlaying;
    var chapData = [['Add your policy', 'A PDF of your schedule. Employer cover, floater, top-up.'], ['It reads every page', 'Every clause, person by person.'], ['Gaps get flagged', 'Unclear stays unclear. Never guessed.'], ['You get answers', 'Covered, not confirmed, next step.']];
    var film = {
      c: String(filmC), playing: playing, paused: !playing, label: playing ? 'Pause the example' : 'Play the example',
      time: '0:' + ('0' + filmC * 5).slice(-2) + ' / 0:20',
      toggle: function () { self.filmPlay(!self.state.filmPlaying); },
      chaps: chapData.map(function (ch, i) {
        var cls = 'kv-cbar' + (i < filmC ? ' kv-cbar-full' : i === filmC && (playing || self.filmLeft) ? ' kv-cbar-run' + (playing ? '' : ' kv-cbar-hold') : '');
        return {
          n: String(i + 1), title: ch[0], text: ch[1], cur: i === filmC ? 'step' : 'false', barCls: cls,
          numStyle: 'font-family:var(--font-display,Newsreader),Georgia,serif;font-size:26px;line-height:1;color:' + (i === filmC ? '#0F4A3A' : '#7B918E'),
          go: function () { self.filmLeft = 5000; self.setState({ filmC: i }); self.filmPlay(true); }
        };
      })
    };

    // room test
    var LIMIT = 5000, NIGHTS = 4, LINKED = 160000, MEDS = 40000;
    var rate = this.state.roomRate || 8000;
    var bill = rate * NIGHTS + LINKED + MEDS, ratio = rate > LIMIT ? LIMIT / rate : 1;
    var oop = rate > LIMIT ? (rate - LIMIT) * NIGHTS + LINKED * (1 - ratio) : 0, paid = bill - oop;
    var setRate = function (v) { self.setState({ roomRate: v }); var el = document.getElementById('room-range'); if (el && +el.value !== v) el.value = String(v); };
    var room = {
      rateShown: '₹' + inr(rate), oop: '₹' + inr(oop), paid: '₹' + inr(paid), roomCost: '₹' + inr(rate * NIGHTS), cut: oop ? '− ₹' + inr(oop) : '₹0',
      oopStyle: 'position:relative;margin:0;color:' + (oop ? '#F6D38A' : '#C8E6A0'),
      paidBar: 'background:#A8DCCB;width:' + (paid / bill * 100).toFixed(2) + '%',
      oopBar: 'width:' + (oop / bill * 100).toFixed(2) + '%',
      verdict: oop ? 'Over the limit, so every room-linked charge is cut by ' + Math.round((1 - ratio) * 100) + '%. Not just the room.' : 'Within your limit. Room-linked charges are paid in full.',
      setRate: function (e) { setRate(+e.target.value); },
      types: [['Ward', 3000], ['Twin', 5000], ['Single AC', 8000], ['Deluxe', 12000]].map(function (t) {
        return { name: t[0], rate: '₹' + inr(t[1]) + '/day', pressed: t[1] === rate ? 'true' : 'false', pick: function () { setRate(t[1]); } };
      })
    };

    // stories
    var seen = this.state.storySeen || {};
    var hs = {};
    [0, 1, 2, 3].forEach(function (i) { hs['p' + i] = seen[i] ? 'kv-on' : ''; });
    var hours = [];
    for (var hh = 0; hh < 7; hh++) hours.push('transition-delay:' + (200 + hh * 160) + 'ms');
    var days = [];
    for (var d = 1; d <= 17; d++) {
      var last = d === 17;
      days.push({ label: last ? '✕' : '', cls: 'kv-day' + (last ? ' kv-day-x' : ''), style: last ? '' : 'transition-delay:' + (150 + d * 60) + 'ms' });
    }
    var docs = [];
    var bad = [1, 4, 6, 9, 12, 15, 17];
    for (var k = 0; k < 19; k++) {
      var mism = bad.indexOf(k) >= 0;
      docs.push({ style: 'width:22px;height:28px;border-radius:4px;box-sizing:border-box;' + (mism ? 'background:#FFFFFF;border:2px dashed #7A5207;' : 'background:#163F42;') });
    }

    // privacy switches
    var pv = this.state.priv || {};
    var privData = [['Cover amount', 'Sum insured and who it covers', '₹5,00,000 floater'], ['Policy details', 'Policy number, TPA, desk contact', 'Policy no. and TPA contact'], ['Medical details', 'Declared conditions', 'Declared conditions']];
    var hiddenCount = privData.filter(function (r, i) { return !pv[i]; }).length;
    var priv = {
      rows: privData.map(function (r, i) {
        return {
          id: 'share-' + i, label: r[0], hint: r[1], shown: r[2], onStr: pv[i] ? 'true' : 'false',
          valCls: 'kv-fv' + (pv[i] ? '' : ' kv-fv-hidden'),
          toggle: function () { var nx = Object.assign({}, self.state.priv); nx[i] = !nx[i]; self.setState({ priv: nx }); }
        };
      }),
      lock: hiddenCount ? hiddenCount + (hiddenCount === 1 ? ' thing stays' : ' things stay') + ' private. Your brother sees a blur.' : 'Everything is shared.'
    };

    var pSeen = this.state.promiseSeen || {};
    var promises = [
      ['Promise a claim', 'Only your insurer decides a claim. We show which clauses apply and what is still open.'],
      ['Guess', 'A fact we cannot find stays marked Not confirmed until someone who knows confirms it.'],
      ['Push a policy', 'Sometimes the right answer is to buy nothing yet. We will say so.'],
      ['Show medical details', 'Not to anyone, unless that person chose to share them.'],
      ['Replace your insurer', 'We are not your insurer, TPA or hospital desk. We help you ask them better questions.']
    ].map(function (p, i) { return { term: p[0], text: p[1], num: '0' + (i + 1), i: String(i), cls: 'kv-pl' + (pSeen[i] ? ' kv-on' : '') }; });
    var faqData = [
      ['When can I use it, and what will it cost?', 'Knowvia is not open yet, and pricing is not set. Join the early list and you will hear about both first.'],
      ['Is this only for health insurance?', 'Yes. Knowvia reads health insurance only: employer group cover, personal and family floater policies, parents\' and senior citizen policies, and top-ups. Not motor, not life.'],
      ['Is Knowvia an insurance company?', 'No. Knowvia does not sell or underwrite insurance, and it does not decide claims. It reads the health policies you already have and shows what they say.'],
      ['Will you sell me a policy?', 'Not by default. Many questions end with a clear answer and nothing to buy. If buying something does make sense, we will explain why and what it costs.'],
      ['Can Knowvia tell me if a claim will be approved?', 'No. Only your insurer decides that. We show which clauses apply, what is not confirmed, and which documents to have ready.'],
      ['What should I do in an emergency?', 'Get treatment first. Insurance should never delay care. Call the hospital\'s insurance desk, your insurer or your TPA. Knowvia does not run an emergency line.'],
      ['Does it work with my employer\'s group health policy?', 'Yes. Add the benefits booklet or schedule your HR shares. Knowvia reads it next to your personal and parents\' policies, person by person.'],
      ['Do I need all my documents to start?', 'No. Start with one. Knowvia shows what is missing, and exactly which page to ask your insurer, HR or family for.'],
      ['How is my data kept safe?', 'Your documents are encrypted, and each adult controls who sees what. We do not sell your data.'],
      ['Who can see my family\'s information?', 'Each adult decides for their own record: the cover amount, the policy details and any medical details, separately. Medical details stay private unless that person shares them.']
    ];
    var openIdx = this.state.faqOpen;
    var faqs = faqData.map(function (f, i) {
      var open = openIdx === i;
      return {
        question: f[0], answer: f[1], open: open, openStr: open ? 'true' : 'false', panelId: 'faq-answer-' + i,
        boxStyle: 'border-radius:16px;transition:background-color 240ms ease-out;' + (open ? 'background:#FFFFFF;box-shadow:0 12px 30px rgba(22,62,54,0.08);' : 'background:#E6EFEC;'),
        iconStyle: 'flex:0 0 auto;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform 240ms cubic-bezier(0.165,0.84,0.44,1),background-color 240ms;transform:rotate(' + (open ? 45 : 0) + 'deg);' + (open ? 'background:#163F42;color:#FFFFFF;' : 'background:#FFFFFF;color:#163F42;'),
        toggle: function () { self.setState({ faqOpen: open ? -1 : i }); }
      };
    });
    var faqGroups = [['All questions', null], ['Getting started', [0, 6, 7]], ['What it does', [1, 2, 3, 4, 5]], ['Your data', [8, 9]]];
    var faqTab = this.state.faqTab || 0;
    var faqTabs = faqGroups.map(function (g, i) { return { label: g[0], pressed: i === faqTab ? 'true' : 'false', pick: function () { self.setState({ faqTab: i }); } }; });
    var faqList = faqGroups[faqTab][1] ? faqGroups[faqTab][1].map(function (i) { return faqs[i]; }) : faqs;
    var optBase = 'display:flex;align-items:center;gap:12px;min-height:48px;padding:0 12px;border:0;border-radius:8px;background:transparent;text-align:left;font:inherit;font-size:17px;color:#1A3034;cursor:pointer;';
    var boxBase = 'flex:0 0 auto;width:22px;height:22px;border-radius:6px;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;';
    var polLabels = ['Employer group cover', 'Family floater', 'Parents\' policy', 'Super top-up', 'Not sure'];
    var policies = polLabels.map(function (label, i) {
      var isOn = !!self.state.policies[i];
      return {
        label: label, isOn: isOn, on: isOn ? 'true' : 'false',
        style: optBase + (isOn ? 'font-weight:600;color:#163F42;' : ''),
        boxStyle: boxBase + (isOn ? 'background:#176F69;border:2px solid #176F69;color:#FFFFFF;' : 'background:#FFFFFF;border:2px solid #7B918E;'),
        toggle: function () { var pp = Object.assign({}, self.state.policies); pp[i] = !pp[i]; self.setState({ policies: pp }); }
      };
    });
    var chosen = polLabels.filter(function (l, i) { return !!self.state.policies[i]; });
    var msOpen = !!this.state.msOpen;
    var ms = {
      open: msOpen, openStr: msOpen ? 'true' : 'false',
      summary: chosen.length === 0 ? 'Choose any that apply' : chosen.length <= 2 ? chosen.join(', ') : chosen.length + ' policies chosen',
      buttonStyle: 'display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;height:52px;box-sizing:border-box;padding:0 14px 0 16px;border-radius:12px;background:#FFFFFF;font:inherit;font-size:17px;text-align:left;cursor:pointer;' + (msOpen ? 'border:2px solid #163F42;' : 'border:1px solid #7B918E;'),
      valueStyle: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (chosen.length ? 'color:#1A3034;font-weight:600;' : 'color:#55696D;'),
      chevronStyle: 'flex:0 0 auto;color:#163F42;transition:transform 200ms ease-out;transform:rotate(' + (msOpen ? 180 : 0) + 'deg)',
      toggle: function () { self.setState({ msOpen: !msOpen }); }
    };
    var mode = this.props.voiceEnabled ? (this.state.mode || this.props.closingMode || 'write') : 'write';
    var closeModel = this.formModel('close', this.props.closingFormState);
    var tab = 'flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:0;border-radius:9px;font:inherit;font-size:16px;font-weight:600;cursor:pointer;';
    var voice = this.state.voice || this.props.closingVoiceState || 'idle';
    var secs = this.state.voiceSecs != null ? this.state.voiceSecs : (voice === 'recording' ? 18 : voice === 'recorded' ? 42 : 0);
    var consent = this.state.consent != null ? this.state.consent : voice !== 'idle';
    var fmt = function (v) { return Math.floor(v / 60) + ':' + ('0' + (v % 60)).slice(-2); };
    var heights = [10, 18, 26, 14, 30, 22, 34, 16, 24, 32, 12, 28, 20, 36, 18, 26, 14, 30, 22, 12, 28, 34, 16, 24, 20, 32, 14, 26, 18, 30, 12, 22];
    var playedBars = voice === 'recorded' ? Math.round(heights.length * ((this.state.playPos || 0))) : 0;
    var bars = heights.map(function (h, i) {
      var st = 'display:block;flex:1 1 0;max-width:6px;border-radius:3px;height:' + h + 'px;';
      if (voice === 'idle') return { style: st + 'height:4px;background:#CFDCDA;' };
      if (voice === 'recording') return { style: st + 'background:#176F69;transform-origin:center;animation:kvBar ' + (700 + (i % 5) * 120) + 'ms ease-in-out ' + (i * 45) + 'ms infinite;' };
      return { style: st + 'background:' + (i < playedBars ? '#176F69' : '#7B918E') + ';' };
    });
    var stopRec = function () {
      clearInterval(self.recTick);
      if (self.recorder && self.recorder.state !== 'inactive') self.recorder.stop();
      else self.setState({ voice: 'recorded', playPos: 0 });
    };
    var vn = {
      isIdle: voice === 'idle', isRec: voice === 'recording', isDone: voice === 'recorded',
      consentOn: consent, consentOff: !consent,
      lockedStr: consent ? 'false' : 'true',
      micStyle: 'flex:0 0 auto;width:60px;height:60px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;' + (consent ? 'background:#176F69;color:#FFFFFF;' : 'background:#E6EFEC;color:#55696D;'),
      status: this.state.voiceError ? this.state.voiceError : voice === 'idle' ? (consent ? 'Tap to record' : 'Tick the box below to record') : voice === 'recording' ? 'Recording' : 'Voice note ready',
      time: voice === 'idle' ? '0:00 / 1:00' : voice === 'recording' ? fmt(secs) + ' / 1:00' : fmt(secs),
      bars: bars,
      playing: !!this.state.playing, paused: !this.state.playing,
      playLabel: this.state.playing ? 'Pause voice note' : 'Play voice note',
      toggleConsent: function () { self.setState({ consent: !consent }); },
      start: function () {
        if (!consent) return;
        if (!navigator.mediaDevices || !window.MediaRecorder) { self.setState({ voiceError: 'Voice notes do not work in this browser. Switch to Write it.' }); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          var chunks = [];
          var rec = new MediaRecorder(stream);
          self.recorder = rec;
          rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            self.audioBlob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            if (self.audioUrl) URL.revokeObjectURL(self.audioUrl);
            self.audioUrl = URL.createObjectURL(self.audioBlob);
            self.setState({ voice: 'recorded', playPos: 0 });
          };
          rec.start();
          self.setState({ voice: 'recording', voiceSecs: 0, voiceError: '' });
          clearInterval(self.recTick);
          self.recTick = setInterval(function () {
            var v = (self.state.voiceSecs || 0) + 1;
            self.setState({ voiceSecs: Math.min(v, 60) });
            if (v >= 60) stopRec();
          }, 1000);
        }).catch(function () {
          self.setState({ voiceError: 'We could not use your microphone. Allow it in your browser, or switch to Write it.' });
        });
      },
      stop: stopRec,
      redo: function () {
        clearInterval(self.recTick);
        if (self.player) self.player.pause();
        self.audioBlob = null;
        self.setState({ voice: 'idle', voiceSecs: 0, playing: false, playPos: 0 });
      },
      play: function () {
        if (!self.audioUrl) return;
        if (!self.player) {
          self.player = new Audio();
          self.player.ontimeupdate = function () { var d = self.player.duration; self.setState({ playPos: d && isFinite(d) ? self.player.currentTime / d : 0 }); };
          self.player.onended = function () { self.setState({ playing: false, playPos: 1 }); };
        }
        if (self.state.playing) { self.player.pause(); self.setState({ playing: false }); return; }
        if (self.player.src !== self.audioUrl) self.player.src = self.audioUrl;
        self.player.play();
        self.setState({ playing: true });
      }
    };
    var emailInvalid = closeModel.invalid === 'true';
    var cm = {
      isWrite: mode === 'write', isVoice: mode === 'voice',
      isWriteStr: mode === 'write' ? 'true' : 'false', isVoiceStr: mode === 'voice' ? 'true' : 'false',
      writeStyle: tab + (mode === 'write' ? 'background:#FFFFFF;color:#163F42;box-shadow:0 1px 2px rgba(22,62,54,0.12),inset 0 0 0 2px #163F42;' : 'background:transparent;color:#55696D;'),
      voiceStyle: tab + (mode === 'voice' ? 'background:#FFFFFF;color:#163F42;box-shadow:0 1px 2px rgba(22,62,54,0.12),inset 0 0 0 2px #163F42;' : 'background:transparent;color:#55696D;'),
      showTabs: !!this.props.voiceEnabled,
      setName: function (e) { self.setState({ closeName: e.target.value }); },
      setWrite: function () { self.setState({ mode: 'write' }); },
      setVoice: function () { self.setState({ mode: 'voice' }); },
      emailStyle: 'height:52px;box-sizing:border-box;padding:0 16px;border-radius:12px;background:#FFFFFF;font:inherit;font-size:17px;color:#1A3034;' + (emailInvalid ? 'border:2px solid #A74335;' : 'border:1px solid #0F4A3A;'),
      buttonLabel: closeModel.busy ? 'Joining' : (mode === 'voice' && voice === 'recorded' ? 'Send voice note and join' : closeModel.buttonLabel),
      successExtra: mode === 'voice' && voice === 'recorded' ? (this.state.voiceSaved === false ? 'Your voice note did not upload, but your email is saved.' : 'We have your voice note too.') : ''
    };
    var pi = this.state.pInd != null ? this.state.pInd : 1;
    var ps = this.state.pSto != null ? this.state.pSto : 1;
    var n = { claims: Math.round(44 * pi) + '%', crore: '₹' + inr(26037 * pi) + ' cr', hours: Math.round(48 * pi) + ' hours', oop: Math.round(43 * pi) + '%' };
    var st = { a: '₹' + inr(80000 * ps), b: '₹' + inr(200000 * ps), c: Math.round(7 * ps) + ' hours', d: Math.round(17 * ps) + ' days', e: Math.round(7 * ps) + ' of 19' };
    var railIdx = this.state.railIdx;
    var rail = {
      show: this.state.railShow ? 'true' : 'false',
      items: [['#how', 'Watch it work'], ['#clauses', 'The clauses'], ['#desk', 'Two ways'], ['#try', 'Room test'], ['#promises', 'Our promise'], ['#questions', 'Questions'], ['#research', 'Our research'], ['#partners', 'For business']].map(function (r, i) {
        return { href: r[0], label: r[1], cur: i === railIdx ? 'true' : 'false' };
      })
    };
    var dockOpen = !!this.state.dockOpen;
    var dock = {
      openStr: dockOpen ? 'true' : 'false',
      awayStr: this.state.dockAway ? 'true' : 'false',
      label: dockOpen ? 'Close' : 'Explore',
      toggle: function () { self.dockSet(!dockOpen); },
      close: function () { if (self.state.dockOpen) self.dockSet(false); },
      items: rail.items.map(function (r, i) { return { href: r.href, label: r.label, n: ('0' + (i + 1)).slice(-2) }; })
    };
    var promiseCount = Object.keys(pSeen).length;
    return {
      n: n,
      st: st,
      hero: this.formModel('hero', this.props.heroFormState),
      close: closeModel,
      cm: cm,
      vn: vn,
      policies: policies,
      ms: ms,
      ask: ask,
      ticker: ticker,
      hsCards: hsCards,
      nf: nf,
      nidx: nidx,
      clauses: clauses,
      term: term,
      film: film,
      room: room,
      hs: hs,
      hours: hours,
      priv: priv,
      rail: rail,
      dock: dock,
      promiseCount: String(promiseCount),
      flowCls: 'kv-vline' + (this.state.flowIn ? ' kv-on' : ''),
      menuOpen: menuOpen,
      menuOpenStr: menuOpen ? 'true' : 'false',
      toggleMenu: function () { self.setState({ menu: !menuOpen }); },
      people: people,
      grid: grid,
      oldWay: oldWay,
      newWay: newWay,
      ways: ways,
      days: days,
      docs: docs,
      promises: promises,
      faqs: faqs,
      faqTabs: faqTabs,
      faqList: faqList
    };
  }
}
