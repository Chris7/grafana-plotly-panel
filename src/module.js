
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
      },
      settings: {
        type: 'scatter',
        mode: 'lines+markers',
        displayModeBar: false,
        line: {
          color : '#005f81',
          width : 6,
          dash  : 'solid',
          shape : 'linear'
        },
        marker: {
          size: 30,
          symbol: 'circle',
          color: '#33B5E5',
          colorscale: 'YIOrRd',
          sizemode: 'diameter',
          sizemin: 3,
          sizeref: 0.2,
          line: {
            color: '#DDD',
            width: 0
          },
          showscale: true
        },
        color_option: 'ramp'
      },
      layout: {
        autosize: false,
        showlegend: false,
        legend: {"orientation": "v"},
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

    // Make sure it has the default settings (may have more!)
    this.panel.pconfig = $.extend(true, dcfg, this.panel.pconfig );

    var cfg = this.panel.pconfig;
    this.layout = $.extend(true, {}, this.panel.pconfig.layout );

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
      { disp: 'X Axis', idx: 1, config: cfg.layout.xaxis, metric: (name) => { if(name) { cfg.mapping.x=name; } return cfg.mapping.x; }},
      { disp: 'Y Axis', idx: 2, config: cfg.layout.yaxis, metric: (name) => { if(name) { cfg.mapping.y=name; } return cfg.mapping.y; }},
      { disp: 'Z Axis', idx: 3, config: cfg.layout.yaxis, metric: (name) => { if(name) { cfg.mapping.z=name; } return cfg.mapping.z; }}
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

      // this.graph.on('plotly_selected',  (data) => {
      //
      //   if(data.points.length == 0) {
      //     console.log( "Nothign Selected", data)
      //     return;
      //   }
      //
      //   console.log( "SELECTED", data)
      //
      //   var min = Number.MAX_SAFE_INTEGER;
      //   var max = Number.MIN_SAFE_INTEGER;
      //
      //   for(var i=0; i < data.points.length; i++){
      //     var idx = data.points[i].pointNumber;
      //     var ts = this.trace.ts[idx];
      //     min = Math.min( min, ts);
      //     max = Math.max( max, ts);
      //   }
      //
      //   min -= 1000;
      //   max += 1000;
      //
      //   var range = {from: moment.utc(min), to: moment.utc(max) };
      //
      //   console.log( 'SELECTED!!!', min, max, data.points.length, range );
      //
      //   this.timeSrv.setTime(range);
      //
      //   // rebuild the graph after query
      //   if(this.graph) {
      //     Plotly.Plots.purge(this.graph);
      //     this.graph.innerHTML = '';
      //     this.initalized = false;
      //   }
      // });
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

  onDataReceived(dataSeries) {
    this.traces = {};
    this.data = [];

    for(let data_idx=0; data_idx<dataSeries.length; data_idx++){
      let dataObject = dataSeries[data_idx];
      let trace = {
        type: 'scatter',
        x: [],
        y: [],
        name: dataObject.target
      };

      this.traces[dataObject.target] = trace;

      let cfg = this.panel.pconfig;
      let mapping = cfg.mapping;

      let datapoints = dataObject.datapoints;
      for(var j=0; j<datapoints.length; j++) {
        trace.x.push( datapoints[j][0] );
        trace.y.push( datapoints[j][1] );
      }

      trace.marker = $.extend(true, {}, cfg.settings.marker);
      trace.line = $.extend(true, {}, cfg.settings.line);
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


