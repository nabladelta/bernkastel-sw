const path = require('path');
const TSLintPlugin = require('tslint-webpack-plugin');

module.exports = {
    entry: {
            index: path.join(__dirname, '/src/index.ts'),
        },
    output: {
        filename: '[name].js',
        path: __dirname + '/dist'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
    ]
};