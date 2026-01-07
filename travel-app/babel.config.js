module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ["nativewind/babel"], // 👈 Ye line styles ko convert karti hai
    };
};