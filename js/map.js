/* -------- VARIABLES -------- */
var MAX_POP = 10000;
var color_max = 10000;
Object.freeze(MAX_POP);

var colors = d3.scale.linear().domain([0, color_max]).range(['Gainsboro', '#42C0FB']);

var slider = document.getElementById("slider"),
    curryear = document.getElementById("curryear");

var worldmap;

// default selected values
var current_country = 'DEU',
    current_year = slider.value,
    current_mig_method = MigrationEnum.immigration;


/* -------- FUNCTIONS -------- */

/* ---- Grouping Functions ---- */

function getISOOfCountry(country) {
  for (var i=0; i<region_data.length; i++) {
    if (country == region_data[i].country_name) {
      return region_data[i].ISOa3;
    }
  }
  console.log('Could not get ISO of ' + country);
  return null;
}

function getCountryName(iso) {
  for (var i=0; i<region_data.length; i++) {
    if (iso == region_data[i].ISOa3) {
      return region_data[i].country_name;
    }
  }
  console.log('Could not get ISO of ' + country);
  return null;
}

function getCountryCoords(iso) {
  for (var i=0; i<region_data.length; i++) {
    if (region_data[i].ISOa3 == iso) {
      return {
        lat: region_data[i].latitude,
        lon: region_data[i].longitude,
      }
    }
  }
  console.log('Could not get coordinates of ' + country);
  return null;
}


/* ---- Migration Functions ---- */

function getMigrationEntry(iso) {
  for (var i=0; i<migration_data.length; i++) {
    if (migration_data[i].ISOa3 == iso) {
      return migration_data[i];
    }
  }
  // console.log('Could not get migration data of ' + getCountryName(iso));
  return [];
}

function getImmigrationData(iso) {
  var entry = getMigrationEntry(iso);
  return (entry) ? entry.immigration : [];
}

function getEmigrationData(iso) {
  var entry = getMigrationEntry(iso);
  return (entry) ? entry.emigration : [];
}

function getMigrationData(iso, migration_method) {
  if (migration_method == MigrationEnum.immigration) {
    return getImmigrationData(iso);
  } else if (migration_method == MigrationEnum.emigration) {
    return getEmigrationData(iso);
  }
  return [];
}

function getMigrationNumbersByISO(source, destination, year, migration_method) {
  var mig_data = getMigrationData(source, migration_method);

  for (var i=0; i<mig_data.length; i++) {
    if (mig_data[i].ISOa3 == destination) {
      return mig_data[i].population_post_1980[year - 1980];
    }
  }

  return 0;
}

function getMigrationNumbersTotal(iso, year, migration_method) {
  var total = 0,
      mig_data = getMigrationData(iso, migration_method);
  
  for (var i=0; i<mig_data.length; i++) {
    if (mig_data[i].country_name == 'Total') {
      continue;
    }
    total += mig_data[i].population_post_1980[year - 1980];
  }
  return total;
}

function getSortedMigrationData(iso, year, migration_method) {
  var mig_data = getMigrationData(iso, migration_method),
      parsed_data = [];

  for (var i=0; i<mig_data.length; i++) {
    if (mig_data[i].population_post_1980[year - 1980] > 0) {
      parsed_data.push([mig_data[i].ISOa3, mig_data[i].population_post_1980[year - 1980]]);
    }
  }

  return parsed_data.sort(function(a,b) {
    return a[1] - b[1];
  }).reverse();
}


/* ---- Rendering Functions ---- */

$("#unhide-viz").click(renderVisualization);

$('.toggle').click(function() {
  setMigrationMethod(this.checked);
  // updateColor(); TODO : check that this doesn't do anything
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




function renderVisualization() {
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
  worldmap = new Datamap();
  renderArcs(current_country, current_year, current_mig_method);
  colorMap(current_country,  slider.value, current_mig_method);
  updateInfoHeader(current_country, current_year, current_mig_method);
  curryear.innerHTML = slider.value; // Display the default slider value
}

function generateSelectors() {
  for (var i=0; i<migration_data.length; i++) {
    $('#combobox').append(
      '<option value="' + migration_data[i].ISOa3 + '" style="color:black;">' + 
      migration_data[i].country_name + '</option>'
    );
  }
  $("#combobox").val(current_country);
}

/* -------- Arc Functions -------- */
function renderArcs(source, year, migration_method) {
  var dest_coords, source_coords = getCountryCoords(source),
      mig_data = getMigrationData(source, migration_method),
      pop_data = getSortedMigrationData(source, year, migration_method),
      arcs = [];

  if (!source_coords) {
    console.log('Error: ' + source + ' does not have coordinates');
    return;
  }

  for (var i=0; i<mig_data.length; i++) {
    var should_render = false;
    dest_coords = getCountryCoords(mig_data[i].ISOa3);
    if (!dest_coords) {
      console.log('Failed to get coords for ' + mig_data[i].ISOa3);
      continue;
    }

    // TODO: put in arc thresholding here
    for (var j=0; j<10 && j<pop_data.length; j++) {
      if (pop_data[j][0] == mig_data[i].ISOa3) {
        should_render = true;
      }
    }

    if (!should_render) {
      continue;
    }

    if (migration_method == MigrationEnum.immigration) {
      arcs.push(genArc(dest_coords, source_coords));
    } else if (migration_method == MigrationEnum.emigration) {
      arcs.push(genArc(source_coords, dest_coords));
    }
  }
  worldmap.arc(arcs);
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
  var mig_data = getMigrationData(source, migration_method);

  resetColor();
  
  if (mig_data.length == 0) {
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
  worldmap.updateChoropleth(data);
}

function scaleColor() {
  var pop_data = getSortedMigrationData(current_country, current_year, current_mig_method);
  color_max = pop_data.length > 0 ? pop_data[0][1] : 0;
  updateColor(color_max/8, current_mig_method);
}

function updateColor(new_max, migration_method) {
  new_max = new_max > 0 ? new_max : MAX_POP;
  if (migration_method == MigrationEnum.emigration) {
    colors = d3.scale.linear().domain([0, new_max]).range(['Gainsboro', '#4CD964']);
  } else {
    colors = d3.scale.linear().domain([0, new_max]).range(['Gainsboro', '#42C0FB']);
  }
}

/* -------- Content Functions ------- */
function updateInfoHeader(source, year, migration_method) {
  var country_name = getCountryName(source),
      total = getMigrationNumbersTotal(source, year, migration_method);

  var info_string;
  if (total > 0) {
    info_string = total.toLocaleString() + ' people ' + (
      migration_method == MigrationEnum.immigration ?
      'immigrated to ' : 'emigrated from '
    ) + country_name + ' in ' + year + '.';
  } else {
    info_string = 'No ' + (
      migration_method == MigrationEnum.immigration ?
      'immigration' : 'emigration'
    ) + ' data found for ' + country_name + ' in ' + year + '.';
  }
  d3.select('#selected-info').html(info_string);
}

function setMigrationMethod(is_emigration) {
  current_mig_method = is_emigration ? MigrationEnum.emigration : MigrationEnum.immigration;
}

function rerender() {
  renderArcs(current_country, current_year, current_mig_method);
  colorMap(current_country, slider.value, current_mig_method);
  updateInfoHeader(current_country, current_year, current_mig_method);
}

// show migration information in tooltip
function genPopupTemplate(geo, data) {
  var population = getMigrationNumbersByISO(
    current_country,
    geo.id,
    current_year,
    current_mig_method
  );
  var div_open = '<div style="opacity:1;width:100px;" class="hoverinfo">',
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