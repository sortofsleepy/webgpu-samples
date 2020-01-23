import typescript from 'rollup-plugin-typescript'
import compiler from '@ampproject/rollup-plugin-closure-compiler'
import {string} from 'rollup-plugin-string'
export default {
    input:'./src/app.ts',
    output:[
        {

            format:"iife",
            file:"./public/jirachi.js"
        }
    ],
    plugins:[
        string({
            include:"src/**/*.glsl",
            exclude:[]
        }),
        typescript(),
        compiler()
    ]
}
