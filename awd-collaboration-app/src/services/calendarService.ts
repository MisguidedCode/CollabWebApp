import { 
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    orderBy
  } from 'firebase/firestore';
  import { db, COLLECTIONS } from '../config/firebase';
  import { CalendarEvent } from '../types/calendar';
  
  // Helper function to safely convert Firestore timestamps to ISO strings
  const convertTimestampToString = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // Already a string
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return undefined;
  };
  
  // Convert Firestore data to CalendarEvent object
  const eventConverter = {
    fromFirestore: (snapshot: any, options?: any) => {
      const data = snapshot.data(options);
      
      // Convert all timestamp fields
      return {
        ...data,
        id: snapshot.id,
        start: convertTimestampToString(data.start) || new Date().toISOString(),
        end: convertTimestampToString(data.end) || new Date().toISOString(),
        createdAt: convertTimestampToString(data.createdAt) || new Date().toISOString(),
        updatedAt: convertTimestampToString(data.updatedAt),
        recurring: data.recurring ? {
          ...data.recurring,
          endDate: convertTimestampToString(data.recurring.endDate)
        } : undefined
      } as CalendarEvent;
    },
    toFirestore: (event: CalendarEvent) => {
      const { id, ...eventData } = event;
      
      // Convert ISO strings to Firestore timestamps
      return {
        ...eventData,
        start: event.start ? Timestamp.fromDate(new Date(event.start)) : serverTimestamp(),
        end: event.end ? Timestamp.fromDate(new Date(event.end)) : serverTimestamp(),
        createdAt: event.createdAt ? Timestamp.fromDate(new Date(event.createdAt)) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        recurring: event.recurring ? {
          ...event.recurring,
          endDate: event.recurring.endDate ? Timestamp.fromDate(new Date(event.recurring.endDate)) : null
        } : null
      };
    }
  };
  
  // Create a new event
  export const createEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    const docRef = doc(eventsCollection);
    const newEvent = { ...event, id: docRef.id };
    
    await setDoc(docRef, eventConverter.toFirestore(newEvent));
    
    // Get the document back to ensure timestamps are converted
    const snapshot = await getDoc(docRef);
    return eventConverter.fromFirestore(snapshot);
  };
  
  // Get an event by ID
  export const getEventById = async (eventId: string): Promise<CalendarEvent | null> => {
    const eventDoc = doc(db, COLLECTIONS.EVENTS, eventId);
    const snapshot = await getDoc(eventDoc);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return eventConverter.fromFirestore(snapshot);
  };
  
  // Get all events
  export const getAllEvents = async (): Promise<CalendarEvent[]> => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    const q = query(eventsCollection, orderBy('start', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => eventConverter.fromFirestore(doc));
  };
  
  // Get events for a specific date range
  export const getEventsInRange = async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    // Query events that start within the range OR end within the range OR span the entire range
    const q = query(
      eventsCollection,
      where('start', '<=', endTimestamp),
      where('end', '>=', startTimestamp),
      orderBy('start', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => eventConverter.fromFirestore(doc));
  };
  
  // Update an event
  export const updateEvent = async (event: CalendarEvent): Promise<void> => {
    const eventDoc = doc(db, COLLECTIONS.EVENTS, event.id);
    await updateDoc(eventDoc, eventConverter.toFirestore(event));
  };
  
  // Delete an event
  export const deleteEvent = async (eventId: string): Promise<void> => {
    const eventDoc = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(eventDoc);
  };
  
  // Get events for a specific user
  export const getUserEvents = async (userId: string): Promise<CalendarEvent[]> => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    const q = query(
      eventsCollection,
      where('createdBy', '==', userId),
      orderBy('start', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => eventConverter.fromFirestore(doc));
  };
  
  // Get events with a specific participant
  export const getParticipantEvents = async (userId: string): Promise<CalendarEvent[]> => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    const q = query(
      eventsCollection,
      where('participants', 'array-contains', userId),
      orderBy('start', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => eventConverter.fromFirestore(doc));
  };
  
  // Subscribe to user's events
  export const subscribeToUserEvents = (userId: string, callback: (events: CalendarEvent[]) => void) => {
    const eventsCollection = collection(db, COLLECTIONS.EVENTS);
    
    // Combined query for events created by user or where user is a participant
    const q1 = query(
      eventsCollection,
      where('createdBy', '==', userId),
      orderBy('start', 'asc')
    );
    
    const q2 = query(
      eventsCollection,
      where('participants', 'array-contains', userId),
      orderBy('start', 'asc')
    );
    
    // Subscribe to both queries
    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
      const events1 = snapshot1.docs.map(doc => eventConverter.fromFirestore(doc));
      
      // Subscribe to participant events
      const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
        const events2 = snapshot2.docs.map(doc => eventConverter.fromFirestore(doc));
        
        // Combine results and remove duplicates
        const combinedEvents = [...events1];
        events2.forEach(event => {
          if (!combinedEvents.some(e => e.id === event.id)) {
            combinedEvents.push(event);
          }
        });
        
        // Sort by start date
        combinedEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        
        callback(combinedEvents);
      });
      
      // Return a combined unsubscribe function
      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    });
    
    // Return the outer unsubscribe function
    return unsubscribe1;
  };