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
    const like = term?.trim() ? `%${term.trim()}%` : "%";
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

  useEffect(() => {
    if (open) {
      fetchProducers("");
    }
  }, [open, fetchProducers]);

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
