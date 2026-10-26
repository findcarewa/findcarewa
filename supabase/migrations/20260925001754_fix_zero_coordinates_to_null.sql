UPDATE public.resources
SET lat = NULL, lng = NULL, updated_at = NOW()
WHERE lat = 0 AND lng = 0;