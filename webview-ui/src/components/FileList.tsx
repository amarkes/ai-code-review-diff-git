import { useTranslation } from 'react-i18next';
import type { ModifiedFile } from '@shared/types';
import { Button } from './Button';

interface FileListProps {
  files: ModifiedFile[];
  selectedCount: number;
  onToggle: (path: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRefresh: () => void;
}

const statusColors: Record<ModifiedFile['status'], string> = {
  added: 'text-green-400',
  modified: 'text-yellow-400',
  deleted: 'text-red-400',
  renamed: 'text-blue-400',
  copied: 'text-purple-400',
};

export function FileList({
  files,
  selectedCount,
  onToggle,
  onSelectAll,
  onRefresh,
}: FileListProps) {
  const { t } = useTranslation();
  const allSelected = files.length > 0 && files.every((f) => f.selected);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('files.title')}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={onRefresh}>
            {t('files.refresh')}
          </Button>
          {files.length > 0 && (
            <Button variant="ghost" onClick={() => onSelectAll(!allSelected)}>
              {allSelected ? t('files.deselectAll') : t('files.selectAll')}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-vscode-muted">{t('files.selected', { count: selectedCount })}</p>

      {files.length === 0 ? (
        <p className="rounded border border-dashed border-vscode-border p-3 text-sm text-vscode-muted">
          {t('files.empty')}
        </p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-vscode-border p-1">
          {files.map((file) => {
            const fileName = file.path.split(/[/\\]/).pop() ?? file.path;
            return (
              <li key={file.path}>
                <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={file.selected}
                    onChange={(e) => onToggle(file.path, e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm" title={file.path}>
                      {fileName}
                    </span>
                    <span className={`text-xs ${statusColors[file.status]}`}>
                      {t(`status.${file.status}`)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
