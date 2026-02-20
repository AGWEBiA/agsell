

## Atribuição Automática + CSAT — ✅ Concluído

### O que foi implementado:

1. **Tabelas no banco de dados:**
   - `assignment_rules` — regras de atribuição automática (round robin, menos ocupado, manual)
   - `assignment_state` — estado de atribuição para round-robin
   - `csat_surveys` — configuração de pesquisas de satisfação
   - `csat_responses` — respostas individuais com rating 1-5
   - Campo `assigned_to` adicionado à tabela `conversations`

2. **Hooks:**
   - `useAssignmentRules` — CRUD de regras + atribuição de conversas
   - `useCsat` — CRUD de pesquisas + métricas (nota média, taxa de satisfação)

3. **Componentes e páginas:**
   - `AssignmentRulesConfig` — UI para criar/gerenciar regras de atribuição
   - `CsatConfig` — Dashboard CSAT com métricas + gestão de pesquisas
   - `InboxSettings` — Página com abas (Atribuição + CSAT) em `/inbox-settings`
   - Seletor de atribuição integrado no header do chat do Inbox

4. **Navegação:**
   - Rota `/inbox-settings` adicionada
   - Item "Config. SAC" no sidebar

### Próximas etapas pendentes:
- Automação de Instagram (DMs, comentários, stories)
- WhatsApp Flows (formulários interativos)
