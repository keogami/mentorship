export { sendEmail, sendBulkEmails } from "./client";
export type { EmailMessage } from "./client";

export {
  subscriptionActivatedEmail,
  type SubscriptionActivatedData,
} from "./templates/subscription-activated";

export {
  subscriptionCancelledEmail,
  type SubscriptionCancelledData,
} from "./templates/subscription-cancelled";

export {
  mentorBlockNoticeEmail,
  type MentorBlockNoticeData,
} from "./templates/mentor-block-notice";

export {
  mentorCancelledUserEmail,
  type MentorCancelledUserData,
} from "./templates/mentor-cancelled-user";
