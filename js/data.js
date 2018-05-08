/* -------- VARIABLES -------- */
var MigrationEnum = {
  'immigration': 1,
  'emigration': 2,
};
Object.freeze(MigrationEnum);

// json data
var migration_data = [], region_data = [],
    mig_loaded = false, reg_loaded = false;

/*  -------- Data Loading Functions -------- */
$.getJSON('./data/migration.json', function(data) {
  migration_data = data;
  Object.freeze(migration_data);
  mig_loaded = true;
  console.log('Loaded migration data.');
});

$.getJSON('./data/regions.json', function(data) {
  region_data = data;
  Object.freeze(region_data);
  reg_loaded = true;
  console.log('Loaded region data.');
});