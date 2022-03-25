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

    var helper = new Helper();
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-reviewerwidget',

        startup: function () {
            this.inherited(arguments);

            this.dataModel = new DataModel();

            on(dom.byId("SubmitOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW.URL);

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
                    dom.byId("overallFeedbackDiv").style.display = "none";
                    dom.byId("infoPanel").style.display = "block";
                    dom.byId("review_submitted").style.display = "block";
                    dom.byId("saveButton").disabled = true;
                    dom.byId("SaveOverallFeedbackButton").disabled = true;
                    dom.byId("SubmitOverallFeedbackButton").disabled = true;
                    dom.byId("deleteMarkup").disabled = true;
                });
            }));

            on(dom.byId("SaveOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW.URL);

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
                    this.config.layers.REVIEW.URL,
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
                            dom.byId("overallFeedbackDiv").style.display = "none";
                            dom.byId("infoPanel").style.display = "block";
                        });
                    });
            }));

            on(dom.byId("closeOverallFeedbackButton"), "click", function (e) {
                dom.byId("overallFeedbackDiv").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId("overallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let elements = document.getElementsByName('rating');
                for (i = 0; i < elements.length; i++) {
                    if (elements[i].checked) elements[i].checked = false;
                }
                dom.byId("overallComment").value = "";

                dom.byId("infoPanel").style.display = "none";
                helper.queryLayer(
                    this.config.layers.REVIEW.URL,
                    "reviewid=" + this.dataModel.reviewID,
                    ['overallstarrating', 'reviewnotes'],
                    null)
                    .then((results) => {
                        if (results.features.length != 0) {
                            if (results.features[0].attributes['overallstarrating'] != null && results.features[0].attributes['reviewnotes'] != null) {
                                dom.byId("radio" + results.features[0].attributes['overallstarrating']).checked = true;
                                dom.byId("overallComment").value = results.features[0].attributes['reviewnotes'];
                            }
                        }
                    });

                dom.byId("overallFeedbackDiv").style.display = "block";
            }));

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId('deleteMarkup'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW.URL);
                let ecoshapeID = this.selectedFeatures[0].ecoshapeid;

                helper.queryLayer(
                    this.config.layers.REVIEWED_ECOSHAPES.URL,
                    "reviewid=" + this.dataModel.reviewID + " and ecoshapeid=" + ecoshapeID,
                    ['objectid'],
                    lang.hitch(this, function (results) {
                        if (Array.isArray(results.features) && results.features.length != 0) {
                            helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW.URL, this.dataModel.reviewID, ecoshapeID)
                                .then((objectID) => {
                                    let graphicObj = new graphic();
                                    graphicObj.setAttributes({
                                        objectid: objectID
                                    });

                                    ecochapeReviewLayer.applyEdits(null, null, [graphicObj]).then(() => {
                                        new helper.refreshMapLayer(this.config.layers.REVIEWED_ECOSHAPES.title)
                                    });
                                });
                        }
                    })
                );
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            }));

            on(dom.byId('saveButton'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW.URL);
                let ecoshapeID = this.selectedFeatures[0].ecoshapeid;

                let attributes = {
                    reviewid: this.dataModel.reviewID,
                    ecoshapeid: ecoshapeID,
                    ecoshapereviewnotes: dom.byId("comment").value,
                    username: this.userCredentials.userId,
                    markup: dom.byId("markupSelect").value
                };
                if (!dom.byId("markupSelect").value) {
                    alert("Please provide markup");
                    return;
                }
                if (!dom.byId("comment").value) {
                    alert("Please provide markup comments");
                    return;
                }
                if (dom.byId("reference").value) {
                    attributes.reference = dom.byId("reference").value;
                }
                let removalReason = dom.byId("removalReason");
                if (dom.byId("markupSelect").value === 'R') {
                    if (removalReason.value)
                        attributes.removalreason = removalReason.value;
                    else {
                        alert("Please provide removal reason");
                        return;
                    }
                }

                helper.queryLayer(
                    this.config.layers.REVIEWED_ECOSHAPES.URL,
                    "reviewid=" + this.dataModel.reviewID + " and ecoshapeid=" + ecoshapeID,
                    ['objectid'],
                    lang.hitch(this, function (results) {
                        if (Array.isArray(results.features) && results.features.length != 0) {
                            helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW.URL, this.dataModel.reviewID, ecoshapeID)
                                .then((objectID) => {
                                    attributes.objectid = objectID;
                                    let graphicObj = new graphic();
                                    graphicObj.setAttributes(attributes);

                                    ecochapeReviewLayer.applyEdits(null, [graphicObj]).then(() => {
                                        helper.refreshMapLayer(this.config.layers.REVIEWED_ECOSHAPES.title);
                                    });
                                });
                        }
                        else {
                            let graphicObj = new graphic();
                            graphicObj.setAttributes(attributes);

                            ecochapeReviewLayer.applyEdits([graphicObj]).then(() => {
                                helper.refreshMapLayer(this.config.layers.REVIEWED_ECOSHAPES.title);
                            });
                        }
                    })
                );
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            }));

            let layerStructure = LayerStructure.getInstance();
            layerStructure.traversal(lang.hitch(this, function (layerNode) {

                if (layerNode.title === this.config.layers.ECOSHAPES.title) {
                    layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                        layer.on("selection-complete", lang.hitch(this, function (val) {
                            if (val.method === FeatureLayer.SELECTION_NEW) {
                                this.selectedFeatures = [];
                                for (let i = 0; i < val.features.length; i++) {
                                    this.selectedFeatures.push(val.features[i].attributes)
                                }
                            }
                            else if (val.method === FeatureLayer.SELECTION_ADD) {
                                if (this.selectedFeatures) {
                                    for (let i = 0; i < val.features.length; i++) {
                                        let isPresent = false;
                                        for (let j = 0; j < this.selectedFeatures.length; j++) {
                                            if (this.selectedFeatures[j].objectid === val.features[i].attributes.objectid)
                                                isPresent = true;
                                        }
                                        if (!isPresent)
                                            this.selectedFeatures.push(val.features[i].attributes);
                                    }
                                }
                                else {
                                    this.selectedFeatures = [];
                                    for (let i = 0; i < val.features.length; i++) {
                                        this.selectedFeatures.push(val.features[i].attributes)
                                    }
                                }
                            }
                            else if (val.method === FeatureLayer.SELECTION_SUBTRACT) {
                                if (this.selectedFeatures) {
                                    for (let j = 0; j < val.features.length; j++) {
                                        for (let i = 0; i < this.selectedFeatures.length; i++) {
                                            if (this.selectedFeatures[i].objectid === val.features[j].attributes.objectid)
                                                this.selectedFeatures.splice(i, 1);
                                        }
                                    }
                                }
                            }

                            if (!this.selectedFeatures) return;

                            dom.byId("deleteMarkupSpan").style.display = "none";
                            helper.queryLayer(
                                this.config.layers.REVIEWED_ECOSHAPES.URL,
                                "ecoshapeid=" + this.selectedFeatures[0].ecoshapeid + " and reviewid=" + this.dataModel.reviewID,
                                ['objectid'],
                                function (results) {
                                    if (Array.isArray(results.features) && results.features.length != 0) {
                                        dom.byId("deleteMarkupSpan").style.display = "inline-block";
                                    }
                                }
                            );

                            dom.byId("infoPanel").style.display = "none";
                            helper.setEcoshapeInfo(this.config.layers.SPECIES_RANGE_ECOSHAPES, this.selectedFeatures[0], dom.byId('speciesSelect').value, this);

                            dom.byId("removalReasonDiv").style.display = "none";
                            dom.byId("removalReasonBr").style.display = "none";
                            dom.byId("markupPanel").style.display = "block";

                            dom.byId("comment").value = "";
                            dom.byId("reference").value = "";

                            helper.setMarkupOptions(this.config.layers.SPECIES_RANGE_ECOSHAPES, this.selectedFeatures[0], this)
                                .then(lang.hitch(this, () => {
                                    let selectElem = document.getElementById('markupSelect');
                                    helper.queryLayer(
                                        this.config.layers.ECOSHAPE_REVIEW.URL,
                                        "ecoshapeid=" + this.selectedFeatures[0].ecoshapeid + " and reviewid=" + this.dataModel.reviewID,
                                        ['objectid', 'reference', 'ecoshapereviewnotes', 'markup', 'removalreason'],
                                        lang.hitch(this, function (results) {
                                            if (Array.isArray(results.features) && results.features.length != 0) {
                                                let attr = results.features[0].attributes;
                                                dom.byId("comment").value = attr['ecoshapereviewnotes'];
                                                dom.byId("reference").value = attr['reference'];

                                                selectElem.value = attr['markup'];
                                                if (attr['markup'] == 'R') {
                                                    dom.byId("removalReason").value = attr['removalreason'];
                                                    dom.byId("removalReasonDiv").style.display = "block";
                                                    dom.byId("removalReasonBr").style.display = "block";
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

        onSignIn: function (credential) {
            helper.setUserTaxaSpecies(credential.userId, this);
            this.userCredentials = credential;
        },
    });
});
