import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing receipt with OCR...');

    // Use OpenAI Vision to extract receipt data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an OCR system specialized in extracting transaction data from receipts and bills. 
            Extract the following information and return it as a JSON object:
            {
              "amount": number (total amount),
              "description": string (merchant name or item description),
              "category": string (one of: food, transport, education, entertainment, miscellaneous),
              "date": string (ISO date format, use current date if not found),
              "items": array of {name: string, price: number} (individual items if available)
            }
            
            Be accurate with amounts and dates. If you can't find specific information, make reasonable assumptions based on context.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract transaction data from this receipt:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log('Extracted text:', extractedText);

    let extractedData;
    try {
      // Try to parse the JSON response from OpenAI
      extractedData = JSON.parse(extractedText);
    } catch (e) {
      console.log('Failed to parse JSON, using fallback extraction');
      // Fallback extraction if JSON parsing fails
      extractedData = {
        amount: 0,
        description: "Receipt scan - please verify details",
        category: "miscellaneous",
        date: new Date().toISOString(),
        items: []
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData,
      rawText: extractedText 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing receipt:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});