import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth - only admins
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: callerUser.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create_user': {
        const { email, password, name, role, organization_id, org_role } = params;

        if (!email || !password || !name) {
          return new Response(
            JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user via admin API
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, full_name: name },
        });

        if (createError) {
          return new Response(
            JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userId = newUser.user.id;

        // Assign app_role if specified (admin, moderator, user)
        if (role) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role });

          if (roleError) {
            console.error('Error assigning role:', roleError);
          }
        }

        // Add to organization if specified
        if (organization_id && org_role) {
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              user_id: userId,
              organization_id,
              role: org_role,
              invited_by: callerUser.id,
            });

          if (memberError) {
            console.error('Error adding to organization:', memberError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, user: { id: userId, email } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'list_users': {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
          perPage: 100,
        });

        if (listError) {
          return new Response(
            JSON.stringify({ error: listError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get roles for all users
        const { data: allRoles } = await supabase
          .from('user_roles')
          .select('user_id, role');

        // Get org memberships
        const { data: allMembers } = await supabase
          .from('organization_members')
          .select('user_id, organization_id, role, organizations(name)');

        const enrichedUsers = users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.name || u.user_metadata?.full_name || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          roles: allRoles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
          organizations: allMembers?.filter((m) => m.user_id === u.id).map((m) => ({
            id: m.organization_id,
            name: (m as any).organizations?.name || '',
            role: m.role,
          })) || [],
        }));

        return new Response(
          JSON.stringify({ users: enrichedUsers }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'update_role': {
        const { user_id, role: newRole, remove } = params;

        if (!user_id || !newRole) {
          return new Response(
            JSON.stringify({ error: "user_id e role são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (remove) {
          const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user_id)
            .eq('role', newRole);

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          const { error } = await supabase
            .from('user_roles')
            .upsert({ user_id, role: newRole }, { onConflict: 'user_id,role' });

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'update_user': {
        const { user_id, email: newEmail, name: newName } = params;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (newEmail) updateData.email = newEmail;
        if (newName) updateData.user_metadata = { name: newName, full_name: newName };

        const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, updateData);
        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Also update profile name if changed
        if (newName) {
          await supabase.from('profiles').update({ full_name: newName }).eq('user_id', user_id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'add_to_organization': {
        const { user_id, organization_id, org_role } = params;

        if (!user_id || !organization_id || !org_role) {
          return new Response(
            JSON.stringify({ error: "user_id, organization_id e org_role são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id,
            organization_id,
            role: org_role,
            invited_by: callerUser.id,
          });

        if (memberError) {
          return new Response(
            JSON.stringify({ error: memberError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'remove_from_organization': {
        const { user_id, organization_id } = params;

        if (!user_id || !organization_id) {
          return new Response(
            JSON.stringify({ error: "user_id e organization_id são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: removeError } = await supabase
          .from('organization_members')
          .delete()
          .eq('user_id', user_id)
          .eq('organization_id', organization_id);

        if (removeError) {
          return new Response(
            JSON.stringify({ error: removeError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'delete_user': {
        const { user_id } = params;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-deletion
        if (user_id === callerUser.id) {
          return new Response(
            JSON.stringify({ error: "Você não pode excluir sua própria conta por aqui" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error in admin-manage-users:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
