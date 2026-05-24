import { createServerFn } from '@tanstack/react-start';
import { settingsRepository } from '../repositories/settings.repository';
import { getOrCreateExtensionToken } from './extensionAuth';
import { z } from 'zod';

export const getAppSettingsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await settingsRepository.getSettings();
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
    return await settingsRepository.saveSettings(data);
  });

export const getExtensionTokenFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await getOrCreateExtensionToken();
});

