import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MessageCreatedEmailProps {
  senderName: string;
  recipientName: string;
  orderId: string;
  messagePreview: string;
  conversationUrl: string;
}

export function Subject(data: MessageCreatedEmailProps): string {
  return `Mesaj nou de la ${data.senderName} - Comanda #${data.orderId.slice(-8).toUpperCase()}`;
}

export function TextContent(data: MessageCreatedEmailProps): string {
  return `Salut ${data.recipientName},

Ai primit un mesaj nou de la ${data.senderName} despre comanda #${data.orderId.slice(-8).toUpperCase()}.

Preview mesaj: "${data.messagePreview.length > 100 ? data.messagePreview.substring(0, 100) + '...' : data.messagePreview}"

${data.conversationUrl ? `Poți vedea și răspunde la mesaj la: ${data.conversationUrl}` : ''}

Acest mesaj a fost trimis prin sistemul nostru securizat de mesagerie. Te rugăm să răspunzi prin platformă pentru a menține securitatea.

Cu stimă,
Echipa Pots.ro`;
}

export const MessageCreatedEmail = ({
  senderName,
  recipientName,
  orderId,
  messagePreview,
  conversationUrl,
}: MessageCreatedEmailProps) => {
  const previewText = `Mesaj nou de la ${senderName} despre comanda #${orderId.slice(-8)}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://pots.ro/logo.png"
              width="120"
              height="40"
              alt="Pots.ro"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>Mesaj nou primit</Heading>
          
          <Text style={text}>
            Salut {recipientName},
          </Text>
          
          <Text style={text}>
            Ai primit un mesaj nou de la <strong>{senderName}</strong> despre comanda <strong>#{orderId.slice(-8).toUpperCase()}</strong>.
          </Text>
          
          <Section style={messageSection}>
            <Text style={messageLabel}>Preview mesaj:</Text>
            <Text style={messagePreviewStyle}>
              "{messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}"
            </Text>
          </Section>
          
          <Section style={actionSection}>
            <Text style={text}>
              Apasă mai jos pentru a vedea și răspunde la mesaj:
            </Text>
            <Link href={conversationUrl} style={button}>
              Vezi conversația
            </Link>
          </Section>
          
          <Text style={text}>
            Acest mesaj a fost trimis prin sistemul nostru securizat de mesagerie. Te rugăm să răspunzi prin platformă pentru a menține securitatea.
          </Text>
          
          <Text style={footer}>
            Cu stimă,<br />
            Echipa Pots.ro
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

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

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const messageSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const messageLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const messagePreviewStyle = {
  color: '#333',
  fontSize: '16px',
  fontStyle: 'italic',
  margin: '0',
};

const actionSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0 0',
};
