src=open('gen.py').read()
exec(src.split("# a) chips")[0].replace('page("A-reports','(lambda *a,**k:None)("A-reports'))
X=""".ov{position:fixed;inset:0;background:rgba(20,26,35,.48);display:flex;align-items:center;justify-content:center;z-index:9}
.dlg{width:420px;background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(20,26,35,.18);padding:20px}
.kp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kp span{height:52px;border:1px solid #D6DCE4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;box-shadow:0 1px 2px rgba(20,26,35,.06)}
.qc{display:flex;gap:6px}.qc span{flex:1;text-align:center;padding:8px 0;border:1px solid #D6DCE4;border-radius:999px;font-weight:600;font-size:13px}"""
def dlg(kg,tot,on):
    zero=kg=="0,000"
    disp=f'<div style="border:2px solid {"#1D58D0" if not zero else "#D6DCE4"};border-radius:10px;padding:10px 14px;text-align:right;margin:14px 0 10px"><div style="font-size:40px;font-weight:700;color:{"#878A8F" if zero else "#141A23"}">{kg}{"" if zero else "<span style=\'border-left:2px solid #1D58D0;margin-left:2px\'></span>"}<span style="font-size:20px;color:#566070"> kg</span></div><div style="font-size:18px;font-weight:600;color:#566070">= {tot}</div></div>'
    qc='<div class="qc" style="margin-bottom:10px">'+"".join(f'<span style="{"background:rgba(29,88,208,.12);border-color:#1D58D0;color:#1D58D0" if q==on else ""}">{q}</span>' for q in ["100 g","250 g","500 g","1 kg"])+'</div>'
    kp='<div class="kp">'+"".join(f'<span>{k}</span>' for k in "7 8 9 4 5 6 1 2 3 , 0 ⌫".split())+'</div>'
    add=f'<div class="btn p" style="{"opacity:.4" if zero else ""}">Añadir <span class="xs" style="border:1px solid #fff8;border-radius:4px;padding:1px 4px">Enter</span></div>'
    return f'''<div class="ov"><div class="dlg"><div style="display:flex;align-items:flex-start;gap:10px"><div style="width:44px;height:44px;border-radius:10px;background:#EDF0F4;display:flex;align-items:center;justify-content:center;font-weight:700;color:#566070">QM</div><div style="flex:1"><div class="b" style="font-size:18px">Queso manchego</div><div class="muted">18,50 € / kg · Peso (kg)</div></div><span style="font-size:20px;color:#566070">✕</span></div>
{disp}{qc}{kp}<div class="btn" style="width:100%;justify-content:center;margin-top:10px;height:40px">⚖ Leer báscula <span class="xs muted">(si hay báscula conectada)</span></div>
<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid #D6DCE4"><div class="btn">Cancelar <span class="xs muted">Esc</span></div>{add}</div></div></div>'''
chips="".join(chip(f"{c} · {n}") for c,n in list(zip(CATS,CNT))[:10])
base=f'<div class="main"><div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">{search()}<div style="display:flex;gap:8px;overflow:hidden">{chip("★ Favoritos",True)}{chip("Todo · 412")}{chips}</div>{grid(5)}</div>{ticket}</div>'
page("A-sell-weight-dialog","Vender",base+dlg("0,000","0,00 €",None),"VENDER · DIÁLOGO PESO (VACÍO)",X)
page("A-sell-weight-dialog-entered","Vender",base+dlg("0,350","6,48 €",None),"VENDER · DIÁLOGO PESO (INTRODUCIDO)",X)
