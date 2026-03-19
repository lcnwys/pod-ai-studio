import { create } from 'zustand';
import type { JobStatus, JobType } from '@/lib/types';

interface ActiveTask {
  id: string;
  type: JobType;
  status: JobStatus;
  externalTaskId?: string;
  createdAt: string;
  params?: Record<string, unknown>;
}

interface TaskState {
  activeTasks: Map<string, ActiveTask>;
  addTask: (id: string, task: ActiveTask) => void;
  updateTask: (id: string, patch: Partial<ActiveTask>) => void;
  removeTask: (id: string) => void;
  getTasksByType: (type: JobType) => ActiveTask[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  activeTasks: new Map(),
  addTask: (id, task) =>
    set((state) => {
      const m = new Map(state.activeTasks);
      m.set(id, task);
      return { activeTasks: m };
    }),
  updateTask: (id, patch) =>
    set((state) => {
      const m = new Map(state.activeTasks);
      const cur = m.get(id);
      if (cur) m.set(id, { ...cur, ...patch });
      return { activeTasks: m };
    }),
  removeTask: (id) =>
    set((state) => {
      const m = new Map(state.activeTasks);
      m.delete(id);
      return { activeTasks: m };
    }),
  getTasksByType: (type) => {
    const tasks: ActiveTask[] = [];
    get().activeTasks.forEach((t) => {
      if (t.type === type) tasks.push(t);
    });
    return tasks;
  },
}));
