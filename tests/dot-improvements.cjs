const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
let checks=0;function test(name,run){run();checks++;console.log('PASS '+name)}
const LOOKS=JSON.parse(source.match(/const LOOKS=(\[.*\]);/)[1]);
const state=source.slice(source.indexOf('const store='),source.indexOf('/* ---------- jersey back'));
function restore(stored,query){const c={LOOKS,URLSearchParams,location:{search:query},byMode:m=>LOOKS.filter(x=>x.m===m).sort((a,b)=>a.r-b.r),localStorage:{getItem:()=>stored,setItem(){}}};vm.runInNewContext(state+';globalThis.result={mode,cur,saved};',c);return c.result}
test('null storage recovers to a valid default',()=>assert.equal(restore('null','').mode,'fb'));
test('malformed storage recovers',()=>assert.equal(restore('{broken','').mode,'fb'));
test('array storage recovers',()=>assert.equal(restore('[]','').mode,'fb'));
test('saved looks stay in their matching modes',()=>{const r=restore('{"fb":"vc01","vc":"fb02"}','');assert.equal(r.cur.fb,'fb02');assert.ok(r.cur.vc.startsWith('vc'))});
test('explicit shared look wins over conflicting mode',()=>{const r=restore('{}','?mode=fb&look=vc01');assert.equal(r.mode,'vc');assert.equal(r.cur.vc,'vc01')});
test('unknown look is ignored safely',()=>assert.equal(restore('{}','?look=not-real').cur.fb,'fb02'));
const share=source.slice(source.indexOf('function choiceURL(){'),source.indexOf('function updateShare(){'));
const c={URL,location:{href:'https://gordonusc.github.io/final-boss/?from=team#gear'},mode:'vc',look:LOOKS.find(x=>x.id==='vc01'),pick:'jersey',cutUser:'rb'};vm.createContext(c);vm.runInContext(share,c);
test('copied link includes exact look, mode, gear and cut',()=>{const u=new URL(vm.runInContext('choiceURL()',c));assert.equal(u.searchParams.get('look'),'vc01');assert.equal(u.searchParams.get('mode'),'vc');assert.equal(u.searchParams.get('pick'),'jersey');assert.equal(u.searchParams.get('cut'),'rb');assert.equal(u.hash,'#kit');assert.equal(u.searchParams.get('from'),'team')});
test('full-kit links remove stale jersey cut',()=>{c.pick='kit';c.location.href='https://gordonusc.github.io/final-boss/?cut=rb';const u=new URL(vm.runInContext('choiceURL()',c));assert.equal(u.searchParams.has('cut'),false)});
test('default cut is included when no override exists',()=>{c.pick='jersey';c.cutUser=null;c.look=LOOKS.find(x=>x.id==='fb02');const u=new URL(vm.runInContext('choiceURL()',c));assert.equal(u.searchParams.get('cut'),'sl')});
test('gear radio group handles arrows and stops propagation',()=>{assert.match(source,/\['pick','cutrow'\]/);assert.match(source,/e\.preventDefault\(\);e\.stopPropagation\(\)/);assert.match(source,/#grid9,#play,#pick,#cutrow,dialog/)});
test('radio groups expose one tab stop and restore focus',()=>{assert.match(source,/b\.tabIndex=on\?0:-1/);assert.match(source,/tabindex="\$\{c\.k===ck\?0:-1\}"/);assert.match(source,/querySelector\('\[aria-checked="true"\]'\)\.focus\(\)/)});
test('clipboard rejection gives a selected manual copy link',()=>{assert.match(source,/share-fallback'\)\.hidden=false/);assert.match(source,/share-url'\)\.select\(\)/);assert.match(source,/role="status" aria-live="polite"/)});
test('audio play rejection returns control to retry state',()=>assert.match(source,/\.catch\(\(\)=>\{\s*if\(request!==announceRequest\)return;\s*announceReset\(\);ab\.textContent='Try the announcer again'/));
test('a stale announcer request cannot flip the button',()=>{assert.match(source,/const request=\+\+announceRequest;/);assert.match(source,/vo\.play\(\)\.then\(\(\)=>\{\s*if\(request!==announceRequest\|\|vo\.paused\)return;/)});
test('share summary avoids the dot separator',()=>assert.doesNotMatch(source,/' · '/));
test('social preview image is absolute',()=>assert.match(source,/<meta property="og:image" content="https:\/\/gordonusc.github.io\/final-boss\/assets\/hero.jpg">/));
console.log(`${checks} FINAL BOSS focused checks passed. State tests and source contracts; no gameplay/rendering asserted.`);
