import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface ProducerSelectProps {
  value?: string; // producer name
  onChange: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noneLabel?: string;
  allowNone?: boolean;
}

export default function ProducerSelect({
  value,
  onChange,
  placeholder = "Search producers...",
  disabled,
  allowNone = false,
  noneLabel = "None",
}: ProducerSelectProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [open, setOpen] = useState(false);

  const fetchProducers = useCallback(async (term: string) => {
    const trimmed = term?.trim() || "";
    if (trimmed.length < 2) {
      setOptions(value ? [{ value, label: value }] : []);
      return;
    }
    const like = `%${trimmed}%`;
    const { data } = await supabase
      .from("producers")
      .select("id,name")
      .ilike("name", like)
      .order("name")
      ;
    const opts = (data || []).map((p) => ({ value: p.name, label: p.name }));
    // Ensure current value is present for display
    if (value && !opts.find((o) => o.value === value)) {
      opts.unshift({ value, label: value });
    }
    setOptions(opts);
  }, [value]);

  // Add effect to update options when value changes (e.g., from wine search)
  useEffect(() => {
    if (value && !options.find(opt => opt.value === value)) {
      // If the value is not in current options, add it to ensure it's displayed
      setOptions(prev => {
        if (prev.find(opt => opt.value === value)) return prev;
        return [{ value, label: value }, ...prev];
      });
    }
  }, [value, options]);

  // Also ensure the current value is always in options when component mounts or value changes
  useEffect(() => {
    if (value && !options.find(opt => opt.value === value)) {
      setOptions(prev => {
        if (prev.find(opt => opt.value === value)) return prev;
        return [{ value, label: value }, ...prev];
      });
    }
  }, [value]);

  useEffect(() => {
    if (open) {
      // Do not prefetch the first 1000; wait for user typing
      fetchProducers(value || "");
    }
  }, [open, fetchProducers, value]);

  const handleSearchChange = useCallback((term: string) => {
    fetchProducers(term);
  }, [fetchProducers]);

  return (
    <SearchableSelect
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Type to search producers..."
      disabled={disabled}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onOpenChange={setOpen}
      onSearchChange={handleSearchChange}
    />
  );
}
