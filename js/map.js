

$.getJSON("./data/pop_by_year.json", function(data) {
  population_data = data;
  colorMap(1959);
});



/* -------- VARIABLES -------- */
var FieldsEnum = {
  "Country": 0,
  "Datatype": 1,
  "Year": 2,
  "Value": 3,
}
Object.freeze(FieldsEnum);

var population_data = {};
var arcs = [];
// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, 100000000]).range(['Gainsboro', '#9acd32']);

var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

var map;
var globalRotation = [90,-30];


/* -------- FUNCTIONS -------- */

function formatData(data) {
  var formattedData = {};
  for (var prop in population_data) {
    var year = population_data[prop].field[FieldsEnum.Year].__text;
    var key = population_data[prop].field[FieldsEnum.Country]._key;
    var pop = population_data[prop].field[FieldsEnum.Value].__text;
    var name = population_data[prop].field[FieldsEnum.Country].__text;

    if (!(year in formattedData)) {
      formattedData[year] = {};
    }
    formattedData[year][key] = {
      name: name,
      population: pop,
    }
  }
  return formattedData;
}


function colorMap(year) {
  if (!(year in population_data)) {
    return;
  }
  for (var key in population_data[year]) {
    updateColor(
        key,
        population_data[year][key].population
      );
  }
}


function updateColor(country, population) {
  var data = {}
  data[country] = colors(parseInt(population));
  // data[country] = colors(Math.log(parseInt(population)));
  // console.log(Math.log(parseInt(population)));
  map.updateChoropleth(data);
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
    element: document.getElementById('world'),
    projection: 'orthographic',
    projectionConfig: {
      rotation: globalRotation
    },
    fills: {defaultFill: 'rgba(30,30,30,0.1)'},
    // data: dataset,
    geographyConfig: {
      responsive: true,
      borderColor: 'rgba(222,222,222,0.2)',
      highlightBorderWidth: 1,
      // don't change color on mouse hover
      highlightFillColor: function(geo) {
      return geo['fillColor'] || 'rgba(30,30,30,0.5)';
      },

      // only change border
      highlightBorderColor: 'rgba(222,222,222,0.5)',

      // // show desired information in tooltip
      // popupTemplate: function(geo, data) {
      //   // don't show tooltip if country don't present in dataset
      //   if (!data) { return ; }
      //   // tooltip content
      //   return ['',
      //     '<div style="opacity:0.7;" class="hoverinfo">% of visitors in ' + geo.properties.name,
      //     ': ' + data.percent,
      //   ''].join('');        
      //   }
    }
  });


  //draw a legend for this map
  map.legend();

  map.graticule();

  arcs.push(
    { 
      origin: {
        latitude: 37,
        longitude: -95
      },
      destination: {
        latitude: -35,
        longitude: -71
      }
    },
    {
      origin: {
        latitude: 37,
        longitude: -95
      },
      destination: {
        latitude: 24,
        longitude: -102
      },
    },
  );


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

  var drag = d3.behavior.drag().on('drag', function() {
    var dx = d3.event.dx;
    var dy = d3.event.dy;

    // var rotation = livemapScope.rotation;
    var rotation = map.projection.rotate();
    var radius = map.projection.scale();
    var scale = d3.scale.linear()
      .domain([-1 * radius, radius])
      .range([-90, 90]);
    var degX = scale(dx);
    var degY = scale(dy);
    rotation[0] += degX;
    rotation[1] -= degY;
    if (rotation[1] > 90) rotation[1] = 90;
    if (rotation[1] < -90) rotation[1] = -90;

    if (rotation[0] >= 180) rotation[0] -= 360;
      globalRotation = rotation;
      redraw();
  });

  d3.select("#world").select("svg").call(drag);


}// init




redraw();
              