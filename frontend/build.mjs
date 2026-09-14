import {mkdir,copyFile,readFile} from 'node:fs/promises';
const output=new URL('../custom_components/smart_house_dingtian/frontend/',import.meta.url);
await mkdir(output,{recursive:true});
await copyFile(new URL('./panel.js',import.meta.url),new URL('panel.js',output));
const source=await readFile(new URL('panel.js',output),'utf8');
if(/https?:\/\/|innerHTML|localStorage/.test(source))throw new Error('Unexpected remote dependency or unsafe persistence/rendering');
console.log('Frontend bundled: dependency-free ES module.');
