// Webhook service deprecated. Use Admin Module.
export default async function handler(_req: any, res: any) {
  return res.status(200).send('Ingest service deprecated.');
}