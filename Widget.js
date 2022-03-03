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
    'dojo/dom',
    'dojo/on',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    './Helper',
    './DataModel',
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin,
    lang, LayerStructure, Query, QueryTask, dom, on, FeatureLayer, graphic, Helper, DataModel) {
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

            this.dataModel = new DataModel();

            // [
            //     { dictObj: this.echoshapesDict, url: this.config.layers.ECOSHAPES },
            //     { dictObj: this.speciesRangeEcoshapesDict, url: this.speciesRangeEcoshapesDict }
            // ].forEach(function (item) {
            //     var queryParams = new Query();
            //     queryParams.returnGeometry = false;
            //     queryParams.where = "1=1";
            //     queryParams.outFields = ["objectid", "ecoshapeid"];
            //     var queryTask = new QueryTask(item['url']);
            //     queryTask.execute(queryParams, lang.hitch(this, function (results) {
            //         for (let i = 0; i < results.features.length; i++) {
            //             let featureAttributes = results.features[i].attributes;
            //             item['dictObj'][featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
            //         }
            //     }), lang.hitch(this, this._onSearchError));
            // });

            this._queryLayer(
                this.config.layers.ECOSHAPES,
                "1=1",
                ["objectid", "ecoshapeid"],
                function (results) {
                    for (let i = 0; i < results.features.length; i++) {
                        let featureAttributes = results.features[i].attributes;
                        this.dataModel.echoshapesDict[featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
                    }
                }
            );

            this._queryLayer(
                this.config.layers.REVIEWED_ECOSHAPES,
                "1=1",
                ["objectid", "ecoshapeid"],
                function (results) {
                    for (let i = 0; i < results.features.length; i++) {
                        let featureAttributes = results.features[i].attributes;
                        this.dataModel.speciesRangeEcoshapesDict[featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
                    }
                }
            );

            console.log(this.dataModel.echoshapesDict);

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId('saveButton'), "click", function (e) {

            });
            // this.map.on("click", function(mouseEvent) {
            //     console.log(mouseEvent);
            //     console.log(this.infoWindow)
            // });

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

            let infoPanel = dom.byId("infoPanel");
            infoPanel.style.display = "none";

            new Helper().setEcoshapeInfo(data.selectionInfo.ReviewerApp2_3112[0]);

            let markupPanel = dom.byId("markupPanel");
            markupPanel.style.display = "block";

            new Helper().setMarkupOptions(data, this.markupSelect);


            // let ecochapeReviewLayer = new FeatureLayer("https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/3");

            // let graphicObj = new graphic();
            // graphicObj.setAttributes({
            //     reviewid: 1896,
            //     ecoshapeid: 126,
            //     ecoshapereviewnotes: "test",
            //     Username: "pvkommareddi",
            //     Markup: "P"
            // });

            // ecochapeReviewLayer.applyEdits([graphicObj]);

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

            let rangeMapID = null;
            let reviewID = null;

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

                        rangeMapID = featureAttributes['rangemapid'];
                        reviewID = featureAttributes['reviewid'];
                    }
                }

                let layerStructure = LayerStructure.getInstance();
                layerStructure.traversal(function (layerNode) {
                    if (layerNode.title === "ReviewerApp2 - Species Range Ecoshapes (generalized)") {
                        layerNode.getLayerObject().then((layer) => {
                            layer.setDefinitionExpression("rangemapid=" + rangeMapID);
                        });
                    }
                    else if (layerNode.title === "ReviewerApp2 - Reviewed Ecoshapes (generalized)") {
                        layerNode.getLayerObject().then((layer) => {
                            layer.setDefinitionExpression("reviewid=" + reviewID);
                        });
                    }
                });

            }));

        },

        _onSearchError: function (error) {
            console.error(error);
        },

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

        onSignIn: function (credential) {
            /* jshint unused:false*/
            console.log('onSignIn');

            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/12",
                `Username = '${credential.userId}'`,
                ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "RangeMapNotes", "RangeMapScope", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"],
                this._onSearchFinish
            );

            this.userCredentials = credential;
        },

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
