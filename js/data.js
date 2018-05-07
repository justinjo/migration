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
  console.log('Loaded migration data.');
  mig_loaded = true;
  Object.freeze(migration_data);
});

$.getJSON('./data/regions.json', function(data) {
  region_data = data;
  console.log('Loaded region data.');
  reg_loaded = true;
  Object.freeze(region_data);
});