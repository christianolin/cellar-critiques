import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onColumnToggle: (columnKey: string) => void;
  onResetColumns: () => void;
}

export function ColumnSelector({ 
  columns, 
  visibleColumns, 
  onColumnToggle,
  onResetColumns 
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Table Columns</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onResetColumns();
                setIsOpen(false);
              }}
              className="text-xs h-7"
            >
              Reset
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column.key}`}
                  checked={visibleColumns.includes(column.key)}
                  onCheckedChange={() => onColumnToggle(column.key)}
                />
                <label
                  htmlFor={`column-${column.key}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}