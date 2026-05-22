import { getContacts } from '../../lib/crm'
import ContactsList from '../contacts-list'
import AddContactModal from './add-contact-modal'

export default async function ContactsPage() {
  const contacts = await getContacts()
  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Contacts</div>
          <div className="page-sub">{contacts.length} people in your network</div>
        </div>
        <AddContactModal />
      </div>
      <ContactsList contacts={contacts} showAll />
    </>
  )
}
