import { createServerFn } from '@tanstack/react-start';
import { trackerProjectRepository } from '../repositories/trackerProject.repository';
import { randomUUID } from 'node:crypto';

export const getProjectsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await trackerProjectRepository.findAllWithStats();
});

export const saveProjectFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: any }) => {
  const projectData = {
    id: data.id || randomUUID(),
    name: data.name,
    description: data.description || null,
    timeBudgetSeconds: data.timeBudgetSeconds || 0,
    color: data.color || '#6366f1',
    updatedAt: new Date(),
  };

  if (data.id) {
    return await trackerProjectRepository.update(data.id, projectData);
  } else {
    return await trackerProjectRepository.create({
      ...projectData,
      createdAt: new Date(),
    });
  }
});

export const deleteProjectFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: { id: string } }) => {
  return await trackerProjectRepository.delete(data.id);
});
