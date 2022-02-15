///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'jimu/BaseWidget',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'jimu/LayerStructure',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/on',
    'dojo/domReady!'
], function (declare, array, BaseWidget, _WidgetsInTemplateMixin, lang, LayerStructure, Query, QueryTask, dom, domConstruct, on) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        // Custom widget code goes here

        baseClass: 'jimu-widget-reviewerwidget',

        //this property is set by the framework when widget is loaded.
        //name: 'CustomWidget',


        //methods to communication with app container:

        // postCreate: function() {
        //   this.inherited(arguments);
        //   console.log('postCreate');
        // },

        startup: function () {
            this.inherited(arguments);

            // const foundTable = this.map.allTables.find(function(table) {
            //     // Find a table with title "US Counties"
            //     return table.title === "ReviewerApp2 - ReviewRangeMapSpecies";
            //   });

            // let speciesRangeEchoshape = null;

            // for (const key in this.map._layers) {
            //     // console.log(`${key}: ${this.map._layers[key]._name}`);
            //     if (this.map._layers[key]._name === 'ReviewerApp2 - Species Range Ecoshapes (generalized)') {
            //         // console.log(this.map._layers[key])
            //         speciesRangeEchoshape = this.map._layers[key]
            //     }
            // }
            // console.log(typeof this.map._layers)
            // console.log(speciesRangeEchoshape)
            // console.log(this.map)


            // var layerStructure = LayerStructure.getInstance();
            // console.log(layerStructure.getBasemapLayerObjects())
            // function printLayerTree() {
            //     layerStructure.traversal(function (layerNode) {
            //         if (layerNode.title == "ReviewerApp2 - ReviewRangeMapSpecies") {
            //             // console.log(layerNode.title);
            //             // console.log("*******************")
            //             // layerNode.getLayerType().then((resolvedVal) => {console.log(resolvedVal)})
            //             // console.log("*******************")
            //             // layerNode.getLayerObject().then((resolvedVal) => {console.log(resolvedVal)})
            //             // console.log("*****************");
            //             // console.log(layerNode)
            //             // console.log(layerNode.isLabelVisble())
            //             // console.log(layerNode.isTable());

            //             let layer;
            //             layerNode.getLayerObject().then((resolvedVal) => {layer = resolvedVal});
            //             // console.log(layer)
            //             layer.definitionExpression = "username = 'pvkommareddi'"
            //             // let query = layer.createQuery()
            //             // query.where = "Username = 'pvkommareddi'";
            //             // query.outFields = ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"];

            //             // layer.queryFeatures(query1).then(function (response) {
            //             //     let resultCount = response.features.length;
            //             //     console.log(resultCount);
            //             // });
            //         }
            //         //   var indent = "";
            //         //   for(var i = 0; i < layerNode.getNodeLevel(); i++) {indent += "  ";}
            //         //   console.log(indent, layerNode.title);
            //         //   console.log(typeof layerNode)
            //     });
            // }

            // printLayerTree();

            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/12",
                "Username = 'pvkommareddi'",
                ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "RangeMapNotes", "RangeMapScope", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"],
                this._onSearchFinish
            );

            on(dom.byId('backButton'), "click", function(e) {
                dom.byId("div2").style.display = "none";
                dom.byId("div1").style.display = "block";
            });

            // this.fetchDataByName('Select');
        },
        _queryLayer: function (url, where, outFields, method) {
            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = where;
            queryParams.outFields = outFields;
            var queryTask = new QueryTask(url);
            queryTask.execute(queryParams, lang.hitch(this, method), lang.hitch(this, this._onSearchError));
        },

        onReceiveData: function (name, widgetId, data, historyData) {
            //filter out messages
            if (name !== 'Select') {
                return;
            }

            let div1 = dom.byId("div1");
            div1.style.display = "none";

            console.log(data);
            console.log(data.selectionInfo.ReviewerApp2_3112[0]);
            this._setDiv2(data.selectionInfo.ReviewerApp2_3112[0]);

            let div2 = dom.byId("div2");
            div2.style.display = "block";
        },

        _setDiv2: function (ecoshapeId) {
            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "InPoly_FID = " + ecoshapeId,
                ["ParentEcoregion", "Ecozone", "TerrestrialArea", "EcoshapeName", "ecoshapeid"],
                this._setDiv2Results
            )
        },

        _setDiv2Results: function(results) {
            // console.log(results);
            for (let i =0; i < results.features.length; i++) {
                let featureAttributes = results.features[i].attributes;
                for (let attr in featureAttributes) {
                    dom.byId(attr).innerHTML = featureAttributes[attr];
                    // if (attr == 'ecoshapeid') console.log(featureAttributes[attr])
                }
                
            }
            dom.byId("ecoshapeSpecies").innerHTML = this.taxaSelect.value;
        },


        _onSearchFinish: function (results) {
            var layerData = [];
            for (var i = 0; i < results.features.length; i++) {
                var featureAttributes = results.features[i].attributes;
                let obj = {};
                for (var attr in featureAttributes) {
                    obj[attr] = featureAttributes[attr];
                }
                layerData.push(obj);
            }

            let taxGroups = new Set();
            layerData.forEach((record) => taxGroups.add(record['tax_group']));

            let taxGroupOptions = [];
            taxGroups.forEach((val) => {
                taxGroupOptions.push({
                    label: val,
                    value: val
                });
            });

            this.taxaSelect.set('options', taxGroupOptions);
            this.taxaSelect.on('change', lang.hitch(this, function (val) {
                let suboptions = [];
                for (let i = 0; i < layerData.length; i++) {
                    if (layerData[i]['tax_group'] == val) {
                        suboptions.push({
                            label: layerData[i]['national_scientific_name'],
                            value: layerData[i]['national_scientific_name']
                        });
                    }
                }
                this.speciesSelect.reset();
                // suboptions[0]['selected'] = true;
                this.speciesSelect.set('options', suboptions);
            }));

            this.speciesSelect.on('change', lang.hitch(this, function (val) {
                for (var i = 0; i < results.features.length; i++) {
                    var featureAttributes = results.features[i].attributes;
                    if (featureAttributes['national_scientific_name'] == val) {
                        this.rangeVersion.innerHTML = featureAttributes['rangeversion'];
                        this.rangeStage.innerHTML = featureAttributes['rangestage'];
                        this.rangeScope.innerHTML = featureAttributes['rangemapscope'] == 'G' ? 'Global' : featureAttributes['rangemapscope'] == 'N' ? 'National' : '';
                        this.rangeMetadata.innerHTML = featureAttributes['rangemetadata'];
                        this.rangeMapNotes.innerHTML = featureAttributes['rangemapnotes'];
                        this.speciesInformation.innerHTML = '<a href="https://explorer.natureserve.org/Search#q">go to NatureServe Explorer</a>';
                    }
                }
            }));
        },

        _onSearchError: function (error) {
            console.error(error);
        }

        // onOpen: function(){
        //   console.log('onOpen');
        // },

        // onClose: function(){
        //   console.log('onClose');
        // },

        // onMinimize: function(){
        //   console.log('onMinimize');
        // },

        // onMaximize: function(){
        //   console.log('onMaximize');
        // },

        // onSignIn: function(credential){
        //   /* jshint unused:false*/
        //   console.log('onSignIn');
        // },

        // onSignOut: function(){
        //   console.log('onSignOut');
        // }

        // onPositionChange: function(){
        //   console.log('onPositionChange');
        // },

        // resize: function(){
        //   console.log('resize');
        // }

        //methods to communication between widgets:

    });
});
