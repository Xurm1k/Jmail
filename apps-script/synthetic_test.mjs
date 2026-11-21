// Synthetic integration checks for Code.gs. Uses only local mocks; no Google account/API calls.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function scenario({apiCode=200, apiBody, throwFetch=false}={}) {
  const props = new Map([['GEMINI_API_KEY','test-key'],['CAREER_PROFILE','Test candidate'],['JOB_CRITERIA','Office jobs']]);
  const rows = [];
  const labels = new Map();
  const calls = {trash:0, archive:0, send:0, drafts:0};
  const thread = {
    labels: new Set(['Jmail/Вакансии']),
    getMessages: () => [{getSubject:()=> 'Synthetic job',getPlainBody:()=> 'Office coordinator, remote. Apply by email.'}],
    removeLabel(label){this.labels.delete(label.name)},
    addLabel(label){this.labels.add(label.name)},
    moveToTrash(){calls.trash++}, moveToArchive(){calls.archive++}
  };
  const inputLabel = {name:'Jmail/Вакансии',getThreads:()=>thread.labels.has('Jmail/Вакансии')?[thread]:[]};
  labels.set(inputLabel.name,inputLabel);
  const sheet = {appendRow:(row)=>rows.push(row)};
  const context = {
    console, Date, JSON, Math, Number, String, encodeURIComponent,
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    GmailApp:{getUserLabelByName:n=>labels.get(n)||null,createLabel:n=>{const l={name:n};labels.set(n,l);return l}},
    SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},
    UrlFetchApp:{fetch:()=>{if(throwFetch)throw Error('synthetic network failure');return {getResponseCode:()=>apiCode,getContentText:()=>JSON.stringify(apiBody)}}},
    Utilities:{sleep:()=>{}},
    ScriptApp:{getProjectTriggers:()=>[],newTrigger:()=>({timeBased(){return this},everyDays(){return this},atHour(){return this},create(){}})}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url),'utf8'),context);
  return {context,rows,thread,calls,props,labels};
}
const good={company:'Example GmbH',role:'Office Coordinator',score:92,decision:'Подходит',reason:'Remote office role',source:'Synthetic',url:'https://example.invalid/job'};
{
  const s=scenario({apiBody:{candidates:[{content:{parts:[{text:JSON.stringify(good)}]}}]}});
  s.context.processJmailDaily();
  assert.equal(s.rows.length,1,'successful job is written once');
  assert.equal(s.rows[0][3],92);
  assert.equal(s.thread.labels.has('Jmail/Вакансии'),false,'successful thread leaves input label');
  assert.equal(s.thread.labels.has('Jmail/Обработано'),true,'successful thread gets processed label');
  assert.deepEqual(s.calls,{trash:0,archive:0,send:0,drafts:0},'worker performs no destructive/outbound action');
}
for (const failure of [
  {apiCode:429,apiBody:{error:{message:'synthetic quota'}}},
  {apiBody:{candidates:[{content:{parts:[{text:'not json'}]}}]}},
  {throwFetch:true}
]) {
  const s=scenario(failure);
  s.context.processJmailDaily();
  assert.equal(s.rows.length,0,'failed analysis does not write a result');
  assert.equal(s.thread.labels.has('Jmail/Вакансии'),true,'failed thread remains available for review');
  assert.deepEqual(s.calls,{trash:0,archive:0,send:0,drafts:0});
}
console.log('PASS: 4 synthetic scenarios (success, quota/API error, invalid JSON, network error).');
