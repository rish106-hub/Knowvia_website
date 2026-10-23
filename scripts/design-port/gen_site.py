# Generates the Knowvia website's design components from the approved Claude Design artboards.
import os, re, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from dc2jsx import convert, Ctx

PROJ = sys.argv[1]   # Claude Design project folder (the .dc.html files)
SITE = sys.argv[2]   # Next.js repository root
HEADER = '// Generated from the approved Claude Design artboard {src}. Edit the design, then regenerate with scripts/design-port.\n'

def read(name): return open(os.path.join(PROJ, name), encoding='utf-8').read()
def write(rel, text):
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(text)

BLOBS = {'d5cb06c8c8e1fc0a0e15b59c7d9848d3': 'lightspeed.png', '93aa25bc57d9a125e59a24f174efa2c5': 'insurance-samadhan.png',
         '059f472400fa02700367e16735c0a120': 'irdai.png', '91d2cb88644951b75a2a8fcbadb2400e': 'localcircles.png',
         '9a2b8696a1d51206c59a50d670254089': 'lok-sabha.png', 'edbf1335c75fd8e4d5f7d7f0630ae2d5': 'ministry-of-finance.png',
         'f9a6c8a2c18175956a0442f5c421f7aa': 'ministry-of-health.png'}

def split_css(css):
    """Split a stylesheet into top-level rules: (prelude, body) pairs. Comments are dropped."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, depth, start, cur = [], 0, 0, 0
    for i, ch in enumerate(css):
        if ch == '{':
            if depth == 0: cur = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                out.append((css[start:cur].strip(), css[cur + 1:i].strip())); start = i + 1
    return out

def flat_css(css):
    """Flatten rules to (context, selector, declarations) so identical rules compare equal wherever they were written."""
    flat = []
    for pre, body in split_css(css):
        if pre.startswith('@media') or pre.startswith('@supports'):
            flat += [(pre, p, b) for p, b in split_css(body)]
        else:
            flat.append(('', pre, body))
    return flat

def body_of(src):
    a = src.index('<x-dc>') + 6; b = src.index('</x-dc>')
    s = src[a:b]
    s = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: '/logos/' + BLOBS[m.group(1)], s)
    s = re.sub(r'<helmet>.*?</helmet>', '', s, flags=re.S)
    return s

def script_of(src):
    return re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', src, re.S).group(1)

def imports(ctx, extra='', jsx=''):
    lines = ['"use client";', '']
    if '<img ' in jsx: lines.insert(1, "/* eslint-disable @next/next/no-img-element -- logos keep the design's fixed height with natural width */")
    react = [n for n in ('Fragment',) if n in ctx.uses]
    if react: lines.append(f'import {{ {", ".join(react)} }} from "react";')
    if 'Link' in ctx.uses: lines.append('import Link from "next/link";')
    dc = (['type Any'] if ('v.' in jsx or ': Any' in jsx or 'Any =' in extra) else []) + [n for n in ('css', 'truthy') if n in ctx.uses]
    if dc: lines.append(f'import {{ {", ".join(dc)} }} from "@/lib/dc";')
    if 'site' in ctx.uses: lines.append('import { site } from "@/lib/site";')
    if extra: lines.append(extra)
    return '\n'.join(lines) + '\n\n'

# ---------- Landing page ----------
main_src = read('Main.dc.html')
body = body_of(main_src)
# design-level edits for production wiring
body = body.replace('<input id="close-name" name="given-name" type="text" autocomplete="given-name" style=',
                    '<input id="close-name" name="given-name" type="text" autocomplete="given-name" onChange="{{ cm.setName }}" style=')
tab_start = body.index('<div role="group" aria-label="How do you want to tell us?"')
tab_end = body.index('</div>', body.index('Say it</button>', tab_start)) + 6
body = body[:tab_start] + '<sc-if value="{{ cm.showTabs }}" hint-placeholder-val="{{ true }}">' + body[tab_start:tab_end] + '</sc-if>' + body[tab_end:]

marks = list(re.finditer(r'<!-- (\d+b?)\. ', body))
chunks = {}
for i, m in enumerate(marks):
    end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
    chunks[m.group(1)] = body[m.start():end]
nav = chunks['0'][:chunks['0'].index('</header>') + 9]
nav = re.sub(r'<!--.*?-->', '', nav, flags=re.S)
footer = chunks['13'][:chunks['13'].index('</footer>') + 9]
footer = re.sub(r'<!--.*?-->', '', footer, flags=re.S)
chunks['12'] = chunks['12'].replace('</main>', '')

SECTIONS = [('1', 'HeroSection'), ('2b', 'IndustrySection'), ('3', 'ClauseBand'), ('4', 'ContrastSection'), ('5', 'HowItWorksSection'),
            ('5b', 'RoomTestSection'), ('6', 'FamilyQuote'), ('7', 'StoriesSection'), ('8', 'HouseholdControl'), ('10', 'PartnersSection'),
            ('11', 'QuestionsSection'), ('11b', 'LimitsSection'), ('12', 'EarlyListSection')]
HOME_HREF = {'#privacy-notice': '/privacy', '#terms': '/terms', '#contact': '__MAILTO__'}
for key, name in SECTIONS:
    html = re.sub(r'<!--.*?-->', '', chunks[key], flags=re.S)
    ctx = Ctx(href_map=HOME_HREF)
    jsx = convert(html, ctx)
    write(f'src/components/home/{name}.tsx', HEADER.format(src='Main.dc.html') + imports(ctx, jsx=jsx) +
          (f'export function {name}({{ v }}: {{ v: Any }}) {{\n' if 'v.' in jsx else f'export function {name}() {{\n') + f'  return (\n    <>\n{jsx}    </>\n  );\n}}\n')

ANCHORS = {f'#{a}': f'/#{a}' for a in ('industry', 'how', 'try', 'privacy', 'partners', 'questions', 'early-list', 'top')}
ANCHORS.update({'#privacy-notice': '/privacy', '#terms': '/terms', '#contact': '__MAILTO__'})
ctx = Ctx(href_map=ANCHORS)
jsx = convert(nav, ctx)
write('src/components/layout/SiteNav.tsx', HEADER.format(src='Main.dc.html') + imports(ctx, extra='import { useState } from "react";', jsx='v.') +
      'export function SiteNav() {\n  const [menuOpen, setMenuOpen] = useState(false);\n'
      '  const v: Any = { menuOpen, menuOpenStr: menuOpen ? "true" : "false", toggleMenu: () => setMenuOpen((open) => !open) };\n'
      f'  return (\n    <>\n{jsx}    </>\n  );\n}}\n')
ctx = Ctx(href_map=ANCHORS)
jsx = convert(footer, ctx)
write('src/components/layout/SiteFooter.tsx', HEADER.format(src='Main.dc.html') + imports(ctx, jsx=jsx).replace('"use client";\n', '').replace('import { type Any } from "@/lib/dc";\n', '') +
      f'export function SiteFooter() {{\n  return (\n    <>\n{jsx}    </>\n  );\n}}\n')

# landing model: the artboard's own logic, wired to the real API and microphone
model = script_of(main_src)
write('src/components/home/landing-model.js', '// Generated from Main.dc.html, then wired to /api/waitlist and the microphone (see scripts/design-port/README.md).\n'
      '/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */\nimport { DCLogic } from "@/lib/dc-logic";\n\nexport ' + model.strip() + '\n')

# ---------- Onboarding routes ----------
ONB = [('O1-Start', 'OnboardingStart', '', 'Start with your own cover'),
       ('O2-Event', 'OnboardingComingUp', 'coming-up', 'What is coming up?'),
       ('O3-People', 'OnboardingPeople', 'people', 'Who is in your family’s cover?'),
       ('O4-Sharing', 'OnboardingSharing', 'sharing', 'Choose what you share'),
       ('O5-Upload', 'OnboardingAddPolicies', 'add-policies', 'Add the policies you have'),
       ('O6-Reading', 'OnboardingReading', 'reading', 'Reading your documents'),
       ('O7-Matrix-Mobile', 'OnboardingCoverMobile', None, None),
       ('O7-Matrix-Desktop', 'OnboardingCoverDesktop', None, None)]
LINKS = {'O1-Start.dc.html': '/onboarding', 'O2-Event.dc.html': '/onboarding/coming-up', 'O3-People.dc.html': '/onboarding/people',
         'O4-Sharing.dc.html': '/onboarding/sharing', 'O5-Upload.dc.html': '/onboarding/add-policies', 'O6-Reading.dc.html': '/onboarding/reading',
         'O7-Matrix-Mobile.dc.html': '/onboarding/your-cover', 'O7-Matrix-Desktop.dc.html': '/onboarding/your-cover', 'Extra-States.dc.html': '/onboarding/your-cover',
         '#terms': '/terms', '#privacy': '/privacy'}
if not os.path.exists(os.path.join(PROJ, 'Extra-States.dc.html')):
    print('WARNING: Extra-States.dc.html is not in the artboard folder; links to it are still mapped to /onboarding/your-cover (placeholder target).', file=sys.stderr)

MAIN_RULES = set(flat_css(re.search(r'<style>(.*?)</style>', main_src, re.S).group(1)))
def decls(body): return {d.strip() for d in body.split(';') if d.strip()}
MAIN_DECLS = {}
for _c, _p, _d in MAIN_RULES: MAIN_DECLS.setdefault((_c, _p), set()).update(decls(_d))
def covered(pre, bod):   # same selector in design.css already carries every declaration
    return decls(bod) <= MAIN_DECLS.get(('', pre), set())
MAIN_KEYFRAMES = {pre.split(None, 1)[1].strip(): body for pre, body in split_css(re.search(r'<style>(.*?)</style>', main_src, re.S).group(1)) if pre.startswith('@keyframes')}
ONB_CSS, ONB_KEYFRAMES = [], {}   # artboard-only rules, emitted to design-onboarding.css
for f, name, route, title in ONB:
    src = read(f + '.dc.html')
    b = re.sub(r'<!--.*?-->', '', body_of(src), flags=re.S)
    # artboard <style> blocks: keep only rules that the shared stylesheet does not already have.
    # A keyframes name that exists elsewhere with a different body is renamed for this artboard so the landing page is never changed.
    slug = f.split('-')[0].lower()
    for sm in re.finditer(r'<style>(.*?)</style>', src, re.S):
        for pre, bod in split_css(sm.group(1)):
            if pre.startswith('@keyframes'):
                kname = pre.split(None, 1)[1].strip()
                if MAIN_KEYFRAMES.get(kname) == bod or ONB_KEYFRAMES.get(kname) == bod: continue
                if kname in MAIN_KEYFRAMES or kname in ONB_KEYFRAMES:
                    new = kname + '-' + slug
                    b = re.sub(r'(?<![\w-])' + re.escape(kname) + r'(?![\w-])', new, b)
                    kname, pre = new, '@keyframes ' + new
                ONB_KEYFRAMES[kname] = bod
                ONB_CSS.append(f'{pre}{{{bod}}}')
            elif pre.startswith('@media') or pre.startswith('@supports'):
                inner = [(pre, p, d) for p, d in split_css(bod) if (pre, p, d) not in MAIN_RULES]
                if inner: ONB_CSS.append(pre + '{' + ''.join(f'{p}{{{d}}}' for _, p, d in inner) + '}')
            elif ('', pre, bod) not in MAIN_RULES and not covered(pre, bod):
                ONB_CSS.append(f'{pre}{{{bod}}}')
    desktop = 'Desktop' in f
    root_style = ({'width': '100%', 'minHeight': '100dvh', 'height': 'auto'} if desktop else {'width': '100%', 'maxWidth': '480px', 'minHeight': '100dvh', 'height': 'auto', 'margin': '0 auto'}); root_style.update({'fontSize': '16px', 'lineHeight': 'normal'})
    ctx = Ctx(link_map=LINKS, root_style=root_style)
    jsx = convert(b, ctx, root_style_first=True)
    write(f'src/components/onboarding/{f.lower()}-model.js', f'// Generated from {f}.dc.html.\n' + ('' if 'self = this' not in script_of(src) else '/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */\n') + f'import {{ DCLogic }} from "@/lib/dc-logic";\n\nexport ' + script_of(src).strip() + '\n')
    write(f'src/components/onboarding/{name}.tsx', HEADER.format(src=f + '.dc.html') + imports(ctx, jsx=jsx, extra=f'import {{ useDcModel }} from "@/lib/use-dc-model";\nimport {{ Component as Model }} from "./{f.lower()}-model";') +
          (f'export function {name}() {{\n  const v: Any = useDcModel(Model, {{}});\n' if 'v.' in jsx else f'export function {name}() {{\n  useDcModel(Model, {{}});\n') + f'  return (\n    <>\n{jsx}    </>\n  );\n}}\n')
    if route is not None:
        path = 'src/app/onboarding' + ('/' + route if route else '') + '/page.tsx'
        write(path, f'import type {{ Metadata }} from "next";\nimport {{ {name} }} from "@/components/onboarding/{name}";\n\n'
              f'export const metadata: Metadata = {{ title: {json.dumps(title + " | Onboarding preview", ensure_ascii=False)}, robots: {{ index: false, follow: false }} }};\n\n'
              f'export default function Page() {{\n  return <{name} />;\n}}\n')
write('src/app/onboarding/your-cover/page.tsx', 'import type { Metadata } from "next";\nimport { OnboardingCoverDesktop } from "@/components/onboarding/OnboardingCoverDesktop";\nimport { OnboardingCoverMobile } from "@/components/onboarding/OnboardingCoverMobile";\n\n'
      'export const metadata: Metadata = { title: "Your family’s cover | Onboarding preview", robots: { index: false, follow: false } };\n\n'
      'export default function Page() {\n  return (\n    <>\n      <div className="kv-only-mobile"><OnboardingCoverMobile /></div>\n      <div className="kv-only-desktop"><OnboardingCoverDesktop /></div>\n    </>\n  );\n}\n')

# shared design stylesheet (the artboard <style> block, fonts mapped to next/font variables)
style = re.search(r'<style>(.*?)</style>', main_src, re.S).group(1)
style = re.sub(r"font-family:\s*Newsreader[^;}]*", "font-family:var(--font-display),'Iowan Old Style',Georgia,serif", style)
write('src/app/design.css', '/* Generated from the approved Claude Design artboard Main.dc.html (helmet styles). */\n' + style.strip() +
      '\n.kv-only-mobile{display:none}\n@media (max-width:760px){.kv-only-mobile{display:block}.kv-only-desktop{display:none}}\n')
seen, uniq = set(), []
for r in ONB_CSS:
    if r not in seen: seen.add(r); uniq.append(r)
write('src/app/design-onboarding.css', '/* Generated from the per-artboard <style> blocks of O1-O7 (rules not already in design.css). Imported by src/app/onboarding/layout.tsx only. */\n' + '\n'.join(uniq) + '\n')
print('generated')

# ---------- production wiring of the landing model ----------
mp = os.path.join(SITE, 'src/components/home/landing-model.js')
m = open(mp, encoding='utf-8').read()
def rep(old, new):
    global m
    assert m.count(old) == 1, ('model patch failed', old[:80], m.count(old))
    m = m.replace(old, new)

rep("""        s[key + 'State'] = 'submitting'; self.setState(s);
        clearTimeout(self.timers[key]);
        self.timers[key] = setTimeout(function () { var d = {}; d[key + 'State'] = 'success'; self.setState(d); }, 1100);""",
"""        s[key + 'State'] = 'submitting'; self.setState(s);
        self.sendSignup(key, v);""")

rep("""  renderVals() {""", """  sendSignup(key, email) {
    var self = this;
    var query = new URLSearchParams(window.location.search);
    var payload = { email: email, location: key === 'hero' ? 'hero' : 'closing', company_website: '' };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) { var q = query.get(k); if (q) payload[k] = q; });
    if (key === 'close') {
      var evLabels = ['A renewal', 'Planned treatment', 'A job change', 'Parents\\' cover', 'Nothing yet, just getting organised'];
      var polLabels = ['Employer group cover', 'Family floater', 'Parents\\' policy', 'Super top-up', 'Not sure'];
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
  renderVals() {""")

rep("""    var mode = this.state.mode || this.props.closingMode || 'write';""",
    """    var mode = this.props.voiceEnabled ? (this.state.mode || this.props.closingMode || 'write') : 'write';""")

rep("""    var stopRec = function () { clearInterval(self.recTick); self.setState({ voice: 'recorded', playPos: 0 }); };""",
"""    var stopRec = function () {
      clearInterval(self.recTick);
      if (self.recorder && self.recorder.state !== 'inactive') self.recorder.stop();
      else self.setState({ voice: 'recorded', playPos: 0 });
    };""")

rep("""      start: function () {
        if (!consent) return;
        self.setState({ voice: 'recording', voiceSecs: 0 });
        clearInterval(self.recTick);
        self.recTick = setInterval(function () {
          var v = (self.state.voiceSecs || 0) + 1;
          if (v >= 60) { stopRec(); self.setState({ voiceSecs: 60 }); return; }
          self.setState({ voiceSecs: v });
        }, 1000);
      },""",
"""      start: function () {
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
      },""")

rep("""      redo: function () { clearInterval(self.recTick); self.setState({ voice: 'idle', voiceSecs: 0, playing: false, playPos: 0 }); },""",
"""      redo: function () {
        clearInterval(self.recTick);
        if (self.player) self.player.pause();
        self.audioBlob = null;
        self.setState({ voice: 'idle', voiceSecs: 0, playing: false, playPos: 0 });
      },""")

rep("""      play: function () {
        if (self.state.playing) { clearInterval(self.playTick); self.setState({ playing: false }); return; }
        self.setState({ playing: true, playPos: 0 });
        clearInterval(self.playTick);
        self.playTick = setInterval(function () {
          var p = (self.state.playPos || 0) + 0.05;
          if (p >= 1) { clearInterval(self.playTick); self.setState({ playing: false, playPos: 1 }); return; }
          self.setState({ playPos: p });
        }, 150);
      }""",
"""      play: function () {
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
      }""")

rep("""      status: voice === 'idle' ? (consent ? 'Tap to record' : 'Tick the box below to record') : voice === 'recording' ? 'Recording' : 'Voice note ready',""",
    """      status: this.state.voiceError ? this.state.voiceError : voice === 'idle' ? (consent ? 'Tap to record' : 'Tick the box below to record') : voice === 'recording' ? 'Recording' : 'Voice note ready',""")

rep("""      setWrite: function () { self.setState({ mode: 'write' }); },""",
    """      showTabs: !!this.props.voiceEnabled,
      setName: function (e) { self.setState({ closeName: e.target.value }); },
      setWrite: function () { self.setState({ mode: 'write' }); },""")

rep("""      successExtra: mode === 'voice' && voice === 'recorded' ? 'We have your voice note too.' : ''""",
    """      successExtra: mode === 'voice' && voice === 'recorded' ? (this.state.voiceSaved === false ? 'Your voice note did not upload, but your email is saved.' : 'We have your voice note too.') : ''""")

rep("""    if (this.playTick) clearInterval(this.playTick);""",
    """    if (this.playTick) clearInterval(this.playTick);
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    if (this.player) this.player.pause();""")
open(mp, 'w', encoding='utf-8').write(m)
print('model wired')
