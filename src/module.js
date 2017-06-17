
import {MetricsPanelCtrl} from  'app/plugins/sdk';

import _ from 'lodash';
import moment from 'moment';
import angular from 'angular';

import * as Plotly from './external/plotly';

class PlotlyPanelCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $q, $rootScope, $timeout, $window, timeSrv, uiSegmentSrv) {
    super($scope, $injector);

    this.$rootScope = $rootScope;
    this.timeSrv = timeSrv;
    this.uiSegmentSrv = uiSegmentSrv;
    this.q = $q;

    this.data = [];
    this.traces = {};
    this.displayOptions = {};
    this.sizeChanged = true;
    this.initalized = false;

    this.$tooltip = $('<div id="tooltip" class="graph-tooltip">');


    var dcfg = {
      mapping: {
        x: null,
        y: null,
        z: null,
        color: null,
        size: null,
        x_query: 0,
        y_query: 0,
        z_query: 0,
      },
      settings: {
        type: 'scatter',
        mode: 'lines+markers',
        displayModeBar: false,
        line: {
          color : null,
          width : 6,
          dash  : 'solid',
          shape : 'linear'
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
          r: 20,
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
          xaxis:{title: 'X AXIS'},
          yaxis:{title: 'Y AXIS'},
          zaxis:{title: 'Z AXIS'},
        },
      }
    };

    // There are a bunch of default settings we want to override from grafana's settings
    // this.panel.pconfig.settings.marker.color = null;
    // this.panel.pconfig.settings.marker.showscale = false;
    // this.panel.pconfig.settings.marker.size = 12;
    // this.panel.pconfig.settings.line.color = null;
    // this.panel.pconfig.layout.showlegend = true;

    this.panel.pconfig = $.extend(true, dcfg, this.panel.pconfig);

    var cfg = this.panel.pconfig;
    this.layout = $.extend(true, {}, this.panel.pconfig.layout);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('panel-initialized', this.onPanelInitalized.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));

    angular.element($window).bind('resize', this.onResize.bind(this) );
  }

  onResize() {
    this.sizeChanged = true;
  }

  onDataError(err) {
    this.seriesList = [];
    this.render([]);
    console.log("onDataError", err);
  }

  onRefresh() {
    if(this.graph && this.initalized) {
      Plotly.redraw(this.graph);
    }
  }

  onInitEditMode() {
    this.addEditorTab('Display', 'public/plugins/natel-plotly-panel/tab_display.html',2);
  //  this.editorTabIndex = 1;
    this.refresh();
    this.segs = {
      symbol: this.uiSegmentSrv.newSegment({value: this.panel.pconfig.settings.marker.symbol })
    };
    this.subTabIndex = 0; // select the options

    var cfg = this.panel.pconfig;
    this.axis = [
      {
        disp: 'X Axis',
        query_idx: (query_idx) => {if (query_idx) { cfg.mapping.x_query = query_idx} return cfg.mapping.x_query},
        idx: 1,
        config: cfg.layout.xaxis,
        metric: (name) => { if(name) { cfg.mapping.x=name; } return cfg.mapping.x; }
      },
      {
        disp: 'Y Axis',
        query_idx: (query_idx) => {if (query_idx) { cfg.mapping.y_query = query_idx} return cfg.mapping.y_query},
        idx: 2,
        config: cfg.layout.yaxis,
        metric: (name) => { if(name) { cfg.mapping.y=name; } return cfg.mapping.y; }
        },
      {
        disp: 'Z Axis',
        query_idx: (query_idx) => {if (query_idx) { cfg.mapping.z_query = query_idx} return cfg.mapping.z_query},
        idx: 3,
        config: cfg.layout.yaxis,
        metric: (name) => { if(name) { cfg.mapping.z=name; } return cfg.mapping.z; }
      }
    ];
  }

  isAxisVisible(axis) {
    if(axis.idx==3) {
      return this.panel.pconfig.settings.type === 'scatter3d';
    }
    return true;
  }

  onSegsChanged() {
    this.panel.pconfig.settings.marker.symbol = this.segs.symbol.value;
    this.onConfigChanged();

    console.log( this.segs.symbol, this.panel.pconfig );
  }

  onPanelInitalized() {
    this.onConfigChanged();
  }

  onRender() {

    if(!this.initalized) {
      var s = this.panel.pconfig.settings;

      var options = {
        showLink: false,
        displaylogo: false,
        displayModeBar: s.displayModeBar,
        modeBarButtonsToRemove: ['sendDataToCloud'] //, 'select2d', 'lasso2d']
      }

      var data = this.data;
      var rect = this.graph.getBoundingClientRect();

      var old = this.layout;
      this.layout = $.extend(true, {}, this.panel.pconfig.layout );
      this.layout.height = this.height;
      this.layout.width = rect.width;
      if(old) {
        this.layout.xaxis.title = old.xaxis.title;
        this.layout.yaxis.title = old.yaxis.title;
      }

      console.log('drawing', this.graph, data, this.layout, options);
      Plotly.newPlot(this.graph, data, this.layout, options);

      if(false) {
        this.graph.on('plotly_hover', (data, xxx) => {
          console.log( 'HOVER!!!', data, xxx, this.mouse );
          if(data.points.length>0) {
            var idx = 0;
            var pt = data.points[idx];

            var body = '<div class="graph-tooltip-time">'+ pt.pointNumber +'</div>';
            body += "<center>";
            body += pt.x + ', '+pt.y;
            body += "</center>";

            this.$tooltip.html( body ).place_tt( this.mouse.pageX + 10, this.mouse.pageY );
          }
        }).on('plotly_unhover', (data) => {
          this.$tooltip.detach();
        });
      }

      this.graph.on('plotly_selected',  (data) => {
        const range = {
          from: moment.utc(data.range.x[0]),
          to: moment.utc(data.range.x[1])
        };

        this.timeSrv.setTime(range);

        // rebuild the graph after query
        if(this.graph) {
          Plotly.Plots.purge(this.graph);
          this.graph.innerHTML = '';
          this.initalized = false;
        }
      });
    }
    else {
      Plotly.redraw(this.graph);
    }

    if(this.sizeChanged && this.graph && this.layout) {
      var rect = this.graph.getBoundingClientRect();
      this.layout.width = rect.width;
      Plotly.Plots.resize(this.graph);
    }
    this.sizeChanged = false;
    this.initalized = true;
  }

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  findKeys(obj, prefix) {
    let allKeys = {};
    prefix = prefix || [];
    Object.keys(obj).forEach((key) => {
      let value = obj[key];
      const prefixedKey = prefix.concat(key);
      if (typeof value === 'object') {
        Object.keys(this.findKeys(value, prefixedKey)).forEach((key) => {
          allKeys[key] = prefixedKey;
        });
      } else {
        allKeys[prefixedKey.join('.')] = prefixedKey;
      }
    });
    return allKeys;
  }

  onDataReceived(dataQuery) {
    // We recive a list of data objects, one from each query specified.
    console.log('this is', this);
    console.log('data received is', dataQuery);

    this.traces = {};
    this.displayOptions = {};
    for(let i=0; i<this.panel.targets.length; i++) {
      this.traces[this.panel.targets[i].refId] = {};
      this.displayOptions[this.panel.targets[i].refId] = {};
    }
    // How to clear the data without assigning a new array
    this.data.length = 0;

    let cfg = this.panel.pconfig;
    let mapping = cfg.mapping;

    for(let data_group=0; data_group<dataQuery.length; data_group++){
      // Once we can determine the data source, we can remove this hack
      let refId;
      if (dataQuery.length != this.panel.targets.length){
        refId = this.panel.targets[0].refId;
      } else {
        refId = this.panel.targets[data_group].refId;
      }

      let dataObject = dataQuery[data_group];
      let trace = {
        type: cfg.settings.mode,
        x: [],
        y: [],
        name: dataObject.target,
        mode: cfg.settings.mode
      };

      this.traces[refId][dataObject.target] = trace;



      let datapoints = dataObject.datapoints;

      if (dataObject.type == 'docs') {
        // Because ES has nested keys, we want to expose these to the user. To do this, we
        // prove the dot notation string the user can select, but on the backend, we have to
        // transverse the object to retrieve the value. This provides a function for each
        // index the user can select that will retries the value from the provided data
        // structure

        for(let j=0; j<datapoints.length; j++) {
          const point = datapoints[j];
          let esKeys = this.findKeys(point);
          Object.keys(esKeys).forEach((key) => {
            const esKeyLookup = esKeys[key];
            this.displayOptions[refId][key] = (obj) => {
              let val = obj;
              for(let i=0; i<esKeyLookup.length; i++){
                val = val[esKeyLookup[i]];
              }
              return val;
            }
          });
        }
      } else {
        for(let j=0; j<datapoints[0].length; j++) {
          this.displayOptions[refId][j] = (obj) => {
            return obj[j];
          };
        }
      }

      // Figure out what index is going to be X and which will be Y
      // The default return is [value, timestamp] from ES date histogram Count
      let xIndex = (obj) => {
        if (mapping.x) {
          return this.displayOptions[refId][mapping.x](obj);
        } else {
          return obj[mapping.x || 1];
        }
      };
      let yIndex = (obj) => {
        if (mapping.x) {
          return this.displayOptions[refId][mapping.y](obj);
        } else {
          return obj[mapping.y || 0];
        }
      };
      let zIndex = (obj) => {
        if (mapping.z) {
          return this.displayOptions[refId][mapping.z](obj);
        } else {
          return obj[mapping.z || 2];
        }
      };


      for(var j=0; j<datapoints.length; j++) {
        const point = datapoints[j];
        let xdata, ydata, zdata;
        if (refId == mapping.x_query) {
          let data = xIndex(point);
          if(Array.isArray(data)) {
            xdata = data[0];
          } else {
            xdata = data;
          }
        }
        if (refId == mapping.y_query) {
          let data = yIndex(point);
          if(Array.isArray(data)) {
            ydata = data[0];
          } else {
            ydata = data;
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
        trace.marker.color = this.getRandomColor();
      }
      if (cfg.settings.line.color === null) {
        trace.line.color = this.getRandomColor();
      }

      this.data.push(trace);
    }

    this.render();
  }

  onConfigChanged() {
    console.log( "Config changed...");
    if(this.graph) {
      Plotly.Plots.purge(this.graph);
      this.graph.innerHTML = '';
      this.initalized = false;
    }

    var cfg = this.panel.pconfig;
    for(let i=0; i<this.data.length; i++) {
      this.data[i].type = cfg.settings.type;
      this.data[i].mode = cfg.settings.mode;
    }

    var axis = [ this.panel.pconfig.layout.xaxis, this.panel.pconfig.layout.yaxis];
    for(let i=0; i<axis.length; i++) {
      if( axis[i].rangemode === 'between' ) {
        if( axis[i].range == null) {
          axis[i].range = [0, null];
        }
      }
      else {
        axis[i].range = null;
      }
    }
    this.refresh();
  }

  link(scope, elem, attrs, ctrl) {
    this.graph = elem.find('.plotly-spot')[0];
    this.initalized = false;
    elem.on( 'mousemove', (evt) => {
      this.mouse = evt;
    });
  }

  //---------------------------


  getSymbolSegs()
  {
    var txt = [
"circle","circle-open","circle-dot","circle-open-dot",
"square","square-open","square-dot","square-open-dot",
"diamond","diamond-open",
"diamond-dot","diamond-open-dot",
"cross","cross-open",
"cross-dot","cross-open-dot",
"x","x-open","x-dot","x-open-dot",
"triangle-up",
"triangle-up-open",
"triangle-up-dot",
"triangle-up-open-dot",
"triangle-down",
"triangle-down-open",
"triangle-down-dot",
"triangle-down-open-dot",
"triangle-left",
"triangle-left-open",
"triangle-left-dot",
"triangle-left-open-dot",
"triangle-right",
"triangle-right-open",
"triangle-right-dot",
"triangle-right-open-dot",
"triangle-ne",
"triangle-ne-open",
"triangle-ne-dot",
"triangle-ne-open-dot",
"triangle-se",
"triangle-se-open",
"triangle-se-dot",
"triangle-se-open-dot",
"triangle-sw",
"triangle-sw-open",
"triangle-sw-dot",
"triangle-sw-open-dot",
"triangle-nw",
"triangle-nw-open",
"triangle-nw-dot",
"triangle-nw-open-dot",
"pentagon",
"pentagon-open",
"pentagon-dot",
"pentagon-open-dot",
"hexagon",
"hexagon-open",
"hexagon-dot",
"hexagon-open-dot",
"hexagon2",
"hexagon2-open",
"hexagon2-dot",
"hexagon2-open-dot",
"octagon",
"octagon-open",
"octagon-dot",
"octagon-open-dot",
"star",
"star-open",
"star-dot",
"star-open-dot",
"hexagram",
"hexagram-open",
"hexagram-dot",
"hexagram-open-dot",
"star-triangle-up",
"star-triangle-up-open",
"star-triangle-up-dot",
"star-triangle-up-open-dot",
"star-triangle-down",
"star-triangle-down-open",
"star-triangle-down-dot",
"star-triangle-down-open-dot",
"star-square",
"star-square-open",
"star-square-dot",
"star-square-open-dot",
"star-diamond",
"star-diamond-open",
"star-diamond-dot",
"star-diamond-open-dot",
"diamond-tall",
"diamond-tall-open",
"diamond-tall-dot",
"diamond-tall-open-dot",
"diamond-wide",
"diamond-wide-open",
"diamond-wide-dot",
"diamond-wide-open-dot",
"hourglass",
"hourglass-open",
"bowtie",
"bowtie-open",
"circle-cross",
"circle-cross-open",
"circle-x",
"circle-x-open",
"square-cross",
"square-cross-open",
"square-x",
"square-x-open",
"diamond-cross",
"diamond-cross-open",
"diamond-x",
"diamond-x-open",
"cross-thin",
"cross-thin-open",
"x-thin",
"x-thin-open",
"asterisk",
"asterisk-open",
"hash",
"hash-open",
"hash-dot",
"hash-open-dot",
"y-up",
"y-up-open",
"y-down",
"y-down-open",
"y-left",
"y-left-open",
"y-right",
"y-right-open",
"line-ew",
"line-ew-open",
"line-ns",
"line-ns-open",
"line-ne",
"line-ne-open",
"line-nw",
"line-nw-open"
    ];

    var segs = [];
    _.forEach(txt, (val) => {
      segs.push( this.uiSegmentSrv.newSegment( val ) );
    });
    return this.q.when( segs );
  }
}
PlotlyPanelCtrl.templateUrl = 'module.html';

export {
  PlotlyPanelCtrl as PanelCtrl
};


