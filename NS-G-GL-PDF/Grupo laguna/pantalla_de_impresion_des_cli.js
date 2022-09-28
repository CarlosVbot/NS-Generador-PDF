/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'N/https', 'N/log', 'N/search', 'N/ui/message', 'N/url'],
 /**
  * @param{currentRecord} currentRecord
  * @param{https} https
  * @param{log} log
  * @param{search} search
  * @param{message} message
  * @param{url} url
  */
 function(currentRecord, https, log, search, message, url) {

     /**
      * Function to be executed after page is initialized.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.currentRecord - Current form record
      * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
      *
      * @since 2015.2
      */
     function pageInit(scriptContext) {

     }

     /**
      * Function to be executed when field is changed.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.currentRecord - Current form record
      * @param {string} scriptContext.sublistId - Sublist name
      * @param {string} scriptContext.fieldId - Field name
      * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
      * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
      *
      * @since 2015.2
      */
     function fieldChanged(scriptContext) {

     };

     function Imprimir(){
         try{
             var Seleccion= currentRecord.get().getValue('custom_gl_sub_add');
             var Objsub = ConsultaSubsidiarias(Seleccion)
             var cantidad = BuscarArticulos(Seleccion)
             console.log(Objsub)
             if(cantidad>0){
                var params = { Sub:Seleccion , logo:Objsub.logo, padre:Objsub.padreN ,hijo:Objsub.hijo}
                var resolveURL = url.resolveScript({
                     scriptId: 'customscript_gl_sl_vista_des',
                     deploymentId: 'customdeploy_gl_sl_vista_des',
                     params: params
                     });
   
                window.open(resolveURL, '_blank');
             }else{
                message.create({
                    type: message.Type.WARNING,
                    title: 'Advertencia',
                    message: 'Esta seleccion no cuenta con articulos',

                }).show({duration: 5000});
             }
             
             

         }catch (e) {
             console.log(e)
         }

     }

     function ConsultaSubsidiarias(sub){
        try {
            var Obrespo = {};
            var subsidiarySearchObj = search.create({
                type: "subsidiary",
                filters:
                [
                    ["internalid","anyof",sub]
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
             var logo;
             var padre;
             var hijo;
             subsidiarySearchObj.run().each(function(result){
                logo = result.getValue({name: "custrecord_ci_siafe_subs_logo"})
                padre = result.getValue({name: "parent"})
                hijo = result.getValue({name: "namenohierarchy"})
                Obrespo = {
                    logo:logo,
                    padre:padre,
                    hijo:hijo,                
                }
                return true;
             });
             var projectLook = search.lookupFields({
                type: "subsidiary",
                id: Obrespo.padre,
                columns: ['namenohierarchy']
            });
            Obrespo = {
                logo:logo,
                padre:padre,
                hijo:hijo,  
                padreN:projectLook.namenohierarchy,              
            }
             return Obrespo
        } catch (error) {
         
            return false
        }

        
         

    }
    function BuscarArticulos(subsidiaria){
        try {
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
                   search.createColumn({name: "category", label: "Categoría"}),
                   search.createColumn({name: "custitemullsa_m2", label: "Metros cuadrados"}),
                   search.createColumn({name: "custitemullsa_priceperm2", label: "Precio actual por m2"}),
                   search.createColumn({name: "custitemullsa_totactprice", label: "Precio actual total"})
                ]
             });
             var searchResultCount = inventoryitemSearchObj.runPaged().count;
           
           return searchResultCount
        } catch (error) {
    
            return false
        }
    }
     return {
         pageInit: pageInit,
         fieldChanged: fieldChanged,
         Imprimir:Imprimir
     };

 });
