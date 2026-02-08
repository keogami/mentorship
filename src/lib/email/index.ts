export type { EmailMessage } from "./client"
export { sendBulkEmails, sendEmail } from "./client"
export {
  type MentorAlertData,
  mentorAlertEmail,
} from "./templates/mentor-alert"
export {
  type MentorBlockNoticeData,
  mentorBlockNoticeEmail,
} from "./templates/mentor-block-notice"
export {
  type MentorCancelledUserData,
  mentorCancelledUserEmail,
} from "./templates/mentor-cancelled-user"
export {
  type SubscriptionActivatedData,
  subscriptionActivatedEmail,
} from "./templates/subscription-activated"
export {
  type SubscriptionCancelledData,
  subscriptionCancelledEmail,
} from "./templates/subscription-cancelled"
