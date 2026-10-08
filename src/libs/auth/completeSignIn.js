export async function completeSignIn({ supabase, session }) {
  
 const userId = session.user.id;
 const userEmail = session.user.email;
 const { data: userData } = await supabase
  .from('users')
  .select('id, onboarding_completed, has_access, preferred_platform')
  .eq('id', userId)
  .single();

if (!userData) {
  const now = new Date();
  
  await supabase.from('users').insert({
    id: userId,
    email: userEmail,
    name: userEmail.split('@')[0],
    avatar_index: Math.floor(4 * Math.random()),
    has_access: false,
    subscription_status: 'free',
    onboarding_completed: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });
}
 if (userData && (userData.onboarding_completed !== false || userData.preferred_platform)) {
 return '/animations';
 }
 return '/welcome';
}
