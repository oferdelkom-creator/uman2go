-- Small-volume MVP: fenced, compressed application snapshots. Service role only.
CREATE TABLE IF NOT EXISTS public.uman_bot_state (
 id integer PRIMARY KEY CHECK(id=1), revision bigint NOT NULL DEFAULT 0,
 snapshot text NOT NULL DEFAULT '', previous_snapshot text NOT NULL DEFAULT '',
 holder uuid, lease_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uman_bot_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.uman_bot_state FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.uman_bot_state TO service_role;
INSERT INTO public.uman_bot_state(id) VALUES(1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.uman_bot_acquire(owner_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.uman_bot_state;
BEGIN
 UPDATE public.uman_bot_state SET holder=owner_id,lease_until=now()+interval '120 seconds'
 WHERE id=1 AND (holder IS NULL OR lease_until<now()) RETURNING * INTO s;
 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('revision',s.revision,'snapshot',s.snapshot);
END $$;
CREATE OR REPLACE FUNCTION public.uman_bot_save(owner_id uuid, expected_revision bigint, new_snapshot text) RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE r bigint;
BEGIN
 IF length(new_snapshot)>5000000 THEN RAISE EXCEPTION 'State capacity exceeded'; END IF;
 UPDATE public.uman_bot_state SET previous_snapshot=snapshot,snapshot=new_snapshot,
 revision=revision+1,updated_at=now()
 WHERE id=1 AND holder=owner_id AND lease_until>now() AND revision=expected_revision RETURNING revision INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'State lease lost'; END IF;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.uman_bot_release(owner_id uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 UPDATE public.uman_bot_state SET holder=NULL,lease_until=NULL WHERE id=1 AND holder=owner_id;
$$;
REVOKE ALL ON FUNCTION public.uman_bot_acquire(uuid), public.uman_bot_save(uuid,bigint,text), public.uman_bot_release(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.uman_bot_acquire(uuid), public.uman_bot_save(uuid,bigint,text), public.uman_bot_release(uuid) TO service_role;

