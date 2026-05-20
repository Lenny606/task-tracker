import { createServerFn } from '@tanstack/react-start';
import { trackerProjectRepository } from '../repositories/trackerProject.repository';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const getProjectsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await trackerProjectRepository.findAllWithStats();
});

export const saveProjectFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    timeBudgetSeconds: z.number().optional(),
    color: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
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
})
  .inputValidator((data: unknown) => z.object({
    id: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    return await trackerProjectRepository.delete(data.id);
  });
