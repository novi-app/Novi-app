import { v4 as uuidv4 } from "uuid";

/**
 * Session management
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem("novi_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("novi_session_id", sessionId);
  }
  return sessionId;
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("novi_user_id");
}

/**
 * Event batcher - collects events and sends to backend API
 */
class EventBatcher {
  private batch: any[] = [];
  private flushInterval = 5000; // Flush every 5 seconds
  private timer: NodeJS.Timeout | null = null;

  add(eventType: string, properties: Record<string, any>) {
    const event = {
      event_id: uuidv4(), // Generate unique ID for deduplication
      event_type: eventType,
      timestamp: Date.now(),
      session_id: getSessionId(),
      user_id: getUserId(),
      ...properties,
    };

    this.batch.push(event);

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

    const eventsToFlush = [...this.batch];
    this.batch = [];

    try {
      // Send to backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/event`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: getSessionId(),
            events: eventsToFlush,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Flushed ${result.count} behavioral events`);
      
      if (result.duplicates_skipped) {
        console.log(`   (${result.duplicates_skipped} duplicates skipped)`);
      }
      
    } catch (error) {
      console.error("Failed to flush events:", error);
      // Put failed events back in batch for retry
      this.batch.unshift(...eventsToFlush);
    } finally {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }
}

export const eventBatcher = new EventBatcher();

/**
 * Log a single behavioral event (uses batching under the hood)
 */
export function logBehavioralEvent(
  eventType: string,
  properties: Record<string, any>
) {
  eventBatcher.add(eventType, properties);
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    eventBatcher.flush();
  });
}
