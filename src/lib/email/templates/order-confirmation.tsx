import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components'

/**
 * Order Confirmation Email Template - Chunk 10 Implementation
 * 
 * Following Context7 best practices:
 * - Comprehensive order details
 * - Clear visual hierarchy
 * - Mobile-responsive layout
 * - Professional transactional design
 * - Actionable next steps
 */

interface OrderConfirmationEmailProps {
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  fulfillmentType: 'DELIVERY' | 'PICKUP'
  address?: string
  estimatedTime?: string
  bakeryName: string
}

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  items,
  total,
  fulfillmentType,
  address,
  estimatedTime,
  bakeryName
}: OrderConfirmationEmailProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} confirmed! We&apos;re preparing your delicious treats 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={logoSection}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`}
              width="120"
              height="40"
              alt={`${bakeryName} Logo`}
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Thank you for your order! 🎉</Heading>
            
            <Text style={text}>
              Hi {customerName},
            </Text>
            
            <Text style={text}>
              We&apos;ve received your order and we&apos;re getting it ready! Here are the details:
            </Text>

            {/* Order Details Box */}
            <Section style={orderBox}>
              <Row>
                <Column>
                  <Text style={orderLabel}>Order Number</Text>
                  <Text style={orderValue}>#{orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={orderLabel}>Order Total</Text>
                  <Text style={orderValue}>{formatCurrency(total)}</Text>
                </Column>
              </Row>
              
              <Hr style={divider} />
              
              <Row>
                <Column>
                  <Text style={orderLabel}>Fulfillment</Text>
                  <Text style={orderValue}>
                    {fulfillmentType === 'DELIVERY' ? '🚚 Delivery' : '📦 Pickup'}
                  </Text>
                  {address && fulfillmentType === 'DELIVERY' && (
                    <Text style={addressText}>{address}</Text>
                  )}
                </Column>
                {estimatedTime && (
                  <Column>
                    <Text style={orderLabel}>Estimated Time</Text>
                    <Text style={orderValue}>{estimatedTime}</Text>
                  </Column>
                )}
              </Row>
            </Section>

            {/* Order Items */}
            <Text style={sectionTitle}>Your Order Items:</Text>
            <Section style={itemsSection}>
              {items.map((item, index) => (
                <Row key={index} style={itemRow}>
                  <Column style={itemDetails}>
                    <Text style={itemName}>{item.name}</Text>
                    <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={itemPrice}>
                    <Text style={itemPriceText}>{formatCurrency(item.price * item.quantity)}</Text>
                  </Column>
                </Row>
              ))}
              
              <Hr style={divider} />
              
              <Row style={totalRow}>
                <Column>
                  <Text style={totalLabel}>Total</Text>
                </Column>
                <Column>
                  <Text style={totalAmount}>{formatCurrency(total)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Next Steps */}
            <Section style={nextStepsSection}>
              <Text style={sectionTitle}>What happens next?</Text>
              <Text style={stepText}>
                ✨ Our bakers are preparing your fresh treats<br />
                📧 We'll send you updates as your order progresses<br />
                {fulfillmentType === 'DELIVERY' 
                  ? '🚚 Your order will be delivered to your address'
                  : '📦 We\'ll notify you when your order is ready for pickup'
                }
              </Text>
            </Section>

            {/* Action Button */}
            <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderNumber}`} style={button}>
              Track Your Order
            </Button>

            <Text style={text}>
              Questions about your order? Feel free to contact us - we're here to help!
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Thank you for choosing {bakeryName}!<br />
              For support, visit our <a href={`${process.env.NEXT_PUBLIC_APP_URL}/contact`} style={link}>contact page</a> or reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles following Context7 responsive email best practices
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  margin: '0 auto',
  padding: '0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  margin: '40px auto',
  padding: '20px',
  maxWidth: '600px',
}

const logoSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  display: 'block',
}

const content = {
  padding: '0 20px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const orderBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const orderLabel = {
  color: '#6c757d',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}

const orderValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const addressText = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0 0',
}

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '32px 0 16px',
}

const itemsSection = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}

const itemRow = {
  padding: '8px 0',
}

const itemDetails = {
  width: '70%',
}

const itemName = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px',
}

const itemQuantity = {
  color: '#6c757d',
  fontSize: '14px',
  margin: '0',
}

const itemPrice = {
  width: '30%',
  textAlign: 'right' as const,
}

const itemPriceText = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
}

const divider = {
  borderColor: '#e9ecef',
  margin: '16px 0',
}

const totalRow = {
  padding: '8px 0',
}

const totalLabel = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
}

const totalAmount = {
  color: '#e67e22',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
  textAlign: 'right' as const,
}

const nextStepsSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const stepText = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
}

const button = {
  backgroundColor: '#e67e22',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '24px 0',
  width: '100%',
  maxWidth: '250px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center' as const,
}

const link = {
  color: '#e67e22',
  textDecoration: 'none',
}

export default OrderConfirmationEmail