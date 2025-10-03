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

interface OrderShippedEmailProps {
  orderId: string;
  buyerName: string;
  awbNumber?: string;
  carrier?: string;
  trackingUrl?: string;
}

export function Subject(data: OrderShippedEmailProps): string {
  return `Comanda ta a fost expediată - #${data.orderId.slice(-8).toUpperCase()}`;
}

export function TextContent(data: OrderShippedEmailProps): string {
  return `Salut ${data.buyerName},

Comanda ta #${data.orderId.slice(-8).toUpperCase()} a fost expediată și este în drum spre tine.

${data.awbNumber ? `Număr AWB: ${data.awbNumber}` : ''}
${data.carrier ? `Curier: ${data.carrier}` : ''}

${data.trackingUrl ? `Poți urmări livrarea la: ${data.trackingUrl}` : ''}

Comanda ar trebui să ajungă la tine în următoarele zile.

Cu stimă,
Echipa Pots.ro`;
}

export function HtmlContent(data: OrderShippedEmailProps): React.ReactElement {
  const previewText = `Comanda ta #${data.orderId.slice(-8)} a fost expediată!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://floristmarket.ro/logo.png"
              width="120"
              height="40"
              alt="Pots.ro"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>Comanda ta a fost expediată! 📦</Heading>
          
          <Text style={text}>
            Salut {data.buyerName},
          </Text>
          
          <Text style={text}>
            Vestea bună! Comanda ta <strong>#{data.orderId.slice(-8).toUpperCase()}</strong> a fost expediată și este în drum spre tine.
          </Text>
          
          {(data.awbNumber || data.carrier) && (
            <Section style={shippingDetails}>
              <Text style={detailLabel}>Informații livrare:</Text>
              {data.awbNumber && (
                <Text style={detailValue}>
                  Număr AWB: <strong>{data.awbNumber}</strong>
                </Text>
              )}
              {data.carrier && (
                <Text style={detailValue}>
                  Curier: <strong>{data.carrier}</strong>
                </Text>
              )}
            </Section>
          )}
          
          {data.trackingUrl && (
            <Section style={trackingSection}>
              <Text style={text}>
                Poți urmări livrarea:
              </Text>
              <Link href={data.trackingUrl} style={button}>
                Urmărește livrarea
              </Link>
            </Section>
          )}
          
          <Text style={text}>
            Comanda ar trebui să ajungă la tine în următoarele zile. Îți vom notifica când va fi livrată.
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

export const OrderShippedEmail = HtmlContent;

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
  margin: '32px 0',
  textAlign: 'center' as const,
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
  lineHeight: '26px',
  margin: '16px 0',
};

const shippingDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const detailLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const detailValue = {
  color: '#333',
  fontSize: '16px',
  margin: '4px 0',
};

const trackingSection = {
  backgroundColor: '#e8f5e8',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
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
  margin: '8px 0',
  minWidth: '44px',
  minHeight: '44px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0 0',
  textAlign: 'center' as const,
};