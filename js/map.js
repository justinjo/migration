/* -------- VARIABLES -------- */
var MigrationEnum = {
  'immigration': 1,
  'emigration': 2,
};
Object.freeze(MigrationEnum);

var MAX_POP = 10000;
Object.freeze(MAX_POP);

// json data
var migration_data = [], region_data = [];

// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, MAX_POP]).range(['Gainsboro', '#9acd32']);

var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

var map;
var current_country = 'DEU';
var current_year = slider.value;
var current_mig_method = MigrationEnum.immigration;

var mig_loaded = false, group_loaded = false;


/*  -------- DATA LOADING -------- */

$.getJSON("./data/migration.json", function(data) {
  migration_data = data;
  console.log('Loaded migration data.');
  mig_loaded = true;
  if (reg_loaded) {
    renderMap();
  }
  // checkData();
  generateSelectors()
});

$.getJSON("./data/regions.json", function(data) {
  region_data = data;
  console.log('Loaded region data.');
  reg_loaded = true;
  if (mig_loaded) {
    renderMap();
  }
})



function checkData() {
  for (var i=0; i<migration_data.length; i++) {
    for (var j=0; j<migration_data[i].immigration.length; j++) {
      if (!migration_data[i].immigration[j].ISOa3) {
        console.log(migration_data[i].immigration[j].country_name);
      }
    }
    for (var j=0; j<migration_data[i].emigration.length; j++) {
      if (!migration_data[i].emigration[j].ISOa3) {
        console.log(migration_data[i].emigration[j].country_name);
      }
    }
  }
}


/* -------- FUNCTIONS -------- */

/* ---- Grouping Functions ---- */

function getISOOfCountry(country) {
  for (var i=0; i<region_data.length; i++) {
    if (country == region_data[i].country_name) {
      return region_data[i].ISOa3;
    }
  }
  console.log('Could not get ISO of ' + country);
}

function getCoords(iso) {
  for (var i=0; i<region_data.length; i++) {
    if (region_data[i].ISOa3 == iso) {
      return {
        lat: region_data[i].latitude,
        lon: region_data[i].longitude,
      }
    }
  }
  return null;
}


/* ---- Migration Functions ---- */

function getMigrationEntry(iso) {
  for (var i=0; i<migration_data.length; i++) {
    if (migration_data[i].ISOa3 == iso) {
      return migration_data[i];
    }
  }
  return null;
}

function getImmigrationData(iso) {
  var entry = getMigrationEntry(iso);
  return entry ? entry.immigration : null;
}

function getEmigrationData(iso) {
  var entry = getMigrationEntry(iso);
  return entry ? entry.emigration : null;
}

function countryInMigData(iso) {
  return Boolean(getMigrationEntry(iso));
}


/* ---- Rendering Functions ---- */

function getArcs(source, migration_method) {
  var dest_coords, source_coords = getCoords(source);
  var mig_data; // migration data;
  var arcs = [];

  if (!source_coords) {
    console.log('Error: ' + source + ' does not have coordinates');
    return;
  }
  if (!countryInMigData(source)) {
    console.log('Error: ' + source + ' not found in migration dataset');
    return;
  }

  if (migration_method == MigrationEnum.immigration) {
    mig_data = getImmigrationData(source);
  } else if (migration_method == MigrationEnum.emigration) {
    mig_data = getEmigrationData(source);
  }

  if (!mig_data) {
    console.log('No migration data found for ' + source);
    return;
  }


  for (var i=0; i<mig_data.length; i++) {
    var point = {};
    dest_coords = getCoords(mig_data[i].ISOa3);
    if (!dest_coords) {
      console.log('Failed to get coords for ' + mig_data[i].ISOa3);
      continue;
    }

    // TODO: put in thresholding here
    if (mig_data[i].population_post_1980[slider.value - 1980] < 5000) {
      continue;
    }

    if (migration_method == MigrationEnum.immigration) {
      arcs.push({
        origin: {
          latitude: dest_coords.lat,
          longitude: dest_coords.lon,
        },
        destination: {
          latitude: source_coords.lat,
          longitude: source_coords.lon,
        },
        // options: {
        //   strokeWidth: mig_data[i].population_post_1980[slider.value - 1980]/10000
        // }
      });
    } else if (migration_method == MigrationEnum.emigration) {
      arcs.push({
        origin: {
          latitude: source_coords.lat,
          longitude: source_coords.lon,
        },
        destination: {
          latitude: dest_coords.lat,
          longitude: dest_coords.lon,
        },
        // options: {
        //   strokeWidth: mig_data[i].population_post_1980[slider.value - 1980]/10000
        // }
      });
    }

  }
  return arcs;
}

function renderArcs(arcs) {
  map.arc(arcs);
}

function colorMap(source, year, migration_method) {
  d3.select('#data_info').html('');
  
  if (!countryInMigData(source)) {
    console.log('Error: ' + source + ' not found in migration dataset');
    return;
  }


  var mig_data;

  if (migration_method == MigrationEnum.immigration) {
    mig_data = getImmigrationData(source);
  } else if (migration_method == MigrationEnum.emigration) {
    mig_data = getEmigrationData(source);
  }

  if (!mig_data || mig_data.length == 0) {
    var info_string = 'No ' + (
      migration_method == MigrationEnum.immigration ?
      'immigration' : 'emigration'
    ) + ' data found for ' + source + ' in ' + current_year + '.';
    d3.select('#data_info').html(info_string);
    resetColor();
    return;
  }
  // console.log(mig_data);

  for (var i=0; i<mig_data.length; i++) {
    var population = mig_data[i].population_post_1980[year - 1980];
    updateColor(mig_data[i].ISOa3, population); //.toString()?
  }
}


function updateColor(iso, population) {
  var data = {}
  data[iso] = colors(parseInt(population));
  map.updateChoropleth(data);
}


function resetColor() {
  for (var i=0; i<region_data.length; i++) {
    updateColor(region_data[i].ISOa3, 0);
  }
}


function renderMap() {
  // d3.select("#world").html('');
  new Datamap();
  colorMap(current_country,  slider.value, current_mig_method);
}

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  curryear.innerHTML = this.value;
  current_year = slider.value;
  rerender();
}

$('.toggle').click(function() {
  if (this.checked) {
    current_mig_method = MigrationEnum.emigration; 
  } else {
    current_mig_method = MigrationEnum.immigration;
  }
  // console.log(current_mig_method);
  rerender();
});

function rerender() {
  // console.log('rerendering arcs')
  renderArcs(getArcs(current_country, current_mig_method));
  // console.log('rerendering color')
  colorMap(current_country, slider.value, current_mig_method);
}


function generateSelectors() {
  for (var i=0; i<migration_data.length; i++) {
    var entry = '<option value="' + migration_data[i].ISOa3 + '">' + 
      migration_data[i].country_name + '</option>';
      $('#combobox').append(entry);
  }
}






$('#combobox').change(function() {
  current_country = this.value;
  rerender();
});










// TODO: move to separate file
/* ---- Datamap Zoom Functions ---- */

function Zoom(args) {
  $.extend(this, {
    $buttons:   $(".zoom-button"),
    $info:      $("#zoom-info"),
    scale:      { max: 50, currentShift: 0 },
    $container: args.$container,
    datamap:    args.datamap
  });

  this.init();
}


Zoom.prototype.init = function() {
  var paths = this.datamap.svg.selectAll("path"),
      subunits = this.datamap.svg.selectAll(".datamaps-subunit");

  // preserve stroke thickness
  paths.style("vector-effect", "non-scaling-stroke");

  // disable click on drag end
  subunits.call(
    d3.behavior.drag().on("dragend", function() {
      d3.event.sourceEvent.stopPropagation();
    })
  );

  this.scale.set = this._getScalesArray();
  this.d3Zoom = d3.behavior.zoom().scaleExtent([ 1, this.scale.max ]);

  this._displayPercentage(1);
  this.listen();
};

Zoom.prototype.listen = function() {
  this.$buttons.off("click").on("click", this._handleClick.bind(this));

  this.datamap.svg
    .call(this.d3Zoom.on("zoom", this._handleScroll.bind(this)))
    .on("dblclick.zoom", null); // disable zoom on double-click
};

Zoom.prototype.reset = function() {
  this._shift("reset");
};

Zoom.prototype._handleScroll = function() {
  var translate = d3.event.translate,
      scale = d3.event.scale,
      limited = this._bound(translate, scale);

  this.scrolled = true;

  this._update(limited.translate, limited.scale);
};

Zoom.prototype._handleClick = function(event) {
  var direction = $(event.target).data("zoom");

  this._shift(direction);
};

Zoom.prototype._shift = function(direction) {
  var center = [ this.$container.width() / 2, this.$container.height() / 2 ],
      translate = this.d3Zoom.translate(), translate0 = [], l = [],
      view = {
        x: translate[0],
        y: translate[1],
        k: this.d3Zoom.scale()
      }, bounded;

  translate0 = [
    (center[0] - view.x) / view.k,
    (center[1] - view.y) / view.k
  ];

  if (direction == "reset") {
    view.k = 1;
    this.scrolled = true;
  } else {
    view.k = this._getNextScale(direction);
  }

l = [ translate0[0] * view.k + view.x, translate0[1] * view.k + view.y ];

  view.x += center[0] - l[0];
  view.y += center[1] - l[1];

  bounded = this._bound([ view.x, view.y ], view.k);

  this._animate(bounded.translate, bounded.scale);
};

Zoom.prototype._bound = function(translate, scale) {
  var width = this.$container.width(),
      height = this.$container.height();

  translate[0] = Math.min(
    (width / height)  * (scale - 1),
    Math.max( width * (1 - scale), translate[0] )
  );

  translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));

  return { translate: translate, scale: scale };
};

Zoom.prototype._update = function(translate, scale) {
  this.d3Zoom
    .translate(translate)
    .scale(scale);

  this.datamap.svg.selectAll("g")
    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

  this._displayPercentage(scale);
};

Zoom.prototype._animate = function(translate, scale) {
  var _this = this,
      d3Zoom = this.d3Zoom;

  d3.transition().duration(350).tween("zoom", function() {
    var iTranslate = d3.interpolate(d3Zoom.translate(), translate),
        iScale = d3.interpolate(d3Zoom.scale(), scale);

    return function(t) {
      _this._update(iTranslate(t), iScale(t));
    };
  });
};

Zoom.prototype._displayPercentage = function(scale) {
  var value;

  value = Math.round(Math.log(scale) / Math.log(this.scale.max) * 100);
  this.$info.text(value + "%");
};

Zoom.prototype._getScalesArray = function() {
  var array = [],
      scaleMaxLog = Math.log(this.scale.max);

  for (var i = 0; i <= 10; i++) {
    array.push(Math.pow(Math.E, 0.1 * i * scaleMaxLog));
  }

  return array;
};

Zoom.prototype._getNextScale = function(direction) {
  var scaleSet = this.scale.set,
      currentScale = this.d3Zoom.scale(),
      lastShift = scaleSet.length - 1,
      shift, temp = [];

  if (this.scrolled) {

    for (shift = 0; shift <= lastShift; shift++) {
      temp.push(Math.abs(scaleSet[shift] - currentScale));
    }

    shift = temp.indexOf(Math.min.apply(null, temp));

    if (currentScale >= scaleSet[shift] && shift < lastShift) {
      shift++;
    }

    if (direction == "out" && shift > 0) {
      shift--;
    }

    this.scrolled = false;

  } else {

    shift = this.scale.currentShift;

    if (direction == "out") {
      shift > 0 && shift--;
    } else {
      shift < lastShift && shift++;
    }
  }

  this.scale.currentShift = shift;

  return scaleSet[shift];
};

function Datamap() {
  this.$container = $("#world");
  // this.instance = new Datamaps({
  //   scope: 'world',
  //   element: this.$container.get(0),
  //   projection: 'mercator',
  //   done: this._handleMapReady.bind(this)
  // });
  this.instance = new Datamaps({
    scope: 'world',
    // responsive: true,
    element: document.getElementById('world'),
    projection: 'mercator',
    done: this._handleMapReady.bind(this),
    fills: {
      defaultFill: '#DCDCDC',
      ata: '#D3F5FF',
    },
    data: {
      'ATA': { fillKey: 'ata' },
    },
    geographyConfig: {
      hideAntarctica: 0,
      borderColor: 'rgba(50,50,50,0.2)',
      highlightBorderWidth: 1,
        // don't change color on mouse hover
      highlightFillColor: function(geo) {
        return geo['fillColor'] || 'rgba(255, 165, 0, 0.9)';
      },

      // only change border
      highlightBorderColor: 'rgba(222,222,222,0.5)',

      // show desired information in tooltip
      // popupTemplate: function(geo, data) {
      //   // don't show tooltip if country don't present in dataset
      //   // if (!data) { return ; }
      //   // tooltip content
      //   return ['',
      //     '<div style="opacity:0.7;" class="hoverinfo">% of visitors in ',
      //     ': ',
      //   ''].join('');        
      // }
    },
    arcConfig: {
      strokeColor: 'rgba(221, 28, 119, 0.9)',
      strokeWidth: 2,
      arcSharpness: 1,
      animationSpeed: 500,
      greatArc: true,
    },
  });

  map = this.instance;

  // map.bubbles(
  //   populateBubbles(),
  //   {
  //     popupTemplate: function(geo, data) {
  //       return "<div class='hoverinfo'>Population: " + data.population + "";
  //     }
  //   }
  // );

  renderArcs(getArcs(current_country, current_mig_method));
}

Datamap.prototype._handleMapReady = function(datamap) {
  this.zoom = new Zoom({
    $container: this.$container,
    datamap: datamap
  });
}