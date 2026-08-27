import en, { type TranslationKey } from './en';
import fr from './fr';
import es from './es';
import de from './de';
import it from './it';
import pt from './pt';
import nl from './nl';
import ar from './ar';
import ru from './ru';
import zh from './zh';
import ja from './ja';
import tr from './tr';
import pl from './pl';
import type { LangCode } from '../languages';

export type { TranslationKey };

type Dict = Record<TranslationKey, string>;

export const dictionaries: Record<LangCode, Dict> = {
  en: en as Dict,
  fr,
  es,
  de,
  it,
  pt,
  nl,
  ar,
  ru,
  zh,
  ja,
  tr,
  pl,
};
