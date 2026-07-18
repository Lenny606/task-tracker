import { createServerFn } from '@tanstack/react-start';
import { getOrCreateExtensionToken } from './extensionAuth';

export const getExtensionTokenFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await getOrCreateExtensionToken();
});
