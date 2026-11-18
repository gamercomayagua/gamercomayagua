/* Fichas y catálogos para compartir. */
(function(){
'use strict';
const clean=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'Productos';
const imageCache=new Map();
function loadImage(src){
 return new Promise(resolve=>{
  if(!src){resolve(null);return;}
  const img=new Image();
  const timeout=setTimeout(()=>finish(null),7000);
  function finish(value){clearTimeout(timeout);img.onload=img.onerror=null;resolve(value);}
  if(/^https?:/i.test(src))img.crossOrigin='anonymous';
  img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=src;
 });
}
function exportPhotoUrl(src){
 try{
  const url=new URL(src,location.href);
  if(url.origin==='https://phone-depot-cdn.ingeniacode.com'&&url.pathname.startsWith('/images/phonedepot/')){
   return 'https://wsrv.nl/?'+new URLSearchParams({url:url.href,w:'1200',h:'1200',fit:'inside',output:'webp'});
  }
 }catch(error){}
 return '';
}
async function productImage(src){
 if(!src)return null;
 if(!imageCache.has(src)){
  if(imageCache.size>=18)imageCache.delete(imageCache.keys().next().value);
  const optimized=exportPhotoUrl(src);
  const work=(async()=>await loadImage(optimized)||await loadImage(src))().catch(()=>null);
  imageCache.set(src,work);
 }
 const result=await imageCache.get(src);
 if(!result)imageCache.delete(src);
 return result;
}
function picture(ctx,img,x,y,w,h){
 if(!img)return;
 const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);
 const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;
 ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
 return {x:x+(w-iw)/2,y:y+(h-ih)/2,w:iw,h:ih};
}
function lines(ctx,value,width,limit){
 const out=[];let line='';
 for(const word of String(value).split(/\s+/)){
  const candidate=line?line+' '+word:word;
  if(line&&ctx.measureText(candidate).width>width){out.push(line);line=word;}
  else line=candidate;
 }
 if(line)out.push(line);
 if(out.length>limit){
  out.length=limit;
  while(ctx.measureText(out[limit-1]+'…').width>width&&out[limit-1].length>1)out[limit-1]=out[limit-1].slice(0,-1);
  out[limit-1]+='…';
 }
 return out;
}
function label(ctx,value,x,y,width,limit,leading){
 const text=lines(ctx,value,width,limit);
 text.forEach((line,i)=>ctx.fillText(line,x,y+i*leading,width));
}
async function markAssets(settings,logo){
 if(!settings?.enabled||!window.GC_MARKS)return null;
 const template=document.createElement('template');
 template.innerHTML=window.GC_MARKS.markup(settings,logo);
 const root=template.content.firstElementChild;
 if(!root)return null;
 const image=await productImage(root.querySelector('img')?.src);
 return {root,image};
}
function markPhoto(ctx,marks,area){
 if(!marks||!area)return;
 const {root,image}=marks,{x,y,w,h}=area;
 const minimum=Math.min(w,h);
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 ctx.globalAlpha=Number(root.style.opacity);ctx.fillStyle=root.style.color;
 for(const mark of root.children){
  const style=mark.style;
  const size=parseFloat(style.width)*minimum/100;
  const text=[...mark.querySelectorAll('.gc-mark-line')].map(l=>l.textContent);
  const fontMatch=style.fontSize.match(/([\d.]+)cqmin/);
  const font=Math.min(80,(Number(fontMatch?.[1])||0)*minimum/100);
  const textHeight=font*1.12*text.length;
  const imageHeight=image?(text.length?size*.52:size):0;
  const gap=imageHeight&&textHeight?font*.15:0;
  const top=-(imageHeight+gap+textHeight)/2;
  ctx.save();ctx.translate(x+parseFloat(style.left)*w/100,y+parseFloat(style.top)*h/100);
  ctx.rotate(parseFloat(style.getPropertyValue('--mark-turn'))*Math.PI/180);
  if(image)picture(ctx,image,-size/2,top,size,imageHeight);
  if(text.length&&font){ctx.font='850 '+font+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   text.forEach((line,i)=>ctx.fillText(line,0,top+imageHeight+gap+font*1.12*(i+.5),size));
  }
  ctx.restore();
 }
 ctx.restore();
}
function pagePlan(items,size){
 const pages=[];
 for(let i=0;i<items.length;i+=size)pages.push(items.slice(i,i+size));
 return pages;
}
async function drawPage(options,items,index,total){
 const {title,prices,logo,watermark,phone,money,stockText}=options;
 const [brand,marks,photos]=await Promise.all([
  loadImage(logo),markAssets(watermark,logo),Promise.all(items.map(product=>productImage(product.photo)))
 ]);
 const width=1200,gap=17,inset=13;
 const cols=items.length===1?1:items.length===3||items.length>6?3:2;
 const rows=Math.ceil(items.length/cols);
 const cardW=(width-88-(cols-1)*gap)/cols,photoH=cardW-inset*2;
 const cardH=photoH+(cols===1?172:135);
 const height=Math.ceil(282+rows*cardH+(rows-1)*gap);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:false});
 ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#a91b36';ctx.fillRect(0,0,width,12);
 if(brand)picture(ctx,brand,42,32,98,98);
 ctx.fillStyle='#101e39';ctx.font='800 42px system-ui';ctx.fillText('GAMER COMAYAGUA',brand?157:44,80,980);
 ctx.fillStyle='#52647c';ctx.font='25px system-ui';ctx.fillText('WhatsApp  +'+phone.slice(0,3)+' '+phone.slice(3),brand?157:44,119);
 ctx.fillStyle='#152640';ctx.font='800 38px system-ui';ctx.fillText(title,44,181,1100);
 items.forEach((product,i)=>{
  const x=44+(i%cols)*(cardW+gap),y=214+Math.floor(i/cols)*(cardH+gap);
  ctx.fillStyle='#f9fafc';ctx.fillRect(x,y,cardW,cardH);
  ctx.strokeStyle='#dee5ee';ctx.lineWidth=2;ctx.strokeRect(x,y,cardW,cardH);
  ctx.fillStyle='#eef2f7';ctx.fillRect(x+inset,y+inset,cardW-inset*2,photoH);
  ctx.save();
  if(product.soldOut)ctx.filter='grayscale(100%)';
  const area=picture(ctx,photos[i],x+inset,y+inset,cardW-inset*2,photoH);
  ctx.restore();
  if(area)markPhoto(ctx,marks,area);
  else{ctx.fillStyle='#566981';ctx.font='22px system-ui';ctx.fillText('Foto por consultar',x+24,y+photoH/2,cardW-48);}
  const labelY=y+photoH+inset+31;
  ctx.fillStyle='#162644';ctx.font=(cols===1?'850 38px':'800 26px')+' system-ui';
  label(ctx,product.name,x+inset,labelY,cardW-inset*2,2,cols===1?42:29);
  ctx.font=(cols===1?'850 42px':'850 29px')+' system-ui';ctx.fillStyle=product.soldOut?'#566981':'#a91b36';
  if(prices||product.soldOut)ctx.fillText(product.soldOut?'AGOTADO':money(product.price),x+inset,y+cardH-32,cardW-inset*2);
  ctx.font='18px system-ui';ctx.fillStyle='#455a75';
  ctx.fillText('Ref. '+product.id+' · '+stockText(product),x+inset,y+cardH-10,cardW-inset*2);
 });
 ctx.fillStyle='#405675';ctx.font='22px system-ui';ctx.fillText('Precios y disponibilidad sujetos a confirmación',44,height-24,890);
 ctx.textAlign='right';ctx.fillText((index+1)+' / '+total,width-44,height-24);
 return {canvas,missing:photos.filter((image,i)=>!image&&items[i].photo).length};
}
const blob=(canvas,type)=>new Promise((resolve,reject)=>canvas.toBlob(data=>data?resolve(data):reject(Error('El navegador no pudo crear el archivo.')),type,.9));
function makePdf(pages){
 const chunks=[],offsets=[0],encoder=new TextEncoder();let length=0;
 const push=input=>{const bytes=typeof input==='string'?encoder.encode(input):input;chunks.push(bytes);length+=bytes.byteLength;};
 const object=(number,contents)=>{offsets[number]=length;push(number+' 0 obj\n');contents.forEach(push);push('\nendobj\n');};
 push('%PDF-1.4\n');
 object(1,['<< /Type /Catalog /Pages 2 0 R >>']);
 object(2,['<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
 pages.forEach(({jpeg,width,height},i)=>{
  const page=3+i*3, image=page+1, stream=page+2, h=612*height/width;
  const commands='q 612 0 0 '+h.toFixed(3)+' 0 0 cm /Foto Do Q';
  object(page,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 '+h.toFixed(3)+'] /Resources << /XObject << /Foto '+image+' 0 R >> >> /Contents '+stream+' 0 R >>']);
  object(image,['<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.byteLength+' >>\nstream\n',jpeg,'\nendstream']);
  object(stream,['<< /Length '+commands.length+' >>\nstream\n'+commands+'\nendstream']);
 });
 const xref=length;
 push('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
 offsets.slice(1).forEach(offset=>push(String(offset).padStart(10,'0')+' 00000 n \n'));
 push('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 return new Blob(chunks,{type:'application/pdf'});
}
function printOriginal(options,pages,start,end){
 const win=window.open('','_blank');
 if(!win)return false;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const logo=options.logo?new URL(options.logo,location.href).href:'';
 const marks=options.watermark&&window.GC_MARKS?window.GC_MARKS.markup(options.watermark,logo):'';
 const styles=window.GC_MARKS?.styles||'';
 const body=pages.slice(start,end).map((items,i)=>{
  const columns=items.length===1?1:items.length===3||items.length>6?3:2;
  return '<article><header>'+(logo?'<img src="'+escape(logo)+'" alt="">':'')+'<div><strong>GAMER COMAYAGUA</strong><small>WhatsApp +'+escape(options.phone)+'</small></div></header>'+
   '<h1>'+escape(options.title)+'</h1><div class="grid" style="--columns:'+columns+'">'+items.map(product=>
    '<section><div class="photo">'+(product.photo?'<img class="product-photo'+(product.soldOut?' sold':'')+'" src="'+escape(product.photo)+'" alt="">'+marks:'<span>Foto por consultar</span>')+
    '</div><strong>'+escape(product.name)+'</strong>'+
    ((options.prices||product.soldOut)?'<b>'+escape(product.soldOut?'AGOTADO':options.money(product.price))+'</b>':'')+
    '<small>Ref. '+escape(product.id)+' · '+escape(options.stockText(product))+'</small></section>'
   ).join('')+'</div><footer>Precios y disponibilidad sujetos a confirmación <span>'+String(start+i+1)+' / '+pages.length+'</span></footer></article>';
 }).join('');
 win.document.open();
 win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(options.title)+' | Gamer Comayagua</title><style>'+styles+
  '*{box-sizing:border-box}body{margin:0;background:#edf2f8;font:14px system-ui,sans-serif;color:#172844}.tools{text-align:center;padding:12px}.tools button{font:inherit;font-weight:800;background:#a91b36;color:white;padding:11px 16px;border:0;border-radius:8px}article{margin:0 auto 18px;padding:22px;background:white;border-top:4px solid #a91b36;width:min(97%,850px);break-after:page}article:last-child{break-after:auto}header{display:flex;align-items:center;gap:10px}header img{width:46px;height:46px;object-fit:contain}header strong{font-size:19px}small{display:block;color:#52647c}.grid{display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:9px}section{padding:8px;min-width:0;border:1px solid #e0e7f0;border-radius:8px;break-inside:avoid}section strong,section b{display:block;margin-top:4px}section b{color:#a91b36;font-size:17px}.photo{position:relative;display:grid;place-items:center;overflow:hidden;background:#f4f7fa;aspect-ratio:1}.photo>.product-photo{width:100%;height:100%;object-fit:contain}.photo .sold{filter:grayscale(1)}h1{font-size:21px;margin:10px 0}footer{font-size:10px;margin-top:12px;color:#52647c}footer span{float:right}@page{size:letter;margin:10mm}@media print{body{background:white}.tools{display:none}article{width:auto;margin:0;padding:0}.photo{max-height:52mm}.grid:has(section:only-child) .photo{max-height:145mm}article,section{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media screen and (max-width:550px){article{padding:10px}section{font-size:12px}section b{font-size:14px}}</style></head><body><div class="tools"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>'+body+'</body></html>');
 win.document.close();
 return true;
}
function open(options){
 const root=document.createElement('div');root.className='gc-export';
 root.innerHTML=`<h2></h2><div class="gc-export-grid">
 <div class="gc-export-controls"><label id="gcExportGroup">Productos del catálogo<select id="gcExportSource"></select></label>
 <label>Título<input id="gcExportTitle" maxlength="90"></label>
 <label>Distribución<select id="gcExportSize"><option value="auto">Automática</option><option value="2">2 por página · fotos grandes</option><option value="4">4 por página</option><option value="6">6 por página</option><option value="9">9 por página</option></select></label>
 <label><input id="gcExportPrices" type="checkbox" checked> Mostrar precios</label>
 <label><input id="gcExportOut" type="checkbox"> Incluir agotados</label>
 <label><input id="gcExportMark" type="checkbox" checked> Marca de agua</label>
 <label>Páginas<select id="gcExportPage"></select></label><p id="gcExportStatus" role="status"></p>
 <div class="gc-export-buttons">
 <a id="gcExportPng" class="btn red" hidden>Descargar PNG</a>
 <button id="gcExportPdf" class="btn outline" type="button" disabled>Preparar PDF</button>
 <button id="gcExportOriginal" class="btn outline" type="button" hidden>Imprimir con fotos originales</button>
 <a id="gcExportPdfLink" class="btn red" hidden>Descargar PDF</a>
 <button id="gcExportShare" class="btn outline" type="button" hidden>Compartir archivo</button>
 <a id="gcExportView" class="btn outline" target="_blank" rel="noopener" hidden>Abrir PNG</a>
 </div></div><div class="gc-export-stage" id="gcExportStage"><img id="gcExportPreview" alt="Vista previa del catálogo" hidden></div></div>`;
 const $=id=>root.querySelector('#gcExport'+id);
 const source=$('Source'),page=$('Page'),title=$('Title'),stage=$('Preview'),status=$('Status');
 const original=$('Original');
 const png=$('Png'),pdf=$('Pdf'),pdfLink=$('PdfLink'),share=$('Share'),view=$('View');
 const categoryMode=options.source==='category',single=options.source==='product';
 root.querySelector('h2').textContent=single?'Ficha para compartir':categoryMode?'Compartir categoría o búsqueda':'Catálogo de productos seleccionados';
 $('Group').hidden=!categoryMode;$('Out').checked=single;
 if(categoryMode){
  source.add(new Option(options.query?'Resultados de «'+options.query+'»':'Resultados actuales','result'));
  options.categories.forEach(name=>source.add(new Option(name,'category:'+name)));
  source.value=options.query||!options.category?'result':'category:'+options.category;
 }
 let version=0,requestTimer,urls=[],pngFile,pdfFile,plan=[],activeOptions;
 const clearLinks=()=>{
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];
  png.hidden=pdfLink.hidden=share.hidden=view.hidden=original.hidden=true;stage.hidden=true;pdf.disabled=true;
  pngFile=pdfFile=null;
 };
 const titleFor=()=>single?options.selected[0].name:options.source==='selected'?(options.query?'Selección · '+options.query:'Productos seleccionados'):source.value.startsWith('category:')?source.value.slice(9):options.query||options.category||'Catálogo de productos';
 const sourceProducts=()=>categoryMode?(source.value.startsWith('category:')?options.byCategory(source.value.slice(9)):options.results()):options.getSelected?options.getSelected():options.selected;
 function filename(suffix){return 'Gamer-Comayagua-'+clean(title.value)+suffix;}
 function link(control,data,name){
  const url=URL.createObjectURL(data);urls.push(url);control.href=url;control.download=name;control.hidden=false;return url;
 }
 function setShare(file){
  try{share.hidden=!(file&&navigator.canShare?.({files:[file]}));}catch(error){share.hidden=true;}
 }
 async function refresh(reset=true){
  if(!root.isConnected)return;
  const ticket=++version;clearLinks();
  if(!options.canExport()){
   status.textContent='Actualizando precios y existencias…';
   requestTimer=setTimeout(()=>refresh(reset),950);
   return;
  }
  const items=sourceProducts().filter(p=>$('Out').checked||!p.soldOut);
  const size=$('Size').value==='auto'?Math.min(6,Math.max(1,items.length)):Number($('Size').value);
  plan=pagePlan(items,size);
  if(reset){
   page.replaceChildren(...plan.map((_,i)=>new Option('Página '+(i+1)+' de '+plan.length,String(i))));
  }
  if(!plan.length){status.textContent='No hay productos para este catálogo.';return;}
  const index=Number(page.value)||0;
  activeOptions={...options,title:title.value.trim()||titleFor(),prices:$('Prices').checked,watermark:$('Mark').checked?{...options.getWatermark(),enabled:true}:null};
  original.hidden=false;
  status.textContent='Preparando fotos de la página '+(index+1)+'…';
  try{
   const result=await drawPage(activeOptions,plan[index],index,plan.length);
   const data=await blob(result.canvas,'image/png');
   result.canvas.width=result.canvas.height=1;
   if(ticket!==version||!root.isConnected)return;
   const name=filename('-'+(index+1)+'.png');
   pngFile=new File([data],name,{type:'image/png'});
   const url=link(png,data,name);stage.src=url;stage.hidden=false;view.href=url;view.hidden=false;
   pdf.disabled=false;
   pdf.textContent=plan.length>8?'Preparar PDF · páginas '+(Math.floor(index/8)*8+1)+'–'+Math.min(plan.length,Math.floor(index/8)*8+8):'Preparar PDF';
   setShare(pngFile);
   status.textContent=items.length+(items.length===1?' producto':' productos')+' · '+plan.length+(plan.length===1?' página':' páginas')+(result.missing?' · '+result.missing+' fotos no disponibles para PNG. Usá Imprimir con fotos originales.':'');
  }catch(error){if(ticket===version)status.textContent=error.message;}
 }
 original.onclick=()=>{
  const index=Number(page.value)||0,start=Math.floor(index/8)*8,end=Math.min(start+8,plan.length);
  if(!printOriginal(activeOptions,plan,start,end))status.textContent='Permití ventanas emergentes para abrir la versión para imprimir.';
 };
 pdf.onclick=async()=>{
  const ticket=version,index=Number(page.value)||0,start=Math.floor(index/8)*8,end=Math.min(start+8,plan.length),pages=[];
  pdf.disabled=true;pdfLink.hidden=true;
  try{
   for(let i=start;i<end;i++){
    if(ticket!==version||!root.isConnected)return;
    status.textContent='Preparando PDF · página '+(i+1)+' de '+end+'…';
    const {canvas}=await drawPage(activeOptions,plan[i],i,plan.length);
    pages.push({jpeg:new Uint8Array(await (await blob(canvas,'image/jpeg')).arrayBuffer()),width:canvas.width,height:canvas.height});
    canvas.width=canvas.height=1;
   }
   if(ticket!==version||!root.isConnected)return;
   const data=makePdf(pages),name=filename((plan.length>8?'-'+(start+1)+'-'+end:'')+'.pdf');
   pdfFile=new File([data],name,{type:'application/pdf'});link(pdfLink,data,name);setShare(pdfFile);
   status.textContent='PDF listo para guardar o compartir.';
  }catch(error){if(ticket===version)status.textContent=error.message;}
  finally{if(ticket===version)pdf.disabled=false;}
 };
 share.onclick=async()=>{
  const file=pdfFile||pngFile;
  if(!file)return;
  try{await navigator.share({files:[file],title:title.value});}
  catch(error){if(error.name!=='AbortError')status.textContent='Descargá el archivo para adjuntarlo en WhatsApp.';}
 };
 source.onchange=()=>{title.value=titleFor();refresh();};
 page.onchange=()=>refresh(false);
 ['Size','Prices','Out','Mark'].forEach(id=>$(id).onchange=()=>refresh());
 title.oninput=()=>{clearTimeout(requestTimer);++version;clearLinks();requestTimer=setTimeout(()=>refresh(false),280);};
 title.value=titleFor();options.show(root);refresh();
 const observer=new MutationObserver(()=>{
  if(!root.isConnected||!root.closest('.dialog')?.classList.contains('open')){
   clearTimeout(requestTimer);version++;clearLinks();observer.disconnect();
  }
 });
 const shell=root.closest('.dialog');
 if(shell)observer.observe(shell,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
 const parent=root.parentElement?.parentElement;
 if(parent)observer.observe(parent,{childList:true,subtree:true});
}
window.GC_EXPORT={open};
})();
