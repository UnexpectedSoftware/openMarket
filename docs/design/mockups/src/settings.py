exec(open('gen.py').read().split("# ---- Informes shell")[0])
SEC=[("🏪","Negocio"),("🧾","Ticket"),("🖨","Impresora"),("🎨","Apariencia"),("🌐","Idioma"),("🔌","Plugins")]
X=".f{display:flex;flex-direction:column;gap:5px}.f label{font-size:13px;font-weight:600;color:#566070}.in{height:42px;border:1px solid #D6DCE4;border-radius:10px;background:#fff;padding:0 12px;display:flex;align-items:center}.g{display:grid;grid-template-columns:1fr 1fr;gap:14px}"
def fld(l,v,err=None,ok=False):
    bd="border-color:#C0262D;box-shadow:0 0 0 3px rgba(192,38,45,.12)" if err else ""
    return f'<div class="f"><label>{l}{" <span class=up>✓</span>" if ok else ""}</label><div class="in" style="{bd}">{v}</div>{f"<div class=xs style=color:#C0262D>{err}</div>" if err else ""}</div>'
def snav(on,dirty=False):
    h='<div class="card" style="width:200px;padding:14px 10px;display:flex;flex-direction:column;gap:2px"><div style="font-size:22px;font-weight:700;padding:0 8px 12px">Ajustes</div>'
    for i,n in SEC:
        st="background:rgba(29,88,208,.12);color:#1D58D0;font-weight:700" if n==on else ""
        dot=' <span style="margin-left:auto;color:#9A5B00">●</span>' if dirty and n==on else ""
        h+=f'<div style="display:flex;gap:10px;padding:10px;border-radius:10px;{st}"><span>{i}</span>{n}{dot}</div>'
    return h+'<div style="flex:1"></div><div class="xs muted" style="padding:8px">OpenMarket · Caja 1</div></div>'
seg=lambda opts,on:'<div class="seg">'+"".join(f'<span class="{"on" if o==on else ""}">{o}</span>' for o in opts)+'</div>'
negocio=f'''<div class="g">{fld("NIF","B12345678")}{fld("Razón social","Ultramarinos Caldentey S.L.")}{fld("Nombre comercial","Colmado Victor")}{fld("Teléfono","+34 971 123 456")}{fld("Calle","C/ Sant Miquel, 12")}{fld("Código postal","07002")}{fld("Ciudad","Palma")}{fld("Provincia","Illes Balears")}{fld("País","España ▾")}{fld("Correo","hola@colmadovictor.es")}</div>
<div style="display:flex;align-items:center;gap:10px;margin-top:14px"><span style="width:40px;height:24px;border-radius:999px;background:#1D58D0;position:relative"><span style="position:absolute;right:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff"></span></span><b>Emitir facturas</b></div>'''
def card(t,inner,id=""): return f'<div class="card" style="padding:18px 20px"><div class="b" style="font-size:18px;margin-bottom:14px">{t}</div>{inner}</div>'
# a
bar='<div style="position:absolute;left:310px;right:16px;bottom:16px;background:#141A23;color:#fff;border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 16px 40px rgba(20,26,35,.18)"><span style="color:#FFC233">●</span><b>Cambios sin guardar</b><span class="xs" style="opacity:.7">2 campos en Negocio</span><span style="flex:1"></span><div class="btn" style="background:transparent;color:#fff;border-color:#878A8F">Descartar</div><div class="btn p">Guardar  <span class=xs>Ctrl+S</span></div></div>'
body=f'<div class="main">{snav("Negocio",True)}<div style="flex:1;display:flex;flex-direction:column;gap:14px"><div><div style="font-size:28px;font-weight:700">Negocio</div><div class="muted">Datos fiscales que aparecen en tickets y facturas</div></div>{card("Datos del negocio",negocio)}</div></div>{bar}'
page("A-settings-sectioned","Ajustes",body,"AJUSTES (A) SECCIONES + BARRA AL MODIFICAR",X)
# b
tabs="".join(f'<span style="padding:12px 4px;{"border-bottom:3px solid #1D58D0;color:#1D58D0;font-weight:700" if n=="Ticket" else "color:#566070;font-weight:600"}">{n}</span>' for _,n in SEC)
ticket_c=f'<div class="g"><div class="f"><label>Al imprimir</label>{seg(["Siempre","Preguntar","Nunca"],"Preguntar")}</div><div class="f"><label>Ancho del papel</label>{seg(["58 mm","80 mm"],"80 mm")}</div>{fld("Cabecera","¡Gracias por su visita!")}{fld("Pie","IVA incluido · Devoluciones 15 días")}</div>'
prn=f'<div class="g">{fld("Tipo","Epson ▾")}{fld("Juego de caracteres","PC858 ▾")}{fld("Interfaz","usb://04b8:0202 ▾")}<div class="f"><label>&nbsp;</label><div class="btn">🖨 Imprimir prueba</div></div></div>'
body=f'''<div class="main" style="flex-direction:column;gap:0;padding:0"><div style="background:#F5F6F8;border-bottom:1px solid #D6DCE4;padding:14px 24px 0;display:flex;align-items:flex-end;gap:28px"><div style="font-size:24px;font-weight:700;padding-bottom:10px">Ajustes</div>{tabs}<span style="flex:1"></span><div style="padding-bottom:10px;display:flex;gap:10px;align-items:center"><span class="xs" style="color:#9A5B00">● Sin guardar</span><div class="btn p">Guardar</div></div></div>
<div style="padding:16px 24px;display:flex;flex-direction:column;gap:14px;overflow:hidden"><div style="margin-top:-60px;opacity:.5">{card("Negocio",negocio)}</div>{card("Ticket",ticket_c)}{card("Impresora",prn)}</div></div>'''
page("A-settings-anchored","Ajustes",body,"AJUSTES (B) PÁGINA LARGA + PESTAÑAS FIJAS",X)
# c
themes="".join(f'<div class="card" style="flex:1;padding:10px;{"border:2px solid #1D58D0" if n=="Mercado" else ""}"><div style="height:54px;border-radius:8px;background:{bg};display:flex;gap:4px;padding:6px"><span style="width:10px;background:{p};border-radius:3px"></span><span style="flex:1;background:{s};border-radius:3px"></span></div><div class="b" style="margin-top:6px;font-size:13px">{"✓ " if n=="Mercado" else ""}{n}</div></div>' for n,bg,p,s in [("Mercado","#F5F6F8","#1D58D0","#fff"),("Noche","#0A0C0F","#5CC8F2","#1A1D22"),("Contraste","#000","#FFC233","#1A1A1A"),("Ultramarinos","#FAF5EC","#9A3B20","#fff")])
body=f'''<div class="main">{snav("Apariencia")}<div style="flex:1;display:flex;flex-direction:column;gap:14px"><div><div style="font-size:28px;font-weight:700">Apariencia</div><div class="muted">Los cambios se guardan automáticamente</div></div>
{card("Tema",f'<div style="display:flex;gap:12px">{themes}</div>')}
{card("Disposición de Vender",'<div class="f">'+seg(["Mostrador","Escáner","Táctil"],"Táctil")+'</div>')}
{card("Impresora (validación en línea)",f'<div class="g">{fld("Interfaz","tcp://192.168.1.300:9100","Dirección IP no válida: 300 > 255. No se ha guardado.")}{fld("Juego de caracteres","PC858 ▾",ok=True)}</div>')}</div></div>
<div style="position:absolute;right:24px;top:20px;background:#156A3A;color:#fff;border-radius:10px;padding:10px 16px;font-weight:600;box-shadow:0 4px 12px rgba(20,26,35,.18)">Guardado ✓ <span class="xs" style="opacity:.8;margin-left:6px">Tema: Mercado · Deshacer</span></div>'''
page("A-settings-autosave","Ajustes",body,"AJUSTES (C) AUTOGUARDADO",X)
