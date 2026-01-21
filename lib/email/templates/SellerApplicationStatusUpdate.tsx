import * as React from 'react';
import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';
import type { SellerApplicationStatus } from '@/lib/seller/seller-application-status';

export function getSellerApplicationStatusUpdateSubject(status: SellerApplicationStatus): string {
  switch (status) {
    case 'in_review':
      return 'Aplicația ta este în review';
    case 'need_info':
      return 'Avem nevoie de informații suplimentare';
    case 'rejected':
      return 'Aplicația ta a fost respinsă';
    case 'approved':
      return 'Aplicația ta a fost aprobată';
    case 'received':
    default:
      return 'Actualizare aplicație vânzător';
  }
}

function statusTitle(status: SellerApplicationStatus): string {
  switch (status) {
    case 'in_review':
      return 'În review';
    case 'need_info':
      return 'Informații suplimentare necesare';
    case 'rejected':
      return 'Respinsă';
    case 'approved':
      return 'Aprobată';
    case 'received':
    default:
      return 'Primită';
  }
}

export interface SellerApplicationStatusUpdateEmailProps {
  contactName?: string | null;
  companyName: string;
  status: SellerApplicationStatus;
  adminMessage?: string | null;
  helpUrl: string;
}

export function SellerApplicationStatusUpdateEmail({
  contactName,
  companyName,
  status,
  adminMessage,
  helpUrl,
}: SellerApplicationStatusUpdateEmailProps) {
  const preview = `Status aplicație: ${statusTitle(status)}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Text style={h1}>Actualizare aplicație vânzător</Text>
            <Text style={text}>Salut {contactName || companyName},</Text>
            <Text style={text}>
              Aplicația ta pentru <strong>{companyName}</strong> are acum statusul: <strong>{statusTitle(status)}</strong>.
            </Text>

            {adminMessage ? (
              <Section style={{ ...section, backgroundColor: '#F8FAFC' }}>
                <Text style={{ ...text, marginBottom: 8 }}>Mesaj de la echipa noastră:</Text>
                <Text style={{ ...text, whiteSpace: 'pre-wrap' }}>{adminMessage}</Text>
              </Section>
            ) : null}

            {status === 'need_info' ? (
              <Text style={text}>
                Te rugăm să ne trimiți informațiile cerute (răspunzând la acest email) pentru a putea continua procesarea.
              </Text>
            ) : null}

            <Hr style={hr} />

            <Text style={small}>
              Ai nevoie de ajutor? Vizitează centrul de suport.
            </Text>
            <Button style={button} href={helpUrl}>
              Deschide centrul de suport
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: '#F6F9FC',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '24px 12px',
};

const section: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 24,
};

const h1: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 12px',
  color: '#0F172A',
};

const text: React.CSSProperties = {
  fontSize: 14,
  lineHeight: '20px',
  margin: '0 0 12px',
  color: '#0F172A',
};

const small: React.CSSProperties = {
  fontSize: 12,
  lineHeight: '18px',
  margin: '0 0 12px',
  color: '#475569',
};

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#0EA5E9',
  color: '#FFFFFF',
  borderRadius: 10,
  padding: '10px 14px',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
};

const hr: React.CSSProperties = {
  borderColor: '#E2E8F0',
  margin: '16px 0',
};

export default SellerApplicationStatusUpdateEmail;
