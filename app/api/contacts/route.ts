import { getContacts } from '../../../lib/data'

export async function GET() {
  const contacts = await getContacts()
  return Response.json(contacts)
}
