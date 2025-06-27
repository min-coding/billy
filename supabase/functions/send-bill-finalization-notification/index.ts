import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    user_id: string
    type: string
    title: string
    body: string
    data: any
    is_read: boolean
    created_at: string
  }
  schema: string
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

    // Parse the webhook payload
    const payload: NotificationPayload = await req.json()
    
    // Only process INSERT events on notifications table for bill_finalized type
    if (payload.type !== 'INSERT' || 
        payload.table !== 'notifications' || 
        payload.record.type !== 'bill_finalized') {
      return new Response('Not a bill finalization notification', {
        status: 200,
        headers: corsHeaders
      })
    }

    const notification = payload.record

    // Get the user's push token
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('push_token, name')
      .eq('id', notification.user_id)
      .single()

    if (userError || !user?.push_token) {
      console.log('No push token found for user:', notification.user_id)
      return new Response('No push token found', {
        status: 200,
        headers: corsHeaders
      })
    }

    // Prepare the Expo push notification
    const message: ExpoMessage = {
      to: user.push_token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data
    }

    // Send the push notification using Expo's push service
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

    if (response.ok) {
      console.log('Push notification sent successfully:', result)
      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      console.error('Failed to send push notification:', result)
      return new Response(JSON.stringify({ error: 'Failed to send notification', details: result }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error in send-bill-finalization-notification function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})