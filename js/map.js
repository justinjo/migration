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
var population_data = [], migration_data = [], grouping_data = [], region_data = [];

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
var pop_loaded = false, mig_loaded = false, group_loaded = false, reg_loaded = false;


/*  -------- DATA LOADING -------- */
$.getJSON("./data/pop_by_year.json", function(data) {
  population_data = data;
  console.log('Loaded population data.');
  pop_loaded = true;
  colorMap(1959);
});

$.getJSON("./data/migration.json", function(data) {
  migration_data = data;
  console.log('Loaded migration data.');
  mig_loaded = true;
});

$.getJSON("./data/regions.json", function(data) {
  region_data = data;
  console.log('Loaded region data.');
  reg_loaded = true;
})

$.getJSON("./data/UN_groupings.json", function(data) {
  grouping_data = data;
  console.log('Loaded UN grouping data.');
  group_loaded = true;
  // populateArcs();
  redraw();
});


/* -------- FUNCTIONS -------- */


var jsn = document.getElementById("json");
  
function pls_mig() {
  // time to arrange:
  if (!mig_loaded || !group_loaded) {
    return;
  }

  var new_data = [];

  for (var i=0; i<migration_data.length; i++) {
    var immigration = [];
    var emigration = [];

    for (var j=0; j<migration_data[i].immigration.length; j++) {
      if (!migration_data[i].immigration[j].name) {
        console.log(migration_data[i].immigration[j].name);
        return;
      }
      var name = migration_data[i].immigration[j].name;
      var iso = getISOOfCountry(name);
      var years_since = migration_data[i].immigration[j].yearsSince1980;
      if (!iso) {
        if (name =='TfYR of Macedonia' || name == 'The former Yugoslav Republic of Macedonia') {
          iso = 'MKD';
          name = 'The former Yugoslav Republic of Macedonia';
        } else if (name =='Czech Republic') {
          iso = 'CZE';
        } else if (name =='United Kingdom') {
          iso = 'GBR';
        }
      }
      var point = {
        'ISOa3': iso,
        'country_name': name,
        'population_post_1980': years_since,
      };
      immigration.push(point);
    }

    for (var j=0; j<migration_data[i].emigration.length; j++) {
      if (!migration_data[i].emigration[j].name) {
        console.log(migration_data[i].emigration[j].name);
        return;
      }
      var name = migration_data[i].emigration[j].name;
      var iso = getISOOfCountry(name);
      var years_since = migration_data[i].emigration[j].yearsSince1980;
      if (!iso) {
        if (name =='TfYR of Macedonia' || name == 'The former Yugoslav Republic of Macedonia') {
          iso = 'MKD';
          name = 'The former Yugoslav Republic of Macedonia';
        } else if (name =='Czech Republic') {
          iso = 'CZE';
        } else if (name =='United Kingdom') {
          iso = 'GBR';
        }
      }
      var point = {
        'ISOa3': iso,
        'country_name': name,
        'population_post_1980': years_since,
      };
      emigration.push(point);
    }

    var name = migration_data[i].name;
    var iso = getISOOfCountry(name);
    if (!iso) {
      if (name =='TfYR of Macedonia' || name == 'The former Yugoslav Republic of Macedonia') {
        iso = 'MKD';
        name = 'The former Yugoslav Republic of Macedonia';
      } else if (name =='Czech Republic') {
        iso = 'CZE';
      } else if (name =='United Kingdom') {
        iso = 'GBR';
      }
    }

    var point = {
      'ISOa3': iso,
      'country_name': name,
      'immigration': immigration,
      'emigration': emigration,
    };

    new_data.push(point);
  }

  jsn.innerHTML = JSON.stringify(new_data);
  console.log('wrote json');
}

function pls_group() {
  if (!group_loaded) {
    return;
  }

  var new_data = [];

  for (var i=0; i<grouping_data.length; i++) {
    var point = {
      'ISOa3': grouping_data[i]["ISO-alpha3 Code"],
      'country_name': grouping_data[i]["Country or Area"],
      'intermediate_region_code': grouping_data[i]["Intermediate Region Code"].toString(),
      'intermediate_region_name': grouping_data[i]["Intermediate Region Name"],
      'subregion_code': grouping_data[i]["Sub-region Code"].toString(),
      'subregion_name': grouping_data[i]["Sub-region Name"],
      'region_code': grouping_data[i]["Region Code"].toString(),
      'region_name': grouping_data[i]["Region Name"],
      'global_code': "001",
      'global_name': 'World',
      'latitude': cleanCoord(grouping_data[i]["lat"]),
      'longitude': cleanCoord(grouping_data[i]["lng"]),
    };

    new_data.push(point);
  }

  jsn.innerHTML = JSON.stringify(new_data);
  console.log('wrote json');
}

function cleanCoord(coord) {
  return coord != null ? coord.toString() : "0";
}



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


/* ---- other ---- */

function populateArcs(source, destinations) {
  source = "AUS";
  // curryear - 1980
  var data = {};
  var source_coords = getCoords(source);
  console.log(source_coords);

  if (!countryInMigData(source)) {
    console.log(source + ' not found in migration dataset');
    return; //error
  }

  var mig_data = getImmigrationData(source);

  for (var i=0; i<mig_data.length; i++) {
    if (!getCoords(mig_data[i].ISOa3)) {
      console.log('failed to get coords');
      console.log(mig_data[i].ISOa3);
      continue;
    }
    data[mig_data[i].ISOa3] = getCoords(mig_data[i].ISOa3);
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
  // console.log(arcs);
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
}// init


function dataLoaded() {
  return pop_loaded && mig_loaded && group_loaded;
}

$( "html" ).click(function() {
  redraw();
});

$('body').keyup(function(e){
  if(e.keyCode == 32){
    pls_group();
  }
});


// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  curryear.innerHTML = this.value;
  colorMap(this.value);
}


              