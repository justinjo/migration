/* -------- VARIABLES -------- */
var MAX_POP = 10000;
var color_max = 10000;
// Object.freeze(MAX_POP);

// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, color_max]).range(['Gainsboro', '#42C0FB']);

var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

var current_country = 'DEU';
var current_year = slider.value;
var current_mig_method = MigrationEnum.immigration;


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

function getCountryName(iso) {
  for (var i=0; i<region_data.length; i++) {
    if (iso == region_data[i].ISOa3) {
      return region_data[i].country_name;
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
  return entry && entry.immigration.length ? entry.immigration : null;
}

function getEmigrationData(iso) {
  var entry = getMigrationEntry(iso);
  return entry && entry.emigration.length ? entry.emigration : null;
}

function countryInMigData(iso) {
  return Boolean(getMigrationEntry(iso));
}

function getMigNumbers(iso, year, migration_method) {
  var mig_data, population = 0;

  if (migration_method == MigrationEnum.immigration) {
    mig_data = getImmigrationData(current_country);
  } else if (migration_method == MigrationEnum.emigration) {
    mig_data = getEmigrationData(current_country);
  }

  if (!mig_data || mig_data.length == 0) {
    return 0;
  }
  for (var i=0; i<mig_data.length; i++) {
    if (mig_data[i].ISOa3 == iso) {
      return mig_data[i].population_post_1980[current_year - 1980];
    }
  }
  return 0;
}


/* ---- Rendering Functions ---- */

$("#unhide-viz").click(renderViz);

$('.toggle').click(function() {
  setMigrationMethod(this.checked);
  updateColor();
  rerender();
});

slider.oninput = function() {
  curryear.innerHTML = this.value;
  current_year = slider.value;
  rerender();
}

// functions to change cursor type on map
$("#world").mousedown(function() {
  $("#world").removeClass("grabbable");
  $("#world").addClass("grabbed");
});

$("#world").mouseup(function() {
  $("#world").removeClass("grabbed");
  $("#world").addClass("grabbable");
});

// function to change the selected country
$('#combobox').change(function() {
  current_country = this.value;
  rerender();
});

// d3.select("#world").html('');




function renderViz() {
  if (!(mig_loaded && reg_loaded)) {
    return; // data needs to be loaded before map can be rendered
  }
  renderMap();
  generateSelectors()

  console.log('Revealing visualization-page');
  $("#landing-page").animate({
    top: '-150%',
    easing:"linear",
  }, 1000 );
  setTimeout( () => { $("#visualization-page").removeClass("hidden"); }, 250);
}

function renderMap() {
  new Datamap();
  renderArcs(current_country, current_mig_method);
  colorMap(current_country,  slider.value, current_mig_method);
  updateInfoHeader(current_country, current_mig_method);
}

function generateSelectors() {
  for (var i=0; i<migration_data.length; i++) {
    $('#combobox').append(
      '<option value="' + migration_data[i].ISOa3 + '">' + 
      migration_data[i].country_name + '</option>'
    );
  }
  $("#combobox").val(current_country);
}

/* -------- Arc Functions -------- */
function renderArcs(source, migration_method) {
  var dest_coords, source_coords = getCoords(source),
      mig_data,
      arcs = [];

  if (!source_coords) {
    console.log('Error: ' + source + ' does not have coordinates');
    return;
  } else if (!countryInMigData(source)) {
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
    dest_coords = getCoords(mig_data[i].ISOa3);
    if (!dest_coords) {
      console.log('Failed to get coords for ' + mig_data[i].ISOa3);
      continue;
    }

    // TODO: put in arc thresholding here
    if (mig_data[i].population_post_1980[slider.value - 1980] < 5000) {
      continue;
    }

    if (migration_method == MigrationEnum.immigration) {
      arcs.push(genArc(dest_coords, source_coords));
    } else if (migration_method == MigrationEnum.emigration) {
      arcs.push(genArc(source_coords, dest_coords));
    }
  }
  map.arc(arcs);
}

function genArc(origin_coords, destination_coords) {
  return {
    origin: {
      latitude: origin_coords.lat,
      longitude: origin_coords.lon,
    },
    destination: {
      latitude: destination_coords.lat,
      longitude: destination_coords.lon,
    }
  };
  // options: {
  //   strokeWidth: mig_data[i].population_post_1980[slider.value - 1980]/10000
  // }
}

/* -------- Color Functions -------- */
function colorMap(source, year, migration_method) {
  var mig_data;

  resetColor();
  
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

  scaleColor();

  for (var i=0; i<mig_data.length; i++) {
    var population = mig_data[i].population_post_1980[year - 1980];
    updateCountryColor(mig_data[i].ISOa3, population); //.toString()?
  }
}

function resetColor() {
  for (var i=0; i<region_data.length; i++) {
    updateCountryColor(region_data[i].ISOa3, 0);
  }
}

function updateCountryColor(iso, population) {
  var data = {}
  data[iso] = colors(parseInt(population));
  map.updateChoropleth(data);
}

function scaleColor() {
  // TODO: do color thresholding here
  // color_max = 0;
  // for (var i=0; i<mig_data.length; i++) {
  //   color_max = mig_data[i].population_post_1980[slider.value - 1980] > color_max ? 
  //     mig_data[i].population_post_1980[slider.value - 1980] : color_max;
  //   colors = d3.scale.linear().domain([0, color_max]).range(['Gainsboro', '#42C0FB']);
  // }
}

function updateColor() {
  if (current_mig_method == MigrationEnum.emigration) {
    colors = d3.scale.linear().domain([0, MAX_POP]).range(['Gainsboro', '#4CD964']);
  } else {
    colors = d3.scale.linear().domain([0, MAX_POP]).range(['Gainsboro', '#42C0FB']);
  }
}

/* -------- Content Functions ------- */
function updateInfoHeader(source, migration_method) {
  var country_name = getCountryName(source);
  var total = 0;

  var mig_data;

  if (migration_method == MigrationEnum.immigration) {
    mig_data = getImmigrationData(source);
  } else if (migration_method == MigrationEnum.emigration) {
    mig_data = getEmigrationData(source);
  }

  for (var i=0; i<mig_data.length; i++) {
    if (mig_data[i].country_name == 'Total') {
      continue;
    }
    total += mig_data[i].population_post_1980[current_year - 1980];
  }
  // console.log('test');
  var info_string;
  if (!mig_data || mig_data.length == 0 || total == 0) {
    info_string = 'No ' + (
      migration_method == MigrationEnum.immigration ?
      'immigration' : 'emigration'
    ) + ' data found for ' + country_name + ' in ' + current_year + '.';
  } else {
    info_string = total.toLocaleString() + ' people ' + (
        migration_method == MigrationEnum.immigration ?
        'immigrated to ' : 'emigrated from '
      ) + country_name + ' in ' + current_year + '.';
  }
  d3.select('#selected-info').html(info_string);
}

function setMigrationMethod(is_emigration) {
  current_mig_method = is_emigration ? MigrationEnum.emigration : MigrationEnum.immigration;
}

function rerender() {
  renderArcs(current_country, current_mig_method);
  colorMap(current_country, slider.value, current_mig_method);
  updateInfoHeader(current_country, current_mig_method);
}

// show migration information in tooltip
function genPopupTemplate(geo, data) {
  var population = getMigNumbers(geo.id, current_year, current_mig_method),
    div_open = '<div style="opacity:1;width:100px;" class="hoverinfo">',
    div_close = '</div>',
    content;

  if (population > 0) {
    content = population.toLocaleString() + 
      ' people migrated' +
      (current_mig_method == MigrationEnum.immigration ? ' from ' : ' to ' ) +
      getCountryName(geo.id) + 
      (current_mig_method == MigrationEnum.immigration ? ' to ' : ' from ' ) +
      getCountryName(current_country) +
      ' in ' + current_year.toString();
  } else {
    content = 'No ' + 
      (current_mig_method == MigrationEnum.immigration ? 'immigration' : 'emigration' ) +
      ' data between ' + getCountryName(geo.id) + ' and ' + getCountryName(current_country) +
      ' in ' + current_year.toString();
  }

  return div_open + content + div_close;   
}