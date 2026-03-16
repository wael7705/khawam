import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileWarning, Plus, Search } from 'lucide-react';
import {
  dashboardApi,
  type FinancialRange,
  type FinancialRule,
  type FinancialRulePayload,
  type PrintMode,
  type ServicePricingCoverage,
  type SizeCode,
} from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './FinancePricing.css';

const PRINT_MODES: PrintMode[] = ['bw', 'color_normal', 'color_laser'];
const SIZE_CODES: SizeCode[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'BOOKLET_A5', 'BOOKLET_B5', 'BOOKLET_A4'];

interface NewRuleFormState {
  service_id: string;
  name: string;
  unit_type: string;
}

export function FinancePricing() {
  const { t } = useTranslation();
  const dp = t.dashboard.financePage;
  const modeLabel: Record<PrintMode, string> = {
    bw: dp.modeBw,
    color_normal: dp.modeColorNormal,
    color_laser: dp.modeColorLaser,
  };
  const sizeLabel: Record<SizeCode, string> = {
    A1: 'A1',
    A2: 'A2',
    A3: 'A3',
    A4: 'A4',
    A5: 'A5',
    A6: 'A6',
    BOOKLET_A5: dp.sizeBookletA5,
    BOOKLET_B5: dp.sizeBookletB5,
    BOOKLET_A4: dp.sizeBookletA4,
  };
  const [rules, setRules] = useState<FinancialRule[]>([]);
  const [coverage, setCoverage] = useState<ServicePricingCoverage[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<PrintMode>('bw');
  const [activeSize, setActiveSize] = useState<SizeCode>('A4');
  const [activePaperType, setActivePaperType] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<NewRuleFormState>({ service_id: '', name: '', unit_type: 'page' });
  const [rangeDrafts, setRangeDrafts] = useState<FinancialRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const [rulesData, coverageData] = await Promise.all([
        dashboardApi.getFinancialRules().catch(() => [] as FinancialRule[]),
        dashboardApi.getServicePricingCoverage().catch(() => [] as ServicePricingCoverage[]),
      ]);
      setRules(rulesData);
      setCoverage(coverageData);
      setSelectedRuleId(rulesData[0]?.id ?? null);
      if (rulesData.length === 0 && coverageData.length === 0) {
        setError(dp.failed);
      }
      setLoading(false);
    };
    void load();
  }, [dp.failed]);

  const filteredRules = rules.filter((rule) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return rule.name.toLowerCase().includes(q) || (rule.service?.nameAr ?? '').toLowerCase().includes(q);
  });

  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? null;
  const dimensionCandidates = selectedRule?.dimensions.filter(
    (d) => d.print_mode === activeMode && d.size_code === activeSize,
  ) ?? [];
  const selectedDimension = dimensionCandidates.find(
    (d) => (d.paper_type ?? null) === activePaperType,
  ) ?? dimensionCandidates[0] ?? null;

  useEffect(() => {
    if (dimensionCandidates.length > 0 && !dimensionCandidates.some((d) => (d.paper_type ?? null) === activePaperType)) {
      setActivePaperType(dimensionCandidates[0]?.paper_type ?? null);
    }
  }, [selectedRuleId, activeMode, activeSize, dimensionCandidates, activePaperType]);

  useEffect(() => {
    if (!selectedDimension) {
      setRangeDrafts([]);
      return;
    }
    const sorted = [...selectedDimension.ranges].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    setRangeDrafts(sorted);
  }, [selectedDimension]);

  if (loading) {
    return <div className="finance-state">{dp.loading}</div>;
  }

  if (error && rules.length === 0) {
    return <div className="finance-state finance-state--error">{error}</div>;
  }

  const handleImportTemplate = async () => {
    await dashboardApi.importLegacyFinancialTemplate();
    const data = await dashboardApi.getFinancialRules();
    setRules(data);
    setSelectedRuleId(data[0]?.id ?? null);
  };

  const handleCreateRule = async () => {
    if (!newRule.service_id.trim() || !newRule.name.trim() || !newRule.unit_type.trim()) return;
    const payload: FinancialRulePayload = {
      service_id: newRule.service_id.trim(),
      name: newRule.name.trim(),
      unit_type: newRule.unit_type.trim(),
      dimensions: PRINT_MODES.flatMap((mode) =>
        SIZE_CODES.map((size) => ({
          print_mode: mode,
          size_code: size,
          ranges: [{ min_value: 0, max_value: null, unit_price: 0, display_order: 1 }],
        })),
      ),
    };
    const created = await dashboardApi.createFinancialRule(payload);
    setRules((prev) => [created, ...prev]);
    setSelectedRuleId(created.id);
    setNewRule({ service_id: '', name: '', unit_type: 'page' });
  };

  const handleAddRange = async () => {
    const ranges = [...rangeDrafts].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const lastRange = ranges[ranges.length - 1] ?? null;
    const nextMin = (lastRange?.max_value ?? lastRange?.min_value ?? 0) + 1;
    setRangeDrafts([
      ...ranges,
      {
        min_value: nextMin,
        max_value: null,
        unit_price: lastRange?.unit_price ?? 0,
        display_order: ranges.length + 1,
      },
    ]);
  };

  const updateDraftRange = (index: number, patch: Partial<FinancialRange>) => {
    setRangeDrafts((prev) => prev.map((range, i) => (i === index ? { ...range, ...patch } : range)));
  };

  const handleSaveRanges = async () => {
    if (!selectedRule || !selectedDimension) return;
    const normalized = rangeDrafts
      .map((range, idx) => ({ ...range, display_order: idx + 1 }))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const updatedDimensions = selectedRule.dimensions.map((dimension) => {
      const match =
        dimension.print_mode === activeMode &&
        dimension.size_code === activeSize &&
        (dimension.paper_type ?? null) === activePaperType;
      if (!match) return dimension;
      return { ...dimension, ranges: normalized };
    });
    const updatedRule = await dashboardApi.updateFinancialRule(selectedRule.id, { dimensions: updatedDimensions });
    setRules((prev) => prev.map((rule) => (rule.id === selectedRule.id ? updatedRule : rule)));
  };

  return (
    <div className="finance-page">
      <header className="finance-head">
        <h1>{dp.title}</h1>
        <p>{dp.subtitle}</p>
      </header>

      <section className="finance-grid">
        <article className="finance-panel">
          <div className="finance-toolbar">
            <div className="finance-search">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={dp.search} />
            </div>
            <button type="button" className="finance-btn finance-btn--outline" onClick={() => void handleImportTemplate()}>
              {dp.importTemplate}
            </button>
          </div>

          <div className="finance-create">
            <input
              value={newRule.service_id}
              onChange={(e) => setNewRule((prev) => ({ ...prev, service_id: e.target.value }))}
              placeholder="service_id"
            />
            <input
              value={newRule.name}
              onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={dp.addRule}
            />
            <input
              value={newRule.unit_type}
              onChange={(e) => setNewRule((prev) => ({ ...prev, unit_type: e.target.value }))}
              placeholder={dp.unitType}
            />
            <button type="button" className="finance-btn" onClick={() => void handleCreateRule()}>
              <Plus size={14} />
              {dp.saveRule}
            </button>
          </div>

          <h3>{dp.rulesTitle}</h3>
          {filteredRules.length === 0 ? (
            <div className="finance-empty">{dp.noRules}</div>
          ) : (
            <ul className="finance-rules">
              {filteredRules.map((rule) => (
                <li
                  key={rule.id}
                  className={selectedRuleId === rule.id ? 'finance-rule--active' : ''}
                  onClick={() => setSelectedRuleId(rule.id)}
                >
                  <div>
                    <strong>{rule.name}</strong>
                    <span>{rule.unit_type}</span>
                  </div>
                  <b>{rule.service?.nameAr ?? rule.service_id}</b>
                </li>
              ))}
            </ul>
          )}

          {selectedRule && (
            <div className="finance-tabs">
              <div className="finance-tabs__row">
                {PRINT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={mode === activeMode ? 'finance-tab finance-tab--active' : 'finance-tab'}
                    onClick={() => setActiveMode(mode)}
                  >
                    {modeLabel[mode]}
                  </button>
                ))}
              </div>
              <div className="finance-tabs__row finance-tabs__row--sizes">
                {SIZE_CODES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={size === activeSize ? 'finance-tab finance-tab--active' : 'finance-tab'}
                    onClick={() => setActiveSize(size)}
                  >
                    {sizeLabel[size]}
                  </button>
                ))}
              </div>
              {dimensionCandidates.length > 1 && (
                <div className="finance-tabs__row finance-tabs__row--paper">
                  <span className="finance-tabs__label">{dp.paperType}:</span>
                  {dimensionCandidates.map((d) => {
                    const pt = d.paper_type ?? null;
                    const label = pt === null ? dp.paperTypeAny : pt;
                    return (
                      <button
                        key={label}
                        type="button"
                        className={(pt === activePaperType ? 'finance-tab finance-tab--active' : 'finance-tab')}
                        onClick={() => setActivePaperType(pt)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="finance-ranges">
                <div className="finance-ranges__head">
                  <h4>{dp.ranges}</h4>
                  <div className="finance-ranges__actions">
                    <button type="button" className="finance-btn finance-btn--outline" onClick={() => void handleAddRange()}>
                      {dp.addRange}
                    </button>
                    <button type="button" className="finance-btn" onClick={() => void handleSaveRanges()}>
                      {dp.saveRanges}
                    </button>
                  </div>
                </div>
                <p className="finance-ranges__hint">{dp.rangeValidation}</p>
                {!selectedDimension ? (
                  <div className="finance-empty">{dp.none}</div>
                ) : (
                  <table className="finance-ranges__table">
                    <thead>
                      <tr>
                        <th>{dp.min}</th>
                        <th>{dp.max}</th>
                        <th>{dp.price}</th>
                        <th>{dp.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangeDrafts.map((range, index) => (
                        <tr key={`${range.min_value}-${range.max_value ?? 'open'}-${index}`}>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={range.min_value}
                              onChange={(e) => updateDraftRange(index, { min_value: Number(e.target.value) })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={range.max_value ?? ''}
                              placeholder="∞"
                              onChange={(e) =>
                                updateDraftRange(index, {
                                  max_value: e.target.value === '' ? null : Number(e.target.value),
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              value={range.unit_price}
                              onChange={(e) => updateDraftRange(index, { unit_price: Number(e.target.value) })}
                            />
                          </td>
                          <td>{dp.editRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="finance-panel">
          <h3>{dp.servicesTitle}</h3>
          <ul className="finance-coverage">
            {coverage.map((service) => (
              <li key={service.service_id} className={service.has_pricing ? 'coverage-ok' : 'coverage-missing'}>
                <div className="finance-coverage__head">
                  <strong>{service.service_name_ar}</strong>
                  {service.has_pricing ? <CheckCircle2 size={16} /> : <FileWarning size={16} />}
                </div>
                {service.has_pricing ? (
                  <p>{dp.complete}</p>
                ) : (
                  <p>
                    <AlertTriangle size={14} />
                    <span>{dp.warning}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
