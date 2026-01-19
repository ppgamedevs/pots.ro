/**
 * Sync GDPR preferences from localStorage to database after user login
 */
export async function syncGdprPreferencesFromLocalStorage(): Promise<void> {
  try {
    // Check if there's a preference in localStorage
    const localChoice = localStorage.getItem("fm_cookie_choice");
    
    if (!localChoice || (localChoice !== "necessary" && localChoice !== "all")) {
      // No valid preference in localStorage
      return;
    }

    // Save to database
    const response = await fetch("/api/gdpr/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ consentType: localChoice }),
    });

    if (!response.ok) {
      console.error("Failed to sync GDPR preferences to database");
    }
  } catch (error) {
    console.error("Error syncing GDPR preferences:", error);
    // Don't throw - GDPR sync failure shouldn't block login
  }
}
