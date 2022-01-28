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
    'jimu/BaseWidget',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'jimu/LayerStructure',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'dijit/form/Select'
], function (declare, BaseWidget, _WidgetsInTemplateMixin, lang, LayerStructure, Query, QueryTask) {
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

            // var layerStructure = LayerStructure.getInstance();
            // function printLayerTree() {
            //     layerStructure.traversal(function (layerNode) {
            //         if (layerNode.title == "ReviewerApp2 - ReviewRangeMapSpecies") {
            //             console.log(layerNode.title);
            //             console.log(layerNode.getLayerType());
            //             // console.log(layerNode.isLabelVisble())
            //             console.log(layerNode.isTable());
            //             let query1 = layerNode.getLayerObject().createQuery();
            //             query1.where = "Username = 'pvkommareddi'";
            //             query1.outFields = ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"];

            //             layerNode.queryFeatures(query1).then(function (response) {
            //                 let resultCount = response.features.length;
            //                 console.log(resultCount);
            //             });
            //         }
            //         //   var indent = "";
            //         //   for(var i = 0; i < layerNode.getNodeLevel(); i++) {indent += "  ";}
            //         //   console.log(indent, layerNode.title);
            //     });
            // }

            // printLayerTree();

            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = "Username = 'pvkommareddi'";
            queryParams.outFields = ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"];
            var queryTask = new QueryTask("https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/12");
            queryTask.execute(queryParams, lang.hitch(this, this._onSearchFinish), lang.hitch(this, this._onSearchError));
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
