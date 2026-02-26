// src/utils/createAdminUser.ts
import { supabase } from '../lib/supabase'; // Adjust path if needed
export async function createAdminUser() {
    try {
        // Create the admin user in Supabase Authentication
        const { data, error } = await supabase.auth.signUp({
            email: 'admin@example.com', // Use a non-Gmail address for testing
            password: 'SecureAdmin123!', // Stronger password for testing
        });
        if (error) {
            console.error('Error creating admin:', error.message);
            return;
        }
        console.log('Admin user created successfully:', data.user);
        // Now, update the role to 'admin' in the 'users' table
        const { data: updateData, error: updateError } = await supabase
            .from('users') // Ensure the table name is 'users'
            .update({ role: 'admin' })
            .eq('id', data.user?.id); // Use the ID returned by the auth API
        if (updateError) {
            console.error('Error updating role:', updateError.message);
        }
        else {
            console.log('Admin role assigned:', updateData);
        }
    }
    catch (err) {
        console.error('Unexpected error:', err);
    }
}
