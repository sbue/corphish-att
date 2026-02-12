/** @type {import('next').NextConfig} */
const serverExternalPackages = Array.from(
  new Set([
    '@corphish/api',
    '@corphish/config',
    '@nestjs/*',
    '@mastra/*',
    '@grpc/*',
    'nats',
    'mqtt',
    'amqplib',
    'amqp-connection-manager',
  ]),
)

const nextConfig = {
  transpilePackages: ['@corphish/ui'],
  output: 'standalone',
  serverExternalPackages,
}

export default nextConfig
