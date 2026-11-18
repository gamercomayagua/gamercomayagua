/* Gamer Comayagua | Catálogo comercial. Precios públicos únicamente. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var PHONE='50431517755';
var CONFIG={shipping:110,tigo:0.10,cod:0.15,codMin:350};
var all=[],listed=[],offset=24,cart=Object.create(null),shippingMode='national',localZone='',payMode='transfer',currentDialog='';
var money=function(n){return n===null||n===undefined?'Consultar precio':'L '+Number(n).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2});};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var norm=function(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();};
var compact=function(s){return norm(s).replace(/\s+/g,'');};
var cleanUrl=function(v){return /^https:\/\//i.test(String(v||''))?String(v):'';};
var integer=function(v){var x=Number(v);return Number.isFinite(x)&&x>0?Math.round(x*100)/100:null;};
function readCart(){try{var saved=JSON.parse(localStorage.getItem('gc-cart')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved)){Object.keys(saved).slice(0,100).forEach(function(id){if(/^[a-zA-Z0-9_-]{1,50}$/.test(id)){var q=Number(saved[id]);if(Number.isInteger(q)&&q>0&&q<=99)cart[id]=q;}});}}catch(e){}}
function saveCart(){try{localStorage.setItem('gc-cart',JSON.stringify(cart));}catch(e){}renderCounts();}
function renderCounts(){var n=Object.values(cart).reduce(function(s,q){return s+q;},0);$('countTop').textContent=n;$('countFloat').textContent=n;}
function toast(text){var t=$('toast');t.textContent=text;t.style.display='block';clearTimeout(toast.timeout);toast.timeout=setTimeout(function(){t.style.display='none';},2600);}
function prepare(list){return (Array.isArray(list)?list:[]).filter(function(p){return p&&p.id&&p.name;}).map(function(p){
 var stock=p.stock===null||p.stock===undefined||p.stock===''?null:Number(p.stock);
 stock=Number.isInteger(stock)&&stock>=0?stock:null;
 var soldOut=p.soldOut===true||p.status==='AGOTADO'||(stock!==null&&stock<4);
 return {id:String(p.id),name:String(p.name),price:integer(p.price),sku:String(p.sku||''),code:String(p.code||''),category:String(p.category||''),subcategory:String(p.subcategory||''),description:String(p.description||''),photo:cleanUrl(p.photo),freeShipping:p.freeShipping===true||p.freeShipping==='SI',soldOut:soldOut,stock:stock,stockVerifiedAt:p.stockVerifiedAt?String(p.stockVerifiedAt):null};
});}
function stockText(p){
 if(p.soldOut)return 'AGOTADO · No disponible';
 if(p.stock!==null)return 'Disponible: '+p.stock;
 return 'Existencias por confirmar';
}
function add(p){if(p.soldOut||p.price===null){toast('Este artículo debe consultarse antes de cotizar.');return;}cart[p.id]=Math.min(99,(cart[p.id]||0)+1);saveCart();toast('Agregado a tu carrito');}
function photoMarkup(p){return p.photo?'<img loading="lazy" decoding="async" alt="'+esc(p.name)+'" src="'+esc(p.photo)+'">':'<span class="noimg">📦<br>Imagen no disponible</span>';}
function match(p,q){if(!q)return true;var alltext=[p.name,p.sku,p.code,p.id,p.category,p.subcategory,p.description].join(' '),words=norm(q).split(' ').filter(Boolean),text=norm(alltext),k=compact(alltext);
if(words.every(function(w){return text.includes(w)||k.includes(w);}))return true;
var qq=compact(q),alternatives=[qq,qq.replace(/ultra/g,'u'),qq.replace(/s24u/g,'s24ultra'),qq.replace(/s23u/g,'s23ultra')];
return alternatives.some(function(x){return x&&k.includes(x);});
}
function selectCategory(){var select=$('category'),value=select.value,choices=[...new Set(all.map(function(p){return p.category;}).filter(Boolean))].sort(function(a,b){return a.localeCompare(b,'es');});select.replaceChildren(new Option('Todas las categorías',''));choices.forEach(function(x){select.add(new Option(x,x));});select.value=choices.includes(value)?value:'';}
function filter(){var q=$('search').value.trim(),cat=$('category').value,sort=$('sort').value;listed=all.filter(function(p){return(!cat||p.category===cat)&&match(p,q);});
if(sort==='name')listed.sort(function(a,b){return a.name.localeCompare(b.name,'es');});
if(sort==='priceup')listed.sort(function(a,b){return(a.price===null?Infinity:a.price)-(b.price===null?Infinity:b.price);});
if(sort==='pricedown')listed.sort(function(a,b){return(b.price===null?-1:b.price)-(a.price===null?-1:a.price);});
offset=24;render();}
function render(){
 var root=$('products');root.replaceChildren();$('resultCount').textContent=listed.length.toLocaleString('es-HN')+' productos';
 if(!listed.length)root.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>No hay coincidencias</h3><p>Probá otra palabra o código.</p></div>';
 var fragment=document.createDocumentFragment();
 listed.slice(0,offset).forEach(function(p){
 var card=document.createElement('article');card.className='product'+(p.soldOut?' gc-soldout':'');
 card.innerHTML='<div class="photo gc-open-product" tabindex="0" role="button" aria-label="Ver '+esc(p.name)+'">'+(p.soldOut?'<span class="gc-sold-badge">AGOTADO</span>':p.freeShipping?'<span class="gc-free-badge">ENVÍO GRATIS</span>':'<span class="tag">'+esc(p.category||'TECNOLOGÍA')+'</span>')+photoMarkup(p)+'</div><div class="details"><p class="category">'+esc(p.subcategory||p.category||'Producto')+'</p><button class="name gc-product-title gc-open-product" type="button">'+esc(p.name)+'</button><button class="price gc-product-price gc-open-product" type="button">'+(p.soldOut?'<span class="gc-out">AGOTADO</span>':money(p.price))+'</button><p class="gc-stock-line '+(p.soldOut?'is-out':p.stock!==null?'is-in':'')+'">'+esc(stockText(p))+'</p><div class="actions gc-product-action"><button type="button" class="btn add" '+(p.soldOut||p.price===null?'disabled':'')+'>'+(p.soldOut?'Agotado':'＋ Añadir al carrito')+'</button></div></div>';
 var img=card.querySelector('img');if(img)img.onerror=function(){img.replaceWith(Object.assign(document.createElement('span'),{className:'noimg',textContent:'Imagen no disponible'}));};
 card.querySelectorAll('.gc-open-product').forEach(function(item){item.onclick=function(){detail(p);};item.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();detail(p);}};});
 card.querySelector('.add').onclick=function(){add(p);};fragment.appendChild(card);
 });root.appendChild(fragment);$('more').style.display=offset<listed.length?'block':'none';
}
function open(node,kind){$('dialogBody').replaceChildren();$('dialogBody').appendChild(node);$('dialog').classList.add('open');document.body.style.overflow='hidden';currentDialog=kind;}
function close(){$('dialog').classList.remove('open');document.body.style.overflow='';currentDialog='';}
function wrap(html){var el=document.createElement('div');el.innerHTML=html;return el;}
function localDestination(){
 return (window.GC_LOCAL_DELIVERIES||[]).find(function(x){return x.id===localZone;})||null;
}
function calc(items,mode){
 var total=items.reduce(function(s,i){return s+(i.p.price||0)*i.qty;},0);
 var eligible=items.length>0&&items.every(function(i){return i.p.freeShipping;});
 var zone=mode==='local'?localDestination():null;
 // Una tarifa exacta requiere destino, aunque el envío sea promocional.
 var knownShipping=mode!=='local'||!!zone;
 var shipping=mode==='pickup'?0:mode==='local'?(zone?(eligible?0:zone.price):null):(eligible?0:CONFIG.shipping);
 var base=knownShipping&&shipping!==null?total+shipping:null;
 var roundFeeTotal=function(rate){return base===null?null:Math.ceil(Math.round(base*(1+rate)*100)/100);};
 var prices={transfer:base===null?null:base,tigo:roundFeeTotal(CONFIG.tigo),cod:roundFeeTotal(CONFIG.cod)};
 return {subtotal:total,shipping:shipping,base:base,prices:prices,tigoFee:prices.tigo===null?null:prices.tigo-base,codFee:prices.cod===null?null:prices.cod-base,codAllowed:total>=CONFIG.codMin,free:eligible,zone:zone};
}
function paymentRows(q){return '<div class="gc-paygrid"><div class="gc-payrow"><div><strong>Transferencia</strong><small>Sin comisión</small></div><b>'+money(q.prices.transfer)+'</b></div><div class="gc-payrow"><div><strong>Tigo Money</strong><small>Comisión del 10%: '+money(q.tigoFee)+'</small></div><b>'+money(q.prices.tigo)+'</b></div><div class="gc-payrow '+(!q.codAllowed?'gc-pay-disabled':'')+'"><div><strong>Pagar al recibir</strong><small>'+(q.codAllowed?'Comisión del 15%: '+money(q.codFee):'Compra mínima L 350 en productos')+'</small></div><b>'+(q.codAllowed?money(q.prices.cod):'NO DISPONIBLE')+'</b></div></div>';}
function detail(p){
 var q=calc([{p:p,qty:1}],'national');
 var box=wrap('<div class="gc-detail-compact"><div class="gc-detail-head"><div class="gc-detail-brand">GAMER COMAYAGUA</div><div class="gc-detail-price">'+(p.soldOut?'AGOTADO':money(p.price))+'</div><h2>'+esc(p.name)+'</h2><p class="gc-detail-ref">Código: '+esc(p.code||'No indicado')+' · Ref. '+esc(p.id)+'</p></div><div class="gc-detail-image">'+photoMarkup(p)+'</div><div class="gc-detail-info">'+(p.freeShipping?'<div class="gc-detail-free">✓ ENVÍO GRATIS</div>':'')+'<p>'+esc(p.description||'Consultá los detalles por WhatsApp.')+'</p><p class="gc-stock-line '+(p.soldOut?'is-out':p.stock!==null?'is-in':'')+'">'+esc(stockText(p))+'</p><details class="gc-detail-more"><summary>Consultar envíos y formas de pago</summary><div class="gc-paygrid">'+paymentRows(q)+'</div><p class="hint">Importes de referencia. Confirmar disponibilidad.</p></details></div><div class="gc-detail-actions"><button type="button" class="btn red gc-add" '+(p.soldOut||p.price===null?'disabled':'')+'>＋ Añadir al carrito</button><a class="btn outline gc-whatsapp" target="_blank" rel="noopener">WhatsApp</a></div></div>');
 var img=box.querySelector('img');if(img)img.onerror=function(){img.replaceWith(document.createTextNode('Imagen no disponible'));};
 if(p.soldOut)box.classList.add('gc-soldout-detail');
 box.querySelector('.gc-add').onclick=function(){add(p);};
 box.querySelector('.gc-whatsapp').href='https://wa.me/'+PHONE+'?text='+encodeURIComponent('Hola Gamer Comayagua. Quiero consultar por '+p.name+' (ref. '+p.id+'). Precio de tienda: '+money(p.price)+'. ¿Hay disponibilidad?');
 open(box,'product');
}
function cartItems(){return Object.keys(cart).map(function(id){var p=all.find(function(x){return x.id===id;}),qty=cart[id];return p&&!p.soldOut&&p.price!==null?{p:p,qty:qty}:null;}).filter(Boolean);}
function deliveryLabel(q){
 if(shippingMode==='pickup')return 'Retiro en tienda';
 if(shippingMode==='local')return (q.zone?'Entrega local: '+q.zone.name:'Entrega local: destino pendiente')+(q.free?' (envío gratis)':'');
 return q.free?'Envío nacional gratis':'Envío nacional';
}
function buildMessage(items,q,customer){var paymentNames={transfer:'Transferencia / depósito',tigo:'Tigo Money',cod:'Pagar al recibir'};
var lines=['*GAMER COMAYAGUA*','*SOLICITUD DE COTIZACIÓN*','','*PRODUCTOS*'];
items.forEach(function(i){lines.push('• '+i.qty+' × '+i.p.name+' — '+money(i.p.price*i.qty));});
lines.push('','Subtotal: '+money(q.subtotal),'Entrega: '+deliveryLabel(q),'Envío: '+(q.shipping===null?'PENDIENTE DE CONFIRMAR':money(q.shipping)),'Método de pago: '+paymentNames[payMode]);
if(q.prices[payMode]!==null){if(payMode==='tigo')lines.push('Comisión Tigo Money (10%): '+money(q.tigoFee));if(payMode==='cod')lines.push('Comisión pago al recibir (15%): '+money(q.codFee));lines.push('*TOTAL: '+money(q.prices[payMode])+'*');if(payMode==='cod'){lines.push('Anticipo (envío + comisión): '+money(q.shipping+q.codFee));lines.push('Saldo en efectivo al recibir: '+money(q.subtotal));}}
else lines.push('*TOTAL PENDIENTE DE COTIZAR ENVÍO Y COMISIÓN*');
var fields=[['nombre','Cliente'],['telefono','Teléfono'],['departamento','Departamento'],['municipio','Municipio'],['direccion','Barrio/colonia y referencia']];
fields.forEach(function(f){var v=String(customer[f[0]]||'').trim();if(v)lines.push(f[1]+': '+v);});
if(shippingMode==='local')lines.push('Tarifa base desde Col. Piedras Bonitas. Espera, parada adicional o calle adentro, si aplica, se cotiza por separado.');
lines.push('','Solicito confirmar disponibilidad, envío y datos de pago.');return lines.join('\n');}
function customerData(){var data={};[['nombre','customerName'],['telefono','customerPhone'],['departamento','customerDepartment'],['municipio','customerMunicipality'],['direccion','customerAddress']].forEach(function(pair){data[pair[0]]=$(pair[1])?$(pair[1]).value.trim():'';});return data;}
function printQuote(items,q){
 var labels={transfer:'Transferencia',tigo:'Tigo Money',cod:'Pagar al recibir'},
 customer=customerData(),date=new Date().toLocaleDateString('es-HN',{year:'numeric',month:'long',day:'numeric'}),
 rows=items.map(function(i,j){
  return '<tr><td><span class="n">'+String(j+1).padStart(2,'0')+'</span> '+esc(i.p.name)+'</td><td>'+i.qty+'</td><td>'+money(i.p.price)+'</td><td class="last">'+money(i.p.price*i.qty)+'</td></tr>';
 }).join('');
 var win=window.open('','_blank');
 if(!win){toast('Permití ventanas emergentes para guardar la cotización');return;}
 var pay=labels[payMode],fee=payMode==='tigo'?q.tigoFee:payMode==='cod'?q.codFee:0;
 var subtotal=money(q.subtotal),total=q.prices[payMode]===null?'Por confirmar':money(q.prices[payMode]);
 var shipping=q.shipping===null?'Por confirmar':q.shipping===0?'GRATIS':money(q.shipping);
 var customerInfo=[customer.nombre,customer.telefono,customer.departamento,customer.municipio,customer.direccion].filter(Boolean).map(esc).join(' · ');
 var full='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotización Gamer Comayagua</title>'+
 '<style>*{box-sizing:border-box}body{background:#eff3f8;color:#182847;font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;font-size:12px}.wrap{max-width:810px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px #15253e1a}.head{background:#132340;color:white;padding:30px 34px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:23px;font-weight:900;letter-spacing:.01em}.label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#afc4e3;margin-bottom:6px}.headerinfo{text-align:right;font-size:11px;line-height:1.7;color:#d8e4f7}.content{padding:30px 34px}.intro{display:flex;justify-content:space-between;gap:15px;margin-bottom:24px}.intro h1{font-size:22px;margin:2px 0 5px}.muted{color:#6e7e98}.badge{border:1px solid #cce5d8;color:#116b45;background:#f0f9f4;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:bold;align-self:flex-start}.table{width:100%;border-collapse:collapse;margin:14px 0 24px}.table thead{background:#edf2f8}.table th{text-align:left;font-size:10px;color:#516482;text-transform:uppercase;letter-spacing:.05em;padding:11px 9px}.table td{padding:12px 9px;border-bottom:1px solid #e8edf4;line-height:1.4}.table th:last-child,.table td.last{text-align:right}.n{color:#a4afbf;font-weight:bold;font-size:10px;margin-right:7px}.sumgrid{display:grid;grid-template-columns:1fr .95fr;gap:22px}.box{border:1px solid #e1e8f0;border-radius:11px;padding:16px}.boxtitle{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7384a0;font-weight:bold;margin:0 0 12px}.line{display:flex;justify-content:space-between;gap:10px;padding:5px 0}.line strong{text-align:right}.grand{background:#162c53;color:#fff;padding:15px 16px;border-radius:9px;display:flex;justify-content:space-between;align-items:center;font-size:14px;margin-top:12px}.grand strong{font-size:21px}.data{font-size:11px;line-height:1.65;color:#536782;overflow-wrap:anywhere}.foot{margin-top:22px;padding-top:13px;border-top:1px solid #e5ebf3;color:#7e8ba0;font-size:10px;line-height:1.5}.tools{text-align:center;padding-bottom:18px}.tools button{font-weight:bold;background:#df354c;color:white;border:0;border-radius:9px;padding:12px 21px;font-size:13px}.note{padding:9px 11px;background:#f6f8fb;border-radius:8px;color:#5f6e88;font-size:10px;margin-top:11px}@page{size:letter;margin:12mm}@media print{body{background:white;margin:0;padding:0}.wrap{max-width:none;box-shadow:none;border-radius:0}.head{padding:20px 24px!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.content{padding:22px 24px}.tools{display:none}.grand{-webkit-print-color-adjust:exact;print-color-adjust:exact}.badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}.box,.grand,.intro,tbody tr{break-inside:avoid}}@media(max-width:620px){body{padding:9px}.head{padding:20px}.brand{font-size:18px}.content{padding:16px}.intro{display:block}.badge{display:inline-block;margin:10px 0}.sumgrid{grid-template-columns:1fr}.table td{padding:8px 5px;font-size:11px}.table th{padding:8px 5px;font-size:9px}.grand strong{font-size:19px}.headerinfo{font-size:10px}}</style>'+
 '</head><body><div class="tools"><button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></div><div class="wrap"><header class="head"><div><div class="label">HONDURAS · COTIZACIÓN</div><div class="brand">GAMER COMAYAGUA</div></div><div class="headerinfo">+504 3151-7755<br>'+esc(date)+'</div></header><main class="content"><div class="intro"><div><div class="label" style="color:#7284a0">PROPUESTA COMERCIAL</div><h1>Tu cotización</h1><div class="muted">Detalle de productos y opción de pago seleccionada</div></div><span class="badge">COTIZACIÓN SIN COMPROMISO</span></div><table class="table"><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Importe</th></tr></thead><tbody>'+rows+'</tbody></table><div class="sumgrid"><div class="box"><div class="boxtitle">ENTREGA Y CLIENTE</div><div class="data"><strong>'+esc(deliveryLabel(q))+'</strong><br>Costo de envío: '+shipping+'<br><br>'+(customerInfo||'Datos de entrega pendientes de confirmar')+'</div></div><div class="box"><div class="boxtitle">RESUMEN DEL PEDIDO</div><div class="line"><span>Productos</span><strong>'+subtotal+'</strong></div><div class="line"><span>Envío</span><strong>'+shipping+'</strong></div><div class="line"><span>Forma de pago</span><strong>'+pay+'</strong></div><div class="line"><span>Comisión'+(payMode==='tigo'?' (10%)':payMode==='cod'?' (15%)':'')+'</span><strong>'+(fee===null?'Por confirmar':money(fee))+'</strong></div><div class="grand"><span>TOTAL</span><strong>'+total+'</strong></div></div></div><p class="note">Los precios y existencias se confirman al realizar el pedido. '+(payMode==='cod'&&q.prices.cod!==null?'Anticipo: '+money(q.shipping+q.codFee)+' · Saldo al recibir: '+money(q.subtotal)+'. ':'')+'Consulta o confirma tu pedido por WhatsApp al +504 3151-7755.</p><footer class="foot">Gamer Comayagua · Envíos a toda Honduras · Este documento no constituye una factura ni una confirmación de existencias.</footer></main></div></body></html>';
 win.document.open();win.document.write(full);win.document.close();
}
function cartView(){currentDialog='cart';var root=wrap('<div class="gc-checkout"><div class="gc-cart-head"><div><p class="category">GAMER COMAYAGUA</p><h2>🛒 Mi cotización</h2><p class="muted">Revisá tu pedido y elegí cómo pagar.</p></div></div><div id="gcCartItems"></div><section class="gc-section"><h3>🚚 Entrega y envío</h3><div class="gc-ship-choices"><label><input type="radio" name="gcShipping" value="national"><span>Envío nacional <small>L 110 (o gratis si aplica)</small></span></label><label><input type="radio" name="gcShipping" value="local"><span>Comayagua y alrededores <small>Tarifa según destino</small></span></label><label><input type="radio" name="gcShipping" value="pickup"><span>Retiro en tienda <small>Sin costo</small></span></label></div><div id="gcLocalField" class="gc-local-chooser" hidden><label for="gcLocalSearch">Buscar colonia, barrio o destino</label><input id="gcLocalSearch" type="search" placeholder="Ej. Piedras Bonitas, Mall, Lejamaní..." autocomplete="off"><label for="gcLocalZone">Elegir ubicación</label><select id="gcLocalZone"><option value="">Seleccioná un destino</option></select><p id="gcLocalCost" class="gc-local-cost" aria-live="polite">Seleccioná tu destino para calcular el envío.</p><p class="gc-local-smallprint">Tarifas desde Col. Piedras Bonitas. Incluye 10 min de cortesía. Espera adicional +L 15–20; parada extra +L 15 dentro de Comayagua o +L 20 en ruta interurbana. Jarín calle adentro: +L 5–10. Estos adicionales se confirman antes del cobro. Sin cobertura local en Siguatepeque ni La Libertad.</p></div></section><section class="gc-section"><h3>💳 Comparar formas de pago</h3><div id="gcCompare"></div><div class="gc-pay-choices"><label><input type="radio" name="gcPayment" value="transfer"> Transferencia</label><label><input type="radio" name="gcPayment" value="tigo"> Tigo Money</label><label><input type="radio" name="gcPayment" value="cod"> Pagar al recibir</label></div><div id="gcSelectedTotal" class="gc-selected"></div></section><section class="gc-section"><h3>📍 Datos para tu cotización</h3><div class="gc-customer-grid"><label>Nombre<input id="customerName" placeholder="Nombre del cliente" autocomplete="name" maxlength="100"></label><label>Celular<input id="customerPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+504..." maxlength="30"></label><label>Departamento<select id="customerDepartment"></select></label><label>Municipio<select id="customerMunicipality"></select></label><label class="gc-full">Barrio, colonia o referencia<input id="customerAddress" maxlength="160" placeholder="Dirección para la entrega"></label></div></section><div class="gc-cart-actions"><button type="button" id="gcWhatsapp" class="btn red">Enviar cotización por WhatsApp</button><button type="button" id="gcPrint" class="btn outline">Imprimir / Guardar PDF</button><button type="button" id="gcClear" class="btn outline">Vaciar carrito</button></div><p class="hint">Los importes son de referencia y están sujetos a existencias y confirmación de Gamer Comayagua.</p></div>');
var itemsBox=root.querySelector('#gcCartItems'),compare=root.querySelector('#gcCompare'),total=root.querySelector('#gcSelectedTotal'),
 localField=root.querySelector('#gcLocalField'),localSearch=root.querySelector('#gcLocalSearch'),localSelect=root.querySelector('#gcLocalZone'),localCost=root.querySelector('#gcLocalCost');
function normalizeLocation(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function fillLocations(){
 var query=normalizeLocation(localSearch.value.trim()),zones=window.GC_LOCAL_DELIVERIES||[],selected=localZone;
 localSelect.replaceChildren(new Option('Seleccioná una colonia o destino',''));
 var lastSector='';
 zones.filter(function(z){return !query||normalizeLocation(z.name+' '+z.sector).includes(query);}).forEach(function(z){
   var sector=z.sector;
   if(sector!==lastSector){var group=document.createElement('optgroup');group.label=sector;localSelect.add(group);lastSector=sector;}
   localSelect.lastElementChild.appendChild(new Option(z.name+' — L '+z.price,z.id));
 });
 var exists=[...localSelect.options].some(function(opt){return opt.value===selected;});
 localSelect.value=exists?selected:'';
 if(!exists&&selected)localZone='';
 localCost.textContent=localZone?(function(){var z=localDestination();return z?'Tarifa base: '+money(z.price)+(z.ownSaleException?' · Venta propia: consultar si aplica envío gratis':'')+(z.jarin?' · Calle adentro: +L 5–10 a confirmar':''):'';})():'Seleccioná tu destino para calcular el envío.';
}
function updateLocalField(){localField.hidden=shippingMode!=='local';}
localSearch.addEventListener('input',function(){fillLocations();totalsRender();});
localSelect.addEventListener('change',function(){localZone=localSelect.value;fillLocations();totalsRender();});
fillLocations();updateLocalField();
function itemRender(){itemsBox.replaceChildren();var items=cartItems();if(!items.length){itemsBox.innerHTML='<div class="empty">No tenés artículos en el carrito.</div>';return;}items.forEach(function(i){var row=wrap('<div class="gc-item"><div><strong>'+esc(i.p.name)+'</strong><small>'+money(i.p.price)+' c/u</small></div><div class="gc-item-side"><b>'+money(i.p.price*i.qty)+'</b><div class="qty"><button type="button" class="gc-dec" aria-label="Disminuir cantidad">−</button><span>'+i.qty+'</span><button type="button" class="gc-inc" aria-label="Aumentar cantidad">＋</button></div></div></div>');row.querySelector('.gc-dec').onclick=function(){cart[i.p.id]-=1;if(cart[i.p.id]<=0)delete cart[i.p.id];saveCart();itemRender();totalsRender();};row.querySelector('.gc-inc').onclick=function(){cart[i.p.id]=Math.min(99,cart[i.p.id]+1);saveCart();itemRender();totalsRender();};itemsBox.appendChild(row);});}
function totalsRender(){var items=cartItems(),q=calc(items,shippingMode);compare.innerHTML='<div class="gc-subtotal-line"><span>Subtotal de productos</span><b>'+money(q.subtotal)+'</b></div><div class="gc-subtotal-line"><span>Envío</span><b>'+(q.shipping===null?'Por confirmar':money(q.shipping))+'</b></div>'+paymentRows(q);
var cod=root.querySelector('input[name=gcPayment][value=cod]');cod.disabled=!q.codAllowed;if(!q.codAllowed&&payMode==='cod')payMode='transfer';
root.querySelector('input[name=gcPayment][value='+payMode+']').checked=true;
var chosen=q.prices[payMode],fee=payMode==='tigo'?q.tigoFee:payMode==='cod'?q.codFee:0;
total.innerHTML='<div><span>Total con '+(payMode==='transfer'?'transferencia':payMode==='tigo'?'Tigo Money':'pago al recibir')+'</span><strong>'+(chosen===null?'Por confirmar':money(chosen))+'</strong></div>'+(chosen===null?'<p>Seleccioná un destino para calcular tu envío local.</p>':payMode==='cod'?'<p>Anticipo: '+money(q.shipping+fee)+' · Saldo al recibir: '+money(q.subtotal)+'</p>':payMode==='tigo'?'<p>Incluye comisión de '+money(fee)+'</p>':'<p>Sin comisión adicional</p>');
return q;}
root.querySelectorAll('input[name=gcShipping]').forEach(function(input){input.checked=input.value===shippingMode;input.onchange=function(){shippingMode=this.value;updateLocalField();totalsRender();};});
root.querySelectorAll('input[name=gcPayment]').forEach(function(input){input.checked=input.value===payMode;input.onchange=function(){payMode=this.value;totalsRender();};});
if(window.GC_HONDURAS)window.GC_HONDURAS.bind(root.querySelector('#customerDepartment'),root.querySelector('#customerMunicipality'));
else {root.querySelector('#customerDepartment').outerHTML='<input id="customerDepartment" placeholder="Departamento">';root.querySelector('#customerMunicipality').outerHTML='<input id="customerMunicipality" placeholder="Municipio">';}
root.querySelector('#gcClear').onclick=function(){cart=Object.create(null);saveCart();itemRender();totalsRender();};
root.querySelector('#gcWhatsapp').onclick=function(){var items=cartItems();if(!items.length){toast('Primero agregá productos al carrito');return;}var q=totalsRender();if(shippingMode==='local'&&!q.zone){toast('Elegí la colonia o destino para calcular el envío');localSelect.focus();return;}var url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(buildMessage(items,q,customerData()));window.open(url,'_blank','noopener');};
root.querySelector('#gcPrint').onclick=function(){var items=cartItems();if(!items.length){toast('Primero agregá productos');return;}var q=totalsRender();if(shippingMode==='local'&&!q.zone){toast('Elegí el destino antes de imprimir');localSelect.focus();return;}printQuote(items,q);};
itemRender();totalsRender();open(root,'cart');}
async function fetchStatic(){var meta=await fetch('data/meta.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Catálogo no disponible');return r.json();});
var chunks=await Promise.all(meta.parts.map(function(path){return fetch(path).then(function(r){if(!r.ok)throw Error('Archivo faltante: '+path);return r.json();});}));
return chunks.flatMap(function(c){return c.products||[];});}
function jsonp(url,params){return new Promise(function(resolve,reject){var callback='gcPublic_'+Math.random().toString(36).slice(2),tag=document.createElement('script'),timer=setTimeout(function(){finish(Error('Demasiado tiempo sin respuesta'));},18000);
function finish(err,data){clearTimeout(timer);tag.remove();try{delete window[callback];}catch(e){}if(err)reject(err);else resolve(data);}
window[callback]=function(data){finish(null,data);};tag.onerror=function(){finish(Error('No fue posible actualizar'));};tag.src=url+(url.includes('?')?'&':'?')+new URLSearchParams(Object.assign({},params,{callback:callback}));document.head.appendChild(tag);});}
async function fetchLive(url){if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url))throw Error('Endpoint inválido');
var initial=await jsonp(url,{offset:'0',limit:'400'});if(!initial.ok||!Array.isArray(initial.products))throw Error('Respuesta inválida');
var total=Number(initial.total);if(!Number.isInteger(total)||total<=0||total>20000)throw Error('Total inválido');
var rows=initial.products.slice();
for(var pos=400;pos<total;pos+=400){var part=await jsonp(url,{offset:String(pos),limit:'400'});if(!part.ok||!Array.isArray(part.products))throw Error('Página incompleta');rows.push.apply(rows,part.products);}
return rows;}
async function init(){try{all=prepare(await fetchStatic());selectCategory();filter();$('syncStatus').textContent='Catálogo Gamer Comayagua · '+all.length.toLocaleString('es-HN')+' artículos';}catch(e){console.error(e);$('resultCount').textContent='Catálogo no disponible';$('products').innerHTML='<div class="empty" style="grid-column:1/-1">No fue posible cargar los productos.</div>';}
var url=String(window.GC_LIVE_ENDPOINT||'').trim();if(url)try{var recent=prepare(await fetchLive(url));if(recent.length){all=recent;selectCategory();filter();$('syncStatus').textContent='✓ Precios sincronizados con Google Sheets';}}catch(e){console.warn('Conexión en vivo no disponible; usando respaldo.',e);$('syncStatus').textContent='Copia pública · confirmá el precio al pedir';}}
$('search').addEventListener('input',filter);$('category').addEventListener('change',filter);$('sort').addEventListener('change',filter);$('more').onclick=function(){offset+=24;render();};
$('cartFloat').onclick=cartView;$('cartTop').onclick=cartView;$('closeDialog').onclick=close;$('dialog').onclick=function(event){if(event.target===$('dialog'))close();};document.addEventListener('keydown',function(event){if(event.key==='Escape')close();});
readCart();renderCounts();init();
})();