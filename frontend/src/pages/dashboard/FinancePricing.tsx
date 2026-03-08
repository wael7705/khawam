import { useEffect, useMemo, useState } from 'react';
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
  const { locale } = useTranslation();
  const [rules, setRules] = useState<FinancialRule[]>([]);
  const [coverage, setCoverage] = useState<ServicePricingCoverage[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<PrintMode>('bw');
  const [activeSize, setActiveSize] = useState<SizeCode>('A4');
  const [newRule, setNewRule] = useState<NewRuleFormState>({ service_id: '', name: '', unit_type: 'page' });
  const [rangeDrafts, setRangeDrafts] = useState<FinancialRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'القاعدة المالية والتسعير',
            subtitle: 'مراقبة تغطية التسعير لكل خدمة قبل استقبال الطلبات.',
            rulesTitle: 'القواعد المالية',
            servicesTitle: 'التحذيرات',
            warning: 'التسعير لهذه الخدمة غير كامل أو غير موجود',
            complete: 'التسعير مكتمل',
            addRule: 'إضافة قاعدة مالية',
            importTemplate: 'استيراد قالب من النظام القديم',
            search: 'بحث عن خدمة/قاعدة',
            unitType: 'الوحدة',
            saveRule: 'حفظ',
            ranges: 'الرينجات',
            addRange: 'إضافة رينج',
            saveRanges: 'حفظ تعديلات الرينجات',
            editRange: 'تعديل',
            min: 'الحد الأدنى',
            max: 'الحد الأعلى',
            price: 'السعر',
            actions: 'إجراء',
            rangeValidation: 'تحقق: يبدأ أول رينج من 0 ولا يوجد تداخل.',
            none: 'لا يوجد تبويب مطابق',
            modeLabel: {
              bw: 'أبيض وأسود',
              color_normal: 'ملون عادي',
              color_laser: 'ملون ليزري',
            } as Record<PrintMode, string>,
            sizeLabel: {
              A1: 'A1',
              A2: 'A2',
              A3: 'A3',
              A4: 'A4',
              A5: 'A5',
              A6: 'A6',
              BOOKLET_A5: 'Booklet A5',
              BOOKLET_B5: 'Booklet B5',
              BOOKLET_A4: 'Booklet A4',
            } as Record<SizeCode, string>,
            loading: 'تحميل بيانات التسعير...',
            failed: 'تعذر تحميل بيانات التسعير',
            noRules: 'لا توجد قواعد تسعير حالياً',
          }
        : {
            title: 'Finance & Pricing',
            subtitle: 'Track pricing coverage per service before processing orders.',
            rulesTitle: 'Financial Rules',
            servicesTitle: 'Warnings',
            warning: 'Pricing for this service is incomplete or missing',
            complete: 'Pricing complete',
            addRule: 'Add financial rule',
            importTemplate: 'Import legacy template',
            search: 'Search service/rule',
            unitType: 'Unit',
            saveRule: 'Save',
            ranges: 'Ranges',
            addRange: 'Add range',
            saveRanges: 'Save ranges changes',
            editRange: 'Edit',
            min: 'Min',
            max: 'Max',
            price: 'Price',
            actions: 'Action',
            rangeValidation: 'Validation: first range starts at 0 with no overlaps.',
            none: 'No matching tab found',
            modeLabel: {
              bw: 'Black & White',
              color_normal: 'Color Normal',
              color_laser: 'Color Laser',
            } as Record<PrintMode, string>,
            sizeLabel: {
              A1: 'A1',
              A2: 'A2',
              A3: 'A3',
              A4: 'A4',
              A5: 'A5',
              A6: 'A6',
              BOOKLET_A5: 'Booklet A5',
              BOOKLET_B5: 'Booklet B5',
              BOOKLET_A4: 'Booklet A4',
            } as Record<SizeCode, string>,
            loading: 'Loading pricing data...',
            failed: 'Failed to load pricing data',
            noRules: 'No pricing rules found',
          },
    [locale],
  );

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
        setError(labels.failed);
      }
      setLoading(false);
    };
    void load();
  }, [labels.failed]);

  const filteredRules = rules.filter((rule) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return rule.name.toLowerCase().includes(q) || (rule.service?.nameAr ?? '').toLowerCase().includes(q);
  });

  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? null;
  const selectedDimension = selectedRule?.dimensions.find(
    (dimension) => dimension.print_mode === activeMode && dimension.size_code === activeSize,
  );

  useEffect(() => {
    if (!selectedDimension) {
      setRangeDrafts([]);
      return;
    }
    const sorted = [...selectedDimension.ranges].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    setRangeDrafts(sorted);
  }, [selectedDimension]);

  if (loading) {
    return <div className="finance-state">{labels.loading}</div>;
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
      if (dimension.print_mode !== activeMode || dimension.size_code !== activeSize) return dimension;
      return { ...dimension, ranges: normalized };
    });
    const updatedRule = await dashboardApi.updateFinancialRule(selectedRule.id, { dimensions: updatedDimensions });
    setRules((prev) => prev.map((rule) => (rule.id === selectedRule.id ? updatedRule : rule)));
  };

  return (
    <div className="finance-page">
      <header className="finance-head">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </header>

      <section className="finance-grid">
        <article className="finance-panel">
          <div className="finance-toolbar">
            <div className="finance-search">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.search} />
            </div>
            <button type="button" className="finance-btn finance-btn--outline" onClick={() => void handleImportTemplate()}>
              {labels.importTemplate}
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
              placeholder={labels.addRule}
            />
            <input
              value={newRule.unit_type}
              onChange={(e) => setNewRule((prev) => ({ ...prev, unit_type: e.target.value }))}
              placeholder={labels.unitType}
            />
            <button type="button" className="finance-btn" onClick={() => void handleCreateRule()}>
              <Plus size={14} />
              {labels.saveRule}
            </button>
          </div>

          <h3>{labels.rulesTitle}</h3>
          {filteredRules.length === 0 ? (
            <div className="finance-empty">{labels.noRules}</div>
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
                    {labels.modeLabel[mode]}
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
                    {labels.sizeLabel[size]}
                  </button>
                ))}
              </div>
              <div className="finance-ranges">
                <div className="finance-ranges__head">
                  <h4>{labels.ranges}</h4>
                  <div className="finance-ranges__actions">
                    <button type="button" className="finance-btn finance-btn--outline" onClick={() => void handleAddRange()}>
                      {labels.addRange}
                    </button>
                    <button type="button" className="finance-btn" onClick={() => void handleSaveRanges()}>
                      {labels.saveRanges}
                    </button>
                  </div>
                </div>
                <p className="finance-ranges__hint">{labels.rangeValidation}</p>
                {!selectedDimension ? (
                  <div className="finance-empty">{labels.none}</div>
                ) : (
                  <table className="finance-ranges__table">
                    <thead>
                      <tr>
                        <th>{labels.min}</th>
                        <th>{labels.max}</th>
                        <th>{labels.price}</th>
                        <th>{labels.actions}</th>
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
                          <td>{labels.editRange}</td>
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
          <h3>{labels.servicesTitle}</h3>
          <ul className="finance-coverage">
            {coverage.map((service) => (
              <li key={service.service_id} className={service.has_pricing ? 'coverage-ok' : 'coverage-missing'}>
                <div className="finance-coverage__head">
                  <strong>{service.service_name_ar}</strong>
                  {service.has_pricing ? <CheckCircle2 size={16} /> : <FileWarning size={16} />}
                </div>
                {service.has_pricing ? (
                  <p>{labels.complete}</p>
                ) : (
                  <p>
                    <AlertTriangle size={14} />
                    <span>{labels.warning}</span>
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
