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
 * Order Status Update Email Template - Chunk 10 Implementation
 * 
 * Following Context7 best practices:
 * - Dynamic status-based content
 * - Progress tracking visualization
 * - Clear next steps guidance
 * - Mobile-responsive design
 * - Consistent brand experience
 */

interface OrderStatusUpdateEmailProps {
  orderNumber: string
  customerName: string
  status?: string
  fulfillmentType: 'DELIVERY' | 'PICKUP'
  address?: string
  estimatedTime?: string
  trackingUrl?: string
  bakeryName: string
}

export const OrderStatusUpdateEmail = ({
  orderNumber,
  customerName,
  status = 'CONFIRMED',
  fulfillmentType,
  address,
  estimatedTime,
  trackingUrl,
  bakeryName
}: OrderStatusUpdateEmailProps) => {
  
  const getStatusInfo = (currentStatus: string) => {
    const statusMap = {
      CONFIRMED: {
        title: 'Order Confirmed! 🎉',
        message: 'Great news! We\'ve confirmed your order and our bakers are getting ready to work their magic.',
        icon: '✅',
        color: '#28a745',
        nextStep: 'We\'ll start preparing your treats shortly and keep you updated!'
      },
      PREPARING: {
        title: 'We\'re Baking Your Order! 👨‍🍳',
        message: 'Our skilled bakers are hard at work preparing your delicious treats with care and attention.',
        icon: '🧁',
        color: '#fd7e14',
        nextStep: 'Your order will be ready soon. We\'ll notify you when it\'s complete!'
      },
      READY: {
        title: 'Your Order is Ready! 🎉',
        message: fulfillmentType === 'PICKUP' 
          ? 'Perfect timing! Your order is ready for pickup at our bakery.'
          : 'Excellent! Your order is ready and will be delivered soon.',
        icon: '📦',
        color: '#20c997',
        nextStep: fulfillmentType === 'PICKUP'
          ? 'Please come by our bakery to collect your treats!'
          : 'Our delivery team will be with you shortly!'
      },
      DELIVERED: {
        title: 'Order Delivered Successfully! ✅',
        message: 'We hope you enjoy your delicious treats! Thank you for choosing us.',
        icon: '🚚',
        color: '#198754',
        nextStep: 'We\'d love to hear about your experience. Consider leaving us a review!'
      },
      CANCELLED: {
        title: 'Order Cancelled 😔',
        message: 'We\'re sorry, but your order has been cancelled. If this was unexpected, please contact us.',
        icon: '❌',
        color: '#dc3545',
        nextStep: 'If you have any questions, please don\'t hesitate to reach out to our support team.'
      }
    }
    
    return statusMap[currentStatus as keyof typeof statusMap] || statusMap.CONFIRMED
  }

  const statusInfo = getStatusInfo(status)

  const getProgressSteps = () => {
    const steps = [
      { name: 'Confirmed', status: 'CONFIRMED' },
      { name: 'Preparing', status: 'PREPARING' },
      { name: 'Ready', status: 'READY' },
      { name: fulfillmentType === 'DELIVERY' ? 'Delivered' : 'Picked Up', status: 'DELIVERED' }
    ]

    const currentIndex = steps.findIndex(step => step.status === status)
    
    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex
    }))
  }

  const progressSteps = getProgressSteps()

  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} update: {statusInfo.title}</Preview>
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
            <Section style={{...statusHeader, backgroundColor: statusInfo.color}}>
              <Text style={statusIcon}>{statusInfo.icon}</Text>
              <Heading style={h1}>{statusInfo.title}</Heading>
            </Section>
            
            <Text style={text}>
              Hi {customerName},
            </Text>
            
            <Text style={text}>
              {statusInfo.message}
            </Text>

            {/* Order Details */}
            <Section style={orderBox}>
              <Row>
                <Column>
                  <Text style={orderLabel}>Order Number</Text>
                  <Text style={orderValue}>#{orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={orderLabel}>Status</Text>
                  <Text style={{...orderValue, color: statusInfo.color}}>
                    {statusInfo.icon} {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Text>
                </Column>
              </Row>
              
              {(address || estimatedTime) && (
                <>
                  <Hr style={divider} />
                  <Row>
                    {address && fulfillmentType === 'DELIVERY' && (
                      <Column>
                        <Text style={orderLabel}>Delivery Address</Text>
                        <Text style={addressText}>{address}</Text>
                      </Column>
                    )}
                    {estimatedTime && (
                      <Column>
                        <Text style={orderLabel}>
                          {fulfillmentType === 'DELIVERY' ? 'Delivery Time' : 'Pickup Time'}
                        </Text>
                        <Text style={orderValue}>{estimatedTime}</Text>
                      </Column>
                    )}
                  </Row>
                </>
              )}
            </Section>

            {/* Progress Tracker */}
            <Text style={sectionTitle}>Order Progress:</Text>
            <Section style={progressSection}>
              {progressSteps.map((step, index) => (
                <Row key={index} style={progressStep}>
                  <Column style={progressIconCol}>
                    <Text style={{
                      ...progressDot,
                      backgroundColor: step.isActive ? statusInfo.color : '#e9ecef',
                      color: step.isActive ? '#ffffff' : '#6c757d'
                    }}>
                      {step.isActive ? '✓' : (index + 1)}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={{
                      ...progressText,
                      color: step.isCurrent ? statusInfo.color : (step.isActive ? '#1a1a1a' : '#6c757d'),
                      fontWeight: step.isCurrent ? '600' : '400'
                    }}>
                      {step.name}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Next Steps */}
            <Section style={nextStepsSection}>
              <Text style={nextStepTitle}>What's Next?</Text>
              <Text style={nextStepText}>{statusInfo.nextStep}</Text>
            </Section>

            {/* Action Buttons */}
            <Row style={buttonRow}>
              <Column>
                <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderNumber}`} style={button}>
                  View Order Details
                </Button>
              </Column>
              {trackingUrl && (
                <Column>
                  <Button href={trackingUrl} style={{...button, backgroundColor: '#6c757d'}}>
                    Track Delivery
                  </Button>
                </Column>
              )}
            </Row>

            <Text style={text}>
              Have questions about your order? We&apos;re here to help! Contact our support team anytime.
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

const statusHeader = {
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const statusIcon = {
  fontSize: '32px',
  margin: '0 0 8px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '0',
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

const progressSection = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
}

const progressStep = {
  margin: '8px 0',
}

const progressIconCol = {
  width: '40px',
}

const progressDot = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  fontSize: '12px',
  fontWeight: '600',
  textAlign: 'center' as const,
  lineHeight: '24px',
  margin: '0',
}

const progressText = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  paddingLeft: '12px',
}

const nextStepsSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const nextStepTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const nextStepText = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const buttonRow = {
  margin: '24px 0',
}

const button = {
  backgroundColor: '#e67e22',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '8px 8px 8px 0',
}

const divider = {
  borderColor: '#e9ecef',
  margin: '16px 0',
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

export default OrderStatusUpdateEmail