export function friendlyAuthError(error) {
  if (!error) return "Something went wrong. Please try again.";
  const msg = (error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Incorrect email or password. Please check and try again.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }
  if (msg.includes("password should be at least") || msg.includes("password is too short")) {
    return "Password is too short. Use at least 6 characters.";
  }
  if (msg.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (msg.includes("expired")) {
    return "This link has expired. Please request a new one.";
  }
  if (msg.includes("user not found")) {
    return "No account found with this email.";
  }

  return error.message || "Something went wrong. Please try again.";
}
