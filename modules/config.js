let configs = {};

let jsonfile = require("jsonfile");
let fs = require("fs");

const getConfig = exports.getConfig = function (moduleName) {
  if (configs[moduleName]) {
    return configs[moduleName]
  } else {
    return {}
  }
};

const saveConfig = exports.saveConfig = function (moduleName, config) {
  configs[moduleName] = config;
  jsonfile.writeFileSync("config.json", configs);
};

//INIT
(() => {
  if (!fs.existsSync("config.json")) {
    jsonfile.writeFileSync("config.json", configs);
  } else {
    configs = jsonfile.readFileSync("config.json");
  }
})();