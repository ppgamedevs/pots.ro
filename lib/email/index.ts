import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { db } from '@/db';
import { emailEvents } from '@/db/schema/core';
import { ReactElement } from 'react';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private resend?: Resend;
  private transporter?: nodemailer.Transporter;
  private provider: string;

  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend';
    
    if (this.provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
      }
    } else if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, subject, template, attachments } = options;
    
    try {
      // Render React email template to HTML
      const html = await render(template);
      
      let result: any;
      
      if (this.provider === 'resend' && this.resend) {
        result = await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'Pots.ro <no-reply@pots.ro>',
          to,
          subject,
          html,
          attachments: attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });
      } else if (this.provider === 'smtp' && this.transporter) {
        result = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Pots.ro <no-reply@pots.ro>',
          to,
          subject,
          html,
          attachments: attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });
      } else {
        throw new Error('No email provider configured');
      }

      return {
        success: true,
        messageId: result.messageId || result.id,
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendEmailWithRetry(
    options: SendEmailOptions,
    maxRetries: number = 3
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendEmail(options);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: lastError || 'Max retries exceeded',
    };
  }

  async logEmailEvent(
    type: 'order_paid' | 'order_shipped' | 'order_delivered' | 'message_created',
    toEmail: string,
    status: 'sent' | 'retry' | 'failed',
    meta?: any,
    error?: string
  ): Promise<void> {
    await db.insert(emailEvents).values({
      type,
      toEmail,
      meta,
      status,
      error,
    });
  }
}

export const emailService = new EmailService();
