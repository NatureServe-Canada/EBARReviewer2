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

            on(dom.byId("SubmitOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW);

                let starRating = null;
                let radioButtons = document.getElementsByName("rating");
                for (var i = 0; i < radioButtons.length; i++) {
                    if (radioButtons[i].type === "radio" && radioButtons[i].checked == true) {
                        starRating = parseInt(radioButtons[i].value);
                    }
                }

                if (!starRating) {
                    alert("please provide a star rating");
                    return;
                }

                let graphicObj = new graphic();
                graphicObj.setAttributes({
                    objectid: this.dataModel.reviewObjectID,
                    reviewnotes: dom.byId("overallComment").value,
                    overallstarrating: starRating,
                    datecompleted: new Date().getTime()
                });

                reviewLayer.applyEdits(null, [graphicObj]).then(() => {
                    dom.byId("review_submitted").style.display = "block";
                    dom.byId("saveButton").disabled = true;
                    dom.byId("SaveOverallFeedbackButton").disabled = true;
                    dom.byId("SubmitOverallFeedbackButton").disabled = true;
                    dom.byId("deleteMarkup").disabled = true;
                });
            }));

            on(dom.byId("SaveOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW);

                let starRating = null;
                let radioButtons = document.getElementsByName("rating");
                for (var i = 0; i < radioButtons.length; i++) {
                    if (radioButtons[i].type === "radio" && radioButtons[i].checked == true) {
                        starRating = parseInt(radioButtons[i].value);
                    }
                }

                if (!starRating) {
                    alert("please provide a star rating");
                    return;
                }

                helper.queryLayer(
                    this.config.layers.REVIEW,
                    "reviewid=" + this.dataModel.reviewID,
                    ['objectid'],
                    null)
                    .then((results) => {
                        let objectID = results.features[0].attributes['objectid'];
                        let graphicObj = new graphic();
                        graphicObj.setAttributes({
                            objectid: objectID,
                            reviewnotes: dom.byId("overallComment").value,
                            overallstarrating: starRating
                        });

                        reviewLayer.applyEdits(null, [graphicObj]).then(() => {
                            console.log("Overall Comment posted");
                        });
                    });

            }));

            on(dom.byId("closeOverallFeedbackButton"), "click", function (e) {
                dom.byId("overallFeedbackDiv").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId("overallFeedbackButton"), "click", lang.hitch(this, function (e) {
                dom.byId("infoPanel").style.display = "none";
                helper.queryLayer(
                    this.config.layers.REVIEW,
                    "reviewid=" + this.dataModel.reviewID,
                    ['overallstarrating', 'reviewnotes'],
                    null)
                    .then((results) => {
                        if (results.features.length != 0) {
                            // results.features[0].attributes['overallstarrating']\
                            dom.byId("radio" + results.features[0].attributes['overallstarrating']).checked = true;
                            dom.byId("overallComment").value = results.features[0].attributes['reviewnotes'];
                        }
                    });

                dom.byId("overallFeedbackDiv").style.display = "block";
            }));

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
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
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

                helper.queryLayer(
                    this.config.layers.REVIEWED_ECOSHAPES,
                    "reviewid=" + this.dataModel.reviewID + " and ecoshapeid=" + ecoshapeID,
                    ['objectid'],
                    lang.hitch(this, function (results) {
                        if (Array.isArray(results.features) && results.features.length != 0) {
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
                    })
                );
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
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
                            );

                            dom.byId("infoPanel").style.display = "none";
                            helper.setEcoshapeInfo(this.selectedFeatures[0], this.speciesSelect.value, this);

                            dom.byId("removalReasonDiv").style.display = "none";
                            dom.byId("markupPanel").style.display = "block";

                            dom.byId("comment").value = "";
                            dom.byId("reference").value = "";

                            helper.setMarkupOptions(this.selectedFeatures[0], this.markupSelect, this)
                                .then(lang.hitch(this, () => {
                                    helper.queryLayer(
                                        this.config.layers.ECOSHAPE_REVIEW,
                                        "ecoshapeid=" + this.selectedFeatures[0].ecoshapeid + " and reviewid=" + this.dataModel.reviewID,
                                        ['objectid', 'reference', 'ecoshapereviewnotes', 'markup'],
                                        lang.hitch(this, function (results) {
                                            if (Array.isArray(results.features) && results.features.length != 0) {
                                                let attr = results.features[0].attributes;
                                                dom.byId("comment").value = attr['ecoshapereviewnotes'];
                                                dom.byId("reference").value = attr['reference'];
                                                // this.markupSelect.value = attr['markup'];
                                                // console.log(this.markupSelect.options)
                                                for (var i = 0; i < this.markupSelect.options.length; i++) {
                                                    // console.log(this.markupSelect.options[i].selected);
                                                    console.log(this.markupSelect.options[i].value)
                                                    if (this.markupSelect.options[i].value === attr['markup']) {
                                                        this.markupSelect.options[i].selected = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        })
                                    );
                                }))
                        }));
                    }));
                }
            }));
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
