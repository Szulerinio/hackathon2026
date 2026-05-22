import { getContacts } from '../../../lib/data'

export async function GET() {
  const contacts = getContacts()
  return Response.json(contacts)
}
