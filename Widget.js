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
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin,
    lang, LayerStructure, Query, QueryTask, dom, on, FeatureLayer, graphic) {
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

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("div2").style.display = "none";
                dom.byId("div1").style.display = "block";
            });

            this.echoshapesDict = {}
            this.speciesRangeEcoshapesDict = {}

            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "1=1",
                ["objectid", "ecoshapeid"],
                this._idMapping1
            );

            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "1=1",
                ["objectid", "ecoshapeid"],
                this._idMapping2
            );

            // this.map.on("click", function(mouseEvent) {
            //     console.log(mouseEvent);
            //     console.log(this.infoWindow)
            // });

            // this.fetchDataByName('Select');
        },

        _idMapping1: function (results) {
            for (let i = 0; i < results.features.length; i++) {
                let featureAttributes = results.features[i].attributes;
                this.echoshapesDict[featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
            }
        },
        _idMapping2: function (results) {
            for (let i = 0; i < results.features.length; i++) {
                let featureAttributes = results.features[i].attributes;
                this.speciesRangeEcoshapesDict[featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
            }
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
            // console.log(this.map.infoWindow)
            console.log(data.selectionInfo)

            let div1 = dom.byId("div1");
            div1.style.display = "none";

            this._setDiv2(data.selectionInfo.ReviewerApp2_3112[0]);

            let div2 = dom.byId("div2");
            div2.style.display = "block";

            // this._queryLayer(
            //     "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/11",
            //     "objectid = " + data.selectionInfo.ReviewerApp2_9712[0],
            //     ["ecoshapeid", "markup"],
            // )

            if (Array.isArray(data.selectionInfo.ReviewerApp2_2465) && data.selectionInfo.ReviewerApp2_2465.length != 0) {
                this._queryLayer(
                    "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/10",
                    "ecoshapeid = " + data.selectionInfo.ReviewerApp2_2465[0],
                    ["presence"],
                    this._populateDropdown
                )
            }
            else if (Array.isArray(data.selectionInfo.ReviewerApp2_3112) && data.selectionInfo.ReviewerApp2_3112.length != 0) {
                let values = [{ label: "Present", value: "P" }, { label: "Presence Expected", value: "X" }, { label: "Historical", value: "H" }];
                let options = [];
                for (let i = 0; i < values.length; i++) {
                    options.push({
                        label: values[i]['label'],
                        value: values[i]['value']
                    });
                }

                this.markupSelect.set('options', options);
            }



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

        _populateDropdown: function (results) {
            let feature = results.features[0].attributes;
            let presence = feature['presence'];

            let values = null
            let valueLabel = null
            if (presence === 'P') {
                values = [{ label: "Presence Expected", value: "X" },
                { label: "Historical", value: "H" },
                { label: "Remove", value: "R" }];
            }
            else if (presence === 'H') {
                values = [{ label: "Present", value: "P" }, { label: "Presence Expected", value: "X" }, { label: "Remove", value: "R" }];
            }
            else {
                values = [{ label: "Present", value: "P" }, { label: "Historical", value: "H" }, { label: "Remove", value: "R" }];
            }

            let options = [];
            for (let i = 0; i < values.length; i++) {
                options.push({
                    label: values[i]['label'],
                    value: values[i]['value']
                });
            }

            this.markupSelect.set('options', options);
        },

        _setDiv2: function (ecoshapeId) {
            this._queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "InPoly_FID = " + ecoshapeId,
                ["ParentEcoregion", "Ecozone", "TerrestrialArea", "EcoshapeName", "ecoshapeid"],
                this._setDiv2Results
            )
        },

        _setDiv2Results: function (results) {
            for (let i = 0; i < results.features.length; i++) {
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
