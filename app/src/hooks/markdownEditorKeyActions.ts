import type { InputKeybindingCommand } from '../../shared/inputKeybindings';
import type { EditorResult, EditorState } from '../utils/markdownEditor';
import {
  continueListOnEnter,
  indentSelection,
  outdentSelection,
  wrapSelection,
} from '../utils/markdownEditor';

export type MarkdownEditorKeyAction = InputKeybindingCommand;

export function applyMarkdownEditorKeyAction(
  action: MarkdownEditorKeyAction,
  state: EditorState,
): EditorResult | null {
  switch (action) {
    case 'indent':
      return indentSelection(state);
    case 'outdent':
      return outdentSelection(state);
    case 'continue-list':
      return continueListOnEnter(state);
    case 'bold':
      return wrapSelection(state, '**');
    case 'italic':
      return wrapSelection(state, '*');
    default:
      return null;
  }
}
