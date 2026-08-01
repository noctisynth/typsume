import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TemplatePicker() {
  const { t } = useTranslation();
  return (
    <Select defaultValue="default">
      <SelectTrigger className="w-40" size="sm" aria-label="Template">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">{t('common.defaultTemplate')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
