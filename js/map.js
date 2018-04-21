var FieldsEnum = {
  "Country": 0,
  "Datatype": 1,
  "Year": 2,
  "Value": 3,
}
Object.freeze(FieldsEnum);

var population_data;


$.getJSON("./data/population.json", function(data) {
  population_data = data.data.record;
  console.log(population_data[0].field[FieldsEnum.Country]._key);

  colorMap(1959);
});


// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, 100000000]).range(['Gainsboro', 'grey']);

var map = new Datamap({
  scope: 'world',
  element: document.getElementById('map'),
  projection: 'orthographic',
  height: 600,
  fills: {
    defaultFill: "#ffffff",
    // USA: '#ffffff',
    // gt50: colors(Math.random() * 20),
    // eq50: colors(Math.random() * 20),
    // lt25: colors(Math.random() * 10),
    // gt75: colors(Math.random() * 200),
    // lt50: colors(Math.random() * 20),
    // eq0: colors(Math.random() * 1),
    // pink: '#0fa0fa',
    // gt500: colors(Math.random() * 1)
  },
  projectionConfig: {
    rotation: [97,-15]
  },
  responsive: true,
  // data: {
  //   'USA': {fillKey: 'lt50' },
  //   'MEX': {fillKey: 'lt25' },
  //   'CAN': {fillKey: 'gt50' },
  //   'GTM': {fillKey: 'gt500'},
  //   'HND': {fillKey: 'eq50' },
  //   'BLZ': {fillKey: 'pink' },
  //   'GRL': {fillKey: 'eq0' },
  //   'CAN': {fillKey: 'gt50' }
  // }
});

map.graticule();

map.arc([{
  origin: {
    latitude: 61,
    longitude: -149
  },
  destination: {
    latitude: -22,
    longitude: -43
  }
}], {
  greatArc: true,
  animationSpeed: 2000
});


function colorMap(year) {
  for (var prop in population_data) {
    // console.log(typeof());
    if (population_data[prop].field[FieldsEnum.Year].__text == year) {
      // console.log(population_data[prop].field[fieldsEnum.Value].__text);
      updateColor(
        population_data[prop].field[FieldsEnum.Country]._key,
        population_data[prop].field[FieldsEnum.Value].__text
      );
    }
    // console.log(population_data[prop].field[FieldsEnum.Country]._key);
  }
}

function updateColor(country, population) {
  var data = {}
  data[country] = colors(parseInt(population));
  // data[country] = colors(Math.log(parseInt(population)));
  // console.log(Math.log(parseInt(population)));
  map.updateChoropleth(data);
}

var rotation = 97;

// window.setInterval(function() {
//   // console.log(map.options.projectionConfig.rotation);
//   // map.options.projectionConfig.rotation = [0, 0];
//   // map.updateChoropleth();
//   console.log('new datamap?');
//   $('#map').empty();
//   map = new Datamap({
//     scope: 'world',
//     element: document.getElementById('map'),
//     projection: 'orthographic',
//     height: 600,
//     fills: {
//       defaultFill: "#ffffff",
//     },
//     projectionConfig: {
//       rotation: [rotation,-15]
//     },
//     responsive: true,
//   });
//   rotation++;
//   if (rotation > 360) {
//     rotation = 0;
//   }
// }, 10000);






var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  curryear.innerHTML = this.value;

  colorMap(this.value);
}

window.addEventListener('resize', function() {
  map.resize();
});









