import json
import pathlib
import sys
import tempfile
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from validate_situational_prompts import load_prompts, check_record

class SituationalPromptTests(unittest.TestCase):
    def fixture(self):
        return {
            'id':'SIT-0001','kind':'situational_prompt','version':'1.0.0',
            'title':'Synthetic sample','summary':'Metadata validation example','status':'draft',
            'text':'Run the explicitly requested test.',
            'situation':{'code':'interruption_diagnosis','trigger':'An operation stopped unexpectedly','purpose':'Assess current state'},
            'applicability':{'appropriate_when':['A diagnostic request'], 'not_appropriate_when':['An execution request'],'preconditions':[]},
            'execution':{'mode':'diagnosis_only','objective':'Report known state','handoff':'diagnostic_response','progress_evidence':True},
            'failure_modes':{'guards_against':['Invented test results'],'tradeoffs':[]},
            'interaction':{'invocation':'explicit_only','target':'chatgpt'},
            'relations':{'related_prompt_ids':[]},
            'provenance':{'source_type':'synthetic','reference':None,'notes':'Public-safe test fixture'},
            'governance':{'created_on':'2026-10-24','updated_on':'2026-10-24','review_status':'pending'}
        }
    def test_empty_registry(self):
        with tempfile.TemporaryDirectory() as tmp:
            (pathlib.Path(tmp)/'situational-prompts').mkdir()
            records,errors=load_prompts(pathlib.Path(tmp))
            self.assertEqual((records,errors),([],[]))
    def test_synthetic_example_validates(self):
        self.assertEqual(check_record(self.fixture(),'SIT-0001.json'),[])
    def test_rejects_silent_auto_activation_and_mismatched_mode(self):
        x=self.fixture()
        x['interaction']['invocation']='automatic'
        x['execution']['handoff']='after_available_work'
        errors=check_record(x,'SIT-0001.json')
        self.assertTrue(any('invocation' in e for e in errors))
        self.assertTrue(any('handoff' in e for e in errors))
    def test_published_requires_approval(self):
        x=self.fixture();x['status']='published'
        self.assertTrue(any('requires approved' in e for e in check_record(x,'SIT-0001.json')))
    def test_registry_integrity(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=pathlib.Path(tmp)/'situational-prompts'
            path.mkdir()
            (path/'SIT-0001.json').write_text(json.dumps(self.fixture()))
            records,errors=load_prompts(pathlib.Path(tmp))
            self.assertEqual(len(records),1)
            self.assertEqual(errors,[])

if __name__=='__main__':unittest.main()
