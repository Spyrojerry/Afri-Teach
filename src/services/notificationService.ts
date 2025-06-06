import { supabase } from "@/integrations/supabase/client";
import { checkColumnExists } from "@/utils/databaseDiagnostics";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

/**
 * Fetches notifications for a user
 * @param userId The user's ID
 * @returns Array of notifications
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    // Check if notifications table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
      
    if (tableError && tableError.code === '42P01') {
      console.error('Notifications table does not exist:', tableError);
      return [];
    }
    
    // Check for required columns - we need to handle both old and new schema
    const hasRelatedId = await checkColumnExists('notifications', 'related_id');
    const hasRelatedEntityId = !hasRelatedId && await checkColumnExists('notifications', 'related_entity_id');
    const hasTitle = await checkColumnExists('notifications', 'title');
    
    // Build query dynamically based on available columns
    let query = `
      id,
      user_id,
      ${hasTitle ? 'title,' : ''}
      message,
      type,
      is_read,
      created_at`;
      
    if (hasRelatedId) {
      query += ',related_id';
    } else if (hasRelatedEntityId) {
      query += ',related_entity_id';
    }
    
    // Query notifications with dynamic column selection
    const { data, error } = await supabase
      .from('notifications')
      .select(query)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      
      // If there's a column mismatch error, try a more minimal query
      if (error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('notifications')
          .select('id, user_id, message, type, is_read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          return [];
        }
        
        // Transform data with defaults for missing fields
        return (fallbackData || []).map(notification => ({
          id: notification.id,
          userId: notification.user_id,
          title: 'Notification', // Default title
          message: notification.message,
          type: notification.type,
          isRead: notification.is_read,
          createdAt: notification.created_at,
          relatedId: undefined
        }));
      }
      
      return [];
    }

    // Transform data to match the expected format
    return (data || []).map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      title: notification.title || 'Notification', // Handle missing title
      message: notification.message,
      type: notification.type,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      relatedId: notification.related_id || notification.related_entity_id
    }));
  } catch (error) {
    console.error('Unexpected error in getUserNotifications:', error);
    return [];
  }
};

/**
 * Marks a notification as read
 * @param notificationId The notification ID
 * @returns Success status
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in markNotificationAsRead:', error);
    return false;
  }
};

/**
 * Gets the count of unread notifications
 * @param userId The user's ID
 * @returns Number of unread notifications
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error in getUnreadNotificationCount:', error);
    return 0;
  }
};

/**
 * Creates a new notification for a user
 * @param notification The notification data
 * @returns The created notification ID
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'lesson_reminder' | 'booking_confirmation' | 'message' | 'system',
  relatedId?: string
): Promise<string | null> => {
  try {
    // Check if title column exists
    const hasTitle = await checkColumnExists('notifications', 'title');
    
    // Check which related ID column to use
    const hasRelatedId = await checkColumnExists('notifications', 'related_id');
    const hasRelatedEntityId = !hasRelatedId && await checkColumnExists('notifications', 'related_entity_id');
    
    // Define a proper type for notification data
    interface NotificationData {
      user_id: string;
      message: string;
      type: string;
      is_read: boolean;
      title?: string;
      related_id?: string;
      related_entity_id?: string;
    }
    
    // Build notification data based on available columns
    const notificationData: NotificationData = {
      user_id: userId,
      message,
      type,
      is_read: false
    };
    
    // Add optional fields if columns exist
    if (hasTitle) {
      notificationData.title = title;
    }
    
    if (relatedId) {
      if (hasRelatedId) {
        notificationData.related_id = relatedId;
      } else if (hasRelatedEntityId) {
        notificationData.related_entity_id = relatedId;
      }
    }
    
    // Insert notification
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
}; 