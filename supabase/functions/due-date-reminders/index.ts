import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Bill {
  id: string
  title: string
  status: 'select' | 'pay' | 'closed'
  due_date: string
  created_by: string
}

interface BillParticipant {
  user_id: string
  has_submitted: boolean
  payment_status: 'unpaid' | 'paid' | 'verified'
  users: {
    name: string
  }
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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Calculate reminder dates
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    console.log(`Processing due date reminders for ${todayStr}`)

    // Fetch bills that are not closed and have due dates
    const { data: bills, error: billsError } = await supabaseClient
      .from('bills')
      .select('id, title, status, due_date, created_by')
      .neq('status', 'closed')
      .not('due_date', 'is', null)
      .in('due_date', [tomorrowStr, todayStr, yesterdayStr]) // Only bills due tomorrow, today, or yesterday

    if (billsError) {
      console.error('Error fetching bills:', billsError)
      throw billsError
    }

    if (!bills || bills.length === 0) {
      console.log('No bills found with upcoming or overdue dates')
      return new Response(JSON.stringify({ message: 'No bills to process' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let totalNotificationsSent = 0

    for (const bill of bills) {
      console.log(`Processing bill: ${bill.title} (${bill.id}) - Status: ${bill.status}, Due: ${bill.due_date}`)

      // Determine reminder stage based on due date
      let reminderStage: string
      let reminderTitle: string
      let reminderBodyTemplate: string

      if (bill.due_date === tomorrowStr) {
        reminderStage = 'upcoming_1_day'
      } else if (bill.due_date === todayStr) {
        reminderStage = 'due_today'
      } else if (bill.due_date === yesterdayStr) {
        reminderStage = 'overdue_1_day'
      } else {
        continue // Skip bills that don't match our reminder criteria
      }

      // Get bill participants
      const { data: participants, error: participantsError } = await supabaseClient
        .from('bill_participants')
        .select(`
          user_id,
          has_submitted,
          payment_status,
          users(name)
        `)
        .eq('bill_id', bill.id)

      if (participantsError) {
        console.error(`Error fetching participants for bill ${bill.id}:`, participantsError)
        continue
      }

      if (!participants || participants.length === 0) {
        console.log(`No participants found for bill ${bill.id}`)
        continue
      }

      // Determine which users need reminders based on bill status
      let usersToNotify: BillParticipant[] = []

      if (bill.status === 'select') {
        // For 'select' status: notify users who haven't submitted
        usersToNotify = participants.filter(p => !p.has_submitted)
        reminderTitle = "🧾 Bill Reminder: Submit Your Selections!"
        reminderBodyTemplate = "⏰ Hey {username}! Your selections for '{bill_title}' are due {timing}. Please submit them!"
      } else if (bill.status === 'pay') {
        // For 'pay' status: notify users with unpaid status
        usersToNotify = participants.filter(p => p.payment_status === 'unpaid')
        reminderTitle = "💰 Bill Reminder: Payment Due!"
        reminderBodyTemplate = "⏰ Hey {username}! Your payment for '{bill_title}' is due {timing}. Please make your payment!"
      }

      if (usersToNotify.length === 0) {
        console.log(`No users need reminders for bill ${bill.id}`)
        continue
      }

      // Determine timing text
      let timingText: string
      if (reminderStage === 'upcoming_1_day') {
        timingText = 'tomorrow'
      } else if (reminderStage === 'due_today') {
        timingText = 'today'
      } else if (reminderStage === 'overdue_1_day') {
        timingText = 'yesterday and is now overdue'
      } else {
        timingText = 'soon'
      }

      // Send notifications to users who need them
      for (const participant of usersToNotify) {
        // Check if this specific reminder has already been sent to this user for this bill
        const { data: existingNotification } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('user_id', participant.user_id)
          .eq('type', `bill_due_reminder_${reminderStage}`)
          .like('data', `%"bill_id":"${bill.id}"%`)
          .single()

        if (existingNotification) {
          console.log(`Reminder ${reminderStage} already sent to user ${participant.user_id} for bill ${bill.id}`)
          continue
        }

        // Create personalized notification body
        const notificationBody = reminderBodyTemplate
          .replace('{username}', participant.users?.name || 'there')
          .replace('{bill_title}', bill.title)
          .replace('{timing}', timingText)

        // Insert notification
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: participant.user_id,
            type: `bill_due_reminder_${reminderStage}`,
            title: reminderTitle,
            body: notificationBody,
            data: {
              bill_id: bill.id,
              bill_title: bill.title,
              reminder_stage: reminderStage,
              bill_status: bill.status,
              due_date: bill.due_date
            }
          })

        if (notificationError) {
          console.error(`Error creating notification for user ${participant.user_id}:`, notificationError)
        } else {
          console.log(`Sent ${reminderStage} reminder to user ${participant.user_id} for bill ${bill.id}`)
          totalNotificationsSent++
        }
      }
    }

    console.log(`Due date reminder processing complete. Total notifications sent: ${totalNotificationsSent}`)

    return new Response(JSON.stringify({ 
      success: true,
      processed_bills: bills.length,
      notifications_sent: totalNotificationsSent,
      date: todayStr
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