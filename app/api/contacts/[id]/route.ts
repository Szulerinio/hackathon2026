import { getContact } from '../../../../lib/data'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contact = getContact(id)
  if (!contact) return new Response('Not found', { status: 404 })
  return Response.json(contact)
}
