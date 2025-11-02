import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let sdk: NodeSDK | null = null;

export async function initTelemetry() {
  if (sdk || process.env.ENABLE_TELEMETRY !== 'true') {
    return;
  }

  const instrumentations = [getNodeAutoInstrumentations()];
  const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const traceExporter = exporterEndpoint
    ? new OTLPTraceExporter({ url: exporterEndpoint })
    : undefined;

  sdk = new NodeSDK({
    traceExporter,
    instrumentations,
  });

  await sdk.start();
  console.log('Telemetry initialized');
}

export async function shutdownTelemetry() {
  if (!sdk) {
    return;
  }
  await sdk.shutdown();
  sdk = null;
}
