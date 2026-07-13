import { AppLanguage } from '../shared/appSettings';
import { enShellText } from './i18n/shellTextEn';
import { zhShellText } from './i18n/shellTextZh';

export function getShellText(language: AppLanguage): typeof zhShellText {
  return language === 'en-US' ? enShellText : zhShellText;
}
