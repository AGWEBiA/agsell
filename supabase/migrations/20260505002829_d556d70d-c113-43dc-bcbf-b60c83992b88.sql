-- Ativar a extensão pg_cron se não estiver ativada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar o processamento da fila a cada 1 minuto
SELECT cron.schedule(
    'process-wa-sync-queue-cron',
    '* * * * *',
    'SELECT net.http_post(
        url := (SELECT value FROM platform_settings WHERE key = ''supabase_url'' LIMIT 1) || ''/functions/v1/process-wa-sync-queue'',
        headers := jsonb_build_object(
            ''Content-Type'', ''application/json'',
            ''Authorization'', ''Bearer '' || (SELECT value FROM platform_settings WHERE key = ''supabase_service_role_key'' LIMIT 1)
        ),
        body := ''{}''
    )'
);
