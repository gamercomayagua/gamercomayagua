/* Gamer Comayagua | Catálogo comercial. Precios públicos únicamente. */
(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var PHONE='50431517755';
var CONFIG={shipping:110,tigo:0.10,cod:0.15,codMin:350};
var catalogReady=false;
var store={cod:null,watermark:window.GC_BOOT_WATERMARK},selectedCatalog=new Set(),selectingCatalog=false,onlyPromos=false,onlyOwn=false,all=[],listed=[],offset=24,cart=Object.create(null),shippingMode='national',localZone='',payMode='transfer',currentDialog='';
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
 var sample=(window.GC_STOCK_SNAPSHOT||{})[p.id];
 if(!Object.prototype.hasOwnProperty.call(p,'stock')&&sample&&Date.now()-Date.parse(sample.verifiedAt)<86400000){
  p=Object.assign({},p,{stock:sample.units,stockVerifiedAt:sample.verifiedAt});
 }
 var stock=p.stock===null||p.stock===undefined||p.stock===''?null:Number(p.stock);
 stock=Number.isInteger(stock)&&stock>=0?stock:null;
 var soldOut=p.soldOut===true||p.status==='AGOTADO'||(stock!==null&&stock<(p.own?1:4));
 return {id:String(p.id),ref:String(p.ref||p.id),own:p.own===true,name:String(p.name),price:integer(p.price),regularPrice:integer(p.regularPrice),discount:Number(p.discount)||0,promotion:p.promotion===true||integer(p.regularPrice)>integer(p.price),cod:p.cod!==false,sku:String(p.sku||''),code:String(p.code||''),category:String(p.category||''),subcategory:String(p.subcategory||''),description:String(p.description||''),photo:cleanUrl(p.photo),freeShipping:p.freeShipping===true||p.freeShipping==='SI',soldOut:soldOut,stock:stock,stockVerifiedAt:p.stockVerifiedAt?String(p.stockVerifiedAt):null};
});}
function stockText(p){
 if(p.soldOut)return 'AGOTADO · No disponible';
 if(p.stock!==null)return 'Disponible: '+p.stock;
 return 'Existencias por confirmar';
}
function maxQty(p){return Math.min(99,p.stock===null?99:p.stock);}
function add(p){
 p=all.find(function(item){return item.id===p.id;});
 if(!p||p.soldOut||p.price===null){toast('Este artículo debe consultarse antes de cotizar.');return;}
 if((cart[p.id]||0)>=maxQty(p)){toast('Ya agregaste la cantidad máxima disponible.');return;}
 cart[p.id]=(cart[p.id]||0)+1;saveCart();toast('Agregado a tu carrito');
}
function logoUrl(){return cleanUrl(store.logo)||window.GC_BRAND_LOGO||'';}
function applyLogo(){
 var url=logoUrl(),target=$('brandLogo');
 if(url){target.src=url;target.hidden=false;$('brandFallback').hidden=true;}
}
function watermarkMarkup(surface){
 var wm=store.watermark;
 if(!wm||wm[surface]===false||!window.GC_MARKS)return '';
 return window.GC_MARKS.markup(wm,logoUrl());
}
function photoMarkup(p){return p.photo?'<img class="gc-product-image" loading="lazy" decoding="async" alt="'+esc(p.name)+'" src="'+esc(p.photo)+'">'+watermarkMarkup('photos'):'<span class="noimg">📦<br>Imagen no disponible</span>';}
function promoBadge(p){
 if(!p.promotion||p.soldOut||p.price===null)return '';
 var discount=p.discount||(p.regularPrice>p.price?Math.round(100*(p.regularPrice-p.price)/p.regularPrice):0);
 var label=discount>0?'−'+discount.toLocaleString('es-HN',{maximumFractionDigits:2})+'%':'OFERTA';
 return '<span class="gc-promo-badge'+(store.promoColor==='yellow'?' gc-promo-yellow':'')+'">'+label+'</span>';
}
function productPrice(p){return (p.regularPrice>p.price?'<del class="gc-old-price">'+money(p.regularPrice)+'</del> ':'')+money(p.price);}
function match(p,q){if(!q)return true;var alltext=[p.name,p.sku,p.code,p.ref,p.category,p.subcategory,p.description].join(' '),words=norm(q).split(' ').filter(Boolean),text=norm(alltext),k=compact(alltext);
if(words.every(function(w){return text.includes(w)||k.includes(w);}))return true;
var qq=compact(q),alternatives=[qq,qq.replace(/ultra/g,'u'),qq.replace(/s24u/g,'s24ultra'),qq.replace(/s23u/g,'s23ultra')];
return alternatives.some(function(x){return x&&k.includes(x);});
}
function selectCategory(){var select=$('category'),value=select.value,choices=[...new Set(all.map(function(p){return p.category;}).filter(Boolean))].sort(function(a,b){return a.localeCompare(b,'es');});select.replaceChildren(new Option('Todas las categorías',''));choices.forEach(function(x){select.add(new Option(x,x));});select.value=choices.includes(value)?value:'';}
function filter(reset){var q=$('search').value.trim(),cat=$('category').value,sort=$('sort').value;listed=all.filter(function(p){return(!onlyOwn||p.own)&&(!onlyPromos||(p.promotion&&!p.soldOut))&&(!cat||p.category===cat)&&match(p,q);});
if(sort==='name')listed.sort(function(a,b){return a.name.localeCompare(b.name,'es');});
if(sort==='priceup')listed.sort(function(a,b){return(a.price===null?Infinity:a.price)-(b.price===null?Infinity:b.price);});
if(sort==='pricedown')listed.sort(function(a,b){return(b.price===null?-1:b.price)-(a.price===null?-1:a.price);});
if(reset!==false)offset=24;render();}
function updateCatalogControls(){
 $('gcSelectCatalog').setAttribute('aria-pressed',String(selectingCatalog));
 $('gcCreateCatalog').disabled=selectedCatalog.size===0;
 $('gcCreateCatalog').textContent=selectedCatalog.size?'Crear catálogo ('+selectedCatalog.size+')':'Crear catálogo';
 $('gcCategoryCatalog').disabled=!listed.length;
}
function render(){
 var root=$('products');root.replaceChildren();$('resultCount').textContent=listed.length.toLocaleString('es-HN')+' productos';
 if(!listed.length)root.innerHTML='<div class="empty" style="grid-column:1/-1"><h3>No hay coincidencias</h3><p>Probá otra palabra o código.</p></div>';
 var fragment=document.createDocumentFragment();
 listed.slice(0,offset).forEach(function(p){
 var card=document.createElement('article');card.className='product'+(p.soldOut?' gc-soldout':'');
 card.innerHTML='<div class="photo gc-open-product" tabindex="0" role="button" aria-label="Ver '+esc(p.name)+'">'+(p.soldOut?'<span class="gc-sold-badge">AGOTADO</span>':p.freeShipping?'<span class="gc-free-badge">ENVÍO GRATIS</span>':'<span class="tag">'+esc(p.category||'TECNOLOGÍA')+'</span>')+photoMarkup(p)+'</div><div class="details"><p class="category">'+esc(p.subcategory||p.category||'Producto')+'</p>'+promoBadge(p)+'<button class="name gc-product-title gc-open-product" type="button">'+esc(p.name)+'</button><button class="price gc-product-price gc-open-product" type="button">'+(p.soldOut?'<span class="gc-out">AGOTADO</span>':productPrice(p))+'</button><p class="gc-stock-line '+(p.soldOut?'is-out':p.stock!==null?'is-in':'')+'">'+esc(stockText(p))+'</p><div class="actions gc-product-action"><button type="button" class="btn add" '+(p.soldOut||p.price===null?'disabled':'')+'>'+(p.soldOut?'Agotado':'＋ Añadir al carrito')+'</button></div></div>';
 if(selectingCatalog){
  var choice=document.createElement('label');choice.className='gc-catalog-choice';
  var check=document.createElement('input');check.type='checkbox';check.checked=selectedCatalog.has(p.id);
  check.setAttribute('aria-label','Seleccionar '+p.name+' para el catálogo');
  check.onchange=function(){if(check.checked)selectedCatalog.add(p.id);else selectedCatalog.delete(p.id);updateCatalogControls();};
  choice.append(check,document.createTextNode('Seleccionar'));card.prepend(choice);
 }
 var img=card.querySelector('.gc-product-image');if(img)img.onerror=function(){img.replaceWith(Object.assign(document.createElement('span'),{className:'noimg',textContent:'Imagen no disponible'}));};
 card.querySelectorAll('.gc-open-product').forEach(function(item){item.onclick=function(){detail(p);};item.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();detail(p);}};});
 card.querySelector('.add').onclick=function(){add(p);};fragment.appendChild(card);
 });root.appendChild(fragment);$('more').style.display=offset<listed.length?'block':'none';updateCatalogControls();
}
function open(node,kind){$('dialogBody').replaceChildren();$('dialogBody').appendChild(node);$('dialog').dataset.view=kind;$('dialog').classList.add('open');document.body.style.overflow='hidden';currentDialog=kind;}
function close(){$('dialog').classList.remove('open');document.body.style.overflow='';currentDialog='';}
function wrap(html){var el=document.createElement('div');el.innerHTML=html;return el;}
function localDestination(){
 return (window.GC_LOCAL_DELIVERIES||[]).find(function(x){return x.id===localZone;})||null;
}
function calc(items,mode){
 var cents=function(value){return Math.round(value*100);};
 var subtotal=items.reduce(function(sum,i){return sum+cents(i.p.price||0)*i.qty;},0);
 var eligible=items.length>0&&items.every(function(i){return i.p.freeShipping;});
 var zone=mode==='local'?localDestination():null;
 var shipping=mode==='pickup'?0:mode==='local'?(zone&&zone.price!==null?(eligible?0:zone.price):null):(eligible?0:CONFIG.shipping);
 var base=shipping===null?null:subtotal+cents(shipping);
 var codReason=store.cod===false?'Suspendido por la tienda':store.cod===null?'Por confirmar con la tienda':items.some(function(i){return i.p.cod===false;})?'Un producto del pedido no admite este pago':subtotal<cents(CONFIG.codMin)?'Compra mínima L 350 en productos':'';
 var fee=function(rate){return base===null?null:Math.round(base*Math.round(rate*100)/100);};
 var tigo=fee(CONFIG.tigo),cod=fee(CONFIG.cod);
 return {subtotal:subtotal/100,shipping:shipping,base:base===null?null:base/100,
  prices:{transfer:base===null?null:base/100,tigo:base===null?null:(base+tigo)/100,cod:base===null||codReason?null:(base+cod)/100},
  tigoFee:tigo===null?null:tigo/100,codFee:cod===null||codReason?null:cod/100,codAllowed:!codReason,codReason:codReason,free:eligible,zone:zone};
}
function paymentRows(q){var quoteAmount=function(amount){return amount===null?'Por confirmar':money(amount);};return '<div class="gc-paygrid"><div class="gc-payrow"><div><strong>Transferencia</strong><small>Sin comisión</small></div><b>'+quoteAmount(q.prices.transfer)+'</b></div><div class="gc-payrow"><div><strong>Tigo Money</strong><small>Comisión del 10%: '+quoteAmount(q.tigoFee)+'</small></div><b>'+quoteAmount(q.prices.tigo)+'</b></div><div class="gc-payrow '+(!q.codAllowed?'gc-pay-disabled':'')+'"><div><strong>Pagar al recibir</strong><small>'+(q.codAllowed?'Comisión del 15%: '+quoteAmount(q.codFee):esc(q.codReason))+'</small></div><b>'+(q.codAllowed?quoteAmount(q.prices.cod):'NO DISPONIBLE')+'</b></div></div>';}
function detail(p){
 var q=calc([{p:p,qty:1}],'national');
 var image=photoMarkup(p).replace('loading="lazy"','loading="eager"');
 var description=p.description&&norm(p.description)!==norm(p.name)?'<p>'+esc(p.description)+'</p>':'';
 var box=wrap('<div class="gc-detail-compact"><div class="gc-detail-image">'+image+'</div><div class="gc-detail-head"><h2>'+esc(p.name)+'</h2><div class="gc-detail-price">'+(p.soldOut?'AGOTADO':productPrice(p))+'</div>'+promoBadge(p)+'<p class="gc-detail-ref">Código: '+esc(p.code||'No indicado')+' · Ref. '+esc(p.ref)+'</p></div><div class="gc-detail-info">'+(p.freeShipping?'<div class="gc-detail-free">Envío gratis</div>':'')+description+'<p class="gc-stock-line '+(p.soldOut?'is-out':p.stock!==null?'is-in':'')+'">'+esc(stockText(p))+'</p><details class="gc-detail-more"><summary>Consultar envíos y formas de pago</summary>'+paymentRows(q)+'</details></div><div class="gc-detail-actions"><button type="button" class="btn red gc-add" '+(p.soldOut||p.price===null?'disabled':'')+'>Añadir al carrito</button><a class="btn outline gc-whatsapp" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn outline gc-share-ficha">Guardar ficha en PNG o PDF</button></div></div>');

 var img=box.querySelector('.gc-product-image');if(img)img.onerror=function(){img.replaceWith(document.createTextNode('Imagen no disponible'));};
 if(p.soldOut)box.classList.add('gc-soldout-detail');
 box.querySelector('.gc-add').onclick=function(){add(p);};
 box.querySelector('.gc-whatsapp').href='https://wa.me/'+PHONE+'?text='+encodeURIComponent('Hola Gamer Comayagua. Quiero consultar por '+p.name+' (ref. '+p.ref+'). Precio de tienda: '+money(p.price)+'. ¿Hay disponibilidad?');
 box.querySelector('.gc-share-ficha').onclick=function(){openCatalog('product',p);};
 open(box,'product');
}
function cartItems(){return Object.keys(cart).map(function(id){var p=all.find(function(x){return x.id===id;}),qty=p?Math.min(cart[id],maxQty(p)):0;return p&&!p.soldOut&&p.price!==null?{p:p,qty:qty}:null;}).filter(Boolean);}
function deliveryLabel(q){
 if(shippingMode==='pickup')return 'Retiro en tienda';
 if(shippingMode==='local')return (q.zone?'Entrega local: '+q.zone.name:'Entrega local: destino pendiente')+(q.free&&q.shipping===0?' (envío gratis)':'');
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
function quoteReference(now){
 var formatter=new Intl.DateTimeFormat('es-HN',{timeZone:'America/Tegucigalpa',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 var parts=Object.fromEntries(formatter.formatToParts(now).map(function(p){return [p.type,p.value];}));
 var serial=Array.from(crypto.getRandomValues(new Uint8Array(3)),function(n){return n.toString(16).padStart(2,'0');}).join('').toUpperCase();
 return 'GC-'+parts.year+parts.month+parts.day+'-'+parts.hour+parts.minute+parts.second+'-'+serial;
}
function comparativeQuote(q){
 var options=[
  ['Transferencia',q.prices.transfer,'Sin comisión'],
  ['Tigo Money',q.prices.tigo,'Comisión del 10%: '+(q.tigoFee===null?'Por confirmar':money(q.tigoFee))],
  ['Pagar al recibir',q.prices.cod,q.codAllowed?'Comisión del 15%: '+(q.codFee===null?'Por confirmar':money(q.codFee)):esc(q.codReason)]
 ];
 return '<section class="quote-compare"><h2>Comparativo de las 3 formas de pago</h2><div class="quote-methods">'+options.map(function(option,index){
  var allowed=index!==2||q.codAllowed;
  var amount=allowed?(option[1]===null?'Por confirmar':money(option[1])):'No disponible';
  return '<div class="box"><strong>'+option[0]+'</strong><b>'+amount+'</b><small>'+option[2]+'</small>'+
    (index===2&&allowed&&q.prices.cod!==null?'<small>Anticipo: '+money(q.shipping+q.codFee)+' · Saldo al recibir: '+money(q.subtotal)+'</small>':'')+'</div>';
 }).join('')+'</div></section>';
}
function printQuote(items,q,comparative){
 var labels={transfer:'Transferencia',tigo:'Tigo Money',cod:'Pagar al recibir'},
 customer=customerData(),now=new Date(),reference=quoteReference(now),
 date=new Intl.DateTimeFormat('es-HN',{timeZone:'America/Tegucigalpa',dateStyle:'long',timeStyle:'short'}).format(now),
 rows=items.map(function(i){
  return '<tr><td>'+esc(i.p.name)+'</td><td>'+i.qty+'</td><td>'+money(i.p.price)+'</td><td class="last">'+money(i.p.price*i.qty)+'</td></tr>';
 }).join('');
 var quoteLogo=logoUrl()?'<img class="quote-logo" alt="" src="'+esc(new URL(logoUrl(),location.href).href)+'">':'';
 var marks=watermarkMarkup('quotes');
 var win=window.open('','_blank');
 if(!win){toast('Permití ventanas emergentes para guardar la cotización');return;}
 var pay=labels[payMode],fee=payMode==='tigo'?q.tigoFee:payMode==='cod'?q.codFee:0;
 var subtotal=money(q.subtotal),total=q.prices[payMode]===null?'Por confirmar':money(q.prices[payMode]);
 var shipping=q.shipping===null?'Por confirmar':q.shipping===0?'GRATIS':money(q.shipping);
 var customerInfo=[customer.nombre,customer.telefono,customer.departamento,customer.municipio,customer.direccion].filter(Boolean).map(esc).join(' · ');
 var comparison=comparative?comparativeQuote(q):'';
 var full='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+reference+' | Gamer Comayagua</title>'+
 '<style>'+(window.GC_MARKS?window.GC_MARKS.styles:'')+'*{box-sizing:border-box}.quote-logo{width:48px;height:48px;object-fit:contain;vertical-align:middle;margin-right:10px}.content{position:relative}.content> :not(.gc-watermark){position:relative;z-index:2}body{background:#eff3f8;color:#182847;font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;font-size:12px}.wrap{max-width:810px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px #15253e1a}.head{background:#fff;color:#182847;border-bottom:4px solid #b8273c;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:23px;font-weight:900;letter-spacing:.01em}.label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#afc4e3;margin-bottom:6px}.headerinfo{text-align:right;font-size:11px;line-height:1.7;color:#516482}.content{padding:30px 34px}.intro{display:flex;justify-content:space-between;gap:15px;margin-bottom:24px}.intro h1{font-size:22px;margin:2px 0 5px}.muted{color:#6e7e98}.badge{border:1px solid #cce5d8;color:#116b45;background:#f0f9f4;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:bold;align-self:flex-start}.table{width:100%;border-collapse:collapse;margin:14px 0 24px}.table thead{background:#edf2f8}.table th{text-align:left;font-size:10px;color:#516482;text-transform:uppercase;letter-spacing:.05em;padding:11px 9px}.table td{padding:12px 9px;border-bottom:1px solid #e8edf4;line-height:1.4}.table th:last-child,.table td.last{text-align:right}.n{color:#a4afbf;font-weight:bold;font-size:10px;margin-right:7px}.sumgrid{display:grid;grid-template-columns:1fr .95fr;gap:22px}.box{border:1px solid #e1e8f0;border-radius:11px;padding:16px}.boxtitle{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7384a0;font-weight:bold;margin:0 0 12px}.line{display:flex;justify-content:space-between;gap:10px;padding:5px 0}.line strong{text-align:right}.grand{background:#fae9ec;color:#901c2d;padding:15px 16px;border-radius:9px;display:flex;justify-content:space-between;align-items:center;font-size:14px;margin-top:12px}.grand strong{font-size:21px}.data{font-size:11px;line-height:1.65;color:#536782;overflow-wrap:anywhere}.foot{margin-top:22px;padding-top:13px;border-top:1px solid #e5ebf3;color:#7e8ba0;font-size:10px;line-height:1.5}.quote-ref{display:block;font-size:15px;font-weight:bold;color:#182847}.quote-kind{display:block;font-weight:bold;color:#526683}.quote-compare{margin-top:16px;break-inside:avoid}.quote-compare h2{font-size:15px;margin:0 0 8px}.quote-methods{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.quote-methods .box{padding:10px}.quote-methods b{display:block;font-size:17px;color:#9e1b33;margin:5px 0}.quote-methods small{display:block;line-height:1.4;margin-top:3px}.tools{text-align:center;padding-bottom:18px}.tools button{font-weight:bold;background:#df354c;color:white;border:0;border-radius:9px;padding:12px 21px;font-size:13px}.note{padding:9px 11px;background:#f6f8fb;border-radius:8px;color:#5f6e88;font-size:10px;margin-top:11px}@page{size:letter;margin:12mm}@media print{body{background:white;margin:0;padding:0}.wrap{max-width:none;box-shadow:none;border-radius:0}.head{padding:20px 24px!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.content{padding:22px 24px}.tools{display:none}.grand{-webkit-print-color-adjust:exact;print-color-adjust:exact}.badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}.box,.grand,.intro,tbody tr{break-inside:avoid}}@media screen and (max-width:620px){body{padding:9px}.head{padding:20px}.brand{font-size:18px}.content{padding:16px}.intro{display:block}.badge{display:inline-block;margin:10px 0}.sumgrid,.quote-methods{grid-template-columns:1fr}.table td{padding:8px 5px;font-size:11px}.table th{padding:8px 5px;font-size:9px}.grand strong{font-size:19px}.headerinfo{font-size:10px}}</style>'+
 '</head><body><div class="tools"><button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></div><div class="wrap"><header class="head"><div><div class="brand">'+quoteLogo+'GAMER COMAYAGUA</div></div><div class="headerinfo"><span class="quote-kind">'+(comparative?'Cotización · 3 formas de pago':'Cotización')+'</span><span class="quote-ref">'+reference+'</span><time datetime="'+now.toISOString()+'">'+esc(date)+' · Honduras</time></div></header><main class="content">'+marks+'<div class="intro"><div><h1>Cotización</h1></div></div><table class="table"><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Importe</th></tr></thead><tbody>'+rows+'</tbody></table><div class="sumgrid"><div class="box"><div class="boxtitle">ENTREGA Y CLIENTE</div><div class="data"><strong>'+esc(deliveryLabel(q))+'</strong><br>Costo de envío: '+shipping+'<br><br>'+(customerInfo||'Datos de entrega pendientes de confirmar')+'</div></div><div class="box"><div class="boxtitle">RESUMEN DEL PEDIDO</div><div class="line"><span>Productos</span><strong>'+subtotal+'</strong></div><div class="line"><span>Envío</span><strong>'+shipping+'</strong></div>'+(comparative?'':'<div class="line"><span>Forma de pago</span><strong>'+pay+'</strong></div><div class="line"><span>Comisión'+(payMode==='tigo'?' (10%)':payMode==='cod'?' (15%)':'')+'</span><strong>'+(fee===null?'Por confirmar':money(fee))+'</strong></div><div class="grand"><span>TOTAL</span><strong>'+total+'</strong></div>')+'</div></div>'+comparison+'<p class="note">Los precios y existencias se confirman al realizar el pedido. '+(!comparative&&payMode==='cod'&&q.prices.cod!==null?'Anticipo: '+money(q.shipping+q.codFee)+' · Saldo al recibir: '+money(q.subtotal)+'. ':'')+'Consulta o confirma tu pedido por WhatsApp al +504 3151-7755.</p><footer class="foot">Gamer Comayagua · Envíos a toda Honduras · Este documento no constituye una factura ni una confirmación de existencias.</footer></main></div></body></html>';
 win.document.open();win.document.write(full);win.document.close();
}
function showBankAccounts(root){
 var accounts=[
  ['BAC Honduras','755925871'],['Banco Atlántida','2020666940'],['Banco Azteca','75080117613318'],
  ['Banco de Occidente','217020233253'],['Banco Ficohsa','200021495637'],['Banpaís','213450118392'],
  ['Banrural','500840002420'],['Kash','#gabrielguerrerohn'],['Tigo Money','9474-6828']
 ];
 var holder='RENEE GABRIEL GUERRERO COELLO',identity='0301199303922';
 var panel=document.createElement('dialog');panel.className='gc-bank-panel';
 panel.setAttribute('aria-labelledby','gcBankHeading');
 panel.innerHTML='<header><div><h2 id="gcBankHeading">Datos bancarios</h2><p>Gamer Comayagua · Información oficial de pago</p></div><button class="btn outline" type="button" aria-label="Cerrar datos bancarios">✕</button></header>'+
  '<div class="gc-bank-content"><p><strong>Titular</strong><br>'+holder+'<br>DNI / Identidad: '+identity+'</p><dl>'+
  accounts.map(function(account){return '<div><dt>'+account[0]+'</dt><dd>'+account[1]+'</dd></div>';}).join('')+
  '</dl><p>Confirmá la cuenta y el monto antes de depositar.</p><button type="button" class="btn gc-bank-copy">Copiar datos bancarios</button><p class="gc-bank-status" role="status"></p></div>';
 panel.querySelector('header button').onclick=function(){panel.close();};
 panel.querySelector('.gc-bank-copy').onclick=async function(){
  var lines=['GAMER COMAYAGUA','DATOS BANCARIOS','Titular: '+holder,'DNI / Identidad: '+identity].concat(accounts.map(function(account){return account[0]+': '+account[1];}),['Confirmá la cuenta y el monto antes de depositar.']);
  var status=panel.querySelector('.gc-bank-status');
  try{await navigator.clipboard.writeText(lines.join('\n'));status.textContent='Datos copiados.';}
  catch(error){status.textContent='Seleccioná los datos para copiarlos.';}
 };
 panel.addEventListener('close',function(){panel.remove();});
 root.appendChild(panel);panel.showModal();
}
function cartView(refresh){var previous=refresh===true?customerData():null;currentDialog='cart';var root=wrap(`<div class="gc-checkout"><header class="gc-cart-head"><img alt="" src="${esc(logoUrl())}"><h2>Mi cotización</h2></header>
<div class="gc-cart-layout"><div class="gc-cart-main">
<section class="gc-section"><h3>Productos</h3><div id="gcCartItems"></div></section>
<section class="gc-section"><h3>Entrega y envío</h3><div class="gc-ship-choices"><label><input type="radio" name="gcShipping" value="national"><span>Envío nacional <small>L 110 (o gratis si aplica)</small></span></label><label><input type="radio" name="gcShipping" value="local"><span>Comayagua y alrededores <small>Tarifa según destino</small></span></label><label><input type="radio" name="gcShipping" value="pickup"><span>Retiro en tienda <small>Sin costo</small></span></label></div><div id="gcLocalField" class="gc-local-chooser" hidden><label for="gcLocalSearch">Buscar colonia, barrio o destino</label><input id="gcLocalSearch" type="search" placeholder="Ej. Piedras Bonitas, Mall, Lejamaní..." autocomplete="off"><label for="gcLocalZone">Elegir ubicación</label><select id="gcLocalZone"><option value="">Seleccioná un destino</option></select><p id="gcLocalCost" class="gc-local-cost" aria-live="polite">Seleccioná tu destino para calcular el envío.</p><p class="gc-local-smallprint">Tarifas desde Col. Piedras Bonitas. Incluye 10 min de cortesía. Espera adicional +L 15–20; parada extra +L 15 dentro de Comayagua o +L 20 en ruta interurbana. Jarín calle adentro: +L 5–10. Estos adicionales se confirman antes del cobro. Sin cobertura local en Siguatepeque ni La Libertad.</p></div></section><section class="gc-section"><h3>Datos de entrega</h3><div class="gc-customer-grid"><label>Nombre<input id="customerName" placeholder="Nombre del cliente" autocomplete="name" maxlength="100"></label><label>Celular<input id="customerPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+504..." maxlength="30"></label><label>Departamento<select id="customerDepartment"></select></label><label>Municipio<select id="customerMunicipality"></select></label><label class="gc-full">Barrio, colonia o referencia<input id="customerAddress" maxlength="160" placeholder="Dirección para la entrega"></label></div></section></div><aside class="gc-cart-summary"><section class="gc-section"><h3>Resumen y forma de pago</h3><div class="gc-pay-choices"><label><input type="radio" name="gcPayment" value="transfer"> Transferencia</label><label><input type="radio" name="gcPayment" value="tigo"> Tigo Money</label><label><input type="radio" name="gcPayment" value="cod"> Pagar al recibir</label></div><div id="gcSelectedTotal" class="gc-selected" aria-live="polite"></div><div id="gcCompare"></div></section><div class="gc-cart-actions"><button type="button" id="gcWhatsapp" class="btn red">Continuar por WhatsApp</button><button type="button" id="gcPrint" class="btn gc-quote-button">Descargar cotización<small>Pago seleccionado</small></button><button type="button" id="gcPrintCompare" class="btn gc-quote-button">3 Métodos de Pago<small>Comparar los 3 precios</small></button><button type="button" id="gcBank" class="btn outline">Cuentas de banco</button><button type="button" id="gcClear" class="btn outline">Vaciar carrito</button></div><p class="hint">Los importes son de referencia y están sujetos a existencias y confirmación de Gamer Comayagua.</p></aside></div></div>`);
var itemsBox=root.querySelector('#gcCartItems'),compare=root.querySelector('#gcCompare'),total=root.querySelector('#gcSelectedTotal'),
 localField=root.querySelector('#gcLocalField'),localSearch=root.querySelector('#gcLocalSearch'),localSelect=root.querySelector('#gcLocalZone'),localCost=root.querySelector('#gcLocalCost');
function normalizeLocation(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function fillLocations(){
 var query=normalizeLocation(localSearch.value.trim()),zones=window.GC_LOCAL_DELIVERIES||[],selected=localZone;
 localSelect.replaceChildren(new Option('Seleccioná una colonia o destino',''));
 var lastSector='';
 zones.filter(function(z){return !query||normalizeLocation(z.name+' '+(z.aliases||'')+' '+z.sector).includes(query);}).forEach(function(z){
   var sector=z.sector;
   if(sector!==lastSector){var group=document.createElement('optgroup');group.label=sector;localSelect.add(group);lastSector=sector;}
   localSelect.lastElementChild.appendChild(new Option(z.name+' — '+(z.price===null?'Envío por confirmar':'L '+z.price),z.id));
 });
 var exists=[...localSelect.options].some(function(opt){return opt.value===selected;});
 localSelect.value=exists?selected:'';
 if(!exists&&selected)localZone='';
 localCost.textContent=localZone?(function(){var z=localDestination();return z?(z.price===null?'Envío por confirmar por WhatsApp.':'Tarifa base: '+money(z.price))+(z.ownSaleException?' · Venta propia: consultar si aplica envío gratis':'')+(z.jarin?' · Calle adentro: +L 5–10 a confirmar':''):'';})():'Seleccioná tu destino para calcular el envío.';
}
function updateLocalField(){localField.hidden=shippingMode!=='local';}
localSearch.addEventListener('input',function(){fillLocations();totalsRender();});
localSelect.addEventListener('change',function(){localZone=localSelect.value;fillLocations();totalsRender();});
fillLocations();updateLocalField();
function itemRender(){itemsBox.replaceChildren();var items=cartItems();if(!items.length){itemsBox.innerHTML='<div class="empty">No tenés artículos en el carrito.</div>';return;}items.forEach(function(i){var row=wrap('<div class="gc-item"><div class="gc-quote-item">'+(i.p.photo?'<img src="'+esc(i.p.photo)+'" alt="" loading="lazy">':'')+'<div><strong>'+esc(i.p.name)+'</strong><small>'+money(i.p.price)+' c/u</small></div></div><div class="gc-item-side"><b>'+money(i.p.price*i.qty)+'</b><div class="qty"><button type="button" class="gc-dec" aria-label="Disminuir cantidad">−</button><span>'+i.qty+'</span><button type="button" class="gc-inc" aria-label="Aumentar cantidad">＋</button></div></div></div>');row.querySelector('.gc-dec').onclick=function(){cart[i.p.id]=i.qty-1;if(cart[i.p.id]<=0)delete cart[i.p.id];saveCart();itemRender();totalsRender();};row.querySelector('.gc-inc').disabled=i.qty>=maxQty(i.p);row.querySelector('.gc-inc').onclick=function(){cart[i.p.id]=Math.min(maxQty(i.p),i.qty+1);saveCart();itemRender();totalsRender();};itemsBox.appendChild(row);});}
function totalsRender(){var items=cartItems(),q=calc(items,shippingMode);compare.innerHTML='<div class="gc-subtotal-line"><span>Subtotal de productos</span><b>'+money(q.subtotal)+'</b></div><div class="gc-subtotal-line"><span>Envío</span><b>'+(q.shipping===null?'Por confirmar':money(q.shipping))+'</b></div><details class="gc-cart-compare"><summary>Comparar las formas de pago</summary>'+paymentRows(q)+'</details>';
var cod=root.querySelector('input[name=gcPayment][value=cod]');cod.disabled=!q.codAllowed;if(!q.codAllowed&&payMode==='cod')payMode='transfer';
root.querySelector('input[name=gcPayment][value='+payMode+']').checked=true;
var chosen=q.prices[payMode],fee=payMode==='tigo'?q.tigoFee:payMode==='cod'?q.codFee:0;
total.innerHTML='<div><span>Total con '+(payMode==='transfer'?'transferencia':payMode==='tigo'?'Tigo Money':'pago al recibir')+'</span><strong>'+(chosen===null?'Por confirmar':money(chosen))+'</strong></div>'+(chosen===null?(q.zone?'<p>Confirmá la tarifa de este destino por WhatsApp.</p>':'<p>Seleccioná un destino para calcular tu envío local.</p>'):payMode==='cod'?'<p>Anticipo: '+money(q.shipping+fee)+' · Saldo al recibir: '+money(q.subtotal)+'</p>':payMode==='tigo'?'<p>Incluye comisión de '+money(fee)+'</p>':'<p>Sin comisión adicional</p>');
return q;}
root.querySelectorAll('input[name=gcShipping]').forEach(function(input){input.checked=input.value===shippingMode;input.onchange=function(){shippingMode=this.value;updateLocalField();totalsRender();};});
root.querySelectorAll('input[name=gcPayment]').forEach(function(input){input.checked=input.value===payMode;input.onchange=function(){payMode=this.value;totalsRender();};});
if(window.GC_HONDURAS)window.GC_HONDURAS.bind(root.querySelector('#customerDepartment'),root.querySelector('#customerMunicipality'));
else {root.querySelector('#customerDepartment').outerHTML='<input id="customerDepartment" placeholder="Departamento">';root.querySelector('#customerMunicipality').outerHTML='<input id="customerMunicipality" placeholder="Municipio">';}
root.querySelector('#gcClear').onclick=function(){cart=Object.create(null);saveCart();itemRender();totalsRender();};
root.querySelector('#gcWhatsapp').onclick=function(){if(!catalogReady){toast('Espera a que se actualicen los precios.');return;}var items=cartItems();if(!items.length){toast('Primero agregá productos al carrito');return;}var q=totalsRender();if(shippingMode==='local'&&!q.zone){toast('Elegí la colonia o destino para calcular el envío');localSelect.focus();return;}var url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(buildMessage(items,q,customerData()));window.open(url,'_blank','noopener');};
function openQuote(comparative){
 if(!catalogReady){toast('Espera a que se actualicen los precios.');return;}
 var items=cartItems();
 if(!items.length){toast('Primero agregá productos');return;}
 var q=totalsRender();
 if(shippingMode==='local'&&!q.zone){toast('Elegí el destino antes de imprimir');localSelect.focus();return;}
 printQuote(items,q,comparative);
}
root.querySelector('#gcPrint').onclick=function(){openQuote(false);};
root.querySelector('#gcPrintCompare').onclick=function(){openQuote(true);};
root.querySelector('#gcBank').onclick=function(){showBankAccounts(root);};
itemRender();totalsRender();open(root,'cart');
if(previous){
 $('customerName').value=previous.nombre;$('customerPhone').value=previous.telefono;
 $('customerDepartment').value=previous.departamento;$('customerDepartment').dispatchEvent(new Event('change'));
 $('customerMunicipality').value=previous.municipio;$('customerAddress').value=previous.direccion;
}}
async function fetchStatic(){var meta=await fetch('data/meta.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Catálogo no disponible');return r.json();});
var chunks=await Promise.all(meta.parts.map(function(path){return fetch(path).then(function(r){if(!r.ok)throw Error('Archivo faltante: '+path);return r.json();});}));
return chunks.flatMap(function(c){return c.products||[];});}
function jsonp(url,params){return new Promise(function(resolve,reject){var callback='gcPublic_'+Math.random().toString(36).slice(2),tag=document.createElement('script'),timer=setTimeout(function(){finish(Error('Demasiado tiempo sin respuesta'));},18000);
function finish(err,data){clearTimeout(timer);tag.remove();try{delete window[callback];}catch(e){}if(err)reject(err);else resolve(data);}
window[callback]=function(data){finish(null,data);};tag.onerror=function(){finish(Error('No fue posible actualizar'));};tag.src=url+(url.includes('?')?'&':'?')+new URLSearchParams(Object.assign({},params,{callback:callback}));document.head.appendChild(tag);});}
function catalogUrl(){
 var url=String(window.GC_LIVE_ENDPOINT||'').trim();
 return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)?url:'';
}
function updateStore(next){
 if(!next)return;
 var oldMark=JSON.stringify([store.watermark,store.logo]);
 store=Object.assign({},store,next);
 applyLogo();
 try{localStorage.setItem('gc-mark-config',JSON.stringify({watermark:store.watermark,logo:store.logo}));}catch(error){}
 if(oldMark===JSON.stringify([store.watermark,store.logo]))return;
 document.querySelectorAll('.photo,.gc-detail-image').forEach(function(frame){
  frame.querySelector('.gc-watermark')?.remove();
  if(frame.querySelector('.gc-product-image'))frame.insertAdjacentHTML('beforeend',watermarkMarkup('photos'));
 });
}
async function fetchLive(url,first){
 var initial=await first;
 if(!initial.ok||!Array.isArray(initial.products))throw Error('Respuesta inválida');
 var total=Number(initial.total);
 if(!Number.isInteger(total)||total<=0||total>20000)throw Error('Total inválido');
 var positions=Array.from({length:Math.ceil((total-1)/400)},function(_,i){return String(i*400+1);});
 var parts=[];
 for(var i=0;i<positions.length;i+=4){
  var batch=await Promise.all(positions.slice(i,i+4).map(function(offset){return jsonp(url,{offset:offset,limit:'400'});}));
  parts.push(...batch);
 }
 if(parts.some(function(part){return !part.ok||!Array.isArray(part.products);}))throw Error('Página incompleta');
 return initial.products.concat(parts.flatMap(function(part){return part.products;}));
}
var ownEndpoint='https://script.google.com/macros/s/AKfycbyXFSUVkTIstSCDjBxkignIdsqoiQKgV1_5Y68nMEMSmJ-2aTPjcgjgCBjIL6xokFs/exec';
var oldSite='https://sdcomayagua.github.io/sdcomayagua/';
function ownPhoto(product,mirrors){
 var mirror=mirrors[product.id],image=product.image;
 var path=mirror&&mirror.source===image?mirror.path:image;
 return /^assets\/(?:catalog|products)\/[\w.-]+\.(?:webp|jpg|jpeg|png)$/i.test(path)?new URL(path,oldSite).href:cleanUrl(path);
}
function ownProducts(rows,mirrors){
 var ids=new Set();
 return prepare(rows.flatMap(function(p){
  if(!p||p.active!==true||!p.name||!/^[a-zA-Z0-9_-]{1,43}$/.test(p.id||'')||ids.has(p.id))return [];
  ids.add(p.id);
  var regular=integer(p.price),offer=integer(p.promoPrice),discounted=offer!==null&&offer<regular;
  return [{id:'propio-'+p.id,ref:p.code||p.id,own:true,code:p.code,name:p.name,category:p.category,
   price:discounted?offer:regular,regularPrice:discounted?regular:null,promotion:discounted||Boolean(p.promoText),
   photo:ownPhoto(p,mirrors),stock:p.stock,description:p.description,cod:p.codAllowed===true}];
 }));
}
function catalogKey(p){return p.code?compact(p.code)+'|'+norm(p.name):'';}
async function init(){
 try{var local=JSON.parse(localStorage.getItem('gc-mark-config')||'null');if(local)store=Object.assign({},store,local);}catch(error){}
 applyLogo();
 var supplier=[],own=[],mirrors={},ownLive=false;
 function updateCatalog(){
  var ownKeys=new Set(own.map(catalogKey).filter(Boolean));
  all=own.concat(supplier.filter(function(p){return !ownKeys.has(catalogKey(p));}));
  var retained=all.some(function(p){return p.own;});
  $('ownOnly').hidden=!retained;
  if(!retained){onlyOwn=false;$('ownOnly').setAttribute('aria-pressed','false');}
  selectCategory();filter(false);
  if(currentDialog==='cart')cartView(true);
 }
 var url=catalogUrl(),first=url?jsonp(url,{offset:'0',limit:'1'}):null;
 if(first)first.then(function(data){if(data.ok)updateStore(data.store);},function(){});
 var supplierLive=first?fetchLive(url,first).then(function(rows){return rows;},function(){return null;}):Promise.resolve(null);
 var ownSnapshot=fetch('data/productos-propios.json').then(function(response){
  if(!response.ok)throw Error('Copia de productos propios no disponible');
  return response.json();
 }).then(function(data){
  mirrors=data.mirrors||{};
  if(!ownLive){own=ownProducts(data.products,mirrors);updateCatalog();}
 }).catch(console.error);
 var controller=new AbortController();
 var timeout=setTimeout(function(){controller.abort();},15000);
 var refreshOwn=fetch(ownEndpoint+'?action=publicCatalog',{signal:controller.signal}).then(function(response){
  if(!response.ok)throw Error('Productos propios no disponibles');
  return response.json();
 }).then(async function(data){
  if(!data.ok||data.catalogSchemaVersion!==2||!Array.isArray(data.products))throw Error('Catálogo propio inválido');
  await ownSnapshot;
  own=ownProducts(data.products,mirrors);ownLive=true;updateCatalog();
 }).catch(function(){}).finally(function(){clearTimeout(timeout);});
 var supplierSnapshot=fetchStatic().then(function(rows){
  supplier=prepare(rows);updateCatalog();
  $('syncStatus').textContent='Catálogo Gamer Comayagua';
 }).catch(function(e){console.error(e);if(!all.length)$('resultCount').textContent='Catálogo no disponible';});
 var refreshSupplier=Promise.all([supplierLive,supplierSnapshot]).then(function(results){
  if(results[0]?.length){supplier=prepare(results[0]);updateCatalog();$('syncStatus').textContent='✓ Precios del proveedor actualizados';}
 });
 await Promise.all([ownSnapshot,supplierSnapshot]);
 catalogReady=true;
 await Promise.all([refreshOwn,refreshSupplier]);
}
function openCatalog(source,product){
 if(!window.GC_EXPORT)return;
 var category=$('category').value, query=$('search').value.trim();
 var choices=Array.from($('category').options).filter(function(o){return o.value;}).map(function(o){return o.value;});
 var selected=source==='product'?[product]:source==='selected'?all.filter(function(p){return selectedCatalog.has(p.id);}):null;
 window.GC_EXPORT.open({
  source:source,selected:selected,getSelected:function(){if(source==='product')return [all.find(function(p){return p.id===product.id;})||product];return all.filter(function(p){return selectedCatalog.has(p.id);});},categories:choices,category:category,query:query,
  results:function(){return listed;},byCategory:function(name){return all.filter(function(p){return p.category===name&&(!onlyOwn||p.own);});},
  logo:logoUrl(), getWatermark:function(){return store.watermark;}, phone:PHONE, money:money, stockText:stockText,
  canExport:function(){return catalogReady;},
  show:function(root){open(root,'catalogue');},close:close
 });
}
$('gcSelectCatalog').onclick=function(){selectingCatalog=!selectingCatalog;render();};
$('gcCreateCatalog').onclick=function(){openCatalog('selected');};
$('gcCategoryCatalog').onclick=function(){openCatalog('category');};
$('ownOnly').onclick=function(){onlyOwn=!onlyOwn;this.setAttribute('aria-pressed',String(onlyOwn));filter();};
$('promotionsOnly').onclick=function(){onlyPromos=!onlyPromos;this.setAttribute('aria-pressed',String(onlyPromos));filter();};
$('search').addEventListener('input',filter);$('category').addEventListener('change',filter);$('sort').addEventListener('change',filter);$('more').onclick=function(){offset+=24;render();};
$('cartFloat').onclick=cartView;$('cartTop').onclick=cartView;$('closeDialog').onclick=close;$('dialog').onclick=function(event){if(event.target===$('dialog'))close();};document.addEventListener('keydown',function(event){if(event.key==='Escape')close();});
if(window.GC_MARKS)window.GC_MARKS.applyStyles();
readCart();renderCounts();init();
})();