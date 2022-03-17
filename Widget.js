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
    'dojo/dom',
    'dojo/on',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    './Helper',
    './DataModel',
    'jimu/LayerStructure',
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin, lang,
    dom, on, FeatureLayer, graphic, Helper, DataModel, LayerStructure) {
    //To create a widget, you need to derive from BaseWidget.
    var helper = new Helper();
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

            helper.mapReviewEcoshapeIDs(this.config.layers.ECOSHAPES.URL, this.dataModel.echoshapesDict);
            helper.mapReviewEcoshapeIDs(this.config.layers.REVIEWED_ECOSHAPES, this.dataModel.speciesRangeEcoshapesDict);

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId('deleteMarkup'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW);
                let ecoshapeID = this.selectedFeatures[0].ecoshapeid;

                helper.queryLayer(
                    this.config.layers.REVIEWED_ECOSHAPES,
                    "reviewid=" + this.dataModel.reviewID + " and ecoshapeid=" + ecoshapeID,
                    ['objectid'],
                    lang.hitch(this, function (results) {
                        if (Array.isArray(results.features) && results.features.length != 0) {
                            helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW, this.dataModel.reviewID, ecoshapeID)
                                .then((objectID) => {
                                    let graphicObj = new graphic();
                                    graphicObj.setAttributes({
                                        objectid: objectID
                                    });

                                    ecochapeReviewLayer.applyEdits(null, null, [graphicObj]).then(() => {
                                        new helper.refreshMapLayer("ReviewerApp2 - Reviewed Ecoshapes (generalized)")
                                    });
                                });
                        }
                    })
                );
                return;
                if (Array.isArray(this.dataModel.ReviewerApp2_9712) && this.dataModel.ReviewerApp2_9712.length != 0) {
                    helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW, this.dataModel.reviewID, ecoshapeID)
                        .then((objectID) => {
                            let graphicObj = new graphic();
                            graphicObj.setAttributes({
                                objectid: objectID
                            });

                            ecochapeReviewLayer.applyEdits(null, null, [graphicObj]).then(() => {
                                new helper.refreshMapLayer("ReviewerApp2 - Reviewed Ecoshapes (generalized)")
                            });
                        });
                }
            }));

            on(dom.byId('saveButton'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW);
                let ecoshapeID = this.selectedFeatures[0].ecoshapeid;

                let attributes = {
                    reviewid: this.dataModel.reviewID,
                    ecoshapeid: ecoshapeID,
                    ecoshapereviewnotes: dom.byId("comment").value,
                    username: this.userCredentials.userId,
                    markup: this.markupSelect.value
                };
                if (dom.byId("reference").value) {
                    attributes.reference = dom.byId("reference").value;
                }
                if (this.markupSelect.value === 'R' && this.removalReason.value) {
                    attributes.removalreason = this.removalReason.value;
                }

                if (Array.isArray(this.dataModel.ReviewerApp2_9712) && this.dataModel.ReviewerApp2_9712.length != 0) {
                    helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW, this.dataModel.reviewID, ecoshapeID)
                        .then((objectID) => {
                            attributes.objectid = objectID;
                            let graphicObj = new graphic();
                            graphicObj.setAttributes(attributes);

                            ecochapeReviewLayer.applyEdits(null, [graphicObj]).then(() => {
                                helper.refreshMapLayer("ReviewerApp2 - Reviewed Ecoshapes (generalized)");
                            });
                        });
                }
                else {
                    let graphicObj = new graphic();
                    graphicObj.setAttributes(attributes);

                    ecochapeReviewLayer.applyEdits([graphicObj]).then(() => {
                        helper.refreshMapLayer("ReviewerApp2 - Reviewed Ecoshapes (generalized)");
                    });
                }
            }));

            let layerStructure = LayerStructure.getInstance();
            layerStructure.traversal(lang.hitch(this, function (layerNode) {
                // console.log(layerNode.title);
                if (layerNode.title === "ReviewerApp2 - Ecoshapes (generalized)") {
                    layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                        layer.on("selection-complete", lang.hitch(this, function (val) {
                            // console.log(val);
                            if (val.method === FeatureLayer.SELECTION_NEW) {
                                this.selectedFeatures = [val.features[0].attributes];
                            }
                            else if (val.method === FeatureLayer.SELECTION_ADD) {
                                if (this.selectedFeatures) {
                                    let isPresent = false;
                                    for (let i = 0; i < this.selectedFeatures.length; i++) {
                                        if (this.selectedFeatures[i].objectid === val.features[0].attributes.objectid)
                                            isPresent = true;
                                    }
                                    if (!isPresent)
                                        this.selectedFeatures.push(val.features[0].attributes);
                                }
                                else
                                    this.selectedFeatures = [val.features[0].attributes];
                            }
                            else if (val.method === FeatureLayer.SELECTION_SUBTRACT) {
                                if (this.selectedFeatures) {
                                    for (let i = 0; i < this.selectedFeatures.length; i++) {
                                        if (this.selectedFeatures[i].objectid === val.features[0].attributes.objectid)
                                            this.selectedFeatures.splice(i, 1);
                                    }
                                }
                            }
                            // console.log(this.selectedFeatures);
                            // console.log(this)

                            dom.byId("deleteMarkupSpan").style.display = "none";
                            helper.queryLayer(
                                this.config.layers.REVIEWED_ECOSHAPES,
                                "ecoshapeid=" + this.selectedFeatures[0].ecoshapeid + " and reviewid=" + this.dataModel.reviewID,
                                ['objectid'],
                                function (results) {
                                    if (Array.isArray(results.features) && results.features.length != 0) {
                                        dom.byId("deleteMarkupSpan").style.display = "inline-block";
                                    }
                                }
                            )


                            dom.byId("infoPanel").style.display = "none";
                            helper.setEcoshapeInfo(this.selectedFeatures[0].ecoshapeid, this.speciesSelect.value);

                            dom.byId("removalReasonDiv").style.display = "none";
                            dom.byId("markupPanel").style.display = "block";

                            helper.setMarkupOptions(this.selectedFeatures[0], this.markupSelect, this);
                        }));
                    }));
                }
            }));

            // this.fetchDataByName('Select');
        },

        onReceiveData: function (name, widgetId, data, historyData) {
            //filter out messages
            return;
            if (name !== 'Select') {
                return;
            }
            this.dataModel.ReviewerApp2_9712 = data.selectionInfo.ReviewerApp2_9712;
            this.dataModel.ReviewerApp2_3112 = data.selectionInfo.ReviewerApp2_3112;
            this.dataModel.ReviewerApp2_2465 = data.selectionInfo.ReviewerApp2_2465;

            dom.byId("deleteMarkupSpan").style.display = "none";
            if (Array.isArray(this.dataModel.ReviewerApp2_9712) && this.dataModel.ReviewerApp2_9712.length != 0) {
                dom.byId("deleteMarkupSpan").style.display = "inline-block";
            }

            dom.byId("infoPanel").style.display = "none";

            helper.setEcoshapeInfo(data.selectionInfo.ReviewerApp2_3112[0], this.speciesSelect.value);

            dom.byId("removalReasonDiv").style.display = "none";
            dom.byId("markupPanel").style.display = "block";

            helper.setMarkupOptions(data, this.markupSelect);
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

            helper.setUserTaxaSpecies(credential.userId, this);

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
