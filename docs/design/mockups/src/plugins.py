# Plugins screen mockups. Run from this folder: python3 plugins.py && node render-plugins.js
# Every colour, space, size and radius is a var(--om-*) token from ../../themes/all-themes.css.
# Anything tagged "nuevo" needs data the plugin host does not expose today (see plans/plugins-screen.md).
PATH = "/home/victux/.config/OpenMarket/plugins"

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:var(--om-font-sans);font-size:var(--om-font-size-sm);line-height:var(--om-line-height-normal);background:var(--om-color-background);color:var(--om-color-text);overflow:hidden}
.app{display:flex;height:100vh}
.rail{width:var(--om-rail-width);flex:none;background:var(--om-color-surface);border-right:1px solid var(--om-color-border);display:flex;flex-direction:column;align-items:center;padding:var(--om-space-3) 0;gap:var(--om-space-1)}
.mark{width:var(--om-rail-mark-size);height:var(--om-rail-mark-size);border-radius:var(--om-radius-md);background:var(--om-color-primary);color:var(--om-color-primary-contrast);font-weight:var(--om-font-weight-bold);display:flex;align-items:center;justify-content:center;margin-bottom:var(--om-space-4)}
.ri{width:calc(var(--om-rail-width) - var(--om-space-3));min-height:var(--om-rail-item-height);border-radius:var(--om-radius-md);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:var(--om-font-size-xs);color:var(--om-color-text-muted);gap:var(--om-space-1)}
.ri i{font-style:normal;font-size:var(--om-font-size-lg);filter:grayscale(1)}
.ri.on{background:var(--om-color-primary-soft);color:var(--om-color-primary);font-weight:var(--om-font-weight-bold)}
.grow{flex:1}
.main{flex:1;min-width:0;min-height:0;overflow:auto;padding:var(--om-space-5) var(--om-space-6);display:flex;flex-direction:column;gap:var(--om-space-4)}
.head{display:flex;align-items:flex-start;gap:var(--om-space-4);flex-wrap:wrap}
.head h1{font-family:var(--om-font-display);font-size:var(--om-font-size-2xl);letter-spacing:var(--om-letter-spacing-heading);line-height:var(--om-line-height-tight)}
.sub{color:var(--om-color-text-muted);margin-top:var(--om-space-1)}
.path{font-family:var(--om-font-mono);font-size:var(--om-font-size-xs);background:var(--om-color-surface-alt);border-radius:var(--om-radius-sm);padding:var(--om-space-1) var(--om-space-2);overflow-wrap:anywhere}
.btn{height:var(--om-button-height);padding:0 var(--om-button-padding-x);border-radius:var(--om-button-radius);font-weight:var(--om-button-font-weight);display:inline-flex;align-items:center;gap:var(--om-space-2);white-space:nowrap;border:var(--om-button-border-width) solid var(--om-button-secondary-border);background:var(--om-button-secondary-bg);color:var(--om-button-secondary-fg);font-size:var(--om-font-size-sm)}
.btn.p{background:var(--om-button-primary-bg);color:var(--om-button-primary-fg);border-color:var(--om-button-primary-bg)}
.btn.g{background:transparent;border-color:transparent;color:var(--om-button-ghost-fg)}
.btn.sm{height:var(--om-control-height)}
.card{background:var(--om-color-surface);border:1px solid var(--om-color-border);border-radius:var(--om-radius-lg);box-shadow:var(--om-shadow-sm)}
.list{display:flex;flex-direction:column;gap:var(--om-space-3)}
.pc{display:grid;grid-template-columns:var(--om-rail-mark-size) minmax(0,1fr) auto;gap:var(--om-space-4);padding:var(--om-space-4) var(--om-space-5);align-items:start}
.ico{width:var(--om-rail-mark-size);height:var(--om-rail-mark-size);border-radius:var(--om-radius-md);background:var(--om-color-surface-alt);display:flex;align-items:center;justify-content:center;font-size:var(--om-font-size-xl)}
.t{display:flex;align-items:center;gap:var(--om-space-2);flex-wrap:wrap}
.name{font-size:var(--om-font-size-lg);font-weight:var(--om-font-weight-bold)}
.muted{color:var(--om-color-text-muted)}.xs{font-size:var(--om-font-size-xs)}.b{font-weight:var(--om-font-weight-bold)}
.desc{margin-top:var(--om-space-1);color:var(--om-color-text)}
.meta{display:flex;flex-wrap:wrap;gap:var(--om-space-2);margin-top:var(--om-space-3)}
.chip{font-size:var(--om-font-size-xs);border:1px solid var(--om-color-border);border-radius:var(--om-radius-pill);padding:var(--om-space-0) var(--om-space-2);line-height:1.8;color:var(--om-color-text-muted);white-space:nowrap}
code,.msg,.path{font-variant-ligatures:none}
.btn.p .new{color:var(--om-color-primary-contrast);border-color:var(--om-color-primary-contrast)}
.chip code{font-family:var(--om-font-mono);color:var(--om-color-text)}
.st{display:inline-flex;align-items:center;gap:var(--om-space-1);font-size:var(--om-font-size-xs);font-weight:var(--om-font-weight-bold);border-radius:var(--om-radius-pill);padding:var(--om-space-1) var(--om-space-2);border:1px solid transparent;white-space:nowrap}
.st.ok{background:var(--om-color-success-soft);color:var(--om-color-success)}
.st.warn{background:var(--om-color-surface);color:var(--om-color-warning);border-color:var(--om-color-warning)}
.st.err{background:var(--om-color-danger-soft);color:var(--om-color-danger)}
.st.off{background:var(--om-color-surface-alt);color:var(--om-color-text-muted)}
.side{display:flex;flex-direction:column;align-items:flex-end;gap:var(--om-space-3)}
.tg{display:flex;align-items:center;gap:var(--om-space-2);min-height:var(--om-control-height);font-weight:var(--om-font-weight-medium)}
.sw{width:calc(var(--om-space-8) + var(--om-space-2));height:calc(var(--om-space-5) + var(--om-space-2));border-radius:var(--om-radius-pill);background:var(--om-color-border-strong);position:relative;flex:none}
.sw::after{content:"";position:absolute;top:var(--om-space-1);left:var(--om-space-1);width:var(--om-space-5);height:var(--om-space-5);border-radius:50%;background:var(--om-color-surface)}
.sw.on{background:var(--om-color-primary)}.sw.on::after{left:auto;right:var(--om-space-1)}
.sw.dis{opacity:.45}
.new{display:inline-block;font-size:var(--om-font-size-xs);font-weight:var(--om-font-weight-bold);letter-spacing:var(--om-letter-spacing-label);text-transform:uppercase;color:var(--om-color-accent);border:1px dashed var(--om-color-accent);border-radius:var(--om-radius-sm);padding:0 var(--om-space-1);line-height:1.6;vertical-align:middle;white-space:nowrap}
.ex{display:inline-block;font-size:var(--om-font-size-xs);color:var(--om-color-text-muted);border:1px solid var(--om-color-border-strong);border-radius:var(--om-radius-sm);padding:0 var(--om-space-1);line-height:1.6}
.banner{display:flex;align-items:center;gap:var(--om-space-3);padding:var(--om-space-3) var(--om-space-4);border-radius:var(--om-radius-md);border:1px solid var(--om-color-border)}
.banner.info{background:var(--om-color-primary-soft);border-color:var(--om-color-primary-soft)}
.banner.warn{background:var(--om-color-surface);border-color:var(--om-color-warning)}
.banner.err{background:var(--om-color-danger-soft);border-color:var(--om-color-danger-soft)}
.msg{font-family:var(--om-font-mono);font-size:var(--om-font-size-xs);background:var(--om-color-surface-alt);border-radius:var(--om-radius-sm);padding:var(--om-space-2) var(--om-space-3);margin-top:var(--om-space-3);overflow-wrap:anywhere}
.todo{margin-top:var(--om-space-3);border:1px solid var(--om-color-warning);border-radius:var(--om-radius-md);padding:var(--om-space-3) var(--om-space-4)}
.todo li{margin-left:var(--om-space-5);line-height:1.9}
.foot{position:fixed;right:var(--om-space-3);bottom:var(--om-space-2);font-family:var(--om-font-mono);font-size:var(--om-font-size-xs);color:var(--om-color-text-muted);letter-spacing:var(--om-letter-spacing-label)}
.steps{counter-reset:s;display:flex;flex-direction:column;gap:var(--om-space-3);margin:var(--om-space-4) 0}
.steps li{list-style:none;display:grid;grid-template-columns:var(--om-space-7) minmax(0,1fr);gap:var(--om-space-3);align-items:start}
.steps li::before{counter-increment:s;content:counter(s);width:var(--om-space-7);height:var(--om-space-7);border-radius:50%;background:var(--om-color-primary-soft);color:var(--om-color-primary);font-weight:var(--om-font-weight-bold);display:flex;align-items:center;justify-content:center}
.fld{display:flex;flex-direction:column;gap:var(--om-space-1)}
.fld label{font-size:var(--om-font-size-xs);font-weight:var(--om-font-weight-bold);color:var(--om-color-text-muted)}
.in{height:var(--om-control-height);border:1px solid var(--om-color-border-strong);border-radius:var(--om-control-radius);background:var(--om-color-surface);padding:0 var(--om-space-3);display:flex;align-items:center;gap:var(--om-space-2);min-width:0}
.in.bad{border-color:var(--om-color-danger);box-shadow:0 0 0 1px var(--om-color-danger)}
.err-t{font-size:var(--om-font-size-xs);color:var(--om-color-danger)}
.seg{display:flex;background:var(--om-color-surface-alt);border-radius:var(--om-control-radius);padding:var(--om-space-1);gap:var(--om-space-1)}
.seg span{flex:1;text-align:center;padding:var(--om-space-2) var(--om-space-4);border-radius:var(--om-radius-sm);font-weight:var(--om-font-weight-medium);min-height:calc(var(--om-control-height) - var(--om-space-2));display:flex;align-items:center;justify-content:center}
.seg .on{background:var(--om-color-surface);box-shadow:var(--om-shadow-sm);font-weight:var(--om-font-weight-bold)}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--om-space-4)}
.detail{display:grid;grid-template-columns:minmax(0,1fr) clamp(calc(var(--om-space-9) * 4.5), 28%, calc(var(--om-space-9) * 6.5));gap:var(--om-space-4);min-height:0}
.sec{padding:var(--om-space-5)}
.sec h2{font-size:var(--om-font-size-md);font-weight:var(--om-font-weight-bold);margin-bottom:var(--om-space-3)}
dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--om-space-2) var(--om-space-3)}dt{color:var(--om-color-text-muted)}dd{overflow-wrap:anywhere}
.slot{border:1px dashed var(--om-color-border-strong);border-radius:var(--om-radius-md);padding:var(--om-space-4)}
.ft{display:flex;justify-content:flex-end;gap:var(--om-space-2);padding-top:var(--om-space-4);border-top:1px solid var(--om-color-border);margin-top:var(--om-space-4)}
"""

def rail():
    items = [("🧺","Vender"),("📋","Pedidos"),("📦","Productos"),("🏷","Categorías"),("📊","Informes"),("🔌","Plugins")]
    h = '<nav class="rail"><div class="mark">OM</div>'
    h += "".join(f'<div class="ri{" on" if n=="Plugins" else ""}"><i>{i}</i>{n}</div>' for i,n in items)
    return h + '<div class="grow"></div><div class="ri"><i>⚙</i>Ajustes</div></nav>'

def head(extra="", button=True):
    return f'''<div class="head"><div style="flex:1;min-width:0"><h1>Plugins</h1>
<div class="sub">Amplían OpenMarket. Se cargan al iniciar la aplicación.</div></div>
{'<div class="btn sm">📂 Abrir carpeta de plugins <span class="new">nuevo</span></div>' if button else ""}</div>{extra}'''

def status(kind):
    return {
        "ok": '<span class="st ok">✓ Activo</span>',
        "warn": '<span class="st warn">⚠ Necesita configuración</span>',
        "err": '<span class="st err">✕ Error de carga</span>',
        "inc": '<span class="st err">⊘ Incompatible</span>',
        "off": '<span class="st off">○ Desactivado</span>',
        "restart": '<span class="st warn">↻ Se activa al reiniciar</span>',
    }[kind]

def toggle(on, label=None, dis=False):
    lab = label if label is not None else ("Activado" if on else "Desactivado")
    return f'<div class="tg"><span class="sw{" on" if on else ""}{" dis" if dis else ""}"></span>{lab}</div>'

def card(icon, name, version, author, desc, rng, uses, st, tog, actions="", body="", example=False):
    ex = ' <span class="ex">Ejemplo</span>' if example else ""
    auth = f'<span class="muted">· {author}</span> <span class="new">nuevo</span>' if author else ""
    usechips = "".join(f'<span class="chip">{u}</span>' for u in uses)
    uses_html = f'{usechips}<span class="new">nuevo</span>' if uses else ""
    return f'''<article class="card pc"><div class="ico">{icon}</div>
<div style="min-width:0"><div class="t"><span class="name">{name}</span><span class="muted">v{version}</span>{auth}{ex}{status(st)}</div>
{f'<div class="desc">{desc}</div>' if desc else ""}
<div class="meta"><span class="chip">OpenMarket <code>{rng}</code></span>{uses_html}</div>{body}</div>
<div class="side">{tog}{actions}</div></article>'''

def page(name, title, body, w, h, theme="mercado"):
    html = f'''<!doctype html><html data-theme="{theme}"><head><meta charset="utf-8"><title>{title}</title>
<link rel="stylesheet" href="../../themes/all-themes.css"><style>{CSS}</style></head>
<body><div class="app">{rail()}<main class="main">{body}</main></div><div class="foot">{title} · {w}×{h}</div></body></html>'''
    open(f"{name}.html", "w").write(html)
    SHOTS.append((name, w, h))

SHOTS = []
PATHLINE = f'<div class="t"><span class="muted">Carpeta:</span><span class="path">{PATH}</span></div>'

# (a) empty state
empty = head(button=False) + f'''<section class="card" style="padding:var(--om-space-7);max-width:calc(var(--om-space-9) * 13)">
<div class="ico" style="margin-bottom:var(--om-space-4)">🔌</div>
<div class="name" style="font-size:var(--om-font-size-xl)">Aún no hay plugins instalados</div>
<div class="sub">Un plugin es una carpeta con <code>plugin.json</code>. OpenMarket no lo descarga: lo copias tú.</div>
<ol class="steps">
<li><div><b>Abre la carpeta de plugins.</b><div class="muted">{PATHLINE}</div></div></li>
<li><div><b>Copia dentro la carpeta del plugin</b> (por ejemplo <code>verifactu/</code>, con su <code>plugin.json</code> e <code>index.js</code>). Si viene en un .zip, descomprímelo antes.</div></li>
<li><div><b>Reinicia OpenMarket.</b> El plugin aparece aquí desactivado; actívalo y rellena sus ajustes.</div></li>
</ol>
<div class="t"><div class="btn p">📂 Abrir carpeta de plugins <span class="new">nuevo</span></div><div class="btn g">Copiar ruta <span class="new">nuevo</span></div></div>
</section>
<div class="muted xs">Los plugins tienen acceso completo a la base de datos de la tienda. Instala solo plugins de confianza.</div>'''
page("A-plugins-empty", "PLUGINS · VACÍO", empty, 1366, 768)

VF_DESC = "Cumplimiento VERI*FACTU de la AEAT: registros de factura encadenados, QR en el ticket y envío a la AEAT."
VF_USES = ["<code>InvoiceIssued</code>", "<code>InvoiceCancelled</code>", "durable <code>verifactu:send</code>"]

def listing(vf_state):
    enc = '<div class="banner info xs">🔒 Las contraseñas de los plugins se guardan cifradas en este equipo.</div>'
    cards = []
    if vf_state == "warn":
        missing = '''<div class="todo"><div class="b" style="color:var(--om-color-warning)">Faltan 3 ajustes obligatorios para activarlo</div>
<ul class="muted"><li>Entorno (pruebas o producción)</li><li>NIF del emisor</li><li>Ruta del certificado (.p12/.pfx)</li></ul></div>'''
        cards.append(card("🧾", "VeriFactu", "0.1.0", "UnexpectedSoftware", VF_DESC, "&gt;=1.22.0 &lt;2", [], "warn",
            toggle(False, "Desactivado", dis=True), '<div class="btn p">Configurar VeriFactu →</div>', missing))
    else:
        cards.append(card("🧾", "VeriFactu", "0.1.0", "UnexpectedSoftware", VF_DESC, "&gt;=1.22.0 &lt;2", VF_USES, "ok",
            toggle(True), '<div class="btn sm">Ajustes</div>'))
    cards.append(card("🏷", "Etiquetas de estante", "1.2.0", "Ejemplo S.L.", "Imprime una etiqueta de precio para cada producto nuevo.",
        "&gt;=1.20.0 &lt;2", ["<code>ProductCreated</code>"], "ok", toggle(True), '<div class="btn sm">Ajustes</div>', example=True))
    cards.append(card("⚖", "Báscula Dibal", "0.4.1", "Ejemplo S.L.", "Lee el peso de una báscula conectada por USB y lo pasa al diálogo de peso.",
        "&gt;=1.25.0 &lt;2", [], "off", toggle(False), "", example=True))
    return head(enc if vf_state != "warn" else "") + f'<div class="t xs muted">3 plugins en {f"<span class=path>{PATH}</span>"}</div><div class="list">{"".join(cards)}</div>'

# (b) list
page("A-plugins-list", "PLUGINS · LISTA", listing("ok"), 1366, 768)
page("A-plugins-list-compact", "PLUGINS · LISTA COMPACTA", listing("ok"), 1024, 700)
page("A-plugins-list-mostrador-noche", "PLUGINS · LISTA · MOSTRADOR NOCHE", listing("ok"), 1366, 768, theme="mostrador-noche")
# (c) needs setup
page("A-plugins-needs-setup", "PLUGINS · NECESITA CONFIGURACIÓN", listing("warn"), 1366, 768)

# (d) detail / settings
detail = f'''<div class="t"><span class="btn g" style="padding-left:0">← Plugins</span></div>
<div class="head"><div class="ico">🧾</div><div style="flex:1;min-width:0"><div class="t"><h1>VeriFactu</h1><span class="muted">v0.1.0</span>{status("warn")}</div>
<div class="sub">{VF_DESC}</div></div>{toggle(False, "Desactivado", dis=True)}</div>
<div class="detail"><section class="card sec" style="min-width:0">
<h2>Ajustes del plugin <span class="muted xs" style="font-weight:normal">· de plugin.json</span></h2>
<div class="grid2">
<div class="fld"><label>Entorno *</label><div class="seg"><span class="on">Pruebas</span><span>Producción</span></div><div class="xs muted">Selector: <span class="new">nuevo</span> <code>"type": "select"</code> en plugin.json. Hoy es texto libre.</div></div>
<div class="fld"><label>NIF del emisor *</label><div class="in">B12345678</div></div>
<div class="fld"><label>Ruta del certificado (.p12/.pfx) *</label><div class="in bad"></div><div class="err-t">Obligatorio para activar el plugin</div></div>
<div class="fld"><label>Contraseña del certificado</label><div class="in"><span class="grow">••••••••</span><span class="st ok">✓ guardado</span></div><div class="xs muted">Déjalo vacío para conservar la guardada. Se cifra en este equipo.</div></div>
</div>
<div class="xs muted" style="margin-top:var(--om-space-4)">Los datos del sistema informático (productor, Id. del sistema y nº de instalación) los pone el plugin. No hace falta introducirlos.</div>
<div class="ft"><span class="xs muted" style="margin-right:auto;align-self:center">* obligatorio · Los cambios se aplican al reiniciar</span><div class="btn">Cancelar</div><div class="btn p">Guardar</div></div>
</section>
<aside style="display:flex;flex-direction:column;gap:var(--om-space-4);min-width:0">
<section class="card sec"><h2>Información</h2><dl class="xs">
<dt>Id</dt><dd><code>verifactu</code></dd><dt>Versión</dt><dd>0.1.0</dd>
<dt>Compatible</dt><dd>OpenMarket <code>&gt;=1.22.0 &lt;2</code> ✓ (1.30.0)</dd>
<dt>Autor</dt><dd>UnexpectedSoftware <span class="new">nuevo</span></dd>
<dt>Carpeta</dt><dd><span class="path">{PATH}/verifactu</span></dd>
<dt>Usa</dt><dd><code>InvoiceIssued</code>, <code>InvoiceCancelled</code>, durable <code>verifactu:send</code> <span class="new">nuevo</span></dd>
</dl></section>
<section class="slot"><div class="xs muted" style="margin-bottom:var(--om-space-2)"><code>settings.section</code> · #105 · lo dibuja el plugin</div>
<div class="b">Conexión con la AEAT</div><div class="xs muted" style="margin:var(--om-space-1) 0 var(--om-space-3)">Último envío: nunca</div><div class="btn sm">Probar conexión</div></section>
</aside></div>'''
page("A-plugins-detail", "PLUGINS · DETALLE Y AJUSTES", detail, 1366, 768)

# (e) error states
restart = '<div class="banner warn"><span style="color:var(--om-color-warning)" class="b">↻ Reinicia OpenMarket para aplicar los cambios.</span><span class="muted xs grow">Has activado Etiquetas de estante. Los plugins solo se cargan al iniciar.</span><div class="btn sm">Reiniciar ahora <span class="new">nuevo</span></div></div>'
errs = [
    card("🏷", "Etiquetas de estante", "1.2.0", "Ejemplo S.L.", "Imprime una etiqueta de precio para cada producto nuevo.",
         "&gt;=1.20.0 &lt;2", [], "restart", toggle(True), "", example=True).replace('<div class="desc">Imprime una etiqueta de precio para cada producto nuevo.</div>',''),
    card("⭐", "Fidelización", "2.0.0", "Ejemplo S.L.", "",
         "&gt;=1.20.0 &lt;2", [], "err", toggle(True),
         '<div class="btn sm">📂 Abrir carpeta</div>',
         '<div class="msg">No se pudo cargar al iniciar: Plugin must export register</div><div class="xs muted" style="margin-top:var(--om-space-1)">Revisa que <code>index.js</code> exporte <code>register</code> o reinstala el plugin. Detalle en el registro de errores.</div>', example=True),
    card("🧾", "VeriFactu", "0.2.0", "UnexpectedSoftware", "", "&gt;=1.32.0 &lt;2", [], "inc", toggle(False, "No se puede activar", dis=True), "",
         '<div class="msg">Requiere OpenMarket &gt;=1.32.0 &lt;2 · Esta versión: 1.30.0</div><div class="xs muted" style="margin-top:var(--om-space-1)">Actualiza OpenMarket o instala una versión del plugin compatible.</div>'),
    '<article class="card pc"><div class="ico">📁</div><div style="min-width:0"><div class="t"><span class="name">mi-plugin</span>' + status("err") + ' <span class="new">nuevo</span><span class="ex">Ejemplo</span></div><div class="msg">plugin.json no es válido: el id «MiPlugin» no coincide con la carpeta «mi-plugin»</div><div class="xs muted" style="margin-top:var(--om-space-1)">Hoy esta carpeta se ignora sin avisar.</div></div><div class="side"></div></article>',
]
page("A-plugins-errors", "PLUGINS · ERRORES Y REINICIO", head(restart) + f'<div class="list">{"".join(errs)}</div>', 1366, 768)

open("plugins-shots.json", "w").write(__import__("json").dumps(SHOTS))
print("\n".join(n for n, _, _ in SHOTS))
