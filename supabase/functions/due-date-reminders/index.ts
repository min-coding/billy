import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpoMessage {
  to: string
  sound: string
  title: string
  body: string
  data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate dates for reminders
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const oneWeekFromNow = new Date(now)
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

    // Format dates for SQL comparison (YYYY-MM-DD)
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Get bills that are due tomorrow, in 3 days, or in 1 week
    const { data: upcomingBills, error: billsError } = await supabaseClient
      .from('bills')
      .select(`
        id,
        title,
        due_date,
        status,
        created_by,
        users!bills_created_by_fkey(name, push_token)
      `)
      .in('status', ['select', 'pay'])
      .or(`due_date.eq.${formatDate(tomorrow)},due_date.eq.${formatDate(threeDaysFromNow)},due_date.eq.${formatDate(oneWeekFromNow)}`)

    if (billsError) {
      console.error('Error fetching upcoming bills:', billsError)
      throw billsError
    }

    if (!upcomingBills || upcomingBills.length === 0) {
      return new Response(JSON.stringify({ message: 'No upcoming due dates found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const notifications = []
    const pushMessages = []

    for (const bill of upcomingBills) {
      const dueDate = new Date(bill.due_date)
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      let reminderType = ''
      let reminderMessage = ''
      
      if (daysDiff === 1) {
        reminderType = 'due_tomorrow'
        reminderMessage = `"${bill.title}" is due tomorrow!`
      } else if (daysDiff === 3) {
        reminderType = 'due_in_3_days'
        reminderMessage = `"${bill.title}" is due in 3 days`
      } else if (daysDiff === 7) {
        reminderType = 'due_in_1_week'
        reminderMessage = `"${bill.title}" is due in 1 week`
      }

      if (!reminderType) continue

      // Check if we already sent this reminder today
      const { data: existingNotification } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', bill.created_by)
        .eq('type', reminderType)
        .eq('data->bill_id', bill.id)
        .gte('created_at', formatDate(now))
        .single()

      if (existingNotification) {
        console.log(`Reminder already sent for bill ${bill.id} to user ${bill.created_by}`)
        continue
      }

      // Get all participants for this bill
      const { data: participants, error: participantsError } = await supabaseClient
        .from('bill_participants')
        .select(`
          user_id,
          users(name, push_token)
        `)
        .eq('bill_id', bill.id)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
        continue
      }

      // Send notifications to all participants
      const allUsers = [
        { user_id: bill.created_by, users: bill.users },
        ...(participants || [])
      ]

      for (const participant of allUsers) {
        const user = participant.users
        if (!user || !user.push_token) continue

        // Create notification record
        const notificationData = {
          user_id: participant.user_id,
          type: reminderType,
          title: 'Bill Due Date Reminder',
          body: reminderMessage,
          data: {
            bill_id: bill.id,
            bill_title: bill.title,
            due_date: bill.due_date,
            days_until_due: daysDiff
          },
          is_read: false
        }

        notifications.push(notificationData)

        // Prepare push notification
        const pushMessage: ExpoMessage = {
          to: user.push_token,
          sound: 'default',
          title: 'Bill Due Date Reminder',
          body: reminderMessage,
          data: {
            type: 'due_date_reminder',
            bill_id: bill.id,
            bill_title: bill.title,
            due_date: bill.due_date,
            days_until_due: daysDiff
          }
        }

        pushMessages.push(pushMessage)
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error inserting notifications:', notificationError)
        throw notificationError
      }
    }

    // Send all push notifications
    const pushResults = []
    for (const message of pushMessages) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })

        const result = await response.json()
        pushResults.push({ success: response.ok, result })
        
        if (!response.ok) {
          console.error('Failed to send push notification:', result)
        }
      } catch (error) {
        console.error('Error sending push notification:', error)
        pushResults.push({ success: false, error: error.message })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${upcomingBills.length} bills`,
      notifications_sent: notifications.length,
      push_notifications_sent: pushMessages.length,
      push_results: pushResults
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in due-date-reminders function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})