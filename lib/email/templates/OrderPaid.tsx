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

interface OrderPaidEmailProps {
  orderId: string;
  buyerName: string;
  total: number;
  currency: string;
  invoiceUrl?: string;
}

export function Subject(data: OrderPaidEmailProps): string {
  return `Comanda ta a fost plătită - #${data.orderId.slice(-8).toUpperCase()}`;
}

export function TextContent(data: OrderPaidEmailProps): string {
  return `Salut ${data.buyerName},

Comanda ta #${data.orderId.slice(-8).toUpperCase()} a fost confirmată și plata a fost primită.

Total: ${new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: data.currency,
  }).format(data.total / 100)}

${data.invoiceUrl ? `Factura este disponibilă la: ${data.invoiceUrl}` : ''}

Îți vom notifica când comanda va fi pregătită și expediată.

Mulțumim că ai ales Pots.ro!

Echipa Pots.ro`;
}

export function HtmlContent(data: OrderPaidEmailProps): React.ReactElement {
  const previewText = `Comanda ta #${data.orderId.slice(-8)} a fost confirmată și plata a fost primită.`;

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
          
          <Heading style={h1}>Comanda ta a fost plătită! 🎉</Heading>
          
          <Text style={text}>
            Salut {data.buyerName},
          </Text>
          
          <Text style={text}>
            Vestea bună! Comanda ta <strong>#{data.orderId.slice(-8).toUpperCase()}</strong> a fost confirmată și plata a fost primită.
          </Text>
          
          <Section style={orderDetails}>
            <Text style={detailLabel}>Total comandă:</Text>
            <Text style={detailValue}>
              {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: data.currency,
              }).format(data.total / 100)}
            </Text>
          </Section>
          
          {data.invoiceUrl && (
            <Section style={invoiceSection}>
              <Text style={text}>
                Factura ta este gata pentru descărcare:
              </Text>
              <Link href={data.invoiceUrl} style={button}>
                Descarcă factura
              </Link>
              <Text style={textSmall}>
                Factura este atașată ca PDF.
              </Text>
            </Section>
          )}
          
          <Text style={text}>
            Îți vom notifica când comanda va fi pregătită și expediată. Mulțumim că ai ales Pots.ro!
          </Text>
          
          <Text style={footer}>
            Cu stimă,<br />
            Echipa Pots.ro
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const OrderPaidEmail = HtmlContent;

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

const textSmall = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const orderDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const detailLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const invoiceSection = {
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