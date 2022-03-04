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
    'dojo/dom',
    'dojo/on',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    './Helper',
    './DataModel',
    'dojo/domReady!'
], function (declare, BaseWidget, _WidgetsInTemplateMixin,
    dom, on, FeatureLayer, graphic, Helper, DataModel) {
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

            new Helper().mapReviewEcoshapeIDs(this.config.layers.ECOSHAPES, this.dataModel.echoshapesDict);
            new Helper().mapReviewEcoshapeIDs(this.config.layers.REVIEWED_ECOSHAPES, this.dataModel.speciesRangeEcoshapesDict);

            on(dom.byId('backButton'), "click", function (e) {
                dom.byId("markupPanel").style.display = "none";
                dom.byId("infoPanel").style.display = "block";
            });

            on(dom.byId('saveButton'), "click", function (e) {

            });

            // this.fetchDataByName('Select');
        },

        onReceiveData: function (name, widgetId, data, historyData) {
            //filter out messages
            if (name !== 'Select') {
                return;
            }

            let infoPanel = dom.byId("infoPanel");
            infoPanel.style.display = "none";

            new Helper().setEcoshapeInfo(data.selectionInfo.ReviewerApp2_3112[0], this.speciesSelect.value);

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
