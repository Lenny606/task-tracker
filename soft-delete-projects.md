# Soft Delete for Projects

This plan outlines the changes needed to transition local tracker projects from hard deletion to soft deletion. This ensures that when a project is deleted, its name, color, and budget stats are preserved for historical worklogs and tasks, rather than losing their associations, while hiding the project from active project views and dropdowns.

## Success Criteria
- Deleting a project does not delete its row from the `tracker_projects` database table.
- A new `deletedAt` field tracks when the project was soft-deleted.
- Soft-deleted projects are omitted from the active Projects listing and selection dropdowns.
- Existing worklogs and tasks linked to soft-deleted projects still load and display the project details correctly (color, name).
- Confirmation text on the frontend is updated to reflect that associations are preserved.

## Tech Stack
- **Database / ORM**: SQLite + Drizzle ORM
- **Migration Tool**: `drizzle-kit`

## Affected Files
- [src/db/schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts)
- [src/repositories/trackerProject.repository.ts](file:///home/tomas/my-projects/task-tracker/src/repositories/trackerProject.repository.ts)
- [src/routes/projects.tsx](file:///home/tomas/my-projects/task-tracker/src/routes/projects.tsx)

---

## Proposed Changes

### 1. Database Schema Update
#### [MODIFY] [schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts)
Add a `deletedAt` column to the `trackerProjects` schema:
```typescript
export const trackerProjects = sqliteTable('tracker_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  timeBudgetSeconds: integer('time_budget_seconds').notNull().default(0),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Added for soft delete
});
```

### 2. Drizzle Database Migration
Generate and apply the SQLite schema change.
- Command: `npx drizzle-kit generate` to create the migration SQL.
- Command: `npx drizzle-kit migrate` (or push / manual DB schema update depending on application deployment strategy).

### 3. Repository Updates
#### [MODIFY] [trackerProject.repository.ts](file:///home/tomas/my-projects/task-tracker/src/repositories/trackerProject.repository.ts)
Override repository operations to handle soft delete and default filtering:
```typescript
import { eq, sql, isNull } from 'drizzle-orm';

// ...

  // Filter out soft-deleted projects by default
  override async findAll() {
    try {
      return await this.db
        .select()
        .from(this.table)
        .where(isNull(trackerProjects.deletedAt))
        .all();
    } catch (error) {
      console.error(`[DB Error] Failed to fetch all from ${this.tableName}:`, error);
      throw new Error(`Database error: Could not retrieve data.`);
    }
  }

  // Soft delete instead of hard delete
  override async delete(id: string) {
    try {
      return await this.db
        .update(this.table)
        .set({ deletedAt: new Date() } as any)
        .where(eq(this.table.id, id))
        .returning()
        .get();
    } catch (error) {
      console.error(`[DB Error] Failed to soft delete ${this.tableName} ID ${id}:`, error);
      throw error;
    }
  }
```

### 4. Frontend Confirmation Text Update
#### [MODIFY] [projects.tsx](file:///home/tomas/my-projects/task-tracker/src/routes/projects.tsx)
Update the delete confirmation message:
```typescript
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? Existing tasks will keep their association, but the project will be hidden.')) {
      deleteMutation.mutate({ data: { id } })
    }
  }
```

---

## Verification Plan

### Automated Tests
- Run existing Vitest tests: `npm run test`
- Add a unit test to verify `trackerProjectRepository` soft deletes instead of hard deleting, and that `findAll` excludes soft-deleted items.

### Manual Verification
1. Run application: `npm run dev`
2. Create a test project, assign it to a task.
3. Delete the project.
4. Verify the project is hidden from the Projects view.
5. Verify the task still shows the project association (name, color).
