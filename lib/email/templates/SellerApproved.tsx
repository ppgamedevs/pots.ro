import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface SellerApprovedEmailProps {
  contactName?: string | null;
  companyName: string;
  onboardingUrl: string;
  dashboardUrl: string;
}

export const getSellerApprovedSubject = () => 'Cont aprobat - începe onboarding-ul';

export const SellerApprovedEmail = ({
  contactName,
  companyName,
  onboardingUrl,
  dashboardUrl,
}: SellerApprovedEmailProps) => {
  const greetingName = (contactName || companyName || '').trim();

  return (
    <Html>
      <Head />
      <Preview>Contul tău de vânzător a fost aprobat</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Cont aprobat</Heading>

          <Text style={text}>Salut {greetingName},</Text>

          <Text style={text}>
            Aplicația ta pentru <strong>{companyName}</strong> a fost aprobată. Poți începe imediat onboarding-ul și apoi să
            gestionezi comenzile.
          </Text>

          <Section style={buttonContainer}>
            <Link href={onboardingUrl} style={button}>
              Începe onboarding-ul
            </Link>
          </Section>

          <Text style={text}>
            Dacă ai completat deja onboarding-ul, poți merge direct în panoul de vânzător:
          </Text>

          <Section style={buttonContainerSecondary}>
            <Link href={dashboardUrl} style={buttonSecondary}>
              Mergi la comenzi
            </Link>
          </Section>

          <Text style={footer}>
            Cu respect,
            <br />
            Echipa FloristMarket
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SellerApprovedEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 16px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
};

const buttonContainer = {
  padding: '20px 0 8px',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 18px',
};

const buttonContainerSecondary = {
  padding: '10px 0 27px',
};

const buttonSecondary = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '10px 16px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  textAlign: 'left' as const,
};
