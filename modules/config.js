let configs = {};

const jsonfile = require("jsonfile");
const fs       = require("fs");
const db       = require("./db");

function getConfig(moduleName) {
  if (configs[moduleName]) {
    return configs[moduleName]
  } else {
    return {}
  }
}

function saveConfig(moduleName, config) {
  configs[moduleName] = config;
  jsonfile.writeFileSync("config.json", configs);
}

function init() {
  if (!fs.existsSync("config.json")) {
    jsonfile.writeFileSync("config.json", configs);
  } else {
    configs = jsonfile.readFileSync("config.json");
  }
}

init();

module.exports = {
  getConfig,
  saveConfig
};