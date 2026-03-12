import { User } from "../types";

const APPROVAL_NOTIFICATION_PREFIX = "approval-notified";

export function isApproved(user: Partial<User> | null | undefined): boolean {
  if (!user) return false;
  if (typeof user.is_approved === "boolean") return user.is_approved;

  const status = String(user.approval_status || user.status || "").toLowerCase();
  if (!status) return true;
  return ["approved", "active", "verified"].includes(status);
}

export function isProfileComplete(user: Partial<User> | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.name?.trim() &&
    user.email?.trim() &&
    user.phone?.trim() &&
    user.address?.trim() &&
    (user.contactPerson || user.contact_person)?.trim() &&
    (user.businessName || user.business_name)?.trim()
  );
}

export function approvalNotificationKey(user: Partial<User> | null | undefined): string {
  const id = user?.id || user?.email || "anonymous";
  return `${APPROVAL_NOTIFICATION_PREFIX}:${id}`;
}

export async function notifyApproval(user: Partial<User>) {
  const key = approvalNotificationKey(user);
  if (localStorage.getItem(key) === "1") return;

  const showInAppFallback = () => {
    alert("Your account has been approved. Please complete your profile details to continue.");
  };

  if (!("Notification" in window)) {
    showInAppFallback();
    localStorage.setItem(key, "1");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Account approved", {
      body: "Your account is approved. Please complete your profile details to proceed.",
    });
    localStorage.setItem(key, "1");
    return;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("Account approved", {
        body: "Your account is approved. Please complete your profile details to proceed.",
      });
      localStorage.setItem(key, "1");
      return;
    }
  }

  showInAppFallback();
  localStorage.setItem(key, "1");
}
