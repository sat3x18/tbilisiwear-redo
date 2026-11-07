import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Detects auth recovery parameters in the URL and redirects to /reset-password
 * This handles cases where the backend redirects to / with recovery params
 */
const AuthCallbackRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip if we're already on reset-password
    if (location.pathname === "/reset-password") {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));

    // PKCE code flow
    const code = searchParams.get("code");

    // Some providers may put recovery params in either search or hash
    const type = hashParams.get("type") || searchParams.get("type");
    const accessToken =
      hashParams.get("access_token") || searchParams.get("access_token");
    
    // Token hash flow (new approach - avoids hash fragments being stripped)
    const tokenHash = searchParams.get("token_hash");

    // If we have any recovery indicators, route to /reset-password
    if (code || type === "recovery" || accessToken || tokenHash) {
      const redirectUrl = `/reset-password${location.search}${location.hash}`;
      navigate(redirectUrl, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default AuthCallbackRedirect;
