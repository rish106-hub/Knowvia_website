// Generated from Main.dc.html, then wired to /api/waitlist and the microphone (see scripts/design-port/README.md).
/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */
import { DCLogic } from "@/lib/dc-logic";

export class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { faqOpen: 0, events: {}, policies: {} };
    this.timers = {};
    this.raf = {};
    this.done = {};
  }
  componentDidMount() {
    var self = this;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
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
    this.io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !self.done[en.target.id]) {
          self.done[en.target.id] = true;
          run(en.target.id === 'industry' ? 'pInd' : 'pSto');
        }
      });
    }, { threshold: 0.2 });
    ['industry', 'stories'].forEach(function (id) { var el = document.getElementById(id); if (el) self.io.observe(el); });
    var track = document.getElementById('stats-track');
    if (track) {
      this.track = track;
      var onScroll = function () {
        var max = track.scrollWidth - track.clientWidth;
        self.setState({ statPos: max > 0 ? track.scrollLeft / max : 0 });
      };
      var hold = function () { self.paused = true; };
      var release = function () { self.paused = false; };
      track.addEventListener('scroll', onScroll, { passive: true });
      track.addEventListener('pointerenter', hold);
      track.addEventListener('pointerleave', release);
      track.addEventListener('focusin', hold);
      track.addEventListener('focusout', release);
      track.addEventListener('touchstart', hold, { passive: true });
      this.auto = setInterval(function () {
        if (self.paused || document.hidden) return;
        self.stepStats(1, true);
      }, 3800);
    }
  }
  stepStats(dir, wrap) {
    var t = this.track || document.getElementById('stats-track');
    if (!t) return;
    var card = t.querySelector('article');
    var step = card ? card.getBoundingClientRect().width + 24 : 480;
    var max = t.scrollWidth - t.clientWidth;
    if (wrap && dir > 0 && t.scrollLeft >= max - 8) { t.scrollTo({ left: 0, behavior: 'smooth' }); return; }
    t.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
  componentDidUpdate(prev) {
    var reset = {};
    if (prev.heroFormState !== this.props.heroFormState) reset.heroState = null;
    if (prev.closingFormState !== this.props.closingFormState) reset.closeState = null;
    if (prev.privacyViewer !== this.props.privacyViewer) reset.viewer = null;
    if (prev.mobileMenuOpen !== this.props.mobileMenuOpen) reset.menu = null;
    if (prev.closingMode !== this.props.closingMode) reset.mode = null;
    if (prev.closingVoiceState !== this.props.closingVoiceState) { reset.voice = null; reset.voiceSecs = null; }
    if (Object.keys(reset).length) this.setState(reset);
  }
  componentWillUnmount() {
    Object.keys(this.timers).forEach(function (k) { clearTimeout(this.timers[k]); }, this);
    Object.keys(this.raf).forEach(function (k) { cancelAnimationFrame(this.raf[k]); }, this);
    if (this.io) this.io.disconnect();
    if (this.auto) clearInterval(this.auto);
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
    var viewer = this.state.viewer || this.props.privacyViewer || 'family';
    var menuOpen = this.state.menu != null ? this.state.menu : !!this.props.mobileMenuOpen;
    var seg = 'flex:1 1 0;min-height:44px;border:0;border-radius:9px;font:inherit;font-size:16px;font-weight:600;cursor:pointer;';
    var on = seg + 'background:#FFFFFF;color:#163F42;box-shadow:inset 0 0 0 2px #163F42;';
    var off = seg + 'background:transparent;color:#55696D;';
    var terms = ['Room rent limit', 'Co-pay', 'Waiting period', 'Sub-limit', 'Deductible', 'Network hospital', 'Pre-existing disease', 'Cashless claim', 'Portability', 'Restoration benefit', 'No-claim bonus', 'Day-care procedure'];
    var termsLoop = terms.concat(terms).map(function (t, i) { return { label: t, hidden: i >= terms.length ? 'true' : 'false', cls: i >= terms.length ? 'kv-dup' : '' }; });
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
    var days = [];
    for (var d = 1; d <= 17; d++) {
      var last = d === 17;
      days.push({
        label: last ? '17' : '',
        style: 'width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;' + (last ? 'background:#FBF1DD;border:2px dashed #7A5207;color:#7A5207;box-sizing:border-box;' : 'background:#163F42;opacity:' + (0.35 + d * 0.035).toFixed(2) + ';')
      });
    }
    var docs = [];
    for (var k = 0; k < 19; k++) {
      var mism = k % 3 === 1 && k < 21;
      docs.push({ style: 'width:22px;height:28px;border-radius:4px;box-sizing:border-box;' + (mism ? 'background:#FFFFFF;border:2px dashed #7A5207;' : 'background:#163F42;') });
    }
    var people = [];
    for (var q = 0; q < 10; q++) {
      var hit = q < 4;
      people.push({ fill: hit ? '#C8E6A0' : 'rgba(168,220,203,0.35)', style: 'animation:kvPop 360ms cubic-bezier(0.165,0.84,0.44,1) ' + (q * 60) + 'ms both' });
    }
    var grid = [];
    for (var gi = 0; gi < 100; gi++) {
      grid.push({ style: 'display:block;aspect-ratio:1/1;border-radius:3px;background:' + (gi < 43 ? '#C8E6A0' : 'rgba(168,220,203,0.22)') });
    }
    var promises = [
      ['Promise a claim', 'Only your insurer decides a claim. We show which clauses apply and what is still open.'],
      ['Guess', 'A fact we cannot find stays marked Not confirmed until someone who knows confirms it.'],
      ['Push a policy', 'Sometimes the right answer is to buy nothing yet. We will say so.'],
      ['Show medical details', 'Not to anyone, unless that person chose to share them.'],
      ['Replace your insurer', 'We are not your insurer, TPA or hospital desk. We help you ask them better questions.']
    ].map(function (p, i) { return { term: p[0], text: p[1], num: '0' + (i + 1) }; });
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
    var evLabels = ['A renewal', 'Planned treatment', 'A job change', 'Parents\' cover', 'Nothing yet, just getting organised'];
    var chipBase = 'display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:999px;font:inherit;font-size:16px;font-weight:600;cursor:pointer;';
    var events = evLabels.map(function (label, i) {
      var isOn = !!self.state.events[i];
      return {
        label: label, isOn: isOn, on: isOn ? 'true' : 'false',
        style: chipBase + (isOn ? 'background:#E3F0EE;border:2px solid #176F69;color:#163F42;' : 'background:#FFFFFF;border:1px solid #7B918E;color:#1A3034;'),
        toggle: function () { var ev = Object.assign({}, self.state.events); ev[i] = !ev[i]; self.setState({ events: ev }); }
      };
    });
    var polLabels = ['Employer group cover', 'Family floater', 'Parents\' policy', 'Super top-up', 'Not sure'];
    var policies = polLabels.map(function (label, i) {
      var isOn = !!self.state.policies[i];
      return {
        label: label, isOn: isOn, on: isOn ? 'true' : 'false',
        style: chipBase + (isOn ? 'background:#E3F0EE;border:2px solid #176F69;color:#163F42;' : 'background:#FFFFFF;border:1px solid #7B918E;color:#1A3034;'),
        toggle: function () { var pp = Object.assign({}, self.state.policies); pp[i] = !pp[i]; self.setState({ policies: pp }); }
      };
    });
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
      emailStyle: 'height:52px;box-sizing:border-box;padding:0 16px;border-radius:12px;background:#FFFFFF;font:inherit;font-size:17px;color:#1A3034;' + (emailInvalid ? 'border:2px solid #A74335;' : 'border:1px solid #7B918E;'),
      buttonLabel: closeModel.busy ? 'Joining' : (mode === 'voice' && voice === 'recorded' ? 'Send voice note and join' : closeModel.buttonLabel),
      successExtra: mode === 'voice' && voice === 'recorded' ? (this.state.voiceSaved === false ? 'Your voice note did not upload, but your email is saved.' : 'We have your voice note too.') : ''
    };
    var isYou = viewer === 'you';
    var pi = this.state.pInd != null ? this.state.pInd : 1;
    var ps = this.state.pSto != null ? this.state.pSto : 1;
    var inr = function (v) { return Math.round(v).toLocaleString('en-IN'); };
    var n = { claims: Math.round(44 * pi) + '%', crore: '\u20b9' + inr(26037 * pi) + ' cr', hours: Math.round(48 * pi) + ' hours', oop: '\u20b9' + Math.round(43 * pi) + ' of \u20b9100' };
    var st = { a: '\u20b9' + inr(80000 * ps), b: '\u20b9' + inr(200000 * ps), c: Math.round(7 * ps) + ' hours', d: Math.round(17 * ps) + ' days', e: Math.round(7 * ps) + ' of 19' };
    var pos = this.state.statPos || 0;
    return {
      statBarStyle: 'display:block;height:100%;border-radius:3px;background:#C8E6A0;width:' + Math.max(18, Math.round(pos * 100)) + '%;transition:width 200ms ease-out',
      statPrev: function () { self.paused = true; self.stepStats(-1, false); },
      statNext: function () { self.paused = true; self.stepStats(1, false); },
      n: n,
      st: st,
      hero: this.formModel('hero', this.props.heroFormState),
      close: closeModel,
      cm: cm,
      vn: vn,
      policies: policies,
      menuOpen: menuOpen,
      menuOpenStr: menuOpen ? 'true' : 'false',
      toggleMenu: function () { self.setState({ menu: !menuOpen }); },
      termsLoop: termsLoop,
      people: people,
      grid: grid,
      oldWay: oldWay,
      newWay: newWay,
      days: days,
      docs: docs,
      promises: promises,
      isYou: isYou,
      isFamily: !isYou,
      isYouStr: isYou ? 'true' : 'false',
      isFamilyStr: isYou ? 'false' : 'true',
      segYouStyle: isYou ? on : off,
      segFamilyStyle: isYou ? off : on,
      panelTitle: isYou ? 'What you see' : 'What your brother sees',
      medValue: isYou ? 'Declared conditions, as on your proposal form' : 'Not shared',
      medColor: isYou ? '#1A3034' : '#55696D',
      viewYou: function () { self.setState({ viewer: 'you' }); },
      viewFamily: function () { self.setState({ viewer: 'family' }); },
      faqs: faqs,
      events: events
    };
  }
}
