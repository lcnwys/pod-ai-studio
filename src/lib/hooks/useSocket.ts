'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskStore } from '@/lib/stores/useTaskStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const updateTask = useTaskStore((s) => s.updateTask);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      socket.emit('join:user', userId);
    });

    // Listen for task updates
    socket.on('task:updated', (data: { jobId: string; status: string; result?: any }) => {
      console.log('[Socket] Task updated:', data);

      // Update Zustand store
      updateTask(data.jobId, {
        status: data.status as any,
      });

      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    });

    // Listen for batch progress
    socket.on('batch:progress', (data: any) => {
      console.log('[Socket] Batch progress:', data);
      queryClient.invalidateQueries({ queryKey: ['batchJobs'] });
      queryClient.invalidateQueries({ queryKey: ['batchJob', data.batchJobId] });
    });

    socket.on('batch:completed', (data: any) => {
      console.log('[Socket] Batch completed:', data);
      queryClient.invalidateQueries({ queryKey: ['batchJobs'] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, queryClient, updateTask]);

  const joinBatch = useCallback((batchJobId: string) => {
    socketRef.current?.emit('join:batch', batchJobId);
  }, []);

  const leaveBatch = useCallback((batchJobId: string) => {
    socketRef.current?.emit('leave:batch', batchJobId);
  }, []);

  return { joinBatch, leaveBatch };
}
