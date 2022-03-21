define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/dom',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'jimu/LayerStructure',
], function (lang, declare, dom, Query, QueryTask, LayerStructure) {
    return declare(null, {
        queryLayer: function (url, where, outFields, method) {
            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = where;
            queryParams.outFields = outFields;
            var queryTask = new QueryTask(url);
            return queryTask.execute(queryParams, method, lang.hitch(this, this._onSearchError));
        },
        setMarkupOptions: function (data, markupList, parentObj) {
            this.queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/10",
                "ecoshapeid=" + data.ecoshapeid + " and rangemapid=" + parentObj.dataModel.rangeMapID,
                ['presence'],
                function (results) {
                    if (Array.isArray(results.features) && results.features.length != 0) {
                        let presence = results.features[0].attributes['presence'];

                        let values = null
                        if (presence === 'P') {
                            values = [
                                { label: "Presence Expected", value: "X" },
                                { label: "Historical", value: "H" },
                                { label: "Remove", value: "R" }
                            ];
                        }
                        else if (presence === 'H') {
                            values = [
                                { label: "Present", value: "P" },
                                { label: "Presence Expected", value: "X" },
                                { label: "Remove", value: "R" }
                            ];
                        }
                        else {
                            values = [
                                { label: "Present", value: "P" },
                                { label: "Historical", value: "H" },
                                { label: "Remove", value: "R" }
                            ];
                        }

                        let options = [];
                        for (let i = 0; i < values.length; i++) {
                            options.push({
                                label: values[i]['label'],
                                value: values[i]['value']
                            });
                        }

                        markupList.set('options', options);
                    }
                    else {
                        let values = [{ label: "Present", value: "P" }, { label: "Presence Expected", value: "X" }, { label: "Historical", value: "H" }];
                        let options = [];
                        for (let i = 0; i < values.length; i++) {
                            options.push({
                                label: values[i]['label'],
                                value: values[i]['value']
                            });
                        }

                        markupList.set('options', options);
                    }
                    markupList.on('change', lang.hitch(this, function (val) {
                        let removalReasonDiv = dom.byId("removalReasonDiv");
                        if (val === 'R') {
                            removalReasonDiv.style.display = "block";
                        }
                        else {
                            removalReasonDiv.style.display = "none";
                        }
                    }));
                }
            )
            return;
            if (Array.isArray(data.selectionInfo.ReviewerApp2_2465) && data.selectionInfo.ReviewerApp2_2465.length != 0) {
                this.queryLayer(
                    "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/10",
                    "ecoshapeid = " + data.selectionInfo.ReviewerApp2_2465[0],
                    ["presence"],
                    function (results) {
                        let feature = results.features[0].attributes;
                        let presence = feature['presence'];

                        let values = null
                        if (presence === 'P') {
                            values = [
                                { label: "Presence Expected", value: "X" },
                                { label: "Historical", value: "H" },
                                { label: "Remove", value: "R" }
                            ];
                        }
                        else if (presence === 'H') {
                            values = [
                                { label: "Present", value: "P" },
                                { label: "Presence Expected", value: "X" },
                                { label: "Remove", value: "R" }
                            ];
                        }
                        else {
                            values = [
                                { label: "Present", value: "P" },
                                { label: "Historical", value: "H" },
                                { label: "Remove", value: "R" }
                            ];
                        }

                        let options = [];
                        for (let i = 0; i < values.length; i++) {
                            options.push({
                                label: values[i]['label'],
                                value: values[i]['value']
                            });
                        }

                        markupList.set('options', options);
                    }
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

                markupList.set('options', options);
            }
            markupList.on('change', lang.hitch(this, function (val) {
                let removalReasonDiv = dom.byId("removalReasonDiv");
                if (val === 'R') {
                    removalReasonDiv.style.display = "block";
                }
                else {
                    removalReasonDiv.style.display = "none";
                }
            }));
        },
        setEcoshapeInfo: function (feature, ecoshapeSpecies, parentObj) {
            dom.byId("parentEcoregion").innerHTML = feature.parentecoregion;
            dom.byId("ecozone").innerHTML = feature.ecozone;
            dom.byId("terrestrialArea").innerHTML = `${Math.round((feature.terrestrialarea / 1000000) * 100) / 100} km<sup>2</sup>`;
            dom.byId("ecoshapeName").innerHTML = feature.ecoshapename;
            dom.byId("ecoshapeSpecies").innerHTML = ecoshapeSpecies;
            dom.byId("terrestrialProportion").innerHTML = `${Math.round(feature.terrestrialproportion * 100 * 10) / 10}%`;
            this.queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/10",
                "ecoshapeid=" + feature.ecoshapeid + " and rangemapid=" + parentObj.dataModel.rangeMapID,
                ['presence'],
                function (results) {
                    if (results.features.length != 0) {
                        dom.byId("ecoshapePresence").innerHTML = results.features[0].attributes.presence;
                        dom.byId("ecoshapeMetadata").innerHTML = parentObj.rangeMetadata.innerHTML;
                    }
                }
            )

            return;
            this.queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "ecoshapeid=" + ecoshapeId,
                ["ParentEcoregion", "Ecozone", "TerrestrialArea", "EcoshapeName"],
                function (results) {
                    for (let i = 0; i < results.features.length; i++) {
                        let featureAttributes = results.features[i].attributes;
                        for (let attr in featureAttributes) {
                            dom.byId(attr).innerHTML = featureAttributes[attr];
                        }

                    }
                    dom.byId("ecoshapeSpecies").innerHTML = ecoshapeSpecies;
                }
            )
        },
        setUserTaxaSpecies: function (username, widgetObj) {
            this.queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/12",
                `Username = '${username}'`,
                ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "RangeMapNotes", "RangeMapScope", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME"],
                lang.hitch(widgetObj, this._setSpeciesDropdown)
            );
        },
        _setSpeciesDropdown: function (results) {
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

                this.dataModel.reviewID = reviewID;
                this.dataModel.rangeMapID = rangeMapID;

                let layerStructure = LayerStructure.getInstance();
                layerStructure.traversal(lang.hitch(this, function (layerNode) {
                    if (layerNode.title === "ReviewerApp2 - Species Range Ecoshapes (generalized)") {
                        layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                            layer.setDefinitionExpression("rangemapid=" + rangeMapID);

                            let query = new Query();
                            query.outFields = ["*"];
                            layer.queryExtent(query, lang.hitch(this, function (e, count) {
                                this.map.setExtent(e.extent);
                            }));
                        }));
                    }
                    else if (layerNode.title === "ReviewerApp2 - Reviewed Ecoshapes (generalized)") {
                        layerNode.getLayerObject().then((layer) => {
                            layer.setDefinitionExpression("reviewid=" + reviewID);
                        });
                    }

                    if (layerNode.title === "ReviewerApp2 - Review") {
                        layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                            var query = new Query();
                            query.where = "reviewid=" + reviewID + " and rangeMapID=" + rangeMapID;
                            query.outFields = ["*"];
                            layer.queryFeatures(query).then(lang.hitch(this, (results) => {
                                if (results.features.length != 0) {
                                    this.dataModel.reviewObjectID = results.features[0].attributes['objectid'];
                                    if (results.features[0].attributes['datecompleted']) {
                                        dom.byId("review_submitted").style.display = "block";
                                        dom.byId("saveButton").disabled = true;
                                        dom.byId("SaveOverallFeedbackButton").disabled = true;
                                        dom.byId("SubmitOverallFeedbackButton").disabled = true;
                                    }
                                    else {
                                        dom.byId("review_submitted").style.display = "none";
                                        dom.byId("saveButton").disabled = false;
                                        dom.byId("SaveOverallFeedbackButton").disabled = false;
                                        dom.byId("SubmitOverallFeedbackButton").disabled = false;
                                    }
                                }
                            }));
                        }));
                    }
                    // console.log(layerNode.title)
                }));

                dom.byId("overallFeedbackButton").disabled = false;
            }));
        },
        mapReviewEcoshapeIDs: function (url, dict) {
            this.queryLayer(
                url,
                "1=1",
                ["objectid", "ecoshapeid"],
                lang.hitch(dict, function (results) {
                    for (let i = 0; i < results.features.length; i++) {
                        let featureAttributes = results.features[i].attributes;
                        this[featureAttributes['objectid']] = featureAttributes['ecoshapeid'];
                    }
                })
            );
        },

        refreshMapLayer: function (title) {
            let layerStructure = LayerStructure.getInstance();
            layerStructure.traversal(function (layerNode) {
                if (layerNode.title === title) {
                    layerNode.getLayerObject().then((layer) => {
                        layer.refresh();
                    });
                }
            });
        },

        getObjectID: function (url, reviewID, ecoshapeID) {
            return this.queryLayer(
                url,
                "reviewid=" + reviewID + " and ecoshapeid=" + ecoshapeID,
                ["objectid"],
                null
            ).then((results) => {
                let featureAttributes = results.features[0].attributes;
                return featureAttributes['objectid'];
            });
        },
        _onSearchError: function (error) {
            console.error(error);
        },
    });
});