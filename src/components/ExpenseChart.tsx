import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenseChartProps {
  data: Record<string, number>;
}

export const ExpenseChart = ({ data }: ExpenseChartProps) => {
  const chartData = Object.entries(data).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
    category
  }));

  const getColor = (category: string) => {
    const colors = {
      food: 'hsl(25 95% 53%)',
      transport: 'hsl(221 83% 53%)', 
      education: 'hsl(142 76% 36%)',
      entertainment: 'hsl(271 81% 56%)',
      miscellaneous: 'hsl(240 5% 64.9%)'
    };
    return colors[category as keyof typeof colors] || colors.miscellaneous;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-primary font-bold">${data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.category)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};