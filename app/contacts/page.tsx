import { getContacts } from '../../lib/data'
import ContactsList from '../contacts-list'

export default async function ContactsPage() {
  const contacts = getContacts()
  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Contacts</div>
          <div className="page-sub">{contacts.length} people in your network</div>
        </div>
      </div>
      <ContactsList contacts={contacts} showAll />
    </>
  )
}
