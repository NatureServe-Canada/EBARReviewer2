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
        setMarkupOptions: function (data, markupList) {
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
        },
        setEcoshapeInfo: function (ecoshapeId, ecoshapeSpecies) {
            this.queryLayer(
                "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/ReviewerApp2/FeatureServer/6",
                "InPoly_FID = " + ecoshapeId,
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