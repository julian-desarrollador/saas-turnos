import type { NoticeKind } from "@/modules/notifications/domain/notices";

export type NoticeDraft = {
  kind: NoticeKind;
  sendAt: Date;
  idempotencyKey: string;
};

export type DueNotice = {
  id: string;
  tenantId: string;
  phone: string;
  businessName: string;
  localDate: string;
  localTime: string;
  serviceName: string;
  businessPhone: string;
  kind: NoticeKind;
};

export type NoticeStore = {
  replacePending(input: {
    tenantId: string;
    appointmentId: string;
    phone: string;
    businessName: string;
    localDate: string;
    localTime: string;
    serviceName: string;
    rows: NoticeDraft[];
  }): Promise<void>;
  cancelPending(tenantId: string, appointmentId: string): Promise<void>;
  listTenantIds(): Promise<string[]>;
  quota(tenantId: string): Promise<{ cap: number; timeZone: string }>;
  listDue(tenantId: string, now: Date): Promise<DueNotice[]>;
  claim(tenantId: string, id: string): Promise<boolean>;
  markRetry(tenantId: string, id: string): Promise<void>;
  countSent(tenantId: string, from: Date, to: Date): Promise<number>;
};

export type MessageSender = {
  send(input: {
    toPhone: string;
    kind: NoticeKind;
    businessName: string;
    localDate: string;
    localTime: string;
    serviceName: string;
    businessPhone: string;
  }): Promise<{ providerMessageId: string }>;
};
