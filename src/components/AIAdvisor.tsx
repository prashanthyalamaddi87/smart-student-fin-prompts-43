import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, BarChart3, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface AIAdvisorProps {
  transactions: Transaction[];
  budget: number;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions, budget }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<string | null>(null);
  const { toast } = useToast();

  const getAIAdvice = async (type: 'spending_advice' | 'budget_recommendation' | 'pattern_analysis') => {
    if (transactions.length === 0) {
      toast({
        title: "No data available",
        description: "Add some transactions first to get AI insights",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysisType(type);

    try {
      const { data, error } = await supabase.functions.invoke('ai-advisor', {
        body: { 
          transactions,
          analysisType: type,
          budget 
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "AI Analysis Ready! 🤖",
          description: "Your personalized financial insights are generated.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error getting AI advice:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisIcon = () => {
    switch (analysisType) {
      case 'spending_advice':
        return <Brain className="w-5 h-5 text-primary" />;
      case 'budget_recommendation':
        return <Target className="w-5 h-5 text-primary" />;
      case 'pattern_analysis':
        return <BarChart3 className="w-5 h-5 text-primary" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  const getAnalysisTitle = () => {
    switch (analysisType) {
      case 'spending_advice':
        return 'Smart Spending Advice';
      case 'budget_recommendation':
        return 'Budget Recommendations';
      case 'pattern_analysis':
        return 'Spending Pattern Analysis';
      default:
        return 'AI Insights';
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Financial Advisor</h3>
          <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
            Powered by GPT-4
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => getAIAdvice('spending_advice')}
            disabled={loading}
            className="h-auto p-4 text-left hover:bg-primary/5 hover:border-primary/50"
          >
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Smart Advice</p>
                <p className="text-xs text-muted-foreground">Get personalized spending tips</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => getAIAdvice('budget_recommendation')}
            disabled={loading}
            className="h-auto p-4 text-left hover:bg-primary/5 hover:border-primary/50"
          >
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Budget Tips</p>
                <p className="text-xs text-muted-foreground">Optimize your budget allocation</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => getAIAdvice('pattern_analysis')}
            disabled={loading}
            className="h-auto p-4 text-left hover:bg-primary/5 hover:border-primary/50"
          >
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Pattern Analysis</p>
                <p className="text-xs text-muted-foreground">Discover spending trends</p>
              </div>
            </div>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-accent/20 rounded-lg border border-border/50">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="font-medium text-sm">AI is analyzing your data...</p>
              <p className="text-xs text-muted-foreground">Generating personalized insights</p>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getAnalysisIcon()}
              <h4 className="font-medium text-sm">{getAnalysisTitle()}</h4>
              <Badge variant="outline" className="text-xs">Fresh Insights</Badge>
            </div>
            
            <div className="p-4 bg-accent/20 rounded-lg border border-border/50">
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnalysis(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close Analysis
            </Button>
          </div>
        )}

        {!analysis && !loading && (
          <div className="text-center py-4">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Select an analysis type to get AI-powered insights about your spending habits
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};