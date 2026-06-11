import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ContactInput } from "@/lib/contact-schema";

type ContactEmailProps = Omit<ContactInput, "website">;

export function ContactEmail({ name, email, budget, projectType, message }: ContactEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${name}: ${projectType}, ${budget}`}</Preview>
      <Body style={{ backgroundColor: "#f4f4f7", fontFamily: "system-ui, sans-serif" }}>
        <Container
          style={{
            margin: "32px auto",
            maxWidth: "560px",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            padding: "32px",
          }}
        >
          <Heading as="h2" style={{ margin: 0, fontSize: "20px", color: "#0a0a1a" }}>
            New project inquiry
          </Heading>
          <Section style={{ marginTop: "20px" }}>
            <Text style={rowStyle}>
              <strong>Name:</strong> {name}
            </Text>
            <Text style={rowStyle}>
              <strong>Email:</strong> {email}
            </Text>
            <Text style={rowStyle}>
              <strong>Project type:</strong> {projectType}
            </Text>
            <Text style={rowStyle}>
              <strong>Budget:</strong> {budget}
            </Text>
          </Section>
          <Hr style={{ borderColor: "#e4e4ec", margin: "20px 0" }} />
          <Text style={{ ...rowStyle, whiteSpace: "pre-wrap" }}>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const rowStyle = {
  margin: "0 0 8px",
  fontSize: "14px",
  lineHeight: "22px",
  color: "#33334d",
} as const;
