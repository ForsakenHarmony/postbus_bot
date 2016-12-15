const Datastore = require('nedb-promise');

let configs = {};

/***
 * Opens/creates a Database with the given name
 *
 * @param {string} name Name for the db
 */
async function opendb(name) {
  const datastore = new Datastore({
    filename: `db/$(name).nedb`,
    autoload: true
  });
  
  await datastore.find({"%":"%"});
  
  configs[name] = datastore;
}

function getDB(dbname) {
  const db = configs[dbname];
  return db ? db : { error: "DB not found" };
}

function get(dbname, module) {
  db = getDB(dbname);
  if (db.error) {
    return db;
  }
  
  return db.findOne({ module }, (err, res) => {
    
  }).config;
}

function set(dbname, module, value) {
  db = getDB(dbname);
  if (db.error) {
    return db;
  }
  
  db.update({ module }, { config: value })
}

(async () => {
  await opendb('config');
})();
