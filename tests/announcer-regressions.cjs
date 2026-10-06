const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const path=process.argv[2]||require('path').join(__dirname,'../index.html');
const html=fs.readFileSync(path,'utf8');const source=html.slice(html.indexOf('/* ---------- announcer ---------- */'),html.indexOf('/* ---------- sound (opt-in) ---------- */'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const events={},pending=[];const audio={paused:true,currentTime:0,play(){this.paused=false;return new Promise((resolve,reject)=>pending.push({resolve,reject}))},pause(){this.paused=true},addEventListener(k,f){events['audio-'+k]=f}};const button={attrs:{},textContent:'Hear the announcer',addEventListener(k,f){events[k]=f},setAttribute(k,v){this.attrs[k]=v}};vm.runInNewContext(source,{$:id=>id==='vo'?audio:button});return{audio,button,pending,click:()=>events.click(),emit:k=>events['audio-'+k]?.()}}
const cases=[
 ['successful playback',async a=>{a.click();a.pending[0].resolve();await tick();assert.equal(a.button.attrs['aria-pressed'],'true')}],
 ['playback rejected',async a=>{a.click();a.audio.paused=true;a.pending[0].reject(Error('blocked'));await tick();assert.equal(a.button.attrs['aria-pressed'],'false');assert.match(a.button.textContent,/Try/)}],
 ['stop before earlier success',async a=>{a.click();a.click();a.pending[0].resolve();await tick();assert.equal(a.button.attrs['aria-pressed'],'false');assert.equal(a.button.textContent,'Hear the announcer')}],
 ['stop before earlier rejection',async a=>{a.click();a.click();a.pending[0].reject(Error('aborted'));await tick();assert.equal(a.button.textContent,'Hear the announcer')}],
 ['replay ignores stale earlier rejection',async a=>{a.click();a.click();a.click();a.pending[1].resolve();await tick();a.pending[0].reject(Error('aborted'));await tick();assert.equal(a.button.attrs['aria-pressed'],'true');assert.equal(a.button.textContent,'Stop the announcer')}],
 ['ended invalidates pending completion',async a=>{a.click();a.audio.paused=true;a.emit('ended');a.pending[0].resolve();await tick();assert.equal(a.button.attrs['aria-pressed'],'false')}],
 ['media error invalidates pending completion',async a=>{a.click();a.emit('error');a.pending[0].resolve();await tick();assert.equal(a.button.attrs['aria-pressed'],'false');assert.match(a.button.textContent,/Try/)}]
];
(async()=>{let failures=0;for(const [name,fn]of cases){try{await fn(setup());console.log('PASS '+name)}catch(e){failures++;console.log('FAIL '+name+': '+e.message.split('\n')[0])}}console.log(`${cases.length-failures}/${cases.length} modeled playback checks pass (${path})`);process.exitCode=failures?1:0})()
