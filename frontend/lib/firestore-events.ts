import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

/**
 * Log behavioral event to Firestore for ML training and deep analysis
 */
export async function logBehavioralEvent(
  eventType: string,
  properties: Record<string, any>
) {
  try {
    const eventDoc = {
      event_type: eventType,
      timestamp: Timestamp.now(),
      session_id: getSessionId(),
      user_id: getUserId(),
      ...properties,
    };

    await addDoc(collection(db, "behavioral_events"), eventDoc);
    
    console.log(`Behavioral event logged: ${eventType}`);
    
  } catch (error) {
    console.error("Failed to log behavioral event:", error);
  }
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem("novi_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("novi_session_id", sessionId);
  }
  return sessionId;
}

function getUserId(): string | null {
  return localStorage.getItem("novi_user_id");
}

/**
 * Batch events and flush periodically to reduce write costs
 */
class EventBatcher {
  private batch: any[] = [];
  private flushInterval = 5000; // Flush every 5 seconds
  private timer: NodeJS.Timeout | null = null;

  add(eventType: string, properties: Record<string, any>) {
    this.batch.push({
      event_type: eventType,
      timestamp: Timestamp.now(),
      session_id: getSessionId(),
      user_id: getUserId(),
      ...properties,
    });

    // Start flush timer if not already running
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }

    // Flush immediately if batch is large
    if (this.batch.length >= 10) {
      this.flush();
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    try {
      const eventsToFlush = [...this.batch];
      this.batch = [];

      // Write all events in parallel
      await Promise.all(
        eventsToFlush.map(event =>
          addDoc(collection(db, "behavioral_events"), event)
        )
      );

      console.log(`Flushed ${eventsToFlush.length} behavioral events`);
      
    } catch (error) {
      console.error("Failed to flush events:", error);
    } finally {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }
}

export const eventBatcher = new EventBatcher();

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    eventBatcher.flush();
  });
}
