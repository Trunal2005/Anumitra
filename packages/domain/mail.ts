import nodemailer from "nodemailer";
export function transport() {
  const host = process.env.SMTP_HOST ?? "127.0.0.1";
  if (!["127.0.0.1", "localhost", "mailpit"].includes(host))
    throw new Error(
      "Only the local Mailpit sink is supported. External relay is disabled.",
    );
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    connectionTimeout: 4000,
    socketTimeout: 5000,
  });
}
