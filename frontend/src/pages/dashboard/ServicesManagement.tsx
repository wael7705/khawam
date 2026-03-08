import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Search, Trash2 } from 'lucide-react';
import { dashboardApi, type ManagedService } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './ServicesManagement.css';

interface ServiceGroup {
  key: string;
  label: string;
  services: ManagedService[];
}

interface ClassificationDraft {
  groupKey: string;
  subgroupKey: string;
  displayOrder: number;
}

function asMetaString(features: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!features) return null;
  const raw = features[key];
  return typeof raw === 'string' && raw.trim() ? raw : null;
}

export function ServicesManagement() {
  const { locale } = useTranslation();
  const [services, setServices] = useState<ManagedService[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('printing');
  const [activeSubgroup, setActiveSubgroup] = useState('all');
  const [classificationDrafts, setClassificationDrafts] = useState<Record<string, ClassificationDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'إدارة الخدمات',
            subtitle: 'تصنيف الخدمات وإدارتها مع خيارات الإخفاء أو الحذف.',
            loading: 'تحميل الخدمات...',
            failed: 'تعذر تحميل الخدمات',
            search: 'بحث ضمن الخدمات',
            empty: 'لا توجد خدمات مطابقة',
            hide: 'إخفاء',
            show: 'إظهار',
            delete: 'حذف',
            importLegacy: 'استيراد خدمات النظام القديم',
            other: 'أخرى',
            all: 'الكل',
            visible: 'مرئي',
            hidden: 'مخفي',
            group: 'التبويب الرئيسي',
            subgroup: 'التبويب الفرعي',
            order: 'الترتيب',
            saveClassification: 'حفظ التصنيف',
            printing: 'خدمات الطباعة',
            design: 'خدمات التصميم',
            cards: 'خدمات البطاقات',
            branding: 'خدمات الهوية والإعلان',
            otherTab: 'أخرى',
          }
        : {
            title: 'Services Management',
            subtitle: 'Organize services with hide/show and delete controls.',
            loading: 'Loading services...',
            failed: 'Failed to load services',
            search: 'Search services',
            empty: 'No matching services',
            hide: 'Hide',
            show: 'Show',
            delete: 'Delete',
            importLegacy: 'Import legacy services',
            other: 'Other',
            all: 'All',
            visible: 'Visible',
            hidden: 'Hidden',
            group: 'Main Tab',
            subgroup: 'Sub Tab',
            order: 'Order',
            saveClassification: 'Save Classification',
            printing: 'Printing Services',
            design: 'Design Services',
            cards: 'Cards Services',
            branding: 'Branding Services',
            otherTab: 'Other',
          },
    [locale],
  );

  const loadServices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getManagedServices();
      setServices(data);
      const drafts: Record<string, ClassificationDraft> = {};
      for (const service of data) {
        drafts[service.id] = {
          groupKey: asMetaString(service.features, 'group_key') ?? 'other',
          subgroupKey: asMetaString(service.features, 'subgroup_key') ?? '',
          displayOrder: service.display_order,
        };
      }
      setClassificationDrafts(drafts);
      const hasPrinting = data.some((service) => asMetaString(service.features, 'group_key') === 'printing');
      if (!hasPrinting && data[0]) {
        const fallback = asMetaString(data[0].features, 'group_key') ?? 'other';
        setActiveTab(fallback);
      }
    } catch {
      setError(labels.failed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, [labels.failed]);

  useEffect(() => {
    setActiveSubgroup('all');
  }, [activeTab]);

  const groups = useMemo<ServiceGroup[]>(() => {
    const grouped = new Map<string, ServiceGroup>();
    for (const service of services) {
      const key = asMetaString(service.features, 'group_key') ?? 'other';
      const labelAr = asMetaString(service.features, 'group_label_ar');
      const labelEn = asMetaString(service.features, 'group_label_en');
      const label = locale === 'ar' ? (labelAr ?? (key === 'printing' ? labels.printing : labels.other)) : (labelEn ?? key);
      if (!grouped.has(key)) {
        grouped.set(key, { key, label, services: [] });
      }
      const group = grouped.get(key);
      if (group) {
        group.services.push(service);
      }
    }
    return [...grouped.values()];
  }, [labels.other, labels.printing, locale, services]);

  const currentGroup = groups.find((group) => group.key === activeTab) ?? groups[0];

  const filteredServices = useMemo(() => {
    if (!currentGroup) return [];
    const bySubgroup = currentGroup.services.filter((service) => {
      if (activeSubgroup === 'all') return true;
      return asMetaString(service.features, 'subgroup_key') === activeSubgroup;
    });
    const q = search.trim().toLowerCase();
    if (!q) return bySubgroup;
    return bySubgroup.filter((service) => {
      return service.name_ar.toLowerCase().includes(q) || (service.name_en ?? '').toLowerCase().includes(q);
    });
  }, [activeSubgroup, currentGroup, search]);

  const subgroupTabs = useMemo(() => {
    if (!currentGroup || currentGroup.key !== 'printing') return [];
    const map = new Map<string, string>();
    for (const service of currentGroup.services) {
      const key = asMetaString(service.features, 'subgroup_key');
      if (!key) continue;
      const label =
        locale === 'ar'
          ? (asMetaString(service.features, 'subgroup_label_ar') ?? service.name_ar)
          : (asMetaString(service.features, 'subgroup_label_en') ?? service.name_en ?? service.name_ar);
      map.set(key, label);
    }
    return [...map.entries()].map(([key, label]) => ({ key, label }));
  }, [currentGroup, locale]);

  const handleToggleVisibility = async (service: ManagedService) => {
    await dashboardApi.updateManagedService(service.id, { is_visible: !service.is_visible });
    await loadServices();
  };

  const handleDelete = async (service: ManagedService) => {
    await dashboardApi.deleteManagedService(service.id);
    await loadServices();
  };

  const updateClassificationDraft = (serviceId: string, patch: Partial<ClassificationDraft>) => {
    setClassificationDrafts((prev) => {
      const current = prev[serviceId];
      if (!current) return prev;
      return {
        ...prev,
        [serviceId]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const groupOptions = [
    { key: 'printing', label: labels.printing },
    { key: 'design', label: labels.design },
    { key: 'cards', label: labels.cards },
    { key: 'branding', label: labels.branding },
    { key: 'other', label: labels.otherTab },
  ];

  const subgroupOptions: Record<string, Array<{ key: string; label: string }>> = {
    printing: [
      { key: 'lectures', label: locale === 'ar' ? 'محاضرات' : 'Lectures' },
      { key: 'books', label: locale === 'ar' ? 'كتب' : 'Books' },
      { key: 'thesis', label: locale === 'ar' ? 'رسائل' : 'Thesis' },
      { key: 'engineering', label: locale === 'ar' ? 'مشاريع هندسية' : 'Engineering' },
      { key: 'certificate', label: locale === 'ar' ? 'إجازات' : 'Certificates' },
      { key: 'clothing', label: locale === 'ar' ? 'ملابس' : 'Clothing' },
      { key: 'brochures', label: locale === 'ar' ? 'بروشورات' : 'Brochures' },
      { key: 'posters', label: locale === 'ar' ? 'بوسترات' : 'Posters' },
      { key: 'flex', label: locale === 'ar' ? 'فليكس' : 'Flex' },
    ],
    cards: [
      { key: 'business-cards', label: locale === 'ar' ? 'كروت شخصية' : 'Business Cards' },
      { key: 'stickers-cards', label: locale === 'ar' ? 'كروت ستيكر' : 'Sticker Cards' },
    ],
    design: [
      { key: 'graphic', label: locale === 'ar' ? 'تصميم جرافيكي' : 'Graphic' },
      { key: 'logo', label: locale === 'ar' ? 'شعارات' : 'Logos' },
    ],
    branding: [
      { key: 'rollup', label: locale === 'ar' ? 'رول أب' : 'Roll Up' },
      { key: 'vinyl', label: locale === 'ar' ? 'فينيل' : 'Vinyl' },
    ],
    other: [],
  };

  const handleSaveClassification = async (service: ManagedService) => {
    const draft = classificationDrafts[service.id];
    if (!draft) return;
    const currentFeatures = (service.features ?? {}) as Record<string, unknown>;
    const nextFeatures: Record<string, unknown> = {
      ...currentFeatures,
      group_key: draft.groupKey,
      subgroup_key: draft.subgroupKey || undefined,
      group_label_ar:
        draft.groupKey === 'printing'
          ? 'خدمات الطباعة'
          : draft.groupKey === 'design'
            ? 'خدمات التصميم'
            : draft.groupKey === 'cards'
              ? 'خدمات البطاقات'
              : draft.groupKey === 'branding'
                ? 'خدمات الهوية والإعلان'
                : 'أخرى',
      group_label_en:
        draft.groupKey === 'printing'
          ? 'Printing Services'
          : draft.groupKey === 'design'
            ? 'Design Services'
            : draft.groupKey === 'cards'
              ? 'Cards Services'
              : draft.groupKey === 'branding'
                ? 'Branding Services'
                : 'Other',
    };
    await dashboardApi.updateManagedService(service.id, {
      display_order: draft.displayOrder,
      features: nextFeatures,
    });
    await loadServices();
  };

  const handleImportLegacy = async () => {
    await dashboardApi.importLegacyServicesSeed();
    await loadServices();
  };

  if (loading) return <div className="services-state">{labels.loading}</div>;
  if (error) return <div className="services-state services-state--error">{error}</div>;

  return (
    <div className="services-page">
      <header className="services-page__head">
        <div>
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </div>
        <button type="button" className="services-btn services-btn--outline" onClick={() => void handleImportLegacy()}>
          {labels.importLegacy}
        </button>
      </header>

      <div className="services-toolbar">
        <div className="services-search">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.search} />
        </div>
        <div className="services-tabs">
          {groups.map((group) => (
            <button
              type="button"
              key={group.key}
              className={group.key === currentGroup?.key ? 'services-tab services-tab--active' : 'services-tab'}
              onClick={() => setActiveTab(group.key)}
            >
              {group.label}
            </button>
          ))}
        </div>
        {subgroupTabs.length > 0 && (
          <div className="services-tabs services-tabs--sub">
            <button
              type="button"
              className={activeSubgroup === 'all' ? 'services-tab services-tab--active' : 'services-tab'}
              onClick={() => setActiveSubgroup('all')}
            >
              {labels.all}
            </button>
            {subgroupTabs.map((subgroup) => (
              <button
                type="button"
                key={subgroup.key}
                className={activeSubgroup === subgroup.key ? 'services-tab services-tab--active' : 'services-tab'}
                onClick={() => setActiveSubgroup(subgroup.key)}
              >
                {subgroup.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredServices.length === 0 ? (
        <div className="services-state">{labels.empty}</div>
      ) : (
        <section className="services-grid">
          {filteredServices.map((service) => (
            <article key={service.id} className="service-card">
              <div className="service-card__head">
                <h3>{locale === 'ar' ? service.name_ar : (service.name_en ?? service.name_ar)}</h3>
                <span className={service.is_visible ? 'service-chip service-chip--ok' : 'service-chip service-chip--warn'}>
                  {service.is_visible ? labels.visible : labels.hidden}
                </span>
              </div>
              <p>{locale === 'ar' ? (service.description_ar ?? '—') : (service.description_en ?? service.description_ar ?? '—')}</p>
              <div className="service-card__actions">
                <button
                  type="button"
                  className="services-btn services-btn--outline"
                  onClick={() => void handleToggleVisibility(service)}
                >
                  {service.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {service.is_visible ? labels.hide : labels.show}
                </button>
                <button type="button" className="services-btn services-btn--danger" onClick={() => void handleDelete(service)}>
                  <Trash2 size={14} />
                  {labels.delete}
                </button>
              </div>
              <div className="service-card__classification">
                <label>
                  {labels.group}
                  <select
                    value={classificationDrafts[service.id]?.groupKey ?? 'other'}
                    onChange={(e) =>
                      updateClassificationDraft(service.id, {
                        groupKey: e.target.value,
                        subgroupKey: '',
                      })
                    }
                  >
                    {groupOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {labels.subgroup}
                  <select
                    value={classificationDrafts[service.id]?.subgroupKey ?? ''}
                    onChange={(e) => updateClassificationDraft(service.id, { subgroupKey: e.target.value })}
                  >
                    <option value="">{labels.all}</option>
                    {(subgroupOptions[classificationDrafts[service.id]?.groupKey ?? 'other'] ?? []).map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {labels.order}
                  <input
                    type="number"
                    min={1}
                    value={classificationDrafts[service.id]?.displayOrder ?? service.display_order}
                    onChange={(e) => updateClassificationDraft(service.id, { displayOrder: Number(e.target.value) || 1 })}
                  />
                </label>
                <button
                  type="button"
                  className="services-btn services-btn--save"
                  onClick={() => void handleSaveClassification(service)}
                >
                  {labels.saveClassification}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
