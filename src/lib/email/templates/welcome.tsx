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
} from '@react-email/components'

/**
 * Welcome Email Template - Chunk 10 Implementation
 * 
 * Following Context7 best practices:
 * - Mobile-responsive design
 * - Clear hierarchy and typography
 * - Professional bakery branding
 * - Actionable call-to-action
 * - Accessible color contrast
 */

interface WelcomeEmailProps {
  name: string
  bakeryName: string
}

export const WelcomeEmail = ({ name, bakeryName }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {bakeryName}! Your sweet journey begins here 🍰</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
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
          <Heading style={h1}>Welcome to {bakeryName}! 🍰</Heading>
          
          <Text style={text}>
            Hi {name},
          </Text>
          
          <Text style={text}>
            Thank you for joining {bakeryName}! We&apos;re excited to have you as part of our sweet family. 
            We specialize in freshly baked goods made with love and the finest ingredients.
          </Text>

          <Text style={text}>
            Here's what you can expect from us:
          </Text>

          <Section style={features}>
            <Text style={featureItem}>🧁 Fresh daily baked goods</Text>
            <Text style={featureItem}>🚚 Convenient delivery and pickup options</Text>
            <Text style={featureItem}>📱 Easy online ordering</Text>
            <Text style={featureItem}>💝 Special occasion custom orders</Text>
          </Section>

          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/products`} style={button}>
            Start Shopping Now
          </Button>

          <Text style={text}>
            Have questions? We&apos;re here to help! Feel free to reach out to us anytime.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Follow us on social media for daily treats and special offers:<br />
            <a href="#" style={link}>Instagram</a> • <a href="#" style={link}>Facebook</a> • <a href="#" style={link}>Twitter</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles following Context7 responsive email best practices
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  margin: '0 auto',
  padding: '0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const logoSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  display: 'block',
}

const content = {
  padding: '0 40px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '36px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const features = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
}

const featureItem = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
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

export default WelcomeEmail