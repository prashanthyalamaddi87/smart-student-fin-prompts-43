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
    const { transactions, analysisType, budget } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating ${analysisType} analysis for ${transactions.length} transactions`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'spending_advice':
        systemPrompt = `You are a personal finance advisor for Indian students. Provide practical, culturally relevant advice for managing student expenses. Focus on local context like college canteens, auto-rickshaws, and typical student budgets in INR.`;
        userPrompt = `Based on these spending patterns, provide personalized advice (max 150 words):
        Transactions: ${JSON.stringify(transactions.slice(0, 20))}
        Budget: ₹${budget}
        
        Give specific, actionable advice for this student.`;
        break;

      case 'budget_recommendation':
        systemPrompt = `You are a financial planning expert for Indian students. Suggest realistic budget allocations based on spending patterns.`;
        userPrompt = `Analyze these transactions and suggest an optimal monthly budget breakdown:
        Transactions: ${JSON.stringify(transactions.slice(0, 20))}
        Current Budget: ₹${budget}
        
        Provide category-wise budget recommendations in a structured format.`;
        break;

      case 'pattern_analysis':
        systemPrompt = `You are a data analyst specializing in spending behavior. Identify trends and patterns in financial data.`;
        userPrompt = `Analyze spending patterns and identify insights:
        Transactions: ${JSON.stringify(transactions.slice(0, 20))}
        
        Identify trends, peak spending days, category insights, and potential areas for improvement.`;
        break;

      default:
        throw new Error('Invalid analysis type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Store the analysis in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase
          .from('ai_analysis')
          .insert({
            user_id: user.id,
            analysis_type: analysisType,
            content: { analysis, metadata: { transactionCount: transactions.length, budget } }
          });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      type: analysisType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});