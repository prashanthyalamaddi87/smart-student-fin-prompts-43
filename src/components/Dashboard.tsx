import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, Target, Award, PlusCircle, PieChart } from "lucide-react";
import { ExpenseChart } from "./ExpenseChart";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ReceiptUpload } from "./ReceiptUpload";
import { AIAdvisor } from "./AIAdvisor";
import { useState } from "react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export const Dashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", amount: 120, category: "food", description: "Lunch at college canteen", date: "2024-01-15" },
    { id: "2", amount: 80, category: "transport", description: "Auto-rickshaw to college", date: "2024-01-14" },
    { id: "3", amount: 2500, category: "education", description: "Engineering textbooks", date: "2024-01-13" },
    { id: "4", amount: 300, category: "entertainment", description: "Movie at PVR with friends", date: "2024-01-12" },
    { id: "5", amount: 50, category: "food", description: "Evening chai and samosa", date: "2024-01-11" },
  ]);
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyBudget = 15000;
  const budgetProgress = (totalExpenses / monthlyBudget) * 100;
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const addExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses([newExpense, ...expenses]);
  };

  const handleTransactionExtracted = (transactionData: any) => {
    const newExpense = {
      id: Date.now().toString(),
      amount: transactionData.amount || 0,
      category: transactionData.category || 'miscellaneous',
      description: transactionData.description || 'Receipt scan',
      date: transactionData.date || new Date().toISOString().split('T')[0],
    };
    setExpenses([newExpense, ...expenses]);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      food: "food",
      transport: "transport", 
      education: "education",
      entertainment: "entertainment",
      miscellaneous: "miscellaneous"
    };
    return colors[category as keyof typeof colors] || "miscellaneous";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Paisa Buddy 💰
            </h1>
            <p className="text-muted-foreground mt-2">
              Your smart dost for managing student finances in India
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Created by Prashanth Yalamaddi - Malla Reddy Vishwapeeth
            </p>
          </div>
          <Button 
            onClick={() => setIsAddExpenseOpen(true)}
            className="bg-gradient-primary hover:opacity-90 shadow-glow"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString('en-IN')}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Left</p>
                <p className="text-2xl font-bold text-success">₹{(monthlyBudget - totalExpenses).toLocaleString('en-IN')}</p>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Day</p>
                <p className="text-2xl font-bold text-info">₹{(totalExpenses / 15).toFixed(0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-info" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-warning">7 days</p>
              </div>
              <Award className="w-8 h-8 text-warning" />
            </div>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Monthly Budget Progress</h3>
              <Badge 
                variant={budgetProgress > 80 ? "destructive" : budgetProgress > 60 ? "secondary" : "default"}
                className="bg-primary/10 text-primary"
              >
                {budgetProgress.toFixed(0)}% used
              </Badge>
            </div>
            <Progress value={budgetProgress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{totalExpenses.toLocaleString('en-IN')} spent</span>
              <span>₹{monthlyBudget.toLocaleString('en-IN')} budget</span>
            </div>
          </div>
        </Card>

        {/* AI Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReceiptUpload onTransactionExtracted={handleTransactionExtracted} />
          <AIAdvisor transactions={expenses} budget={monthlyBudget} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Chart */}
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            </div>
            <ExpenseChart data={categoryTotals} />
          </Card>

          {/* Recent Expenses */}
          <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-3 h-3 rounded-full`}
                      style={{ backgroundColor: `hsl(var(--${getCategoryColor(expense.category)}))` }}
                    />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{expense.category}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">₹{expense.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <AddExpenseDialog 
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onAddExpense={addExpense}
        />
      </div>
    </div>
  );
};