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
    
    // Only process INSERT events on notifications table
    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      return new Response('Not a notification insert event', {
        status: 200,
        headers: corsHeaders
      })
    }

    const notification = payload.record

    // Get all push tokens for the user
    const { data: pushTokens, error: tokenError } = await supabaseClient
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', notification.user_id)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response('Error fetching push tokens', {
        status: 500,
        headers: corsHeaders
      })
    }

    if (!pushTokens || pushTokens.length === 0) {
      console.log('No push tokens found for user:', notification.user_id)
      return new Response('No push tokens found', {
        status: 200,
        headers: corsHeaders
      })
    }

    // Send push notification to all user's devices
    const messages: ExpoMessage[] = pushTokens.map(tokenRecord => ({
      to: tokenRecord.token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data
    }))

    // Send notifications in batches to Expo's push service
    const results = []
    for (const message of messages) {
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
        results.push({ token: message.to, success: response.ok, result })

        if (!response.ok) {
          console.error('Failed to send push notification to token:', message.to, result)
        }
      } catch (error) {
        console.error('Error sending push notification to token:', message.to, error)
        results.push({ token: message.to, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    console.log(`Push notifications sent: ${successCount} successful, ${failureCount} failed`)

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      failed: failureCount,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})