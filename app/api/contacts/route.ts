import { getContacts } from '../../../lib/crm'

export async function GET() {
  const contacts = await getContacts()
  return Response.json(contacts)
}
