// Synthetic integration tests for the full port. All Google services and Gemini are mocked.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('./Code.gs', import.meta.url), 'utf8');

function makeScenario({analysis, autoReply=false, documents=true}={}) {
  const props = new Map([
    ['GEMINI_API_KEY','synthetic-only'],
    ['JMAIL_SETTINGS_JSON', JSON.stringify({minMatchScore:85,maxCommuteMinutes:60})],
    ['CAREER_PROFILE_JSON','{}']
  ]);
  const events = {rows:0,drafts:0,notices:0,pdfs:0,trash:0,archive:0};
  const labels = new Map();
  const thread = {
    labels: new Set(['Jmail/Вакансии']),
    getMessages: () => [{
      getSubject: () => autoReply ? 'Vielen Dank für Ihre Bewerbung' : 'Synthetic job alert',
      getPlainBody: () => 'Office Coordinator. Desk based work. Apply by email. Fully remote position.',
      getBody: () => '<p>Office Coordinator. Desk based work. Apply by email. Fully remote position.</p>'
    }],
    removeLabel(label) { this.labels.delete(label.name); },
    addLabel(label) { this.labels.add(label.name); },
    moveToArchive() { events.archive++; },
    moveToTrash() { events.trash++; }
  };
  const input = {name:'Jmail/Вакансии',getThreads:()=>thread.labels.has('Jmail/Вакансии')?[thread]:[]};
  labels.set(input.name,input);
  const context = {
    Date, JSON, Math, Number, String, RegExp, Utilities:{sleep(){},formatDate:()=> '01.01.2026'},
    Session:{getTimeZone:()=> 'Europe/Berlin',getScriptTimeZone:()=> 'Europe/Berlin',getEffectiveUser:()=>({getEmail:()=> 'synthetic@example.invalid'})},
    PropertiesService:{getScriptProperties:()=>({
      getProperty:k=>props.get(k)||null,
      setProperty:(k,v)=>props.set(k,v),
      deleteProperty:k=>props.delete(k)
    })},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    Logger:{log(){}},
    GmailApp:{
      getUserLabelByName:n=>labels.get(n)||null,
      createLabel:n=>{const l={name:n};labels.set(n,l);return l}
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.checkAndCreateMonthlySheet=()=>{};
  context.checkAndSendMonthlyCareerReport=()=>{};
  context.getRecentApplicationsFromSheet=()=>[];
  context.analyzeJobWithGemini=()=>autoReply ? null : analysis;
  context.generateJobApplicationDocumentsWithGemini=()=>documents ? {cv_summary:'synthetic'} : null;
  context.generateUniqueCvPDF=()=>{events.pdfs++;return 'synthetic-pdf-id';};
  context.generateAnschreibenPDF=()=>{events.pdfs++;};
  context.writeToActiveMonthlySheet=()=>{events.rows++;};
  context.createGmailDraftWithUniqueCV=()=>{events.drafts++;};
  context.createDirectNotificationInFertig=()=>{events.notices++;};
  context.isAutoReply=()=>autoReply;
  return {context,thread,events};
}
function candidate(overrides={}) {
  return Object.assign({
    verdict:'APPLY',match_score:92,is_newsletter:false,
    work_mode:'remote',job_location:'',
    role_family:'office_admin',physical_demand:'desk',application_effort:'simple',
    evidence:{role:'Office Coordinator',physical:'Desk based work',application:'Apply by email',location:'Fully remote'},
    tracker_data:{company:'Synthetic GmbH',bereich:'Office Coordinator',date:'01.01.2026',source:'Synthetic',channel:'Website'}
  },overrides);
}
const body='Office Coordinator. Desk based work. Apply by email. Fully remote position.';
{
  const s=makeScenario({analysis:candidate()}); s.context.processJobEmails();
  assert.equal(s.events.rows,1); assert.equal(s.events.drafts,1); assert.equal(s.events.pdfs,2);
  assert.equal(s.events.archive,1); assert.equal(s.events.trash,0);
  assert.equal(s.thread.labels.has('Jmail/Обработано'),true);
}
{
  const s=makeScenario({analysis:candidate({verdict:'SKIP',match_score:0})}); s.context.processJobEmails();
  assert.equal(s.events.rows,0); assert.equal(s.events.archive,1);
  assert.equal(s.thread.labels.has('Jmail/Обработано'),true);
}
{
  const s=makeScenario({analysis:candidate({evidence:{role:'phrase absent',physical:'Desk based work',application:'Apply by email',location:'Fully remote'}})});
  s.context.processJobEmails();
  assert.equal(s.events.rows,0); assert.equal(s.events.archive,0);
  assert.equal(s.thread.labels.has('Jmail/Проверить'),true);
}
{
  const s=makeScenario({analysis:candidate({is_newsletter:true,contact_email:''})}); s.context.processJobEmails();
  assert.equal(s.events.rows,1); assert.equal(s.events.notices,1); assert.equal(s.events.trash,1);
}
{
  const s=makeScenario({analysis:candidate(),documents:false}); s.context.processJobEmails();
  assert.equal(s.events.rows,0); assert.equal(s.events.archive,0);
  assert.equal(s.thread.labels.has('Jmail/Вакансии'),true);
}
{
  const s=makeScenario({analysis:null,autoReply:true}); s.context.processJobEmails();
  assert.equal(s.events.rows,0); assert.equal(s.events.trash,1);
}
console.log('PASS: 6 synthetic workflow paths (eligible, rejected, review, newsletter, document error, auto-reply).');
