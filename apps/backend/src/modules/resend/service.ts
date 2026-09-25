import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import type { Logger } from "@medusajs/framework/types";
import type {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import { Resend } from "resend";

type ResendOptions = {
  api_key: string;
  from: string;
};

type InjectedDependencies = {
  logger: Logger;
};

/**
 * Email channel for Medusa's notification module, sending through Resend.
 *
 * This is the project's first real email provider — before it, the
 * notification module only ever ran Medusa's default log-only
 * `notification-local` provider on the admin `feed` channel (see
 * medusa-config.ts, which keeps that one registered alongside this).
 *
 * Callers pass the fully rendered email in `content` (subject/html/text) —
 * this provider does no templating of its own. An optional reply-to
 * address can be passed as `provider_data.reply_to`, which is how the
 * contact form makes "Reply" in the admin's inbox go to the customer.
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  protected client_: Resend;
  protected options_: ResendOptions;
  protected logger_: Logger;

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.client_ = new Resend(options.api_key);
    this.options_ = options;
    this.logger_ = logger;
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider: `api_key` is required."
      );
    }

    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider: `from` is required."
      );
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const subject = notification.content?.subject;
    const html = notification.content?.html;
    const text = notification.content?.text;

    if (!subject || (!html && !text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Resend notification provider: template "${notification.template}" was sent without content.subject and content.html/text — this provider doesn't render templates itself.`
      );
    }

    const replyTo = notification.provider_data?.reply_to;

    // Resend's SDK reports API failures in `error` rather than throwing —
    // rethrow so the notification module marks the notification as failed
    // and the caller finds out, instead of it being silently logged as sent.
    const { data, error } = await this.client_.emails.send({
      from: notification.from || this.options_.from,
      to: notification.to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(typeof replyTo === "string" && replyTo ? { replyTo } : {}),
    } as Parameters<Resend["emails"]["send"]>[0]);

    if (error || !data) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend rejected the email: ${error?.message ?? "no response data"}`
      );
    }

    return { id: data.id };
  }
}

export default ResendNotificationProviderService;
