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
var savedCombos=window.GC_COMBOS||[],comboGroup=$('comboGroup'),comboSize=$('comboSize'),comboOrder=$('comboOrder');
var comboPrices='loading',comboPage=0,combosPerPage=6;
var comboReference=prepare(window.GC_COMBO_REFERENCE||[]);
var referenceNames=new Map(comboReference.map(function(p){return [p.id,p.name];}));
var shortLabels={'6139':'Luces verdes','6138':'Luces azules','11305':'Luces blancas de 92 LED','6150':'Luces blancas de 93 LED','5980':'Luces blancas de 92 focos','11312':'Luces blancas de 270 LED','11328':'Luces blancas de 368 LED'};
var extraCombos=(window.GC_EXTRA_COMBOS||[]).flatMap(function(group){
 return group[1].map(function(row){
  var items=row[1].map(function(id){return [id,shortLabels[id]||referenceNames.get(id)||'Ref. '+id];});
  var usedNames=new Set();
  items.forEach(function(item){
   if(usedNames.has(item[1]))item[1]+=' (ref. '+item[0]+')';
   usedNames.add(item[1]);
  });
  var ledTree=row[1].includes('11324')||row[1].includes('11325');
  return {group:group[0],name:row[0],products:items,
   note:ledTree?'Colocá las luces adicionales y los adornos por separado, alrededor del árbol LED.':''};
 });
});
var season=extraCombos.filter(function(combo){return combo.group===savedCombos[0]?.group;});
var combos=savedCombos.slice(0,4).concat(season,savedCombos.slice(4),extraCombos.filter(function(combo){return combo.group!==savedCombos[0]?.group;}));
[...new Set(combos.map(function(combo){return combo.group;}))].forEach(function(group){comboGroup.add(new Option(group,group));});
function comboItems(combo,byId){
 return combo.products.map(function(entry){
  return {p:byId.get(entry[0]),label:entry[1],qty:entry[2]||1};
 });
}
function unavailableComboItem(item){
 return !item.p||item.p.soldOut||item.p.price===null||maxQty(item.p)<item.qty;
}
function addCombo(combo){
 var items=comboItems(combo,new Map(all.map(function(p){return [p.id,p];})));
 if(comboPrices!=='ready'||items.some(unavailableComboItem)){toast('Este combo todavía no está disponible.');return;}
 if(items.some(function(item){return (cart[item.p.id]||0)+item.qty>maxQty(item.p);})){
  toast('El combo supera la cantidad disponible para tu carrito.');return;
 }
 items.forEach(function(item){cart[item.p.id]=(cart[item.p.id]||0)+item.qty;});
 saveCart();toast('Combo agregado a tu carrito');
}
var comboDetail=null,comboDetailTrigger=null;
function comboCost(items){
 if(!items.every(function(item){return item.p?.price!=null;}))return null;
 return items.reduce(function(sum,item){return sum+Math.round(item.p.price*100)*item.qty;},0)/100;
}
function activeCombos(byId){
 var rows=combos.filter(function(combo){return combo.group===comboGroup.value&&(!comboSize.value||combo.products.length===+comboSize.value);});
 if(!comboOrder.value)return rows;
 var direction=comboOrder.value==='low'?1:-1;
 return rows.map(function(combo){return {combo:combo,price:comboCost(comboItems(combo,byId))};})
  .sort(function(a,b){return (a.price===null)-(b.price===null)||direction*((a.price||0)-(b.price||0));})
  .map(function(entry){return entry.combo;});
}
function comboCatalog(){
 var byId=new Map(all.map(function(p){return [p.id,p];}));
 if(comboPrices!=='ready')comboReference.forEach(function(p){byId.set(p.id,p);});
 return byId;
}
function comboSummary(items){
 var blocked=comboPrices!=='ready'||items.some(unavailableComboItem);
 var pending=items.some(function(item){return item.p?.stock===null;});
 var total=comboCost(items),priced=total!==null;
 var status=comboPrices==='loading'?'Actualizando precios':comboPrices==='unavailable'?'Precios por confirmar':blocked?'Combo no disponible':pending?'Existencias por confirmar':'Disponible';
 return {blocked:blocked,priced:priced,total:total,status:status,tone:blocked?'is-out':pending?'':'is-in',reference:comboPrices!=='ready'};
}
function comboTotal(summary){
 return '<div class="gc-combo-total"><div><small>'+(summary.reference?'Precio de referencia':'Total del combo')+'</small><strong>'+money(summary.total)+'</strong></div>'+
  '<span class="gc-combo-stock '+summary.tone+'">'+summary.status+'</span></div>';
}
function comboLinePrice(item,summary){
 return summary.priced?'<span>'+money(Math.round(item.p.price*100)*item.qty/100)+'</span>':'';
}
function comboAddButton(summary){
 return '<button class="btn gc-combo-add" type="button"'+(summary.blocked?' disabled':'')+'>Añadir combo al carrito</button>';
}
function comboThumbnail(item){
 // Vista reducida dentro de un botón, con elementos de texto válidos en el botón.
 return item.p?.photo?photoMarkup(item.p).replace(/<(\/?)div\b/g,'<$1span'):'<span>Sin foto</span>';
}
function comboNote(combo){
 return combo.note?'<p class="gc-combo-note">'+esc(combo.note)+'</p>':'';
}
function comboImageFallback(root){
 root.querySelectorAll('.gc-product-image').forEach(function(img){
  img.onerror=function(){img.parentElement.textContent='Sin foto';};
 });
}
function renderCombos(){
 var grid=$('comboGrid'),byId=comboCatalog();
 var groupCombos=activeCombos(byId),pageCount=Math.ceil(groupCombos.length/combosPerPage);
 var start=comboPage*combosPerPage;
 var status=groupCombos.length+' combos · '+(comboPage+1)+' de '+pageCount;
 ['','Bottom'].forEach(function(suffix){
  $('comboPager'+suffix).hidden=pageCount<=1;
  $('comboPrevious'+suffix).disabled=comboPage===0;
  $('comboNext'+suffix).disabled=comboPage+1>=pageCount;
  $('comboPageStatus'+suffix).textContent=status;
 });
 var cards=groupCombos.slice(start,start+combosPerPage).map(function(combo,index){
  var items=comboItems(combo,byId),summary=comboSummary(items);
  var card=document.createElement('article');card.className='gc-combo-card';
  card.innerHTML='<button class="gc-combo-photos" type="button" aria-label="Ver combo '+esc(combo.name)+'" data-combo-position="'+(start+index)+'">'+items.slice(0,3).map(function(item){
   return '<span class="gc-combo-photo" aria-hidden="true">'+comboThumbnail(item)+'</span>';
  }).join('')+'<span class="gc-combo-view-label">Ver combo'+(items.length>3?' · '+items.length+' artículos':'')+'</span></button><div class="gc-combo-body"><h3>'+esc(combo.name)+'</h3><ul>'+
   items.slice(0,4).map(function(item){return '<li><span>'+item.qty+' × '+esc(item.label)+'</span>'+comboLinePrice(item,summary)+'</li>';}).join('')+
   (items.length>4?'<li class="gc-combo-extra-count">+'+(items.length-4)+' artículos en la ficha</li>':'')+'</ul>'+comboNote(combo)+comboTotal(summary)+comboAddButton(summary)+'</div>';
  comboImageFallback(card);
  card.querySelector('.gc-combo-photos').onclick=function(){
   comboDetailTrigger=start+index;
   comboDetail={list:groupCombos,index:start+index,photo:0};
   renderComboDetail(true);
  };
  card.querySelector('.gc-combo-add').onclick=function(){addCombo(combo);};
  return card;
 });
 grid.replaceChildren(...cards);
 if(!cards.length)grid.textContent='No hay combos disponibles.';
 if(currentDialog==='combo'&&comboDetail)renderComboDetail(false);
}
function renderComboDetail(initial){
 var state=comboDetail,combo=state.list[state.index];
 var items=comboItems(combo,comboCatalog()),summary=comboSummary(items);
 var primary=items[0];
 var box=wrap('<div class="gc-combo-detail"><header><h2 id="comboDetailTitle" tabindex="-1">'+esc(combo.name)+'</h2>'+
  '<nav class="gc-combo-detail-nav" aria-label="Navegar entre combos">'+
  '<button type="button" class="btn outline" data-combo-move="-1"'+(state.index===0?' disabled':'')+'>← Anterior</button>'+
  '<span>Combo '+(state.index+1)+' de '+state.list.length+'</span>'+
  '<button type="button" class="btn outline" data-combo-move="1"'+(state.index+1===state.list.length?' disabled':'')+'>Siguiente →</button></nav></header>'+
  '<div class="gc-combo-detail-layout"><div><figure><div class="gc-combo-photo gc-combo-photo-large"></div><figcaption></figcaption></figure></div>'+
  '<div class="gc-combo-detail-summary"><h3>Qué incluye</h3><ul>'+items.map(function(item,i){
   return '<li><button class="gc-combo-item" data-photo-index="'+i+'" type="button"><span class="gc-combo-photo" aria-hidden="true">'+
    comboThumbnail(item)+'</span><span>'+item.qty+' × '+esc(item.label)+comboLinePrice(item,summary)+'</span></button></li>';
  }).join('')+'</ul>'+comboNote(combo)+comboTotal(summary)+comboAddButton(summary)+
  (combo.individualAction?'<button class="btn outline gc-combo-single" type="button"'+
   (comboPrices!=='ready'||unavailableComboItem(primary)?' disabled':'')+'>'+esc(combo.individualAction)+'</button>':'')+'</div></div></div>');
 var photo=box.querySelector('.gc-combo-photo-large'),caption=box.querySelector('figcaption');
 function selectPhoto(index){
  state.photo=index;
  var item=items[index];
  photo.innerHTML=item.p?.photo?photoMarkup(item.p).replace('loading="lazy"','loading="eager"'):'<span>Sin foto</span>';
  caption.textContent=item.label;
  comboImageFallback(photo);
  box.querySelectorAll('[data-photo-index]').forEach(function(button){
   button.setAttribute('aria-pressed',String(+button.dataset.photoIndex===index));
  });
 }
 selectPhoto(state.photo);
 comboImageFallback(box);
 box.querySelectorAll('[data-photo-index]').forEach(function(button){
  button.onclick=function(){selectPhoto(+button.dataset.photoIndex);photo.scrollIntoView({block:'nearest'});};
 });
 box.querySelectorAll('[data-combo-move]').forEach(function(button){
  button.onclick=function(){state.index+=+button.dataset.comboMove;state.photo=0;renderComboDetail(true);};
 });
 box.querySelector('.gc-combo-add').onclick=function(){addCombo(combo);};
 var single=box.querySelector('.gc-combo-single');
 if(single)single.onclick=function(){add(primary.p);};
 open(box,'combo');
 if(initial){
  $('dialogBody').parentElement.scrollTop=0;
  box.querySelector('h2').focus({preventScroll:true});
 }
}
[comboGroup,comboSize,comboOrder].forEach(function(control){control.onchange=function(){comboPage=0;renderCombos();};});
function moveComboPage(step){
 comboPage+=step;
 renderCombos();
 $('combos').scrollIntoView({block:'start'});
}
$('comboPrevious').onclick=function(){moveComboPage(-1);};
$('comboNext').onclick=function(){moveComboPage(1);};
$('comboPreviousBottom').onclick=function(){moveComboPage(-1);};
$('comboNextBottom').onclick=function(){moveComboPage(1);};
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
function open(node,kind){
 var dialog=$('dialog');
 $('dialogBody').replaceChildren(node);
 dialog.dataset.view=kind;
 if(kind==='combo')dialog.setAttribute('aria-labelledby','comboDetailTitle');
 else dialog.removeAttribute('aria-labelledby');
 dialog.classList.add('open');document.body.style.overflow='hidden';currentDialog=kind;
}
function close(){
 var restore=currentDialog==='combo'?$('comboGrid').querySelector('[data-combo-position="'+comboDetailTrigger+'"]'):null;
 $('dialog').classList.remove('open');document.body.style.overflow='';currentDialog='';comboDetail=null;comboDetailTrigger=null;
 if(restore)restore.focus({preventScroll:true});
}
function wrap(html){var el=document.createElement('div');el.innerHTML=html;return el;}
function localDestination(){
 return (window.GC_LOCAL_DELIVERIES||[]).find(function(x){return x.id===localZone;})||null;
}
function calc(items,mode){
 var cents=function(value){return Math.round(value*100);};
 var subtotal=items.reduce(function(sum,i){return sum+cents(i.p.price||0)*i.qty;},0);
 var eligible=items.length>0&&items.every(function(i){return i.p.freeShipping;});
 var zone=mode==='local'?localDestination():null;
 var shipping=mode==='pickup'?0:mode==='local'?(zone?(eligible?0:zone.price):null):(eligible?0:CONFIG.shipping);
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
function customerData(draft){
 var fields={nombre:'customerName',telefono:'customerPhone',departamento:'customerDepartment',municipio:'customerMunicipality',direccion:'customerAddress'};
 var data=Object.fromEntries(Object.entries(fields).map(function(pair){return [pair[0],$(pair[1])?.value.trim()||''];}));
 if(draft===true||shippingMode==='national')return data;
 var zone=shippingMode==='local'?localDestination():null;
 data.departamento=zone?.department||'';
 data.municipio=zone?.municipality||'';
 if(shippingMode==='pickup')data.direccion='';
 return data;
}
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
 var panel=document.createElement('dialog');panel.className='gc-bank-panel';
 panel.setAttribute('aria-labelledby','gcBankHeading');
 panel.innerHTML='<header><div><h2 id="gcBankHeading">Datos de transferencia</h2><p>Gamer Comayagua</p></div>'+
  '<button class="btn outline" type="button" aria-label="Cerrar datos de transferencia">✕</button></header>'+
  '<div class="gc-bank-content"><p>Solicitá la cuenta de pago por WhatsApp y confirmá el monto de tu pedido.</p>'+
  '<a class="btn gc-bank-copy" href="https://wa.me/'+PHONE+'?text='+encodeURIComponent('Hola, ¿me comparten los datos para pagar por transferencia?')+'" target="_blank" rel="noopener">Solicitar datos por WhatsApp</a></div>';
 panel.querySelector('header button').onclick=function(){panel.close();};
 panel.addEventListener('close',function(){panel.remove();});
 root.appendChild(panel);panel.showModal();
}
function cartView(refresh){
 var previous=refresh===true?customerData(true):null;
 var previousScroll=previous?$('gcCartScroll')?.scrollTop||0:0;
 var previousSearch=previous?$('gcLocalSearch')?.value||'':'';
 var previousPanels=previous?['gcCustomerDetails','gcQuoteTools','gcPaymentCompare'].filter(function(id){return $(id)?.open;}):[];
 currentDialog='cart';
 var root=wrap(`<div class="gc-checkout"><header class="gc-cart-head"><img alt="" src="${esc(logoUrl())}"><div><h2>Mi cotización</h2><p id="gcCartCount"></p></div></header>
 <div class="gc-cart-scroll" id="gcCartScroll">
  <nav class="gc-cart-jumps" aria-label="Secciones de la cotización">
   <button class="btn outline" type="button" data-cart-target="gcDeliverySection">Envío</button>
   <button class="btn outline" type="button" data-cart-target="gcPaymentSection">Pago</button>
   <button class="btn outline" type="button" data-cart-target="gcCustomerDetails">Datos</button>
   <button class="btn outline" type="button" data-cart-target="gcQuoteTools">PDF</button>
  </nav>
<div class="gc-cart-layout"><div class="gc-cart-main">
<section class="gc-section"><h3>Productos</h3><div id="gcCartItems"></div></section>
<section class="gc-section" id="gcDeliverySection"><h3>Entrega y envío</h3><div class="gc-ship-choices"><label><input type="radio" name="gcShipping" value="national"><span>Envío nacional <small>L 110 (o gratis si aplica)</small></span></label><label><input type="radio" name="gcShipping" value="local"><span>Comayagua y alrededores <small>Tarifa según destino</small></span></label><label><input type="radio" name="gcShipping" value="pickup"><span>Retiro en tienda <small>Sin costo</small></span></label></div><div id="gcLocalField" class="gc-local-chooser" hidden>
 <div class="gc-local-fields"><label for="gcLocalSearch">Buscar barrio, colonia o destino<input id="gcLocalSearch" type="search" placeholder="Ej. Lomas del Río, Suyapa, Lejamaní" autocomplete="off"></label>
 <label for="gcLocalZone">Zona de entrega<select id="gcLocalZone"><option value="">Seleccioná un destino</option></select></label></div>
 <div id="gcLocalSummary" class="gc-local-summary" aria-live="polite"><div><strong id="gcLocalName">Elegí tu zona de entrega</strong><span id="gcLocalPlace">El costo se agrega a tu cotización.</span></div><b id="gcLocalCost" hidden></b></div>
 <details class="gc-local-terms"><summary>Condiciones de entrega local</summary><p>Salida desde Col. Piedras Bonitas. Incluye 10 min de cortesía. Si solicitás espera adicional (L 15–20), una parada extra (L 15 en la ciudad o L 20 fuera) o entrega calle adentro en Jarín (L 5–10), acordaremos el cargo antes del cobro. Sin servicio local en Siguatepeque ni La Libertad.</p></details>
</div></section>
<details class="gc-section gc-cart-details" id="gcCustomerDetails"><summary><span id="gcCustomerHeading">Datos de entrega</span></summary><div class="gc-customer-grid">
 <label>Nombre<input id="customerName" placeholder="Nombre del cliente" autocomplete="name" maxlength="100"></label>
 <label>Celular<input id="customerPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+504..." maxlength="30"></label>
 <label id="gcDepartmentField">Departamento<select id="customerDepartment"></select></label>
 <label id="gcMunicipalityField">Municipio<select id="customerMunicipality"></select></label>
 <label id="gcAddressField" class="gc-full"><span id="gcAddressLabel">Barrio, colonia o referencia</span><input id="customerAddress" maxlength="160" placeholder="Dirección para la entrega"></label>
</div></details></div>
<aside class="gc-cart-summary">
 <section class="gc-section" id="gcPaymentSection"><h3>Forma de pago</h3>
  <div class="gc-pay-choices"><label><input type="radio" name="gcPayment" value="transfer"> Transferencia</label><label><input type="radio" name="gcPayment" value="tigo"> Tigo Money</label><label><input type="radio" name="gcPayment" value="cod"> Pagar al recibir</label></div>
  <dl id="gcPriceBreakdown" class="gc-price-breakdown"></dl>
  <p id="gcSelectedTotal" class="gc-payment-note"></p>
  <details class="gc-cart-compare" id="gcPaymentCompare"><summary>Comparar las formas de pago</summary><div id="gcCompare"></div></details>
 </section>
 <details class="gc-section gc-cart-details" id="gcQuoteTools"><summary>Descargas y otras acciones</summary>
  <div class="gc-cart-actions"><button type="button" id="gcPrint" class="btn gc-quote-button">Cotización en PDF<small>Pago seleccionado</small></button><button type="button" id="gcPrintCompare" class="btn gc-quote-button">Comparativa en PDF<small>3 formas de pago</small></button><button type="button" id="gcBank" class="btn outline">Datos de transferencia</button><button type="button" id="gcClear" class="btn outline">Vaciar carrito</button></div>
 </details>
 <p class="hint">Los importes son de referencia y están sujetos a existencias y confirmación de Gamer Comayagua.</p>
</aside></div></div>
<footer class="gc-cart-bottom"><div><span id="gcQuickLabel">Total estimado</span><strong id="gcQuickTotal" aria-live="polite"></strong></div><button type="button" id="gcWhatsapp" class="btn red">Continuar por WhatsApp</button></footer>
</div>`);
var itemsBox=root.querySelector('#gcCartItems'),compare=root.querySelector('#gcCompare'),
 breakdown=root.querySelector('#gcPriceBreakdown'),paymentNote=root.querySelector('#gcSelectedTotal'),
 whatsapp=root.querySelector('#gcWhatsapp'),
 localField=root.querySelector('#gcLocalField'),localSearch=root.querySelector('#gcLocalSearch'),localSelect=root.querySelector('#gcLocalZone'),
 localName=root.querySelector('#gcLocalName'),localPlace=root.querySelector('#gcLocalPlace'),localCost=root.querySelector('#gcLocalCost');
function fillLocations(){
 var terms=norm(localSearch.value).split(' ').filter(Boolean),groups=new Map();
 var matches=(window.GC_LOCAL_DELIVERIES||[]).filter(function(zone){
  var words=norm([zone.name,zone.aliases,zone.sector,zone.municipality].join(' '));
  return terms.every(function(term){return words.includes(term);});
 });
 var selected=localDestination();
 var placeholder=new Option(matches.length?'Seleccioná una colonia o destino':'Sin resultados para esa búsqueda','');
 localSelect.replaceChildren(placeholder);
 if(selected&&!matches.includes(selected))matches.unshift(selected);
 matches.forEach(function(zone){
  if(!groups.has(zone.sector)){
   var group=document.createElement('optgroup');
   group.label=zone.sector;localSelect.appendChild(group);groups.set(zone.sector,group);
  }
  groups.get(zone.sector).appendChild(new Option(zone.name+' — L '+zone.price,zone.id));
 });
 localSelect.value=localZone;
}
function updateDeliveryFields(){
 var local=shippingMode==='local',national=shippingMode==='national',zone=local?localDestination():null;
 localField.hidden=!local;
 root.querySelector('#gcDepartmentField').hidden=!national;
 root.querySelector('#gcMunicipalityField').hidden=!national;
 root.querySelector('#gcAddressField').hidden=!national&&!local;
 root.querySelector('#gcCustomerHeading').textContent=local||national?'Datos de entrega':'Datos de contacto';
 root.querySelector('#gcAddressLabel').textContent=local?'Dirección y referencia':'Barrio, colonia o referencia';
 root.querySelector('#customerAddress').placeholder=local?'Ej. Casa azul frente al parque':'Dirección para la entrega';
 localName.textContent=zone?zone.name:'Elegí tu zona de entrega';
 localPlace.textContent=zone?[zone.municipality,zone.department].join(', '):'El costo se agrega a tu cotización.';
 localCost.hidden=!zone;
}
localSearch.addEventListener('input',fillLocations);
localSelect.addEventListener('change',function(){localZone=localSelect.value;updateDeliveryFields();totalsRender();});
localSearch.value=previousSearch;fillLocations();updateDeliveryFields();
function itemRender(){
 itemsBox.replaceChildren();
 var items=cartItems(),count=items.reduce(function(sum,i){return sum+i.qty;},0);
 root.querySelector('#gcCartCount').textContent=count===1?'1 artículo':count+' artículos';
 root.querySelector('#gcCartScroll').classList.toggle('gc-cart-empty',!items.length);
 if(!items.length){
  itemsBox.innerHTML='<div class="gc-cart-empty-message"><p>Tu cotización está vacía.</p><a class="btn outline" href="#catalogo">Explorar productos</a></div>';
  itemsBox.querySelector('a').addEventListener('click',close);return;
 }
 items.forEach(function(i,index){
  var row=wrap(`<div class="gc-item">
   <div class="gc-quote-item">${i.p.photo?'<img src="'+esc(i.p.photo)+'" alt="" loading="lazy">':''}<div><strong>${esc(i.p.name)}</strong><small>${money(i.p.price)} por unidad</small></div></div>
   <div class="gc-item-side">
    <div class="qty" role="group" aria-label="Cantidad de ${esc(i.p.name)}"><button type="button" class="gc-dec" aria-label="Disminuir cantidad">−</button><span>${i.qty}</span><button type="button" class="gc-inc" aria-label="Aumentar cantidad">+</button></div>
    <div class="gc-line-total"><small>Importe</small><b>${money(i.p.price*i.qty)}</b></div>
   </div>
  </div>`);
  function changeQty(delta,button){
   var restoreFocus=document.activeElement===button;
   cart[i.p.id]=Math.min(maxQty(i.p),i.qty+delta);
   if(cart[i.p.id]<=0)delete cart[i.p.id];
   saveCart();itemRender();totalsRender();
   if(restoreFocus){
    var next=itemsBox.children[Math.min(index,itemsBox.children.length-1)];
    var target=next?.querySelector(delta>0?'.gc-inc:not(:disabled)':'.gc-dec')||next?.querySelector('.gc-dec, a');
    target?.focus({preventScroll:true});
   }
  }
  var minus=row.querySelector('.gc-dec'),plus=row.querySelector('.gc-inc');
  minus.onclick=function(){changeQty(-1,minus);};
  plus.disabled=i.qty>=maxQty(i.p);
  plus.onclick=function(){changeQty(1,plus);};
  itemsBox.appendChild(row.firstElementChild);
 });
}
function totalsRender(){var items=cartItems(),q=calc(items,shippingMode);if(q.zone)localCost.textContent=q.shipping===0?'Envío gratis':money(q.shipping);
var cod=root.querySelector('input[name=gcPayment][value=cod]');cod.disabled=!q.codAllowed;if(!q.codAllowed&&payMode==='cod')payMode='transfer';
root.querySelector('input[name=gcPayment][value='+payMode+']').checked=true;
var chosen=q.prices[payMode],fee=payMode==='tigo'?q.tigoFee:payMode==='cod'?q.codFee:0;
var needsZone=q.shipping===null;
compare.innerHTML=paymentRows(q);
breakdown.innerHTML='<div><dt>Subtotal de productos</dt><dd>'+money(q.subtotal)+'</dd></div><div><dt>Envío</dt><dd>'+(needsZone?'Pendiente de zona':q.shipping===0?(shippingMode==='pickup'?'Sin costo':'Gratis'):money(q.shipping))+'</dd></div><div><dt>Comisión de pago</dt><dd>'+(fee===null?'Por calcular':fee===0?'Sin comisión':money(fee))+'</dd></div>';
paymentNote.textContent=needsZone?'Elegí tu colonia o destino para calcular el total.':payMode==='cod'?'Anticipo '+money(q.shipping+fee)+' · Saldo al recibir '+money(q.subtotal):'';
paymentNote.hidden=!paymentNote.textContent;
root.querySelector('#gcQuickLabel').textContent=needsZone?'Subtotal sin envío':payMode==='transfer'?'Total con transferencia':payMode==='tigo'?'Total con Tigo Money':'Total con pago al recibir';
root.querySelector('#gcQuickTotal').textContent=money(chosen===null?q.subtotal:chosen);
whatsapp.disabled=!items.length;
whatsapp.textContent=needsZone?'Elegí la zona de entrega':'Continuar por WhatsApp';
return q;}
root.querySelectorAll('input[name=gcShipping]').forEach(function(input){input.checked=input.value===shippingMode;input.onchange=function(){shippingMode=this.value;updateDeliveryFields();totalsRender();};});
root.querySelectorAll('input[name=gcPayment]').forEach(function(input){input.checked=input.value===payMode;input.onchange=function(){payMode=this.value;totalsRender();};});
if(window.GC_HONDURAS)window.GC_HONDURAS.bind(root.querySelector('#customerDepartment'),root.querySelector('#customerMunicipality'));
else {root.querySelector('#customerDepartment').outerHTML='<input id="customerDepartment" placeholder="Departamento">';root.querySelector('#customerMunicipality').outerHTML='<input id="customerMunicipality" placeholder="Municipio">';}
root.querySelector('#gcClear').onclick=function(){cart=Object.create(null);saveCart();itemRender();totalsRender();};
whatsapp.onclick=function(){var items=cartItems();if(!items.length)return;var q=totalsRender();if(shippingMode==='local'&&!q.zone){localSelect.focus();return;}if(!catalogReady){toast('Espera a que se actualicen los precios.');return;}var url='https://wa.me/'+PHONE+'?text='+encodeURIComponent(buildMessage(items,q,customerData()));window.open(url,'_blank','noopener');};
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
root.querySelectorAll('[data-cart-target]').forEach(function(button){
 button.onclick=function(){
  var target=root.querySelector('#'+button.dataset.cartTarget);
  if(target.tagName==='DETAILS')target.open=true;
  target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
});
itemRender();totalsRender();open(root,'cart');
if(previous){
 previousPanels.forEach(function(id){$(id).open=true;});
 $('gcCartScroll').scrollTop=previousScroll;
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
 document.querySelectorAll('.photo,.gc-detail-image,.gc-combo-photo').forEach(function(frame){
  frame.querySelector('.gc-watermark')?.remove();
  if(frame.querySelector('.gc-product-image'))frame.insertAdjacentHTML('beforeend',watermarkMarkup('photos'));
 });
}
async function fetchLive(url,first){
 var initial=await first;
 if(!initial.ok||!Array.isArray(initial.products))throw Error('Respuesta inválida');
 var total=Number(initial.total);
 if(!Number.isInteger(total)||total<=0||total>20000)throw Error('Total inválido');
 var limit=400;
 var positions=Array.from({length:Math.ceil(total/limit)-1},function(_,i){return String((i+1)*limit);});
 var parts=await Promise.all(positions.map(function(offset){return jsonp(url,{offset:offset,limit:String(limit)});}));
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
  selectCategory();filter(false);renderCombos();
  if(currentDialog==='cart')cartView(true);
 }
 var url=catalogUrl(),first=url?jsonp(url,{offset:'0',limit:'400'}):null;
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
  if(results[0]?.length){comboPrices='ready';supplier=prepare(results[0]);updateCatalog();$('syncStatus').textContent='✓ Precios del proveedor actualizados';}
  else{comboPrices='unavailable';renderCombos();}
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
$('homeSearchForm').onsubmit=function(event){
 event.preventDefault();
 $('search').value=$('homeSearch').value.trim();
 $('category').value='';
 onlyOwn=false;onlyPromos=false;
 $('ownOnly').setAttribute('aria-pressed','false');
 $('promotionsOnly').setAttribute('aria-pressed','false');
 $('homeSearch').blur();filter();
 if(location.hash!=='#catalogo')location.hash='catalogo';
 else $('catalogo').scrollIntoView({block:'start'});
};
$('search').addEventListener('input',function(event){$('homeSearch').value=this.value;filter(event);});$('category').addEventListener('change',filter);$('sort').addEventListener('change',filter);$('more').onclick=function(){offset+=24;render();};
$('cartFloat').onclick=cartView;$('cartTop').onclick=cartView;$('closeDialog').onclick=close;$('dialog').onclick=function(event){if(event.target===$('dialog'))close();};document.addEventListener('keydown',function(event){if(event.key==='Escape')close();});
if(window.GC_MARKS)window.GC_MARKS.applyStyles();
readCart();renderCounts();renderCombos();init();
})();
