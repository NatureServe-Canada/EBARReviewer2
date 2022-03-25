define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/dom',
    'dojo/on',
    'dojo/dom-construct',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'jimu/LayerStructure',
], function (lang, declare, dom, on, domConstruct, Query, QueryTask, LayerStructure) {
    return declare(null, {
        queryLayer: function (url, where, outFields, method) {
            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = where;
            queryParams.outFields = outFields;
            var queryTask = new QueryTask(url);
            return queryTask.execute(queryParams, method, this._onSearchError);
        },
        setMarkupOptions: function (layerObj, data, parentObj) {
            let markupSelectObj = dom.byId("markupSelect");
            while (markupSelectObj.lastChild) {
                markupSelectObj.removeChild(markupSelectObj.lastChild);
            }

            return this.queryLayer(
                layerObj.URL,
                "ecoshapeid=" + data.ecoshapeid + " and rangemapid=" + parentObj.dataModel.rangeMapID,
                ['presence'],
                function (results) {
                    let pDict = {
                        P: "Present",
                        X: "Presence Expected",
                        H: "Historical",
                        R: "Remove"
                    };

                    let presence = results.features.length != 0 ? results.features[0].attributes['presence'] : null;

                    domConstruct.create("option", {
                        innerHTML: "None Set",
                        selected: "",
                        disabled: "",
                        value: ""
                    }, markupSelectObj);

                    for (let key in pDict) {
                        if (presence && (presence === key || presence === "R")) continue;
                        if (!presence && key === "R") continue;
                        domConstruct.create("option", {
                            innerHTML: pDict[key],
                            value: key
                        }, markupSelectObj);
                    }

                    on(markupSelectObj, "change", lang.hitch(this, function () {
                        let removalReasonDiv = dom.byId("removalReasonDiv");
                        let removalReasonBr = dom.byId("removalReasonBr");
                        if (markupSelectObj.value === 'R') {
                            removalReasonDiv.style.display = "block";
                            removalReasonBr.style.display = "block";
                        }
                        else {
                            removalReasonDiv.style.display = "none";
                            removalReasonBr.style.display = "none";
                        }
                    }));
                }
            )
        },
        setEcoshapeInfo: function (layerObj, feature, ecoshapeSpecies, parentObj) {
            dom.byId("parentEcoregion").innerHTML = feature.parentecoregion;
            dom.byId("ecozone").innerHTML = feature.ecozone;
            dom.byId("terrestrialArea").innerHTML = `${Math.round((feature.terrestrialarea / 1000000) * 100) / 100} km<sup>2</sup>`;
            dom.byId("ecoshapeName").innerHTML = feature.ecoshapename;
            dom.byId("ecoshapeSpecies").innerHTML = ecoshapeSpecies;
            dom.byId("terrestrialProportion").innerHTML = `${Math.round(feature.terrestrialproportion * 100 * 10) / 10}%`;
            this.queryLayer(
                layerObj.URL,
                "ecoshapeid=" + feature.ecoshapeid + " and rangemapid=" + parentObj.dataModel.rangeMapID,
                ['presence'],
                function (results) {
                    if (results.features.length != 0) {
                        let presence = results.features[0].attributes.presence;
                        dom.byId("ecoshapePresence").innerHTML = presence === "P" ? "Present" : presence === "H" ? "Historical" : "Presence Expected";
                        dom.byId("ecoshapeMetadata").innerHTML = parentObj.rangeMetadata.innerHTML;
                    }
                    else {
                        dom.byId("ecoshapePresence").innerHTML = "";
                        dom.byId("ecoshapeMetadata").innerHTML = "";
                    }
                }
            )
        },
        setUserTaxaSpecies: function (username, widgetObj) {
            this.queryLayer(
                widgetObj.config.layers.REVIEW_RANGEMAP_SPECIES.URL,
                `Username = '${username}'`,
                ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "RangeMapNotes", "RangeMapScope", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME", "NSX_URL"],
                lang.hitch(widgetObj, this._setSpeciesDropdown)
            );
        },
        _setSpeciesDropdown: function (results) {
            let taxGroups = new Set();
            let layerData = [];
            for (let i = 0; i < results.features.length; i++) {
                let featureAttributes = results.features[i].attributes;
                layerData.push({
                    "tax_group": featureAttributes["tax_group"],
                    "national_scientific_name": featureAttributes["national_scientific_name"]
                });
                taxGroups.add(featureAttributes['tax_group']);
            }

            let taxaSelect = dom.byId("taxaSelect");
            domConstruct.create("option", {
                innerHTML: "None Set",
                selected: "",
                disabled: "",
                value: ""
            }, taxaSelect);
            taxGroups.forEach((val) => {
                domConstruct.create("option", {
                    innerHTML: val,
                    value: val
                }, taxaSelect);
            });

            let speciesSelect = dom.byId("speciesSelect");
            on(taxaSelect, "change", lang.hitch(this, function () {
                while (speciesSelect.lastChild) {
                    speciesSelect.removeChild(speciesSelect.lastChild);
                }

                domConstruct.create("option", {
                    innerHTML: "None Set",
                    selected: "",
                    disabled: "",
                    value: ""
                }, speciesSelect);

                for (let i = 0; i < layerData.length; i++) {
                    if (layerData[i]['tax_group'] == taxaSelect.value) {
                        domConstruct.create("option", {
                            innerHTML: layerData[i]['national_scientific_name'],
                            value: layerData[i]['national_scientific_name']
                        }, speciesSelect);
                    }
                }
            }));

            let rangeMapID = null;
            let reviewID = null;

            on(speciesSelect, "change", lang.hitch(this, function () {
                for (var i = 0; i < results.features.length; i++) {
                    var featureAttributes = results.features[i].attributes;
                    if (featureAttributes['national_scientific_name'] == speciesSelect.value) {
                        this.rangeVersion.innerHTML = featureAttributes['rangeversion'];
                        this.rangeStage.innerHTML = featureAttributes['rangestage'];
                        this.rangeScope.innerHTML = featureAttributes['rangemapscope'] == 'G' ? 'Global' : featureAttributes['rangemapscope'] == 'N' ? 'National' : '';
                        this.rangeMetadata.innerHTML = featureAttributes['rangemetadata'];
                        this.rangeMapNotes.innerHTML = featureAttributes['rangemapnotes'];
                        this.speciesInformation.innerHTML = '<a href=' + featureAttributes['nsx_url'] + '>go to NatureServe Explorer</a>';

                        rangeMapID = featureAttributes['rangemapid'];
                        reviewID = featureAttributes['reviewid'];
                    }
                }

                this.dataModel.reviewID = reviewID;
                this.dataModel.rangeMapID = rangeMapID;

                let layerStructure = LayerStructure.getInstance();
                layerStructure.traversal(lang.hitch(this, function (layerNode) {
                    if (layerNode.title === this.config.layers.SPECIES_RANGE_ECOSHAPES.title) {
                        layerNode.getLayerObject().then(lang.hitch(this, (layer) => {
                            layer.setDefinitionExpression("rangemapid=" + rangeMapID);

                            let query = new Query();
                            query.outFields = ["*"];
                            layer.queryExtent(query, lang.hitch(this, function (e, count) {
                                this.map.setExtent(e.extent);
                            }));
                        }));
                    }
                    else if (layerNode.title === this.config.layers.REVIEWED_ECOSHAPES.title) {
                        layerNode.getLayerObject().then((layer) => {
                            layer.setDefinitionExpression("reviewid=" + reviewID);
                        });
                    }
                    else if (layerNode.title === "Species Range Input") {
                        layerNode.getLayerObject().then((layer) => {
                            layer.setDefinitionExpression("rangemapid=" + rangeMapID);
                        });
                    }

                    if (layerNode.title === this.config.layers.REVIEW.title) {
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
                                        dom.byId("deleteMarkup").disabled = true;
                                    }
                                    else {
                                        dom.byId("review_submitted").style.display = "none";
                                        dom.byId("saveButton").disabled = false;
                                        dom.byId("SaveOverallFeedbackButton").disabled = false;
                                        dom.byId("SubmitOverallFeedbackButton").disabled = false;
                                        dom.byId("deleteMarkup").disabled = false;
                                    }
                                }
                            }));
                        }));
                    }
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