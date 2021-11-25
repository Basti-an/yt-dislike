const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

require("dotenv").config({ path: "../prod.env" });

module.exports = merge(common, {
  mode: "production",
});
