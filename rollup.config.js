import typescript from 'rollup-plugin-typescript'
import compiler from '@ampproject/rollup-plugin-closure-compiler'

export default {
    input:'./src/app.ts',
    output:[
        {

            format:"iife",
            file:"./public/jirachi.js"
        }
    ],
    plugins:[
        typescript(),
        compiler()
    ]
}
