import { ExitCode, TypsumeError } from './errors.ts';
import { logger } from './logger.ts';

interface InteractionOptions {
  environment?: Record<string, string | undefined>;
  interactive?: boolean;
}

interface DownloadConsentOptions extends InteractionOptions {
  allowDownloads?: boolean;
  prompt?: () => Promise<boolean>;
}

interface GitHubActionsChoiceOptions extends InteractionOptions {
  value?: boolean;
  prompt?: () => Promise<boolean>;
}

function hasInteractiveTerminal(value?: boolean): boolean {
  return value ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function createFontDownloadConsent(options: DownloadConsentOptions = {}) {
  const environment = options.environment ?? Bun.env;
  const automaticallyAllowed =
    options.allowDownloads === true || environment.GITHUB_ACTIONS === 'true';
  let decision: boolean | undefined;

  return async (): Promise<boolean> => {
    if (automaticallyAllowed) return true;
    if (decision !== undefined) return decision;
    if (!hasInteractiveTerminal(options.interactive)) {
      throw new TypsumeError(
        'Remote font download requires confirmation. Re-run with --allow-downloads in non-interactive environments.',
        ExitCode.general,
      );
    }

    decision = await (
      options.prompt ??
      (() =>
        logger.prompt('Download remote font resources?', {
          type: 'confirm',
          initial: false,
          cancel: 'reject',
        }))
    )();
    return decision;
  };
}

export async function resolveGitHubActionsChoice(
  options: GitHubActionsChoiceOptions = {},
): Promise<boolean> {
  if (options.value !== undefined) return options.value;
  if (!hasInteractiveTerminal(options.interactive)) return false;
  return (
    options.prompt ??
    (() =>
      logger.prompt('Generate a GitHub Actions resume workflow?', {
        type: 'confirm',
        initial: false,
        cancel: 'reject',
      }))
  )();
}
