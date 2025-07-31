import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface MagicLinkEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const MagicLinkEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => {
  const isSignup = email_action_type === "signup";
  const magicLinkUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

  return (
    <Html>
      <Head />
      <Preview>{isSignup ? "Welcome to CCMD - Confirm your account" : "Sign in to CCMD"}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>CCMD</Text>
          </Section>
          
          <Heading style={h1}>
            {isSignup ? "Welcome to CCMD" : "Sign in to your account"}
          </Heading>
          
          <Text style={text}>
            {isSignup 
              ? "Thank you for signing up! Click the button below to confirm your account and get started."
              : "Click the button below to sign in to your CCMD account."
            }
          </Text>

          <Section style={buttonSection}>
            <Link href={magicLinkUrl} style={button}>
              {isSignup ? "Confirm Account" : "Sign In"}
            </Link>
          </Section>

          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{magicLinkUrl}</Text>

          <Hr style={hr} />

          <Text style={footerText}>
            If you didn't request this email, you can safely ignore it.
          </Text>
          
          <Text style={footer}>
            This email was sent by CCMD. If you have any questions, please contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const logoSection = {
  padding: "32px 32px 0",
};

const logoText = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 32px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 16px",
  padding: "0 32px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
  padding: "0 32px",
  margin: "0 0 16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1f2937",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
};

const linkText = {
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center" as const,
  padding: "0 32px",
  wordBreak: "break-all" as const,
  margin: "0 0 32px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center" as const,
  padding: "0 32px",
  margin: "0 0 16px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  padding: "0 32px",
  margin: "0",
};