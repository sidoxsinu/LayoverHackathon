import { createBrowserClient } from './supabase';
import { SavedState } from './storage';

const QUEUE_KEY = 'gate.sync_queue';

export interface PendingSave {
  id: string; // The generated layover uuid
  state: SavedState;
  survivedSeconds: number;
}

export function queueLayoverForSave(state: SavedState, survivedSeconds: number) {
  try {
    const qRaw = localStorage.getItem(QUEUE_KEY);
    const queue: PendingSave[] = qRaw ? JSON.parse(qRaw) : [];
    
    // Check if already in queue
    if (!queue.find(q => q.id === state.layoverId)) {
      queue.push({
        id: state.layoverId,
        state,
        survivedSeconds
      });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
    
    // Fire and forget sync attempt
    flushSyncQueue();
  } catch {}
}

export async function flushSyncQueue() {
  const supabase = createBrowserClient();
  if (!supabase) return; // Unconfigured
  
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) return; // Not signed in

  try {
    const qRaw = localStorage.getItem(QUEUE_KEY);
    if (!qRaw) return;
    
    const queue: PendingSave[] = JSON.parse(qRaw);
    if (queue.length === 0) return;

    const remaining = [...queue];

    for (const pending of queue) {
      const { id, state, survivedSeconds } = pending;
      
      const missionsDone = state.log.filter(l => l.status === 'completed').length;
      const missionsSkipped = state.log.filter(l => l.status === 'skipped').length;
      
      // Upsert Layover
      const { error: layoverError } = await supabase
        .from('layovers')
        .upsert({
          id,
          user_id: session.session.user.id,
          location: state.airportName || 'TBA',
          gate: state.gate || 'TBA',
          departure_at: new Date(state.departureMs).toISOString(),
          return_by_at: new Date(state.returnByMs).toISOString(),
          started_at: new Date(state.startedMs).toISOString(),
          ended_at: new Date().toISOString(),
          survived_seconds: survivedSeconds,
          xp: state.xp,
          missions_done: missionsDone,
          missions_skipped: missionsSkipped,
          is_demo: state.demo
        });

      if (layoverError) {
        console.error('Failed to sync layover:', layoverError);
        continue; // Try again later
      }

      // Upsert Missions
      if (state.log.length > 0) {
        const { error: logError } = await supabase
          .from('mission_log')
          .upsert(
            state.log.map(l => ({
              id: (l as any).logId || crypto.randomUUID(), // fallback if legacy log
              layover_id: id,
              user_id: session.session.user.id,
              mission_code: l.id,
              title: l.text,
              status: l.status,
              xp: l.xp,
              created_at: new Date(l.ts).toISOString()
            }))
          );
          
        if (logError) {
          console.error('Failed to sync missions:', logError);
          // If we fail here, the layover is saved but missions aren't. We'll leave it in queue to retry.
          continue; 
        }
      }

      // Success! Remove from remaining
      remaining.shift();
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  } catch (e) {
    console.error('Sync queue error:', e);
  }
}
