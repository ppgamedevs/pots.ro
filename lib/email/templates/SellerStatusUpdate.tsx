import * as React from 'react';
import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';

export type SellerAccountStatus = 'active' | 'suspended' | 'onboarding';

export function getSellerStatusUpdateSubject(status: SellerAccountStatus): string {
  switch (status) {
    case 'suspended':
      return 'Contul tău de vânzător a fost suspendat';
    case 'active':
      return 'Contul tău de vânzător este activ';
    case 'onboarding':
      return 'Contul tău de vânzător este în onboarding';
    default:
      return 'Actualizare cont vânzător';
  }
}

function statusTitle(status: SellerAccountStatus): string {
  switch (status) {
    case 'suspended':
      return 'Suspendat';
    case 'active':
      return 'Activ';
    case 'onboarding':
      return 'Onboarding';
    default:
      return 'Actualizat';
  }
}

export interface SellerStatusUpdateEmailProps {
  contactName?: string | null;
  companyName: string;
  status: SellerAccountStatus;
  adminMessage?: string | null;
  helpUrl: string;
}

export function SellerStatusUpdateEmail({
  contactName,
  companyName,
  status,
  adminMessage,
  helpUrl,
}: SellerStatusUpdateEmailProps) {
  const preview = `Status cont vânzător: ${statusTitle(status)}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Text style={h1}>Actualizare cont vânzător</Text>
            <Text style={text}>Salut {contactName || companyName},</Text>
            <Text style={text}>
              Contul pentru <strong>{companyName}</strong> are acum statusul: <strong>{statusTitle(status)}</strong>.
            </Text>

            {adminMessage ? (
              <Section style={{ ...section, backgroundColor: '#F8FAFC' }}>
                <Text style={{ ...text, marginBottom: 8 }}>Mesaj de la echipa noastră:</Text>
                <Text style={{ ...text, whiteSpace: 'pre-wrap' }}>{adminMessage}</Text>
              </Section>
            ) : null}

            <Hr style={hr} />

            <Text style={small}>Ai nevoie de ajutor? Vizitează centrul de suport.</Text>
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
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
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

export default SellerStatusUpdateEmail;
