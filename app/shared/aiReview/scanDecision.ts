import { extractHash, hashMatches } from './hash';

export enum BlockState {
  Unprocessed = 'Unprocessed',
  AiUnmodified = 'AiUnmodified',
  UserModified = 'UserModified',
  UserAuthored = 'UserAuthored',
  Frozen = 'Frozen',
}

export enum BlockAction {
  Fill = 'fill',
  Overwrite = 'overwrite',
  Skip = 'skip',
}

export interface DecideOptions {
  /** 块内或文件级存在冻结标签。 */
  frozen?: boolean;
  /** 显式重生成（仅绕过 Skip，绝不绕过 Frozen）。 */
  force?: boolean;
}

export interface Decision {
  state: BlockState;
  action: BlockAction;
}

export function decideBlock(body: string, options: DecideOptions = {}): Decision {
  if (options.frozen) return { state: BlockState.Frozen, action: BlockAction.Skip };

  const trimmed = body.replace(/<!--\s*DAILYTODO:[^>]*-->/g, '').trim();
  if (!trimmed) return { state: BlockState.Unprocessed, action: BlockAction.Fill };

  const hasHash = extractHash(body) !== null;
  if (!hasHash) {
    return { state: BlockState.UserAuthored, action: options.force ? BlockAction.Overwrite : BlockAction.Skip };
  }
  if (hashMatches(body)) {
    return { state: BlockState.AiUnmodified, action: BlockAction.Overwrite };
  }
  return { state: BlockState.UserModified, action: options.force ? BlockAction.Overwrite : BlockAction.Skip };
}
