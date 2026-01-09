const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// 1. Default Config Load karein
const config = getDefaultConfig(__dirname);

// 2. NativeWind Wrap karein (Safe Path ke sath)
module.exports = withNativeWind(config, {
    input: path.join(__dirname, "./global.css")
});