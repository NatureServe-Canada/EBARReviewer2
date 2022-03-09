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
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin, lang,
    dom, on, FeatureLayer, graphic, Helper, DataModel) {
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

            // var helper = new Helper();

            helper.mapReviewEcoshapeIDs(this.config.layers.ECOSHAPES, this.dataModel.echoshapesDict);
            helper.mapReviewEcoshapeIDs(this.config.layers.REVIEWED_ECOSHAPES, this.dataModel.speciesRangeEcoshapesDict);

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId('saveButton'), "click", lang.hitch(this, function (e) {
                let ecochapeReviewLayer = new FeatureLayer(this.config.layers.ECOSHAPE_REVIEW);
                let ecoshapeID = this.dataModel.echoshapesDict[this.dataModel.ReviewerApp2_3112[0]];

                if (Array.isArray(this.dataModel.ReviewerApp2_9712) && this.dataModel.ReviewerApp2_9712.length != 0) {
                    helper.getObjectID(this.config.layers.ECOSHAPE_REVIEW, this.dataModel.reviewID, ecoshapeID)
                        .then((objectID) => {
                            let graphicObj = new graphic();
                            graphicObj.setAttributes({
                                objectid: objectID,
                                reviewid: this.dataModel.reviewID,
                                ecoshapeid: ecoshapeID,
                                ecoshapereviewnotes: dom.byId("comment").value,
                                Username: "pvkommareddi",
                                Markup: this.markupSelect.value
                            });
                            ecochapeReviewLayer.applyEdits(null, [graphicObj]).then(() => {
                                new helper.refreshMapLayer("ReviewerApp2 - Species Range Ecoshapes (generalized)")
                            });
                        });
                }
                else {
                    let graphicObj = new graphic();
                    graphicObj.setAttributes({
                        reviewid: this.dataModel.reviewID,
                        ecoshapeid: ecoshapeID,
                        ecoshapereviewnotes: dom.byId("comment").value,
                        Username: "pvkommareddi",
                        Markup: this.markupSelect.value
                    });

                    ecochapeReviewLayer.applyEdits([graphicObj]).then(() => {
                        helper.refreshMapLayer("ReviewerApp2 - Species Range Ecoshapes (generalized)")
                    });
                }
            }));

            // this.fetchDataByName('Select');
        },

        onReceiveData: function (name, widgetId, data, historyData) {
            //filter out messages
            if (name !== 'Select') {
                return;
            }
            this.dataModel.ReviewerApp2_9712 = data.selectionInfo.ReviewerApp2_9712;
            this.dataModel.ReviewerApp2_3112 = data.selectionInfo.ReviewerApp2_3112;
            this.dataModel.ReviewerApp2_2465 = data.selectionInfo.ReviewerApp2_2465;

            let infoPanel = dom.byId("infoPanel");
            infoPanel.style.display = "none";

            new Helper().setEcoshapeInfo(data.selectionInfo.ReviewerApp2_3112[0], this.speciesSelect.value);

            let markupPanel = dom.byId("markupPanel");
            markupPanel.style.display = "block";

            new Helper().setMarkupOptions(data, this.markupSelect);
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

            new Helper().setUserTaxaSpecies(credential.userId, this);

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
