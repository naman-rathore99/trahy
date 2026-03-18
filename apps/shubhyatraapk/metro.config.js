const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
// This tells Metro to look 2 folders up at the C:\trahy root
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the workspace root so Metro can see pnpm's shared modules
config.watchFolders = [workspaceRoot];

// 2. Tell Metro exactly where node_modules are located
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve dependencies correctly through pnpm symlinks
config.resolver.disableHierarchicalLookup = true;

// 4. Export the config wrapped in NativeWind for your Tailwind CSS
module.exports = withNativeWind(config, { input: "./global.css" });