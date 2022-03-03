define([
    'dojo/_base/lang',
    'dojo/_base/declare',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (lang, declare, Query, QueryTask) {
    return declare(null, {
        queryLayer: function (url, where, outFields, method) {
            var queryParams = new Query();
            queryParams.returnGeometry = false;
            queryParams.where = where;
            queryParams.outFields = outFields;
            var queryTask = new QueryTask(url);
            queryTask.execute(queryParams, lang.hitch(this, method), lang.hitch(this, this._onSearchError));
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
    });
});