/**
 * GAMER COMAYAGUA · PANEL PRIVADO PARA GOOGLE APPS SCRIPT
 *
 * Instalar en un proyecto de Apps Script NUEVO bajo la cuenta PROPIETARIA.
 * Desplegar como APLICACIÓN WEB:
 *   Ejecutar como: YO
 *   Acceso: SOLO YO / Only myself (nunca "Cualquier persona").
 *
 * IMPORTANTE: la página pública usa OTRO proyecto Apps Script.
 * No anexar este código al Apps Script público.
 *
 * La seguridad se aplica en CADA función del servidor, no en HTML.
 * Cuenta permitida = propietaria de la hoja de cálculo.
 */
const GC_PRIVATE_SHEET_ID = '1nz1_FtExSD9Z7wgZ9WKaz94_PCX1rX49bUGBuKIw8S8';
const GC_PRIVATE_OWNER = 'rguerrero9303922@educatrachos.hn';
const GC_PRIVATE_TAB = 'Catalogo';
const GC_PRIVATE_SETTINGS = 'Control Tienda';
const GC_PRIVATE_PAGE_SIZE = 35;

function gcRequireOwner_(){
  const email=String(Session.getActiveUser().getEmail() || '').toLowerCase().trim();
  if(!email || email!==GC_PRIVATE_OWNER){
    throw new Error('ACCESO DENEGADO. Entra con la cuenta propietaria del catálogo. No publiques este panel para cualquier persona.');
  }
}
function gcSheet_(){
  gcRequireOwner_();
  const s=SpreadsheetApp.openById(GC_PRIVATE_SHEET_ID);
  const tab=s.getSheetByName(GC_PRIVATE_TAB);
  if(!tab)throw new Error('No existe la pestaña Catalogo');
  return {ss:s,tab:tab,settings:s.getSheetByName(GC_PRIVATE_SETTINGS)};
}
function doGet(){
  try{gcRequireOwner_();}
  catch(error){
    return HtmlService.createHtmlOutput('<div style="font:16px system-ui;padding:30px;max-width:500px;margin:auto"><h2>Acceso restringido</h2><p>Este panel es privado. Abre el enlace con la cuenta propietaria de Google Sheets y confirma que la aplicación web esté publicada como <b>Solo yo</b>.</p></div>').setTitle('Gamer Comayagua · acceso restringido');
  }
  return HtmlService.createHtmlOutputFromFile('Panel').setTitle('Gamer Comayagua | Administración privada').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function gcGetSettings(){
  const ctx=gcSheet_();
  if(!ctx.settings)throw new Error('Falta la pestaña Control Tienda');
  const vals=ctx.settings.getRange('B2:B4').getValues().map(v=>Number(v[0])||0);
  return {markup:vals[0],reduction:vals[1],effective:vals[2],count:Math.max(0,ctx.tab.getLastRow()-1)};
}
function gcClean_(value){return String(value==null?'':value).trim();}
function gcSearchProducts(term,page){
  const ctx=gcSheet_(),q=gcClean_(term).slice(0,120),pageNo=Math.max(0,Math.min(1000,Math.floor(Number(page)||0)));
  const last=ctx.tab.getLastRow(),count=Math.max(0,last-1);
  if(!count)return {items:[],total:0,page:pageNo,more:false};
  const publicCols=ctx.tab.getRange(2,1,count,11).getValues();
  const privateCols=ctx.tab.getRange(2,20,count,4).getValues();
  function normalize(v){return gcClean_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function compact(v){return normalize(v).replace(/\s+/g,'');}
  const normalized=normalize(q),searchKey=compact(q);
  const words=normalized.split(' ').filter(Boolean);
  let found=0;const items=[];
  for(let i=0;i<count;i++){
    const row=publicCols[i],cfg=privateCols[i],id=gcClean_(row[0]),name=gcClean_(row[1]);
    if(!id || !name)continue;
    const text=[id,name,row[3],row[5],row[6],row[7],row[8]].join(' '),normalizedText=normalize(text),key=compact(text);
    const possible=words.every(word=>normalizedText.includes(word)||key.includes(word));
    const alias=searchKey && (key.includes(searchKey) || key.includes(searchKey.replace(/ultra/g,'u')) || key.includes(searchKey.replace(/s24u/g,'s24ultra')));
    if(q && !possible && !alias)continue;
    if(found>=pageNo*GC_PRIVATE_PAGE_SIZE && items.length<GC_PRIVATE_PAGE_SIZE){
      items.push({id:id,name:name,base:Number(row[2])||0,price:Number(cfg[1])||0,manual:cfg[0]===''?'':Number(cfg[0]),
        shipping:gcClean_(cfg[2]).toUpperCase()==='SI',soldOut:gcClean_(cfg[3]).toUpperCase()==='AGOTADO',
        photo:/^https:\/\//.test(gcClean_(row[10]))?gcClean_(row[10]):'',category:gcClean_(row[6])});
    }
    found++;
  }
  return {items:items,total:found,page:pageNo,more:(pageNo+1)*GC_PRIVATE_PAGE_SIZE<found};
}
function gcSaveProduct(payload){
  gcRequireOwner_();
  if(!payload || typeof payload!=='object')throw new Error('Datos inválidos.');
  const id=gcClean_(payload.id);
  if(!/^[a-zA-Z0-9_-]{1,65}$/.test(id))throw new Error('ID inválido');
  const priceRaw=payload.manual;
  const manual=(priceRaw===''||priceRaw===null||priceRaw===undefined)?'':Number(priceRaw);
  if(manual!=='' && (!Number.isFinite(manual)||manual<=0||manual>1000000))throw new Error('El precio debe ser mayor que cero y menor que L 1,000,000.');
  if(typeof payload.shipping!=='boolean'||typeof payload.soldOut!=='boolean')throw new Error('Opciones inválidas');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const ctx=gcSheet_(),finder=ctx.tab.getRange(2,1,Math.max(1,ctx.tab.getLastRow()-1),1).createTextFinder(id).matchEntireCell(true).findNext();
    if(!finder)throw new Error('No se encontró el producto seleccionado');
    const row=finder.getRow();
    if(gcClean_(ctx.tab.getRange(row,1).getDisplayValue())!==id)throw new Error('El producto cambió. Actualizá el buscador.');
    // Solo cambiar columnas T, V y W. La fórmula U queda intacta.
    ctx.tab.getRange(row,20).setValue(manual);
    ctx.tab.getRange(row,22,1,2).setValues([[payload.shipping?'SI':'NO',payload.soldOut?'AGOTADO':'DISPONIBLE']]);
    SpreadsheetApp.flush();
    return {ok:true,id:id,price:ctx.tab.getRange(row,21).getDisplayValue()};
  }finally{lock.releaseLock();}
}
function gcSaveMarkup(markup,reduction){
  const n=Number(markup),r=Number(reduction);
  if(!Number.isFinite(n)||!Number.isFinite(r)||n<0||n>200||r<0||r>n)throw new Error('Revisa el aumento y la reducción (0 a 200%, reducción menor o igual al aumento).');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const ctx=gcSheet_();
    if(!ctx.settings)throw new Error('Falta Control Tienda');
    ctx.settings.getRange('B2:B3').setValues([[n],[r]]);
    SpreadsheetApp.flush();
    return {ok:true,effective:n-r,markup:n,reduction:r};
  }finally{lock.releaseLock();}
}
function gcSetAllShipping(enabled){
  gcRequireOwner_();
  if(typeof enabled!=='boolean')throw new Error('Opción inválida');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const ctx=gcSheet_(),num=Math.max(0,ctx.tab.getLastRow()-1);
    if(num)ctx.tab.getRange(2,22,num,1).setValues(Array.from({length:num},()=>[enabled?'SI':'NO']));
    SpreadsheetApp.flush();
    return {ok:true,count:num,enabled:enabled};
  }finally{lock.releaseLock();}
}
