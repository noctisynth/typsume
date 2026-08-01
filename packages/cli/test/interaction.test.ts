import { describe, expect, test } from 'bun:test';
import { ExitCode } from '../src/errors.ts';
import { createFontDownloadConsent, resolveGitHubActionsChoice } from '../src/interaction.ts';

describe('CLI interaction policy', () => {
  test('explicit and GitHub Actions authorization skip the download prompt', async () => {
    let prompts = 0;
    const prompt = async () => {
      prompts += 1;
      return false;
    };

    expect(await createFontDownloadConsent({ allowDownloads: true, prompt })()).toBe(true);
    expect(
      await createFontDownloadConsent({ environment: { GITHUB_ACTIONS: 'true' }, prompt })(),
    ).toBe(true);
    expect(prompts).toBe(0);
  });

  test('interactive font consent is requested once and reused', async () => {
    let prompts = 0;
    const consent = createFontDownloadConsent({
      environment: {},
      interactive: true,
      prompt: async () => {
        prompts += 1;
        return false;
      },
    });

    expect(await consent()).toBe(false);
    expect(await consent()).toBe(false);
    expect(prompts).toBe(1);
  });

  test('unapproved non-interactive downloads fail clearly', async () => {
    await expect(
      createFontDownloadConsent({ environment: {}, interactive: false })(),
    ).rejects.toMatchObject({ exitCode: ExitCode.general });
  });

  test('GitHub Actions generation honors explicit, interactive, and non-interactive choices', async () => {
    expect(await resolveGitHubActionsChoice({ value: true, interactive: false })).toBe(true);
    expect(await resolveGitHubActionsChoice({ interactive: false })).toBe(false);
    expect(await resolveGitHubActionsChoice({ interactive: true, prompt: async () => true })).toBe(
      true,
    );
  });
});
