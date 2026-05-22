export const CONTACT_TYPES: Record<string, 'seller' | 'buyer' | 'both'> = {
  'Beata Mazur': 'both',
  'Marek Kowalski': 'buyer',
  'Szymon Kaczmarek': 'buyer',
  'Ewa Szymańska': 'buyer',
  'Anna Krajewska': 'buyer',
  'Paweł Adamczyk': 'buyer',
  'Stefan Fischer': 'buyer',
  'Agnieszka Lis': 'seller',
  'Karolina Wiśniewska': 'seller',
  'Marcin Duda': 'buyer',
  'Joanna Krawczyk': 'buyer',
}

export interface Listing {
  id: string
  address: string
  price: string
  sellerName: string
  status: 'active' | 'sold' | 'withdrawn'
  daysOnMarket: number
}

export const LISTINGS: Listing[] = [
  {
    id: 'l1',
    address: 'ul. Sienkiewicza 12/4, Kraków',
    price: '850 000 PLN',
    sellerName: 'Beata Mazur',
    status: 'active',
    daysOnMarket: 45,
  },
  {
    id: 'l2',
    address: 'ul. Lipowa 33/2, Kraków',
    price: '560 000 PLN',
    sellerName: 'Agnieszka Lis',
    status: 'active',
    daysOnMarket: 23,
  },
  {
    id: 'l3',
    address: 'ul. Długa 7/3, Kraków',
    price: '620 000 PLN',
    sellerName: 'Karolina Wiśniewska',
    status: 'active',
    daysOnMarket: 12,
  },
  {
    id: 'l4',
    address: 'ul. Kazimierza Wielkiego 5, Kraków',
    price: '1 200 000 PLN',
    sellerName: 'Janusz Wiśniewski',
    status: 'active',
    daysOnMarket: 8,
  },
  {
    id: 'l5',
    address: 'ul. Bronowicka 44/1, Kraków',
    price: '430 000 PLN',
    sellerName: 'Marta Jabłońska',
    status: 'sold',
    daysOnMarket: 91,
  },
  {
    id: 'l6',
    address: 'ul. Podchorążych 3, Kraków',
    price: '780 000 PLN',
    sellerName: 'Henryk Dąbrowski',
    status: 'withdrawn',
    daysOnMarket: 67,
  },
  {
    id: 'l7',
    address: 'ul. Starowiślna 22/8, Kraków',
    price: '495 000 PLN',
    sellerName: 'Tomasz Wierzbicki',
    status: 'active',
    daysOnMarket: 31,
  },
]

export interface Deal {
  id: string
  buyerName: string
  propertyAddress: string
  status: 'viewing' | 'offer' | 'negotiation' | 'closed' | 'lost'
  value: string
  lastActivityDate: string
}

export const DEALS: Deal[] = [
  {
    id: 'd1',
    buyerName: 'Marek Kowalski',
    propertyAddress: 'ul. Dietla 18/7, Kraków',
    status: 'offer',
    value: '420 000 PLN',
    lastActivityDate: '2026-05-20',
  },
  {
    id: 'd2',
    buyerName: 'Ewa Szymańska',
    propertyAddress: 'ul. Kazimierza Wielkiego 5, Kraków',
    status: 'negotiation',
    value: '600 000 PLN',
    lastActivityDate: '2026-05-18',
  },
  {
    id: 'd3',
    buyerName: 'Anna Krajewska',
    propertyAddress: 'ul. Piłsudskiego 22/3, Kraków',
    status: 'viewing',
    value: '1 200 000 PLN',
    lastActivityDate: '2026-05-21',
  },
  {
    id: 'd4',
    buyerName: 'Szymon Kaczmarek',
    propertyAddress: 'ul. Starowiślna 12/4, Kraków',
    status: 'viewing',
    value: '380 000 PLN',
    lastActivityDate: '2026-05-15',
  },
  {
    id: 'd5',
    buyerName: 'Beata Mazur',
    propertyAddress: 'ul. Kościuszki 8/2, Kraków',
    status: 'closed',
    value: '490 000 PLN',
    lastActivityDate: '2026-04-30',
  },
]

export interface Alert {
  id: string
  contactName: string
  reason: string
  actionLabel: string
  createdAt: string
}

export const ALERTS: Alert[] = [
  {
    id: 'a1',
    contactName: 'Anna Krajewska',
    reason: 'Waiting for CEO apartment shortlist since last week. Mentioned tight deadline — needs 3 options by Friday.',
    actionLabel: 'Follow up',
    createdAt: '2026-05-22',
  },
  {
    id: 'a2',
    contactName: 'Marek Kowalski',
    reason: 'Viewing scheduled today — bring rental yield comparison sheet for the Dietla apartment.',
    actionLabel: 'Prepare',
    createdAt: '2026-05-22',
  },
  {
    id: 'a3',
    contactName: 'Piotr Zieliński',
    reason: 'Has been hinting at formalizing the referral arrangement for months. You keep avoiding it.',
    actionLabel: 'Call',
    createdAt: '2026-05-21',
  },
  {
    id: 'a4',
    contactName: 'Beata Mazur',
    reason: 'Parking spot land registry check still pending after 40 days. She asked twice already.',
    actionLabel: 'Follow up',
    createdAt: '2026-05-20',
  },
  {
    id: 'a5',
    contactName: 'Damian Krawczyk',
    reason: 'Invoice for Kowalczyk job from February still unpaid. 28 days overdue.',
    actionLabel: 'Call',
    createdAt: '2026-05-19',
  },
]
