// Synthetic tests for the ported decision logic. No real mail, Maps, Gemini, or Google account.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('./Main.gs', import.meta.url), 'utf8');
const context = {
  CONFIG: { MIN_MATCH_SCORE: 85, MAX_COMMUTE_MINUTES: 60, MAX_RUNTIME_SECONDS: 300 },
  Logger: { log() {} },
  getCommuteMinutes: () => ({ available: true, minutes: 45, mode: 'transit' })
};
vm.createContext(context);
vm.runInContext(source, context);

function job(overrides = {}) {
  return Object.assign({
    verdict: 'APPLY', match_score: 92, role_family: 'office_admin',
    physical_demand: 'desk', application_effort: 'simple',
    work_mode: 'remote', job_location: '',
    evidence: {
      role: 'Office Coordinator', physical: 'desk based',
      application: 'Apply by email', location: 'fully remote'
    }
  }, overrides);
}
const body = 'Office Coordinator role. Desk based work. Apply by email. Fully remote position.';
const cases = [
  ['remote approved', job(), body, 'pass'],
  ['score below threshold', job({match_score: 70}), body, 'reject'],
  ['model skip', job({verdict: 'SKIP'}), body, 'reject'],
  ['unsupported evidence', job({evidence: {
    role: 'No such role phrase', physical: 'desk based',
    application: 'Apply by email', location: 'fully remote'
  }}), body, 'review'],
  ['excluded analyst role', job({role_family: 'data_analyst'}), body + ' Data Analyst.', 'reject'],
  ['heavy physical demand', job({
    physical_demand: 'heavy',
    evidence: {role: 'Office Coordinator', physical: 'heavy lifting',
      application: 'Apply by email', location: 'fully remote'}
  }), body + ' Heavy lifting required.', 'reject']
];
for (const [name, ai, text, expected] of cases) {
  assert.equal(context.evaluateJobEligibility(ai, text, '', Date.now(), {stoppedForTime:false}).status, expected, name);
}
const onsite = job({
  work_mode: 'on_site', job_location: 'Berlin',
  evidence: {role: 'Office Coordinator', physical: 'desk based',
    application: 'Apply by email', location: 'Berlin'}
});
context.getCommuteMinutes = () => ({available:true, minutes:72, mode:'transit'});
assert.equal(context.evaluateJobEligibility(onsite, body + ' Berlin office.', '', Date.now(), {stoppedForTime:false}).status, 'reject', 'over-limit commute rejected');
context.getCommuteMinutes = () => ({available:false});
assert.equal(context.evaluateJobEligibility(onsite, body + ' Berlin office.', '', Date.now(), {stoppedForTime:false}).status, 'review', 'unavailable route goes to review');

console.log('PASS: 8 synthetic eligibility decisions; Maps route responses are mocked.');
