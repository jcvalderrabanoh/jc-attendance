import { RuleSeverityEnum } from '../entities';
import { OnboardingFacts, OnboardingRulesEvaluator } from './onboarding-rules.evaluator';

const facts = (over: Partial<OnboardingFacts> = {}): OnboardingFacts => ({
  invitationValid: true,
  phoneVerified: true,
  identity: { firstName: 'Ana', lastName: 'López', phoneE164: '+525512345678', email: 'ana@empresa.com' },
  requiredFields: [],
  allowedEmailDomains: [],
  customFieldErrors: [],
  customFields: {},
  privacyAccepted: true,
  duplicatesInAccount: [],
  existsInOtherAccounts: false,
  ageYears: 30,
  ...over,
});

describe('OnboardingRulesEvaluator', () => {
  const evaluator = new OnboardingRulesEvaluator();
  const defaults = evaluator.effectiveRules([]);

  it('todo en verde: sin bloqueo ni riesgo', () => {
    const r = evaluator.evaluate(defaults, facts());
    expect(r.blocked).toBe(false);
    expect(r.riskScore).toBe(0);
    expect(r.results.every((x) => x.outcome === 'pass')).toBe(true);
  });

  it('liga vencida bloquea siempre (regla fija)', () => {
    const rules = evaluator.effectiveRules([{ ruleKey: 'invitation_valid', enabled: false, severity: RuleSeverityEnum.Warn, config: {} }]);
    const r = evaluator.evaluate(rules, facts({ invitationValid: false, invitationProblem: 'La liga venció' }));
    expect(r.blocked).toBe(true);
    expect(r.results.find((x) => x.ruleKey === 'invitation_valid')?.message).toBe('La liga venció');
  });

  it('CURP inválida bloquea; RFC inválido solo advierte', () => {
    const r = evaluator.evaluate(defaults, facts({ identity: { ...facts().identity, curp: 'XXXX000000XXXXXX00', rfc: 'MAL' } }));
    expect(r.results.find((x) => x.ruleKey === 'curp_format')?.outcome).toBe('fail');
    expect(r.results.find((x) => x.ruleKey === 'rfc_format')?.outcome).toBe('warn');
    expect(r.blocked).toBe(true);
  });

  it('la cuenta puede bajar una regla a advertencia', () => {
    const rules = evaluator.effectiveRules([{ ruleKey: 'unique_in_account', enabled: true, severity: RuleSeverityEnum.Warn, config: {} }]);
    const r = evaluator.evaluate(rules, facts({ duplicatesInAccount: ['teléfono'] }));
    expect(r.blocked).toBe(false);
    expect(r.riskScore).toBe(20);
  });

  it('dominio de email y edad mínima configurable', () => {
    const rules = evaluator.effectiveRules([{ ruleKey: 'min_age', enabled: true, severity: RuleSeverityEnum.Block, config: { minAge: 21 } }]);
    const r = evaluator.evaluate(rules, facts({ allowedEmailDomains: ['otra.com'], ageYears: 19 }));
    expect(r.results.find((x) => x.ruleKey === 'email_domain')?.outcome).toBe('fail');
    expect(r.results.find((x) => x.ruleKey === 'min_age')?.message).toContain('21');
  });

  it('faltan obligatorios de la liga', () => {
    const r = evaluator.evaluate(defaults, facts({ requiredFields: ['curp', 'nss'] }));
    expect(r.results.find((x) => x.ruleKey === 'required_fields')?.message).toBe('Faltan: CURP, NSS');
  });

  it('persona que ya trabaja en otra cuenta se informa sin bloquear', () => {
    const r = evaluator.evaluate(defaults, facts({ existsInOtherAccounts: true }));
    expect(r.blocked).toBe(false);
    expect(r.results.find((x) => x.ruleKey === 'existing_identity')?.outcome).toBe('info');
  });

  it('regla propia con regex', () => {
    const rules = evaluator.effectiveRules([
      { ruleKey: 'custom_regex', enabled: true, severity: RuleSeverityEnum.Block, config: { field: 'gafete', regex: '^G\\d{4}$', message: 'Gafete G0000' } },
    ]);
    const r = evaluator.evaluate(rules, facts({ customFields: { gafete: 'X1' } }));
    expect(r.results.find((x) => x.ruleKey === 'custom_regex')?.message).toBe('Gafete G0000');
  });
});
