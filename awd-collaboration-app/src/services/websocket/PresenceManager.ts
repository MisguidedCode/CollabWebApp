import { UserPresence, PresenceStatus } from './types';
import { EventEmitter } from './EventEmitter';

export class PresenceManager {
  private users: Map<string, UserPresence>;
  private heartbeatInterval: number;
  private inactivityTimeout: number;
  private heartbeatTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private eventEmitter: EventEmitter;
  private currentUserId: string;
  private currentWorkspaceId: string;

  constructor(
    currentUserId: string,
    currentWorkspaceId: string,
    options: {
      heartbeatInterval?: number;
      inactivityTimeout?: number;
    } = {}
  ) {
    this.users = new Map();
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
    this.inactivityTimeout = options.inactivityTimeout || 60000; // 1 minute
    this.eventEmitter = new EventEmitter();
    this.currentUserId = currentUserId;
    this.currentWorkspaceId = currentWorkspaceId;
  }

  public start(): void {
    // Set initial presence for current user
    this.updatePresence(this.currentUserId, {
      status: PresenceStatus.ONLINE,
      lastSeen: Date.now(),
      workspaceId: this.currentWorkspaceId
    });

    // Start heartbeat for current user
    this.startHeartbeat();

    // Start cleanup timer for other users
    this.startCleanup();
  }

  public stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Set user as offline
    this.updatePresence(this.currentUserId, {
      status: PresenceStatus.OFFLINE,
      lastSeen: Date.now(),
      workspaceId: this.currentWorkspaceId
    });
  }

  public updatePresence(
    userId: string,
    presence: Omit<UserPresence, 'userId'>
  ): void {
    const userPresence: UserPresence = {
      userId,
      ...presence
    };

    this.users.set(userId, userPresence);
    this.eventEmitter.emit('presence', userPresence);
  }

  public getPresence(userId: string): UserPresence | undefined {
    return this.users.get(userId);
  }

  public getAllPresences(): UserPresence[] {
    return Array.from(this.users.values());
  }

  public onPresenceChange(
    callback: (presence: UserPresence) => void
  ): () => void {
    return this.eventEmitter.on('presence', callback);
  }

  private startHeartbeat(): void {
    // Clear any existing heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Start new heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.updatePresence(this.currentUserId, {
        status: PresenceStatus.ONLINE,
        lastSeen: Date.now(),
        workspaceId: this.currentWorkspaceId
      });
    }, this.heartbeatInterval);
  }

  private startCleanup(): void {
    // Clear any existing cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Start new cleanup timer
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      
      for (const [userId, presence] of Array.from(this.users.entries())) {
        // Skip current user as they're managed by heartbeat
        if (userId === this.currentUserId) continue;

        // Check if user has been inactive longer than timeout
        if (now - presence.lastSeen > this.inactivityTimeout) {
          if (presence.status !== PresenceStatus.OFFLINE) {
            this.updatePresence(userId, {
              ...presence,
              status: PresenceStatus.OFFLINE,
              lastSeen: now
            });
          }
        }
      }
    }, this.heartbeatInterval);
  }

  public setAway(): void {
    this.updatePresence(this.currentUserId, {
      status: PresenceStatus.AWAY,
      lastSeen: Date.now(),
      workspaceId: this.currentWorkspaceId
    });
  }

  public setOnline(): void {
    this.updatePresence(this.currentUserId, {
      status: PresenceStatus.ONLINE,
      lastSeen: Date.now(),
      workspaceId: this.currentWorkspaceId
    });
  }

  public updateWorkspace(workspaceId: string): void {
    this.currentWorkspaceId = workspaceId;
    this.setOnline();
  }

  public cleanup(): void {
    this.stop();
    this.users.clear();
    this.eventEmitter.removeAllListeners();
  }

  public getCurrentWorkspaceId(): string {
    return this.currentWorkspaceId;
  }
}
