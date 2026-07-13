import type { ObsidianTemplateSettings } from '../../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  OBSIDIAN_TEMPLATE_MODULE_LABELS,
  modulesFromDailyTemplate,
  updateTemplateModule,
  type ObsidianTemplateModuleId,
} from '../../../shared/obsidianTemplateCenter';

type Language = 'zh-CN' | 'en-US';

interface ObsidianTemplateModulesSectionProps {
  language: Language;
  templates: ObsidianTemplateSettings;
  onChange: (settings: ObsidianTemplateSettings) => void;
}

export function ObsidianTemplateModulesSection({
  language,
  templates,
  onChange,
}: ObsidianTemplateModulesSectionProps) {
  const zh = language === 'zh-CN';
  const modules = modulesFromDailyTemplate(templates.dailyTemplate);

  return (
    <div className="template-module-list">
      {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId: ObsidianTemplateModuleId) => {
        const module = modules[moduleId];
        const label = OBSIDIAN_TEMPLATE_MODULE_LABELS[moduleId];
        const fixed = moduleId === 'work' || moduleId === 'inspiration' || moduleId === 'tasks';
        return (
          <div key={moduleId} className="template-module-row">
            <label className="toggle-row compact-toggle-row">
              <input
                type="checkbox"
                checked={fixed || module.enabled}
                disabled={fixed}
                onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { enabled: event.target.checked }))}
              />
              <span>{zh ? label.zh : label.en}</span>
            </label>
            <input
              value={module.title}
              onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { title: event.target.value }))}
              aria-label={`${zh ? label.zh : label.en} title`}
            />
          </div>
        );
      })}
    </div>
  );
}
