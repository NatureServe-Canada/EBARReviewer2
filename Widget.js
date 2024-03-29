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
    'esri/tasks/query',
    'dojo/promise/all',
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin, lang,
    dom, on, FeatureLayer, graphic, Helper, DataModel, LayerStructure, Query, all) {

    var helper = new Helper();
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-reviewerwidget',

        startup: function () {
            this.inherited(arguments);

            this.dataModel = new DataModel();

            on(dom.byId("markupSelect"), "change", lang.hitch(this, function () {
                let removalReasonDiv = dom.byId("removalReasonDiv");
                // if (dom.byId("markupSelect").value === 'R') {
                //     removalReasonDiv.style.display = "block";
                //     dom.byId("usage_type_select").value = "";
                //     dom.byId("usage_type_select").disabled = true;
                // }
                if (dom.byId("markupSelect").value === 'R') {
                    removalReasonDiv.style.display = "block";
                    dom.byId("usage_type_select").value = "";
                    dom.byId("usage_type_select").disabled = true;
                }
                else if (dom.byId("markupSelect").value === '' && this.speciesRangeEcoshapes.length === 0) {
                    dom.byId("usage_type_select").value = "";
                    dom.byId("usage_type_select").disabled = true;
                }
                else {
                    removalReasonDiv.style.display = "none";
                    dom.byId("usage_type_select").disabled = false;
                }
            }));

            on(dom.byId("SubmitOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                if (!confirm("After submit, additional markup and feedback for this range map will not be allowed. Do you want to continue?")) return;
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW.URL);

                let radioButtons = document.getElementsByName("rating");
                for (var i = 0; i < radioButtons.length; i++) {
                    if (radioButtons[i].type === "radio" && radioButtons[i].checked == true) {
                        this.dataModel.overallReviewRating = parseInt(radioButtons[i].value);
                    }
                }

                if (!this.dataModel.overallReviewRating) {
                    alert("please provide a star rating");
                    return;
                }

                this.dataModel.overallReviewComment = dom.byId("overallComment").value;

                let graphicObj = new graphic();
                graphicObj.setAttributes({
                    objectid: this.dataModel.overallReviewObjectID,
                    reviewnotes: dom.byId("overallComment").value,
                    overallstarrating: this.dataModel.overallReviewRating,
                    datecompleted: new Date().getTime()
                });

                reviewLayer.applyEdits(null, [graphicObj]).then(() => {
                    dom.byId("overallFeedbackDiv").style.display = "none";
                    dom.byId("infoPanel").style.display = "block";
                    dom.byId("markup_warnings").style.display = "none";
                    const collection = document.getElementsByClassName("review_submitted");
                    for (let i = 0; i < collection.length; i++) {
                        collection[i].style.display = "block";
                    }
                    dom.byId("saveButton").disabled = true;
                    dom.byId("SaveOverallFeedbackButton").disabled = true;
                    dom.byId("SubmitOverallFeedbackButton").disabled = true;
                    dom.byId("deleteMarkup").disabled = true;
                }, (err) => {
                    console.log(err);
                    alert('Error submitting overall feedback. Please contact the support team.');
                });
            }));

            on(dom.byId("SaveOverallFeedbackButton"), "click", lang.hitch(this, function (e) {
                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW.URL);

                let radioButtons = document.getElementsByName("rating");
                for (var i = 0; i < radioButtons.length; i++) {
                    if (radioButtons[i].type === "radio" && radioButtons[i].checked == true) {
                        this.dataModel.overallReviewRating = parseInt(radioButtons[i].value);
                    }
                }

                if (!this.dataModel.overallReviewRating) {
                    alert("please provide a star rating");
                    return;
                }

                this.dataModel.overallReviewComment = dom.byId("overallComment").value;

                if (this.dataModel.overallReviewObjectID) {
                    let graphicObj = new graphic();
                    graphicObj.setAttributes({
                        objectid: this.dataModel.overallReviewObjectID,
                        reviewnotes: dom.byId("overallComment").value,
                        overallstarrating: this.dataModel.overallReviewRating
                    });

                    reviewLayer.applyEdits(null, [graphicObj]).then(() => {
                        console.log("Overall Feedback Comment posted");
                        dom.byId("overallFeedbackDiv").style.display = "none";
                        dom.byId("infoPanel").style.display = "block";
                    }, (err) => {
                        console.log(err);
                        alert('Error saving overall feedback. Please contact the support team.');
                    });
                }
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

                if (this.dataModel.overallReviewRating) {
                    dom.byId("rating-" + this.dataModel.overallReviewRating).checked = true;
                    if (this.dataModel.overallReviewComment)
                        dom.byId("overallComment").value = this.dataModel.overallReviewComment;
                }

                dom.byId("overallFeedbackDiv").style.display = "block";
            }));

            on(dom.byId('backButton'), "click", lang.hitch(this, function (e) {
                helper.clearSelectionByLayer(this.config.layers.ECOSHAPES.title);
            }));

            on(dom.byId('deleteMarkup'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW.URL);
                if (this.reviewedEcoshapes.length == 0) return;

                let ecoshapeIDs = [];
                this.reviewedEcoshapes.forEach(x => ecoshapeIDs.push(x.ecoshapeid));

                var query = new Query();
                query.outFields = ["objectid"];
                query.where = "reviewid=" + this.dataModel.reviewID + " and ecoshapeid in (" + ecoshapeIDs + ")";
                ecochapeReviewLayer.queryFeatures(query)
                    .then((results) => {
                        let objectIDs = []
                        if (Array.isArray(results.features) && results.features.length != 0) {
                            results.features.forEach(x => objectIDs.push(x.attributes['objectid']));
                        }
                        return objectIDs;
                    })
                    .then((objectIDs) => {
                        if (objectIDs.length != 0) {
                            let graphicObjs = [];
                            objectIDs.forEach(x => graphicObjs.push(new graphic().setAttributes({ objectid: x })));

                            ecochapeReviewLayer.applyEdits(null, null, graphicObjs).then(() => {
                                helper.refreshMapLayer(this.config.layers.REVIEWED_ECOSHAPES.title);
                                helper.refreshMapLayer(this.config.layers.USAGE_TYPE_MARKUP.title);
                            });
                        }
                    }, (err) => {
                        console.log(err);
                        alert('Error deleting markup. Please contact the support team.');
                    });

                helper.clearSelectionByLayer(this.config.layers.ECOSHAPES.title);
            }));

            on(dom.byId('saveButton'), "click", lang.hitch(this, function (e) {
                if (this.speciesRangeEcoshapes.length != 0) {
                    if (!dom.byId("markupSelect").value && !dom.byId("usage_type_select").value) {
                        alert("Please provide Presence or Usage Type markup");
                        return;
                    }
                }
                else {
                    if (!dom.byId("markupSelect").value) {
                        alert("Please provide Presence markup");
                        return;
                    }

                }

                if (!dom.byId("comment").value) {
                    alert("Please provide markup comment");
                    return;
                }

                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW.URL);

                let attributes = {
                    reviewid: this.dataModel.reviewID,
                    ecoshapereviewnotes: dom.byId("comment").value,
                    username: this.userCredentials.userId,
                    removalreason: null,
                    reference: dom.byId("reference").value
                };

                if (dom.byId("markupSelect").value) attributes.markup = dom.byId("markupSelect").value;
                else attributes.markup = null;
                if (dom.byId("usage_type_select").value) attributes.usagetypemarkup = dom.byId("usage_type_select").value;
                else attributes.usagetypemarkup = null;

                let removalReason = dom.byId("removalReason");
                if (dom.byId("markupSelect").value === 'R') {
                    if (removalReason.value)
                        attributes.removalreason = removalReason.value;
                    else {
                        alert("Please provide removal reason");
                        return;
                    }
                }

                let ecoshapeIDs = [], reviewedEcoshapeIDs = [], rangeMapEcoshapeIDs = [], usageTypeEcoshapeIDs = [];
                this.selectedFeatures.forEach(x => ecoshapeIDs.push(x.ecoshapeid));
                this.reviewedEcoshapes.forEach(x => reviewedEcoshapeIDs.push(x.ecoshapeid));
                this.speciesRangeEcoshapes.forEach(x => rangeMapEcoshapeIDs.push(x.ecoshapeid));
                this.usageType.forEach(x => usageTypeEcoshapeIDs.push(x.ecoshapeid));

                let editResponses = [];
                if (this.reviewedEcoshapes.length != 0) {
                    let graphicObjs = [];
                    for (let i = 0; i < this.reviewedEcoshapes.length; i++) {
                        let temp = JSON.parse(JSON.stringify(attributes));

                        if (temp.markup === 'R' &&
                            rangeMapEcoshapeIDs.indexOf(this.reviewedEcoshapes[i].ecoshapeid) < 0)
                            continue;

                        // if (temp.markup === this.reviewedEcoshapes[i].markup) {
                        //     if (temp.usagetypemarkup) temp.markup = null;
                        //     else continue;
                        // }

                        let flag = false;
                        for (let j = 0; j < this.speciesRangeEcoshapes.length; j++) {
                            if (this.reviewedEcoshapes[i].ecoshapeid === this.speciesRangeEcoshapes[j].ecoshapeid &&
                                temp.markup === this.speciesRangeEcoshapes[j].presence) {
                                flag = true;
                                break;
                            }
                        }
                        if (flag) {
                            if (temp.usagetypemarkup) temp.markup = null;
                            else continue;
                        }

                        if ((temp.usagetypemarkup === 'N') &&
                            usageTypeEcoshapeIDs.indexOf(this.reviewedEcoshapes[i].ecoshapeid) < 0) {
                            if (!temp.markup) continue;
                            else temp.usagetypemarkup = null;
                        }

                        // if (temp.usagetypemarkup === this.reviewedEcoshapes[i].usagetypemarkup) {
                        //     if (temp.markup) temp.usagetypemarkup = null;
                        //     else continue;
                        // }

                        flag = false;
                        for (let j = 0; j < this.usageType.length; j++) {
                            if (this.reviewedEcoshapes[i].ecoshapeid === this.usageType[j].ecoshapeid &&
                                temp.usagetypemarkup === this.usageType[j].usagetype) {
                                flag = true;
                                break;
                            }
                        }
                        if (flag) {
                            if (temp.markup) temp.usagetypemarkup = null;
                            else continue;
                        }

                        if (!temp.markup) {
                            temp.markup = null;
                            if (!rangeMapEcoshapeIDs.includes(this.reviewedEcoshapes[i].ecoshapeid))
                                temp.usagetypemarkup = null;
                        }
                        if ((temp.markup == 'R') || (temp.markup != 'R' && temp.usagetypemarkup == '')) temp.usagetypemarkup = null;
                        temp.objectid = this.reviewedEcoshapes[i].objectid;
                        graphicObjs.push(new graphic().setAttributes(temp));
                    }
                    editResponses.push(ecochapeReviewLayer.applyEdits(null, graphicObjs));
                }

                let insertecoshapeIDs = ecoshapeIDs.filter(x => !reviewedEcoshapeIDs.includes(x));
                if (insertecoshapeIDs.length != 0) {
                    let graphicObjs = [];
                    for (let i = 0; i < insertecoshapeIDs.length; i++) {
                        let temp = JSON.parse(JSON.stringify(attributes));

                        if ((temp.markup === 'R' || !temp.markup) &&
                            rangeMapEcoshapeIDs.indexOf(insertecoshapeIDs[i]) < 0)
                            continue;

                        let flag = false;
                        for (let j = 0; j < this.speciesRangeEcoshapes.length; j++) {
                            if (insertecoshapeIDs[i] === this.speciesRangeEcoshapes[j].ecoshapeid &&
                                temp.markup === this.speciesRangeEcoshapes[j].presence) {
                                flag = true;
                                break;
                            }
                        }
                        if (flag) {
                            if (temp.usagetypemarkup) temp.markup = null;
                            else continue;
                        }

                        if ((temp.usagetypemarkup === 'N') &&
                            usageTypeEcoshapeIDs.indexOf(insertecoshapeIDs[i]) < 0) {
                            if (!temp.markup) continue;
                            else temp.usagetypemarkup = null;
                        }

                        flag = false;
                        for (let j = 0; j < this.usageType.length; j++) {
                            if (insertecoshapeIDs[i] === this.usageType[j].ecoshapeid &&
                                temp.usagetypemarkup === this.usageType[j].usagetype) {
                                flag = true;
                                break;
                            }
                        }
                        if (flag) {
                            if (temp.markup) temp.usagetypemarkup = null;
                            else continue;
                        }

                        temp.ecoshapeid = insertecoshapeIDs[i];
                        graphicObjs.push(new graphic().setAttributes(temp));
                    }
                    editResponses.push(ecochapeReviewLayer.applyEdits(graphicObjs));
                }

                all(editResponses).then(lang.hitch(this, function (results) {
                    helper.refreshMapLayer(this.config.layers.REVIEWED_ECOSHAPES.title);
                    helper.refreshMapLayer(this.config.layers.USAGE_TYPE_MARKUP.title);
                    helper.clearSelectionByLayer(this.config.layers.ECOSHAPES.title);
                }), (err) => {
                    console.log(err);
                    alert('Error saving markup. Please contact the support team.');
                });

            }));

            let layerStructure = LayerStructure.getInstance();
            layerStructure.traversal(lang.hitch(this, function (layerNode) {
                if (layerNode.title === this.config.layers.ECOSHAPES.title) {
                    layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                        layer.on("selection-complete", lang.hitch(this, function (val) {
                            if (!dom.byId("speciesSelect").value || dom.byId("speciesSelect").value === "") {
                                layer.clearSelection();
                                return;
                            }
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

                            if (!this.selectedFeatures || this.selectedFeatures.length == 0) return;

                            let ecoshapeIDs = [];
                            this.selectedFeatures.forEach(x => ecoshapeIDs.push(x.ecoshapeid));

                            all({
                                reviewedEcoshapes: helper.fetchReviewedEcoshapes(
                                    this.config.layers.ECOSHAPE_REVIEW.URL,
                                    "ecoshapeid in (" + ecoshapeIDs.toString() + ") and reviewid=" + this.dataModel.reviewID
                                ),
                                speciesRangeEcoshapes: helper.fetchReviewedEcoshapes(
                                    this.config.layers.SPECIES_RANGE_ECOSHAPES.URL,
                                    "ecoshapeid in (" + ecoshapeIDs.toString() + ") and rangemapid=" + this.dataModel.rangeMapID
                                ),
                                usageType: helper.fetchReviewedEcoshapes(
                                    this.config.layers.USAGE_TYPE.URL,
                                    "ecoshapeid in (" + ecoshapeIDs.toString() + ") and rangemapid=" + this.dataModel.rangeMapID
                                ),
                            }).then(lang.hitch(this, function (results) {
                                this.reviewedEcoshapes = results.reviewedEcoshapes;
                                this.speciesRangeEcoshapes = results.speciesRangeEcoshapes;
                                this.usageType = results.usageType.filter(x => x.usagetype);

                                dom.byId("deleteMarkupSpan").style.display = "none";
                                if (this.reviewedEcoshapes.length != 0) {
                                    dom.byId("deleteMarkupSpan").style.display = "inline-block";
                                }

                                dom.byId("infoPanel").style.display = "none";
                                dom.byId("overallFeedbackDiv").style.display = "none";
                                dom.byId("markup_info_pane").style.display = "none";
                                dom.byId("no_info_pane").style.display = "none";

                                dom.byId("markupSelect").value = "";
                                dom.byId("usage_type_select").value = "";
                                dom.byId("comment").value = "";
                                dom.byId("reference").value = "";

                                dom.byId("removalReasonDiv").style.display = "none";
                                dom.byId("removalReason").value = "";

                                if (this.selectedFeatures.length == 1) {
                                    dom.byId("markup_info_pane").style.display = "block";
                                    helper.setEcoshapeInfo(
                                        this.selectedFeatures[0],
                                        this.speciesRangeEcoshapes,
                                        this.usageType,
                                    );
                                }
                                else {
                                    dom.byId("no_info_pane").style.display = "block";
                                }

                                helper.setMarkupOptions(
                                    this.selectedFeatures,
                                    this.speciesRangeEcoshapes,
                                    this.reviewedEcoshapes,
                                    this.usageType,
                                    this.dataModel.differentiateusagetype,
                                    this.nls
                                );

                                dom.byId("markupPanel").style.display = "block";
                            }));
                        }));

                        layer.on("selection-clear", lang.hitch(this, function (val) {
                            dom.byId("markupPanel").style.display = "none";
                            dom.byId("overallFeedbackDiv").style.display = "none";
                            dom.byId("infoPanel").style.display = "block";
                        }));
                    }));
                }
            }));
        },

        onOpen: function () {
            var panel = this.getPanel();
            panel.position.width = 325;
            // panel.position.height = 300;
            panel._originalBox = {
                w: panel.position.width,
                h: panel.position.height,
                l: panel.position.left || 0,
                t: panel.position.top || 0
            };
            panel.setPosition(panel.position);
            panel.panelManager.normalizePanel(panel);
        },

        onSignIn: function (credential) {
            helper.setUserTaxaSpecies(credential.userId, this);
            this.userCredentials = credential;
        },
    });
});
