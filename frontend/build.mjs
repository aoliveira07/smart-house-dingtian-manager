import {mkdir,copyFile,readFile} from 'node:fs/promises';
const output=new URL('../custom_components/smart_house_dingtian/frontend/',import.meta.url);
await mkdir(output,{recursive:true});
await copyFile(new URL('./panel.js',import.meta.url),new URL('panel.js',output));
const source=await readFile(new URL('panel.js',output),'utf8');
// SVG namespace identifies inline icons; it never loads a network resource.
// Browser storage now holds configuration drafts for autosave recovery, never HA tokens.
if(/https?:\/\/|innerHTML/.test(source.replaceAll('http://www.w3.org/2000/svg','')))throw new Error('Unexpected remote dependency or unsafe rendering');
console.log('Frontend bundled: dependency-free ES module.');
