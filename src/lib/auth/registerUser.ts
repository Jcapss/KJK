import { supabase } from "../supabase";

type RegisterUserInput = {
  fullName: string;
  email: string;
  password: string;
};

export async function registerUser({
  fullName,
  email,
  password,
}: RegisterUserInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  const user = data.user;
  if (!user) {
    throw new Error("Signup succeeded but no user was returned.");
  }

  return {
    user,
    message: "Account created. Please wait for admin approval.",
  };
}