import { createServerFn } from '@tanstack/react-start';
import { settingsRepository } from '../repositories/settings.repository';
import { z } from 'zod';

const SECRET_FIELDS = ['geminiApiKey', 'openaiApiKey', 'jiraApiKey', 'jiraTempoApiKey'] as const;

function sanitizeSettings(row: Awaited<ReturnType<typeof settingsRepository.getSettings>>) {
  return {
    aiProvider: row?.aiProvider || 'gemini',
    aiModel: row?.aiModel || 'gemini-2.5-flash',
    jiraEmail: row?.jiraEmail || '',
    jiraUrl: row?.jiraUrl || '',
    hasGeminiApiKey: !!row?.geminiApiKey,
    hasOpenaiApiKey: !!row?.openaiApiKey,
    hasJiraApiKey: !!row?.jiraApiKey,
    hasJiraTempoApiKey: !!row?.jiraTempoApiKey,
  };
}

export const getAppSettingsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return sanitizeSettings(await settingsRepository.getSettings());
});

export const saveAppSettingsFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    aiProvider: z.string().optional(),
    aiModel: z.string().optional(),
    geminiApiKey: z.string().optional(),
    openaiApiKey: z.string().optional(),
    jiraApiKey: z.string().optional(),
    jiraEmail: z.string().optional(),
    jiraTempoApiKey: z.string().optional(),
    jiraUrl: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Empty secret fields mean "leave unchanged" so the client never has to
    // round-trip stored keys just to update other settings.
    const patch: Record<string, string> = { ...data } as Record<string, string>;
    for (const field of SECRET_FIELDS) {
      if (!patch[field]) delete patch[field];
    }

    return sanitizeSettings(await settingsRepository.saveSettings(patch));
  });
