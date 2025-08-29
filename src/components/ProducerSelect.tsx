import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface ProducerSelectProps {
  value?: string; // producer id
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noneLabel?: string;
  allowNone?: boolean;
}

interface Option {
  value: string;
  label: string;
}

const PAGE_SIZE = 50;

export default function ProducerSelect({
  value,
  onChange,
  placeholder = "Select producer...",
  disabled,
  allowNone = false,
  noneLabel = "None",
}: ProducerSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  const like = useMemo(() => (search.trim() ? `%${search.trim()}%` : "%"), [search]);

  const fetchPage = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const from = reset ? 0 : page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await supabase
          .from("producers")
          .select("id,name", { count: "exact" })
          .ilike("name", like)
          .order("name")
          .range(from, to);
        if (error) throw error;
        const newOptions = (data || []).map((p) => ({ value: p.id as string, label: p.name as string }));
        setOptions((prev) => (reset ? newOptions : [...prev, ...newOptions]));
        const loaded = (reset ? 0 : options.length) + newOptions.length;
        setHasMore((count || 0) > loaded);
        if (reset) setPage(1);
        else setPage((p) => p + 1);
      } catch (e) {
        // silent fail; UI will show empty
      } finally {
        loadingRef.current = false;
      }
    },
    [like, page, options.length]
  );

  // Ensure current value is present for display
  useEffect(() => {
    const ensureCurrentValue = async () => {
      if (!value) return;
      if (options.find((o) => o.value === value)) return;
      const { data } = await supabase
        .from("producers")
        .select("id,name")
        .eq("id", value)
        .single();
      if (data) setOptions((prev) => [{ value: data.id as string, label: data.name as string }, ...prev]);
    };
    ensureCurrentValue();
  }, [value, options]);

  // Load when opened
  useEffect(() => {
    if (open) {
      setPage(0);
      setHasMore(true);
      fetchPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle search
  const handleSearchChange = useCallback(
    (term: string) => {
      setSearch(term);
      setPage(0);
      setHasMore(true);
      fetchPage(true);
    },
    [fetchPage]
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && open) fetchPage(false);
  }, [hasMore, open, fetchPage]);

  return (
    <SearchableSelect
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search producers..."
      disabled={disabled}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onOpenChange={setOpen}
      onSearchChange={handleSearchChange}
      onLoadMore={handleLoadMore}
    />
  );
}
