import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'secondary' | 'warning' | 'success';
  className?: string;
}

const variants = {
  default: "bg-card border-border",
  primary: "bg-primary-light/10 border-primary-light/20",
  secondary: "bg-secondary-light/10 border-secondary-light/20", 
  warning: "bg-warning/10 border-warning/20",
  success: "bg-success/10 border-success/20",
};

const iconVariants = {
  default: "text-foreground",
  primary: "text-primary-light",
  secondary: "text-secondary-light",
  warning: "text-warning",
  success: "text-success",
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
}) => {
  return (
    <Card className={cn(
      "shadow-card hover:shadow-elevated transition-shadow duration-200",
      variants[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-card-foreground">
                {value.toLocaleString('id-ID')}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-lg bg-background/50",
            iconVariants[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};