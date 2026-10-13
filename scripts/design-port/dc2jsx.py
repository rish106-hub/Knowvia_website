# Converts Claude Design (.dc.html) template markup into React JSX with identical styles.
import re, json
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
SVG_TAGS = {'svg','path','circle','rect','line','polyline','polygon','g','defs','lineargradient','radialgradient','stop','ellipse','text','tspan','clippath','mask','use','symbol','title','desc'}
TAG_CASE = {'lineargradient': 'linearGradient', 'radialgradient': 'radialGradient', 'clippath': 'clipPath'}
ATTR_MAP = {'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'autocomplete': 'autoComplete', 'novalidate': 'noValidate',
            'readonly': 'readOnly', 'maxlength': 'maxLength', 'inputmode': 'inputMode', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
            'viewbox': 'viewBox', 'onclick': 'onClick', 'onchange': 'onChange', 'onsubmit': 'onSubmit', 'oninput': 'onInput',
            'crossorigin': 'crossOrigin', 'srcset': 'srcSet', 'enctype': 'encType', 'accept-charset': 'acceptCharset',
            'gradientunits': 'gradientUnits', 'gradienttransform': 'gradientTransform', 'preserveaspectratio': 'preserveAspectRatio',
            'spellcheck': 'spellCheck', 'datetime': 'dateTime', 'xmlns:xlink': 'xmlnsXlink', 'xlink:href': 'xlinkHref'}
HOLE = re.compile(r'\{\{\s*([^}]+?)\s*\}\}')
PLACEHOLDER_DROP = re.compile(r'\s*\[(?:LEGAL REVIEW|CONSENT RE-CHECK|CONFIRM)[^\]]*\]')

def camel(s):
    if s.startswith('-webkit-'): s = 'Webkit-' + s[8:]
    elif s.startswith('-moz-'): s = 'Moz-' + s[5:]
    return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), s)

def fix_fonts(v):
    if 'Newsreader' in v: return "var(--font-display), 'Iowan Old Style', Georgia, serif"
    if 'Source Sans 3' in v: return "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    return v

def split_decls(s):
    out, depth, cur = [], 0, ''
    for ch in s:
        if ch == '(': depth += 1
        if ch == ')': depth -= 1
        if ch == ';' and depth == 0: out.append(cur); cur = ''
        else: cur += ch
    if cur.strip(): out.append(cur)
    return out

def style_obj(s, root_overrides=None):
    d = {}
    for decl in split_decls(s):
        if ':' not in decl: continue
        k, v = decl.split(':', 1); k = k.strip(); v = v.strip()
        if not k: continue
        if k == 'font-family': v = fix_fonts(v)
        if k.startswith('--'): d[k] = v
        else: d[camel(k)] = v
    if root_overrides: d.update(root_overrides)
    return '{' + ', '.join(f'{json.dumps(k) if k.startswith("--") else k}: {json.dumps(v, ensure_ascii=False)}' for k, v in d.items()) + '}'

class Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, attrs, parent, []

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', [], None); self.cur = self.root
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur); self.cur.kids.append(n)
        if tag not in VOID: self.cur = n
    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(Node(tag, attrs, self.cur))
    def handle_endtag(self, tag):
        c = self.cur
        while c is not None and c.tag != tag: c = c.parent
        if c is not None and c.parent is not None: self.cur = c.parent
    def handle_data(self, data): self.cur.kids.append(data)

def parse(html):
    p = P(); p.feed(html); p.close(); return p.root

class Ctx:
    def __init__(self, vname='v', link_map=None, href_map=None, root_style=None):
        self.vname, self.scope, self.loop = vname, [], 0
        self.link_map = link_map or {}; self.href_map = href_map or {}; self.root_style = root_style
        self.uses = set()

def expr(path, ctx):
    head = path.split('.')[0]
    if head in ctx.scope: return path
    return f'{ctx.vname}.{path}'

def text_to_jsx(t, ctx):
    if '[CONTACT EMAIL]' in t:
        parts = t.split('[CONTACT EMAIL]'); ctx.uses.add('site')
        return '{"' + '"}{site.contactEmail}{"'.join(json.dumps(p, ensure_ascii=False)[1:-1] for p in parts) + '"}'
    t = PLACEHOLDER_DROP.sub('', t)
    out, pos = [], 0
    for m in HOLE.finditer(t):
        if m.start() > pos: out.append('{' + json.dumps(t[pos:m.start()], ensure_ascii=False) + '}')
        out.append('{' + expr(m.group(1), ctx) + '}')
        pos = m.end()
    if pos < len(t): out.append('{' + json.dumps(t[pos:], ensure_ascii=False) + '}')
    return ''.join(out)

def attr_to_jsx(tag, k, v, ctx, is_root=False):
    if v is None: v = ''
    if k.startswith('on'):
        m = HOLE.fullmatch(v.strip()); jk = ATTR_MAP.get(k, k)
        return f'{jk}={{{expr(m.group(1), ctx)}}}' if m else None
    if k == 'style':
        m = HOLE.fullmatch(v.strip())
        if m: ctx.uses.add('css'); return f'style={{css({expr(m.group(1), ctx)})}}'
        return f'style={{{style_obj(v, ctx.root_style if is_root else None)}}}'
    jk = ATTR_MAP.get(k, k)
    if '-' in jk and not (jk.startswith('aria-') or jk.startswith('data-')): jk = camel(jk)
    if k == 'href':
        if v in ctx.link_map: v = ctx.link_map[v]
        elif v in ctx.href_map: v = ctx.href_map[v]
        if v == '__MAILTO__': ctx.uses.add('site'); return 'href={`mailto:${site.contactEmail}`}'
    if tag in ('input', 'textarea') and k == 'value': jk = 'defaultValue'
    if tag == 'input' and k == 'checked': return 'defaultChecked'
    if k in ('hidden', 'disabled', 'required', 'multiple', 'novalidate', 'readonly', 'selected', 'autofocus') and not HOLE.search(v):
        if k == 'selected': return None
        return jk
    m = HOLE.fullmatch(v.strip())
    if m: return f'{jk}={{{expr(m.group(1), ctx)}}}'
    if jk in ('tabIndex', 'colSpan', 'rowSpan', 'maxLength') and re.fullmatch(r'-?\d+', v.strip()): return f'{jk}={{{v.strip()}}}'
    if HOLE.search(v):
        parts = []; pos = 0
        for mm in HOLE.finditer(v):
            parts.append(v[pos:mm.start()].replace('`', '\\`')); parts.append('${' + expr(mm.group(1), ctx) + '}'); pos = mm.end()
        parts.append(v[pos:])
        return f'{jk}={{`{"".join(parts)}`}}'
    return f'{jk}={json.dumps(v, ensure_ascii=False)}'

def is_flex(node):
    if node is None or isinstance(node, str): return False
    st = dict(node.attrs).get('style') or ''
    return bool(re.search(r'display:\s*(inline-)?(flex|grid)', st)) or node.tag in ('sc-for', 'sc-if') and is_flex(node.parent)

def kids_jsx(node, ctx, ind):
    out = []; n = len(node.kids)
    for i, k in enumerate(node.kids):
        if isinstance(k, str) and not k.strip():
            if i == 0 or i == n - 1 or is_flex(node) or node.tag in ('ul', 'ol', 'dl', 'select', 'svg', 'g', 'tr', 'table', 'tbody'):
                continue
            prev, nxt = node.kids[i - 1], node.kids[i + 1]
            if isinstance(prev, str) or isinstance(nxt, str): continue
            out.append('  ' * ind + '{" "}\n'); continue
        out.append(emit(k, ctx, ind))
    return ''.join(out)

def emit(node, ctx, ind=0, is_root=False):
    pad = '  ' * ind
    if isinstance(node, str):
        if not node.strip():
            return '' if '\n' in node else pad + '{" "}\n'
        t = re.sub(r'\s+', ' ', node)
        return pad + text_to_jsx(t, ctx) + '\n'
    tag = node.tag
    if tag in ('script', 'style', 'link', 'helmet'): return ''
    if tag == 'sc-for':
        a = dict(node.attrs); m = HOLE.search(a.get('list', '')); as_ = a.get('as')
        lst = expr(m.group(1), ctx); ctx.loop += 1; idx = f'i{ctx.loop}'
        ctx.scope.append(as_)
        inner = kids_jsx(node, ctx, ind + 2)
        ctx.scope.pop()
        ctx.uses.add('Fragment')
        return f'{pad}{{({lst} ?? []).map(({as_}: Any, {idx}: number) => (\n{pad}  <Fragment key={{{idx}}}>\n{inner}{pad}  </Fragment>\n{pad}))}}\n'
    if tag == 'sc-if':
        a = dict(node.attrs); m = HOLE.search(a.get('value', ''))
        inner = kids_jsx(node, ctx, ind + 1)
        ctx.uses.add('truthy')
        return f'{pad}{{truthy({expr(m.group(1), ctx)}) && (\n{pad}  <>\n{inner}{pad}  </>\n{pad})}}\n'
    jtag = TAG_CASE.get(tag, tag)
    attrs = []
    if tag == 'select':
        for o in node.kids:
            if not isinstance(o, str) and o.tag == 'option' and any(k == 'selected' for k, _ in o.attrs):
                val = dict(o.attrs).get('value') or ''.join(x for x in o.kids if isinstance(x, str)).strip()
                attrs.append(f'defaultValue={json.dumps(val, ensure_ascii=False)}')
    for k, v in node.attrs:
        r = attr_to_jsx(tag, k, v, ctx, is_root)
        if r: attrs.append(r)
    use_link = False
    href = next((v for k, v in node.attrs if k == 'href'), None)
    if tag == 'a' and href is not None:
        h = ctx.link_map.get(href, ctx.href_map.get(href, href))
        if h.startswith('/'): use_link = True; jtag = 'Link'; ctx.uses.add('Link')
    open_ = f'<{jtag}' + (' ' + ' '.join(attrs) if attrs else '')
    if tag in VOID: return f'{pad}{open_} />\n'
    if not node.kids: return f'{pad}{open_}></{jtag}>\n'
    inner = kids_jsx(node, ctx, ind + 1)
    return f'{pad}{open_}>\n{inner}{pad}</{jtag}>\n'

def convert(fragment_html, ctx, root_style_first=False):
    root = parse(fragment_html)
    out = []; first = True
    for k in root.kids:
        if isinstance(k, str) and not k.strip(): continue
        out.append(emit(k, ctx, 2, is_root=(first and root_style_first)))
        if not isinstance(k, str): first = False
    return ''.join(out)
