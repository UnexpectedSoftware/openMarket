import random
random.seed(3)
CSS="""*{box-sizing:border-box;margin:0;padding:0}body{width:1280px;height:800px;overflow:hidden;font-family:Inter,"Segoe UI",system-ui,sans-serif;background:#F5F6F8;color:#141A23;font-size:14px;display:flex;font-feature-settings:"tnum" 1}
.rail{width:78px;background:#fff;border-right:1px solid #D6DCE4;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px}
.om{width:46px;height:46px;border-radius:10px;background:#1D58D0;color:#fff;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.ri{width:64px;padding:7px 0;border-radius:10px;text-align:center;font-size:11px;color:#566070}.ri i{display:block;font-style:normal;font-size:19px;margin-bottom:2px;color:#141A23}
.ri.on{background:#EDF0F4;color:#1D58D0;font-weight:700}.ri.on i{color:#1D58D0}.sp{flex:1}
.main{flex:1;padding:16px;display:flex;gap:16px;min-width:0}
.card{background:#fff;border:1px solid #D6DCE4;border-radius:14px;box-shadow:0 1px 2px rgba(20,26,35,.06)}
.muted{color:#566070}.xs{font-size:12px}.b{font-weight:700}.up{color:#156A3A}.dn{color:#C0262D}
.lbl{font-size:12px;letter-spacing:.02em;text-transform:uppercase;color:#566070;font-weight:600}
.seg{display:flex;gap:6px}.seg span{padding:9px 16px;border-radius:999px;border:1px solid #D6DCE4;background:#fff;font-weight:600}.seg span.on{background:#141A23;color:#fff;border-color:#141A23}
.pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:600}
.btn{padding:0 18px;height:40px;border-radius:10px;border:1px solid #878A8F;background:#fff;font-weight:600;display:inline-flex;align-items:center;gap:6px}
.btn.p{background:#1D58D0;color:#fff;border-color:#1D58D0}
table{width:100%;border-collapse:collapse}th{background:#EDF0F4;text-align:left;font-size:12px;color:#566070;padding:9px 12px;text-transform:uppercase;letter-spacing:.02em}td{white-space:nowrap;padding:8px 12px;border-bottom:1px solid #D6DCE4}.r{text-align:right}
.tight td,.tight th{padding:8px 8px}
.foot{position:fixed;left:94px;bottom:8px;background:#141A23;color:#FFC233;font:11px "JetBrains Mono",monospace;padding:5px 10px;border-radius:4px;letter-spacing:.08em}
"""
def rail(on):
    it=[("🛒","Vender"),("🧾","Pedidos"),("📦","Productos"),("🏷","Categorías"),("📊","Informes"),("🔌","Plugins")]
    h='<div class="rail"><div class="om">OM</div>'+"".join(f'<div class="ri{" on" if n==on else ""}"><i>{i}</i>{n}</div>' for i,n in it)
    return h+'<div class="sp"></div><div class="ri"><i>⚙</i>Ajustes</div></div>'
def page(name,on,body,tag,extra=""):
    open(name+".html","w").write(f'<!doctype html><html lang="es"><meta charset="utf-8"><style>{CSS}{extra}</style><body>{rail(on)}{body}<div class="foot">⚠ MOCKUP · {tag} · NO ES LA APP ACTUAL</div></body></html>')
def eur(x): s=f"{x:,.2f}".replace(",","X").replace(".",",").replace("X","."); return s+" €"

# ---- Informes shell
SUB=[("◎","Resumen"),("🏆","Más vendidos"),("💶","Recaudación"),("⚠","Stock bajo"),("🏷","Por categoría")]
def sub(on):
    h='<div class="card" style="width:200px;padding:14px 10px;display:flex;flex-direction:column;gap:2px"><div style="font-size:22px;font-weight:700;padding:0 8px 12px">Informes</div>'
    for i,n in SUB:
        badge=' <span class="pill" style="background:rgba(192,38,45,.08);color:#C0262D;margin-left:auto">7</span>' if n=="Stock bajo" else ""
        st="background:rgba(29,88,208,.12);color:#1D58D0;font-weight:700" if n==on else ""
        h+=f'<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;{st}"><span>{i}</span>{n}{badge}</div>'
    return h+'<div class="sp" style="flex:1"></div><div class="xs muted" style="padding:8px">Datos de Caja 1 · actualizado 13:42</div><div class="btn" style="justify-content:center;margin:4px">⤓ Exportar CSV</div></div>'
def head(title,subt):
    return f'''<div style="display:flex;align-items:flex-end;justify-content:space-between"><div><div style="font-size:28px;font-weight:700;letter-spacing:-.01em">{title}</div><div class="muted">{subt}</div></div>
<div class="seg"><span>Hoy</span><span class="on">7 días</span><span>30 días</span><span>📅 Personalizado</span></div></div>'''
def kpi(l,v,d,up=True):
    return f'<div class="card" style="flex:1;padding:14px 16px"><div class="lbl">{l}</div><div style="font-size:28px;font-weight:700;margin:4px 0">{v}</div><div class="xs"><span class="{"up" if up else "dn"} b">{"▲" if up else "▼"} {d}</span> <span class="muted">vs 7 días anteriores</span></div></div>'
days=["Jue 29","Vie 30","Sáb 31","Dom 1","Lun 2","Mar 3","Mié 4"]
cash=[182.4,240.1,311.6,96.2,158.9,171.3,198.7];card=[120.3,166.8,240.2,64.5,109.4,131.0,148.2]
prev=[250,330,480,150,240,270,300]
def bars(h=220,showprev=True):
    mx=600;w=""
    for d,c,k,p in zip(days,cash,card,prev):
        t=c+k
        w+=f'''<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px"><div class="xs b">{eur(t).replace(" €","")}</div>
<div style="height:{h}px;width:100%;display:flex;align-items:flex-end;justify-content:center;position:relative">
<div style="width:46px;display:flex;flex-direction:column"><div style="height:{k/mx*h}px;background:#0F7B6C;border-radius:6px 6px 0 0"></div><div style="height:{c/mx*h}px;background:#1D58D0"></div></div>
{f'<div style="position:absolute;bottom:{p/mx*h}px;left:15%;right:15%;border-top:2px dashed #878A8F"></div>' if showprev else ''}</div><div class="xs muted">{d}</div></div>'''
    return f'<div style="display:flex;gap:8px">{w}</div>'
legend='<div class="xs" style="display:flex;gap:16px"><span><b style="color:#1D58D0">■</b> Efectivo</span><span><b style="color:#0F7B6C">■</b> Tarjeta</span><span class="muted">┄ semana anterior</span></div>'
prods=[("Coca-Cola lata 33 cl","CC",142,170.40),("Barra de pan","BP",131,91.70),("Leche entera Pascual 1 L","LE",96,110.40),("Croissant","CR",88,79.20),("Agua Mondariz 1,5 L","AM",74,62.90),("Yogur natural pack 4","YN",51,81.60),("Queso manchego (kg)","QM",12.4,229.40),("Magdalenas x6","MG",38,79.80),("Zumo naranja 1 L","ZN",33,64.35),("Chips patatas 150 g","CH",31,46.50)]
TOT=sum(p[3] for p in prods)/0.62
# Summary
top5="".join(f'<tr><td class="b muted">{i+1}</td><td>{n}</td><td class="r">{str(u).replace(".",",")}</td><td class="r b">{eur(r)}</td></tr>' for i,(n,_,u,r) in enumerate(prods[:5]))
low=[("Leche entera Pascual 1 L",4,24),("Croissant",2,20),("Pan integral",0,10)]
lowh="".join(f'<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #D6DCE4"><span>{n}</span><span class="pill" style="background:{"rgba(192,38,45,.08);color:#C0262D" if s==0 else "#FFF3DC;color:#9A5B00"}">{s} uds</span></div>' for n,s,_ in low)
T=sum(cash)+sum(card)
body=f'''<div class="main">{sub("Resumen")}<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0">{head("Resumen","Jue 29 oct – Mié 4 nov 2026 · Caja 1")}
<div style="display:flex;gap:12px">{kpi("Ventas",eur(T),"12,4 %")}{kpi("Tickets","412","8,1 %")}{kpi("Ticket medio",eur(T/412),"3,9 %")}{kpi("Unidades","1.287","2,3 %",False)}</div>
<div style="display:flex;gap:14px;flex:1;min-height:0"><div class="card" style="flex:1.5;padding:16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between"><div class="b" style="font-size:16px">Ventas por día</div>{legend}</div>{bars(250)}</div>
<div style="flex:1;display:flex;flex-direction:column;gap:14px"><div class="card" style="padding:12px 0 4px"><div style="display:flex;justify-content:space-between;padding:0 14px 8px"><span class="b">Más vendidos</span><span class="xs" style="color:#1D58D0;font-weight:600">Ver todo →</span></div><table style="font-size:13px">{top5}</table></div>
<div class="card" style="padding:12px 14px;flex:1"><div style="display:flex;justify-content:space-between"><span class="b">Stock bajo</span><span class="xs" style="color:#1D58D0;font-weight:600">7 productos →</span></div>{lowh}</div></div></div></div></div>'''
page("A-reports-summary","Informes",body,"INFORMES · RESUMEN")
# Most sold
rows=""
for i,(n,ini,u,r) in enumerate(prods):
    sh=r/TOT*100
    rows+=f'''<tr><td class="b" style="font-size:16px;color:{"#1D58D0" if i<3 else "#566070"}">{i+1}</td><td><div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:6px;background:#EDF0F4;display:flex;align-items:center;justify-content:center;font-weight:700;color:#566070;font-size:12px">{ini}</div><div><div class="b">{n}</div><div class="xs muted">{["Bebidas","Panadería","Lácteos","Panadería","Bebidas","Lácteos","Lácteos","Panadería","Bebidas","Snacks"][i]}</div></div></div></td>
<td class="r">{str(u).replace(".",",")}{" kg" if isinstance(u,float) else ""}</td><td class="r b">{eur(r)}</td><td style="width:200px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:8px;background:#EDF0F4;border-radius:999px"><div style="width:{sh*6}%;height:100%;background:#1D58D0;border-radius:999px"></div></div><span class="xs" style="width:48px">{sh:.1f} %</span></div></td>
<td class="r xs {"up" if i%4 else "dn"} b">{"▲" if i%4 else "▼"} {random.randint(1,30)} %</td></tr>'''
rows=rows.replace(".1f","")
body=f'''<div class="main">{sub("Más vendidos")}<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0">{head("Más vendidos","Ranking de productos · Jue 29 oct – Mié 4 nov 2026")}
<div style="display:flex;gap:10px;align-items:center"><div class="card" style="flex:1;height:42px;display:flex;align-items:center;padding:0 14px" ><span class="muted">🔍 Filtrar producto…</span></div>
<div class="card" style="height:42px;display:flex;align-items:center;padding:0 14px;gap:6px">🏷 Todas las categorías ▾</div>
<span class="lbl">Ordenar por</span><div class="seg"><span>Unidades</span><span class="on">Ingresos</span></div></div>
<div class="card" style="overflow:hidden;flex:1"><table><tr><th style="width:44px">#</th><th>Producto</th><th class="r">Unidades</th><th class="r">Ingresos ▼</th><th>% de ventas</th><th class="r">vs anterior</th></tr>{rows}</table></div></div></div>'''
body=body.replace(" %</span>"," %</span>")
import re
body=re.sub(r'(\d)\.(\d) %',r'\1,\2 %',body)
page("A-reports-most-sold","Informes",body,"INFORMES · MÁS VENDIDOS")
# Takings
tr="".join(f'<tr><td>{d}</td><td class="r">{eur(c)}</td><td class="r">{eur(k)}</td><td class="r b">{eur(c+k)}</td><td class="r">{random.randint(40,80)}</td></tr>' for d,c,k in zip(days,cash,card))
pc=sum(cash)/T*100
body=f'''<div class="main">{sub("Recaudación")}<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0">{head("Recaudación","Caja por día y forma de pago")}
<div style="display:flex;gap:12px">{kpi("Recaudado",eur(T),"12,4 %")}{kpi("Efectivo",eur(sum(cash)),"9,8 %")}{kpi("Tarjeta",eur(sum(card)),"16,2 %")}<div class="card" style="flex:1.2;padding:14px 16px"><div class="lbl">Forma de pago</div>
<div style="display:flex;height:14px;border-radius:999px;overflow:hidden;margin:12px 0 8px"><div style="width:{pc}%;background:#1D58D0"></div><div style="flex:1;background:#0F7B6C"></div></div>
<div class="xs" style="display:flex;justify-content:space-between"><span><b style="color:#1D58D0">■</b> Efectivo {pc:.0f} %</span><span><b style="color:#0F7B6C">■</b> Tarjeta {100-pc:.0f} %</span></div></div></div>
<div style="display:flex;gap:14px;flex:1;min-height:0"><div class="card" style="flex:1.3;padding:16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between"><span class="b" style="font-size:16px">Recaudación diaria</span>{legend}</div>{bars(230)}</div>
<div class="card" style="flex:1.15;overflow:hidden"><table style="font-size:13px" class="tight"><tr><th>Día</th><th class="r">Efectivo</th><th class="r">Tarjeta</th><th class="r">Total</th><th class="r">Tickets</th></tr>{tr}<tr style="background:#EDF0F4"><td class="b">Total</td><td class="r b">{eur(sum(cash))}</td><td class="r b">{eur(sum(card))}</td><td class="r b">{eur(T)}</td><td class="r b">412</td></tr></table>
<div style="padding:14px;display:flex;gap:8px"><div class="btn">🖨 Imprimir cierre</div><div class="btn p">Cerrar caja de hoy</div></div></div></div></div></div>'''
page("A-reports-takings","Informes",body,"INFORMES · RECAUDACIÓN")
# Low stock
ls=[("Pan integral",0,10,"Panadería"),("Croissant",2,20,"Panadería"),("Leche entera Pascual 1 L",4,24,"Lácteos"),("Yogur natural pack 4",3,12,"Lácteos"),("Coca-Cola lata 33 cl",6,48,"Bebidas"),("Chips patatas 150 g",5,15,"Snacks"),("Mantequilla 250 g",2,8,"Lácteos")]
lr=""
for n,s,m,c in ls:
    col="#C0262D" if s==0 else "#9A5B00"
    lr+=f'''<tr><td><div class="b">{n}</div><div class="xs muted">{c}</div></td><td class="r"><span class="pill" style="background:{"rgba(192,38,45,.08)" if s==0 else "#FFF3DC"};color:{col}">{"Agotado" if s==0 else f"{s} uds"}</span></td><td class="r muted">{m} uds</td>
<td style="width:180px"><div style="height:8px;background:#EDF0F4;border-radius:999px"><div style="width:{max(s/m*100,2)}%;height:100%;background:{col};border-radius:999px"></div></div></td><td class="r muted">{random.randint(2,9)} / día</td>
<td class="r"><div class="btn" style="height:34px">＋ Reponer</div></td></tr>'''
body=f'''<div class="main">{sub("Stock bajo")}<div style="flex:1;display:flex;flex-direction:column;gap:14px;min-width:0"><div style="display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-size:28px;font-weight:700">Stock bajo</div><div class="muted">7 productos por debajo del mínimo · 1 agotado</div></div><div class="btn p">⤓ Generar pedido a proveedor</div></div>
<div class="card" style="overflow:hidden"><table><tr><th>Producto</th><th class="r">Stock</th><th class="r">Mínimo</th><th>Nivel</th><th class="r">Ventas medias</th><th></th></tr>{lr}</table></div></div></div>'''
page("A-reports-low-stock","Informes",body,"INFORMES · STOCK BAJO")

# ---- Sell variants
CATS=["Arroces y pastas","Caldos y sopas","Chips","Conservas","Dulces y pastelería","Leche y batidos","Pan","Refrescos","Aguas","Cervezas","Vinos","Lácteos","Quesos","Embutidos","Frutas","Verduras","Congelados","Cereales","Café e infusiones","Aceites","Especias","Limpieza","Higiene","Mascotas","Bebé"]
CNT=[random.randint(3,40) for _ in CATS];CNT[CATS.index('Lácteos')]=18
P=[("Agua Mondariz 1,5 L","AM",0.85),("Coca-Cola lata 33 cl","CC",1.20),("Zumo naranja 1 L","ZN",1.95),("Croissant","CR",0.90),("Croissant cacao","CC",1.10),("Barra de pan","BP",0.70),("Leche entera Pascual 1 L","LE",1.15),("Yogur natural pack 4","YN",1.60),("Queso fresco cottage","QF",1.85),("Queso manchego","QM",18.50),("Magdalenas x6","MG",2.10),("Agua con gas 50 cl","AG",0.95),("Mantequilla 250 g","M2",2.45),("Pan integral","PI",1.40),("Chips patatas","CH",1.50)]
def grid(cols):
    h=f'<div style="display:grid;grid-template-columns:repeat({cols},1fr);gap:10px;flex:1;min-height:0;overflow:hidden;align-content:start">'
    for n,i,p in P[:cols*3]:
        h+=f'<div class="card" style="overflow:hidden;border-radius:10px"><div style="height:56px;background:#EDF0F4;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#566070">{i}</div><div style="padding:8px 10px"><div style="font-size:13px;height:34px;overflow:hidden">{n}</div><div class="b" style="font-size:16px">{eur(p)}{"/kg" if i=="QM" else ""}</div></div></div>'
    return h+'</div>'
ticket=f'''<div class="card" style="width:330px;border-radius:0;border-width:0 0 0 1px;margin:-16px -16px -16px 0;padding:16px;display:flex;flex-direction:column"><div style="font-size:22px;font-weight:700">Ticket nº 42</div><div class="xs muted" style="margin-bottom:10px">5 líneas · 7 artículos</div>
{"".join(f'<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #D6DCE4"><div><div>{n}</div><div class="xs muted">{q} × {eur(p)}</div></div><b>{eur(p*q)}</b></div>' for n,q,p in [("Leche entera Pascual 1 L",1,1.15),("Croissant",3,.90),("Coca-Cola lata 33 cl",1,1.20),("Yogur natural pack 4",1,1.60),("Queso manchego",1,6.48)])}
<div style="flex:1"></div><div style="display:flex;justify-content:space-between;align-items:baseline;margin:12px 0"><span class="muted">Total</span><span style="font-size:44px;font-weight:700">13,13 €</span></div>
<div class="btn p" style="height:56px;justify-content:center;font-size:18px">Cobrar 13,13 € <span class="xs" style="border:1px solid #fff8;border-radius:4px;padding:1px 4px">F12</span></div></div>'''
search=lambda ph="Escanea un código o busca producto…": f'<div class="card" style="flex:1;min-height:48px;max-height:48px;display:flex;align-items:center;padding:0 14px;gap:10px;border:2px solid #1D58D0;border-radius:10px"><span>▥</span><span class="muted">{ph}</span><span style="margin-left:auto" class="xs muted">F2</span></div>'
chip=lambda t,on=False: f'<span style="flex:none;padding:9px 16px;border-radius:999px;border:1px solid #D6DCE4;background:{"#141A23;color:#fff" if on else "#fff"};font-weight:600;white-space:nowrap">{t}</span>'
# a) chips
chips="".join(chip(f"{c} · {n}") for c,n in list(zip(CATS,CNT))[:10])
pop=f'''<div class="card" style="position:absolute;right:0;top:50px;width:340px;padding:12px;box-shadow:0 16px 40px rgba(20,26,35,.18);z-index:5"><div class="card" style="height:40px;display:flex;align-items:center;padding:0 12px;border:2px solid #1D58D0;border-radius:10px">🔍 <span style="margin-left:6px">con</span><span style="border-left:2px solid #141A23;height:18px;margin-left:1px"></span></div>
<div class="lbl" style="margin:12px 4px 6px">Coincidencias</div>{"".join(f'<div style="display:flex;justify-content:space-between;padding:10px;border-radius:8px;{"background:rgba(29,88,208,.12)" if i==0 else ""}"><span><b>{c[:3]}</b>{c[3:]}</span><span class="muted">{n}</span></div>' for i,(c,n) in enumerate([("Conservas",22),("Congelados",31)]))}
<div class="lbl" style="margin:12px 4px 6px">Todas (25)</div><div style="display:flex;flex-wrap:wrap;gap:6px">{"".join(f'<span class="pill" style="background:#EDF0F4;font-size:13px;padding:6px 10px">{c}</span>' for c in CATS[10:22])}</div></div>'''
body=f'''<div class="main"><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">{search()}
<div style="display:flex;gap:8px;align-items:center;position:relative">{chip("★ Favoritos",True)}{chip("Todo · 412")}<div style="flex:1;position:relative;overflow:hidden;display:flex;gap:8px">{chips}<div style="position:absolute;right:0;top:0;bottom:0;width:70px;background:linear-gradient(90deg,#F5F6F800,#F5F6F8)"></div></div>
<span style="flex:none;padding:9px 16px;border-radius:999px;background:rgba(29,88,208,.12);color:#1D58D0;font-weight:700;border:1px solid #1D58D0">Más (25) ▾</span>{pop}</div>{grid(5)}</div>{ticket}</div>'''
page("A-sell-categories-chips","Vender",body,"VENDER · CATEGORÍAS (A) CHIPS + MÁS")
# b) dropdown
dd=f'''<div style="position:relative;width:250px"><div class="card" style="height:48px;display:flex;align-items:center;padding:0 14px;gap:8px;border-radius:10px;border-color:#1D58D0"><span>🏷</span><b>Lácteos</b><span class="muted xs">· 18</span><span style="margin-left:auto">▾</span></div>
<div class="card" style="position:absolute;top:54px;left:0;width:290px;padding:10px;box-shadow:0 16px 40px rgba(20,26,35,.18);z-index:5"><div class="card" style="height:40px;display:flex;align-items:center;padding:0 12px;border-radius:10px" ><span class="muted">🔍 Buscar categoría…</span></div>
<div class="lbl" style="margin:10px 6px 4px">Recientes</div>{"".join(f'<div style="display:flex;justify-content:space-between;padding:9px 10px;border-radius:8px;{"background:rgba(29,88,208,.12);color:#1D58D0;font-weight:700" if c=="Lácteos" else ""}"><span>{"✓ " if c=="Lácteos" else ""}{c}</span><span class="muted">{n}</span></div>' for c,n in [("★ Favoritos",14),("Todo",412),("Lácteos",18),("Pan",9)])}
<div class="lbl" style="margin:10px 6px 4px">A–Z (25)</div>{"".join(f'<div style="display:flex;justify-content:space-between;padding:9px 10px"><span>{c}</span><span class="muted">{n}</span></div>' for c,n in sorted(zip(CATS,CNT))[:7])}<div class="xs muted" style="text-align:center;padding-top:4px">↓ desplaza para ver más</div></div></div>'''
body=f'''<div class="main"><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0"><div style="display:flex;gap:10px">{dd}{search()}</div>
<div class="xs muted">Mostrando <b style="color:#141A23">Lácteos</b> · 18 productos <span style="color:#1D58D0;font-weight:600">✕ Quitar filtro</span></div>{grid(5)}</div>{ticket}</div>'''
page("A-sell-categories-dropdown","Vender",body,"VENDER · CATEGORÍAS (B) DESPLEGABLE")
# c) sidebar
side='<div class="card" style="width:190px;padding:10px 6px;display:flex;flex-direction:column;overflow:hidden"><div style="display:flex;justify-content:space-between;padding:2px 8px 8px"><span class="lbl">Categorías</span><span class="muted">«</span></div><div class="card" style="height:34px;margin:0 4px 6px;display:flex;align-items:center;padding:0 10px;border-radius:8px"><span class="muted xs">🔍 Filtrar…</span></div>'
for c,n in [("★ Favoritos",14),("Todo",412)]+list(zip(CATS,CNT))[:15]:
    on=c=="Lácteos"
    side+=f'<div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:8px;font-size:13px;{"background:rgba(29,88,208,.12);color:#1D58D0;font-weight:700" if on else ""}"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{c}</span><span class="{"" if on else "muted"}">{n}</span></div>'
side+='</div>'
body=f'''<div class="main">{side}<div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">{search()}<div class="b" style="font-size:18px">Lácteos <span class="muted xs">· 18 productos</span></div>{grid(4)}</div>{ticket}</div>'''
page("A-sell-categories-sidebar","Vender",body,"VENDER · CATEGORÍAS (C) LISTA LATERAL")
