import { getContact } from '../../../../lib/crm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contact = await getContact(id)
  if (!contact) return new Response('Not found', { status: 404 })
  return Response.json(contact)
}
