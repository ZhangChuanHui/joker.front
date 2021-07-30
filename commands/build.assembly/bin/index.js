#!/usr/bin/env node
const rollup = require("rollup");
const typescript = require("rollup-plugin-typescript2");
const commonjs = require("@rollup/plugin-commonjs");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const path = require("path");

const inputOptions = {
    input: path.join(process.cwd(), "src", "index.ts"),
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
            tsconfig: path.join(process.cwd(), "tsconfig.json"),
            clean: true,
            useTsconfigDeclarationDir: true
        })
    ]
};

const outputOptions = {
    sourcemap: true,
    file: path.resolve("dist", "bundle.js"),
    format: "esm"
};

async function build() {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // console.log(bundle.imports); // an array of external dependencies
    // console.log(bundle.exports); // an array of names exported by the entry point
    // console.log(bundle.modules); // an array of module objects

    // generate code and a sourcemap
    const { code, map } = await bundle.generate(outputOptions);

    // or write the bundle to disk
    await bundle.write(outputOptions);

    console.log("build complete");
}

build();
