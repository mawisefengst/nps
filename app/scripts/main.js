var response = {"nps":17,"responses":17,"detractors":6,"passives":2,"promoters":9,"response_rate":65,"email_response_rate":0,"scores_histogram":[5,0,1,0,0,0,0,1,1,2,7],"mean_score":6.2,"nps_trend":17,"response_trend":17,"detractor_trend":6,"passive_trend":2,"promoter_trend":9,"response_rate_trend":65,"email_response_rate_trend":0,"mean_score_trend":6.2};

var app = angular.module("dashboardApp",["ngLodash"]);
angular.module("dashboardApp")

.constant("response", response)

.controller("snapshotController",["$scope","response","$timeout",function($scope,response,$timeout){
	$scope.title=" Anguarlar NPS Dashbard";
    $scope.summary = calculatePercentages(response);
    $scope.scoresHistogramData = formatScoresHistogram($scope.summary);
    $scope.totalResponses = $scope.summary.responses;
    $scope.currentlySelectedScore = null;

	$timeout(function() {
        $scope.fadeInHistogram = true;
    }, 900);

     $scope.setCurrentScore = function(score) {
        $scope.currentlySelectedScore = score
    };

	$scope.colorBarValueClass = function(value) {
        var barGraphScalar = .62;
        var colorBarClass = "pct-";
        if ($scope.emptyState) {
            colorBarClass += 2
        } else if (value === 0) {
            colorBarClass += 0
        } else {
            colorBarClass += Math.floor(value * barGraphScalar + 1)
        }
        return colorBarClass
    };
    $scope.isBarShort = function(value) {
        var shortBarValue = 18;
        return value <= shortBarValue
    };

    function calculatePercentages(summary) {
        if (summary.responses !== 0) {
            summary.percent_detractors = (summary.detractors / summary.responses * 100).toFixed(0) / 1;
            summary.percent_passives = (summary.passives / summary.responses * 100).toFixed(0) / 1;
            summary.percent_promoters = (summary.promoters / summary.responses * 100).toFixed(0) / 1
        } else {
            summary.percent_detractors = 0;
            summary.percent_passives = 0;
            summary.percent_promoters = 0
        }
        summary.previous_responses = summary.responses - summary.response_trend;
        summary.previous_response_rate = summary.response_rate - summary.response_rate_trend;
        summary.previous_email_response_rate = summary.email_response_rate - summary.email_response_rate_trend;
        summary.previous_mean_score = summary.mean_score - summary.mean_score_trend;
        return summary
    }

    function formatScoresHistogram(summary) {
        var data = [];
        data.push(Math.round(summary.mean_score * 10) / 10);
        var scoresHistogram = [];
        for (var i = 0; i < 11; i++) {
            scoresHistogram[i] = {
                score: i,
                responses: summary.scores_histogram[i]
            }
        }
        data = data.concat(scoresHistogram);
        return data
    }

}])

.filter("scoreType", function() {
    return function(score) {
        if (score >= 0 && score <= 6) {
            return "detractor"
        } else if (score >= 7 && score <= 8) {
            return "passive"
        } else {
            return "promoter"
        }
    }
}).filter("npsType", function() {
    return function(score) {
        if (score <= 0) {
            return "detractor"
        } else if (score > 0 && score <= 50) {
            return "passive"
        } else {
            return "promoter"
        }
    }
}).filter("trendType", function() {
        return function(trend) {
            if (trend < 0) {
                return "detractor"
            } else if (trend === 0) {
                return "no-change"
            } else if (trend > 0) {
                return "promoter"
            }
        }
}).filter("dateRangeToTerm", function() {
       	 return "";
}).filter("detractorTrendToSvgIcon", function() {
        return function(trend) {
            if (trend === 0) {
                return "/images/no-trend-detractor.svg"
            } else {
                return "/images/trend-detractor.svg"
            }
        }
}).filter("trendFile", function() {
        return function(trend) {
            if (trend === 0) {
                return "/images/no-trend-neutral.svg"
            }
            if (trend > 0) {
                return "/images/trend-promoter.svg"
            }
            if (trend < 0) {
                return "/images/trend-detractor.svg"
            }
        }
}).filter("lineChartDirection", function() {
    return function(trend) {
        if (trend < 0) {
            return "fa-flip-vertical"
        } else if (trend === 0) {
            return
        } else if (trend > 0) {
            return
        }
    }
}).filter("formatTrend", function() {
    return function(trend) {
        if (trend > 0) {
            return "+" + trend
        } else {
            return trend
        }
    }
}).directive("filtersDirective", function() {
    return {
        templateUrl: "filters.html"
    }
}).filter("passiveTrendToSvgIcon", function() {
    return function(trend) {
        if (trend === 0) {
            return "/images/no-trend-passive.svg"
        } else {
            return "/images/trend-passive.svg"
        }
    }
}).filter("promoterTrendToSvgIcon", function() {
    return function(trend) {
        if (trend === 0) {
            return "/images/no-trend-promoter.svg"
        } else {
            return "/images/trend-promoter.svg"
        }
    }
});


angular.module("dashboardApp").directive("scorePopover", scorePopover);
scorePopover.$inject = ["$timeout", "$window"];

function scorePopover($timeout, $window) {
    var directive = {
        link: link,
        scope: false,
        require: "^snapshotHistogram",
        templateUrl: "score-popover.html",
        restrict: "EA"
    };
    return directive;

    function link($scope, element, attrs, snapshotHistogramController) {
        var bars;
        var chartOriginY;
        $scope.$watch(function() {
            return snapshotHistogramController.getCurrentScore()
        }, function(newVal) {
            $scope.currentlySelectedScore = newVal;
           if (newVal !== null) {
                if (!chartOriginY) {
                    chartOrigin()
                }
                updatePosition()
            }
        }, true);
        $scope.$watch($scope.displayMeanScore, function() {
            $timeout(function() {
                chartOrigin()
            }, 1400)
        });
        angular.element($window).bind("resize", function() {
            $timeout(function() {
                chartOrigin()
            }, 750)
        });

        function updatePosition() {
            var data = snapshotHistogramController.getCurrentScore();
            var score = data.score;
            bars = snapshotHistogramController.getBar();
            var currentBar = bars[0][score];
            var svg = document.querySelector("svg");
            var matrix = currentBar.getScreenCTM();
            var pt = svg.createSVGPoint();
            pt.x = currentBar.x.animVal.value;
            pt.y = currentBar.y.animVal.value;
            var barLeft = pt.matrixTransform(matrix).x;
            var popOverX = barLeft - 82;
            var responses = data.responses;
            var maxResponses = snapshotHistogramController.getMaxResponses();
            var popOverY = chartOriginY - 112 * (responses / maxResponses) - 4;
            $scope.position = {
                left: popOverX,
                top: popOverY
            }
        }

        function chartOrigin() {
            bars = snapshotHistogramController.getBar();
            var barRect = bars[0][0];
            var svg = document.querySelector("svg");
            var matrix = barRect.getScreenCTM();
            var pt = svg.createSVGPoint();
            pt.y = barRect.y.animVal.value + barRect.height.animVal.value;
            var screenCoordinate = pt.matrixTransform(matrix).y;
            var offsetTop = window.pageYOffset || document.documentElement.scrollTop;
            chartOriginY = screenCoordinate - 55 + offsetTop
        }
    }
}

angular.module("dashboardApp").directive("snapshotHistogram", snapshotHistogram);

snapshotHistogram.$inject = ["$window", "$timeout", "lodash"];

function snapshotHistogram($window, $timeout, _) {
    var directive = {
        link: link,
        controller: snapshotHistogramController,
        scope: {
            data: "=",
            currentlySelectedScore: "=",
            setCurrentScore: "&",
            totalResponses: "="
        },
        restrict: "EA"
    };
    return directive;

    function snapshotHistogramController($scope) {
        var self = {};
        self.getCurrentScore = function() {
            return $scope.currentlySelectedScore
        };
        self.getBar = function() {
            return $scope.bar
        };
        self.getTotalResponses = function() {
            return $scope.totalResponses
        };
        self.getMaxResponses = function() {
            return $scope.maxResponses
        };
        return self
    }

    function link(scope, element) {
        var barData = [];
        var meanScore;
        var totalResponses = 0;
        scope.maxResponses = 0;
        var margin = {
                top: 20,
                bottom: 40,
                left: 50,
                right: 30
            },
            width, height = 195,
            barWidth, barPadding, chartWidth, chartHeight, xScale, yScale, xAxis, yAxis, svg;
        var transitionDuration = 500;
        $timeout(function() {
            setupChart();
            scope.render()
        }, 1e3);
        $(window).resize(function() {
            setupChart();
            scope.render()
        });
        scope.$watch("data", function(newVals) {
            scope.data = newVals;
            setupChart();
            return scope.render()
        }, true);
        scope.$watch(function() {
            return document.body.clientHeight
        }, function(newValue, oldValue) {
            if (newValue - oldValue > 100) {
                setupChart();
                scope.render()
            }
        });
        scope.$watch("currentlySelectedScore", function(newVal) {
            clearScoreHighlights();
            if (typeof newVal != "undefined" && newVal !== null) {
                var data = newVal;
                highlightScore(data)
            }
        }, true);
        scope.parseData = function(data) {
            if (!data || data.length === 0) {
                barData[0] = [];
                for (var i = 0; i < 11; i++) {
                    meanScore = 0;
                    barData[0][i] = {
                        score: i,
                        responses: 0
                    }
                }
                return
            }
            meanScore = data[0];
            barData = [data.slice(1, 13)];
            totalResponses = scope.totalResponses;
            scope.maxResponses = d3.max(barData[0], function(d) {
                return d.responses
            })
        };
        scope.render = function() {
            if (!scope.data) {
                return
            }
            scope.parseData(scope.data);
            buildScales();
            buildAxis();
            drawBars();
            drawMeanScore();
            drawAxis();
        };

        function setupChart() {
            if (!svg) {
                svg = d3.select(element[0]).append("svg").attr("class", "snapshot-histogram").style("height", "205px").style("width", "100%")
            }
            svg.selectAll("*").remove();
            width = d3.select(".d3-score-histogram").node().offsetWidth;
            svg.attr("height", height);
            setChartWidth();
            chartHeight = height - margin.top - margin.bottom;
            var attrs = {
                transform: "translate(" + margin.left + "," + margin.top + ")"
            };
            var container = svg.append("g").classed("container-group", true).attr(attrs);
            container.append("g").classed("chart-group", true);
            container.append("g").classed("x axis", true);
            container.append("g").classed("y axis", true);
            svg.append("line").classed("mean", true).attr(attrs);
            d3.selectAll(".chart-group").on("mouseout", function() {
                scope.setCurrentScore({
                    score: null
                });
                scope.$apply()
            })
        }

        function setChartWidth() {
            chartWidth = width - (margin.left + 12)
        }

        function buildScales() {
            setChartWidth();
            xScale = d3.scale.linear().range([0, chartWidth]);
            if (barData.length > 0) {
                barWidth = d3.scale.ordinal().domain(barData[0].map(function(d) {
                    return d.score
                })).rangeRoundBands(xScale.range(), .1).rangeBand()
            }
            yScale = d3.scale.linear().range([0, chartHeight]);
            xScale.domain([0, 11]);
            if (scope.totalResponses === 0) {
                yScale.domain([10, 0])
            } else {
                yScale.domain([1.1 * scope.maxResponses, 0]).nice()
            }
        }
        var formatBigNumbers = function(number, symbol) {
            var symbolsForValues = {
                K: 1e3,
                M: 1e6
            };
            var value = parseFloat(number / symbolsForValues[symbol]).toFixed(1);
            return value.replace(".0", "") + symbol
        };
        var formatYAxis = function(number) {
            if (number < 1e3) {
                return number
            } else if (number < 1e6) {
                return formatBigNumbers(number, "K")
            } else {
                return formatBigNumbers(number, "M")
            }
        };

        function buildAxis() {
            xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickValues(_.range(11));
            svg.select("path.domain").remove();
            yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5).tickFormat(formatYAxis);
            svg.append("text").attr("x", 26).attr("y", chartHeight + 66).attr("text-anchor", "start").style("font-size", "18px").style("font-weight", "500").style("fill", "#605a5c").text("Responses by Score")
        }

        function drawAxis() {
            if (barData.length === 0) {
                return
            }
            var xAxisLine = svg.select(".x.axis").attr("transform", function() {
                return "translate(" + barWidth / 2 + "," + chartHeight + ")"
            }).transition().duration(transitionDuration).call(xAxis);
            xAxisLine.selectAll("text").style("text-anchor", "middle").attr("dx", "0em").attr("dy", "1em").style("font-size", "16px").style("fill", "#7f7c7d");
            svg.select(".y.axis").transition().duration(transitionDuration).call(yAxis);
            svg.select(".y.axis").selectAll("text").style("font-size", "12px").style("fill", "#7f7c7d")
        }

        function drawBars() {
            var chart = d3.selectAll(".chart-group");
            var responseType = chart.selectAll(".response-layer").data(barData);
            responseType.exit().remove();
            responseType.enter().append("g").attr("class", "response-layer");
            var bars = responseType.selectAll("rect").data(function(d) {
                return d
            });
            bars.exit().transition().duration(transitionDuration).remove();
            scope.bar = bars.enter().append("rect").attr("height", 0);
            setChartBarPadding(bars[0]);
            bars.transition().duration(transitionDuration).attr("x", function(d) {
                var xPosition = xScale(d.score);
                return xPosition
            }).attr("y", function(d) {
                return yScale(d.responses)
            }).attr("height", function(d) {
                if (scope.totalResponses === 0) {
                    return 0
                } else {
                    return chartHeight - yScale(d.responses)
                }
            }).attr("width", barWidth).attr("class", function(d) {
                var type;
                if (d.score < 7) {
                    type = "detractors"
                } else if (d.score <= 8) {
                    type = "passives"
                } else if (d.score <= 10) {
                    type = "promoters"
                }
                return "chart-bar " + type + " score-" + d.score
            });
            $timeout(function() {
                d3.selectAll(".chart-bar").on("mouseover", function(d) {
                    scope.setCurrentScore({
                        score: d
                    });
                    scope.$apply();
                })
            }, transitionDuration)
        }

        function drawMeanScore() {
            if (meanScore) {
                var line = svg.selectAll(".mean");
                var lineX = xScale(Math.floor(meanScore)) + barWidth / 2;
                lineX += (meanScore - Math.floor(meanScore)) * (barWidth + barPadding);
                line.attr("x1", lineX).attr("x2", lineX).attr("y1", yScale(0)).attr("y2", 0).attr("stroke-width", 2).attr("stroke", "#cdcdcd").style("stroke-dasharray", "7, 2.7")
            }
        }

        function setChartBarPadding(bars) {
            var chartSpaceByBars = Math.floor(barWidth * bars.length);
            var blankSpace = chartWidth - chartSpaceByBars;
            barPadding = blankSpace / (bars.length - 1)
        }

        function clearScoreHighlights() {
            d3.selectAll(".chart-bar").classed("highlight", false)
        }

        function highlightScore(data) {
            d3.selectAll(".score-" + data.score).classed("highlight", true)
        }
    }
}



$(function(){
	angular.bootstrap(document,["dashboardApp"]);
});