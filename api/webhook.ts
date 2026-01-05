
// Webhook deprecated. Use Admin Panel Manual Ingest.
export default async function handler(_req: any, res: any) {
  return res.status(200).send('Webhook service deprecated.');
}
