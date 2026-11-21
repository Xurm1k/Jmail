// Synthetic checks for resume-to-profile exact-source validation; no Gemini call is made.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('./Code.gs',import.meta.url),'utf8');
const resume='ACME Ltd. Office Coordinator. March 2020. Berlin. Prepared weekly reports. German B2. CRM.';
let modelProfile={
  experiences:[{company:'ACME Ltd.',role:'Office Coordinator',period:'March 2020',location:'Berlin',
    claims:[{text:'Prepared weekly reports',tags:['reporting']},{text:'Managed a team of twenty',tags:['management']}]}],
  militaryService:{},education:[],languages:[{label:'German',level:'B2'}],
  skills:[{text:'CRM',tags:['software']}],optionalCareerTransition:null
};
function makeContext(){
  const props=new Map([['GEMINI_API_KEY','synthetic-key'],['JMAIL_SETTINGS_JSON','{}']]);
  const context={
    Date,JSON,Math,Number,String,RegExp,TextEncoder,encodeURIComponent,
    Session:{getEffectiveUser:()=>({getEmail:()=> 'synthetic@example.invalid'})},
    PropertiesService:{getScriptProperties:()=>({
      getProperty:k=>props.get(k)||null,
      setProperty:(k,v)=>props.set(k,v),
      deleteProperty:k=>props.delete(k)
    })},
    Utilities:{newBlob:value=>({getBytes:()=>Array.from(new TextEncoder().encode(value))})},
    UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({
      candidates:[{content:{parts:[{text:JSON.stringify(modelProfile)}]}}]
    })})}
  };
  vm.createContext(context); vm.runInContext(source,context);
  return {context,props};
}
{
  const {context,props}=makeContext();
  context.buildCareerProfileFromResume(resume,'CAREER_PROFILE_DRAFT_JSON');
  const profile=JSON.parse(props.get('CAREER_PROFILE_DRAFT_JSON'));
  assert.equal(profile.experiences.length,1);
  assert.equal(profile.experiences[0].claims.length,1,'unsupported claim is filtered out');
  assert.equal(profile.experiences[0].claims[0].text,'Prepared weekly reports');
  assert.equal(profile.skills.length,1);
  assert.equal(props.has('CAREER_PROFILE_JSON'),false,'draft is not promoted before user approval');
}
{
  const {context,props}=makeContext();
  modelProfile={experiences:[{company:'ACME Ltd.',role:'Office Coordinator',claims:[{text:'Invented achievement'}]}]};
  assert.throws(()=>context.buildCareerProfileFromResume(resume,'CAREER_PROFILE_DRAFT_JSON'),/Could not verify/);
  assert.equal(props.has('CAREER_PROFILE_DRAFT_JSON'),false,'empty verified profile is not saved');
}
console.log('PASS: resume profile keeps source-backed claims and blocks unsupported data.');
