/* -------- VARIABLES -------- */
var FieldsEnum = {
  "Country": 0,
  "Datatype": 1,
  "Year": 2,
  "Value": 3,
}
Object.freeze(FieldsEnum);

var MAX_POP = 100000000;
Object.freeze(MAX_POP);

// json data
var population_data = {};
var migration_data = {};
var grouping_data = {};

var arcs = [];
// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, MAX_POP]).range(['Gainsboro', '#9acd32']);

var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

var map;
var global_rotation = [90,-30];

var current_country = 'USA';


// hacky hacky
var pop_loaded = false, mig_loaded = false, group_loaded = false;


/*  -------- DATA LOADING -------- */
$.getJSON("./data/pop_by_year.json", function(data) {
  population_data = data;
  console.log('Loaded population data.');
  pop_loaded = true;
  colorMap(1959);
});

$.getJSON("./data/migration.json", function(data) {
  migration_data = data;
  // console.log(data);
  console.log('Loaded migration data.');
  mig_loaded = true;
});

$.getJSON("./data/UN_groupings.json", function(data) {
  grouping_data = data;
  console.log('Loaded UN grouping data.');
  group_loaded = true;
  // populateArcs();
  redraw();
});


/* -------- FUNCTIONS -------- */

function colorMap(year) {
  if (!(year in population_data)) {
    return;
  }
  for (var key in population_data[year]) {
    var pop = parseInt(population_data[year][key].population);
    pop = pop < MAX_POP ? pop : MAX_POP - 1;
    if (population_data[year][key].population) {
      updateColor(
        key,
        population_data[year][key].population.toString()
      );
    }
  }
  // updateColor('ATA', 0);
}


function updateColor(country, population) {
  var data = {}
  data[country] = colors(parseInt(population));
  // data[country] = colors(Math.log(parseInt(population)));
  if (country == 'CHN') {
    console.log(Math.log(parseInt(population)));
    console.log(colors(parseInt(population)));
  }
  map.updateChoropleth(data);
}

function getCoords(country_name) {
  var coords = {};
  var country = getISOOfCountry(country_name);
  for (var key in grouping_data) {
    // console.log(grouping_data[key]);
    if (grouping_data[key]['ISO-alpha3 Code'] == country) {
      coords.lat = grouping_data[key].lat;
      coords.lon = grouping_data[key].lng;
      return coords;
    }
  }
  // return grouping_data[]
  return null;
}

function getISOOfCountry(country_name) {
  for (var key in grouping_data) {
    if (country_name == grouping_data[key]['Country or Area']) {
      return grouping_data[key]['ISO-alpha3 Code'];
    }
  }
}

function countryInMigData(country_name) {
  for (var key in migration_data) {
    // console.log(migration_data[key]);
    if (migration_data[key].name == country_name) {
      return true;
    }
  }
  return false;
}


function getImmigrationData(country_name) {
  for (var key in migration_data) {
    // console.log(migration_data[key]);
    if (migration_data[key].name == country_name) {
      return migration_data[key].immigration;
    }
  }
}

function getEmigrationData(country_name) {

}


function populateArcs(source, destinations) {
  source = "United States of America";
  // curryear - 1980
  // immigration first  
  // destinations = ['MEX', 'CHL', 'COL'];
  var data = {};
  var source_coords = getCoords(source);
  // console.log(source_coords);

  if (!countryInMigData(source)) {
    console.log(source + ' not found in migration dataset');
    return; //error
  }

  var mig_data = getImmigrationData(source);
  // console.log(mig_data);
  for (var key in mig_data) {
    if (!getCoords(mig_data[key].name)) {
      continue;
    }
    data[getISOOfCountry(mig_data[key].name)] = getCoords(mig_data[key].name);
  }

  // for (var key in migration_data) {
  //   if (migration_data[key])
  //   data[migration_data[key]] = getCoords(destinations[key]);
  // }
  var arcs = [];
  for (var d in data) {
    // console.log(data);
    // console.log(data[d]);
    // console.log(d);
    if (!data[d].lat || !data[d].lon) {
      console.log('Null Island');
      console.log(d);
      continue;
    }
    arcs.push(
      { 
        origin: {
          latitude: source_coords.lat,
          longitude: source_coords.lon,
        },
        destination: {
          latitude: data[d].lat,
          longitude: data[d].lon,
        }
      }
    );
  }
  console.log(arcs);
  return arcs;
}

function populateBubbles(source, destinations) {
  source = 'USA';
  destinations = ['MEX', 'CHL', 'COL'];
  var data = {
    USA: {
      lat: 38,
      lon: -97,
      pop: 20000,
    },
    MEX: {
      lat: 23,
      lon: -102,
      pop: 100,
    },
    CHL: {
      lat: -30,
      lon: -71,
      pop: 200,
    },
    COL: {
      lat: 4,
      lon: -72,
      pop: 300,
    },
  }
  var bubbles = [];
  for (var dest in destinations) {
    bubbles.push(makeBubble(data[destinations[dest]]));
  }
  return bubbles;
}


function makeBubble(entry) {
  return {
    latitude: entry.lat,
    longitude: entry.lon,
    population: entry.pop, 
    radius: 20
  }
}


// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  curryear.innerHTML = this.value;
  colorMap(this.value);
}


function redraw() {
  d3.select("#world").html('');
  init();
  colorMap(curryear.innerHTML);
}// redraw

function init() {
  map = new Datamap({//need global var
    scope: 'world',
    // responsive: true,
    element: document.getElementById('world'),
    projection: 'mercator',
    fills: {
      defaultFill: '#9acd32',
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
        return geo['fillColor'] || 'rgba(30,30,30,0.5)';
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
    }
  });

  arcs = populateArcs();
  // map.bubbles(
  //   populateBubbles(),
  //   {
  //     popupTemplate: function(geo, data) {
  //       return "<div class='hoverinfo'>Population: " + data.population + "";
  //     }
  //   }
  // );


  map.arc(arcs,
    {
      greatArc: true,
      animationSpeed: 0
    }
  );

  // map.svg.selectAll('path.datamaps-arc')
  //   .transition()
  //   .delay(function (d) { return 50 * 20; })
  //   .duration(800)
  //   .remove();
}// init


function dataLoaded() {
  return pop_loaded && mig_loaded && group_loaded;
}

$( "html" ).click(function() {
  redraw();
});

// redraw();
              