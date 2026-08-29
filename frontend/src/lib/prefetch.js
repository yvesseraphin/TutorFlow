import { api } from "./api";

/**
 * Pre-fetches and caches all key student data into localStorage
 * so all pages (Dashboard, Classroom, Profile, Notifications) load instantly with 0ms delay.
 */
export async function prefetchUserData() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const results = await Promise.allSettled([
      api("/auth/me"),
      api("/profile"),
      api("/analytics/dashboard"),
      api("/analytics/notifications"),
      api("/curriculum"),
    ]);

    const [meRes, profileRes, analyticsRes, notifsRes, currRes] = results;

    if (meRes.status === "fulfilled" && meRes.value) {
      localStorage.setItem("user", JSON.stringify(meRes.value));
    }
    if (profileRes.status === "fulfilled" && profileRes.value) {
      localStorage.setItem("tutorflow_cached_profile", JSON.stringify(profileRes.value));
    }
    if (analyticsRes.status === "fulfilled" && analyticsRes.value) {
      localStorage.setItem("tutorflow_cached_analytics", JSON.stringify(analyticsRes.value));
    }
    if (notifsRes.status === "fulfilled" && notifsRes.value?.notifications) {
      localStorage.setItem("tutorflow_cached_notifications", JSON.stringify(notifsRes.value.notifications));
    }
    if (currRes.status === "fulfilled" && currRes.value?.courses) {
      localStorage.setItem("tutorflow_cached_curriculum", JSON.stringify(currRes.value));
    }

    return {
      user: meRes.status === "fulfilled" ? meRes.value : null,
      profile: profileRes.status === "fulfilled" ? profileRes.value : null,
      analytics: analyticsRes.status === "fulfilled" ? analyticsRes.value : null,
      notifications: notifsRes.status === "fulfilled" ? notifsRes.value?.notifications : null,
      curriculum: currRes.status === "fulfilled" ? currRes.value : null,
    };
  } catch (err) {
    console.warn("Background prefetch error:", err);
    return null;
  }
}
