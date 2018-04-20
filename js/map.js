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


var basic_choropleth = new Datamap({
  scope: 'world',
  element: document.getElementById("map"),
  projection: 'mercator',
  height: 600,
  fills: {
    defaultFill: "#DDDDDD",
    authorHasTraveledTo: "#fa0fa0"
  },
});

// var colors = d3.scale.log().base(Math.E).domain([0, 30]).range(['white', 'grey']);
var colors = d3.scale.linear().domain([0, 100000000]).range(['Gainsboro', 'grey']);

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
  basic_choropleth.updateChoropleth(data);
}


// window.setInterval(function() {
//   basic_choropleth.updateChoropleth({
//     USA: colors(Math.random() * 10),
//     RUS: colors(Math.random() * 100),
//     AUS: { fillKey: 'authorHasTraveledTo' },
//     BRA: colors(Math.random() * 50),
//     CAN: colors(Math.random() * 50),
//     ZAF: colors(Math.random() * 50),
//     IND: colors(Math.random() * 50),
//   });
// }, 2000);






var slider = document.getElementById("slider");
var curryear = document.getElementById("curryear");
curryear.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  curryear.innerHTML = this.value;

  colorMap(this.value);
}










