import { useTranslation } from 'react-i18next';
import {
  modelsForProvider,
  type ModelOption,
} from '@shared/models';
import type { ProviderId } from '@shared/types';

interface ModelSelectorProps {
  provider: ProviderId;
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ provider, value, onChange }: ModelSelectorProps) {
  const { t } = useTranslation();
  const options = modelsForProvider(provider);

  return (
    <section className="space-y-2">
      <label className="text-sm font-semibold" htmlFor="model-select">
        {t('model.label')}
      </label>
      <select
        id="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-vscode-inputBorder bg-vscode-input px-2 py-1.5 text-sm outline-none focus:border-vscode-focus"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {formatOptionLabel(option, t)}
          </option>
        ))}
      </select>
      <p className="text-xs text-vscode-muted">{t('model.hint')}</p>
    </section>
  );
}

function formatOptionLabel(
  option: ModelOption,
  t: (key: string) => string,
): string {
  const tierLabel =
    option.tier === 'economy'
      ? t('model.tier.economy')
      : option.tier === 'balanced'
        ? t('model.tier.balanced')
        : t('model.tier.quality');
  return `${option.id} — ${tierLabel}`;
}
