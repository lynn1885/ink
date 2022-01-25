const webpack = require('webpack');

module.exports = {
  // devServer: {
  //   port: 9002,
  // },
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
      })
    ]
  },
  // 把node-sass替换为sass
  css: {
    loaderOptions: {
      sass: {
        implementation: require('sass'), // This line must in sass option
      },
    },
  }
};
