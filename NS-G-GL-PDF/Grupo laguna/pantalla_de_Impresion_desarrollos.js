/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 define(['N/ui/serverWidget', 'N/search', 'N/https', 'N/record', 'N/render','N/file'], function(ui, search, https, record, render,file) {
    function onRequest(context) {

        try {
            if(context.request.parameters){
                var params = context.request.parameters;
                var Subselec = params.Sub;
                var Logotipo = params.logo;
                var padre = params.padre;
                var hijo = params.hijo;
                var URLogo;
                if(Logotipo){
                    var fileObj = file.load({id:Logotipo});
                    URLogo = 'https://6510521-sb1.app.netsuite.com'+ fileObj.url;
                }

                if(Subselec){
                    var Objinv =  BuscarArticulos(Subselec)
                    var arrows = Obtenerbody(Objinv);                    
                    var tablehead =  '<thead><tr><th style="width:150px" >Nombre</th><th style="width:70px">Estado</th><th style="width:60px">Categoria</th><th style="width:60px">Etapa</th><th>Metros Cuadrados</th><th>Precio Actual por m²</th><th>Precio Actual Total</th>'+'</tr></thead>'

                    var tableInit = ' <table  style="width:100%" >';
                    var tablebody= arrows;
                    var tablefin = '</table>';
                    var css = ''

                    css = css + '<style type="text/css">table {font-family: sans-serif;font-size: 8pt;table-layout: fixed;} '
                    css = css + 'th {font-weight: bold;font-size: 8pt;vertical-align: middle;padding: 2px 3px 3px;background-color: #e3e3e3;color: #333333;} '
                    css = css + 'td { padding: 2px 3px; }'
                    css = css + 'table.header td {    padding: 0;  font-size: 10pt;}table.footer td {  padding: 0; font-size: 8pt;}'
                    css = css + 'table.itemtable th { padding-bottom: 5px; padding-top: 5px;} '
                    css = css + 'table.body td { padding-top: 3px;} '
                    css = css + 'table.total { page-break-inside: avoid;} '
                    css = css + '.odd th, .odd td {'
                    css = css + 'background: #f4f4f4; '
                    css = css + '}'
                    css = css + ' </style>'

                    var cajatxt = '<div align="left">'
                    cajatxt = cajatxt+ '<p style="font-family: sans-serif;font-size: 9pt;font-weight: bold;">'+padre+'</p>'
                    cajatxt = cajatxt+ '<p style="font-family: sans-serif;font-size: 9pt;font-weight: bold;">'+hijo+'</p>'
                    cajatxt = cajatxt+ '</div>'

                    var table = tableInit+tablehead+tablebody+tablefin

                    var tablelogo = Obtenerlogo(URLogo)
                    log.audit({title:'>>tablelogo', details:tablelogo});

                    var xmlStr = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n' +
                    '<pdf>' +
                    '<head>' +css+
                    '</head> ' +
                    '<body>' + tablelogo+
                    cajatxt +table+
                    '</body>' +
                    '</pdf>';
                    log.audit({title:'>>xmlStr', details:xmlStr});
                    var renderer = render.create();
                    renderer.templateContent = xmlStr;
                    
            
                    var newfile = renderer.renderAsPdf();

                    context.response.writeFile({
                        file: newfile,
                        isInline: true
                    });
                   
                 }          
            }
            
 
            var form = ui.createForm({
                title: 'Lista de precios por unidad'
            });

            form.clientScriptModulePath = './pantalla_de_impresion_des_cli.js';

            var OBJSub = ConsultaSubsidiarias();
            log.audit({title:'>>OBJSub', details:OBJSub});
            log.audit({title:'>>OBJSub.length', details:Object.keys(OBJSub).length});
            var MainSub = form.addField({
                id: 'custom_gl_sub_add',
                type: ui.FieldType.SELECT,
                label: 'Subsidiaria',
            });

            if(OBJSub!=false){
                var claves = Object.keys(OBJSub)                 
                for(var i =0 ; i< claves.length;i++) {
                    MainSub.addSelectOption({
                        value: OBJSub[claves[i]].idsub,
                        text: OBJSub[claves[i]].nombre
                    });
                }
            }

            form.addButton({
                id: 'custom_gl_select_Imprimir',
                label: 'Imprimir',
                functionName: 'Imprimir()'
            });


            context.response.writePage(form);
        }catch (e) {
            var form = ui.createForm({
                title: 'error'+e,
            });
            log.error("error en onrequest",e)
        }
    }

    function ConsultaSubsidiarias(){
        try {
            var ObjSub = {};
            var subsidiarySearchObj = search.create({
                type: "subsidiary",
                filters:
                [
                    ["internalid","anyof","38","157","151","41","153","27","158","40","34","28","25","149","35","159","156","37","33","32","148","29","26","160","36","39","42","30","146","31","150","23"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "name",
                      sort: search.Sort.ASC,
                      label: "Nombre"
                   }),
                   search.createColumn({name: "internalid", label: "ID interno"}),
                   search.createColumn({name: "custrecord_ci_siafe_subs_logo", label: "Subsidiary Logo"}),
                   search.createColumn({name: "namenohierarchy", label: "Nombre (sin jerarquía)"}),
                   search.createColumn({name: "parent", label: "Subsidiaria primaria"})
                ]
             });
    
             subsidiarySearchObj.run().each(function(result){
                var id = result.getValue({name: "internalid"})
                var logo = result.getValue({name: "custrecord_ci_siafe_subs_logo"})
                var nombre = result.getValue({name: "namenohierarchy"})
                var idpadre = result.getValue({name: "parent"})
                ObjSub[id] = {
                    idsub:id,
                    logo:logo,
                    nombre:nombre,
                    idpadre:idpadre
                };
                return true;
             });
             
             return ObjSub
        } catch (error) {
            log.error({title:'>>error ArrayResp', details:error});
            return false
        }


         

    }

    function BuscarArticulos(subsidiaria){
        try {
            var Objinv = {};
            var inventoryitemSearchObj = search.create({
                type: "inventoryitem",
                filters:
                [
                   ["type","anyof","InvtPart"], 
                   "AND", 
                   ["subsidiary","anyof",subsidiaria],
                   "AND", 
                   ["custitemullsa_propstat","anyof","1"],
                   "AND",
                   ["name","doesnotcontain","Sin lote"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "itemid",
                      sort: search.Sort.ASC,
                      label: "Nombre"
                   }),
                   search.createColumn({name: "custitemullsa_propstat", label: "Estado"}),
                   search.createColumn({name: "custitemlotcategory", label: "Categoría de la propiedad"}),
                   search.createColumn({name: "departmentnohierarchy", label: "Departamento (sin jerarquía)"}),
                   search.createColumn({name: "custitemullsa_m2", label: "Metros cuadrados"}),
                   search.createColumn({name: "custitemullsa_priceperm2", label: "Precio actual por m2"}),
                   search.createColumn({name: "custitemullsa_totactprice", label: "Precio actual total"})
                ]
             });

             inventoryitemSearchObj.run().each(function(result){
                var estado = result.getText({name: "custitemullsa_propstat"})
                var categoria = result.getText({name: "custitemlotcategory"})
                var metrosCuadrados = result.getValue({name: "custitemullsa_m2"})
                var precioM2 = result.getValue({name: "custitemullsa_priceperm2"})
                var precioT = result.getValue({name: "custitemullsa_totactprice"})
                var nombre = result.getValue({name: "itemid"})
                var departamento = result.getText({name: "departmentnohierarchy"})

                Objinv[nombre] = {
                    nombre:nombre,
                    estado:estado,
                    categoria:categoria,
                    metrosCuadrados:metrosCuadrados,
                    precioM2:precioM2,
                    precioT:precioT,
                    departamento:departamento
                };

                return true;
             });
             
           return Objinv
        } catch (error) {
            log.error({title:'>>error Objinv', details:error});
            return false
        }
    }

    function Obtenerbody(obj){
        try {
            var arrowArray = Object.keys(obj)
            var arrows = arrowArray.length
            var body = '';
            log.audit({title:'>> arrowArray', details:arrowArray});
            log.audit({title:'>> arrows', details:arrows});
            var control = 0;
            for(var i=0;i<arrows;i++){
                var OBjtemp = obj[arrowArray[i]];
                var arrowArraySelec = [];
                arrowArraySelec[0] = OBjtemp.nombre
                arrowArraySelec[1] = OBjtemp.estado
                arrowArraySelec[2] = OBjtemp.categoria
                arrowArraySelec[3] = OBjtemp.departamento
                arrowArraySelec[4] = OBjtemp.metrosCuadrados + 'm²'
                var pTem1 = SepararComas(OBjtemp.precioM2)
                arrowArraySelec[5] = '$ '+ pTem1
                var pTem2 =SepararComas(OBjtemp.precioT)
                arrowArraySelec[6] = '$ '+ pTem2
                if(control==0){
                    body=body+'<tr class="odd" >';
                    control = 1;
                }else{
                    body=body+'<tr class="even" >';
                    control = 0;
                }
                for(var j=0;j<arrowArraySelec.length;j++){
                    body=body+'<td>';
                    body=body+arrowArraySelec[j];
                    body=body+'</td>';
                }
                body=body+'</tr>';

            }
            

            return body
        } catch (error) {
            log.error({title:'>>error Objinv', details:error});
            return false
        }
    }

    function Obtenerlogo(url){
        try {
            log.audit({title:'>> url', details:url});
            var tablelogo ='';
            var now = new Date();
            var fecha = now.getDate() + '/' + ( now.getMonth() + 1 ) + '/' + now.getFullYear();
            var hora = now.getHours() + ':' + now.getMinutes() 
            //var urlcorrect = url.replace('&', '&amp;')
            var urlarray = url.split('&')
            var correct = urlarray[0] +'&amp;'+ urlarray[1] +'&amp;'+urlarray[2]
            log.audit({title:'>> correct', details:correct});
            tablelogo = tablelogo + '<table  WIDTH="100%" style="text-align:center">';
            tablelogo = tablelogo + '<tr><td>';
            tablelogo = tablelogo + '<img src="'+correct+'" ></img></td>';
            tablelogo = tablelogo + '<td align="center" >';
            tablelogo = tablelogo + '<p style="font-family: sans-serif;font-size: 13pt;font-weight: bold;padding-top: 120px;">Lista de precios por unidad</p>';
            tablelogo = tablelogo + '</td>';
            tablelogo = tablelogo + '<td align="right" >';
            tablelogo = tablelogo + '<span style="font-size:10px;"><br/><br/><br/><strong>Fecha y hora: '+fecha+' '+ hora+'</strong></span>';
            tablelogo = tablelogo + '</td>';
            tablelogo = tablelogo + '</tr></table>';


            return tablelogo
        } catch (error) {
            log.error({title:'>>error Objinv', details:error});
            return false
        }
    }

    function SepararComas(Number){
        try {
            if(Number=='' || !Number){
                return Number
            }
            var NumberNonString = '';
            var ArrayNumberString = [];
            var Size ;
            var Index;
            var Count = 0;
            var Pennies  = ''; 
            var CountTemp =0;
            var Amount = '';
            var Total = '';

          if(typeof Number == "string"){
            ArrayNumberString = Number.split('');
          }else{
            NumberNonString = String(Number)
            ArrayNumberString = NumberNonString.split('');
          };
          Size = ArrayNumberString.length;  
              if(Size){
                for(var i=0 ; i<Size;i++){
                    if(ArrayNumberString[i] === '.') {
                        Index = i
                    }else if(!Index){
                        Count ++
                    }
                    if(Index){
                        Pennies = Pennies + ArrayNumberString[i]
                    }
                 }
              }
            
            if(Count>3){
                
                for(var j=(Count -1) ; j>=0;j--){
                    if( CountTemp == 3) {
                        Amount = ',' + Amount 
                        CountTemp = 0
                    }
                    Amount = ArrayNumberString[j] + Amount 
                    CountTemp ++
                }
            }else{
                return Number
            }
                        
          var Total = Amount + Pennies
            return Total
        } catch (error) {
            log.error({title:'>>error SepararComas', details:error});
            return false
        }
    }
    return {
        onRequest: onRequest,

    };
});