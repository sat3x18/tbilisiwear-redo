import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1";
import * as React from "https://esm.sh/react@18.3.1";

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail = ({ resetLink }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Tbilisi Wear password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>TBILISI WEAR</Text>
        </Section>
        
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          We received a request to reset your password for your Tbilisi Wear account.
          Click the button below to create a new password.
        </Text>
        
        <Section style={buttonSection}>
          <Button style={button} href={resetLink}>
            Reset Password
          </Button>
        </Section>
        
        <Text style={text}>
          This link will expire in 1 hour. If you didn't request a password reset,
          you can safely ignore this email.
        </Text>
        
        <Section style={divider} />
        
        <Text style={footer}>
          If you're having trouble clicking the button, copy and paste this URL into your browser:
        </Text>
        <Text style={linkText}>{resetLink}</Text>
        
        <Section style={divider} />
        
        <Text style={footerBrand}>
          © {new Date().getFullYear()} Tbilisi Wear. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "4px",
  color: "#18181b",
  margin: "0",
};

const h1 = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#52525b",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const divider = {
  borderTop: "1px solid #e4e4e7",
  margin: "32px 0",
};

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "0 0 8px",
};

const linkText = {
  color: "#71717a",
  fontSize: "11px",
  lineHeight: "18px",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
  margin: "0 0 24px",
};

const footerBrand = {
  color: "#a1a1aa",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};
