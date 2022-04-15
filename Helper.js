define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/dom',
    'dojo/on',
    'dojo/dom-construct',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'jimu/LayerStructure',
    'esri/layers/FeatureLayer',
    'esri/graphic',
    'dojo/promise/all',
], function (lang, declare, dom, on, domConstruct, Query, QueryTask, LayerStructure, FeatureLayer, graphic, all) {
    return declare(null, {
        queryLayer: function (url, where, outFields, method = null) {
            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = where;
            queryParams.outFields = outFields;
            var queryTask = new QueryTask(url);
            return queryTask.execute(queryParams, method, this._onSearchError);
        },

        setMarkupOptions: function (selectedFeatures, speciesRangeEcoshapes, reviewedEcoshapes, usageType, differentiateusagetype) {
            dom.byId("markup_warning").style.display = "none";

            let markupSelectObj = dom.byId("markupSelect");
            let pDict = { P: "Present", X: "Presence Expected", H: "Historical", R: "Remove" };
            while (markupSelectObj.lastChild) {
                if (!markupSelectObj.lastChild.value) break;
                markupSelectObj.removeChild(markupSelectObj.lastChild);
            }

            let usageTypeSelect = dom.byId("usage_type_select");
            let uDict = { B: "Breeding", P: "Possible Breeding", M: "Migration", N: "Non-breeding" }
            while (usageTypeSelect.lastChild) {
                if (!usageTypeSelect.lastChild.value) break;
                usageTypeSelect.removeChild(usageTypeSelect.lastChild);
            }

            if (selectedFeatures.length == 1) {
                let presence = speciesRangeEcoshapes.length != 0 ? speciesRangeEcoshapes[0].presence : null;
                for (let key in pDict) {
                    if (presence && presence === key) continue;
                    if (!presence && key === "R") continue;
                    domConstruct.create("option", {
                        innerHTML: pDict[key],
                        value: key
                    }, markupSelectObj);
                }

                let usageTypeVal = usageType.length != 0 ? usageType[0].usagetype : null;
                for (let key in uDict) {
                    if (usageTypeVal && usageTypeVal === key) continue;
                    if (!usageTypeVal && key === "N") continue;
                    domConstruct.create("option", {
                        innerHTML: uDict[key],
                        value: key
                    }, usageTypeSelect);
                }

                let selectElem = document.getElementById('markupSelect');
                if (reviewedEcoshapes.length != 0) {
                    let attr = reviewedEcoshapes[0];
                    dom.byId("comment").value = attr['ecoshapereviewnotes'];
                    dom.byId("reference").value = attr['reference'];

                    selectElem.value = attr['markup'];
                    if (attr['markup'] == 'R') {
                        dom.byId("removalReason").value = attr['removalreason'];
                        dom.byId("removalReasonDiv").style.display = "block";
                    }
                }
            }
            else {
                let isRangePresent = false;
                let optionToSkip = null;
                if (speciesRangeEcoshapes.length != 0) {
                    isRangePresent = true;
                    dom.byId("markup_warning").style.display = "block";
                    if (speciesRangeEcoshapes.length == selectedFeatures.length) {
                        let temp = speciesRangeEcoshapes.map(x => x.presence);
                        if (temp.every(v => v === temp[0])) optionToSkip = temp[0];
                        dom.byId("markup_warning").style.display = "none";
                    }
                }
                for (let key in pDict) {
                    if (!isRangePresent && key === "R") continue;
                    if (key === optionToSkip) continue;
                    domConstruct.create("option", {
                        innerHTML: pDict[key],
                        value: key
                    }, markupSelectObj);
                }

                let isUsageTypeRangePresent = false;
                let usageTypeToSkip = null;
                if (usageType.length != 0) {
                    isUsageTypeRangePresent = true;
                    if (usageType.length == selectedFeatures.length) {
                        let temp = usageType.map(x => x.usagetype);
                        if (temp.every(v => v === temp[0])) usageTypeToSkip = temp[0];
                    }
                }

                for (let key in uDict) {
                    if (!isUsageTypeRangePresent && key === "N") continue;
                    if (key === usageTypeToSkip) continue;
                    domConstruct.create("option", {
                        innerHTML: uDict[key],
                        value: key
                    }, usageTypeSelect);
                }
            }

            if (differentiateusagetype === 1) {
                dom.byId("usage_type_div").style.display = "block";
                if (speciesRangeEcoshapes.length != 0) {
                    dom.byId("markup_required_annotation").style.display = "none";
                    dom.byId("usage_type_select").disabled = false;
                }
                else {
                    if (reviewedEcoshapes.length == 0) {
                        dom.byId("markup_required_annotation").style.display = "inline";
                        dom.byId("usage_type_select").disabled = true;
                    }
                    else {
                        dom.byId("usage_type_select").disabled = false;
                    }
                }
            }
            else dom.byId("usage_type_div").style.display = "none";
        },

        setEcoshapeInfo: function (feature, speciesRangeEcoshapes, ecoshapeMetadata) {
            dom.byId("parentEcoregion").innerHTML = feature.parentecoregion;
            dom.byId("ecozone").innerHTML = feature.ecozone;
            dom.byId("terrestrialArea").innerHTML = `${Math.round((feature.terrestrialarea / 1000000) * 100) / 100} km<sup>2</sup>`;
            dom.byId("ecoshapeName").innerHTML = feature.ecoshapename;
            dom.byId("ecoshapeSpecies").innerHTML = dom.byId('speciesSelect').value;
            dom.byId("terrestrialProportion").innerHTML = `${Math.round(feature.terrestrialproportion * 100 * 10) / 10}%`;
            if (speciesRangeEcoshapes.length != 0) {
                let presence = speciesRangeEcoshapes[0].presence; //CheckLater
                dom.byId("ecoshapePresence").innerHTML = presence === "P" ? "Present" : presence === "H" ? "Historical" : "Presence Expected";
                dom.byId("ecoshapeMetadata").innerHTML = ecoshapeMetadata;
            }
            else {
                dom.byId("ecoshapePresence").innerHTML = "";
                dom.byId("ecoshapeMetadata").innerHTML = "";
            }
        },

        setUserTaxaSpecies: function (username, widgetObj) {
            this.queryLayer(
                widgetObj.config.layers.REVIEW_RANGEMAP_SPECIES.URL,
                `username = '${username}' and includeinebarreviewer=1`,
                ["Username", "ReviewID", "RangeMapID", "RangeVersion", "RangeStage", "RangeMetadata", "RangeMapNotes", "RangeMapScope", "TAX_GROUP", "NATIONAL_SCIENTIFIC_NAME", "NSX_URL", "DifferentiateUsageType"],
                lang.hitch(widgetObj, this._setSpeciesDropdown)
            );
        },
        _setSpeciesDropdown: function (results) {
            let taxGroups = new Set(), layerData = [];
            for (let i = 0; i < results.features.length; i++) {
                let featureAttributes = results.features[i].attributes;
                layerData.push({
                    "tax_group": featureAttributes["tax_group"],
                    "national_scientific_name": featureAttributes["national_scientific_name"]
                });
                taxGroups.add(featureAttributes['tax_group']);
            }

            layerData.sort(function (a, b) {
                if (a.tax_group > b.tax_group) return 1;
                if (b.tax_group > a.tax_group) return -1;
                if (a.tax_group == b.tax_group) {
                    if (a.national_scientific_name > b.national_scientific_name) return 1;
                    if (b.national_scientific_name > a.national_scientific_name) return -1;
                    return 0;
                }
            });

            let taxGroupsArr = Array.from(taxGroups);
            taxGroupsArr.sort();

            let taxaSelect = dom.byId("taxaSelect");
            domConstruct.create("option", {
                innerHTML: "Select Taxa",
                selected: "",
                disabled: "",
                value: ""
            }, taxaSelect);
            taxGroupsArr.forEach((val) => {
                domConstruct.create("option", {
                    innerHTML: val,
                    value: val
                }, taxaSelect);
            });

            let speciesSelect = dom.byId("speciesSelect");
            domConstruct.create("option", {
                innerHTML: "Select Species",
                selected: "",
                disabled: "",
                value: ""
            }, speciesSelect);

            on(taxaSelect, "change", lang.hitch(this, function () {
                while (speciesSelect.lastChild) {
                    speciesSelect.removeChild(speciesSelect.lastChild);
                }

                domConstruct.create("option", {
                    innerHTML: "Select Species",
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

                speciesSelect.disabled = false;
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
                        this.speciesInformation.innerHTML = '<a href=' + featureAttributes['nsx_url'] + ' target="_blank" rel="noopener noreferrer">go to NatureServe Explorer</a>';

                        rangeMapID = featureAttributes['rangemapid'];
                        reviewID = featureAttributes['reviewid'];
                        this.dataModel.differentiateusagetype = featureAttributes['differentiateusagetype'];
                    }
                }

                this.dataModel.reviewID = reviewID;
                this.dataModel.rangeMapID = rangeMapID;

                let extentArr = [];
                let layerStructure = LayerStructure.getInstance();
                layerStructure.traversal(lang.hitch(this, function (layerNode) {
                    let promise = null;
                    if (layerNode.title === this.config.layers.SPECIES_RANGE_ECOSHAPES.title) {
                        layerNode.setFilter("rangemapid=" + rangeMapID);
                        promise = layerNode.getExtent();
                    }
                    else if (layerNode.title === this.config.layers.REVIEWED_ECOSHAPES.title) {
                        layerNode.setFilter("reviewid=" + reviewID);
                        promise = layerNode.getExtent();
                    }
                    else if (layerNode.title === "Species Range Input") {
                        layerNode.setFilter("rangemapid=" + rangeMapID);
                    }
                    else if (layerNode.title === this.config.layers.USAGE_TYPE.title) {
                        if (this.dataModel.differentiateusagetype === 1) {
                            layerNode.setFilter("rangemapid=" + rangeMapID);
                            layerNode.show();
                        }
                        else layerNode.hide();
                    }
                    else if (layerNode.title === this.config.layers.USAGE_TYPE_MARKUP.title) {
                        if (this.dataModel.differentiateusagetype === 1) {
                            layerNode.setFilter("reviewid=" + reviewID);
                            layerNode.show();
                        }
                        else layerNode.hide();
                    }

                    if (promise) {
                        promise.then(extent => {
                            extentArr.push(extent);
                            if (extentArr.length == 2) {
                                if (isNaN(extentArr[0].xmax))
                                    this.map.setExtent(extentArr[1], true);
                                else if (isNaN(extentArr[1].xmax))
                                    this.map.setExtent(extentArr[0], true);
                                else
                                    this.map.setExtent(extentArr[0].union(extentArr[1]), true);
                            }
                        });
                    }
                }));

                let reviewLayer = new FeatureLayer(this.config.layers.REVIEW.URL);
                var queryParams = new Query();
                queryParams.returnGeometry = false;
                queryParams.where = "reviewid=" + reviewID + " and rangeMapID=" + rangeMapID;
                queryParams.outFields = ["*"];
                reviewLayer.queryFeatures(queryParams)
                    .then((results) => {
                        if (results.features.length != 0) {
                            this.dataModel.overallReviewObjectID = results.features[0].attributes['objectid'];
                            this.dataModel.overallReviewRating = results.features[0].attributes['overallstarrating'];
                            this.dataModel.overallReviewComment = results.features[0].attributes['reviewnotes'];
                            if (!results.features[0].attributes['datestarted']) {
                                let graphicObj = new graphic();
                                graphicObj.setAttributes({
                                    objectid: this.dataModel.overallReviewObjectID,
                                    datestarted: new Date().getTime()
                                });
                                reviewLayer.applyEdits(null, [graphicObj]).then(() => {
                                    console.log("datestarted updated")
                                });
                            }
                            if (results.features[0].attributes['datecompleted']) {
                                dom.byId("markup_warnings").style.display = "none";
                                const collection = document.getElementsByClassName("review_submitted");
                                for (let i = 0; i < collection.length; i++) {
                                    collection[i].style.display = "block";
                                }
                                dom.byId("saveButton").disabled = true;
                                dom.byId("SaveOverallFeedbackButton").disabled = true;
                                dom.byId("SubmitOverallFeedbackButton").disabled = true;
                                dom.byId("deleteMarkup").disabled = true;
                            }
                            else {
                                dom.byId("markup_warnings").style.display = "block";
                                const collection = document.getElementsByClassName("review_submitted");
                                for (let i = 0; i < collection.length; i++) {
                                    collection[i].style.display = "none";
                                }
                                dom.byId("saveButton").disabled = false;
                                dom.byId("SaveOverallFeedbackButton").disabled = false;
                                dom.byId("SubmitOverallFeedbackButton").disabled = false;
                                dom.byId("deleteMarkup").disabled = false;
                            }
                        }
                    });

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

        clearSelectionByLayer: function (layerTitle) {
            let layerStructure = LayerStructure.getInstance();
            layerStructure.traversal(function (layerNode) {
                if (layerNode.title === layerTitle)
                    layerNode.getLayerObject().then((layer) => layer.clearSelection());
            });
        },

        fetchReviewedEcoshapes: function (url, where) {
            return this.queryLayer(url, where, ['*'])
                .then((results) => {
                    let temp = [];
                    if (results.features.length != 0)
                        results.features.forEach(x => temp.push(x.attributes));
                    return temp;
                });
        },

        _onSearchError: function (error) {
            console.error(error);
        },
    });
});