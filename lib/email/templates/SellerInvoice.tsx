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

interface SellerInvoiceEmailProps {
  orderId: string;
  buyerName: string;
  invoiceNumber?: string;
  invoiceUrl: string;
  sellerName: string;
}

export const SellerInvoiceEmail = ({
  orderId,
  buyerName,
  invoiceNumber,
  invoiceUrl,
  sellerName,
}: SellerInvoiceEmailProps) => {
  const shortOrderId = orderId.slice(-8).toUpperCase();

  return (
    <Html>
      <Head />
      <Preview>Factura pentru comanda #{shortOrderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Factura pentru comanda #{shortOrderId}</Heading>
          
          <Text style={text}>
            Salut {buyerName},
          </Text>

          <Text style={text}>
            Vânzătorul <strong>{sellerName}</strong> a emis factura pentru comanda ta #{shortOrderId}.
            {invoiceNumber && (
              <>
                {' '}Numărul facturii: <strong>{invoiceNumber}</strong>
              </>
            )}
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={invoiceUrl}
              style={button}
            >
              Descarcă factura (PDF)
            </Link>
          </Section>

          <Text style={text}>
            Factura este disponibilă și în contul tău, în secțiunea "Comenzile mele".
          </Text>

          <Text style={footer}>
            Cu respect,<br />
            Echipa FloristMarket
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SellerInvoiceEmail;

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
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  textAlign: 'left' as const,
};
