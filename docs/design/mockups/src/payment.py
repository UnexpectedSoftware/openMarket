src=open('gen.py').read()
exec(src.split("# a) chips")[0].replace('page("A-reports','(lambda *a,**k:None)("A-reports'))
X="""body{width:100vw;height:100vh}
.ov{position:fixed;inset:0;background:rgba(20,26,35,.48);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9}
.pay{width:clamp(640px,92vw,960px);max-width:calc(100vw - 32px);max-height:90vh;background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(20,26,35,.18);display:grid;grid-template-columns:minmax(0,1fr) 300px;overflow:hidden}
.l{padding:20px;display:flex;flex-direction:column;gap:12px;min-width:0;overflow:auto}
.pv{background:#EDF0F4;padding:16px;overflow:auto}
.amts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.amt{border-radius:10px;padding:10px 12px;background:#EDF0F4;min-width:0}.amt b{display:block;font-size:clamp(20px,3.2vw,30px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.meth{display:grid;grid-template-columns:repeat(4,1fr);background:#EDF0F4;border-radius:10px;padding:4px}.meth span{text-align:center;padding:8px;border-radius:8px;font-weight:600;font-size:13px}.meth .on{background:#fff;box-shadow:0 1px 2px rgba(20,26,35,.06)}
.kpw{display:grid;grid-template-columns:minmax(0,1fr) 160px;gap:10px}
.kp{display:grid;grid-template-columns:repeat(3,minmax(52px,1fr));grid-auto-rows:52px;gap:8px}.kp span,.qa span{border:1px solid #D6DCE4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600}
.qa{display:grid;grid-auto-rows:44px;gap:8px}.qa span{font-size:15px}
.ft{display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #D6DCE4;flex-wrap:wrap}
.tog{display:none}
.rcpt{background:#fff;border-radius:4px;padding:14px;font:11px/1.5 "JetBrains Mono",monospace}
@media (max-width:900px){.pay{grid-template-columns:minmax(0,1fr)}.pv{display:none}.tog{display:inline-flex}.kpw{grid-template-columns:minmax(0,1fr) 130px}}
"""
kp='<div class="kp">'+"".join(f"<span>{k}</span>" for k in "7 8 9 4 5 6 1 2 3 00 0 ⌫".split())+'</div>'
qa='<div class="qa"><div class="lbl">Importe rápido</div>'+"".join(f'<span style="{"border:2px solid #1D58D0" if q=="20 €" else ""}">{q}</span>' for q in ["Exacto 13,13 €","15 €","20 €","50 €"])+'</div>'
lines=[("1x Leche entera Pascual 1","1,15"),("3x Croissant","2,70"),("1x Coca-Cola lata 33 cl","1,20"),("1x Yogur natural pack 4","1,60"),("Queso manchego 0,350 kg","6,48")]
rc='<div class="lbl" style="margin-bottom:8px">Vista previa · 80 mm</div><div class="rcpt"><div style="text-align:center"><b>ULTRAMARINOS LOLA</b><br>C/ Mayor 12 · 07001 Palma<br>NIF B12345678</div><hr style="border:0;border-top:1px dashed #878A8F;margin:8px 0">FACTURA SIMPLIFICADA<br>Nº T2026-000042<hr style="border:0;border-top:1px dashed #878A8F;margin:8px 0">'+"".join(f'<div style="display:flex;justify-content:space-between"><span>{a}</span><span>{b} €</span></div>' for a,b in lines)+'<hr style="border:0;border-top:1px dashed #878A8F;margin:8px 0"><div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px"><span>TOTAL</span><span>13,13 €</span></div><div style="display:flex;justify-content:space-between"><span>Efectivo</span><span>20,00 €</span></div><div style="display:flex;justify-content:space-between"><span>Cambio</span><span>6,87 €</span></div><div style="text-align:center;margin-top:10px">¡Gracias por su compra!</div></div>'
def dlg(note):
    return f'''<div class="ov"><div class="pay"><div class="l"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="color:#1D58D0;font-weight:600">‹ Volver</span><span style="font-size:22px;font-weight:700;flex:1;white-space:nowrap">Cobrar ticket nº 42</span><span class="btn tog" style="height:34px">🧾 Ver ticket</span><span class="pill" style="background:rgba(21,106,58,.16);color:#156A3A">● VERI*FACTU</span></div>
<div class="amts"><div class="amt"><div class="lbl">Total a cobrar</div><b>13,13 €</b></div><div class="amt" style="background:#fff;border:2px solid #1D58D0"><div class="lbl">Entregado</div><b>20,00 €</b></div><div class="amt" style="background:#156A3A;color:#fff"><div class="lbl" style="color:#fffc">Cambio</div><b>6,87 €</b></div></div>
<div class="meth"><span class="on">💶 Efectivo</span><span>💳 Tarjeta</span><span>📱 Bizum</span><span>Mixto</span></div>
<div class="kpw">{kp}{qa}</div><div style="flex:1"></div>
<div class="ft"><span class="xs muted" style="margin-right:auto;align-self:center">{note}</span><div class="btn">Sin ticket</div><div class="btn p" style="height:52px;font-size:16px">🖨 Cobrar e imprimir <span class="xs" style="border:1px solid #fff8;border-radius:4px;padding:1px 4px">Enter</span></div></div></div><div class="pv">{rc}</div></div></div>'''
base=f'<div class="main" style="opacity:.9"><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">{search()}{grid(5)}</div>{ticket}</div>'
page("A-payment-responsive-wide","Vender",base+dlg("Imprimir ticket: Preguntar"),"COBRO RESPONSIVE · ANCHO ≥ 900 PX",X)
page("A-payment-responsive-compact","Vender",base+dlg("Preguntar"),"COBRO RESPONSIVE · COMPACTO &lt; 900 PX",X)
