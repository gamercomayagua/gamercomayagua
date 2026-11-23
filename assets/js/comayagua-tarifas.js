/* Gamer Comayagua · 104 destinos de entrega. 56 tarifas originales y 48 tarifas por tramo. */
(function(){'use strict';
var data=[["Col. Piedras Bonitas (Norte y Sur)","Sector Base",15,"own"],["Bo. Santa Lucía","Sector Base",15,"own"],["Col. Los Jazmines / Jazmines del Valle","Sector Base",15],["Univ. José Cecilio del Valle (UJCV)","Sector Base",15],["Bo. San Blas","Sector Aledaño",25],["Sector Iglesia Sagrada Familia","Sector Aledaño",25],["Bo. Lourdes","Sector Aledaño",30],["Col. 21 de Abril","Sector Aledaño",30],["Col. Francisco Morazán","Sector Aledaño",30],["Bo. San Francisco","Sector Aledaño",30],["Col. Nueva Esperanza","Sector Aledaño",30],["Col. San Miguel I","Sector Aledaño",30],["Centro Histórico / Parque Central / Catedral","Casco Urbano",35],["Bo. Torondón","Casco Urbano",35],["Hospital Santa Teresa","Casco Urbano",35],["Bo. Arriba","Casco Urbano",35],["Bo. Cabañas","Casco Urbano",35],["Bo. Independencia","Casco Urbano",35],["Bo. La Joya","Casco Urbano",35],["Bo. Los Lirios","Casco Urbano",35],["Bo. San Juan","Casco Urbano",35],["Bo. San Pablo","Casco Urbano",35],["Mall Premier / Bulevar","Casco Urbano",40],["Bo. Abajo","Casco Urbano",40],["Bo. San José","Casco Urbano",40],["Bo. La Caridad","Casco Urbano",40],["Bo. INVA","Casco Urbano",40],["Col. Mejicapa","Casco Urbano",40],["Col. San Carlos","Casco Urbano",40],["Col. SITRAMEDYS","Casco Urbano",40],["Col. Mejía Fiallos","Casco Urbano",40],["Estadio Carlos Miranda","Sector Estadio / Terminal",45],["Terminal de Buses Comayagua","Sector Estadio / Terminal",45],["Bo. La Sabana (San Antonio de la Sabana)","Sector Estadio / Terminal",45],["Col. Carlos Miranda","Sector Estadio / Terminal",45],["Bo. La Zarcita","Sector Estadio / Terminal",45],["Col. Brisas del Humuya","Sector Estadio / Terminal",45],["Col. Los Almendros","Sector Estadio / Terminal",45],["Col. Fuerzas Armadas","Periferia Urbana",50],["Col. Milagro de Dios","Periferia Urbana",50],["Col. Vistas del Valle","Periferia Urbana",50],["Col. Brisas del Valle","Periferia Urbana",50],["Col. INCEHSA","Periferia Urbana",50],["Col. 1° de Mayo / 2 de Mayo / 10 de Mayo","Periferia Urbana",50],["Residencial Mira Valle / Brisas de Altamira","Periferia Urbana",50],["Ajavín","Salidas / Aldeas Cercanas",55],["Jarín (Aldea y Col. Agrícola Jarín)","Salidas / Aldeas Cercanas",60,"jarin"],["El Sifón","Valle / Ruta La Paz",85],["Ajuterique (casco urbano)","Valle / Ruta La Paz",95],["Flores","Valle / Ruta La Paz",100],["Aeropuerto Palmerola / Entrada Base Aérea","Valle / Ruta La Paz",100],["Lejamaní","Valle / Ruta La Paz",105],["Villa de San Antonio (casco urbano)","Valle / Ruta La Paz",120],["Yarumela","Valle / Ruta La Paz",135],["La Paz (casco urbano)","Valle / Ruta La Paz",160],["Cane (La Paz)","Valle / Ruta La Paz",195]];
// Nuevas tarifas por tramo. Ubicaciones del catastro municipal y OpenStreetMap.
// Referencia vial: UJCV en Piedras Bonitas. Para las nuevas zonas: hasta 0.8 km L 30,
// hasta 2.2 km L 35, hasta 3 km L 40, hasta 4 km L 45, hasta 5 km L 50, hasta 6.1 km L 55.
// Sin un punto vial confiable, se usa un tramo comparable del catastro.
var added=[
 ["Col. Lomas del Río","Noreste",40],
 ["Bo. Suyapa (La Suyapa)","Noreste",45,"barrio la suyapa"],
 ["Col. Brisas de Suyapa I","Noreste",45],
 ["Col. Brisas de Suyapa II","Noreste",45],
 ["Col. La Concepción","Noreste",50],
 ["Col. Valentín Suárez","Noreste",50],
 ["Lot. Las Golondrinas","Noreste",45],
 ["Col. Gustavo Boquín","Noreste",40],
 ["Res. El Manantial","Noreste",50],
 ["Bo. Las Jagüitas","Noreste",45,"la jaguita"],
 ["Res. Monte Sagrado","Noreste",50],
 ["Col. Lomas de Comayagua","Noreste",50,"lomas del comayagua"],
 ["Bo. San Miguel del Edén","Noreste",50],
 ["Bo. Valle de Ángeles","Noreste",50],
 ["Bo. El Sitio","Noreste",55],
 ["Lot. Los Pinos","Noroeste",45],
 ["Col. Vista Hermosa","Noroeste",45],
 ["Col. San Martín","Noroeste",50],
 ["Col. Casa Blanca","Noroeste",50],
 ["Col. Centenario","Suroeste",40],
 ["Col. Nueva Valladolid","Suroeste",35],
 ["Col. El Camalote","Periferia Urbana",50],
 ["Bo. San Sebastián","Centro y sur",30],
 ["Col. Jardines de Capiro","Periferia Urbana",40],
 ["Col. Lincoln Coleman","Periferia Urbana",35],
 ["Col. Las Colinas","Periferia Urbana",50],
 ["Bo. La Guama","Periferia Urbana",45],
 ["Col. Tenguaje","Periferia Urbana",55,"cerro el nance"],
 // Plan municipal, págs. 49–51. Tarifas comerciales por comparación con destinos del mismo sector.
 ["Col. Iván Betancourth","Noroeste",50,"ivan betancourt ivan bentancourth"],
 ["Bo. Mata de Caña","Noroeste",50],
 ["Col. Los Laureles","Noroeste",50],
 ["Col. Lazos de Amistad","Noroeste",50],
 ["Col. Pinto","Noroeste",50],
 ["Col. Club Rotario","Noroeste",50],
 ["Bo. Cruz Grande","Noroeste",50],
 ["Res. Marbella","Noroeste",50],
 ["Res. Villa Santa Martha","Noroeste",50],
 ["Lot. Roberto Rodríguez","Sureste",40],
 ["Col. Espíritu Santo","Sureste",40],
 ["Col. San Rafael","Sureste",40],
 ["Col. San Miguel II","Sureste",40,"san miguel 2"],
 ["Bo. San Ramón","Sureste",40],
 ["Col. Villa Hermosa","Sureste",40],
 ["Col. Nueva Comayagua I","Sureste",40,"nueva comayagua 1"],
 ["Col. Nueva Comayagua II","Sureste",40,"nueva comayagua 2"],
 ["Col. Mazzarella","Suroeste",40,"mazzarela"],
 ["Col. Escoto","Suroeste",40],
 ["Bo. El Porvenir","Suroeste",40]
];
// Los barrios de la ciudad y las aldeas cercanas usan Comayagua/Comayagua.
var municipalityByZone={
 'zone-48':'Ajuterique','zone-49':'Ajuterique','zone-50':'Villa de San Antonio',
 'zone-52':'Lejamaní','zone-53':'Villa de San Antonio','zone-54':'La Paz',
 'zone-55':'La Paz','zone-56':'Cane'
};
window.GC_LOCAL_DELIVERIES=Object.freeze(data.concat(added).map(function(row,i){
 var id='zone-'+String(i+1).padStart(2,'0');
 var original=i<data.length;
 return Object.freeze({
  id:id,name:row[0],sector:row[1],price:row[2],aliases:original?'':row[3]||'',
  ownSaleException:original&&row[3]==='own',jarin:original&&row[3]==='jarin',
  department:municipalityByZone[id]==='La Paz'||municipalityByZone[id]==='Cane'?'La Paz':'Comayagua',municipality:municipalityByZone[id]||'Comayagua'
 });
}));
})();
