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

interface OrderDeliveredEmailProps {
  orderId: string;
  buyerName: string;
  reviewUrl?: string;
}

export function Subject(data: OrderDeliveredEmailProps): string {
  return `Comanda ta a fost livrată - #${data.orderId.slice(-8).toUpperCase()}`;
}

export function TextContent(data: OrderDeliveredEmailProps): string {
  return `Salut ${data.buyerName},

Comanda ta #${data.orderId.slice(-8).toUpperCase()} a fost livrată cu succes.

${data.reviewUrl ? `Poți lăsa o recenzie la: ${data.reviewUrl}` : ''}

Sperăm că îți plac produsele! Dacă ai întrebări sau probleme cu comanda, nu ezita să ne contactezi.

Mulțumim că ai ales FloristMarket.ro!

Echipa FloristMarket.ro`;
}

export const OrderDeliveredEmail = ({
  orderId,
  buyerName,
  reviewUrl,
}: OrderDeliveredEmailProps) => {
  const previewText = `Comanda ta #${orderId.slice(-8)} a fost livrată!`;

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
          
          <Heading style={h1}>Comanda ta a fost livrată! 📦</Heading>
          
          <Text style={text}>
            Salut {buyerName},
          </Text>
          
          <Text style={text}>
            Vestea bună! Comanda ta <strong>#{orderId.slice(-8).toUpperCase()}</strong> a fost livrată cu succes.
          </Text>
          
          <Section style={deliverySection}>
            <Text style={text}>
              Sperăm că îți plac produsele! Dacă totul arată bine, te rugăm să confirmi livrarea.
            </Text>
            
            {reviewUrl && (
              <Section style={reviewSection}>
                <Text style={text}>
                  Ne-ar plăcea să auzim despre experiența ta:
                </Text>
                <Link href={reviewUrl} style={button}>
                  Lasă o recenzie
                </Link>
              </Section>
            )}
          </Section>
          
          <Text style={text}>
            Dacă ai întrebări sau probleme cu comanda, nu ezita să ne contactezi.
          </Text>
          
          <Text style={footer}>
            Mulțumim că ai ales FloristMarket.ro!<br />
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

const deliverySection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const reviewSection = {
  textAlign: 'center' as const,
  margin: '24px 0 0 0',
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
