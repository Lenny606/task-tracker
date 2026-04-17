import { createServerFn } from '@tanstack/react-start';
import { settingsRepository } from '../repositories/settings.repository';

export const getAppSettingsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await settingsRepository.getSettings();
});

export const saveAppSettingsFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: any }) => {
  return await settingsRepository.saveSettings(data);
});
