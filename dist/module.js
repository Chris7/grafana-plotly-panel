'use strict';

System.register(['app/plugins/sdk', 'lodash', 'moment', 'angular', './external/plotly'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, moment, angular, Plotly, _typeof, _createClass, PlotlyPanelCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_angular) {
      angular = _angular.default;
    }, function (_externalPlotly) {
      Plotly = _externalPlotly;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('PanelCtrl', PlotlyPanelCtrl = function (_MetricsPanelCtrl) {
        _inherits(PlotlyPanelCtrl, _MetricsPanelCtrl);

        function PlotlyPanelCtrl($scope, $injector, $q, $rootScope, $timeout, $window, timeSrv, uiSegmentSrv) {
          _classCallCheck(this, PlotlyPanelCtrl);

          var _this = _possibleConstructorReturn(this, (PlotlyPanelCtrl.__proto__ || Object.getPrototypeOf(PlotlyPanelCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;
          _this.timeSrv = timeSrv;
          _this.uiSegmentSrv = uiSegmentSrv;
          _this.q = $q;

          _this.data = [];
          _this.initialColors = {
            marker: ['#33B5E5'],
            line: ['#005f81']
          };
          _this.traces = {};
          _this.displayOptions = {};
          _this.sizeChanged = true;
          _this.initalized = false;

          _this.$tooltip = $('<div id="tooltip" class="graph-tooltip">');

          var dcfg = {
            mapping: {
              x: null,
              y: null,
              z: null,
              color: null,
              size: null,
              x_query: 0,
              y_query: 0,
              z_query: 0
            },
            settings: {
              type: 'scatter',
              mode: 'lines+markers',
              displayModeBar: false,
              line: {
                color: null,
                width: 6,
                dash: 'solid',
                shape: 'linear'
              },
              marker: {
                size: 12,
                symbol: 'circle',
                color: null,
                // colorscale: 'YIOrRd',
                sizemode: 'diameter',
                sizemin: 3,
                sizeref: 0.2,
                line: {
                  color: '#DDD',
                  width: 0
                },
                showscale: false
              },
              color_option: 'solid'
            },
            layout: {
              autosize: false,
              showlegend: true,
              // legend: {"orientation": "v"},
              dragmode: 'lasso', // (enumerated: "zoom" | "pan" | "select" | "lasso" | "orbit" | "turntable" )
              hovermode: 'closest',
              plot_bgcolor: "#1f1d1d",
              paper_bgcolor: 'rgba(0,0,0,0)', // transparent?
              font: {
                color: '#D8D9DA',
                family: '"Open Sans", Helvetica, Arial, sans-serif'
              },
              margin: {
                t: 0,
                b: 45,
                l: 65,
                r: 20
              },
              xaxis: {
                showgrid: true,
                zeroline: false,
                type: 'linear',
                gridcolor: '#444444',
                rangemode: 'normal' // (enumerated: "normal" | "tozero" | "nonnegative" )
              },
              yaxis: {
                showgrid: true,
                zeroline: false,
                type: 'linear',
                gridcolor: '#444444',
                rangemode: 'normal' // (enumerated: "normal" | "tozero" | "nonnegative" )
              },
              scene: {
                xaxis: { title: 'X AXIS' },
                yaxis: { title: 'Y AXIS' },
                zaxis: { title: 'Z AXIS' }
              }
            }
          };

          // There are a bunch of default settings we want to override from grafana's settings
          // this.panel.pconfig.settings.marker.color = null;
          // this.panel.pconfig.settings.marker.showscale = false;
          // this.panel.pconfig.settings.marker.size = 12;
          // this.panel.pconfig.settings.line.color = null;
          // this.panel.pconfig.layout.showlegend = true;

          _this.panel.pconfig = $.extend(true, dcfg, _this.panel.pconfig);

          var cfg = _this.panel.pconfig;
          _this.layout = $.extend(true, {}, _this.panel.pconfig.layout);

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('render', _this.onRender.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('panel-initialized', _this.onPanelInitalized.bind(_this));
          _this.events.on('refresh', _this.onRefresh.bind(_this));

          angular.element($window).bind('resize', _this.onResize.bind(_this));
          return _this;
        }

        _createClass(PlotlyPanelCtrl, [{
          key: 'onResize',
          value: function onResize() {
            this.sizeChanged = true;
          }
        }, {
          key: 'onDataError',
          value: function onDataError(err) {
            this.seriesList = [];
            this.render([]);
            console.log("onDataError", err);
          }
        }, {
          key: 'onRefresh',
          value: function onRefresh() {
            if (this.graph && this.initalized) {
              Plotly.redraw(this.graph);
            }
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Display', 'public/plugins/natel-plotly-panel/tab_display.html', 2);
            //  this.editorTabIndex = 1;
            this.refresh();
            this.segs = {
              symbol: this.uiSegmentSrv.newSegment({ value: this.panel.pconfig.settings.marker.symbol })
            };
            this.subTabIndex = 0; // select the options

            var cfg = this.panel.pconfig;
            this.axis = [{
              disp: 'X Axis',
              query_idx: function query_idx(_query_idx) {
                if (_query_idx) {
                  cfg.mapping.x_query = _query_idx;
                }return cfg.mapping.x_query;
              },
              idx: 1,
              config: cfg.layout.xaxis,
              metric: function metric(name) {
                if (name) {
                  cfg.mapping.x = name;
                }return cfg.mapping.x;
              }
            }, {
              disp: 'Y Axis',
              query_idx: function query_idx(_query_idx2) {
                if (_query_idx2) {
                  cfg.mapping.y_query = _query_idx2;
                }return cfg.mapping.y_query;
              },
              idx: 2,
              config: cfg.layout.yaxis,
              metric: function metric(name) {
                if (name) {
                  cfg.mapping.y = name;
                }return cfg.mapping.y;
              }
            }, {
              disp: 'Z Axis',
              query_idx: function query_idx(_query_idx3) {
                if (_query_idx3) {
                  cfg.mapping.z_query = _query_idx3;
                }return cfg.mapping.z_query;
              },
              idx: 3,
              config: cfg.layout.yaxis,
              metric: function metric(name) {
                if (name) {
                  cfg.mapping.z = name;
                }return cfg.mapping.z;
              }
            }];
          }
        }, {
          key: 'isAxisVisible',
          value: function isAxisVisible(axis) {
            if (axis.idx == 3) {
              return this.panel.pconfig.settings.type === 'scatter3d';
            }
            return true;
          }
        }, {
          key: 'onSegsChanged',
          value: function onSegsChanged() {
            this.panel.pconfig.settings.marker.symbol = this.segs.symbol.value;
            this.onConfigChanged();

            console.log(this.segs.symbol, this.panel.pconfig);
          }
        }, {
          key: 'onPanelInitalized',
          value: function onPanelInitalized() {
            this.onConfigChanged();
          }
        }, {
          key: 'onRender',
          value: function onRender() {
            var _this2 = this;

            if (!this.initalized) {
              var s = this.panel.pconfig.settings;

              var options = {
                showLink: false,
                displaylogo: false,
                displayModeBar: s.displayModeBar,
                modeBarButtonsToRemove: ['sendDataToCloud'] //, 'select2d', 'lasso2d']
              };

              var data = this.data;
              var rect = this.graph.getBoundingClientRect();

              var old = this.layout;
              this.layout = $.extend(true, {}, this.panel.pconfig.layout);
              this.layout.height = this.height;
              this.layout.width = rect.width;
              if (old) {
                this.layout.xaxis.title = old.xaxis.title;
                this.layout.yaxis.title = old.yaxis.title;
              }

              console.log('drawing', this.graph, data, this.layout, options);
              Plotly.newPlot(this.graph, data, this.layout, options);

              if (false) {
                this.graph.on('plotly_hover', function (data, xxx) {
                  console.log('HOVER!!!', data, xxx, _this2.mouse);
                  if (data.points.length > 0) {
                    var idx = 0;
                    var pt = data.points[idx];

                    var body = '<div class="graph-tooltip-time">' + pt.pointNumber + '</div>';
                    body += "<center>";
                    body += pt.x + ', ' + pt.y;
                    body += "</center>";

                    _this2.$tooltip.html(body).place_tt(_this2.mouse.pageX + 10, _this2.mouse.pageY);
                  }
                }).on('plotly_unhover', function (data) {
                  _this2.$tooltip.detach();
                });
              }

              this.graph.on('plotly_selected', function (data) {
                var range = {
                  from: moment.utc(data.range.x[0]),
                  to: moment.utc(data.range.x[1])
                };

                _this2.timeSrv.setTime(range);

                // rebuild the graph after query
                if (_this2.graph) {
                  Plotly.Plots.purge(_this2.graph);
                  _this2.graph.innerHTML = '';
                  _this2.initalized = false;
                }
              });
            } else {
              Plotly.redraw(this.graph);
            }

            if (this.sizeChanged && this.graph && this.layout) {
              var rect = this.graph.getBoundingClientRect();
              this.layout.width = rect.width;
              Plotly.Plots.resize(this.graph);
            }
            this.sizeChanged = false;
            this.initalized = true;
          }
        }, {
          key: 'getRandomColor',
          value: function getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
              color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
          }
        }, {
          key: 'findKeys',
          value: function findKeys(obj, prefix) {
            var _this3 = this;

            var allKeys = {};
            prefix = prefix || [];
            Object.keys(obj).forEach(function (key) {
              var value = obj[key];
              var prefixedKey = prefix.concat(key);
              if (value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                var nestedKeys = _this3.findKeys(value, prefixedKey);
                Object.keys(nestedKeys).forEach(function (key) {
                  allKeys[key] = nestedKeys[key];
                });
              } else {
                allKeys[prefixedKey.join('.')] = prefixedKey;
              }
            });
            return allKeys;
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataQuery) {
            var _this4 = this;

            // We recive a list of data objects, one from each query specified.
            console.log('this is', this);
            console.log('data received is', dataQuery);

            this.traces = {};
            this.displayOptions = {};
            for (var i = 0; i < this.panel.targets.length; i++) {
              this.traces[this.panel.targets[i].refId] = {};
              this.displayOptions[this.panel.targets[i].refId] = {};
            }
            // How to clear the data without assigning a new array
            this.data.length = 0;

            var cfg = this.panel.pconfig;
            var mapping = cfg.mapping;
            var colors = $.extend(true, {}, this.initialColors);

            var _loop = function _loop(data_group) {
              // Once we can determine the data source, we can remove this hack
              var refId = void 0;
              if (dataQuery.length != _this4.panel.targets.length) {
                refId = _this4.panel.targets[0].refId;
              } else {
                refId = _this4.panel.targets[data_group].refId;
              }

              var dataObject = dataQuery[data_group];
              var trace = {
                type: cfg.settings.mode,
                x: [],
                y: [],
                name: dataObject.type == 'docs' ? mapping.y : dataObject.target,
                mode: cfg.settings.mode
              };

              _this4.traces[refId][dataObject.target] = trace;

              var datapoints = dataObject.datapoints;

              if (dataObject.type == 'docs') {
                var _loop2 = function _loop2(_j) {
                  var point = datapoints[_j];
                  var esKeys = _this4.findKeys(point);
                  Object.keys(esKeys).forEach(function (key) {
                    var esKeyLookup = esKeys[key];
                    _this4.displayOptions[refId][key] = function (obj) {
                      var val = obj;
                      for (var _i = 0; _i < esKeyLookup.length; _i++) {
                        val = val[esKeyLookup[_i]];
                      }
                      return val;
                    };
                  });
                };

                // Because ES has nested keys, we want to expose these to the user. To do this, we
                // prove the dot notation string the user can select, but on the backend, we have to
                // transverse the object to retrieve the value. This provides a function for each
                // index the user can select that will retries the value from the provided data
                // structure

                for (var _j = 0; _j < datapoints.length; _j++) {
                  _loop2(_j);
                }
              } else {
                var _loop3 = function _loop3(_j2) {
                  _this4.displayOptions[refId][_j2] = function (obj) {
                    return obj[_j2];
                  };
                };

                for (var _j2 = 0; _j2 < datapoints[0].length; _j2++) {
                  _loop3(_j2);
                }
              }

              // Figure out what index is going to be X and which will be Y
              // The default return is [value, timestamp] from ES date histogram Count
              var xIndex = function xIndex(obj) {
                // On the first switch to raw document mode, mapping.x may not be defined or still retain its value from a
                // previous selection
                if (mapping.x !== null && _this4.displayOptions[refId][mapping.x]) {
                  return _this4.displayOptions[refId][mapping.x](obj);
                } else {
                  return obj[mapping.x || 1];
                }
              };
              var yIndex = function yIndex(obj) {
                if (mapping.y !== null && _this4.displayOptions[refId][mapping.y]) {
                  return _this4.displayOptions[refId][mapping.y](obj);
                } else {
                  return obj[mapping.y || 0];
                }
              };
              var zIndex = function zIndex(obj) {
                if (mapping.z !== null && _this4.displayOptions[refId][mapping.z]) {
                  return _this4.displayOptions[refId][mapping.z](obj);
                } else {
                  return obj[mapping.z || 2];
                }
              };

              for (j = 0; j < datapoints.length; j++) {
                var point = datapoints[j];
                var xdata = void 0,
                    ydata = void 0,
                    zdata = void 0;
                if (refId == mapping.x_query) {
                  var data = xIndex(point);
                  if (Array.isArray(data)) {
                    xdata = data[0];
                  } else {
                    xdata = data;
                  }
                }
                if (refId == mapping.y_query) {
                  var _data = yIndex(point);
                  if (Array.isArray(_data)) {
                    ydata = _data[0];
                  } else {
                    ydata = _data;
                  }
                }
                if (typeof xdata !== 'undefined' && typeof ydata !== 'undefined') {
                  trace.x.push(xdata);
                  trace.y.push(ydata);
                }
              }

              trace.marker = $.extend(true, {}, cfg.settings.marker);
              trace.line = $.extend(true, {}, cfg.settings.line);
              if (cfg.settings.marker.color === null) {
                trace.marker.color = colors['marker'].pop() || _this4.getRandomColor();
              }
              if (cfg.settings.line.color === null) {
                trace.line.color = colors['line'].pop() || _this4.getRandomColor();
              }

              _this4.data.push(trace);
            };

            for (var data_group = 0; data_group < dataQuery.length; data_group++) {
              var j;

              _loop(data_group);
            }

            this.render();
          }
        }, {
          key: 'onConfigChanged',
          value: function onConfigChanged() {
            console.log("Config changed...");
            if (this.graph) {
              Plotly.Plots.purge(this.graph);
              this.graph.innerHTML = '';
              this.initalized = false;
            }

            var cfg = this.panel.pconfig;
            for (var i = 0; i < this.data.length; i++) {
              this.data[i].type = cfg.settings.type;
              this.data[i].mode = cfg.settings.mode;
            }

            var axis = [this.panel.pconfig.layout.xaxis, this.panel.pconfig.layout.yaxis];
            for (var _i2 = 0; _i2 < axis.length; _i2++) {
              if (axis[_i2].rangemode === 'between') {
                if (axis[_i2].range == null) {
                  axis[_i2].range = [0, null];
                }
              } else {
                axis[_i2].range = null;
              }
            }
            this.refresh();
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            var _this5 = this;

            this.graph = elem.find('.plotly-spot')[0];
            this.initalized = false;
            elem.on('mousemove', function (evt) {
              _this5.mouse = evt;
            });
          }
        }, {
          key: 'getSymbolSegs',
          value: function getSymbolSegs() {
            var _this6 = this;

            var txt = ["circle", "circle-open", "circle-dot", "circle-open-dot", "square", "square-open", "square-dot", "square-open-dot", "diamond", "diamond-open", "diamond-dot", "diamond-open-dot", "cross", "cross-open", "cross-dot", "cross-open-dot", "x", "x-open", "x-dot", "x-open-dot", "triangle-up", "triangle-up-open", "triangle-up-dot", "triangle-up-open-dot", "triangle-down", "triangle-down-open", "triangle-down-dot", "triangle-down-open-dot", "triangle-left", "triangle-left-open", "triangle-left-dot", "triangle-left-open-dot", "triangle-right", "triangle-right-open", "triangle-right-dot", "triangle-right-open-dot", "triangle-ne", "triangle-ne-open", "triangle-ne-dot", "triangle-ne-open-dot", "triangle-se", "triangle-se-open", "triangle-se-dot", "triangle-se-open-dot", "triangle-sw", "triangle-sw-open", "triangle-sw-dot", "triangle-sw-open-dot", "triangle-nw", "triangle-nw-open", "triangle-nw-dot", "triangle-nw-open-dot", "pentagon", "pentagon-open", "pentagon-dot", "pentagon-open-dot", "hexagon", "hexagon-open", "hexagon-dot", "hexagon-open-dot", "hexagon2", "hexagon2-open", "hexagon2-dot", "hexagon2-open-dot", "octagon", "octagon-open", "octagon-dot", "octagon-open-dot", "star", "star-open", "star-dot", "star-open-dot", "hexagram", "hexagram-open", "hexagram-dot", "hexagram-open-dot", "star-triangle-up", "star-triangle-up-open", "star-triangle-up-dot", "star-triangle-up-open-dot", "star-triangle-down", "star-triangle-down-open", "star-triangle-down-dot", "star-triangle-down-open-dot", "star-square", "star-square-open", "star-square-dot", "star-square-open-dot", "star-diamond", "star-diamond-open", "star-diamond-dot", "star-diamond-open-dot", "diamond-tall", "diamond-tall-open", "diamond-tall-dot", "diamond-tall-open-dot", "diamond-wide", "diamond-wide-open", "diamond-wide-dot", "diamond-wide-open-dot", "hourglass", "hourglass-open", "bowtie", "bowtie-open", "circle-cross", "circle-cross-open", "circle-x", "circle-x-open", "square-cross", "square-cross-open", "square-x", "square-x-open", "diamond-cross", "diamond-cross-open", "diamond-x", "diamond-x-open", "cross-thin", "cross-thin-open", "x-thin", "x-thin-open", "asterisk", "asterisk-open", "hash", "hash-open", "hash-dot", "hash-open-dot", "y-up", "y-up-open", "y-down", "y-down-open", "y-left", "y-left-open", "y-right", "y-right-open", "line-ew", "line-ew-open", "line-ns", "line-ns-open", "line-ne", "line-ne-open", "line-nw", "line-nw-open"];

            var segs = [];
            _.forEach(txt, function (val) {
              segs.push(_this6.uiSegmentSrv.newSegment(val));
            });
            return this.q.when(segs);
          }
        }]);

        return PlotlyPanelCtrl;
      }(MetricsPanelCtrl));

      PlotlyPanelCtrl.templateUrl = 'module.html';

      _export('PanelCtrl', PlotlyPanelCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
