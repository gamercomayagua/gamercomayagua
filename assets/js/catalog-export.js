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
  if(url.origin==='https://phone-depot-cdn.ingeniacode.com'&&url.pathname.startsWith('/images/')){
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
function roundBox(ctx,x,y,w,h,r,fill,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
}
function stockLabel(product,stockText){
 return product.soldOut?'Agotado':stockText(product);
}
async function drawPage(options,items,index,total){
 const {title,prices,logo,watermark,phone,money,stockText}=options;
 const [brand,marks,photos]=await Promise.all([
  loadImage(logo),markAssets(watermark,logo),Promise.all(items.map(product=>productImage(product.photo).then(photo=>photo||productImage(product.photoFallback))))
 ]);
 const width=1200,margin=48,gap=24,top=228;
 const cols=items.length===1?1:items.length===3||items.length>6?3:2;
 const rows=Math.ceil(items.length/cols);
 const cardW=(width-2*margin-(cols-1)*gap)/cols;
 const photoInset=14,photoW=cardW-2*photoInset,photoH=Math.min(photoW,730);
 const pad=cols===1?32:cols===2?26:20;
 const nameSize=cols===1?40:cols===2?28:23;
 const leading=Math.ceil(nameSize*1.22),priceSize=cols===1?48:cols===2?36:30;
 const priceBlock=prices?priceSize+17:0;
 const nameOffset=photoInset+photoH+26;
 const dividerOffset=nameOffset+2*leading+13;
 const statusOffset=dividerOffset+18+priceBlock;
 const cardH=statusOffset+39+19+20+23;
 const gridH=rows*cardH+(rows-1)*gap;
 const height=top+gridH+94;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:false});
 ctx.textBaseline='top';
 ctx.fillStyle='#f2f5f9';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#101e35';ctx.fillRect(0,0,width,132);
 ctx.fillStyle='#fa4b62';ctx.fillRect(margin,128,82,4);
 if(brand){
  roundBox(ctx,margin,26,80,80,15,'#fff');
  picture(ctx,brand,margin+7,33,66,66);
 }
 const brandX=brand?margin+102:margin;
 ctx.fillStyle='#fff';ctx.font='820 36px system-ui';ctx.fillText('GAMER COMAYAGUA',brandX,31,970);
 ctx.fillStyle='#d6e1ef';ctx.font='21px system-ui';
 ctx.fillText('WhatsApp  +'+phone.slice(0,3)+' '+phone.slice(3,7)+'-'+phone.slice(7),brandX,79);
 ctx.fillStyle='#14233b';ctx.font='800 40px system-ui';ctx.fillText(title,margin,156,width-2*margin);
 items.forEach((product,i)=>{
  const x=margin+(i%cols)*(cardW+gap),y=top+Math.floor(i/cols)*(cardH+gap);
  roundBox(ctx,x,y,cardW,cardH,22,'#fff','#dae2ec');
  const px=x+photoInset,py=y+photoInset;
  roundBox(ctx,px,py,photoW,photoH,13,'#f1f4f8');
  ctx.save();ctx.clip();
  if(product.soldOut)ctx.filter='grayscale(100%)';
  const area=picture(ctx,photos[i],px,py,photoW,photoH);
  ctx.filter='none';
  if(area)markPhoto(ctx,marks,area);
  else{
   ctx.fillStyle='#566981';ctx.font='600 22px system-ui';
   ctx.textAlign='center';ctx.fillText('Foto por consultar',px+photoW/2,py+photoH/2-12,photoW-32);
  }
  ctx.restore();
  const textX=x+pad,textW=cardW-2*pad,dividerY=y+dividerOffset,statusY=y+statusOffset;
  ctx.fillStyle='#152640';ctx.font='790 '+nameSize+'px system-ui';
  label(ctx,product.name,textX,y+nameOffset,textW,2,leading);
  ctx.fillStyle='#e3eaf2';ctx.fillRect(textX,dividerY,textW,1);
  if(prices&&!product.soldOut){
   ctx.font='850 '+priceSize+'px system-ui';ctx.fillStyle='#ae1739';
   ctx.fillText(money(product.price),textX,dividerY+15,textW);
  }
  const available=product.stock!==null&&!product.soldOut;
  const status=stockLabel(product,stockText);
  const pillBg=product.soldOut?'#fbe9ed':available?'#e4f4ec':'#edf2f8';
  ctx.font='690 '+(cols===3?17:19)+'px system-ui';
  roundBox(ctx,textX,statusY,Math.min(textW,Math.ceil(ctx.measureText(status).width)+32),39,19,pillBg);
  ctx.fillStyle=product.soldOut?'#91243e':available?'#136345':'#40546d';
  ctx.textBaseline='middle';ctx.fillText(status,textX+16,statusY+20,textW-32);
  ctx.textBaseline='top';
  ctx.font='16px system-ui';ctx.fillStyle='#5b6d84';
  ctx.fillText('Ref. '+(product.ref||product.id),textX,statusY+54,textW);
 });
 const footerY=top+gridH+45;
 ctx.fillStyle='#566980';ctx.font='18px system-ui';
 ctx.fillText('Precios y existencias sujetos a confirmación',margin,footerY,width-2*margin-96);
 ctx.textAlign='right';ctx.font='750 18px system-ui';
 ctx.fillText((index+1)+' / '+total,width-margin,footerY);
 return {canvas,missing:photos.filter((image,i)=>!image&&items[i].photo).length};
}
async function drawCover(options, products, pageRange){
 const canvas=document.createElement('canvas');
 canvas.width=1200;canvas.height=1500;
 const ctx=canvas.getContext('2d',{alpha:false});
 const featured=products.filter(p=>p.photo).slice(0,3);
 const [logo,photos,marks]=await Promise.all([loadImage(options.logo),Promise.all(featured.map(p=>productImage(p.photo).then(img=>img||productImage(p.photoFallback)))),markAssets(options.watermark,options.logo)]);
 const gradient=ctx.createLinearGradient(0,0,1200,1500);
 gradient.addColorStop(0,'#101e35');gradient.addColorStop(1,'#213d63');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,1500);
 ctx.fillStyle='#f34a63';ctx.fillRect(56,236,100,8);
 if(logo)picture(ctx,logo,56,52,112,112);
 ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.font='800 32px system-ui';
 ctx.fillText('GAMER COMAYAGUA',logo?192:56,92);
 ctx.font='850 77px system-ui';
 lines(ctx,options.title,1088,2).forEach((line,i)=>ctx.fillText(line,56,280+i*90,1088));
 ctx.fillStyle='#dce7f5';ctx.font='600 30px system-ui';
 ctx.fillText(products.length+' productos disponibles · Envíos a toda Honduras',56,488,1088);
 const visible=photos.filter(Boolean);
 const cardWidth=(1088-Math.max(0,visible.length-1)*18)/Math.max(1,visible.length);
 visible.forEach((photo,i)=>{
  const x=56+i*(cardWidth+18);
  roundBox(ctx,x,590,cardWidth,560,24,'#f4f7fc');
  const area=picture(ctx,photo,x+14,604,cardWidth-28,532);
  if(area)markPhoto(ctx,marks,area);
 });
 ctx.fillStyle='#fff';ctx.font='750 34px system-ui';
 ctx.fillText('WhatsApp  +'+options.phone.slice(0,3)+' '+options.phone.slice(3,7)+'-'+options.phone.slice(7),56,1242);
 ctx.fillStyle='#dce7f5';ctx.font='24px system-ui';
 ctx.fillText(pageRange,56,1300);
 ctx.fillText('Precios y existencias sujetos a confirmación',56,1370);
 return canvas;
}
const blob=(canvas,type,quality=.9)=>new Promise((resolve,reject)=>canvas.toBlob(data=>data?resolve(data):reject(Error('El navegador no pudo crear el archivo.')),type,quality));
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
    '</div><div class="copy"><strong>'+escape(product.name)+'</strong><div class="product-meta">'+
    ((options.prices&&!product.soldOut)?'<b>'+escape(options.money(product.price))+'</b>':'')+
    '<span class="stock'+(product.soldOut?' out':product.stock!==null?' in':'')+'">'+escape(stockLabel(product,options.stockText))+'</span>'+
    '<small>Ref. '+escape(product.ref||product.id)+'</small></div></div></section>'
   ).join('')+'</div><footer>Precios y disponibilidad sujetos a confirmación <span>'+String(start+i+1)+' / '+pages.length+'</span></footer></article>';
 }).join('');
 win.document.open();
 win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(options.title)+' | Gamer Comayagua</title><style>'+styles+
  '*{box-sizing:border-box}body{margin:0;background:#edf2f8;font:14px system-ui,sans-serif;color:#172844}.tools{text-align:center;padding:12px}.tools button{font:inherit;font-weight:800;background:#a91b36;color:white;padding:11px 16px;border:0;border-radius:8px}article{margin:0 auto 18px;padding:22px;background:#f2f5f9;border-top:4px solid #a91b36;width:min(97%,850px);break-after:page}article:last-child{break-after:auto}header{display:flex;align-items:center;gap:10px;background:#101e35;color:white;border-radius:8px;padding:10px}header small{color:#d6e1ef}header img{width:46px;height:46px;object-fit:contain}header strong{font-size:19px}small{display:block;color:#52647c}.grid{display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:9px}section{padding:7px;background:white;min-width:0;border:1px solid #dae2ec;border-radius:10px;break-inside:avoid;display:flex;flex-direction:column}.copy{padding:10px 6px 7px;flex:1;display:flex;flex-direction:column}.copy strong{display:block;line-height:1.28;flex:1;margin-bottom:8px}.product-meta{border-top:1px solid #e3eaf2;padding-top:8px;display:grid;justify-items:start;gap:6px}.copy b{color:#ae1739;font-size:17px}.stock{background:#edf2f8;color:#40546d;font-size:10px;font-weight:700;border-radius:20px;padding:3px 8px}.stock.in{background:#e4f4ec;color:#136345}.stock.out{background:#fbe9ed;color:#91243e}.copy small{font-size:10px;overflow-wrap:anywhere}.photo{position:relative;display:grid;place-items:center;overflow:hidden;background:#f1f4f8;aspect-ratio:1;border-radius:7px}.photo>.product-photo{width:100%;height:100%;object-fit:contain}.photo .sold{filter:grayscale(1)}h1{font-size:21px;margin:13px 0}footer{font-size:10px;margin-top:15px;padding:0 2px 3px;color:#52647c}footer span{float:right}@page{size:letter;margin:10mm}@media print{body{background:white}.tools{display:none}article{width:auto;margin:0;padding:0}.photo{max-height:46mm}.grid:has(section:nth-child(7)) .photo{max-height:41mm}.grid:has(section:only-child) .photo{max-height:145mm}article,section{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media screen and (max-width:550px){article{padding:10px}section{font-size:12px}section b{font-size:14px}}</style></head><body><div class="tools"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>'+body+'</body></html>');
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
 <label id="gcExportCoverField"><input id="gcExportCover" type="checkbox" checked> Portada en el PDF</label>
 <label><input id="gcExportMark" type="checkbox" checked> Marca de agua</label>
 <label>Páginas<select id="gcExportPage"></select></label><p id="gcExportStatus" role="status"></p>
 <div class="gc-export-buttons">
 <button id="gcExportCopy" class="btn outline" type="button" hidden>Copiar enlace del catálogo</button>
 <a id="gcExportPng" class="btn red" hidden>Descargar PNG</a>
 <button id="gcExportPdf" class="btn outline" type="button" disabled>Preparar PDF</button>
 <button id="gcExportFull" class="btn red" type="button" hidden disabled>Descargar catálogo completo</button>
 <button id="gcExportCancel" class="btn outline" type="button" hidden>Cancelar preparación</button>
 <button id="gcExportOriginal" class="btn outline" type="button" hidden>Imprimir con fotos originales</button>
 <a id="gcExportPdfLink" class="btn red" hidden>Descargar PDF</a>
 <button id="gcExportShare" class="btn outline" type="button" hidden>Compartir archivo</button>
 <a id="gcExportView" class="btn outline" target="_blank" rel="noopener" hidden>Abrir PNG</a>
 </div></div><div class="gc-export-stage" id="gcExportStage"><img id="gcExportPreview" alt="Vista previa del catálogo" hidden></div></div>`;
 const $=id=>root.querySelector('#gcExport'+id);
 const source=$('Source'),page=$('Page'),title=$('Title'),stage=$('Preview'),status=$('Status');
 const original=$('Original'),full=$('Full'),cancel=$('Cancel');
 const png=$('Png'),pdf=$('Pdf'),pdfLink=$('PdfLink'),share=$('Share'),view=$('View');
 const categoryMode=options.source==='category',single=options.source==='product';
 root.querySelector('h2').textContent=single?'Ficha para compartir':categoryMode?'Catálogo para compartir':'Catálogo de productos seleccionados';
 $('Group').hidden=!categoryMode;$('CoverField').hidden=single;$('Copy').hidden=!categoryMode;full.hidden=single;
 if(categoryMode){
  source.add(new Option('Catálogo completo','all'));
  source.add(new Option(options.query?'Resultados de «'+options.query+'»':'Resultados actuales','result'));
  options.categories.forEach(name=>source.add(new Option(name,'category:'+name)));
  source.value=options.query||options.subcategory?'result':options.category?'category:'+options.category:'all';
 }
 let pdfJob=null,version=0,requestTimer,urls=[],pngFile,pdfFile,plan=[],activeOptions,exportItems=[];
 const clearLinks=()=>{
  pdfJob=null;full.disabled=true;cancel.hidden=true;
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];
  png.hidden=pdfLink.hidden=share.hidden=view.hidden=original.hidden=true;stage.hidden=true;pdf.disabled=true;
  pngFile=pdfFile=null;
 };
 const titleFor=()=>categoryMode&&source.value==='all'?'Catálogo general':single?options.selected[0].name:options.source==='selected'?(options.query?'Selección · '+options.query:'Productos seleccionados'):source.value.startsWith('category:')?source.value.slice(9):options.query||options.category||'Catálogo de productos';
 const sourceProducts=()=>categoryMode?(source.value==='all'?options.allProducts():source.value.startsWith('category:')?options.byCategory(source.value.slice(9)):options.results()):options.getSelected?options.getSelected():options.selected;
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
  const items=sourceProducts().filter(p=>single||(!p.soldOut&&p.stock!==null&&p.price!==null));
  if(categoryMode&&source.value==='all')items.sort((a,b)=>options.categoryLabel(a).localeCompare(options.categoryLabel(b),'es'));
  exportItems=items;
  const size=$('Size').value==='auto'?Math.min(6,Math.max(1,items.length)):Number($('Size').value);
  plan=pagePlan(items,size);
  if(reset){
   page.replaceChildren(...plan.map((_,i)=>new Option('Página '+(i+1)+' de '+plan.length,String(i))));
  }
  if(!plan.length){status.textContent='No hay productos con existencias confirmadas para esta selección.';return;}
  const index=Number(page.value)||0;
  const span=plan.length<=24?24:8;
  activeOptions={...options,title:title.value.trim()||titleFor(),prices:$('Prices').checked,watermark:$('Mark').checked?{...options.getWatermark(),enabled:true}:null};
  original.hidden=false;
  full.disabled=false;
  status.textContent='Preparando fotos de la página '+(index+1)+'…';
  try{
   const result=await drawPage(activeOptions,plan[index],index,plan.length);
   const data=await blob(result.canvas,'image/png');
   result.canvas.width=result.canvas.height=1;
   if(ticket!==version||!root.isConnected)return;
   const name=filename('-'+(index+1)+'.png');
   pngFile=new File([data],name,{type:'image/png'});
   const url=link(png,data,name);stage.src=url;stage.hidden=false;view.href=url;view.hidden=false;
   pdf.disabled=!!pdfJob;
   pdf.textContent=plan.length>span?'Preparar PDF · páginas '+(Math.floor(index/span)*span+1)+'–'+Math.min(plan.length,Math.floor(index/span)*span+span):'Preparar PDF';
   setShare(pngFile);
   if(!pdfJob)status.textContent=items.length+(items.length===1?' producto':' productos')+' · '+plan.length+(plan.length===1?' página':' páginas')+(result.missing?' · '+result.missing+' fotos no disponibles para PNG. Usá Imprimir con fotos originales.':'');
  }catch(error){if(ticket===version)status.textContent=error.message;}
 }
 original.onclick=()=>{
  const index=Number(page.value)||0,start=Math.floor(index/8)*8,end=Math.min(start+8,plan.length);
  if(!printOriginal(activeOptions,plan,start,end))status.textContent='Permití ventanas emergentes para abrir la versión para imprimir.';
 };
 async function preparePdf(complete){
  if(pdfJob||!plan.length||!activeOptions)return;
  const job={};
  pdfJob=job;
  const documentPlan=plan, settings=activeOptions;
  const span=documentPlan.length<=24?24:8, index=Number(page.value)||0;
  const start=complete?0:Math.floor(index/span)*span;
  const end=complete?documentPlan.length:Math.min(start+span,documentPlan.length);
  const pages=[];
  const active=()=>pdfJob===job&&root.isConnected;
  const quality=complete&&documentPlan.length>24?.72:.9;
  let missing=0;
  async function encode(canvas){
   try{
    const data=await blob(canvas,'image/jpeg',quality);
    return {jpeg:new Uint8Array(await data.arrayBuffer()),width:canvas.width,height:canvas.height};
   }finally{canvas.width=canvas.height=1;}
  }
  full.disabled=pdf.disabled=true;pdfLink.hidden=true;cancel.hidden=false;
  pdfFile=null;setShare(pngFile);
  try{
   if(!single&&$('Cover').checked){
    status.textContent='Preparando portada…';
    pages.push(await encode(await drawCover(settings,exportItems,'Páginas de productos '+(start+1)+' a '+end+' de '+documentPlan.length)));
   }
   const parallel=complete?3:1;
   for(let i=start;i<end;i+=parallel){
    if(!active())return;
    const count=Math.min(parallel,end-i);
    status.textContent='Preparando PDF · '+(i-start)+' de '+(end-start)+' páginas…';
    const rendered=await Promise.all(Array.from({length:count},async(_,offset)=>{
     const j=i+offset;
     const result=await drawPage(settings,documentPlan[j],j,documentPlan.length);
     missing+=result.missing;
     return encode(result.canvas);
    }));
    pages.push(...rendered);
   }
   if(!active())return;
   const data=makePdf(pages);
   const suffix=complete?'-completo.pdf':documentPlan.length>span?'-'+(start+1)+'-'+end+'.pdf':'.pdf';
   const name=filename(suffix);
   pdfFile=new File([data],name,{type:'application/pdf'});
   pdfLink.textContent=complete?'Guardar PDF completo':'Descargar PDF';
   link(pdfLink,pdfFile,name);setShare(pdfFile);
   status.textContent='PDF listo · '+pages.length+' páginas'+(missing?' · '+missing+' fotos por consultar':'')+'.';
   pdfLink.focus({preventScroll:true});
  }catch(error){if(active())status.textContent=error.message;}
  finally{if(active()){pdfJob=null;full.disabled=pdf.disabled=false;cancel.hidden=true;}}
 }
 pdf.onclick=()=>preparePdf(false);
 full.onclick=()=>preparePdf(true);
 cancel.onclick=()=>{
  pdfJob=null;full.disabled=pdf.disabled=false;cancel.hidden=true;
  status.textContent='Preparación cancelada.';
  full.focus({preventScroll:true});
 };
 share.onclick=async()=>{
  const file=pdfFile||pngFile;
  if(!file)return;
  try{await navigator.share({files:[file],title:title.value});}
  catch(error){if(error.name!=='AbortError')status.textContent='Descargá el archivo para adjuntarlo en WhatsApp.';}
 };
 $('Copy').onclick=async()=>{
  const url=options.publicLink(source.value);
  try{await navigator.clipboard.writeText(url);status.textContent='Enlace copiado';}
  catch(error){window.prompt('Copiá el enlace del catálogo',url);}
 };
 source.onchange=()=>{title.value=titleFor();refresh();};
 page.onchange=()=>refresh(false);
 ['Size','Prices','Cover','Mark'].forEach(id=>$(id).onchange=()=>refresh());
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
async function downloadProduct(product,options){
 const {canvas,missing}=await drawPage({...options,title:product.name,prices:true},[product],0,1);
 try{
  if(missing)throw Error('La foto no está disponible para descargar. Probá guardar la ficha como PDF.');
  const url=URL.createObjectURL(await blob(canvas,'image/png'));
  const link=document.createElement('a');
  link.href=url;
  link.download=clean(product.name)+'.png';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
 }finally{canvas.width=canvas.height=1;}
}
window.GC_EXPORT={open,downloadProduct,exportPhotoUrl};
})();
